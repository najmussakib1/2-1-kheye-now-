'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { FoodItem } from '@/lib/db';

// ---- Cart Types ----
export interface CartItem {
  food: FoodItem;
  quantity: number;
}

// ---- User Type ----
export interface AppUser {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  address?: string;
  gender?: string;
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
}

// ---- Context Shape ----
interface AppContextType {
  // Cart
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  isCartOpen: boolean;
  addToCart: (item: FoodItem, quantity?: number) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Auth
  user: AppUser | null;
  isAuthLoading: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;

  // Toast
  toast: ToastInfo | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  hideToast: () => void;

  // Auth Modal
  isAuthModalOpen: boolean;
  openAuthModal: (onSuccess?: () => void) => void;
  closeAuthModal: () => void;
  handleAuthSuccess: () => void;

  // Checkout / Place Order Modal
  isCheckoutModalOpen: boolean;
  checkoutItems: CartItem[];
  isDirectOrder: boolean;
  openCheckoutModal: (options?: CheckoutOptions) => void;
  closeCheckoutModal: () => void;

  // Seamless Place Order Workflow
  startPlaceOrderFlow: (options?: CheckoutOptions) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Toast State
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const pendingAuthActionRef = useRef<(() => void) | null>(null);

  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [isDirectOrder, setIsDirectOrder] = useState(false);

  // ---- Derived cart values ----
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.food.sale_price * item.quantity, 0);

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

  // ---- Fetch current user on mount ----
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const json = await res.json();
      setUser(json.success ? json.user : null);
    } catch {
      setUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // ---- Cart actions (Add to cart now shows message without opening sidebar!) ----
  const addToCart = useCallback((item: FoodItem, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.food.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.food.id === item.id ? { ...ci, quantity: ci.quantity + quantity } : ci
        );
      }
      return [...prev, { food: item, quantity }];
    });

    // Notify user with message that conveys the product has been added
    const qtyText = quantity > 1 ? `${quantity}x ` : '';
    showToast(`Added ${qtyText}"${item.name}" to your cart!`, 'success');
  }, [showToast]);

  const removeFromCart = useCallback((itemId: number) => {
    setCartItems((prev) => prev.filter((ci) => ci.food.id !== itemId));
    showToast('Item removed from cart', 'info');
  }, [showToast]);

  const updateQuantity = useCallback((itemId: number, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((ci) => ci.food.id !== itemId));
    } else {
      setCartItems((prev) =>
        prev.map((ci) => (ci.food.id === itemId ? { ...ci, quantity } : ci))
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
    showToast('Signed out successfully', 'info');
  }, [showToast]);

  // ---- Auth Modal Actions ----
  const openAuthModal = useCallback((onSuccess?: () => void) => {
    if (onSuccess) {
      pendingAuthActionRef.current = onSuccess;
    } else {
      pendingAuthActionRef.current = null;
    }
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    pendingAuthActionRef.current = null;
  }, []);

  const handleAuthSuccess = useCallback(() => {
    setIsAuthModalOpen(false);
    if (pendingAuthActionRef.current) {
      const callback = pendingAuthActionRef.current;
      pendingAuthActionRef.current = null;
      // Delay slightly for smooth modal transition
      setTimeout(() => {
        callback();
      }, 150);
    }
  }, []);

  // ---- Checkout / Place Order Modal Actions ----
  const openCheckoutModal = useCallback((options?: CheckoutOptions) => {
    if (options?.directItem) {
      setCheckoutItems([{ food: options.directItem, quantity: options.directQuantity || 1 }]);
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
    // If user is not logged in, pop up the login modal
    if (!user) {
      openAuthModal(() => {
        // After user logs in successfully, automatically open checkout modal
        openCheckoutModal(options);
      });
      return;
    }

    // User is logged in, open checkout modal directly
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
        isAuthLoading,
        refreshUser,
        signOut,
        toast,
        showToast,
        hideToast,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        handleAuthSuccess,
        isCheckoutModalOpen,
        checkoutItems,
        isDirectOrder,
        openCheckoutModal,
        closeCheckoutModal,
        startPlaceOrderFlow,
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
