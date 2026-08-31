import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import CartSidebar from '@/components/CartSidebar';
import AuthModal from '@/components/AuthModal';
import CheckoutModal from '@/components/CheckoutModal';
import Toast from '@/components/Toast';

export const metadata: Metadata = {
  title: 'KHEYE NOW! | Food Delivery System',
  description: 'Fast, delicious food delivery powered by Next.js and SQL database engine.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased">
        <AppProvider>
          {children}
          <CartSidebar />
          <AuthModal />
          <CheckoutModal />
          <Toast />
        </AppProvider>
      </body>
    </html>
  );
}

