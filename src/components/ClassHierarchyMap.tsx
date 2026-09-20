import React, { useState } from 'react';
import { CLASS_HIERARCHY_DATA } from '../services/zyconomesEngine';
import { 
  Cpu, 
  Layers, 
  GitFork, 
  Terminal, 
  Code2, 
  CheckCircle, 
  ShieldCheck, 
  Activity, 
  Share2, 
  ArrowRight,
  Database
} from 'lucide-react';

export const ClassHierarchyMap: React.FC = () => {
  const [selectedClassIndex, setSelectedClassIndex] = useState<number>(1);
  const selectedClass = CLASS_HIERARCHY_DATA[selectedClassIndex];

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="bg-[#0A0A0A] border border-[#222] p-4">
        <div className="flex items-center gap-2 text-purple-500 font-bold text-[10px] uppercase tracking-widest mb-1.5">
          <GitFork className="w-3 h-3 text-purple-500" />
          SYSTEM ARCHITECTURE & PROCEDURAL PROTOCOLS
        </div>
        <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">
          Structural Map & Interface Contracts
        </h2>
        <p className="text-[9px] text-zinc-500 mt-1 max-w-3xl uppercase tracking-widest">
          Object-oriented hierarchy with Inversion of Control (IoC), ensuring Single Responsibility Principle (SRP) and high testability without microservices overhead.
        </p>
      </div>

      {/* Class Explorer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Class Hierarchy List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">
            System Classes & Modules:
          </div>
          {CLASS_HIERARCHY_DATA.map((cls, idx) => {
            const isSelected = idx === selectedClassIndex;
            return (
              <button
                key={idx}
                onClick={() => setSelectedClassIndex(idx)}
                className={`w-full text-left p-3 border transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-purple-500 bg-[#111]'
                    : 'border-[#333] bg-black hover:bg-[#111]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[10px] text-zinc-200">
                    class {cls.className}
                  </span>
                  <span className="text-[9px] text-zinc-600">
                    #{idx + 1}
                  </span>
                </div>
                <div className="text-[9px] text-purple-500 truncate mt-1">
                  {cls.module}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Selected Class Detailed Contract */}
        <div className="lg:col-span-8 space-y-4">
          <div className="border border-[#222] bg-[#0A0A0A] p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#222] pb-3 gap-2">
              <div>
                <span className="text-[9px] text-purple-500 bg-black px-2 py-0.5 border border-purple-500 uppercase tracking-widest font-bold">
                  {selectedClass.module}
                </span>
                <h3 className="text-sm font-bold text-zinc-100 mt-2">
                  class {selectedClass.className}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Design Pattern</span>
                <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                  Clean Architecture / SRP
                </div>
              </div>
            </div>

            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                Single Responsibility:
              </span>
              <p className="text-[10px] text-zinc-300 leading-relaxed bg-[#111] p-3 border border-[#333]">
                {selectedClass.responsibility}
              </p>
            </div>

            {/* Methods Contract */}
            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                Methods & Procedural Signatures:
              </span>
              <div className="space-y-1.5 mt-2">
                {selectedClass.methods.map((method, i) => (
                  <div key={i} className="bg-[#111] p-2 border border-[#333] flex items-start gap-2">
                    <span className="text-purple-500 text-[10px] mt-0.5">ƒ</span>
                    <code className="text-[10px] text-zinc-300 break-all">
                      {method}
                    </code>
                  </div>
                ))}
              </div>
            </div>

            {/* Relations */}
            <div className="pt-3 border-t border-[#222]">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                Relations & Dependency Injection:
              </span>
              <p className="text-[9px] text-zinc-400 mt-1 bg-black p-2 border border-[#333]">
                {selectedClass.relations}
              </p>
            </div>
          </div>

          {/* Procedural Protocol Flow Chart */}
          <div className="border border-[#222] bg-[#0A0A0A] p-4 space-y-3">
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-3 h-3 text-emerald-500" />
              PROCEDURAL EXECUTION PROTOCOL: POST /api/cadastro
            </div>
            <pre className="text-[9px] bg-black p-4 text-zinc-400 overflow-x-auto border border-[#333] leading-relaxed">
{`1. Client Request ──▶ AuthController.cadastrarUsuario(req, res)
2. BaseHttpController.extractCorrelationId(req) ──▶ x-correlation-id generated/validated
3. IdempotencyGuard.acquireLock("idemp:cad:" + email, 300)
     ├── FALSE ──▶ Return HTTP 409 Conflict (Lock Exists)
     └── TRUE  ──▶ Proceed
4. PgBouncerConnectionPool.query("INSERT INTO users ...") ──▶ Execute in Postgres
5. RabbitMQExchangeProducer.publishEvent("zyconomes_exchange", "usuario.cadastrado", payload)
6. BaseHttpController.sendSuccess(res, { userId, correlationId }, 201) [Return < 35ms]
7. Async: EmailWorkerConsumer.processMessage() ──▶ Dispatch OTP via SMTP
     └── On persistent failure ──▶ DeadLetterHandler.captureFailedMessage()`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
