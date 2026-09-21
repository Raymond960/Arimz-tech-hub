import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (token: string, admin: { email: string; role: string; title: string }) => void;
  onBackToApp: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToApp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please provide both administrator email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed. Unauthorized access.');
      }

      onLoginSuccess(data.token, data.admin);
    } catch (err: any) {
      setErrorMessage(err.message || 'Server error while verifying administrator credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#04142F] flex flex-col justify-center items-center p-4 sm:p-6 text-white relative">
      {/* Decorative backdrop elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#0B2D5C]/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-[#FFC928]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#08254D] border border-white/16 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-[#FFC928]/15 border border-[#FFC928]/30 text-[#FFC928] rounded-2xl mx-auto flex items-center justify-center shadow-inner">
            <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white font-brand-sans">
            Shendam Connect
          </h1>
          <p className="text-xs font-semibold text-[#FFC928] tracking-wider uppercase">
            Shendam Connect Admin Portal
          </p>
        </div>

        {errorMessage && (
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs p-3.5 rounded-2xl flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1.5">
              Authorized Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#9BAABD] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@shendamconnect.gov.ng"
                className="w-full bg-[#04142F] border border-white/16 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-[#9BAABD]/60 outline-none focus:border-[#FFC928] transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider">
                Administrator Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9BAABD] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#04142F] border border-white/16 rounded-2xl pl-10 pr-11 py-3 text-xs sm:text-sm text-white placeholder-[#9BAABD]/60 outline-none focus:border-[#FFC928] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9BAABD] hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#FFC928] hover:bg-[#F5B800] active:scale-98 text-[#04142F] font-black text-sm rounded-2xl shadow-[0_4px_16px_rgba(255,201,40,0.35)] flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>Verifying Admin Credentials...</span>
            ) : (
              <>
                <span>Sign In as Shendam Connect Admin</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-white/10 flex items-center justify-center text-xs">
          <button
            type="button"
            onClick={onBackToApp}
            className="text-[#9BAABD] hover:text-white transition cursor-pointer py-1"
          >
            Back to Public App
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-[#9BAABD]/80">
        <p>Shendam Connect • Digital Tourism & Commerce Platform</p>
        <p className="text-[10px] mt-1 text-[#9BAABD]/60">Authorized Shendam Connect Administrators Only</p>
      </div>
    </div>
  );
};
