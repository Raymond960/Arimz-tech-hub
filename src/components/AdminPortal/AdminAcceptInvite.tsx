import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, CheckCircle2, AlertCircle, Loader2, ArrowRight, Mail, KeyRound } from 'lucide-react';

interface AdminAcceptInviteProps {
  token: string;
  onSuccess: (authToken: string) => void;
  onBackToApp: () => void;
}

interface InviteInfo {
  email: string;
  name: string;
  role: string;
  title: string;
}

export const AdminAcceptInvite: React.FC<AdminAcceptInviteProps> = ({
  token,
  onSuccess,
  onBackToApp
}) => {
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function verifyToken() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/invite/verify?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setInviteInfo({
            email: data.email,
            name: data.name,
            role: data.role,
            title: data.title
          });
        } else {
          setError(data.message || data.error || 'Invalid or expired invitation link.');
        }
      } catch {
        setError('Network error verifying invitation token.');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      verifyToken();
    } else {
      setError('No invitation token provided.');
      setLoading(false);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (password.length < 6) {
      setSubmitError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match. Please retype carefully.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();
      if (res.ok && data.success && data.token) {
        setCompleted(true);
        setTimeout(() => {
          onSuccess(data.token);
        }, 1500);
      } else {
        setSubmitError(data.message || data.error || 'Failed to complete password setup.');
      }
    } catch {
      setSubmitError('Network error completing password setup.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020C1B] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#04142F] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Background Decorative Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FFC928]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-[#FFC928]/10 border border-[#FFC928]/30 px-3 py-1 rounded-full text-[#FFC928] text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>Shendam Connect Admin</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Accept Invitation</h1>
          <p className="text-xs text-[#9BAABD] mt-1">Official Local Government Administrator Portal</p>
        </div>

        {loading && (
          <div className="py-12 text-center text-[#9BAABD] space-y-3">
            <Loader2 className="w-8 h-8 text-[#FFC928] animate-spin mx-auto" />
            <p className="text-sm">Verifying invitation link...</p>
          </div>
        )}

        {!loading && error && (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Invitation Unavailable</h3>
              <p className="text-xs text-rose-300 mt-1">{error}</p>
            </div>
            <button
              onClick={onBackToApp}
              className="mt-2 text-xs font-bold text-[#FFC928] hover:underline"
            >
              Return to Shendam Connect
            </button>
          </div>
        )}

        {!loading && !error && inviteInfo && !completed && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Admin Details Card */}
            <div className="bg-[#061D40] border border-white/10 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <Mail className="w-4 h-4 text-[#FFC928]" />
                <span>{inviteInfo.name}</span>
              </div>
              <p className="text-[#9BAABD] pl-6">{inviteInfo.email}</p>
              <div className="pl-6 pt-1 flex items-center gap-2">
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                  {inviteInfo.role}
                </span>
                <span className="text-[#9BAABD] text-[11px]">{inviteInfo.title}</span>
              </div>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#9BAABD]">Create Account Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#9BAABD] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#061D40] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#9BAABD]/60 focus:outline-none focus:border-[#FFC928]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#9BAABD]">Confirm Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#9BAABD] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#061D40] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#9BAABD]/60 focus:outline-none focus:border-[#FFC928]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#FFC928] hover:bg-[#ffe066] text-[#04142F] font-black py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Setting Up Account...</span>
                </>
              ) : (
                <>
                  <span>Activate Admin Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {completed && (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Welcome Aboard!</h3>
              <p className="text-xs text-emerald-300 mt-1">Your password has been saved. Redirecting to Admin Dashboard...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
