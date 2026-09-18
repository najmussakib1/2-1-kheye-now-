'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  MapPin,
  Star,
  Clock,
  CheckCircle2,
  Truck,
  Package,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface OrderItem {
  food_name: string;
  quantity: number;
  price: number;
}

interface UserOrder {
  id: number;
  status: string;
  total_amount: number;
  delivery_location: string;
  delivery_address: string;
  payment_method: string;
  is_rated: number;
  needs_rating: number;
  created_at: string;
  rider_name: string | null;
  items: OrderItem[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRateOrder?: (orderId: number) => void;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  Pending:    { color: 'text-amber-400 bg-amber-500/15 border-amber-500/30',  icon: Clock,         label: 'Pending' },
  Preparing:  { color: 'text-blue-400 bg-blue-500/15 border-blue-500/30',    icon: Package,       label: 'Preparing' },
  'On the Way': { color: 'text-purple-400 bg-purple-500/15 border-purple-500/30', icon: Truck, label: 'On the Way' },
  Delivered:  { color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', icon: CheckCircle2, label: 'Delivered' },
  Cancelled:  { color: 'text-rose-400 bg-rose-500/15 border-rose-500/30',    icon: AlertCircle,   label: 'Cancelled' },
};

export default function UserOrdersModal({ isOpen, onClose, onRateOrder }: Props) {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders');
      const json = await res.json();
      if (json.success) {
        setOrders(json.orders || []);
      } else {
        setError(json.error || 'Failed to load orders');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen]);

  const toggleExpand = (orderId: number) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-emerald-500/25 shadow-2xl flex flex-col max-h-[85vh]"
        style={{ background: 'rgba(7,11,18,0.97)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">My Orders</h2>
              <p className="text-xs text-slate-400">{orders.length} order{orders.length !== 1 ? 's' : ''} found</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
              <p className="text-sm text-slate-400">Loading your orders...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-rose-400">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm">{error}</p>
              <button
                onClick={fetchOrders}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-all"
              >
                Retry
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-white">No orders yet</p>
              <p className="text-xs text-slate-400">Your order history will appear here</p>
            </div>
          ) : (
            orders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['Pending'];
              const StatusIcon = cfg.icon;
              const isExpanded = expandedOrders.has(order.id);
              const dateStr = order.created_at
                ? new Date(order.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })
                : 'Unknown date';

              return (
                <div
                  key={order.id}
                  className="rounded-2xl bg-slate-900/60 border border-emerald-500/15 overflow-hidden"
                >
                  {/* Order Header Row */}
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-emerald-500/5 transition-colors"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-black text-emerald-400 flex-shrink-0">#{order.id}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {order.items.slice(0, 2).map((i) => i.food_name).join(', ')}
                          {order.items.length > 2 ? ` +${order.items.length - 2} more` : ''}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-slate-400">{dateStr}</span>
                          <span className="text-[10px] text-slate-600">•</span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-400">
                            <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                            {order.delivery_location}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${cfg.color}`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {cfg.label}
                      </span>
                      <span className="text-xs font-bold text-emerald-400">৳{order.total_amount}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-emerald-500/10">
                      {/* Items list */}
                      <div className="space-y-1.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-slate-300">
                              {item.food_name}{' '}
                              <span className="text-slate-500">x{item.quantity}</span>
                            </span>
                            <span className="text-slate-400">৳{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Meta info */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                        <div>
                          <span className="font-semibold text-slate-300">Payment:</span>{' '}
                          {order.payment_method}
                        </div>
                        {order.rider_name && (
                          <div>
                            <span className="font-semibold text-slate-300">Rider:</span>{' '}
                            {order.rider_name}
                          </div>
                        )}
                        <div className="col-span-2">
                          <span className="font-semibold text-slate-300">Address:</span>{' '}
                          {order.delivery_address}
                        </div>
                      </div>

                      {/* Rate Now button for delivered + unrated orders */}
                      {order.status === 'Delivered' && order.needs_rating === 1 && onRateOrder && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRateOrder(order.id);
                          }}
                          className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95"
                          style={{
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            boxShadow: '0 0 15px rgba(245,158,11,0.3)',
                            color: '#0f172a',
                          }}
                        >
                          <Star className="w-3.5 h-3.5 fill-slate-950" />
                          Rate this Order
                        </button>
                      )}

                      {order.status === 'Delivered' && order.is_rated === 1 && (
                        <div className="flex items-center justify-center gap-1.5 py-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-400">Rated - Thanks for your feedback!</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
