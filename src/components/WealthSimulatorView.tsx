import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator, Target, TrendingUp, HelpCircle, ChevronRight, RefreshCw, Link2 } from 'lucide-react';
import { useFinancialData } from '../context/FinancialDataContext';

export const WealthSimulatorView: React.FC = () => {
  const {
    savings: initialAmount,
    setSavings: setInitialAmount,
    monthlyContribution,
    setMonthlyContribution,
    interestRate: annualRate,
    setInterestRate: setAnnualRate,
    years,
    setYears,
    syncAllCalculators,
    autoSyncEnabled
  } = useFinancialData();

  // Projection Logic
  const chartData = useMemo(() => {
    let currentBalance = initialAmount;
    let currentInvested = initialAmount;
    const data = [];
    const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;

    for (let i = 0; i <= years; i++) {
      if (i > 0) {
        for (let m = 0; m < 12; m++) {
          currentBalance = (currentBalance + monthlyContribution) * (1 + monthlyRate);
          currentInvested += monthlyContribution;
        }
      }
      
      data.push({
        year: i,
        label: `Ano ${i}`,
        total: Math.round(currentBalance),
        investido: Math.round(currentInvested),
        juros: Math.round(currentBalance - currentInvested)
      });
    }
    return data;
  }, [initialAmount, monthlyContribution, annualRate, years]);

  const finalData = chartData[chartData.length - 1];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans h-full bg-[#F8F9FA] text-[#0A1628]">
      
      {/* LEFT COLUMN: Controls & Education */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Title Card */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-8">
          <div className="w-12 h-12 bg-[#0A1628] rounded-xl flex items-center justify-center mb-6">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#0A1628] mb-2 tracking-tight">Calculadora de Juros Compostos</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Simule o poder dos juros compostos no longo prazo. Descubra quanto o seu dinheiro pode trabalhar por você e planeje a sua independência financeira.
          </p>
        </div>

        {/* Input Controls */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Target className="w-4 h-4 text-[#C9A84C]" /> Parâmetros de Simulação
            </h2>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <Link2 className="w-3 h-3 text-emerald-600" />
              <span>Sincronizado</span>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="flex items-center justify-between text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                <span>Valor Inicial (R$)</span>
                <span className="text-[#0A1628] font-bold font-mono">{formatCurrency(initialAmount)}</span>
              </label>
              <input 
                type="range" min="0" max="100000" step="1000"
                value={initialAmount} onChange={(e) => setInitialAmount(Number(e.target.value))}
                className="w-full accent-[#C9A84C]"
              />
            </div>

            <div>
              <label className="flex items-center justify-between text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                <span>Aporte Mensal (R$)</span>
                <span className="text-[#0A1628] font-bold font-mono">{formatCurrency(monthlyContribution)}</span>
              </label>
              <input 
                type="range" min="0" max="10000" step="100"
                value={monthlyContribution} onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="w-full accent-[#C9A84C]"
              />
            </div>

            <div>
              <label className="flex items-center justify-between text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                <span>Taxa de Juros Anual (%)</span>
                <span className="text-[#0A1628] font-bold font-mono">{annualRate.toFixed(1)}% a.a.</span>
              </label>
              <input 
                type="range" min="1" max="20" step="0.5"
                value={annualRate} onChange={(e) => setAnnualRate(Number(e.target.value))}
                className="w-full accent-[#C9A84C]"
              />
            </div>

            <div>
              <label className="flex items-center justify-between text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                <span>Tempo Investido (Anos)</span>
                <span className="text-[#0A1628] font-bold font-mono">{years} Anos</span>
              </label>
              <input 
                type="range" min="1" max="50" step="1"
                value={years} onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-[#C9A84C]"
              />
            </div>
          </div>
        </div>

        {/* SEO / Education Snippet */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-6 flex items-start gap-4">
          <div className="p-2 bg-white rounded-full text-[#059669] shadow-sm">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-[#0A1628] mb-1">Como funciona a mágica?</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Os juros compostos são juros calculados sobre o valor inicial acrescido dos juros acumulados anteriormente. É o famoso "juros sobre juros".
            </p>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Results & Chart */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {/* Results Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6">
            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">Valor Total Acumulado</div>
            <div className="text-3xl font-bold font-mono text-[#0A1628]">{formatCurrency(finalData.total)}</div>
            <div className="mt-4 text-xs font-medium text-gray-500 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#059669]" /> Crescimento Exponencial
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6">
            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">Total Investido</div>
            <div className="text-2xl font-bold font-mono text-gray-600">{formatCurrency(finalData.investido)}</div>
            <div className="mt-4 text-xs font-medium text-gray-500">
              {((finalData.investido / finalData.total) * 100).toFixed(1)}% do Patrimônio
            </div>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6">
            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">Total em Juros Ganho</div>
            <div className="text-2xl font-bold font-mono text-[#059669]">{formatCurrency(finalData.juros)}</div>
            <div className="mt-4 text-xs font-medium text-gray-500">
              {((finalData.juros / finalData.total) * 100).toFixed(1)}% do Patrimônio
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6 flex-1 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm font-bold text-[#0A1628] uppercase tracking-widest font-sans flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#C9A84C]" />
              Projeção Patrimonial
            </h2>
          </div>
          
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInvestido" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A365D" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1A365D" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorJuros" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="year" 
                  tickFormatter={(val) => `${val}a`} 
                  stroke="#9CA3AF" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} 
                  stroke="#9CA3AF" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  width={80}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Ano ${label}`}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontFamily: 'JetBrains Mono' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="total" name="Total (Investido + Juros)" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorJuros)" />
                <Area type="monotone" dataKey="investido" name="Valor Investido" stroke="#1A365D" strokeWidth={3} fillOpacity={1} fill="url(#colorInvestido)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-[#0A1628] rounded-lg p-8 flex items-center justify-between shadow-premium relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-[#1A365D] rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2">Pronto para colocar esse plano em prática?</h2>
            <p className="text-gray-300 max-w-xl">
              Abra sua conta na Zyconomes em menos de 2 minutos e acesse o Terminal Institucional de negociação com taxa zero nas 100 primeiras operações.
            </p>
          </div>
          <button className="relative z-10 bg-[#C9A84C] hover:bg-[#F59E0B] text-[#0A1628] px-8 py-4 rounded-md font-bold tracking-widest uppercase text-sm flex items-center gap-2 transition-all">
            ABRIR MINHA CONTA <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
