'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ChevronDown,
  Utensils,
  User,
  LogIn,
  Menu,
  X,
  Sparkles,
  LogOut,
  UserCircle2,
  Edit3,
  Store,
  LayoutDashboard,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  onSelectCategory?: (category: string) => void;
}

export default function Navbar({ onSelectCategory }: NavbarProps) {
  const {
    cartCount,
    openCart,
    user,
    restaurant,
    role,
    isAuthLoading,
    signOut,
    openProfileModal,
    openAuthModal,
  } = useApp();

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const categories = ['All', 'Burgers', 'Pizza', 'Desi Feast', 'Pasta', 'Beverages', 'Juice', 'Desserts'];

  const handleCategoryClick = (cat: string) => {
    if (onSelectCategory) {
      onSelectCategory(cat);
    }
    setIsCategoryOpen(false);
    setIsMobileMenuOpen(false);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    await signOut();
    router.push('/');
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (role === 'restaurant' && restaurant) {
      return restaurant.name.slice(0, 2).toUpperCase();
    }
    if (!user?.full_name) return 'U';
    const parts = user.full_name.trim().split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* Top Glass Navbar */}
      <nav className="relative bg-slate-950/85 backdrop-blur-xl border-b border-emerald-500/20 px-4 lg:px-8 py-3 flex items-center justify-between shadow-2xl">
        
        {/* LEFT SIDE: KHEYE NOW! Brand Logo Block */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/10 border border-emerald-400/50 flex items-center justify-center group-hover:scale-105 group-hover:rotate-6 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Utensils className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-brand font-black text-xl sm:text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 drop-shadow-[0_0_12px_rgba(16,185,129,0.6)] uppercase">
              KHEYE NOW!
            </span>
            <span className="text-[10px] font-semibold text-emerald-400/80 -mt-1 tracking-widest uppercase">
              Food Delivery
            </span>
          </div>
        </Link>

        {/* CENTER: Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link 
            href="/" 
            className="text-sm font-semibold text-emerald-300/90 hover:text-emerald-100 hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all"
          >
            Home
          </Link>

          {role === 'restaurant' ? (
            <Link 
              href="/restaurant/dashboard" 
              className="text-sm font-semibold text-emerald-300 hover:text-emerald-100 flex items-center gap-1.5 transition-all"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              <span>Restaurant Dashboard</span>
            </Link>
          ) : (
            <Link 
              href="#about" 
              className="text-sm font-semibold text-emerald-300/90 hover:text-emerald-100 hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all"
            >
              About
            </Link>
          )}

          {/* Category Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="flex items-center gap-1.5 text-sm font-semibold text-emerald-300/90 hover:text-emerald-100 transition-all focus:outline-none"
            >
              <span>Category</span>
              <ChevronDown className={`w-4 h-4 text-emerald-400 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCategoryOpen && (
              <div className="absolute left-0 mt-3 w-48 rounded-2xl bg-slate-900/95 border border-emerald-500/30 backdrop-blur-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-1.5 border-b border-emerald-500/20 text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Food Categories</span>
                </div>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className="w-full text-left px-4 py-2.5 text-sm text-emerald-200 hover:bg-emerald-500/20 hover:text-white transition-colors flex items-center justify-between"
                  >
                    <span>{cat}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-0 hover:opacity-100 transition-opacity"></span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: Cart, Sign In & Sign Up or User/Restaurant Avatar */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Cart Icon Badge (Hidden for Restaurant role) */}
          {role !== 'restaurant' && (
            <div className="relative">
              <button
                onClick={openCart}
                className="p-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-100 transition-all shadow-[0_0_12px_rgba(16,185,129,0.15)] relative"
                aria-label="Open cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Auth Area */}
          {!isAuthLoading && (
            <>
              {role === 'restaurant' && restaurant ? (
                /* Restaurant Partner Menu */
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400 transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                      <Store className="w-3.5 h-3.5 text-slate-950" />
                    </div>
                    <span className="hidden sm:block text-sm font-semibold text-emerald-300 max-w-[120px] truncate">
                      {restaurant.name}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-emerald-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isUserMenuOpen && (
                    <div
                      className="absolute right-0 mt-3 w-64 rounded-2xl border border-emerald-500/30 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden"
                      style={{
                        background: 'rgba(9, 13, 22, 0.95)',
                        backdropFilter: 'blur(20px)',
                      }}
                    >
                      <div className="px-4 py-3 border-b border-emerald-500/20">
                        <p className="text-sm font-bold text-white truncate">{restaurant.name}</p>
                        <p className="text-xs text-emerald-400/80 truncate">{restaurant.owner_name} (Owner)</p>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/restaurant/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                          <span>Restaurant Dashboard</span>
                        </Link>

                        <div className="my-1 border-t border-emerald-500/15" />

                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : user ? (
                /* Customer User Avatar + Dropdown */
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400 transition-all"
                    aria-label="User menu"
                  >
                    {/* Avatar Circle with Initials or Custom Avatar */}
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-black text-slate-950">{getUserInitials()}</span>
                      )}
                    </div>
                    <span className="hidden sm:block text-sm font-semibold text-emerald-300 max-w-[100px] truncate">
                      {user.full_name.split(' ')[0]}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-emerald-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div
                      className="absolute right-0 mt-3 w-64 rounded-2xl border border-emerald-500/30 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden"
                      style={{
                        background: 'rgba(9, 13, 22, 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                      }}
                    >
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-emerald-500/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.4)] flex-shrink-0">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-black text-slate-950">{getUserInitials()}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{user.full_name}</p>
                            <p className="text-xs text-emerald-400/80 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        {/* View Profile - ACTIVE */}
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            openProfileModal('view');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-emerald-500/15 hover:text-emerald-300 transition-colors"
                        >
                          <UserCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>View Profile</span>
                        </button>

                        {/* Edit Profile - ACTIVE */}
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            openProfileModal('edit');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-emerald-500/15 hover:text-emerald-300 transition-colors"
                        >
                          <Edit3 className="w-4 h-4 text-emerald-400" />
                          <span>Edit Profile</span>
                        </button>

                        {/* Divider */}
                        <div className="my-1 border-t border-emerald-500/15" />

                        {/* Sign Out - ACTIVE */}
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Sign In & Sign Up Buttons */
                <>
                  <button
                    onClick={() => openAuthModal({ tab: 'signin', role: 'user' })}
                    className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-400 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                  >
                    <LogIn className="w-4 h-4 text-emerald-400" />
                    <span>Sign In</span>
                  </button>
                  
                  <button
                    onClick={() => openAuthModal({ tab: 'signup', role: 'user' })}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 transition-all duration-300 shadow-[0_0_18px_rgba(16,185,129,0.4)] hover:scale-105"
                  >
                    <User className="w-4 h-4 text-slate-950" />
                    <span>Sign Up</span>
                  </button>
                </>
              )}
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-emerald-300 hover:text-emerald-100 focus:outline-none ml-1"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 border-b border-emerald-500/30 backdrop-blur-2xl px-6 py-4 flex flex-col gap-4 shadow-2xl">
          <Link 
            href="/" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-base font-medium text-emerald-300 hover:text-emerald-100"
          >
            Home
          </Link>
          
          {role === 'restaurant' && (
            <Link
              href="/restaurant/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Restaurant Dashboard</span>
            </Link>
          )}

          {user && (
            <>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openProfileModal('view');
                }}
                className="text-left text-base font-medium text-emerald-300 hover:text-emerald-100 flex items-center gap-2"
              >
                <UserCircle2 className="w-4 h-4" />
                <span>View Profile</span>
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openProfileModal('edit');
                }}
                className="text-left text-base font-medium text-emerald-300 hover:text-emerald-100 flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </>
          )}

          <div className="pt-2 border-t border-emerald-500/20">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Categories</div>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className="text-left px-3 py-2 rounded-xl text-sm text-emerald-200 bg-slate-900/60 border border-emerald-500/20 hover:border-emerald-400"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-emerald-500/20">
            {user || restaurant ? (
              <button
                onClick={handleSignOut}
                className="flex-1 py-2.5 rounded-full text-xs font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal({ tab: 'signin', role: 'user' });
                  }}
                  className="flex-1 py-2.5 rounded-full text-xs font-semibold border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal({ tab: 'signup', role: 'user' });
                  }}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-center"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
