'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import {
  Store,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  MapPin,
  Phone,
  Tag,
  Star,
  Utensils,
  Image as ImageIcon,
  AlertCircle,
  Search,
  X,
  Pencil,
  Edit3,
  Layers,
  Upload,
  ClipboardList,
  Clock,
  Check,
  Bike,
  RefreshCw,
} from 'lucide-react';
import type { FoodItem, FoodAddon } from '@/lib/db';

const CATEGORIES = [
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

// ── Shared Image Manager Sub-Component ─────────────────────────────────────
interface ImageManagerProps {
  images: string[];
  onChange: (imgs: string[]) => void;
}
function ImageManager({ images, onChange }: ImageManagerProps) {
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange([...images, reader.result]);
      }
    };
    reader.readAsDataURL(file);
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      {/* Thumbnail strip */}
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((src, idx) => (
            <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-emerald-500/30 bg-slate-950 group">
              <img src={src} alt={`photo-${idx}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-0.5 right-0.5 bg-slate-950/80 rounded-full p-0.5 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              {idx === 0 && (
                <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-bold bg-emerald-600/80 text-white">Cover</span>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Upload button */}
      <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 border border-emerald-500/25 cursor-pointer hover:border-emerald-400 text-xs text-slate-300 w-full">
        <ImageIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span>{images.length === 0 ? 'Upload a photo...' : '+ Add another photo'}</span>
        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </label>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────
export default function RestaurantDashboardPage() {
  const { restaurant, role, isAuthLoading, showToast, openProfileModal } = useApp();
  const router = useRouter();

  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // ── Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');

  // ── Add Item Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addDesc, setAddDesc] = useState('');
  const [addBasePrice, setAddBasePrice] = useState('');
  const [addSalePrice, setAddSalePrice] = useState('');
  const [addCategory, setAddCategory] = useState('Fast Food');
  const [addStock, setAddStock] = useState('50');
  const [addImages, setAddImages] = useState<string[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // ── Edit Item Modal State
  const [editItem, setEditItem] = useState<FoodItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editBasePrice, setEditBasePrice] = useState('');
  const [editSalePrice, setEditSalePrice] = useState('');
  const [editCategory, setEditCategory] = useState('Fast Food');
  const [editStock, setEditStock] = useState('50');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ── Add-On Management Modal State
  const [activeAddonFoodItem, setActiveAddonFoodItem] = useState<FoodItem | null>(null);
  const [foodAddons, setFoodAddons] = useState<FoodAddon[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('');
  const [newAddonImage, setNewAddonImage] = useState('');
  const [addonSubmitting, setAddonSubmitting] = useState(false);
  const [addonError, setAddonError] = useState<string | null>(null);

  const openAddonsModal = async (food: FoodItem) => {
    setActiveAddonFoodItem(food);
    setAddonError(null);
    setNewAddonName('');
    setNewAddonPrice('');
    setNewAddonImage('');
    setAddonsLoading(true);
    try {
      const res = await fetch(`/api/addons?food_id=${food.id}`);
      const json = await res.json();
      if (json.success) {
        setFoodAddons(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching addons:', err);
    } finally {
      setAddonsLoading(false);
    }
  };

  const handleCreateAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAddonFoodItem) return;
    setAddonError(null);
    setAddonSubmitting(true);

    try {
      const res = await fetch('/api/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_id: activeAddonFoodItem.id,
          name: newAddonName.trim(),
          price: Number(newAddonPrice),
          image_url: newAddonImage.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Add-on "${newAddonName}" added successfully!`, 'success');
        setNewAddonName('');
        setNewAddonPrice('');
        setNewAddonImage('');
        // Refresh addons
        const refreshed = await fetch(`/api/addons?food_id=${activeAddonFoodItem.id}`);
        const refJson = await refreshed.json();
        if (refJson.success) setFoodAddons(refJson.data || []);
      } else {
        setAddonError(json.error || 'Failed to add addon');
      }
    } catch {
      setAddonError('Failed to create addon');
    } finally {
      setAddonSubmitting(false);
    }
  };

  const handleDeleteAddon = async (addonId: number, name: string) => {
    if (!confirm(`Delete add-on "${name}"?`)) return;
    try {
      const res = await fetch(`/api/addons/${addonId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast(`Add-on "${name}" deleted`, 'info');
        setFoodAddons((prev) => prev.filter((a) => a.id !== addonId));
      } else {
        showToast(json.error || 'Failed to delete addon', 'error');
      }
    } catch {
      showToast('Error deleting addon', 'error');
    }
  };

  // Redirect if not logged in as restaurant
  useEffect(() => {
    if (!isAuthLoading && (!restaurant || role !== 'restaurant')) {
      router.push('/');
    }
  }, [isAuthLoading, restaurant, role, router]);

  // Fetch Restaurant Food Items
  const fetchRestaurantFoods = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/restaurant/foods');
      const json = await res.json();
      if (json.success) {
        setItems(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching restaurant food items:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Restaurant Orders
  const fetchRestaurantOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/restaurant/orders');
      const json = await res.json();
      if (json.success) {
        setOrders(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching restaurant orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, nextStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch('/api/restaurant/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || `Order updated to ${nextStatus}`, 'success');
        // Refresh orders list
        fetchRestaurantOrders();
      } else {
        showToast(json.error || 'Failed to update order status', 'error');
      }
    } catch {
      showToast('Network error updating order status', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  useEffect(() => {
    if (restaurant && role === 'restaurant') {
      fetchRestaurantFoods();
      fetchRestaurantOrders();
    }
  }, [restaurant, role]);

  // ── Toggle Availability
  const handleToggleAvailability = async (item: FoodItem) => {
    const newStatus = !Boolean(item.is_available);
    try {
      const res = await fetch('/api/restaurant/foods', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: item.id, is_available: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, is_available: newStatus } : it)));
        showToast(`"${item.name}" is now ${newStatus ? 'Available for sale' : 'Marked Out of stock'}.`, 'info');
      } else {
        showToast(json.error || 'Failed to update status', 'error');
      }
    } catch {
      showToast('Network error updating item status', 'error');
    }
  };

  // ── Delete Item
  const handleDeleteItem = async (itemId: number, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) return;
    try {
      const res = await fetch(`/api/restaurant/foods?id=${itemId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setItems((prev) => prev.filter((it) => it.id !== itemId));
        showToast(`"${itemName}" was deleted from menu.`, 'info');
      } else {
        showToast(json.error || 'Failed to delete item', 'error');
      }
    } catch {
      showToast('Error deleting item', 'error');
    }
  };

  // ── Submit Add Food Item
  const handleAddFoodItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch('/api/restaurant/foods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName.trim(),
          description: addDesc.trim(),
          base_price: Number(addBasePrice) || Number(addSalePrice),
          sale_price: Number(addSalePrice),
          category: addCategory,
          stock: Number(addStock) || 0,
          images: addImages,
          image_url: addImages[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
          is_available: (Number(addStock) || 0) > 0,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setAddError(json.error || 'Failed to add item');
      } else {
        showToast(`"${json.data.name}" added to menu successfully!`, 'success');
        setIsAddModalOpen(false);
        setAddName(''); setAddDesc(''); setAddBasePrice(''); setAddSalePrice('');
        setAddCategory('Fast Food'); setAddStock('50'); setAddImages([]);
        fetchRestaurantFoods();
      }
    } catch {
      setAddError('Something went wrong. Please try again.');
    } finally {
      setAddLoading(false);
    }
  };

  // ── Open Edit Modal
  const openEditModal = (item: FoodItem) => {
    setEditItem(item);
    setEditName(item.name);
    setEditDesc(item.description || '');
    setEditBasePrice(String(item.base_price));
    setEditSalePrice(String(item.sale_price));
    setEditCategory(item.category || 'Fast Food');
    setEditStock(String(item.stock !== undefined && item.stock !== null ? item.stock : 50));
    // Populate images: prefer parsed images array, else use image_url
    const imgs = item.images && item.images.length > 0 ? item.images : (item.image_url ? [item.image_url] : []);
    setEditImages(imgs);
    setEditError(null);
  };

  // ── Submit Edit Food Item
  const handleEditFoodItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await fetch('/api/restaurant/foods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: editItem.id,
          name: editName.trim(),
          description: editDesc.trim(),
          base_price: Number(editBasePrice) || Number(editSalePrice),
          sale_price: Number(editSalePrice),
          category: editCategory,
          stock: Number(editStock) || 0,
          images: editImages,
          image_url: editImages[0] || editItem.image_url || '',
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setEditError(json.error || 'Failed to update item');
      } else {
        showToast(`"${editName}" updated successfully!`, 'success');
        setEditItem(null);
        fetchRestaurantFoods();
      }
    } catch {
      setEditError('Something went wrong. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  if (isAuthLoading || !restaurant) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategoryFilter === 'All' || item.category === selectedCategoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      <Navbar />

      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {/* Restaurant Header Banner Card */}
          <div
            className="p-6 sm:p-8 rounded-3xl border border-emerald-500/25 relative overflow-hidden shadow-2xl"
            style={{ background: 'radial-gradient(ellipse at 90% 10%, rgba(16,185,129,0.12) 0%, rgba(9,13,22,0.95) 70%)' }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4">
                {/* Logo or Store Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.4)] flex-shrink-0 overflow-hidden">
                  {restaurant.image_url ? (
                    <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                      Partner Portal
                    </span>
                    <span
                      title="Restaurant rating is calculated as the average of all its food item ratings"
                      className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/30"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{Number(restaurant.rating).toFixed(1)}</span>
                      <span className="text-[10px] text-amber-300/80 font-normal hidden sm:inline">(Avg of Foods)</span>
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">{restaurant.name}</h1>
                  <p className="text-xs text-slate-400 mt-0.5">Owner: <strong className="text-emerald-300">{restaurant.owner_name}</strong></p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => openProfileModal('edit')}
                  className="px-5 py-3 rounded-2xl font-semibold text-emerald-300 text-sm flex items-center gap-2 border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-6 py-3.5 rounded-2xl font-bold text-slate-950 text-sm flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add Food Item</span>
                </button>
              </div>
            </div>

            {/* Restaurant Meta Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-emerald-500/15 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{restaurant.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{restaurant.phone_number}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{restaurant.categories}</span>
              </div>
            </div>
          </div>

          {/* Product Management Section */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-emerald-400" />
                  <span>Restaurant Menu & Products</span>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Manage live stock, pricing, and availability</p>
              </div>
              <div className="relative min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your items..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {['All', ...CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategoryFilter === cat
                      ? 'bg-emerald-500/25 border border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : 'bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Food Items Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-40 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse" />
                ))}
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredItems.map((it) => {
                  const isAvailable = Boolean(it.is_available);
                  const coverImg = it.images && it.images.length > 0
                    ? it.images[0]
                    : it.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80';
                  const extraPhotos = it.images && it.images.length > 1 ? it.images.length - 1 : 0;

                  return (
                    <div
                      key={it.id}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="flex gap-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={coverImg}
                            alt={it.name}
                            className="w-16 h-16 rounded-xl object-cover bg-slate-950"
                          />
                          {extraPhotos > 0 && (
                            <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-slate-900">
                              +{extraPhotos}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{it.category}</span>
                          <h3 className="text-sm font-bold text-white truncate">{it.name}</h3>
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{it.description}</p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-sm font-extrabold text-emerald-400">৳{it.sale_price}</span>
                            {it.base_price > it.sale_price && (
                              <del className="text-xs text-slate-500">৳{it.base_price}</del>
                            )}
                            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              (it.stock ?? 0) > 0
                                ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            }`}>
                              {(it.stock ?? 0) > 0 ? `Stock: ${it.stock}` : 'Out of Stock'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls Bar */}
                      <div className="flex items-center justify-between pt-3 border-t border-emerald-500/15">
                        {/* Status Toggle */}
                        <button
                          onClick={() => handleToggleAvailability(it)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                            isAvailable
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                          }`}
                        >
                          {isAvailable ? (
                            <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span>In Stock</span></>
                          ) : (
                            <><XCircle className="w-3.5 h-3.5 text-rose-400" /><span>Out of Stock</span></>
                          )}
                        </button>

                        <div className="flex items-center gap-1.5">
                          {/* Manage Add-ons button */}
                          <button
                            onClick={() => openAddonsModal(it)}
                            className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-400 flex items-center gap-1 transition-all"
                            title="Manage Add-ons & Extras"
                          >
                            <Layers className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Add-ons</span>
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => openEditModal(it)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            title="Edit product"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteItem(it.id, it.name)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-emerald-500/15">
                <Utensils className="w-10 h-10 text-emerald-500/40 mx-auto mb-2" />
                <h3 className="text-base font-bold text-white">No food items found</h3>
                <p className="text-xs text-slate-400 mt-1">Add your first menu item to start receiving customer orders.</p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 border border-emerald-400 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition-all"
                >
                  + Add Food Item
                </button>
              </div>
            )}
          </div>

          {/* ── Restaurant Orders & Live Preparation Section ── */}
          <div className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-emerald-400" />
                  <span>Incoming & Active Orders</span>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    {orders.length} total
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Orders arrive in <strong>Preparing</strong> phase. Mark as <strong>Prepared</strong> to auto-assign a rider.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Filter tabs */}
                <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-emerald-500/20 text-xs">
                  {['All', 'Preparing', 'Prepared', 'Delivered'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setOrderStatusFilter(status)}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        orderStatusFilter === status
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <button
                  onClick={fetchRestaurantOrders}
                  disabled={ordersLoading}
                  className="p-2 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-50"
                  title="Refresh Orders"
                >
                  <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Orders List / Cards */}
            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="h-28 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse" />
                ))}
              </div>
            ) : orders.filter((o) => orderStatusFilter === 'All' || o.status === orderStatusFilter).length > 0 ? (
              <div className="space-y-3">
                {orders
                  .filter((o) => orderStatusFilter === 'All' || o.status === orderStatusFilter)
                  .map((order) => {
                    const isPreparing = order.status === 'Preparing';
                    const isPrepared = order.status === 'Prepared';
                    const isDelivered = order.status === 'Delivered';

                    return (
                      <div
                        key={order.id}
                        className="p-5 rounded-2xl bg-slate-900/70 border border-emerald-500/20 hover:border-emerald-500/35 transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-500/10">
                          <div className="flex items-center gap-3">
                            <span className="text-base font-extrabold text-white">
                              Order #{order.id}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                isPreparing
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                                  : isPrepared
                                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                  : isDelivered
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {order.status}
                            </span>
                            <span className="text-xs text-slate-400">
                              {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Action: Mark as Prepared */}
                            {isPreparing && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'Prepared')}
                                disabled={updatingOrderId === order.id}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>{updatingOrderId === order.id ? 'Updating...' : 'Mark as Prepared'}</span>
                              </button>
                            )}

                            {/* Status badge if already prepared */}
                            {isPrepared && (
                              <span className="text-xs text-sky-300 bg-sky-500/10 px-3 py-1.5 rounded-xl border border-sky-500/25 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-sky-400" />
                                <span>Prepared • Waiting for Delivery</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Customer & Location Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                          <div>
                            <span className="text-slate-500 block">Customer:</span>
                            <strong className="text-white">{order.customer_name}</strong> ({order.phone_number})
                          </div>
                          <div>
                            <span className="text-slate-500 block">Delivery To:</span>
                            <span className="text-slate-300 truncate block">{order.delivery_address}</span>
                            <span className="text-[10px] text-emerald-400 font-semibold">{order.delivery_location || 'Dhanmondi'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Assigned Rider:</span>
                            {order.rider_name ? (
                              <span className="text-emerald-300 flex items-center gap-1">
                                <Bike className="w-3.5 h-3.5" />
                                <strong>{order.rider_name}</strong> ({order.rider_phone})
                              </span>
                            ) : (
                              <span className="text-amber-400/80 italic">
                                {isPreparing ? 'Rider assigned once prepared' : 'Waiting for available rider in zone...'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Order Items List */}
                        {order.items && order.items.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/60 flex flex-wrap gap-2 items-center">
                            <span className="text-[11px] text-slate-500 font-medium">Items:</span>
                            {order.items.map((it: any, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-lg bg-slate-950 border border-emerald-500/20 text-xs text-slate-200"
                              >
                                {it.quantity}x <strong>{it.food_name}</strong> (৳{it.price})
                              </span>
                            ))}
                            <span className="ml-auto text-xs font-extrabold text-emerald-400">
                              Total: ৳{order.total_amount}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-emerald-500/15">
                <ClipboardList className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-white">No {orderStatusFilter === 'All' ? '' : orderStatusFilter} orders</h3>
                <p className="text-xs text-slate-400 mt-0.5">Orders placed by customers will appear here in real-time.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── ADD FOOD ITEM MODAL ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => !addLoading && setIsAddModalOpen(false)}
          />
          <div
            className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/25 animate-in fade-in zoom-in-95 duration-200"
            style={{ background: 'rgba(9, 13, 22, 0.96)', backdropFilter: 'blur(30px)' }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/20 bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <h3 className="text-base font-bold text-white">Add New Food Item</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFoodItem} className="flex-1 overflow-y-auto p-6 space-y-4">
              {addError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Item Name *</label>
                <input
                  type="text" required value={addName} onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Fresh Orange Mint Juice"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-xs text-white focus:outline-none focus:border-emerald-400 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Description</label>
                <textarea
                  rows={2} value={addDesc} onChange={(e) => setAddDesc(e.target.value)}
                  placeholder="Briefly describe ingredients or taste"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-xs text-white focus:outline-none focus:border-emerald-400 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Category *</label>
                  <select
                    value={addCategory} onChange={(e) => setAddCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-xs text-white focus:outline-none focus:border-emerald-400 transition-all"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Sale Price (৳) *</label>
                  <input
                    type="number" step="0.01" required value={addSalePrice} onChange={(e) => setAddSalePrice(e.target.value)}
                    placeholder="e.g. 180"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-xs text-white focus:outline-none focus:border-emerald-400 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Original Base Price (৳) (Optional)</label>
                <input
                  type="number" step="0.01" value={addBasePrice} onChange={(e) => setAddBasePrice(e.target.value)}
                  placeholder="If discounted (e.g. 220)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-xs text-white focus:outline-none focus:border-emerald-400 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Initial Stock Quantity *</label>
                <input
                  type="number" min="0" required value={addStock} onChange={(e) => setAddStock(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-xs text-white focus:outline-none focus:border-emerald-400 transition-all"
                />
                <p className="text-[10px] text-slate-500">Set to 0 to mark as Out of Stock. Stock decreases automatically on each order.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Product Photos</span>
                  <span className="text-[10px] text-emerald-400 font-normal">First photo = cover image</span>
                </label>
                <ImageManager images={addImages} onChange={setAddImages} />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button" onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-semibold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={addLoading}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-950 text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] disabled:opacity-60"
                >
                  {addLoading ? <span>Adding…</span> : <span>Save Food Item</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT FOOD ITEM MODAL ── */}
      {editItem && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => !editLoading && setEditItem(null)}
          />
          <div
            className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/25 animate-in fade-in zoom-in-95 duration-200"
            style={{ background: 'rgba(9, 13, 22, 0.96)', backdropFilter: 'blur(30px)' }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/20 bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Pencil className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Edit Food Item</h3>
              </div>
              <button onClick={() => setEditItem(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditFoodItem} className="flex-1 overflow-y-auto p-6 space-y-4">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Item Name *</label>
                <input
                  type="text" required value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-xs text-white focus:outline-none focus:border-emerald-400 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Description</label>
                <textarea
                  rows={2} value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-xs text-white focus:outline-none focus:border-emerald-400 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Category *</label>
                  <select
                    value={editCategory} onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-xs text-white focus:outline-none focus:border-emerald-400 transition-all"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Sale Price (৳) *</label>
                  <input
                    type="number" step="0.01" required value={editSalePrice} onChange={(e) => setEditSalePrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-xs text-white focus:outline-none focus:border-emerald-400 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Original Base Price (৳) (Optional)</label>
                <input
                  type="number" step="0.01" value={editBasePrice} onChange={(e) => setEditBasePrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-xs text-white focus:outline-none focus:border-emerald-400 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Stock Quantity *</label>
                <input
                  type="number" min="0" required value={editStock} onChange={(e) => setEditStock(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-xs text-white focus:outline-none focus:border-emerald-400 transition-all"
                />
                <p className="text-[10px] text-slate-500">Set to 0 to mark as Out of Stock. Stock decreases automatically on each order.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Product Photos</span>
                  <span className="text-[10px] text-emerald-400 font-normal">First photo = cover image</span>
                </label>
                <ImageManager images={editImages} onChange={setEditImages} />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button" onClick={() => setEditItem(null)}
                  className="flex-1 py-3 rounded-xl font-semibold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={editLoading}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-950 text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] disabled:opacity-60"
                >
                  {editLoading ? <span>Saving…</span> : <span>Save Changes</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD-ONS MANAGEMENT MODAL ── */}
      {activeAddonFoodItem && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setActiveAddonFoodItem(null)}
          />
          <div
            className="relative z-10 w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/30 animate-in fade-in zoom-in-95 duration-200"
            style={{ background: 'rgba(9, 13, 22, 0.96)', backdropFilter: 'blur(30px)' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/20 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-emerald-500/30 flex-shrink-0">
                  {activeAddonFoodItem.image_url ? (
                    <img src={activeAddonFoodItem.image_url} alt={activeAddonFoodItem.name} className="w-full h-full object-cover" />
                  ) : (
                    <Utensils className="w-5 h-5 text-emerald-400 m-2.5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    Add-ons for {activeAddonFoodItem.name}
                  </h3>
                  <p className="text-[11px] text-emerald-400 font-semibold">
                    Base: ৳{activeAddonFoodItem.sale_price} • {foodAddons.length} addon{foodAddons.length !== 1 ? 's' : ''} available
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveAddonFoodItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Existing Add-ons List */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Configured Add-ons</span>
                  <span className="text-[10px] text-emerald-400 lowercase font-normal">Customer selectable</span>
                </h4>

                {addonsLoading ? (
                  <div className="py-6 text-center text-xs text-slate-400">Loading add-ons...</div>
                ) : foodAddons.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-dashed border-emerald-500/20 text-center text-xs text-slate-400">
                    No add-ons configured yet for this food item. Add the first one below!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {foodAddons.map((ad) => (
                      <div
                        key={ad.id}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/80 border border-emerald-500/20 hover:border-emerald-500/40 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-950 border border-emerald-500/30 flex-shrink-0">
                            {ad.image_url ? (
                              <img src={ad.image_url} alt={ad.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-emerald-400">
                                +৳
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{ad.name}</p>
                            <p className="text-xs font-extrabold text-emerald-400">+৳{ad.price}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Active
                          </span>
                          <button
                            onClick={() => handleDeleteAddon(ad.id, ad.name)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete addon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form to Add New Add-on with Picture */}
              <div className="pt-4 border-t border-emerald-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Add New Add-on with Picture
                  </h4>
                </div>

                {addonError && (
                  <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{addonError}</span>
                  </div>
                )}

                <form onSubmit={handleCreateAddon} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-7 space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        Add-on Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Extra Melted Cheese"
                        value={newAddonName}
                        onChange={(e) => setNewAddonName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/20 focus:border-emerald-400 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-5 space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        Add-on Price (৳) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="e.g. 40"
                        value={newAddonPrice}
                        onChange={(e) => setNewAddonPrice(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/20 focus:border-emerald-400 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Add-on Picture Upload or URL */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Add-on Picture (Photo)</span>
                      <span className="text-[10px] text-emerald-400 font-normal">File upload or URL</span>
                    </label>

                    <div className="flex items-center gap-3">
                      {/* Photo Preview */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                        {newAddonImage ? (
                          <img src={newAddonImage} alt="Addon Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-600" />
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        {/* File Upload Input */}
                        <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/25 cursor-pointer hover:border-emerald-400 text-xs text-emerald-300 w-full">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{newAddonImage ? 'Change Photo' : 'Upload Add-on Photo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 2 * 1024 * 1024) {
                                alert('Image must be under 2 MB.');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === 'string') {
                                  setNewAddonImage(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                              e.target.value = '';
                            }}
                          />
                        </label>

                        {/* Optional Direct URL */}
                        <input
                          type="url"
                          placeholder="Or paste image URL (https://...)"
                          value={newAddonImage.startsWith('data:') ? '' : newAddonImage}
                          onChange={(e) => setNewAddonImage(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={addonSubmitting}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                  >
                    {addonSubmitting ? 'Adding Add-on...' : '+ Save New Add-on'}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
