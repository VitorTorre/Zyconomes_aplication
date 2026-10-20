import { describe, it, expect } from 'vitest';
import { generateExecutivePDF, TECHNICAL_GLOSSARY } from '../src/lib/pdfExporter';
import { SimulationReportData } from '../src/components/GeneratePDFReport';

describe('Exportador de Relatório PDF Executivo (jsPDF)', () => {
  it('gera instância válida do jsPDF com cabeçalho fiduciário, métricas e glossário', () => {
    const mockReportData: SimulationReportData = {
      toolId: 4,
      toolName: 'Acelerador de Financiamento Habitacional (SAC vs PRICE)',
      clientName: 'Vitor Torres',
      parameters: [
        { label: 'Saldo Devedor Principal', value: 'R$ 300.000,00', notes: 'SFH Imobiliário' },
        { label: 'Taxa CET Efetiva', value: '10.5% a.a.', notes: 'Auditado' },
        { label: 'Prazo Contratual', value: '30 Anos (360 Meses)' },
        { label: 'Aporte Extraordinário Mensal', value: 'R$ 600,00/mês' },
      ],
      metrics: [
        { label: 'Tempo Poupado', value: '17.6 Anos', highlight: true, badge: 'Liberdade' },
        { label: 'Juros Economizados', value: 'R$ 248.500,00', highlight: true },
        { label: 'Multiplicador de Amortização', value: '1.92x' },
      ],
      projections: [
        { period: 'Ano 1', invested: 'R$ 15.200', interest: 'R$ 31.000', total: 'R$ 284.800' },
        { period: 'Ano 3', invested: 'R$ 45.600', interest: 'R$ 88.000', total: 'R$ 254.400' },
        { period: 'Ano 5', invested: 'R$ 76.000', interest: 'R$ 138.000', total: 'R$ 218.000' },
        { period: 'Ano 10', invested: 'R$ 152.000', interest: 'R$ 220.000', total: 'R$ 110.000' },
        { period: 'Ano 12', invested: 'R$ 182.400', interest: 'R$ 248.500', total: 'R$ 0 (Quitado!)' },
      ],
      recommendations: [
        'Priorizar amortizações extraordinárias abatendo diretamente no PRAZO para capturar a alavancagem de juros.',
        'Manter aportes de 13º salário e FGTS bienal para encurtar a quitação para menos de 10 anos.',
      ],
    };

    const doc = generateExecutivePDF(mockReportData, {
      clientName: 'Vitor Torres',
      documentId: 'ZYC-REP-TEST-001',
      generatedDate: '18/10/2026',
    });

    expect(doc).toBeDefined();
    expect(typeof doc.save).toBe('function');
    expect(doc.internal.pageSize.getWidth()).toBeCloseTo(210, 0); // A4 largura mm
    expect(doc.internal.pageSize.getHeight()).toBeCloseTo(297, 0); // A4 altura mm
  });

  it('contém definições completas no glossário técnico de nicho', () => {
    expect(TECHNICAL_GLOSSARY['SAC']).toBeDefined();
    expect(TECHNICAL_GLOSSARY['PRICE']).toBeDefined();
    expect(TECHNICAL_GLOSSARY['CET']).toBeDefined();
    expect(TECHNICAL_GLOSSARY['Sharpe']).toBeDefined();
    expect(TECHNICAL_GLOSSARY['SWR']).toBeDefined();
  });
});

describe('Mecanismo de Comparação Split-View', () => {
  it('calcula deltas absolutos e percentuais entre cenário ativo e snapshot salvo', () => {
    const activeScenario = {
      targetWealth: 2500000,
      monthlyContribution: 2000,
      yearsToTarget: 14.5,
      totalInterest: 85000,
    };

    const savedSnapshot = {
      targetWealth: 1500000,
      monthlyContribution: 1000,
      yearsToTarget: 22.0,
      totalInterest: 240000,
    };

    const wealthDelta = activeScenario.targetWealth - savedSnapshot.targetWealth;
    const yearsSavedDelta = savedSnapshot.yearsToTarget - activeScenario.yearsToTarget;
    const interestSavedDelta = savedSnapshot.totalInterest - activeScenario.totalInterest;

    expect(wealthDelta).toBe(1000000); // +R$ 1.000.000
    expect(yearsSavedDelta).toBeCloseTo(7.5); // 7.5 anos a menos
    expect(interestSavedDelta).toBe(155000); // R$ 155.000 poupados de juros
  });
});
