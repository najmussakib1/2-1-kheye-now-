'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import type { FoodItem, SafeRestaurant, FoodAddon } from '@/lib/db';

// ---- Cart Types ----
export interface CartItem {
  id?: string; // unique key for food + specific addon combination
  food: FoodItem;
  quantity: number;
  selectedAddons?: FoodAddon[];
}

// ---- User Type ----
export interface AppUser {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  address?: string;
  gender?: string;
  avatar_url?: string;
}

// ---- Toast Type ----
export interface ToastInfo {
  id: number;
  message: string;
  type?: 'success' | 'info' | 'error';
}

// ---- Checkout Options ----
export interface CheckoutOptions {
  directItem?: FoodItem;
  directQuantity?: number;
  selectedAddons?: FoodAddon[];
}

// ---- Context Shape ----
interface AppContextType {
  // Cart
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  isCartOpen: boolean;
  addToCart: (item: FoodItem, quantity?: number, selectedAddons?: FoodAddon[]) => void;
  removeFromCart: (itemId: number | string) => void;
  updateQuantity: (itemId: number | string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Auth
  user: AppUser | null;
  restaurant: SafeRestaurant | null;
  role: 'user' | 'restaurant' | null;
  isAuthLoading: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;

  // Toast
  toast: ToastInfo | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  hideToast: () => void;

  // Auth Modal
  isAuthModalOpen: boolean;
  authModalInitialTab?: 'signin' | 'signup';
  authModalInitialRole?: 'user' | 'restaurant';
  openAuthModal: (options?: { onSuccess?: () => void; tab?: 'signin' | 'signup'; role?: 'user' | 'restaurant' }) => void;
  closeAuthModal: () => void;
  handleAuthSuccess: () => void;

  // Profile Modal
  isProfileModalOpen: boolean;
  profileModalMode: 'view' | 'edit';
  openProfileModal: (mode?: 'view' | 'edit') => void;
  closeProfileModal: () => void;

  // Checkout / Place Order Modal
  isCheckoutModalOpen: boolean;
  checkoutItems: CartItem[];
  isDirectOrder: boolean;
  openCheckoutModal: (options?: CheckoutOptions) => void;
  closeCheckoutModal: () => void;

  // Seamless Place Order Workflow
  startPlaceOrderFlow: (options?: CheckoutOptions) => void;

  // Wishlist
  wishlistFoodIds: number[];
  toggleWishlist: (foodId: number) => Promise<void>;
  isWishlisted: (foodId: number) => boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [restaurant, setRestaurant] = useState<SafeRestaurant | null>(null);
  const [role, setRole] = useState<'user' | 'restaurant' | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Toast State
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'signin' | 'signup'>('signin');
  const [authModalInitialRole, setAuthModalInitialRole] = useState<'user' | 'restaurant'>('user');
  const pendingAuthActionRef = useRef<(() => void) | null>(null);

  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState<'view' | 'edit'>('view');

  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [isDirectOrder, setIsDirectOrder] = useState(false);

  // Wishlist State
  const [wishlistFoodIds, setWishlistFoodIds] = useState<number[]>([]);

  // ---- Derived cart values ----
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => {
    const addonsTotal = (item.selectedAddons || []).reduce((s, a) => s + Number(a.price), 0);
    return sum + (Number(item.food.sale_price) + addonsTotal) * item.quantity;
  }, 0);

