'use client';

import React, { useEffect, useRef } from 'react';
import { X, ShoppingBag, Minus, Plus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';

export default function CartSidebar() {
  const {
    cartItems,
    cartTotal,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    startPlaceOrderFlow,
  } = useApp();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [closeCart]);

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const deliveryFee = cartItems.length > 0 ? 40 : 0;
  const grandTotal = cartTotal + deliveryFee;

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm"
        onClick={closeCart}
        aria-label="Close cart"
      />

      {/* Sidebar Drawer */}
      <div
        className="fixed top-0 right-0 z-[70] h-full w-full max-w-md flex flex-col"
        style={{
          background: 'rgba(9, 13, 22, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(16, 185, 129, 0.25)',
          boxShadow: '-4px 0 60px rgba(0,0,0,0.6), inset 1px 0 0 rgba(16,185,129,0.08)',
          animation: 'cartSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Your Cart</h2>
              <p className="text-xs text-slate-400 font-medium">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-300 transition-all"
              >
                Clear All
              </button>
            )}
            <button
              onClick={closeCart}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
                <ShoppingCart className="w-9 h-9 text-emerald-500/50" />
              </div>
              <p className="text-slate-300 font-semibold text-lg">Your cart is empty</p>
              <p className="text-slate-500 text-sm mt-1">Add items from the menu to get started!</p>
              <button
                onClick={closeCart}
                className="mt-6 px-6 py-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/30 transition-all"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            cartItems.map((ci) => (
              <div
                key={ci.food.id}
                className="group flex gap-3 p-3.5 rounded-2xl border border-emerald-500/15 hover:border-emerald-500/30 transition-all"
                style={{ background: 'rgba(15, 23, 42, 0.65)' }}
              >
                {/* Food Image */}
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-900">
                  <img
                    src={ci.food.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80'}
                    alt={ci.food.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white leading-tight line-clamp-1">{ci.food.name}</p>
                  <p className="text-xs text-emerald-400 font-semibold mt-0.5">{ci.food.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 bg-slate-900/80 border border-emerald-500/20 rounded-xl p-0.5">
                      <button
                        onClick={() => updateQuantity(ci.food.id, ci.quantity - 1)}
                        className="p-1 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-bold text-white">{ci.quantity}</span>
                      <button
                        onClick={() => updateQuantity(ci.food.id, ci.quantity + 1)}
                        className="p-1 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-black text-emerald-400">৳{(ci.food.sale_price * ci.quantity).toFixed(0)}</span>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeFromCart(ci.food.id)}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 self-start"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer - Order Summary */}
        {cartItems.length > 0 && (
          <div className="px-5 py-5 border-t border-emerald-500/20 space-y-4">
            {/* Price Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-slate-200 font-semibold">৳{cartTotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Delivery Fee</span>
                <span className="text-slate-200 font-semibold">৳{deliveryFee}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-emerald-500/20">
                <span className="text-white font-bold">Total</span>
                <span className="text-xl font-black text-emerald-400">৳{grandTotal.toFixed(0)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => startPlaceOrderFlow()}
              className="w-full py-4 rounded-2xl font-bold text-slate-950 text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                boxShadow: '0 0 24px rgba(16,185,129,0.4)',
              }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Continue Shopping */}
            <button
              onClick={closeCart}
              className="w-full py-2.5 rounded-2xl text-sm font-semibold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-all"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes cartSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
