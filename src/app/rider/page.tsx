'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bike,
  ShieldCheck,
  Star,
  PackageCheck,
  TrendingUp,
  MapPin,
  Phone,
  Clock,
  LogOut,
  Sparkles,
  ChevronRight,
  User,
  Mail,
  Lock,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Edit3,
  X,
  PlusCircle,
  Truck,
  ArrowRight,
  Utensils,
  Check,
  Compass,
} from 'lucide-react';
import type { SafeRider } from '@/lib/db';
import { DELIVERY_LOCATIONS } from '@/lib/constants';
import Toast from '@/components/Toast';

export default function RiderPortalPage() {
  const router = useRouter();

  // Rider Auth State
  const [rider, setRider] = useState<SafeRider | null>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auth Forms State (when not logged in)
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [loginIdentifier, setLoginIdentifier] = useState('rider@kheyenow.com');
  const [loginPassword, setLoginPassword] = useState('123456');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Signup State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regVehicleType, setRegVehicleType] = useState('Motorcycle');
  const [regVehicleNumber, setRegVehicleNumber] = useState('');
  const [regLicense, setRegLicense] = useState('');
  const [regNid, setRegNid] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Profile Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editVehicleType, setEditVehicleType] = useState('Motorcycle');
  const [editVehicleNumber, setEditVehicleNumber] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLocation, setEditLocation] = useState('Dhanmondi');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Show Toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Check current rider session
  const fetchRiderData = async () => {
    try {
      const res = await fetch('/api/rider/profile');
      const json = await res.json();
      if (json.success && json.rider) {
        setRider(json.rider);
        setDeliveries(json.deliveries || []);
      } else {
        setRider(null);
      }
    } catch {
      setRider(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiderData();
  }, []);

  // Handle Rider Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch('/api/rider/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword }),
      });
      const data = await res.json();

      if (data.success) {
        setRider(data.rider);
        showToast('Welcome back, Captain! Signed in successfully.');
        await fetchRiderData();
      } else {
        setLoginError(data.error || 'Failed to sign in');
      }
    } catch {
      setLoginError('A network error occurred. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Rider Signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegLoading(true);

    try {
      const res = await fetch('/api/rider/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: regName,
          email: regEmail,
          phone_number: regPhone,
          password: regPassword,
          vehicle_type: regVehicleType,
          vehicle_number: regVehicleNumber,
          driving_license: regLicense,
          nid_number: regNid,
          address: regAddress,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setRider(data.rider);
        showToast('Rider account activated! Welcome to the Kheye Now fleet.');
        await fetchRiderData();
      } else {
        setRegError(data.error || 'Failed to register as rider');
      }
    } catch {
      setRegError('A network error occurred. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  // Handle Status Toggle (Available / On Delivery / Offline)
  const handleStatusChange = async (newStatus: string) => {
    if (!rider) return;
    try {
      const res = await fetch('/api/rider/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setRider({ ...rider, status: newStatus });
        showToast(`Status changed to ${newStatus}`);
      }
    } catch {
      showToast('Could not update status', 'error');
    }
  };

  // Handle Order Status Update (e.g. Picked Up, Delivered)
  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch('/api/rider/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Order #${orderId} marked as ${status}!`);
        if (data.rider) setRider(data.rider);
        await fetchRiderData();
      } else {
        showToast(data.error || 'Failed to update order', 'error');
      }
    } catch {
      showToast('Network error updating delivery', 'error');
    }
  };

  // Handle Direct Location Change (triggers order assignment if available)
  const handleLocationChange = async (newLocation: string) => {
    if (!rider) return;
    try {
      const res = await fetch('/api/rider/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: newLocation }),
      });
      const data = await res.json();
      if (data.success) {
        setRider({ ...rider, location: newLocation });
        showToast(`Delivery zone updated to ${newLocation}!`);
        await fetchRiderData();
      }
    } catch {
      showToast('Could not update delivery zone', 'error');
    }
  };

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rider) return;
    setUpdatingProfile(true);

    try {
      const res = await fetch('/api/rider/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: editPhone,
          vehicle_type: editVehicleType,
          vehicle_number: editVehicleNumber,
          address: editAddress,
          location: editLocation,
          avatar_url: editAvatarUrl,
        }),
      });
      const data = await res.json();
      if (data.success && data.rider) {
        setRider(data.rider);
        setIsEditModalOpen(false);
        showToast('Profile updated successfully');
        await fetchRiderData();
      }
    } catch {
      showToast('Failed to update profile', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    setRider(null);
    setDeliveries([]);
    showToast('Signed out from Rider Portal');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b12] text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center animate-spin">
            <Bike className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-emerald-300">Loading Rider Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-sans">
      
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4">
          <div className={`px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 ${
            toast.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
          }`}>
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Rider Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-emerald-500/20 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.35)]">
              <Bike className="w-5 h-5 text-slate-950" />
            </div>
            <div className="flex flex-col">
              <span className="font-brand font-black text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 uppercase">
                Kheye Now!
              </span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest -mt-1">
                Rider Portal
              </span>
            </div>
          </Link>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
            Fleet Engine
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-400 hover:text-emerald-300 transition-colors hidden sm:block"
          >
            ← Back to Store
          </Link>

          {rider && (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ====================================================================
            VIEW 1: RIDER NOT LOGGED IN -> DEDICATED RIDER LOGIN & SIGNUP
           ==================================================================== */}
        {!rider ? (
          <div className="max-w-md mx-auto my-6">
            
            {/* Intro Hero Banner */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-4 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <ShieldCheck className="w-4 h-4" />
                <span>Dedicated Delivery Partner Portal</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Ride with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Kheye Now!</span>
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-sm mx-auto">
                Deliver delicious meals across Dhaka, earn high delivery commissions, and track your portfolio in real time.
              </p>
            </div>

            {/* Tab Selector */}
            <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-900/90 border border-emerald-500/25 mb-6">
              <button
                type="button"
                onClick={() => setAuthTab('signin')}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  authTab === 'signin'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Rider Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthTab('signup')}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  authTab === 'signup'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Join as Rider
              </button>
            </div>

            {/* Quick Demo Login Preset Helper */}
            {authTab === 'signin' && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-300">Demo Rider Credentials:</p>
                  <p className="text-[11px] text-slate-400">rider@kheyenow.com | Pass: 123456</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLoginIdentifier('rider@kheyenow.com');
                    setLoginPassword('123456');
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-slate-950 transition-all"
                >
                  Autofill
                </button>
              </div>
            )}

            {/* Login Form */}
            {authTab === 'signin' ? (
              <form onSubmit={handleLogin} className="p-6 rounded-3xl bg-slate-900/70 border border-emerald-500/25 backdrop-blur-xl shadow-2xl space-y-4">
                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Email or Phone Number
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-emerald-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. rider@kheyenow.com or 01800000000"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/20 focus:border-emerald-400 text-sm text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-emerald-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/20 focus:border-emerald-400 text-sm text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full mt-2 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loginLoading ? 'Authenticating Rider...' : 'Access Rider Portfolio'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* Signup Form */
              <form onSubmit={handleSignup} className="p-6 rounded-3xl bg-slate-900/70 border border-emerald-500/25 backdrop-blur-xl shadow-2xl space-y-3.5">
                {regError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahim Ahmed"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/20 focus:border-emerald-400 text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="rider@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/20 focus:border-emerald-400 text-sm text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Phone</label>
                    <input
                      type="tel"
                      required
                      placeholder="018XXXXXXXX"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/20 focus:border-emerald-400 text-sm text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/20 focus:border-emerald-400 text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Vehicle Type</label>
                    <select
                      value={regVehicleType}
                      onChange={(e) => setRegVehicleType(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/20 focus:border-emerald-400 text-sm text-white focus:outline-none"
                    >
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="Bicycle">Bicycle</option>
                      <option value="Scooter">Scooter</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Vehicle Plate No.</label>
                    <input
                      type="text"
                      placeholder="e.g. Metro-HA-11-22"
                      value={regVehicleNumber}
                      onChange={(e) => setRegVehicleNumber(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/20 focus:border-emerald-400 text-sm text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Driving License</label>
                    <input
                      type="text"
                      placeholder="DL-XXXXXX"
                      value={regLicense}
                      onChange={(e) => setRegLicense(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/20 focus:border-emerald-400 text-sm text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">National NID</label>
                    <input
                      type="text"
                      placeholder="NID number"
                      value={regNid}
                      onChange={(e) => setRegNid(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/20 focus:border-emerald-400 text-sm text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Base Delivery Area / Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Dhanmondi, Mirpur, Dhaka"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/20 focus:border-emerald-400 text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full mt-3 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {regLoading ? 'Registering Rider...' : 'Register & Start Delivering'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        ) : (
          /* ====================================================================
             VIEW 2: RIDER LOGGED IN -> COMPREHENSIVE RIDER PORTFOLIO
             ==================================================================== */
          <div className="space-y-8">
            
            {/* Top Identity Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/50 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                
                {/* Rider Bio */}
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-400 p-0.5 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
                      {rider.avatar_url ? (
                        <img src={rider.avatar_url} alt={rider.full_name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
                          <Bike className="w-10 h-10 text-emerald-400" />
                        </div>
                      )}
                    </div>
                    <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-950 ${
                      rider.status === 'Available' ? 'bg-emerald-400' : rider.status === 'On Delivery' ? 'bg-amber-400' : 'bg-slate-500'
                    }`} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{rider.full_name}</h1>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 border border-emerald-400 text-emerald-300">
                        Verified Rider
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        {rider.phone_number}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Bike className="w-3.5 h-3.5 text-emerald-400" />
                        {rider.vehicle_type} ({rider.vehicle_number || 'Registered'})
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-300 font-medium">
                        <Compass className="w-3.5 h-3.5 text-emerald-400" />
                        Active Zone: {rider.location || 'Dhanmondi'}
                      </span>
                      {rider.address && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                            {rider.address}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Toggle, Zone Selector & Edit Profile Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                  {/* Location Selector */}
                  <div className="flex items-center bg-slate-950 rounded-2xl px-3 py-1.5 border border-emerald-500/30 gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <select
                      value={rider.location || 'Dhanmondi'}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                    >
                      {DELIVERY_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc} className="bg-slate-900 text-white">
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Dropdown / Toggle */}
                  <div className="flex items-center bg-slate-950 rounded-2xl p-1 border border-emerald-500/30">
                    {(['Available', 'On Delivery', 'Offline'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          rider.status === st
                            ? st === 'Available'
                              ? 'bg-emerald-500 text-slate-950 shadow-md'
                              : st === 'On Delivery'
                              ? 'bg-amber-500 text-slate-950 shadow-md'
                              : 'bg-slate-700 text-white shadow-md'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setEditPhone(rider.phone_number || '');
                      setEditVehicleType(rider.vehicle_type || 'Motorcycle');
                      setEditVehicleNumber(rider.vehicle_number || '');
                      setEditAddress(rider.address || '');
                      setEditLocation(rider.location || 'Dhanmondi');
                      setEditAvatarUrl(rider.avatar_url || '');
                      setIsEditModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-2xl text-xs font-bold bg-slate-900 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-400 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                </div>

              </div>
            </div>

            {/* ================================================================
                PORTFOLIO KPI PERFORMANCE METRICS
               ================================================================ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              
              {/* Deliveries Completed */}
              <div className="p-5 rounded-3xl bg-slate-900/60 border border-emerald-500/20 backdrop-blur-xl shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Deliveries</p>
                  <p className="text-3xl font-black text-white mt-1">{rider.total_deliveries}</p>
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    Fleet Star Performer
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <PackageCheck className="w-6 h-6 text-emerald-400" />
                </div>
              </div>

              {/* Rider Rating */}
              <div className="p-5 rounded-3xl bg-slate-900/60 border border-emerald-500/20 backdrop-blur-xl shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Rating</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-3xl font-black text-white">{Number(rider.rating).toFixed(1)}</p>
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 mt-1 block">
                    Top 5% Rider Quality
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <Star className="w-6 h-6 text-amber-400" />
                </div>
              </div>

              {/* Lifetime Earnings */}
              <div className="p-5 rounded-3xl bg-slate-900/60 border border-emerald-500/20 backdrop-blur-xl shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Lifetime Earnings</p>
                  <p className="text-3xl font-black text-emerald-400 mt-1">৳{Number(rider.earnings).toLocaleString()}</p>
                  <span className="text-[11px] font-semibold text-emerald-400/80 mt-1 block">
                    +৳50 per completed run
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-emerald-400" />
                </div>
              </div>

              {/* On-Time Rate */}
              <div className="p-5 rounded-3xl bg-slate-900/60 border border-emerald-500/20 backdrop-blur-xl shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">On-Time Arrival</p>
                  <p className="text-3xl font-black text-white mt-1">98.4%</p>
                  <span className="text-[11px] font-semibold text-emerald-400 mt-1 block">
                    Avg 22 min delivery time
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-teal-400" />
                </div>
              </div>

            </div>

            {/* ================================================================
                ACTIVE DELIVERIES & DISPATCH QUEUE
               ================================================================ */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Truck className="w-5 h-5 text-emerald-400" />
                    Delivery Tasks & Dispatch Queue
                  </h2>
                  <p className="text-xs text-slate-400">
                    Live orders assigned to your route or available for instant pickup.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                  {deliveries.length} active run{deliveries.length !== 1 ? 's' : ''}
                </span>
              </div>

              {deliveries.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-emerald-500/20 backdrop-blur-xl">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                    <Bike className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-base font-bold text-white">No pending deliveries right now</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Keep your status set to "Available". When new customer orders are placed, they will show up here instantly!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {deliveries.map((order) => {
                    const isDelivered = order.status === 'Delivered';
                    const isPickedUp = order.status === 'Picked Up' || order.status === 'On the Way';

                    return (
                      <div
                        key={order.id}
                        className="rounded-3xl bg-slate-900/70 border border-emerald-500/25 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4"
                      >
                        {/* Order Header */}
                        <div>
                          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/15">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                #{order.id}
                              </span>
                              <span className="text-xs text-slate-400">
                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                              isDelivered
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400'
                                : isPickedUp
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-400'
                                : 'bg-teal-500/20 text-teal-300 border border-teal-400'
                            }`}>
                              {order.status}
                            </span>
                          </div>

                          {/* Customer & Address */}
                          <div className="mt-3 space-y-2">
                            <div className="flex items-start gap-2.5">
                              <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Delivery Destination</p>
                                <p className="text-sm font-semibold text-white">{order.delivery_address}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <div className="flex items-center gap-2 text-xs text-slate-300">
                                <User className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="font-semibold">{order.customer_name}</span>
                              </div>
                              <a
                                href={`tel:${order.phone_number}`}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold transition-all"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{order.phone_number}</span>
                              </a>
                            </div>

                            {order.order_notes && (
                              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-emerald-500/15 text-xs text-slate-300">
                                <strong className="text-emerald-400 font-semibold">Note:</strong> {order.order_notes}
                              </div>
                            )}
                          </div>

                          {/* Items Ordered & Selected Add-ons */}
                          <div className="mt-4 pt-3 border-t border-emerald-500/15">
                            <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2">
                              Package Items & Add-Ons:
                            </p>
                            <div className="space-y-2">
                              {order.items?.map((it: any, idx: number) => (
                                <div key={idx} className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                                  <div className="flex items-center justify-between text-xs font-bold text-white">
                                    <span>{it.quantity}x {it.food_name}</span>
                                    <span className="text-emerald-300">৳{it.price * it.quantity}</span>
                                  </div>

                                  {/* Render Multiple Add-ons Attached to this order-item */}
                                  {it.addons && it.addons.length > 0 && (
                                    <div className="mt-1.5 pl-3 border-l-2 border-emerald-500/40 space-y-1">
                                      {it.addons.map((ad: any, adIdx: number) => (
                                        <div key={adIdx} className="flex items-center justify-between text-[11px] text-slate-300">
                                          <span className="text-emerald-300 font-medium">+ {ad.addon_name}</span>
                                          <span className="text-slate-400 font-semibold">৳{ad.price}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Order Footer & Actions */}
                        <div className="pt-3 border-t border-emerald-500/15">
                          <div className="flex items-center justify-between mb-3 text-xs">
                            <span className="text-slate-400">Total Bill ({order.payment_method}):</span>
                            <span className="font-extrabold text-base text-emerald-400">৳{order.total_amount}</span>
                          </div>

                          {/* Delivery Action Buttons */}
                          {!isDelivered && (
                            <div className="flex gap-2">
                              {!isPickedUp ? (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'Picked Up')}
                                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-amber-500/20 border border-amber-500 text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition-all flex items-center justify-center gap-1.5"
                                >
                                  <Bike className="w-3.5 h-3.5" />
                                  <span>Mark as Picked Up</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'Delivered')}
                                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Mark as Delivered (+৳50)</span>
                                </button>
                              )}
                            </div>
                          )}

                          {isDelivered && (
                            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-center text-xs font-bold flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Delivered Successfully • Earned ৳50</span>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
              <h3 className="text-base font-bold text-white">Update Rider Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/20 focus:border-emerald-400 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Vehicle Type</label>
                  <select
                    value={editVehicleType}
                    onChange={(e) => setEditVehicleType(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/20 focus:border-emerald-400 text-sm text-white focus:outline-none"
                  >
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Scooter">Scooter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Vehicle Plate</label>
                  <input
                    type="text"
                    value={editVehicleNumber}
                    onChange={(e) => setEditVehicleNumber(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/20 focus:border-emerald-400 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Delivery Zone / Location</label>
                <select
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/20 focus:border-emerald-400 text-sm text-white focus:outline-none"
                >
                  {DELIVERY_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/20 focus:border-emerald-400 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Avatar Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/20 focus:border-emerald-400 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 transition-all flex items-center justify-center gap-1"
                >
                  {updatingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
