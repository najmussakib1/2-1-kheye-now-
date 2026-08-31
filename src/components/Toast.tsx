'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toast, hideToast } = useApp();

  if (!toast) return null;

  const isSuccess = toast.type === 'success' || !toast.type;
  const isError = toast.type === 'error';
  const isInfo = toast.type === 'info';

  return (
    <div className="fixed bottom-6 right-6 z-[100] max-w-sm w-full px-4 pointer-events-none">
      <div
        className="pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5 duration-300"
        style={{
          background: 'rgba(9, 13, 22, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: isError
            ? '1px solid rgba(244, 63, 94, 0.4)'
            : isInfo
            ? '1px solid rgba(59, 130, 246, 0.4)'
            : '1px solid rgba(16, 185, 129, 0.4)',
          boxShadow: isError
            ? '0 10px 35px rgba(244, 63, 94, 0.25)'
            : isInfo
            ? '0 10px 35px rgba(59, 130, 246, 0.25)'
            : '0 10px 35px rgba(16, 185, 129, 0.25)',
        }}
      >
        {/* Icon */}
        <div
          className={`p-2 rounded-xl flex-shrink-0 ${
            isError
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : isInfo
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}
        >
          {isError ? (
            <AlertCircle className="w-5 h-5" />
          ) : isInfo ? (
            <Info className="w-5 h-5" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-snug break-words">
            {toast.message}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={hideToast}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
