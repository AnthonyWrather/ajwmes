import React from 'react';
import { Logo } from './brand/Logo';
import { PWAInstallButton } from './pwa/PWAInstallButton';
import { UserRole } from '../types';
import { Sparkles, User, Shield, Wrench, Menu, X, ShoppingBag, Truck } from 'lucide-react';

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  onOpenBookingModal: () => void;
  cartCount?: number;
  onOpenCart?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  setCurrentTab,
  currentUserRole,
  setCurrentUserRole,
  onOpenBookingModal,
  cartCount = 0,
  onOpenCart
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark & Anchor-Bolt */}
        <div 
          onClick={() => setCurrentTab('home')}
          className="cursor-pointer"
        >
          <Logo size="md" showSubtitle={false} />
        </div>

        {/* Zone 2: Clean Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-400">
          <button
            onClick={() => setCurrentTab('home')}
            className={`hover:text-white transition-colors ${currentTab === 'home' ? 'text-white' : ''}`}
          >
            Services &amp; Solent
          </button>
          <button
            onClick={() => setCurrentTab('store')}
            className={`hover:text-sky-300 transition-colors flex items-center gap-1.5 ${currentTab === 'store' ? 'text-sky-400 font-bold' : ''}`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-sky-400" />
            <span>Parts &amp; Cables Store</span>
          </button>
          <button
            onClick={() => setCurrentTab('tracker')}
            className={`hover:text-sky-300 transition-colors flex items-center gap-1.5 ${currentTab === 'tracker' ? 'text-sky-400 font-bold' : ''}`}
          >
            <Truck className="w-3.5 h-3.5 text-sky-400" />
            <span>Track Order</span>
          </button>
          <button
            onClick={() => setCurrentTab('designer')}
            className={`hover:text-white transition-colors flex items-center gap-1 ${currentTab === 'designer' ? 'text-sky-400 font-bold' : ''}`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Switch Panels</span>
          </button>
          <button
            onClick={() => setCurrentTab('replica')}
            className={`hover:text-white transition-colors ${currentTab === 'replica' ? 'text-white' : ''}`}
          >
            Replica Panels
          </button>
          <button
            onClick={() => setCurrentTab('portal')}
            className={`hover:text-white transition-colors flex items-center gap-1 ${currentTab === 'portal' ? 'text-white' : ''}`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Vessel Portal</span>
          </button>
          {currentUserRole === 'admin' && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`hover:text-sky-300 transition-colors flex items-center gap-1 ${currentTab === 'admin' ? 'text-sky-400 font-bold' : ''}`}
            >
              <Wrench className="w-3.5 h-3.5 text-sky-400" />
              <span>Workshop</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Role Switcher Demo, PWA Install & CTA */}
        <div className="flex items-center gap-3">
          {/* Cart Icon & Badge Trigger */}
          <button
            onClick={() => {
              if (onOpenCart) {
                onOpenCart();
              } else {
                setCurrentTab('store');
              }
            }}
            className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            title="View Postal Order Basket"
          >
            <ShoppingBag className="w-4 h-4 text-sky-400" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in-50">
                {cartCount}
              </span>
            )}
          </button>

          {/* Quick Role Tester Switcher (Guest vs Boat Owner vs Admin) */}
          <div className="hidden lg:flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <span className="text-[10px] text-slate-500 px-1 font-mono uppercase">Role:</span>
            <button
              onClick={() => setCurrentUserRole('guest')}
              className={`px-2 py-0.5 rounded font-medium text-[11px] transition-colors ${
                currentUserRole === 'guest' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Guest
            </button>
            <button
              onClick={() => {
                setCurrentUserRole('client');
                setCurrentTab('portal');
              }}
              className={`px-2 py-0.5 rounded font-medium text-[11px] transition-colors ${
                currentUserRole === 'client' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Client
            </button>
            <button
              onClick={() => {
                setCurrentUserRole('admin');
                setCurrentTab('admin');
              }}
              className={`px-2 py-0.5 rounded font-medium text-[11px] transition-colors ${
                currentUserRole === 'admin' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin (AJW)
            </button>
          </div>

          {/* In-App PWA Install Button */}
          <PWAInstallButton />

          {/* Primary Action Button */}
          <button
            onClick={onOpenBookingModal}
            className="px-3.5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:scale-95 transition-all rounded-xl shadow-md shadow-sky-600/30 whitespace-nowrap"
          >
            Book (£25/hr)
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 p-4 space-y-3 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              onClick={() => { setCurrentTab('home'); setMobileMenuOpen(false); }}
              className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-left text-white"
            >
              Services &amp; Solent
            </button>
            <button
              onClick={() => { setCurrentTab('store'); setMobileMenuOpen(false); }}
              className="p-2.5 rounded-lg bg-slate-900 border border-sky-500/40 text-left text-sky-400 font-bold"
            >
              Parts Store {cartCount > 0 ? `(${cartCount})` : ''}
            </button>
            <button
              onClick={() => { setCurrentTab('tracker'); setMobileMenuOpen(false); }}
              className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-left text-sky-400 flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5 text-sky-400" />
              <span>Track Order</span>
            </button>
            <button
              onClick={() => { setCurrentTab('designer'); setMobileMenuOpen(false); }}
              className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-left text-sky-400"
            >
              Switch Panel Designer
            </button>
            <button
              onClick={() => { setCurrentTab('replica'); setMobileMenuOpen(false); }}
              className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-left text-white"
            >
              Replica Panels
            </button>
            <button
              onClick={() => { setCurrentTab('portal'); setMobileMenuOpen(false); }}
              className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-left text-white"
            >
              My Vessel Portal
            </button>
            <button
              onClick={() => { setCurrentUserRole('admin'); setCurrentTab('admin'); setMobileMenuOpen(false); }}
              className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-left text-sky-300 col-span-2"
            >
              Anthony's Admin Workshop
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

