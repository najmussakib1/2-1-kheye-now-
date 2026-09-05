'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Utensils,
  Store,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  User,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function SigninPage() {
  const router = useRouter();
  const { refreshUser, showToast } = useApp();

  const [accountType, setAccountType] = useState<'user' | 'restaurant'>('user');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, role: accountType }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Sign in failed. Please try again.');
      } else {
        setSuccess(true);
        await refreshUser();
        showToast(
          json.role === 'restaurant'
            ? `Welcome ${json.restaurant.name}! Opening Dashboard.`
            : 'Signed in successfully!',
          'success'
        );
        setTimeout(() => {
          if (json.role === 'restaurant') {
            router.push('/restaurant/dashboard');
          } else {
            router.push('/');
          }
        }, 1200);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(16,185,129,0.08) 0%, #090d16 60%), #090d16' }}
    >
      {/* Background Ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.05) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-6 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/10 border border-emerald-400/50 flex items-center justify-center group-hover:scale-110 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Utensils className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="font-brand font-black text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 uppercase">
            KHEYE NOW!
          </span>
        </Link>

        {/* Glass Card */}
        <div
          className="rounded-3xl p-7 relative shadow-2xl"
          style={{
            background: 'rgba(9, 13, 22, 0.85)',
            backdropFilter: 'blur(28px)',
            border: '1px solid rgba(16, 185, 129, 0.22)',
            boxShadow: '0 8px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(16,185,129,0.1)',
          }}
        >
          {/* Card Header */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                {accountType === 'restaurant' ? 'Restaurant Portal' : 'Customer Account'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Sign In</h1>
          </div>

          {/* Account Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 mb-5 rounded-2xl bg-slate-900/90 border border-emerald-500/20">
            <button
              type="button"
              onClick={() => { setAccountType('user'); setError(null); }}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                accountType === 'user'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              onClick={() => { setAccountType('restaurant'); setError(null); }}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                accountType === 'restaurant'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Restaurant</span>
            </button>
          </div>

          {accountType === 'restaurant' && (
            <div className="mb-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-300 flex items-center justify-between">
              <span>Demo Rest: <strong>basic_restaurant</strong></span>
              <span>Pass: <strong>123456</strong></span>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="mb-5 px-4 py-3 rounded-xl border border-emerald-400/50 bg-emerald-500/10 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-emerald-300">Signed in! Redirecting…</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl border border-rose-500/40 bg-rose-500/10 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-rose-300">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identifier */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {accountType === 'restaurant' ? 'Restaurant Name, Email or Phone' : 'E-mail or Phone Number'}
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {accountType === 'restaurant' ? (
                    <Store className="w-4 h-4 text-emerald-500/70" />
                  ) : (
                    <Mail className="w-4 h-4 text-emerald-500/70" />
                  )}
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError(null); }}
                  placeholder={accountType === 'restaurant' ? 'basic_restaurant or partner@mail.com' : 'you@example.com or 01712345678'}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 bg-slate-900/80 border border-emerald-500/25 focus:outline-none focus:border-emerald-400 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 bg-slate-900/80 border border-emerald-500/25 focus:outline-none focus:border-emerald-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3.5 rounded-2xl font-bold text-slate-950 text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2 bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                  <span>Signing In…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center text-xs text-slate-500 mt-5">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
