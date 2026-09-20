import React, { useState } from 'react';
import { COLLECTED_DATA_FIELDS } from '../services/zyconomesEngine';
import { 
  Database, 
  Lock, 
  Send, 
  Mail, 
  ArrowRight, 
  ShieldAlert, 
  Cpu, 
  CheckCircle2, 
  Layers, 
  Radio, 
  Server,
  FileCode,
  Sparkles
} from 'lucide-react';

export const DataFlowDiagram: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      id: 1,
      name: '1. Ingestão HTTP & Borda',
      service: 'API Gateway / Express',
      protocol: 'HTTPS POST /api/cadastro',
      description: 'Recebe os dados brutos de formulário do investidor. Valida schema de entrada, formata RFC 5322 e injeta x-correlation-id na requisição.',
      payloadSample: {
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': 'c8f39a12-8e42-4f91-b3b4-934c2194b802'
        },
        body: {
          email: 'investidor@zyconomes.com.br',
          nome_completo: 'Carlos Eduardo Mendes',
          cpf: '123.456.789-00',
          senha_plana: 'SenhaForte#2026'
        }
      }
    },
    {
      id: 2,
      name: '2. Sanitização & PBKDF2',
      service: 'Auth Service (Core)',
      protocol: 'Crypto libuv ThreadPool',
      description: 'O CPF é normalizado e a senha plana é imediatamente destruída e convertida em hash seguro usando PBKDF2 com 100.000 iterações e salt aleatório de 32 bytes.',
      payloadSample: {
        cpf_formatado: '12345678900',
        salt_hex: 'a98f12cb8491024de71029481b49c0d1',
        senha_hash_pbkdf2: '$pbkdf2-sha512$i=100000$a98f12...$9f8234ab8e0192',
        status_inicial: 'PENDENTE_OTP'
      }
    },
    {
      id: 3,
      name: '3. Trava de Idempotência',
      service: 'Redis Instance',
      protocol: 'RESP3: SETNX idemp:cad:{email}',
      description: 'Executa comando atômico SETNX no Redis com chave única e TTL de 300 segundos. Se retornar 0 (chave já existe), rejeita imediatamente com HTTP 409 Conflict antes de tocar no banco de dados.',
      payloadSample: {
        redis_command: 'SET idemp:cad:investidor@zyconomes.com.br "PROCESSING" EX 300 NX',
        result: 'OK',
        duplicate_protection: 'ATIVADA (Zero risco de duplo cadastro)'
      }
    },
    {
      id: 4,
      name: '4. Persistência Multiplexada',
      service: 'PgBouncer + PostgreSQL',
      protocol: 'PostgreSQL Wire (Port 6432)',
      description: 'Envia a query parametrizada de INSERT através do pool de conexões do PgBouncer. Utiliza connection pooling transacional para manter o PostgreSQL abaixo de 100 conexões físicas.',
      payloadSample: {
        sql_statement: 'INSERT INTO users (id, email, nome_completo, cpf_hash, senha_hash, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id',
        pool_client_id: 'pgb_client_#4912',
        database_latency: '4.8ms'
      }
    },
    {
      id: 5,
      name: '5. Publicação no Broker',
      service: 'RabbitMQ Core',
      protocol: 'AMQP 0-9-1 (Direct Exchange)',
      description: 'Publica o evento UsuarioCadastrado na exchange zyconomes_exchange roteado para a fila fila_emails_cadastro com headers de correlation_id e configurações de Dead Letter Exchange.',
      payloadSample: {
        exchange: 'zyconomes_exchange',
        routing_key: 'usuario.cadastrado',
        message_properties: {
          correlation_id: 'c8f39a12-8e42-4f91-b3b4-934c2194b802',
          delivery_mode: 2, // Persistent
          content_type: 'application/json'
        },
        payload: {
          user_id: 'usr_84920419481',
          email: 'investidor@zyconomes.com.br',
          nome: 'Carlos Eduardo Mendes'
        }
      }
    },
    {
      id: 6,
      name: '6. Consumo & Disparo de OTP',
      service: 'Worker de E-mails / SMTP',
      protocol: 'Async Consumer (Prefetch 50)',
      description: 'Worker assíncrono consome a mensagem da fila, gera o código OTP criptográfico de 6 dígitos (ex: 839201) com TTL de 10 minutos no Redis e dispara e-mail via gateway SMTP com confirmação ACK.',
      payloadSample: {
        otp_gerado: '849201',
        redis_otp_key: 'otp:usr_84920419481',
        smtp_status: '250 2.0.0 Message queued for delivery',
        ack_sent: true
      }
    },
    {
      id: 7,
      name: '7. Falhas & Dead Letter Queue',
      service: 'zyconomes_emails_dlq',
      protocol: 'DLX Fallback Route',
      description: 'Caso o serviço de envio falhe 3 vezes consecutivas (ex: indisponibilidade do provedor de e-mail), a mensagem é automaticamente roteada para a Dead Letter Queue para inspeção e reprocessamento sem travar a fila principal.',
      payloadSample: {
        dlx_exchange: 'zyconomes_dlx',
        failed_reason: 'SMTP Connection Timeout after 3 retries',
        reprocessed: false,
        action: 'Alerta disparado no Slack / Grafana'
      }
    }
  ];

  const currentStepData = steps.find(s => s.id === activeStep) || steps[0];

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="bg-[#0A0A0A] border border-[#222] p-4">
        <div className="flex items-center gap-2 text-blue-500 font-bold text-[10px] uppercase tracking-widest mb-1.5">
          <Layers className="w-3 h-3 text-blue-500" />
          DATA FLOW MAP & INFORMATION DICTIONARY
        </div>
        <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">
          Data Lifecycle: From HTTP Ingest to Async DLQ Dispatch
        </h2>
        <p className="text-[9px] text-zinc-500 mt-1 max-w-3xl uppercase tracking-widest">
          Track step-by-step how each collected field transits asynchronously, securely, and idempotently through all nodes of the Zyconomes ecosystem.
        </p>

        {/* Step Navigation Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-5">
          {steps.map((step) => {
            const isSelected = step.id === activeStep;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`p-3 border text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-[#111]'
                    : 'border-[#333] bg-black hover:bg-[#111]'
                }`}
              >
                <div className="text-[9px] uppercase tracking-widest text-zinc-500">{step.service}</div>
                <div className={`text-[10px] font-bold mt-1 line-clamp-1 uppercase tracking-widest ${isSelected ? 'text-blue-500' : 'text-zinc-200'}`}>
                  {step.name.split('. ')[1] || step.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Inspector Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono">
        {/* Left: Step Description & Context */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border border-[#222] bg-[#0A0A0A] p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div>
                <span className="text-[9px] font-bold bg-[#111] text-blue-500 border border-blue-500/30 px-2 py-0.5 uppercase tracking-widest">
                  STEP 0{currentStepData.id} OF 07
                </span>
                <h3 className="text-sm font-bold text-zinc-100 mt-2 uppercase tracking-widest">
                  {currentStepData.name}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Protocol</span>
                <div className="text-[10px] font-bold text-zinc-200 uppercase tracking-widest">
                  {currentStepData.protocol}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                Execution Context:
              </span>
              <p className="text-[10px] text-zinc-300 leading-relaxed bg-black p-3 border border-[#333]">
                {currentStepData.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-black p-2.5 border border-[#333]">
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest">EXECUTING SERVICE</div>
                <div className="text-[10px] font-bold text-blue-500 mt-1 uppercase tracking-widest">{currentStepData.service}</div>
              </div>
              <div className="bg-black p-2.5 border border-[#333]">
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest">TECHNICAL GUARANTEE</div>
                <div className="text-[10px] font-bold text-emerald-500 mt-1 uppercase tracking-widest">Idempotent / Non-Blocking</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Exact Payload & Data Transformation */}
        <div className="lg:col-span-7">
          <div className="border border-[#222] bg-[#0A0A0A] overflow-hidden h-full flex flex-col">
            <div className="px-4 py-3 bg-black border-b border-[#222] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-widest">
                  Data Structure & In-Transit Payload (JSON)
                </span>
              </div>
              <span className="text-[9px] text-emerald-500 bg-[#111] px-2 py-0.5 border border-emerald-500/30 font-bold uppercase tracking-widest">
                VALIDATED SCHEMA
              </span>
            </div>

            <div className="p-4 bg-black text-[9px] text-zinc-300 flex-1 overflow-x-auto">
              <pre className="leading-relaxed text-blue-400">
                {JSON.stringify(currentStepData.payloadSample, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Exact Collected Data Dictionary Table */}
      <div className="border border-[#222] bg-[#0A0A0A] overflow-hidden">
        <div className="px-5 py-3.5 bg-black border-b border-[#222] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-3 h-3 text-blue-500" />
            <h3 className="text-[10px] font-bold text-zinc-200 uppercase tracking-widest">
              Official Data Dictionary & Security Policies
            </h3>
          </div>
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
            8 Monitored Attributes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[9px] uppercase tracking-widest">
            <thead className="bg-[#111] text-zinc-500 border-b border-[#222]">
              <tr>
                <th className="p-3 font-bold">Field / Attribute</th>
                <th className="p-3 font-bold">Data Type</th>
                <th className="p-3 font-bold">Validation Rule / Hashing</th>
                <th className="p-3 font-bold">Security Level</th>
                <th className="p-3 font-bold">Destination & Persistence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222] bg-black">
              {COLLECTED_DATA_FIELDS.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#111] transition-colors">
                  <td className="p-3 font-bold text-blue-500">{item.field}</td>
                  <td className="p-3 text-zinc-500">{item.type}</td>
                  <td className="p-3 text-zinc-300">{item.validationRule}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 font-bold ${
                      item.securityLevel.includes('Crítico') || item.securityLevel.includes('Sensível')
                        ? 'bg-[#111] text-red-500 border border-red-500/30'
                        : item.securityLevel.includes('Metadado') || item.securityLevel.includes('Controle')
                        ? 'bg-[#111] text-blue-500 border border-blue-500/30'
                        : 'bg-[#111] text-zinc-400 border border-[#333]'
                    }`}>
                      {item.securityLevel}
                    </span>
                  </td>
                  <td className="p-3 text-zinc-500">{item.destination}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
