import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SystemMetrics } from '../types/zyconomes';
import { Activity, ShieldCheck, Zap, ArrowRight, ArrowDown, ArrowUp, AlertTriangle, Fingerprint, Network, ShieldX, TrendingDown, Download } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Order {
  id: string;
  idempotency_key: string;
  asset: string;
  side: 'BUY' | 'SELL';
  qty: number;
  price: number;
  status: 'PENDING' | 'EXECUTED' | 'REJECTED';
  timestamp: string;
}

export const TradingTerminalView: React.FC<{ metrics: SystemMetrics }> = ({ metrics }) => {
  // --- Immutability & Double-Entry Ledger State ---
  const [balance, setBalance] = useState(500000.00);
  const [position, setPosition] = useState(0);
  const [avgEntryPrice, setAvgEntryPrice] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Execution State
  const [activeIntent, setActiveIntent] = useState<'BUY' | 'SELL' | null>(null);
  const [intentKey, setIntentKey] = useState<string>('');
  const [qtyInput, setQtyInput] = useState<string>('100');
  const [isArming, setIsArming] = useState(false);
  const [networkJitter, setNetworkJitter] = useState(false);
  
  // Security & Export State
  const [circuitBreakerTripped, setCircuitBreakerTripped] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [terminalNotice, setTerminalNotice] = useState<string | null>(null);
  const MAX_DRAWDOWN = -15000.00; 

  // --- High-Frequency Tick Simulation ---
  const priceRef = useRef<HTMLDivElement>(null);
  const spreadRef = useRef<HTMLDivElement>(null);
  const pnlRef = useRef<HTMLDivElement>(null);
  
  const lastPrice = useRef(145230.50);
  const isHealthy = useRef(true);

  const posRef = useRef(position);
  const entryRef = useRef(avgEntryPrice);
  const cbTrippedRef = useRef(circuitBreakerTripped);

  useEffect(() => { posRef.current = position; }, [position]);
  useEffect(() => { entryRef.current = avgEntryPrice; }, [avgEntryPrice]);
  useEffect(() => { cbTrippedRef.current = circuitBreakerTripped; }, [circuitBreakerTripped]);

  useEffect(() => {
    let animationFrameId: number;
    let lastTick = performance.now();

    const renderTick = (time: number) => {
      if (time - lastTick > 50 && isHealthy.current) {
        const volatility = (Math.random() - 0.5) * 45;
        lastPrice.current = Math.max(0, lastPrice.current + volatility);
        
        if (priceRef.current) {
          const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lastPrice.current);
          priceRef.current.innerText = formatted;
          priceRef.current.className = `text-4xl font-bold tracking-tighter font-mono ${volatility >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'}`;
        }
        if (spreadRef.current) {
          const spread = Math.abs(volatility).toFixed(2);
          spreadRef.current.innerText = `SPREAD: ${spread} BPS`;
        }
        
        const currentPos = posRef.current;
        if (currentPos !== 0) {
          const currentEntry = entryRef.current;
          const unrealized = currentPos * (lastPrice.current - currentEntry);
          
          if (pnlRef.current) {
            const formattedPnl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(unrealized);
            pnlRef.current.innerText = formattedPnl;
            pnlRef.current.className = `text-2xl font-bold tracking-tighter font-mono ${unrealized >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'}`;
          }

          if (unrealized <= MAX_DRAWDOWN && !cbTrippedRef.current) {
            setCircuitBreakerTripped(true);
            setActiveIntent(null);
          }
        } else if (pnlRef.current) {
           pnlRef.current.innerText = "R$ 0,00";
           pnlRef.current.className = "text-2xl font-bold tracking-tighter font-mono text-gray-400";
        }
        lastTick = time;
      }
      animationFrameId = requestAnimationFrame(renderTick);
    };

    animationFrameId = requestAnimationFrame(renderTick);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleExportAudit = async () => {
    if (isExporting) return;
    setIsExporting(true);
    
    try {
      const response = await fetch('/api/v1/reports/ledger', {
        headers: { 'x-correlation-id': uuidv4() }
      });
      
      if (response.status === 409) {
         setTerminalNotice('Exportação bloqueada. Um processo de extração já está em andamento para a sua sessão.');
         setTimeout(() => setTerminalNotice(null), 4000);
         return;
      }
      if (!response.ok) throw new Error('Falha no Backend');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Zyconomes_Ledger_Audit.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      setTerminalNotice('Falha crítica de I/O ao extrair o relatório.');
      setTimeout(() => setTerminalNotice(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  const armExecution = (side: 'BUY' | 'SELL') => {
    if (circuitBreakerTripped && ((side === 'BUY' && position >= 0) || (side === 'SELL' && position <= 0))) return; 
    setActiveIntent(side);
    setIntentKey(uuidv4());
    setIsArming(true);
    setTimeout(() => setIsArming(false), 300);
  };

  const executeOrder = () => {
    if (isArming || !activeIntent || !intentKey) return;
    const qty = parseInt(qtyInput, 10);
    if (isNaN(qty) || qty <= 0) return;

    const price = lastPrice.current;
    const totalValue = qty * price;

    if (activeIntent === 'BUY' && balance < totalValue) {
      addRejectedOrder('INSUFFICIENT_FUNDS', qty, price);
      return;
    }

    if (networkJitter) {
      submitOrderToBackend(qty, price, activeIntent, intentKey);
      setTimeout(() => submitOrderToBackend(qty, price, activeIntent, intentKey), 150);
    } else {
      submitOrderToBackend(qty, price, activeIntent, intentKey);
    }

    setActiveIntent(null);
    setIntentKey('');
  };

  const submitOrderToBackend = useCallback((qty: number, price: number, side: 'BUY' | 'SELL', idempotency_key: string) => {
    setOrders(prev => {
      if (prev.some(o => o.idempotency_key === idempotency_key)) return prev;

      const newOrder: Order = {
        id: `ord_${Math.random().toString(36).substr(2, 6)}`,
        idempotency_key,
        asset: 'IBOV_FUT',
        side,
        qty,
        price,
        status: 'EXECUTED',
        timestamp: new Date().toISOString()
      };

      setPosition(currentPos => {
        const newPos = side === 'BUY' ? currentPos + qty : currentPos - qty;
        setAvgEntryPrice(currentAvg => {
          if (currentPos === 0) return price;
          if (newPos === 0) return 0;
          if ((currentPos > 0 && side === 'BUY') || (currentPos < 0 && side === 'SELL')) {
            const currentTotalValue = Math.abs(currentPos) * currentAvg;
            const newValue = qty * price;
            return (currentTotalValue + newValue) / Math.abs(newPos);
          }
          return currentAvg;
        });
        return newPos;
      });

      setBalance(b => side === 'BUY' ? b - (qty * price) : b + (qty * price));
      return [newOrder, ...prev].slice(0, 50);
    });
  }, []);

  const addRejectedOrder = (reason: string, qty: number, price: number) => {
    const rej: Order = {
      id: `ord_rej_${Math.random().toString(36).substr(2, 6)}`,
      idempotency_key: intentKey,
      asset: 'IBOV_FUT',
      side: activeIntent!,
      qty,
      price,
      status: 'REJECTED',
      timestamp: new Date().toISOString()
    };
    setOrders(prev => [rej, ...prev].slice(0, 50));
    setActiveIntent(null);
  };

  const marginRequired = Math.abs(position * 25000);
  const leverage = balance > 0 ? ((Math.abs(position) * lastPrice.current) / balance).toFixed(2) : "0.00";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans h-full bg-[#F8F9FA] p-6 text-[#0A1628]">
      
      {/* LEFT COLUMN: Market Data & Execution Engine */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Tick Buffer Box */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6 relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Activity className="w-24 h-24 text-[#0A1628]" />
          </div>
          <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest mb-6 flex justify-between items-center">
            <span>Ambiente de Negociação Qualificado</span>
            <span className="text-[#059669] flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse"></span> CONECTADO</span>
          </div>
          
          <div ref={priceRef} className="text-4xl font-bold tracking-tighter text-[#0A1628] font-mono">---</div>
          <div ref={spreadRef} className="text-[11px] text-gray-400 font-medium tracking-widest mt-2">SPREAD: ---</div>
        </div>

        {/* Notice Banner */}
        {terminalNotice && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex-shrink-0 text-amber-800 text-xs font-semibold">
            {terminalNotice}
          </div>
        )}

        {/* Capital Circuit Breaker Alert */}
        {circuitBreakerTripped && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-5 animate-pulse flex-shrink-0">
            <div className="flex items-center gap-2 text-[#DC2626] font-bold uppercase tracking-widest mb-2 text-sm">
              <ShieldX className="w-5 h-5" /> MAX DRAWDOWN VIOLATED
            </div>
            <div className="text-xs text-red-700 font-medium leading-relaxed">
              HARD LOCK ATIVO. NOVAS EXPOSIÇÕES REJEITADAS PELA TESOURARIA. APENAS LIQUIDAÇÃO PERMITIDA.
            </div>
          </div>
        )}

        {/* Execution Console */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6 flex-1 flex flex-col">
          <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest mb-6 border-b border-gray-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#C9A84C]" />
              <span>Motor de Execução Atômica</span>
            </div>
            {circuitBreakerTripped && <span className="text-[#DC2626] font-bold px-2 py-1 bg-red-50 rounded-sm">LOCKED</span>}
          </div>

          <div className="mb-6">
            <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest block mb-2">Quantidade (Lotes)</label>
            <input 
              type="number" 
              value={qtyInput}
              onChange={e => setQtyInput(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-4 py-3 text-[#0A1628] font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 focus:border-[#C9A84C] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
             <button 
              onClick={() => armExecution('BUY')}
              disabled={circuitBreakerTripped && position >= 0}
              className={`p-4 font-bold text-xs tracking-widest rounded-md transition-all ${activeIntent === 'BUY' ? 'bg-[#059669] text-white shadow-lg shadow-emerald-500/30' : 'bg-gray-50 text-[#059669] hover:bg-emerald-50 border border-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed'}`}
             >
               {circuitBreakerTripped && position < 0 ? 'LIQUIDAR (BUY)' : 'ARM BUY'}
             </button>
             <button 
              onClick={() => armExecution('SELL')}
              disabled={circuitBreakerTripped && position <= 0}
              className={`p-4 font-bold text-xs tracking-widest rounded-md transition-all ${activeIntent === 'SELL' ? 'bg-[#DC2626] text-white shadow-lg shadow-red-500/30' : 'bg-gray-50 text-[#DC2626] hover:bg-red-50 border border-red-100 disabled:opacity-40 disabled:cursor-not-allowed'}`}
             >
               {circuitBreakerTripped && position > 0 ? 'LIQUIDAR (SELL)' : 'ARM SELL'}
             </button>
          </div>

          <div className={`p-5 rounded-md border mt-auto transition-all ${activeIntent ? (activeIntent === 'BUY' ? 'border-[#059669]/30 bg-emerald-50/50' : 'border-[#DC2626]/30 bg-red-50/50') : 'border-gray-100 bg-gray-50'}`}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Trava de Idempotência</span>
              <span className="text-[10px] font-mono font-semibold text-[#C9A84C]">{intentKey || 'AWAITING_INTENT'}</span>
            </div>
            <button 
              onClick={executeOrder}
              disabled={!activeIntent || isArming}
              className={`w-full py-4 rounded-md font-bold tracking-[0.15em] text-xs uppercase transition-all flex items-center justify-center gap-2
                ${!activeIntent ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 
                  isArming ? 'bg-gray-800 text-gray-300 cursor-wait' : 
                  activeIntent === 'BUY' ? 'bg-[#059669] text-white hover:bg-emerald-700' : 'bg-[#DC2626] text-white hover:bg-red-700'
                }`}
            >
              {isArming ? <Fingerprint className="w-4 h-4 animate-pulse" /> : <ShieldCheck className="w-4 h-4" />}
              {isArming ? 'GERANDO HASH...' : 'CONFIRMAR EXECUÇÃO'}
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Injetar Jitter de Rede</span>
            <button 
              onClick={() => setNetworkJitter(!networkJitter)}
              className={`w-10 h-5 rounded-full relative transition-colors ${networkJitter ? 'bg-[#C9A84C]' : 'bg-gray-200'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${networkJitter ? 'left-[22px]' : 'left-0.5'}`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Ledger & Audit */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {/* Direct Exposure Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5 flex flex-col justify-between">
            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Network className="w-4 h-4 text-[#0A1628]" /> Posição Atual
            </div>
            <div className={`text-2xl font-bold font-mono tracking-tighter ${position > 0 ? 'text-[#059669]' : position < 0 ? 'text-[#DC2626]' : 'text-[#0A1628]'}`}>
              {position === 0 ? 'FLAT' : `${position > 0 ? '+' : ''}${position} CTRTS`}
            </div>
            {position !== 0 && (
              <div className="text-[11px] text-gray-500 mt-2 font-medium">
                PM: <span className="font-mono text-[#0A1628] font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(avgEntryPrice)}</span>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5 flex flex-col justify-between">
            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-[#0A1628]" /> PnL Aberto
            </div>
            <div ref={pnlRef} className="text-2xl font-bold font-mono tracking-tighter text-gray-400">
              R$ 0,00
            </div>
            <div className="text-[11px] text-gray-500 mt-2 font-medium flex items-center gap-1">
              Limite: <span className="font-mono font-semibold text-[#DC2626]">R$ -15K</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5 flex flex-col justify-between">
            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0A1628]" /> Margem de Garantia
            </div>
            <div className="text-xl font-bold font-mono tracking-tighter text-[#0A1628]">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(marginRequired)}
            </div>
            <div className="text-[11px] text-gray-500 mt-2 font-medium">
              Livre: <span className="font-mono font-semibold text-[#0A1628]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(balance - marginRequired)}</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5 flex flex-col justify-between">
            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#0A1628]" /> Alavancagem
            </div>
            <div className="text-xl font-bold font-mono tracking-tighter text-[#0A1628]">
              {leverage}x
            </div>
            <div className="w-full bg-gray-100 h-2 mt-3 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${parseFloat(leverage) > 10 ? 'bg-[#DC2626]' : parseFloat(leverage) > 5 ? 'bg-[#C9A84C]' : 'bg-[#059669]'}`} 
                style={{ width: `${Math.min(100, parseFloat(leverage) * 5)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg flex-1 flex flex-col min-h-[400px] overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#0A1628]" />
              <span className="text-xs font-bold text-[#0A1628] uppercase tracking-[0.15em]">
                Livro-Razão (Double-Entry)
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {circuitBreakerTripped && (
                <span className="text-[10px] text-[#DC2626] bg-red-50 border border-red-200 px-3 py-1 rounded-sm uppercase font-bold tracking-widest">
                  Risk Lock Ativo
                </span>
              )}
              <button
                onClick={handleExportAudit}
                disabled={isExporting}
                className={`flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-widest font-bold border rounded-md transition-all ${isExporting ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-wait' : 'bg-white text-[#0A1628] border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm'}`}
              >
                 <Download className="w-3 h-3" />
                 {isExporting ? 'PROCESSANDO...' : 'BAIXAR (.XLSX)'}
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-0">
            {orders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-10">
                <ShieldCheck className="w-12 h-12 mb-4 opacity-20" />
                <span className="text-[11px] font-semibold uppercase tracking-widest">LIVRO EM BRANCO. AGUARDANDO EXECUÇÃO.</span>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                  <tr className="text-gray-500 border-b border-gray-200">
                    <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px]">Timestamp</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px]">Ativo</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px]">Ação</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px]">Preço/Qtd</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px]">Status</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px] text-right">Idempotency Key</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map(o => (
                    <tr key={o.id} className="text-[#0A1628] hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-500 font-mono text-[11px]">{o.timestamp.split('T')[1].slice(0,12)}</td>
                      <td className="px-6 py-4 font-bold">{o.asset}</td>
                      <td className={`px-6 py-4 font-bold flex items-center gap-1.5 ${o.side === 'BUY' ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                        {o.side === 'BUY' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                        {o.side}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium">{o.qty} @ {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.price)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] rounded-sm uppercase font-bold tracking-widest border ${
                          o.status === 'EXECUTED' ? 'bg-emerald-50 text-[#059669] border-emerald-100' : 
                          'bg-red-50 text-[#DC2626] border-red-100'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-400 font-mono text-[10px] truncate max-w-[120px]">
                        {o.idempotency_key}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
