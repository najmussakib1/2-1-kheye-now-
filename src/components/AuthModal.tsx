'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import {
  X,
  Lock,
  Mail,
  Phone,
  User,
  MapPin,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Utensils,
  Store,
  FileText,
  Tag,
} from 'lucide-react';

const AVAILABLE_CATEGORIES = [
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

export default function AuthModal() {
  const {
    isAuthModalOpen,
    authModalInitialTab,
    authModalInitialRole,
    closeAuthModal,
    refreshUser,
    handleAuthSuccess,
    showToast,
  } = useApp();
  const router = useRouter();

  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [accountType, setAccountType] = useState<'user' | 'restaurant'>('user');

  // Customer Sign In
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Customer Sign Up
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpAddress, setSignUpAddress] = useState('');
  const [signUpGender, setSignUpGender] = useState('prefer-not-to-say');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Restaurant Sign Up
  const [restName, setRestName] = useState('');
  const [restOwnerName, setRestOwnerName] = useState('');
  const [restEmail, setRestEmail] = useState('');
  const [restPhone, setRestPhone] = useState('');
  const [restAddress, setRestAddress] = useState('');
  const [restTradeLicence, setRestTradeLicence] = useState('');
  const [restCategories, setRestCategories] = useState<string[]>(['Fast Food', 'Juice']);
  const [restPassword, setRestPassword] = useState('');
  const [showRestPassword, setShowRestPassword] = useState(false);

  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync initial tab & role
  useEffect(() => {
    if (isAuthModalOpen) {
      setTab(authModalInitialTab || 'signin');
      setAccountType(authModalInitialRole || 'user');
      setError(null);
      setSuccessMsg(null);
      setLoading(false);
    }
  }, [isAuthModalOpen, authModalInitialTab, authModalInitialRole]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) closeAuthModal();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const toggleCategory = (cat: string) => {
    setRestCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // Handle Trade Licence Upload
  const handleTradeLicenceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Sign In submit
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: signInIdentifier,
          password: signInPassword,
          role: accountType,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Invalid credentials');
        setLoading(false);
      } else {
        setSuccessMsg(
          json.role === 'restaurant'
            ? 'Signed in as Restaurant Partner! Redirecting to Dashboard...'
            : 'Signed in successfully! Continuing...'
        );
        await refreshUser();
        showToast(
          json.role === 'restaurant'
            ? `Welcome, ${json.restaurant.name}! Opening Dashboard.`
            : 'Signed in successfully!',
          'success'
        );

        setTimeout(() => {
          if (json.role === 'restaurant') {
            closeAuthModal();
            router.push('/restaurant/dashboard');
          } else {
            handleAuthSuccess();
          }
        }, 600);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // Customer Sign Up submit
  const handleCustomerSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: signUpFullName,
          phone_number: signUpPhone,
          email: signUpEmail,
          address: signUpAddress,
          gender: signUpGender,
          password: signUpPassword,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Failed to create account');
        setLoading(false);
      } else {
        setSuccessMsg('Account created successfully! Continuing...');
        await refreshUser();
        showToast('Welcome to Kheye Now!', 'success');
        setTimeout(() => {
          handleAuthSuccess();
        }, 600);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // Restaurant Sign Up submit
  const handleRestaurantSignUp = async (e: React.FormEvent) => {
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
          name: restName,
          owner_name: restOwnerName,
          email: restEmail,
          phone_number: restPhone,
          address: restAddress,
          trade_licence_url: restTradeLicence,
          categories: restCategories,
          password: restPassword,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Failed to register restaurant');
        setLoading(false);
      } else {
        setSuccessMsg('Restaurant registered successfully! Redirecting to Dashboard...');
        await refreshUser();
        showToast(`Welcome ${json.restaurant.name}! Your partner portal is ready.`, 'success');
        setTimeout(() => {
          closeAuthModal();
          router.push('/restaurant/dashboard');
        }, 800);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={closeAuthModal}
      />

      {/* Modal Card */}
      <div
        className="relative z-10 w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/25 animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: 'rgba(9, 13, 22, 0.96)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(16,185,129,0.1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/20 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              {accountType === 'restaurant' ? (
                <Store className="w-5 h-5 text-emerald-400" />
              ) : (
                <Utensils className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                {tab === 'signin' ? 'Sign In' : 'Create Account'}
              </h2>
              <p className="text-xs text-slate-400">
                {accountType === 'restaurant' ? 'Restaurant Partner Portal' : 'Customer Account'}
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account Type Toggle (Customer vs Restaurant) */}
        <div className="px-6 pt-3">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-900/80 border border-emerald-500/20">
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
        </div>

        {/* Tab Switcher (Sign In vs Sign Up) */}
        <div className="flex border-b border-emerald-500/15 bg-slate-950/40 p-1 mx-6 mt-3 rounded-2xl">
          <button
            type="button"
            onClick={() => { setTab('signin'); setError(null); }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'signin'
                ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setError(null); }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'signup'
                ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Modal Body / Scroll Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. SIGN IN FORM (Both Customer and Restaurant) */}
          {tab === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              {accountType === 'restaurant' && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                  <span>Demo Restaurant: <strong>basic_restaurant</strong></span>
                  <span>Pass: <strong>123456</strong></span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {accountType === 'restaurant' ? 'Restaurant Name, Email or Phone' : 'Email or Phone Number'}
                </label>
                <div className="relative">
                  {accountType === 'restaurant' ? (
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                  ) : (
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                  )}
                  <input
                    type="text"
                    required
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                    placeholder={accountType === 'restaurant' ? 'e.g. basic_restaurant or rest@mail.com' : 'e.g. 01712345678 or user@mail.com'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                  <input
                    type={showSignInPassword ? 'text' : 'password'}
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition-colors"
                  >
                    {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || Boolean(successMsg)}
                className="w-full mt-3 py-3 rounded-xl font-bold text-slate-950 text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.35)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                    <span>Signing In…</span>
                  </>
                ) : (
                  <>
                    <span>{accountType === 'restaurant' ? 'Sign In to Restaurant Portal' : 'Sign In & Continue'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : accountType === 'user' ? (
            /* 2. CUSTOMER SIGN UP */
            <form onSubmit={handleCustomerSignUp} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                  <input
                    type="text"
                    required
                    value={signUpFullName}
                    onChange={(e) => setSignUpFullName(e.target.value)}
                    placeholder="e.g. Sakib Ahmed"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Phone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                    <input
                      type="tel"
                      required
                      value={signUpPhone}
                      onChange={(e) => setSignUpPhone(e.target.value)}
                      placeholder="017xxxxxxxx"
                      className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                    <input
                      type="email"
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="you@mail.com"
                      className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Default Delivery Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-emerald-500/70" />
                  <textarea
                    rows={2}
                    value={signUpAddress}
                    onChange={(e) => setSignUpAddress(e.target.value)}
                    placeholder="House, Road, Area, City"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                  <input
                    type={showSignUpPassword ? 'text' : 'password'}
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-11 py-2 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition-colors"
                  >
                    {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || Boolean(successMsg)}
                className="w-full mt-3 py-3 rounded-xl font-bold text-slate-950 text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.35)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                    <span>Creating Account…</span>
                  </>
                ) : (
                  <>
                    <span>Create & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* 3. RESTAURANT PARTNER SIGN UP */
            <form onSubmit={handleRestaurantSignUp} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Restaurant Name *
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                    <input
                      type="text"
                      required
                      value={restName}
                      onChange={(e) => setRestName(e.target.value)}
                      placeholder="e.g. Chillox Banani"
                      className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Owner Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                    <input
                      type="text"
                      required
                      value={restOwnerName}
                      onChange={(e) => setRestOwnerName(e.target.value)}
                      placeholder="Owner / Manager name"
                      className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Restaurant Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                    <input
                      type="email"
                      required
                      value={restEmail}
                      onChange={(e) => setRestEmail(e.target.value)}
                      placeholder="partner@restaurant.com"
                      className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Official Phone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                    <input
                      type="tel"
                      required
                      value={restPhone}
                      onChange={(e) => setRestPhone(e.target.value)}
                      placeholder="017xxxxxxxx"
                      className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Restaurant Full Address *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-emerald-500/70" />
                  <textarea
                    rows={2}
                    required
                    value={restAddress}
                    onChange={(e) => setRestAddress(e.target.value)}
                    placeholder="Road, Block, Area, City (e.g. House 12, Road 11, Banani, Dhaka)"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Trade Licence Upload */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Upload Trade Licence Document</span>
                  <span className="text-[10px] text-emerald-400 font-normal">PDF / Image</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 cursor-pointer hover:border-emerald-400 transition-all">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-300 truncate">
                    {restTradeLicence ? '✓ Document Uploaded' : 'Choose Trade Licence file...'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleTradeLicenceFile}
                  />
                </label>
              </div>

              {/* Category Selection Pills */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Food Categories Offered *</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_CATEGORIES.map((cat) => {
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
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                  <input
                    type={showRestPassword ? 'text' : 'password'}
                    required
                    value={restPassword}
                    onChange={(e) => setRestPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-11 py-2 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRestPassword(!showRestPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition-colors"
                  >
                    {showRestPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || Boolean(successMsg)}
                className="w-full mt-3 py-3 rounded-xl font-bold text-slate-950 text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.35)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                    <span>Registering Restaurant…</span>
                  </>
                ) : (
                  <>
                    <span>Register Restaurant & Open Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
