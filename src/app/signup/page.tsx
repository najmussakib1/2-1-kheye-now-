'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Utensils, Eye, EyeOff, User, Phone, MapPin, Mail, Lock, Sparkles, ChevronDown, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function SignupPage() {
  const router = useRouter();
  const { refreshUser } = useApp();

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    address: '',
    gender: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Registration failed. Please try again.');
      } else {
        setSuccess(true);
        await refreshUser();
        setTimeout(() => router.push('/'), 1500);
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
      style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(16,185,129,0.08) 0%, #090d16 60%), #090d16' }}
    >
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.05) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/10 border border-emerald-400/50 flex items-center justify-center group-hover:scale-110 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Utensils className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="font-brand font-black text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 uppercase">
            KHEYE NOW!
          </span>
        </Link>

        {/* Glass Card */}
        <div
          className="rounded-3xl p-8 relative"
          style={{
            background: 'rgba(9, 13, 22, 0.75)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            boxShadow: '0 8px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(16,185,129,0.08)',
          }}
        >
          {/* Card Header */}
          <div className="mb-7">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Create Account</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Join Kheye Now!</h1>
            <p className="text-slate-400 text-sm mt-1">Sign up for faster ordering and exclusive offers.</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-5 px-4 py-3 rounded-xl border border-emerald-400/50 bg-emerald-500/10 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-emerald-300">Account created! Redirecting you to home…</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl border border-rose-500/40 bg-rose-500/10 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-rose-300">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Md. Sakib Rahman"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-1 focus:ring-emerald-500/60"
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(16,185,129,0.2)',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(16,185,129,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(16,185,129,0.2)')}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="e.g. 01712345678"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(16,185,129,0.2)',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(16,185,129,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(16,185,129,0.2)')}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="House, Road, Area, City"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(16,185,129,0.2)',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(16,185,129,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(16,185,129,0.2)')}
                />
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Gender</label>
              <div className="relative">
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70 pointer-events-none" />
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all appearance-none cursor-pointer"
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(16,185,129,0.2)',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(16,185,129,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(16,185,129,0.2)')}
                >
                  <option value="" style={{ background: '#090d16' }}>Select Gender</option>
                  <option value="Male" style={{ background: '#090d16' }}>Male</option>
                  <option value="Female" style={{ background: '#090d16' }}>Female</option>
                  <option value="Other" style={{ background: '#090d16' }}>Other / Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">E-mail Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(16,185,129,0.2)',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(16,185,129,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(16,185,129,0.2)')}
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-11 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(16,185,129,0.2)',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(16,185,129,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(16,185,129,0.2)')}
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
              className="w-full py-3.5 rounded-2xl font-bold text-slate-950 text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{
                background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                boxShadow: '0 0 24px rgba(16,185,129,0.35)',
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                  <span>Creating Account…</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link href="/signin" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
