import React, { useState, useEffect } from 'react';
import { FileText, Download, Trash2, RefreshCw, Shield, AlertCircle, CheckCircle2, Terminal, Copy, Check, Mail, Eye, ShieldAlert, Cpu, Sparkles, X } from 'lucide-react';
import { getLocalOperationalIncidents, clearLocalOperationalIncidents, generateProtectedAuditTxtFile, OperationalIncident } from '../lib/inputEncapsulator';
import { getDiagnosedErrorsTable, clearDiagnosedErrorsTable, reportDiagnosedError, DiagnosedErrorEntry } from '../lib/selfHealingEngine';

export const AdminIncidentPanel: React.FC = () => {
  const [incidents, setIncidents] = useState<OperationalIncident[]>([]);
  const [diagnosedErrors, setDiagnosedErrors] = useState<DiagnosedErrorEntry[]>([]);
  const [viewMode, setViewMode] = useState<'diagnosed_errors' | 'table' | 'raw_txt' | 'docker'>('diagnosed_errors');
  const [copied, setCopied] = useState(false);
  const [txtContent, setTxtContent] = useState('');
  const [selectedSnapshotError, setSelectedSnapshotError] = useState<DiagnosedErrorEntry | null>(null);
  const [testingTrigger, setTestingTrigger] = useState(false);

  const loadData = () => {
    const list = getLocalOperationalIncidents();
    setIncidents(list);
    setTxtContent(generateProtectedAuditTxtFile(list));

    const errors = getDiagnosedErrorsTable();
    setDiagnosedErrors(errors);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `zyconomes_intercorrencias_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleClearAll = () => {
    if (confirm('Deseja realmente limpar os registros de intercorrências operacionais e a base de erros diagnosticados?')) {
      clearLocalOperationalIncidents();
      clearDiagnosedErrorsTable();
      loadData();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateCriticalErrorTest = async () => {
    setTestingTrigger(true);
    try {
      await reportDiagnosedError({
        severity: 'CRITICAL',
        componentName: 'FinanceCalculators (Diagnóstico & Aportes)',
        error: new Error('Simulação de Overflow Aritmético: Taxa de Poupança com denominador zero em input bruto'),
        capturedInputs: {
          rendaMensal: 0,
          despesasMensais: 14500,
          reservaAtual: 500,
          rawTypedString: '14.500,00 R$ INVALID_CHAR',
        },
        customRemediation: 'Encapsulamento fiduciário via safeMonetaryInput() com restauração do snapshot estável prévio.',
      });
      loadData();
    } finally {
      setTestingTrigger(false);
    }
  };

  const dockerComposeCode = `version: '3.8'

services:
  audit-worker:
    image: alpine:3.19
    container_name: zyconomes-audit-lite
    restart: unless-stopped
    volumes:
      - ./logs:/var/log/zyconomes:ro
    command: >
      sh -c "echo '=== Zyconomes Light Audit Alpine Linux Emulation Active ===' &&
             echo 'Tailing intercorrencias_operacionais.txt...' &&
             touch /var/log/zyconomes/intercorrencias_operacionais.txt &&
             tail -f /var/log/zyconomes/intercorrencias_operacionais.txt"
    deploy:
      resources:
        limits:
          memory: 32M
          cpus: '0.1'
`;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">
            <Shield className="w-4 h-4" />
            <span>Acesso Restrito: Administradores, SuperAdmins & SuperDevelopers</span>
          </div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Central de Intercorrências, Base de Erros Diagnosticados & Autocura
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Governança fiduciária de inputs encapsulados, alerta por e-mail (v.torresko2015@gmail.com) e tolerância contínua a falhas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSimulateCriticalErrorTest}
            disabled={testingTrigger}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            title="Dispara um teste controlado de diagnóstico com envio de alerta para o e-mail cadastrado"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{testingTrigger ? 'Simulando...' : 'Testar Autocura & Alerta'}</span>
          </button>
          <button
            onClick={loadData}
            className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Atualizar registros"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownloadTxt}
            className="bg-[#1A1F71] hover:bg-[#121652] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar Registro (.txt)</span>
          </button>
          <button
            onClick={handleClearAll}
            className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-xs font-bold px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Limpar registros de intercorrências"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>
        </div>
      </div>

      {/* Tabs de visualização */}
      <div className="flex flex-wrap items-center gap-2 mt-6 mb-4">
        <button
          onClick={() => setViewMode('diagnosed_errors')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            viewMode === 'diagnosed_errors'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          <span>Base de Erros Diagnosticados ({diagnosedErrors.length})</span>
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'table'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Tabela de Intercorrências ({incidents.length})
        </button>
        <button
          onClick={() => setViewMode('raw_txt')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            viewMode === 'raw_txt'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Arquivo .txt Blindado (15 Linguagens)</span>
        </button>
        <button
          onClick={() => setViewMode('docker')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            viewMode === 'docker'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Docker Compose (Linux Leve)</span>
        </button>
      </div>

      {/* Visão 0: Base de Erros Diagnosticados (Exclusivo Admin / SuperAdmin / SuperDeveloper) */}
      {viewMode === 'diagnosed_errors' && (
        <div className="space-y-4">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-zinc-900 dark:text-white block mb-0.5">
                Protocolo de Notificação & Encaminhamento Automático
              </span>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                Erros críticos ou de alta gravidade disparam alerta com print de tela e snapshot de inputs para: <strong className="text-[#1A1F71] dark:text-indigo-400 font-mono">v.torresko2015@gmail.com</strong>.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold rounded-full text-[10px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Autocura Fiduciária Ativa
            </span>
          </div>

          {diagnosedErrors.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                Nenhum erro crítico ou anomalia diagnosticada no momento.
              </p>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                O sistema Zyconomes está operando com integridade nominal contínua e tolerância a falhas garantida pelas 10 Heurísticas de Jakob Nielsen.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {diagnosedErrors.map((errItem, idx) => (
                <div
                  key={errItem.id || idx}
                  className="p-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        errItem.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                      }`}>
                        {errItem.severity}
                      </span>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                        {errItem.componentName}
                      </h4>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {new Date(errItem.timestamp).toLocaleTimeString('pt-BR')} ({new Date(errItem.timestamp).toLocaleDateString('pt-BR')})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {errItem.screenshotBase64 && (
                        <button
                          type="button"
                          onClick={() => setSelectedSnapshotError(errItem)}
                          className="text-xs font-bold text-[#1A1F71] dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Print da Tela</span>
                        </button>
                      )}
                      <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-emerald-500" />
                        <span>Alerta: v.torresko2015@gmail.com</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/70 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
                      <span className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] block mb-1">
                        O que é no sistema (Causa Raiz)
                      </span>
                      <p className="text-zinc-800 dark:text-zinc-200 font-medium">
                        {errItem.rootCauseCategory}
                      </p>
                    </div>

                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/70 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
                      <span className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] block mb-1">
                        O que faz nesse sistema (Impacto)
                      </span>
                      <p className="text-zinc-800 dark:text-zinc-200">
                        {errItem.systemImpact}
                      </p>
                    </div>

                    <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-[10px] block mb-1">
                        O que pode ser feito para solucioná-lo
                      </span>
                      <p className="text-emerald-900 dark:text-emerald-300 font-medium">
                        {errItem.suggestedRemediation}
                      </p>
                    </div>
                  </div>

                  {errItem.capturedInputs && Object.keys(errItem.capturedInputs).length > 0 && (
                    <div className="p-3 bg-zinc-950 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto border border-zinc-800">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                        Payload de Inputs Recebidos pelo Campo (Preservados com Integridade):
                      </span>
                      <pre className="text-[11px] text-zinc-300 whitespace-pre-wrap">
                        {JSON.stringify(errItem.capturedInputs, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{errItem.recoveryNotice || 'O contratempo foi sanado com sucesso.'}</span>
                    </span>
                    <span className="text-zinc-400 font-mono text-[10px]">ID: {errItem.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Exibição do Print da Tela do Erro */}
      {selectedSnapshotError && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>Print Forense da Tela de Erro & Inputs</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  {selectedSnapshotError.componentName} • ID: {selectedSnapshotError.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSnapshotError(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-black">
              {selectedSnapshotError.screenshotBase64 ? (
                <img
                  src={selectedSnapshotError.screenshotBase64}
                  alt="Print Forense da Tela de Erro"
                  className="w-full h-auto max-h-[460px] object-contain"
                />
              ) : (
                <div className="py-16 text-center text-zinc-500 font-mono text-xs">
                  Snapshot gráfico indisponível
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-zinc-400 font-mono">
                Destinatário de Alerta: <strong className="text-white">v.torresko2015@gmail.com</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedSnapshotError(null)}
                className="bg-[#1A1F71] hover:bg-[#121652] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visão 1: Tabela de Intercorrências */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto">
          {incidents.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Nenhuma intercorrência operacional registrada.</p>
              <p className="text-xs text-zinc-400 mt-1">Todos os parâmetros e inputs estão operando em condições nominais estáveis.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase tracking-wider font-mono text-[10px]">
                  <th className="py-3 px-3">Data / Hora</th>
                  <th className="py-3 px-3">Campo Identificado</th>
                  <th className="py-3 px-3">Parâmetro Recebido (Raw)</th>
                  <th className="py-3 px-3">Valor Encapsulado</th>
                  <th className="py-3 px-3">Status Fiduciário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
                {incidents.map(inc => (
                  <tr key={inc.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-3 text-zinc-500 whitespace-nowrap">
                      {new Date(inc.timestamp).toLocaleTimeString('pt-BR')} ({new Date(inc.timestamp).toLocaleDateString('pt-BR')})
                    </td>
                    <td className="py-3 px-3 font-bold text-zinc-900 dark:text-zinc-100">
                      {inc.fieldId}
                    </td>
                    <td className="py-3 px-3 text-red-500 max-w-xs truncate" title={inc.receivedParam}>
                      {inc.receivedParam}
                    </td>
                    <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-bold">
                      {inc.sanitizedParam}
                    </td>
                    <td className="py-3 px-3 text-emerald-700 dark:text-emerald-300">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        O contratempo foi sanado com sucesso
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Visão 2: Arquivo .txt Bruto com Trava em 15 Linguagens */}
      {viewMode === 'raw_txt' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Arquivo inerte protegido com cabeçalho de autoexecução em 15 linguagens (Bash, Linux Sh, BAT, PowerShell, Python, JS, C, C++, Rust, Go, Java, Ruby, PHP, Perl, Lua):</span>
            <button
              onClick={() => handleCopy(txtContent)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#1A1F71] dark:text-indigo-400 hover:underline cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>
          </div>
          <pre className="p-4 bg-zinc-950 text-zinc-300 rounded-2xl font-mono text-[11px] max-h-96 overflow-y-auto whitespace-pre-wrap border border-zinc-800 selection:bg-indigo-900 selection:text-white">
            {txtContent}
          </pre>
        </div>
      )}

      {/* Visão 3: Docker Compose Leve para Emulação Linux */}
      {viewMode === 'docker' && (
        <div className="space-y-4">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300">
            <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-2">
              <Terminal className="w-4 h-4 text-emerald-500" />
              <span>Emulação de Máquina Linux Leve (Alpine ~5MB / 32MB RAM)</span>
            </h4>
            <p className="leading-relaxed">
              Para analisar o arquivo de intercorrências em um ambiente Linux conteinerizado isolado que não pesa na máquina, utilize a especificação Docker Compose abaixo. Ela cria um worker passivo estritamente de leitura em Alpine Linux com consumo inferior a 32MB de memória RAM.
            </p>
          </div>

          <div className="relative">
            <pre className="p-4 bg-zinc-950 text-emerald-400 rounded-2xl font-mono text-[11px] overflow-x-auto border border-zinc-800">
              {dockerComposeCode}
            </pre>
            <button
              onClick={() => handleCopy(dockerComposeCode)}
              className="absolute top-3 right-3 bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            Execute no terminal: <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-800 dark:text-zinc-200">docker compose -f docker-compose.audit.yml up -d</code>
          </div>
        </div>
      )}
    </div>
  );
};
