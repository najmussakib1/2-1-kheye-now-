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
  Mail,
  Tag,
  Star,
  DollarSign,
  Utensils,
  Image as ImageIcon,
  AlertCircle,
  FileText,
  Search,
  Flame,
  X,
} from 'lucide-react';
import { FoodItem } from '@/lib/db';

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

export default function RestaurantDashboardPage() {
  const { restaurant, role, isAuthLoading, showToast } = useApp();
  const router = useRouter();

  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Add Item Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addDesc, setAddDesc] = useState('');
  const [addBasePrice, setAddBasePrice] = useState('');
  const [addSalePrice, setAddSalePrice] = useState('');
  const [addCategory, setAddCategory] = useState('Fast Food');
  const [addImageUrl, setAddImageUrl] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

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

  useEffect(() => {
    if (restaurant && role === 'restaurant') {
      fetchRestaurantFoods();
    }
  }, [restaurant, role]);

  // Toggle Availability
  const handleToggleAvailability = async (item: FoodItem) => {
    const newStatus = !Boolean(item.is_available);
    try {
      const res = await fetch('/api/restaurant/foods', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: item.id,
          is_available: newStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, is_available: newStatus } : it))
        );
        showToast(
          `"${item.name}" is now ${newStatus ? 'Available for sale' : 'Marked Out of stock'}.`,
          'info'
        );
      } else {
        showToast(json.error || 'Failed to update status', 'error');
      }
    } catch {
      showToast('Network error updating item status', 'error');
    }
  };

  // Delete Item
  const handleDeleteItem = async (itemId: number, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) return;

    try {
      const res = await fetch(`/api/restaurant/foods?id=${itemId}`, {
        method: 'DELETE',
      });
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

  // Image Upload handler for Add Item
  const handleFoodImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAddImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Add Food Item
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
          image_url: addImageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
          is_available: true,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setAddError(json.error || 'Failed to add item');
      } else {
        showToast(`"${json.data.name}" added to menu successfully!`, 'success');
        setIsAddModalOpen(false);
        // Reset form
        setAddName('');
        setAddDesc('');
        setAddBasePrice('');
        setAddSalePrice('');
        setAddCategory('Fast Food');
        setAddImageUrl('');
        // Refresh items
        fetchRestaurantFoods();
      }
    } catch {
      setAddError('Something went wrong. Please try again.');
    } finally {
      setAddLoading(false);
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
    const matchesCat =
      selectedCategoryFilter === 'All' || item.category === selectedCategoryFilter;
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
            style={{
              background: 'radial-gradient(ellipse at 90% 10%, rgba(16,185,129,0.12) 0%, rgba(9,13,22,0.95) 70%)',
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.4)] flex-shrink-0">
                  <Store className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                      Partner Portal
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{Number(restaurant.rating).toFixed(1)}</span>
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">{restaurant.name}</h1>
                  <p className="text-xs text-slate-400 mt-0.5">Owner: <strong className="text-emerald-300">{restaurant.owner_name}</strong></p>
                </div>
              </div>

              {/* Action: Add Food Item Button */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-6 py-3.5 rounded-2xl font-bold text-slate-950 text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Food Item</span>
              </button>
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

              {/* Search input */}
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

            {/* Food Items Table / Cards */}
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
                  return (
                    <div
                      key={it.id}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="flex gap-3">
                        <img
                          src={it.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80'}
                          alt={it.name}
                          className="w-16 h-16 rounded-xl object-cover bg-slate-950 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                            {it.category}
                          </span>
                          <h3 className="text-sm font-bold text-white truncate">{it.name}</h3>
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{it.description}</p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-sm font-extrabold text-emerald-400">৳{it.sale_price}</span>
                            {it.base_price > it.sale_price && (
                              <del className="text-xs text-slate-500">৳{it.base_price}</del>
                            )}
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
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>In Stock</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>Out of Stock</span>
                            </>
                          )}
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

        </div>
      </main>

      {/* ADD FOOD ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => !addLoading && setIsAddModalOpen(false)}
          />
          <div
            className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/25 animate-in fade-in zoom-in-95 duration-200"
            style={{
              background: 'rgba(9, 13, 22, 0.96)',
              backdropFilter: 'blur(30px)',
            }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/20 bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <h3 className="text-base font-bold text-white">Add New Food Item</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white"
              >
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
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Fresh Orange Mint Juice"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-xs text-white focus:outline-none focus:border-emerald-400 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Description</label>
                <textarea
                  rows={2}
                  value={addDesc}
                  onChange={(e) => setAddDesc(e.target.value)}
                  placeholder="Briefly describe ingredients or taste"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-xs text-white focus:outline-none focus:border-emerald-400 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Category *</label>
                  <select
                    value={addCategory}
                    onChange={(e) => setAddCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-xs text-white focus:outline-none focus:border-emerald-400 transition-all"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-slate-900">{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Sale Price (৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={addSalePrice}
                    onChange={(e) => setAddSalePrice(e.target.value)}
                    placeholder="e.g. 180"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-xs text-white focus:outline-none focus:border-emerald-400 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Original Base Price (৳) (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={addBasePrice}
                  onChange={(e) => setAddBasePrice(e.target.value)}
                  placeholder="If discounted (e.g. 220)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-xs text-white focus:outline-none focus:border-emerald-400 transition-all"
                />
              </div>

              {/* Photo Upload or URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Product Image</span>
                  <span className="text-[10px] text-emerald-400">File upload or URL</span>
                </label>
                <div className="flex gap-2 items-center">
                  <label className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 border border-emerald-500/25 cursor-pointer hover:border-emerald-400 text-xs text-slate-300 truncate">
                    <ImageIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">{addImageUrl ? '✓ Photo selected' : 'Upload photo...'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFoodImageUpload} />
                  </label>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-semibold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-950 text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] disabled:opacity-60"
                >
                  {addLoading ? <span>Adding…</span> : <span>Save Food Item</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
