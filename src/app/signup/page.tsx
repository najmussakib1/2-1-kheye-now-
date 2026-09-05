'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Utensils,
  Eye,
  EyeOff,
  User,
  Phone,
  MapPin,
  Mail,
  Lock,
  Sparkles,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Store,
  FileText,
  Tag,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

const CATEGORIES_LIST = [
  'Fast Food',
  'Juice',
  'Desi Feast',
  'Burgers',
  'Pizza',
  'Pasta',
  'Desserts',
  'Beverages',
  'Bakery',
  'Healthy & Salad',
];

export default function SignupPage() {
  const router = useRouter();
  const { refreshUser, showToast } = useApp();

  const [accountType, setAccountType] = useState<'user' | 'restaurant'>('user');

  // Customer Form
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    address: '',
    gender: '',
    email: '',
    password: '',
  });

  // Restaurant Form
  const [restData, setRestData] = useState({
    name: '',
    owner_name: '',
    email: '',
    phone_number: '',
    address: '',
    password: '',
  });
  const [restTradeLicence, setRestTradeLicence] = useState('');
  const [restCategories, setRestCategories] = useState<string[]>(['Fast Food', 'Juice']);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleRestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRestData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const toggleCategory = (cat: string) => {
    setRestCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleTradeLicenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRestTradeLicence(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit User Signup
  const handleUserSubmit = async (e: React.FormEvent) => {
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
        showToast('Welcome to Kheye Now!', 'success');
        setTimeout(() => router.push('/'), 1200);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Restaurant Signup
  const handleRestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (restCategories.length === 0) {
      setError('Please select at least one food category for your restaurant');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/restaurant/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...restData,
          trade_licence_url: restTradeLicence,
          categories: restCategories,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Registration failed. Please try again.');
      } else {
        setSuccess(true);
        await refreshUser();
        showToast(`Welcome ${json.restaurant.name}! Opening Dashboard.`, 'success');
        setTimeout(() => router.push('/restaurant/dashboard'), 1200);
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

      <div className="w-full max-w-lg relative z-10">
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
          className="rounded-3xl p-7 sm:p-8 relative shadow-2xl"
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
                {accountType === 'restaurant' ? 'Partner Registration' : 'Customer Account'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              {accountType === 'restaurant' ? 'Register Restaurant' : 'Join Kheye Now!'}
            </h1>
          </div>

          {/* Account Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 mb-6 rounded-2xl bg-slate-900/90 border border-emerald-500/20">
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
              <span>Restaurant Partner</span>
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-5 px-4 py-3 rounded-xl border border-emerald-400/50 bg-emerald-500/10 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-emerald-300">Registration successful! Redirecting…</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl border border-rose-500/40 bg-rose-500/10 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-rose-300">{error}</span>
            </div>
          )}

          {accountType === 'user' ? (
            /* CUSTOMER SIGNUP FORM */
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleUserChange}
                    placeholder="e.g. Md. Sakib Rahman"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 bg-slate-900/80 border border-emerald-500/25 focus:outline-none focus:border-emerald-400 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleUserChange}
                      placeholder="e.g. 01712345678"
                      required
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 bg-slate-900/80 border border-emerald-500/25 focus:outline-none focus:border-emerald-400 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Gender</label>
                  <div className="relative">
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70 pointer-events-none" />
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleUserChange}
                      className="w-full px-3 py-2.5 rounded-xl text-xs text-white bg-slate-900/80 border border-emerald-500/25 focus:outline-none focus:border-emerald-400 transition-all appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-slate-900">Select Gender</option>
                      <option value="Male" className="bg-slate-900">Male</option>
                      <option value="Female" className="bg-slate-900">Female</option>
                      <option value="Other" className="bg-slate-900">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Delivery Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-emerald-500/70" />
                  <textarea
                    rows={2}
                    name="address"
                    value={formData.address}
                    onChange={handleUserChange}
                    placeholder="House, Road, Area, City"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 bg-slate-900/80 border border-emerald-500/25 focus:outline-none focus:border-emerald-400 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleUserChange}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 bg-slate-900/80 border border-emerald-500/25 focus:outline-none focus:border-emerald-400 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleUserChange}
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
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

              <button
                type="submit"
                disabled={loading || success}
                className="w-full py-3.5 rounded-2xl font-bold text-slate-950 text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2 bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                    <span>Creating Account…</span>
                  </>
                ) : (
                  <>
                    <span>Create Customer Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* RESTAURANT SIGNUP FORM */
            <form onSubmit={handleRestSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Restaurant Name *</label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                    <input
                      type="text"
                      name="name"
                      value={restData.name}
                      onChange={handleRestChange}
                      placeholder="e.g. Chillox Banani"
                      required
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 bg-slate-900/80 border border-emerald-500/25 focus:outline-none focus:border-emerald-400 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Owner Name *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                    <input
                      type="text"
                      name="owner_name"
                      value={restData.owner_name}
                      onChange={handleRestChange}
                      placeholder="Full Name"
                      required
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 bg-slate-900/80 border border-emerald-500/25 focus:outline-none focus:border-emerald-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Restaurant Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                    <input
                      type="email"
                      name="email"
                      value={restData.email}
                      onChange={handleRestChange}
                      placeholder="contact@restaurant.com"
                      required
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 bg-slate-900/80 border border-emerald-500/25 focus:outline-none focus:border-emerald-400 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                    <input
                      type="tel"
                      name="phone_number"
                      value={restData.phone_number}
                      onChange={handleRestChange}
                      placeholder="017xxxxxxxx"
                      required
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 bg-slate-900/80 border border-emerald-500/25 focus:outline-none focus:border-emerald-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Full Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-emerald-500/70" />
                  <textarea
                    rows={2}
                    name="address"
                    value={restData.address}
                    onChange={handleRestChange}
                    placeholder="Road, Block, Area, City"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 bg-slate-900/80 border border-emerald-500/25 focus:outline-none focus:border-emerald-400 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Trade Licence Upload */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Upload Trade Licence</span>
                  <span className="text-[10px] text-emerald-400 font-normal">PDF / Image</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 cursor-pointer hover:border-emerald-400 transition-all">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-300 truncate">
                    {restTradeLicence ? '✓ Document Uploaded' : 'Select Trade Licence Document...'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleTradeLicenceUpload}
                  />
                </label>
              </div>

              {/* Categories */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Categories Offered *</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES_LIST.map((cat) => {
                    const selected = restCategories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          selected
                            ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                            : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '}
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={restData.password}
                    onChange={handleRestChange}
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
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

              <button
                type="submit"
                disabled={loading || success}
                className="w-full py-3.5 rounded-2xl font-bold text-slate-950 text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2 bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                    <span>Registering Restaurant…</span>
                  </>
                ) : (
                  <>
                    <span>Register Restaurant Partner</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Link */}
          <p className="text-center text-xs text-slate-500 mt-6">
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
