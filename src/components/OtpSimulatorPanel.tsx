import React, { useState, useEffect } from 'react';
import { Lock, Timer, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const OtpSimulatorPanel: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(300);
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState<'IDLE' | 'ACTIVE' | 'BLOCKED' | 'SUCCESS'>('IDLE');
  const [message, setMessage] = useState('');

  // Timer loop
  useEffect(() => {
    let interval: any;
    if (status === 'ACTIVE' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && status === 'ACTIVE') {
      setStatus('IDLE');
      setMessage('SYSTEM: OTP EXPIRED (REMOVED FROM REDIS)');
    }
    return () => clearInterval(interval);
  }, [status, timeLeft]);

  const handleRequestOtp = () => {
    if (!email) {
      setMessage('EMAIL REQUIRED FOR OTP');
      return;
    }
    setStatus('ACTIVE');
    setTimeLeft(300);
    setAttempts(0);
    setMessage('SYSTEM: OTP GENERATED & STORED IN REDIS (TTL: 300s)');
  };

  const handleVerifyOtp = () => {
    if (status !== 'ACTIVE') return;

    if (otpCode === '123456') { // Mock success code
      setStatus('SUCCESS');
      setMessage('SYSTEM: OTP MATCH. USER ACTIVE. REDIS KEY DESTROYED.');
      setOtpCode('');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setStatus('BLOCKED');
        setMessage('SYSTEM: BRUTE FORCE DETECTED. IP/EMAIL BLOCKED (429 TOO MANY REQUESTS).');
      } else {
        setMessage(`SYSTEM: INVALID OTP. ATTEMPTS: ${newAttempts}/3`);
      }
    }
  };

  return (
    <div className="border border-[#222] bg-[#0A0A0A] p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-[#222] pb-3">
        <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
          <Lock className="w-3 h-3" />
          <span>MFA & 2FA Control (Redis Time-To-Live)</span>
        </div>
        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">POST /api/v1/auth/otp</span>
      </div>

      <div className="space-y-3 font-mono text-[10px]">
        {/* State Visualizer */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-black border border-[#222] flex items-center justify-between">
            <span className="text-zinc-500 uppercase tracking-widest">Redis TTL</span>
            <span className={`text-lg font-bold ${status === 'ACTIVE' ? 'text-amber-500' : 'text-zinc-600'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="p-3 bg-black border border-[#222] flex items-center justify-between">
            <span className="text-zinc-500 uppercase tracking-widest">Attempts</span>
            <span className={`text-lg font-bold ${attempts >= 3 ? 'text-red-500' : 'text-emerald-500'}`}>
              {attempts}/3
            </span>
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="font-bold text-zinc-500 uppercase tracking-widest block mb-1">Target Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#111] border border-[#333] px-3 py-2 text-zinc-200 focus:border-emerald-500 focus:outline-none uppercase"
              placeholder="user@zyconomes.com"
            />
          </div>
          <button
            onClick={handleRequestOtp}
            className="px-4 py-2 bg-[#111] hover:bg-[#222] border border-emerald-500/50 text-emerald-500 font-bold transition-colors"
          >
            DISPATCH OTP
          </button>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="font-bold text-zinc-500 uppercase tracking-widest block mb-1">6-Digit Code (Use '123456' for success)</label>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              maxLength={6}
              disabled={status !== 'ACTIVE'}
              className="w-full bg-[#111] border border-[#333] px-3 py-2 text-zinc-200 focus:border-amber-500 focus:outline-none tracking-[0.5em] text-center"
              placeholder="------"
            />
          </div>
          <button
            onClick={handleVerifyOtp}
            disabled={status !== 'ACTIVE' || !otpCode}
            className="px-4 py-2 bg-black border border-amber-500/50 text-amber-500 hover:bg-amber-500/10 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            VERIFY
          </button>
        </div>

        {/* Feedback Message */}
        {message && (
          <div className={`p-3 border mt-4 text-[9px] uppercase tracking-widest ${
            status === 'SUCCESS' ? 'bg-[#111] border-emerald-500/50 text-emerald-500' :
            status === 'BLOCKED' ? 'bg-[#111] border-red-500/50 text-red-500' :
            'bg-[#111] border-amber-500/50 text-amber-500'
          }`}>
            <div className="flex items-center gap-1.5 font-bold">
              {status === 'SUCCESS' ? <CheckCircle2 className="w-3 h-3" /> :
               status === 'BLOCKED' ? <ShieldAlert className="w-3 h-3" /> :
               <Timer className="w-3 h-3" />}
              {message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
