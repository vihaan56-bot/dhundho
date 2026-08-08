import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Sparkles, Key, Mail, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { loginUser } = useInventory();
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(''); // User entered OTP
  const [generatedOtp, setGeneratedOtp] = useState(''); // System generated OTP
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Timer logic for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setLoading(true);

    // Generate a secure 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          otp: code,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOtpSent(true);
        setResendTimer(60); // 60s cooldown
      } else {
        throw new Error(data.error || 'Failed to send OTP. Please check your credentials.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Network error. Could not send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otpCode === '888888' || otpCode === generatedOtp) {
      // Allow fallback 888888 for testing convenience, or match generated OTP
      loginUser(email.trim());
    } else {
      setError('Invalid verification code. Please check and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#05070c] flex items-center justify-center py-6 px-4">
      {/* Mobile-style Frame */}
      <div className="w-full max-w-md bg-[#090d16] border border-gray-900/60 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col p-6 gap-6 py-8">
        
        {/* Soft background glows */}
        <div className="absolute -top-10 -left-10 w-44 h-44 bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-pink-500/10 rounded-full blur-3xl -z-10"></div>

        {/* Logo Header */}
        <div className="text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-2xl text-white shadow-xl shadow-indigo-600/35 mb-3">
            D
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight leading-none mb-1">
            Dhundho
          </h1>
          <p className="text-gray-400 text-xs font-semibold tracking-wide uppercase">
            Bas poochho, cheez mil jayegi
          </p>
        </div>

        {/* Info Box */}
        <div className="glass-panel rounded-2xl p-4 text-center">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
            Secure Entry
          </span>
          <p className="text-xs text-gray-300 leading-relaxed font-medium">
            Keep your inventory private. Verify your email to access your mapped spaces.
          </p>
        </div>

        {/* Error panel */}
        {error && (
          <div className="p-3.5 bg-red-950/20 border border-red-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-red-400 font-semibold animate-slide-up">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* FORM STATE 1: REQUEST OTP */}
        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide px-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-gray-800 text-white text-sm focus:outline-none focus:border-indigo-500/50 disabled:opacity-50"
                />
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-750 text-white font-bold text-sm shadow-lg shadow-indigo-600/10 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  Send OTP Code <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* FORM STATE 2: VERIFY OTP */
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5 animate-slide-up">
            <div className="flex flex-col gap-1.5 text-center">
              <span className="text-xs text-gray-400">
                OTP sent to <span className="text-white font-bold">{email}</span>
              </span>
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 underline"
              >
                Change Email Address
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide text-center">
                Enter 6-Digit OTP
              </label>
              <div className="relative max-w-[200px] mx-auto">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full text-center tracking-[8px] font-bold text-lg py-3 rounded-2xl bg-slate-900 border border-gray-800 text-white focus:outline-none focus:border-indigo-500/50"
                />
                <Key className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-750 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-md active:scale-98 transition-all cursor-pointer"
              >
                Verify Code & Login
              </button>

              <button
                type="button"
                disabled={resendTimer > 0 || loading}
                onClick={handleSendOtp}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 disabled:text-gray-600 transition-colors py-1.5"
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend OTP Email'}
              </button>
            </div>
          </form>
        )}

        {/* Footer Slogan */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Dhundho remembers where you keep things</span>
        </div>
      </div>
    </div>
  );
};
