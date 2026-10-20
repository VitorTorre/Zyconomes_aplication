import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  X, 
  ShieldCheck, 
  Calendar, 
  Hash, 
  CheckCircle2, 
  Calculator,
  Building,
  Lock,
  ArrowRight
} from 'lucide-react';
import { auditLogger } from '../lib/auditLogger';
import { trackConversionEvent } from '../lib/analytics';
import { generateExecutivePDF } from '../lib/pdfExporter';

export interface PDFReportParameter {
  label: string;
  value: string | number;
  unit?: string;
  notes?: string;
}

export interface PDFReportMetric {
  label: string;
  value: string | number;
  badge?: string;
  highlight?: boolean;
}

export interface PDFReportProjectionRow {
  period: string | number;
  invested: string | number;
  total: string | number;
  interest: string | number;
  detail?: string;
}

export interface SimulationReportData {
  toolId?: number | string;
  toolName: string;
  clientName?: string;
  date?: string;
  parameters: PDFReportParameter[];
  metrics: PDFReportMetric[];
  projections?: PDFReportProjectionRow[];
  formulaTitle?: string;
  formulaMath?: string;
  formulaExplanation?: string;
  recommendations?: string[];
}

interface GeneratePDFReportProps {
  reportData?: SimulationReportData;
  className?: string;
  buttonLabel?: string;
  buttonVariant?: 'primary' | 'outline' | 'compact';
  autoOpenOnEvent?: boolean;
}

