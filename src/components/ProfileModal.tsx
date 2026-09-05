'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Camera,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Save,
  ArrowLeft,
  Calendar,
} from 'lucide-react';

export default function ProfileModal() {
  const { isProfileModalOpen, profileModalMode, closeProfileModal, user, refreshUser, showToast } = useApp();
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  // Form State
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync mode with props
  useEffect(() => {
    if (isProfileModalOpen) {
      setMode(profileModalMode || 'view');
      if (user) {
        setFullName(user.full_name || '');
        setPhoneNumber(user.phone_number || '');
        setAddress(user.address || '');
        setGender(user.gender || 'prefer-not-to-say');
        setAvatarUrl(user.avatar_url || '');
      }
      setError(null);
    }
  }, [isProfileModalOpen, profileModalMode, user]);

  if (!isProfileModalOpen || !user) return null;

  // Handle Image Upload as Data URL
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (< 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Profile picture must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
          address: address.trim(),
          gender,
          avatar_url: avatarUrl,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Failed to update profile');
      } else {
        await refreshUser();
        showToast('Profile updated successfully!', 'success');
        setMode('view');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // User Initials
  const getInitials = () => {
    if (!user?.full_name) return 'U';
    const parts = user.full_name.trim().split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={closeProfileModal}
      />

      {/* Modal Container */}
      <div
        className="relative z-10 w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/25 animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: 'rgba(9, 13, 22, 0.96)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          boxShadow: '0 25px 70px rgba(0,0,0,0.8), inset 0 1px 0 rgba(16,185,129,0.12)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/20 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                {mode === 'view' ? 'User Profile' : 'Edit Profile'}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'view' ? 'Your personal details on Kheye Now!' : 'Update your personal info & avatar'}
              </p>
            </div>
          </div>
          <button
            onClick={closeProfileModal}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Top Avatar Banner */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative group">
              {/* Profile Image / Initials */}
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName || user.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-black text-slate-950">{getInitials()}</span>
                )}
              </div>

              {/* Upload Button in Edit Mode */}
              {mode === 'edit' && (
                <label className="absolute bottom-0 right-0 p-2 rounded-full bg-slate-950 border border-emerald-400 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 cursor-pointer shadow-lg transition-all">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileChange}
                  />
                </label>
              )}
            </div>

            {mode === 'view' ? (
              <div className="mt-3">
                <h3 className="text-xl font-bold text-white">{user.full_name}</h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mt-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Customer Account</span>
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-2">Click the camera icon to upload a new profile picture</p>
            )}
          </div>

          {/* VIEW MODE */}
          {mode === 'view' ? (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-emerald-500/15">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Email Address</p>
                    <p className="text-white font-semibold">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-emerald-500/15">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Phone Number</p>
                    <p className="text-white font-semibold">{user.phone_number}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-emerald-500/15">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Default Delivery Address</p>
                    <p className="text-white font-semibold leading-relaxed">
                      {user.address || <span className="text-slate-500 italic">No address provided yet</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-emerald-500/15">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Gender</p>
                    <p className="text-white font-semibold capitalize">{user.gender || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setMode('edit')}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-slate-950 text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          ) : (
            /* EDIT MODE */
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Delivery Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House #, Road #, Area, City"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-sm text-white focus:outline-none focus:border-emerald-400 transition-all"
                >
                  <option value="prefer-not-to-say" className="bg-slate-900">Prefer not to say</option>
                  <option value="male" className="bg-slate-900">Male</option>
                  <option value="female" className="bg-slate-900">Female</option>
                  <option value="other" className="bg-slate-900">Other</option>
                </select>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="flex-1 py-3 rounded-xl font-semibold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-950 text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] disabled:opacity-60"
                >
                  {loading ? (
                    <span>Saving…</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
