'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

export default function CheckoutModal() {
  const {
    isCheckoutModalOpen,
    closeCheckoutModal,
    checkoutItems,
    isDirectOrder,
    user,
    refreshUser,
    clearCart,
    showToast,
  } = useApp();

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [orderNotes, setOrderNotes] = useState('');
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(false);

  // Status State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderId: number;
    name: string;
    phone: string;
    address: string;
    total: number;
    payment: string;
  } | null>(null);

  // Sync state with current user profile whenever modal opens or user changes
  useEffect(() => {
    if (isCheckoutModalOpen) {
      setCustomerName(user?.full_name || '');
      setPhoneNumber(user?.phone_number || '');
      setDeliveryAddress(user?.address || '');
      setOrderNotes('');
      setPaymentMethod('Cash on Delivery');
      setError(null);
      setOrderSuccess(null);
      setSaveAddressForFuture(false);
    }
  }, [isCheckoutModalOpen, user]);

  // Check if delivery address was modified compared to saved user address
  const savedAddress = (user?.address || '').trim();
  const currentAddress = deliveryAddress.trim();
  const isAddressChanged = Boolean(currentAddress && currentAddress !== savedAddress);

  // Calculations
  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + item.food.sale_price * item.quantity,
    0
  );
  const deliveryFee = checkoutItems.length > 0 ? 40 : 0;
  const grandTotal = subtotal + deliveryFee;

  if (!isCheckoutModalOpen) return null;

  // Handle Order Placement
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Please enter your contact phone number');
      return;
    }
    if (!deliveryAddress.trim()) {
      setError('Please enter your delivery address');
      return;
    }
    if (checkoutItems.length === 0) {
      setError('No items selected for order');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          phone_number: phoneNumber.trim(),
          delivery_address: deliveryAddress.trim(),
          payment_method: paymentMethod,
          order_notes: orderNotes.trim(),
          total_amount: grandTotal,
          save_address: isAddressChanged && saveAddressForFuture,
          items: checkoutItems.map((ci) => ({
            food_id: ci.food.id,
            food_name: ci.food.name,
            price: ci.food.sale_price,
            quantity: ci.quantity,
          })),
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Failed to place order. Please try again.');
        setSubmitting(false);
      } else {
        // If from cart, clear cart
        if (!isDirectOrder) {
          clearCart();
        }

        // If address was saved, refresh user profile to show the new address
        if (isAddressChanged && saveAddressForFuture) {
          await refreshUser();
        }

        showToast('Order confirmed! We are preparing your food.', 'success');

        // Show Success confirmation screen
        setOrderSuccess({
          orderId: json.orderId,
          name: customerName.trim(),
          phone: phoneNumber.trim(),
          address: deliveryAddress.trim(),
          total: grandTotal,
          payment: paymentMethod,
        });
      }
    } catch {
      setError('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={orderSuccess ? closeCheckoutModal : undefined}
      />

      {/* Modal Container */}
      <div
        className="relative z-10 w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/25 animate-in fade-in zoom-in-95 duration-200"
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
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                {orderSuccess ? 'Order Confirmation' : 'Place Your Order'}
              </h2>
              <p className="text-xs text-slate-400">
                {orderSuccess
                  ? 'Thank you! Your order is being processed.'
                  : `${checkoutItems.length} item${checkoutItems.length !== 1 ? 's' : ''} • Express Delivery in 25-35 mins`}
              </p>
            </div>
          </div>
          <button
            onClick={closeCheckoutModal}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {orderSuccess ? (
            /* ORDER SUCCESS VIEW */
            <div className="py-6 flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                  <Check className="w-10 h-10 text-emerald-400 stroke-[3]" />
                </div>
                <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-slate-950 border border-emerald-400 text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  Order #{orderSuccess.orderId}
                </span>
                <h3 className="text-2xl font-black text-white mt-3">
                  Order Successfully Placed!
                </h3>
                <p className="text-sm text-slate-400 mt-1.5 max-w-md">
                  Your meal is being prepared with fresh ingredients and will arrive shortly.
                </p>
              </div>

              {/* Order Summary Details Card */}
              <div className="w-full bg-slate-900/70 border border-emerald-500/20 rounded-2xl p-5 text-left space-y-3.5">
                <div className="flex justify-between items-center pb-3 border-b border-emerald-500/15">
                  <span className="text-xs text-slate-400">Recipient</span>
                  <span className="text-sm font-bold text-white">{orderSuccess.name}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-emerald-500/15">
                  <span className="text-xs text-slate-400">Contact Number</span>
                  <span className="text-sm font-bold text-white">{orderSuccess.phone}</span>
                </div>
                <div className="flex justify-between items-start pb-3 border-b border-emerald-500/15">
                  <span className="text-xs text-slate-400">Delivery Address</span>
                  <span className="text-sm font-semibold text-emerald-300 text-right max-w-[260px]">
                    {orderSuccess.address}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-emerald-500/15">
                  <span className="text-xs text-slate-400">Payment Method</span>
                  <span className="text-sm font-bold text-white">{orderSuccess.payment}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm font-bold text-slate-300">Total Paid / Due</span>
                  <span className="text-xl font-black text-emerald-400">৳{orderSuccess.total}</span>
                </div>
              </div>

              {/* Delivery ETA Pill */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Estimated Delivery: <strong>25 - 35 Minutes</strong></span>
              </div>

              <button
                onClick={closeCheckoutModal}
                className="w-full py-3.5 rounded-2xl font-bold text-slate-950 text-sm bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)]"
              >
                Done & Continue Browsing
              </button>
            </div>
          ) : (
            /* CHECKOUT FORM VIEW */
            <form onSubmit={handlePlaceOrder} className="space-y-6">
              {/* Error Banner */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Order Items Preview */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Selected Items ({checkoutItems.length})
                  </label>
                  <span className="text-xs font-semibold text-emerald-400">
                    Subtotal: ৳{subtotal}
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {checkoutItems.map((ci) => (
                    <div
                      key={ci.food.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-emerald-500/15"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={ci.food.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80'}
                          alt={ci.food.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-950"
                        />
                        <div>
                          <p className="text-xs font-bold text-white line-clamp-1">{ci.food.name}</p>
                          <p className="text-[11px] text-slate-400">
                            ৳{ci.food.sale_price} × {ci.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">
                        ৳{ci.food.sale_price * ci.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recipient & Delivery Information (Pre-filled & Editable) */}
              <div className="space-y-4 pt-2 border-t border-emerald-500/15">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <User className="w-3.5 h-3.5" />
                    <span>Customer & Delivery Details</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Auto-filled • Editable</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="017xxxxxxxx"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Delivery Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-emerald-500/70" />
                    <textarea
                      rows={2}
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="House / Apartment #, Road, Area, City"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* ADDRESS CHANGE NOTIFICATION & SAVE CONFIRMATION PROMPT */}
                {isAddressChanged && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/40 space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-emerald-300">
                          Address Modified
                        </p>
                        <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                          You changed your delivery address from your profile default. Would you like to use this new address for future orders?
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center gap-3 pt-2 border-t border-emerald-500/20 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={saveAddressForFuture}
                        onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                        className="w-4 h-4 rounded border-emerald-500/40 text-emerald-500 focus:ring-emerald-400 bg-slate-900 cursor-pointer accent-emerald-500"
                      />
                      <span className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
                        Yes, save this as my default address for future orders
                      </span>
                    </label>
                  </div>
                )}

                {/* Special Instructions */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Order Notes / Special Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Ring the bell, extra spicy, no onion"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400/60 transition-all"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2 pt-2 border-t border-emerald-500/15">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Select Payment Method:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {['Cash on Delivery', 'bKash / Nagad', 'Credit / Debit Card'].map((pm) => {
                    const isSelected = paymentMethod === pm;
                    return (
                      <button
                        type="button"
                        key={pm}
                        onClick={() => setPaymentMethod(pm)}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {pm === 'Cash on Delivery' ? (
                          <Banknote className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <CreditCard className="w-5 h-5 text-emerald-400" />
                        )}
                        <span>{pm}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bill Breakdown & Submit Button */}
              <div className="pt-4 border-t border-emerald-500/20 space-y-4">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-slate-200">৳{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Delivery Fee</span>
                    <span className="font-semibold text-slate-200">৳{deliveryFee}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-emerald-500/15 text-sm">
                    <span className="font-bold text-white">Grand Total</span>
                    <span className="text-xl font-black text-emerald-400">৳{grandTotal}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || checkoutItems.length === 0}
                  className="w-full py-4 rounded-2xl font-bold text-slate-950 text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                    boxShadow: '0 0 25px rgba(16,185,129,0.4)',
                  }}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                      <span>Placing Order…</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm & Place Order (৳{grandTotal})</span>
                      <ArrowRight className="w-4 h-4" />
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