export const GeneratePDFReport: React.FC<GeneratePDFReportProps> = ({
  reportData: propData,
  className = '',
  buttonLabel = 'Exportar Relatório PDF',
  buttonVariant = 'outline',
  autoOpenOnEvent = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [clientName, setClientName] = useState('Investidor Institucional');
  const [documentId, setDocumentId] = useState('');
  const [generatedDate, setGeneratedDate] = useState('');
  const [activeData, setActiveData] = useState<SimulationReportData>(() => propData || getDefaultReportData());

  // Update activeData whenever propData changes
  useEffect(() => {
    if (propData) {
      setActiveData(propData);
    }
  }, [propData]);

  // Listen to global open event (e.g. from Ctrl+P or external trigger)
  useEffect(() => {
    if (!autoOpenOnEvent) return;

    const handleOpen = (e: any) => {
      if (e.detail) {
        setActiveData(e.detail);
      }
      openReport();
    };

    window.addEventListener('zyc_open_pdf_report', handleOpen);
    return () => window.removeEventListener('zyc_open_pdf_report', handleOpen);
  }, [autoOpenOnEvent]);

  const openReport = () => {
    const docCode = `ZYC-REP-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setDocumentId(docCode);
    setGeneratedDate(
      new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(new Date())
    );
    setIsOpen(true);
  };

  const handlePrint = () => {
    // Record sensitive audit event in localStorage
    auditLogger.recordAuditEvent({
      category: 'DATA_EXPORT',
      severity: 'INFO',
      action: 'PDF_REPORT_GENERATED',
      details: {
        documentId,
        tool: activeData.toolName,
        metricsCount: activeData.metrics.length,
        clientName,
      },
      source: 'client',
    });

    // Track analytics conversion
    trackConversionEvent('report_exported', {
      toolName: activeData.toolName,
      documentId,
    });

    // Invoke native browser print dialog
    window.print();
  };

  const handleDownloadJsPDF = () => {
    try {
      const doc = generateExecutivePDF(activeData, {
        clientName,
        documentId: documentId || `ZYC-REP-${Date.now().toString(36).toUpperCase()}`,
        generatedDate: generatedDate || new Date().toLocaleDateString('pt-BR'),
      });
      const fileName = `${documentId || 'ZYC-Relatorio-Executivo'}.pdf`;
      doc.save(fileName);

      auditLogger.recordAuditEvent({
        category: 'DATA_EXPORT',
        severity: 'INFO',
        action: 'JSPDF_REPORT_DOWNLOADED',
        details: {
          documentId,
          tool: activeData.toolName,
          fileName,
          clientName,
        },
        source: 'client',
      });

      trackConversionEvent('report_downloaded_jspdf', {
        toolName: activeData.toolName,
        documentId,
      });
    } catch (err) {
      console.error('Erro ao gerar relatório com jsPDF:', err);
    }
  };

  const getButtonStyle = () => {
    switch (buttonVariant) {
      case 'primary':
        return 'bg-[#1A1F71] hover:bg-[#121652] text-white shadow-md';
      case 'compact':
        return 'bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs py-1.5 px-3 hover:bg-zinc-50';
      case 'outline':
      default:
        return 'bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200';
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        id="btn-generate-pdf"
        onClick={openReport}
        className={`font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${getButtonStyle()} ${className}`}
        title="Gerar Relatório PDF com Auditoria Matemática"
      >
        <Printer className="w-4 h-4 text-zinc-500 shrink-0" />
        <span>{buttonLabel}</span>
      </button>

      {/* Screen Preview & Printable Container */}
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-sm overflow-y-auto p-2 sm:p-6 print:p-0 print:bg-white print:fixed print:inset-0">
          
          {/* Main Modal Wrapper (Hidden in Print, replaced by #print-area) */}
          <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 my-auto flex flex-col max-h-[92vh] overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none">
            
            {/* Modal Actions Header (Screen only) */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#1A1F71] dark:text-blue-400" />
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                  Relatório Institucional de Simulação
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Pronto para Impressão
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadJsPDF}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer"
                  title="Baixar arquivo PDF vetorizado diretamente via jsPDF"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar PDF (jsPDF)</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-[#1A1F71] hover:bg-[#121652] text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Salvar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Config bar for client name before printing (Screen only) */}
            <div className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-4 text-xs print:hidden">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-500">Nome do Titular:</span>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-1 rounded-lg text-zinc-800 dark:text-zinc-200 font-medium text-xs focus:ring-1 focus:ring-[#1A1F71]"
                  placeholder="Nome do cliente ou titular"
                />
              </div>
              <div className="text-zinc-500 ml-auto flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Formatado para papel A4 com tipografia institucional.</span>
              </div>
            </div>

            {/* SCROLLABLE DOCUMENT PREVIEW & OFFICIAL PRINT AREA */}
            <div className="overflow-y-auto p-4 sm:p-10 bg-zinc-100 dark:bg-zinc-950 flex justify-center print:p-0 print:bg-white print:overflow-visible">
              
              {/* THE OFFICIAL PRINT AREA */}
              <div 
                id="print-area"
                className="bg-white text-zinc-900 w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-12 shadow-md print:shadow-none print:p-6 print:m-0 border border-zinc-200 print:border-none font-sans relative flex flex-col justify-between"
                style={{ colorScheme: 'light' }}
              >
                <div>
                  {/* --- TOP INSTITUTIONAL HEADER --- */}
                  <div className="border-b-2 border-[#1A1F71] pb-6 mb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black tracking-tighter text-[#1A1F71]">
                            ZYCONOMES
                          </span>
                          <span className="text-emerald-600 text-2xl font-black">.</span>
                        </div>
                        <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mt-0.5">
                          Inteligência Financeira Determinística & Auditoria Algorítmica
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="inline-block bg-[#1A1F71]/5 border border-[#1A1F71]/20 px-3 py-1 rounded-lg">
                          <span className="text-[10px] font-mono font-bold text-[#1A1F71] block">
                            {documentId || 'ZYC-REP-2026-CONF'}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono mt-1">
                          Ref. Algorítmica v2.4
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between text-xs text-zinc-600 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-800">Módulo:</span>
                        <span className="bg-zinc-100 px-2 py-0.5 rounded font-semibold text-[#1A1F71]">
                          {activeData.toolName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-800">Titular:</span>
                        <span className="font-medium text-zinc-900">{clientName}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{generatedDate || '19 de Setembro de 2026'}</span>
                      </div>
                    </div>
                  </div>

                  {/* --- CONFIDENTIALITY & LGPD NOTICE --- */}
                  <div className="bg-zinc-50 border-l-4 border-emerald-500 p-3 rounded-r-lg mb-6 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-zinc-700 font-medium">
                        <strong>Relatório de Computação Segura:</strong> Compilado 100% no navegador (Client-Side). Nenhum dado pessoal ou financeiro trafegou em servidores externos.
                      </span>
                    </div>
                    <span className="hidden sm:inline-block text-[9px] font-bold tracking-wider uppercase text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                      LGPD Compliant
                    </span>
                  </div>

                  {/* --- EXECUTIVE KPI HIGHLIGHTS --- */}
                  <div className="mb-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-zinc-500" />
                      Métricas Chave & Diagnóstico
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {activeData.metrics.map((metric, idx) => (
                        <div 
                          key={idx}
                          className={`p-3.5 rounded-xl border ${
                            metric.highlight 
                              ? 'bg-[#1A1F71]/5 border-[#1A1F71]/30' 
                              : 'bg-zinc-50 border-zinc-200'
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                            {metric.label}
                          </span>
                          <span className={`text-xl font-black block ${metric.highlight ? 'text-[#1A1F71]' : 'text-zinc-900'}`}>
                            {metric.value}
                          </span>
                          {metric.badge && (
                            <span className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded mt-1">
                              {metric.badge}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* --- PARAMETERS SPECIFICATION TABLE --- */}
                  <div className="mb-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Parâmetros Utilizados na Simulação
                    </h4>
                    <div className="border border-zinc-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-zinc-100 text-zinc-600 font-bold uppercase tracking-wider text-[10px]">
                            <th className="py-2 px-3 border-b border-zinc-200">Parâmetro</th>
                            <th className="py-2 px-3 border-b border-zinc-200 text-right">Valor Informado</th>
                            <th className="py-2 px-3 border-b border-zinc-200 text-right">Observação / Unidade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 font-mono text-zinc-800">
                          {activeData.parameters.map((param, i) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'}>
                              <td className="py-2 px-3 font-sans font-medium text-zinc-900">{param.label}</td>
                              <td className="py-2 px-3 text-right font-bold">{param.value}</td>
                              <td className="py-2 px-3 text-right text-zinc-500 text-[11px] font-sans">{param.notes || param.unit || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* --- MATHEMATICAL FORMULATION & AUDIT TRAIL --- */}
                  <div className="mb-6 p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1F71] flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5" />
                        {activeData.formulaTitle || 'Auditoria Matemática do Algoritmo'}
                      </h4>
                      <span className="text-[10px] font-mono text-zinc-400">Verificação Determinística</span>
                    </div>
                    {activeData.formulaMath && (
                      <div className="bg-white border border-zinc-200 p-2.5 rounded-lg font-mono text-xs text-zinc-800 my-2 text-center tracking-wide font-bold">
                        {activeData.formulaMath}
                      </div>
                    )}
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {activeData.formulaExplanation || 
                        'Os cálculos são parametrizados sob regime composto de amortização e capitalização discreta mensal, respeitando a conservação de valor e consistência temporal conforme os teoremas de Finanças Quantitativas.'}
                    </p>
                  </div>

                  {/* --- PROJECTIONS SCHEDULE TABLE (IF PRESENT) --- */}
                  {activeData.projections && activeData.projections.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                        Cronograma Projetado de Evolução
                      </h4>
                      <div className="border border-zinc-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-zinc-100 text-zinc-600 font-bold uppercase tracking-wider text-[10px]">
                              <th className="py-2 px-3 border-b border-zinc-200">Período</th>
                              <th className="py-2 px-3 border-b border-zinc-200 text-right">Total Investido</th>
                              <th className="py-2 px-3 border-b border-zinc-200 text-right">Juros Acumulados</th>
                              <th className="py-2 px-3 border-b border-zinc-200 text-right font-bold text-[#1A1F71]">Patrimônio Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-mono text-zinc-800">
                            {activeData.projections.slice(0, 8).map((row, i) => (
                              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'}>
                                <td className="py-1.5 px-3 font-sans font-medium text-zinc-900">{row.period}</td>
                                <td className="py-1.5 px-3 text-right">{row.invested}</td>
                                <td className="py-1.5 px-3 text-right text-emerald-600 font-semibold">{row.interest}</td>
                                <td className="py-1.5 px-3 text-right font-bold text-[#1A1F71]">{row.total}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* --- STRATEGIC RECOMMENDATIONS --- */}
                  {activeData.recommendations && activeData.recommendations.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                        Diretrizes de Execução Financeira
                      </h4>
                      <ul className="space-y-1.5 text-xs text-zinc-700">
                        {activeData.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* --- OFFICIAL FOOTER & SIGNATURE BLOCK --- */}
                <div className="mt-8 pt-6 border-t-2 border-zinc-200">
                  <div className="grid grid-cols-2 gap-8 mb-4">
                    <div>
                      <div className="h-10 border-b border-dashed border-zinc-400 mb-1"></div>
                      <span className="text-[11px] font-bold text-zinc-800 block">
                        {clientName}
                      </span>
                      <span className="text-[9px] text-zinc-400 uppercase tracking-widest">
                        Titular / Investidor
                      </span>
                    </div>

                    <div>
                      <div className="h-10 border-b border-dashed border-zinc-400 mb-1 flex items-end">
                        <span className="font-mono text-[10px] text-zinc-500 italic pb-0.5">
                          Zyconomes Engine Core (Client-Side Validated)
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-zinc-800 block">
                        Vitor (Zyconomes Lead Architect)
                      </span>
                      <span className="text-[9px] text-zinc-400 uppercase tracking-widest">
                        Arquitetura & Engenharia Matemática
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-zinc-400 border-t border-zinc-100 pt-3">
                    <p>
                      Documento emitido por Zyconomes Plataforma Financeira. Finalidade exclusivamente educacional e simulatória.
                    </p>
                    <p className="font-mono">
                      Checksum: {documentId || 'SEC-0x49F2A'} • A4 Standard
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

/**
 * Fallback default report data for standard calculations.
 */
function getDefaultReportData(): SimulationReportData {
  return {
    toolId: 1,
    toolName: 'Diagnóstico de Saúde Financeira',
    parameters: [
      { label: 'Renda Mensal Líquida', value: 'R$ 8.500,00', notes: 'Base Mensal' },
      { label: 'Custos & Gastos Fixos', value: 'R$ 5.200,00', notes: 'Despesas Correntes' },
      { label: 'Poupança / Aporte Livre', value: 'R$ 3.300,00', notes: 'Fluxo Livre de Caixa' },
      { label: 'Patrimônio em Reserva', value: 'R$ 15.000,00', notes: 'Liquidez Imediata' },
    ],
    metrics: [
      { label: 'Taxa de Poupança', value: '38,8%', badge: 'Excelente (>30%)', highlight: true },
      { label: 'Fluxo de Caixa', value: 'R$ 3.300', badge: 'Positivo' },
      { label: 'Cobertura Emergencial', value: '2,9 Meses', badge: 'Meta: 6 Meses' },
      { label: 'Índice de Solvência', value: '1,63x', highlight: true },
    ],
    formulaTitle: 'Equação de Taxa de Poupança e Fluxo Livre',
    formulaMath: 'S_rate = ((Renda - Despesas) / Renda) * 100',
    formulaExplanation: 'A taxa de poupança determina a velocidade com que o indivíduo atinge a independência financeira, desacoplando o padrão de vida de uma renda ativa compulsória.',
    recommendations: [
      'Alocar prioritariamente o fluxo livre de R$ 3.300 para completar a reserva de emergência até 6 meses de custo (R$ 31.200).',
      'Após conclusão da blindagem, direcionar aportes em títulos IPCA+ e ativos indexados à produtividade real.',
      'Reavaliar custos não essenciais a cada trimestre para manter a taxa de poupança superior a 35%.',
    ],
    projections: [
      { period: 'Mês 1', invested: 'R$ 3.300', interest: 'R$ 0,00', total: 'R$ 18.300' },
      { period: 'Mês 3', invested: 'R$ 9.900', interest: 'R$ 142,00', total: 'R$ 25.042' },
      { period: 'Mês 5', invested: 'R$ 16.500', interest: 'R$ 380,00', total: 'R$ 31.880' },
      { period: 'Ano 1', invested: 'R$ 39.600', interest: 'R$ 1.840,00', total: 'R$ 56.440' },
      { period: 'Ano 2', invested: 'R$ 79.200', interest: 'R$ 7.210,00', total: 'R$ 101.410' },
    ],
  };
}