  // ---- Toast handlers ----
  const hideToast = useCallback(() => {
    setToast(null);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    const newToast: ToastInfo = { id: Date.now(), message, type };
    setToast(newToast);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // ---- Fetch current user/restaurant on mount ----
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const json = await res.json();
      if (json.success) {
        if (json.role === 'restaurant') {
          setRestaurant(json.restaurant);
          setUser(null);
          setRole('restaurant');
        } else {
          setUser(json.user);
          setRestaurant(null);
          setRole('user');
        }
      } else {
        setUser(null);
        setRestaurant(null);
        setRole(null);
      }
    } catch {
      setUser(null);
      setRestaurant(null);
      setRole(null);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // ---- Wishlist: fetch IDs when user changes ----
  useEffect(() => {
    if (role === 'user') {
      fetch('/api/wishlist')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.foodIds) setWishlistFoodIds(data.foodIds);
        })
        .catch(() => {});
    } else {
      setWishlistFoodIds([]);
    }
  }, [role]);

  // ---- Cart actions ----
  const addToCart = useCallback((item: FoodItem, quantity = 1, selectedAddons?: FoodAddon[]) => {
    const sortedAddons = selectedAddons ? [...selectedAddons].sort((a, b) => a.id - b.id) : [];
    const addonKey = sortedAddons.map((a) => a.id).join('-');
    const cartItemId = `${item.id}_${addonKey}`;

    setCartItems((prev) => {
      const existing = prev.find((ci) => (ci.id ? ci.id === cartItemId : ci.food.id === item.id && !ci.selectedAddons?.length && !sortedAddons.length));
      if (existing) {
        return prev.map((ci) => {
          const match = ci.id ? ci.id === cartItemId : ci.food.id === item.id && !ci.selectedAddons?.length && !sortedAddons.length;
          return match ? { ...ci, quantity: ci.quantity + quantity } : ci;
        });
      }
      return [...prev, { id: cartItemId, food: item, quantity, selectedAddons: sortedAddons }];
    });

    const qtyText = quantity > 1 ? `${quantity}x ` : '';
    const addonText = sortedAddons.length > 0 ? ` (+${sortedAddons.length} addon${sortedAddons.length > 1 ? 's' : ''})` : '';
    showToast(`Added ${qtyText}"${item.name}"${addonText} to your cart!`, 'success');
  }, [showToast]);

  const removeFromCart = useCallback((identifier: number | string) => {
    setCartItems((prev) => prev.filter((ci) => (ci.id ? ci.id !== String(identifier) : ci.food.id !== Number(identifier))));
    showToast('Item removed from cart', 'info');
  }, [showToast]);

  const updateQuantity = useCallback((identifier: number | string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((ci) => (ci.id ? ci.id !== String(identifier) : ci.food.id !== Number(identifier))));
    } else {
      setCartItems((prev) =>
        prev.map((ci) => {
          const match = ci.id ? ci.id === String(identifier) : ci.food.id === Number(identifier);
          return match ? { ...ci, quantity } : ci;
        })
      );
    }
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  // ---- Sign out ----
  const signOut = useCallback(async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    setUser(null);
    setRestaurant(null);
    setRole(null);
    showToast('Signed out successfully', 'info');
  }, [showToast]);

  // ---- Auth Modal Actions ----
  const openAuthModal = useCallback((options?: { onSuccess?: () => void; tab?: 'signin' | 'signup'; role?: 'user' | 'restaurant' }) => {
    if (options?.onSuccess) {
      pendingAuthActionRef.current = options.onSuccess;
    } else {
      pendingAuthActionRef.current = null;
    }
    if (options?.tab) setAuthModalInitialTab(options.tab);
    if (options?.role) setAuthModalInitialRole(options.role);
    setIsAuthModalOpen(true);
  }, []);

  // ---- Wishlist Actions ----
  const toggleWishlist = useCallback(async (foodId: number) => {
    if (!user) {
      openAuthModal({ tab: 'signin', role: 'user' });
      return;
    }
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food_id: foodId }),
      });
      if (res.ok) {
        const data = await res.json();
        setWishlistFoodIds(prev =>
          data.wishlisted
            ? [...prev, foodId]
            : prev.filter(id => id !== foodId)
        );
        showToast(
          data.wishlisted ? 'Added to wishlist ❤️' : 'Removed from wishlist',
          data.wishlisted ? 'success' : 'info'
        );
      }
    } catch {
      showToast('Failed to update wishlist', 'error');
    }
  }, [user, openAuthModal, showToast]);

  const isWishlisted = useCallback((foodId: number) => wishlistFoodIds.includes(foodId), [wishlistFoodIds]);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    pendingAuthActionRef.current = null;
  }, []);

  const handleAuthSuccess = useCallback(() => {
    setIsAuthModalOpen(false);
    if (pendingAuthActionRef.current) {
      const callback = pendingAuthActionRef.current;
      pendingAuthActionRef.current = null;
      setTimeout(() => {
        callback();
      }, 150);
    }
  }, []);

  // ---- Profile Modal Actions ----
  const openProfileModal = useCallback((mode: 'view' | 'edit' = 'view') => {
    setProfileModalMode(mode);
    setIsProfileModalOpen(true);
  }, []);

  const closeProfileModal = useCallback(() => {
    setIsProfileModalOpen(false);
  }, []);

  // ---- Checkout / Place Order Modal Actions ----
  const openCheckoutModal = useCallback((options?: CheckoutOptions) => {
    if (options?.directItem) {
      const sortedAddons = options.selectedAddons ? [...options.selectedAddons].sort((a, b) => a.id - b.id) : [];
      const addonKey = sortedAddons.map((a) => a.id).join('-');
      setCheckoutItems([{
        id: `${options.directItem.id}_${addonKey}`,
        food: options.directItem,
        quantity: options.directQuantity || 1,
        selectedAddons: sortedAddons,
      }]);
      setIsDirectOrder(true);
    } else {
      setCheckoutItems(cartItems);
      setIsDirectOrder(false);
    }
    setIsCartOpen(false);
    setIsCheckoutModalOpen(true);
  }, [cartItems]);

  const closeCheckoutModal = useCallback(() => {
    setIsCheckoutModalOpen(false);
  }, []);

  // ---- Seamless Place Order Flow ----
  const startPlaceOrderFlow = useCallback((options?: CheckoutOptions) => {
    if (!user) {
      openAuthModal({
        onSuccess: () => openCheckoutModal(options),
      });
      return;
    }

    openCheckoutModal(options);
  }, [user, openAuthModal, openCheckoutModal]);

  return (
    <AppContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        isCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        user,
        restaurant,
        role,
        isAuthLoading,
        refreshUser,
        signOut,
        toast,
        showToast,
        hideToast,
        isAuthModalOpen,
        authModalInitialTab,
        authModalInitialRole,
        openAuthModal,
        closeAuthModal,
        handleAuthSuccess,
        isProfileModalOpen,
        profileModalMode,
        openProfileModal,
        closeProfileModal,
        isCheckoutModalOpen,
        checkoutItems,
        isDirectOrder,
        openCheckoutModal,
        closeCheckoutModal,
        startPlaceOrderFlow,
        wishlistFoodIds,
        toggleWishlist,
        isWishlisted,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
