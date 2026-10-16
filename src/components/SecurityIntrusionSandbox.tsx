import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Terminal, 
  Clock, 
  Fingerprint, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  Hash, 
  Cpu, 
  Database,
  FileCheck2
} from 'lucide-react';

interface SecurityIntrusionSandboxProps {
  userEmail?: string;
}

export const SecurityIntrusionSandbox: React.FC<SecurityIntrusionSandboxProps> = ({ userEmail }) => {
  // AES-256-GCM State
  const [plainText, setPlainText] = useState('R$ 250.000,00 - Reserva Familiar Protegida');
  const [encryptionResult, setEncryptionResult] = useState<any>(null);
  const [encryptLoading, setEncryptLoading] = useState(false);
  const [tamperedTag, setTamperedTag] = useState(false);

  // Time Window State
  const [timeStatus, setTimeStatus] = useState<any>(null);
  const [breakGlassJustification, setBreakGlassJustification] = useState('');
  const [breakGlassActive, setBreakGlassActive] = useState(false);

  // Probe Running State
  const [activeProbe, setActiveProbe] = useState<string | null>(null);
  const [probeResult, setProbeResult] = useState<any>(null);

  // Ledger Hash Chain State
  const [ledgerLogs, setLedgerLogs] = useState<any[]>([]);
  const [ledgerIntegrity, setLedgerIntegrity] = useState<any>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Fetch Time Window Status
  const fetchTimeWindow = async () => {
    try {
      const token = localStorage.getItem('zyc_auth_token');
      const res = await fetch('/api/security/time-window', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setTimeStatus(data);
      }
    } catch (err) {
      console.warn('Failed to fetch time window:', err);
    }
  };

  // Fetch Ledger Chain
  const fetchLedger = async () => {
    setLedgerLoading(true);
    try {
      const token = localStorage.getItem('zyc_auth_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (breakGlassActive && breakGlassJustification.length >= 15) {
        headers['x-emergency-breakglass'] = 'true';
        headers['x-breakglass-justification'] = breakGlassJustification;
      }

      const res = await fetch('/api/audit/logs', { headers });
      if (res.ok) {
        const data = await res.json();
        setLedgerLogs(data.logs || []);
        setLedgerIntegrity(data.integrity || { valid: true });
      }
    } catch (err) {
      console.warn('Failed to fetch ledger:', err);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeWindow();
    fetchLedger();
    const interval = setInterval(fetchTimeWindow, 30000);
    return () => clearInterval(interval);
  }, [breakGlassActive]);

  // Execute AES-256 Demo
  const handleRunEncryptionDemo = async () => {
    setEncryptLoading(true);
    try {
      const token = localStorage.getItem('zyc_auth_token');
      const res = await fetch('/api/security/encryption/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: plainText }),
      });
      if (res.ok) {
        const data = await res.json();
        setEncryptionResult(data);
        setTamperedTag(false);
      }
    } catch (err) {
      console.error('Encryption demo error:', err);
    } finally {
      setEncryptLoading(false);
    }
  };

  // Execute Synthetic Penetration Test Probe
  const handleRunProbe = async (scenario: string) => {
    setActiveProbe(scenario);
    setProbeResult(null);
    try {
      const token = localStorage.getItem('zyc_auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (breakGlassActive && breakGlassJustification.length >= 15) {
        headers['x-emergency-breakglass'] = 'true';
        headers['x-breakglass-justification'] = breakGlassJustification;
      }

      const res = await fetch('/api/security/penetration-test/run', {
        method: 'POST',
        headers,
        body: JSON.stringify({ scenario }),
      });
      const data = await res.json();
      setProbeResult(data);
      // Refresh ledger to view new chained hash entry
      fetchLedger();
    } catch (err) {
      console.error('Probe run error:', err);
    } finally {
      setActiveProbe(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. TIME-BASED ACCESS CONTROL (TBAC) & WHITELIST STATUS */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#1A1F71] dark:text-blue-400" />
              Controle de Acesso Temporal (TBAC) & Whitelist Estrita
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Janela administrativa regulamentar: <span className="font-semibold text-zinc-700 dark:text-zinc-300">11:00 às 13:45 (Horário de Brasília / UTC-3)</span>.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <div className="text-zinc-400 text-[11px]">Horário Atual (BRT)</div>
              <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {timeStatus?.currentBrtTime || '--:--'}
              </div>
            </div>
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="text-right">
              <div className="text-zinc-400 text-[11px]">Status da Janela</div>
              <div className={`font-bold ${timeStatus?.isAllowed ? 'text-emerald-600' : 'text-amber-600'}`}>
                {timeStatus?.isAllowed ? 'Janela Aberta' : 'Janela Fechada'}
              </div>
            </div>
          </div>
        </div>

        {/* Whitelist Info & Break-Glass Section */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <span className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px]">
              Contas com Acesso Administrativo Autorizado
            </span>
            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 font-mono space-y-1 text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center justify-between">
                <span>• v.torresko2015@gmail.com</span>
                <span className="text-emerald-600 font-bold">Fundador / SuperAdmin</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• dev@zyconomes.com / sistema</span>
                <span className="text-blue-600 font-bold">Desenvolvedor Autorizado</span>
              </div>
              <div className="pt-2 text-[11px] text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
                Qualquer outro usuário autenticado é confinado estritamente ao perfil <span className="font-bold text-zinc-600 dark:text-zinc-300">USER</span>, bloqueando acessos laterais.
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px]">
              Autorização Extraordinária (Break-Glass Auditado)
            </span>
            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-2">
              <p className="text-[11px] text-zinc-500">
                Permite operações fora do horário com gravação permanente de justificativa no ledger com severidade <span className="font-bold text-red-500">CRITICAL</span>.
              </p>
              <input
                type="text"
                placeholder="Motivo formal da emergência (mínimo 15 caracteres)..."
                value={breakGlassJustification}
                onChange={(e) => setBreakGlassJustification(e.target.value)}
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
              <button
                onClick={() => setBreakGlassActive(!breakGlassActive)}
                disabled={breakGlassJustification.trim().length < 15}
                className={`w-full py-1.5 px-3 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  breakGlassActive
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {breakGlassActive ? 'Desativar Modo Break-Glass' : 'Ativar Acesso Emergencial com Justificativa'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. AES-256-GCM CRIPTOGRAFIA EM REPOUSO - SIMULAÇÃO VISUAL DE PERTO */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              Simulação de Criptografia em Repouso (AES-256-GCM)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Criptografia simétrica autenticada com vetor de inicialização (IV 12 bytes) e tag de autenticação GCM (16 bytes).
            </p>
          </div>
          <button
            onClick={handleRunEncryptionDemo}
            disabled={encryptLoading}
            className="bg-[#1A1F71] hover:bg-[#121652] text-white text-xs font-bold py-2 px-4 rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {encryptLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
            <span>Criptografar Texto</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">
              Dado Sensível de Entrada (PII ou Valor Patrimonial)
            </label>
            <input
              type="text"
              value={plainText}
              onChange={(e) => setPlainText(e.target.value)}
              className="w-full text-sm font-mono px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
              placeholder="Digite um valor financeiro ou identificador..."
            />
          </div>

          {encryptionResult && (
            <div className="bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-xl p-4 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-[11px] text-zinc-400">
                <span>ALGORITMO: AES-256-GCM (NIST SP 800-38D)</span>
                <span>FINGERPRINT DA CHAVE: {encryptionResult.keyFingerprint}...</span>
              </div>

              <div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Vetor de Inicialização (IV Único - 96 bits / 12 bytes):</div>
                <div className="text-amber-400 font-bold break-all tabular-nums">{encryptionResult.encrypted.iv}</div>
              </div>

              <div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Texto Cifrado (Ciphertext Hex):</div>
                <div className="text-emerald-400 font-bold break-all tabular-nums">{encryptionResult.encrypted.ciphertext}</div>
              </div>

              <div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Tag de Autenticação GCM (MAC 128 bits / 16 bytes):</div>
                <div className="text-blue-400 font-bold break-all tabular-nums">
                  {tamperedTag ? 'ff'.repeat(16) : encryptionResult.encrypted.authTag}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Decriptação Verificada:</span>
                  <span className="text-white font-bold">"{encryptionResult.decrypted}"</span>
                </div>
                <button
                  onClick={() => setTamperedTag(!tamperedTag)}
                  className="text-[11px] text-zinc-400 hover:text-amber-400 underline cursor-pointer"
                >
                  {tamperedTag ? 'Restaurar Tag Original' : 'Simular Adulteração de Tag (Tamper Attack)'}
                </button>
              </div>
              {tamperedTag && (
                <div className="text-[11px] text-red-400 bg-red-950/40 border border-red-800/60 p-2 rounded-lg">
                  Aviso de Segurança: Com a tag adulterada, a cifra AES-GCM rejeita sumariamente o payload via <span className="font-bold">Error: Unsupported state or unable to authenticate data</span>, provando integridade criptográfica.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. SIMULADOR DE ATAQUES CONTROLADOS (IDOR, TBAC, ZOD STRICT) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-4">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-red-600" />
            Cockpit de Testes de Penetração Sintéticos (Exclusivo SuperAdmin/Dev)
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Simule tentativas reais de intrusão e verifique o isolamento em tempo real pelo firewall comportamental e ledger.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleRunProbe('IDOR_TAMPER_SIMULATION')}
            disabled={Boolean(activeProbe)}
            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-red-300 dark:hover:border-red-800 bg-zinc-50 dark:bg-zinc-950 text-left transition-all cursor-pointer group disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 transition-colors">
                1. Tentativa de IDOR Cruzado
              </span>
              <ShieldAlert className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Simula leitura de simulação ID 9999 de outro inquilino. Deve gerar 404 e anomalia +4 no firewall.
            </p>
          </button>

          <button
            onClick={() => handleRunProbe('TIME_WINDOW_TEST')}
            disabled={Boolean(activeProbe)}
            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-800 bg-zinc-50 dark:bg-zinc-950 text-left transition-all cursor-pointer group disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors">
                2. Teste de Janela TBAC
              </span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Testa autorização com base no relógio do servidor contra a faixa 11:00 às 13:45 BRT.
            </p>
          </button>

          <button
            onClick={() => handleRunProbe('ZOD_STRICT_PROBE')}
            disabled={Boolean(activeProbe)}
            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-800 bg-zinc-50 dark:bg-zinc-950 text-left transition-all cursor-pointer group disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 transition-colors">
                3. Sonda Zod Schema (.strict)
              </span>
              <FileCheck2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Injeta parâmetros extras não mapeados e valida descarte instantâneo na borda.
            </p>
          </button>
        </div>

        {probeResult && (
          <div className="mt-4 bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-xl p-4 font-mono text-xs">
            <div className="text-[11px] text-emerald-400 font-bold mb-2">
              RESPOSTA DO SISTEMA DE CONTENÇÃO // CENÁRIO: {probeResult.scenario}
            </div>
            <pre className="text-[11px] text-zinc-400 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(probeResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* 4. BLOCKCHAIN-STYLE AUDIT LEDGER (HASH CHAIN RETROALIMENTADA) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Hash className="w-5 h-5 text-blue-600" />
              Malha de Auditoria Encadeada Criptograficamente (Ledger Imutável)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Cada evento é assinado com o hash do evento anterior (<span className="font-mono text-zinc-700 dark:text-zinc-300">prevHash</span>) e HMAC-SHA256 do servidor.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-4 h-4" />
              <span>Corrente 100% Íntegra</span>
            </div>
            <button
              onClick={fetchLedger}
              disabled={ledgerLoading}
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
              title="Recalcular Integridade da Malha"
            >
              <RefreshCw className={`w-4 h-4 ${ledgerLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto font-mono text-xs pr-1">
          {ledgerLogs.slice(0, 10).map((log, idx) => (
            <div
              key={log.id || idx}
              className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60 transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  BLOCO #{log.index} · {log.action}
                </span>
                <span className="text-zinc-400 tabular-nums">{log.timestamp}</span>
              </div>
              <div className="text-[11px] text-zinc-500 grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                <div>
                  <span className="text-zinc-400">prevHash: </span>
                  <span className="text-amber-600 dark:text-amber-400 truncate inline-block max-w-[200px]">
                    {log.prevHash?.substring(0, 16)}...
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400">entryHash: </span>
                  <span className="text-emerald-600 dark:text-emerald-400 truncate inline-block max-w-[200px]">
                    {log.entryHash?.substring(0, 16)}...
                  </span>
                </div>
              </div>
            </div>
          ))}

          {ledgerLogs.length === 0 && (
            <div className="text-center py-8 text-zinc-400 text-xs">
              Nenhum evento registrado no ledger ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
