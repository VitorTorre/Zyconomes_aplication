import { jsPDF } from 'jspdf';
import { SimulationReportData } from '../components/GeneratePDFReport';

export interface PDFExportOptions {
  clientName?: string;
  documentId?: string;
  generatedDate?: string;
}

// Glossário de desmistificação de conceitos técnicos nichados
export const TECHNICAL_GLOSSARY: Record<string, string> = {
  'SAC': 'Sistema de Amortização Constante: o principal da dívida é reduzido em parcelas iguais a cada mês, gerando prestações decrescentes e menor custo total de juros ao final.',
  'PRICE': 'Tabela Francesa: prestações mensais constantes. No início, a maior parte da parcela é composta por juros e pouco principal é amortizado.',
  'CET': 'Custo Efetivo Total: taxa percentual anual que agrega juros nominais, seguros obrigatórios (MIP/DFI) e taxas administrativas cobradas pelos bancos.',
  'Sharpe': 'Índice de Sharpe: mede o retorno excedente gerado por um portfólio para cada unidade de volatilidade suportada. Valores > 1.0 indicam excelente eficiência.',
  'SWR': 'Safe Withdrawal Rate (Taxa de Retirada Segura - Regra dos 4%): percentual anual retirado de uma carteira que garante perpetuidade patrimonial sem exaustão do capital.',
  'Cone Log-Normal': 'Intervalo estocástico de probabilidade (P10 a P90) que reflete a dispersão dos retornos compostos sob diferentes regimes macroeconômicos.',
  'Glide Path': 'Trajetória gradual de realocação de risco e dolarização progressiva conforme o investidor se aproxima da fase de fruição da renda passiva.',
  'Drawdown Guard': 'Trava de proteção que condiciona a retirada de proventos pessoais ao fluxo de caixa líquido real, impedindo a erosão do principal em quedas de mercado.',
};

export const generateExecutivePDF = (
  data: SimulationReportData,
  options: PDFExportOptions = {}
): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  const docCode = options.documentId || `ZYC-${Date.now().toString(36).toUpperCase()}`;
  const client = options.clientName || 'Investidor Institucional';
  const dateStr = options.generatedDate || new Date().toLocaleDateString('pt-BR');

  // --- CABEÇALHO INSTITUCIONAL ---
  doc.setFillColor(26, 31, 113); // #1A1F71
  doc.rect(margin, y, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ZYCONOMES ARCHITECTURE SYSTEMS', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Relatório Executivo de Projeção Financeira & Auditoria Fiduciária', margin + 6, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(docCode, pageWidth - margin - 6, y + 9, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Emissão: ${dateStr}`, pageWidth - margin - 6, y + 16, { align: 'right' });

  y += 30;

  // --- DADOS DA SIMULAÇÃO ---
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(data.toolName, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Titular: ${client} | Modelo Algorítmico Determinístico Zyconomes Engine`, margin, y + 5);

  y += 12;

  // --- SEÇÃO 1: MÉTRICAS-CHAVE DE IMPACTO ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(26, 31, 113);
  doc.text('1. Indicadores-Chave de Desempenho e Metas', margin, y);
  y += 5;

  const metricBoxWidth = contentWidth / Math.min(3, Math.max(1, data.metrics.length));
  let metricX = margin;

  data.metrics.slice(0, 3).forEach((m) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(metricX, y, metricBoxWidth - 2, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, metricX + 4, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(26, 31, 113);
    doc.text(String(m.value), metricX + 4, y + 14);

    metricX += metricBoxWidth;
  });

  y += 24;

  // --- SEÇÃO 2: PARÂMETROS AUDITADOS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(26, 31, 113);
  doc.text('2. Parâmetros e Variáveis de Entrada Auditadas', margin, y);
  y += 6;

  // Tabela de Parâmetros
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Parâmetro', margin + 4, y + 5);
  doc.text('Valor Aplicado', margin + 90, y + 5);
  doc.text('Observações Fiduciárias', margin + 130, y + 5);
  y += 7;

  data.parameters.forEach((param, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 6, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(param.label, margin + 4, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.text(String(param.value), margin + 90, y + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(param.notes || 'Validado pelo motor', margin + 130, y + 4.5);
    y += 6;
  });

  y += 6;

  // --- SEÇÃO 3: PROJEÇÕES CRONOLÓGICAS (SE HOUVER) ---
  if (data.projections && data.projections.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(26, 31, 113);
    doc.text('3. Projeção Cronológica & Evolução de Capital', margin, y);
    y += 6;

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('Período / Ano', margin + 4, y + 5);
    doc.text('Capital / Aporte', margin + 50, y + 5);
    doc.text('Rendimentos / Juros', margin + 100, y + 5);
    doc.text('Saldo Total Projetado', margin + 145, y + 5);
    y += 7;

    data.projections.slice(0, 6).forEach((p, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 6, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(String(p.period), margin + 4, y + 4.5);
      doc.text(String(p.invested), margin + 50, y + 4.5);
      doc.text(String(p.interest), margin + 100, y + 4.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129); // #10B981
      doc.text(String(p.total), margin + 145, y + 4.5);
      y += 6;
    });

    y += 6;
  }

  // --- SEÇÃO 4: GLOSSÁRIO DE DESMISTIFICAÇÃO DE TERMOS TÉCNICOS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(26, 31, 113);
  doc.text('4. Glossário Desmistificado: Conceitos de Nicho Esclarecidos', margin, y);
  y += 5;

  const relevantGlossaryTerms = Object.entries(TECHNICAL_GLOSSARY).slice(0, 4);

  relevantGlossaryTerms.forEach(([term, explanation]) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(26, 31, 113);
    doc.text(`${term}:`, margin + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const splitDesc = doc.splitTextToSize(explanation, contentWidth - 32);
    doc.text(splitDesc, margin + 28, y + 4.5);

    y += 11.5;
  });

  // --- SEÇÃO 5: DIRETRIZES E DECLARAÇÃO FIDUCIÁRIA ---
  if (data.recommendations && data.recommendations.length > 0 && y < pageHeight - 35) {
    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(26, 31, 113);
    doc.text('5. Diretrizes Estratégicas de Execução', margin, y);
    y += 5;

    data.recommendations.slice(0, 2).forEach((rec) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const splitRec = doc.splitTextToSize(`• ${rec}`, contentWidth);
      doc.text(splitRec, margin, y);
      y += 5;
    });
  }

  // --- RODAPÉ REGULATÓRIO & AUDITORIA ---
  const footerY = pageHeight - 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Zyconomes Engine — Cálculos fiduciários em conformidade com a Resolução BACEN nº 3.516/2007 e LGPD. Sem custódia de dados bancários.',
    margin,
    footerY + 2
  );
  doc.text(`Página 1 de 1 | ID: ${docCode}`, pageWidth - margin, footerY + 2, { align: 'right' });

  return doc;
};
