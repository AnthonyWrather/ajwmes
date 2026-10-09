import React from 'react';
import { Logo } from './brand/Logo';
import { PWAInstallButton } from './pwa/PWAInstallButton';
import { UserRole, UserProfile } from '../types';
import { 
  Sparkles, 
  User, 
  Shield, 
  Wrench, 
  Menu, 
  X, 
  ShoppingBag, 
  Truck, 
  WifiOff, 
  RefreshCw, 
  Zap, 
  Package, 
  Globe, 
  Key 
} from 'lucide-react';
import { ROLE_CONFIGS } from '../lib/auth';

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  onOpenBookingModal: () => void;
  cartCount?: number;
  onOpenCart?: () => void;
  isFirebaseConnected?: boolean;
  onRetrySync?: () => void;
  isCheckingSync?: boolean;
  onOpenAuthModal?: () => void;
  currentUserProfile?: UserProfile;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  setCurrentTab,
  currentUserRole,
  setCurrentUserRole,
  onOpenBookingModal,
  cartCount = 0,
  onOpenCart,
  isFirebaseConnected = false,
  onRetrySync,
  isCheckingSync = false,
  onOpenAuthModal,
  currentUserProfile
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleSelectRole = (role: UserRole) => {
    setCurrentUserRole(role);
    if (role === 'technician') {
      setCurrentTab('technician');
    } else if (role === 'postal') {
      setCurrentTab('postal');
    } else if (role === 'admin') {
      setCurrentTab('admin');
    } else if (role === 'client') {
      setCurrentTab('portal');
    } else if (role === 'guest') {
      if (currentTab === 'technician' || currentTab === 'postal' || currentTab === 'admin' || currentTab === 'portal') {
        setCurrentTab('home');
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark & Anchor-Bolt */}
        <div 
          onClick={() => setCurrentTab('home')}
          className="cursor-pointer shrink-0"
        >
          <Logo size="md" showSubtitle={false} />
        </div>

        {/* Zone 2: Clean Text Navigation Links - Role Adaptive */}
        <nav className="hidden md:flex items-center gap-4 text-xs font-semibold text-slate-400">
          <button
            onClick={() => setCurrentTab('home')}
            className={`hover:text-white transition-colors ${currentTab === 'home' ? 'text-white font-bold' : ''}`}
          >
            Services &amp; Solent
          </button>

          <button
            onClick={() => setCurrentTab('store')}
            className={`hover:text-sky-300 transition-colors flex items-center gap-1.5 ${currentTab === 'store' ? 'text-sky-400 font-bold' : ''}`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-sky-400" />
            <span>Parts Store</span>
          </button>

          <button
            onClick={() => setCurrentTab('tracker')}
            className={`hover:text-sky-300 transition-colors flex items-center gap-1.5 ${currentTab === 'tracker' ? 'text-sky-400 font-bold' : ''}`}
          >
            <Truck className="w-3.5 h-3.5 text-sky-400" />
            <span>Track Order</span>
          </button>

          {/* Guest, Client, Admin: Switch Panels */}
          {(currentUserRole === 'guest' || currentUserRole === 'client' || currentUserRole === 'admin') && (
            <>
              <button
                onClick={() => setCurrentTab('designer')}
                className={`hover:text-white transition-colors flex items-center gap-1 ${currentTab === 'designer' ? 'text-sky-400 font-bold' : ''}`}
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Switch Panels</span>
              </button>
              <button
                onClick={() => setCurrentTab('replica')}
                className={`hover:text-white transition-colors ${currentTab === 'replica' ? 'text-white font-bold' : ''}`}
              >
                Replica Panels
              </button>
            </>
          )}

          {/* Client & Admin: Vessel Portal */}
          {(currentUserRole === 'client' || currentUserRole === 'admin') && (
            <button
              onClick={() => setCurrentTab('portal')}
              className={`hover:text-white transition-colors flex items-center gap-1 ${currentTab === 'portal' ? 'text-sky-400 font-bold' : ''}`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Vessel Portal</span>
            </button>
          )}

          {/* Technician Exclusive Workstation Tab */}
          {(currentUserRole === 'technician' || currentUserRole === 'admin') && (
            <button
              onClick={() => setCurrentTab('technician')}
              className={`hover:text-amber-300 transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
                currentTab === 'technician' 
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 font-bold shadow-sm shadow-amber-950' 
                  : 'text-amber-400/90 border-amber-500/30 hover:bg-amber-950/40'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Tech Jobs</span>
            </button>
          )}

          {/* Postal Exclusive Dispatch Tab */}
          {(currentUserRole === 'postal' || currentUserRole === 'admin') && (
            <button
              onClick={() => setCurrentTab('postal')}
              className={`hover:text-purple-300 transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
                currentTab === 'postal' 
                  ? 'bg-purple-950/80 text-purple-300 border-purple-500/50 font-bold shadow-sm shadow-purple-950' 
                  : 'text-purple-400/90 border-purple-500/30 hover:bg-purple-950/40'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-purple-400" />
              <span>Postal Dispatch</span>
            </button>
          )}

          {/* Admin Workshop Tab */}
          {currentUserRole === 'admin' && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`hover:text-sky-300 transition-colors flex items-center gap-1 ${currentTab === 'admin' ? 'text-sky-400 font-bold' : ''}`}
            >
              <Wrench className="w-3.5 h-3.5 text-sky-400" />
              <span>Master Workshop</span>
            </button>
          )}
        </nav>

        {/* Zone 3: 5-Role Switcher Bar & Auth Trigger */}
        <div className="flex items-center gap-2.5">
          {/* Cart Icon & Badge Trigger */}
          <button
            onClick={() => {
              if (onOpenCart) {
                onOpenCart();
              } else {
                setCurrentTab('store');
              }
            }}
            className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            title="View Postal Order Basket"
          >
            <ShoppingBag className="w-4 h-4 text-sky-400" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in-50">
                {cartCount}
              </span>
            )}
          </button>

          {/* Comprehensive 5-Role Quick Switcher */}
          <div className="hidden lg:flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs gap-0.5">
            <span className="text-[10px] text-slate-500 px-1 font-mono uppercase">Role:</span>
            
            <button
              onClick={() => handleSelectRole('guest')}
              title="Guest: Order goods & switch panels online"
              className={`px-2 py-0.5 rounded-lg font-medium text-[11px] transition-colors cursor-pointer ${
                currentUserRole === 'guest' ? 'bg-slate-700 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Guest
            </button>

            <button
              onClick={() => handleSelectRole('client')}
              title="Client: Vessel owner specs, custom panels & job progress"
              className={`px-2 py-0.5 rounded-lg font-medium text-[11px] transition-colors cursor-pointer ${
                currentUserRole === 'client' ? 'bg-sky-600 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Client
            </button>

            <button
              onClick={() => handleSelectRole('technician')}
              title="Technician: Work on assigned boat jobs & diagnostics only"
              className={`px-2 py-0.5 rounded-lg font-medium text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                currentUserRole === 'technician' ? 'bg-amber-600 text-white font-bold shadow-xs' : 'text-amber-400 hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span>Tech</span>
            </button>

            <button
              onClick={() => handleSelectRole('postal')}
              title="Postal: Package and send online store postal orders only"
              className={`px-2 py-0.5 rounded-lg font-medium text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                currentUserRole === 'postal' ? 'bg-purple-600 text-white font-bold shadow-xs' : 'text-purple-400 hover:text-white'
              }`}
            >
              <Package className="w-3 h-3 text-purple-300" />
              <span>Postal</span>
            </button>

            <button
              onClick={() => handleSelectRole('admin')}
              title="Admin: Jobs, Images, Postal Orders, Stock/Catalog & Print Studio"
              className={`px-2 py-0.5 rounded-lg font-medium text-[11px] transition-colors cursor-pointer ${
                currentUserRole === 'admin' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-emerald-400 hover:text-white'
              }`}
            >
              Admin
            </button>

            {/* Auth / Role Details Popover Button */}
            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="ml-1 p-1 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition-colors"
                title="Manage User Authentication & Role Permissions"
              >
                <Key className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Current Role Badge on Medium screens */}
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className={`hidden sm:flex lg:hidden items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border cursor-pointer ${ROLE_CONFIGS[currentUserRole].badgeClass}`}
              title="Click to switch role or view Firebase Auth"
            >
              <span className="font-bold">{ROLE_CONFIGS[currentUserRole].shortLabel}</span>
            </button>
          )}

          {/* Real-time Firestore Cloud Sync Status */}
          {isFirebaseConnected ? (
            <div 
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/70 border border-emerald-500/30 rounded-lg text-[10px] font-mono text-emerald-300"
              title="Connected to live Firebase Firestore database"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Firestore</span>
            </div>
          ) : (
            <button
              onClick={onRetrySync}
              disabled={isCheckingSync}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900/80 border border-amber-500/40 rounded-lg text-[10px] font-mono text-amber-300 transition-colors cursor-pointer group"
              title="Firestore disconnected · Click to retry connection."
            >
              {isCheckingSync ? (
                <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
              ) : (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              )}
              <span className="group-hover:underline">
                {isCheckingSync ? 'Connecting...' : 'Sync Delayed'}
              </span>
            </button>
          )}

          {/* In-App PWA Install Button */}
          <PWAInstallButton />

          {/* Primary Action Button */}
          <button
            onClick={onOpenBookingModal}
            className="px-3.5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:scale-95 transition-all rounded-xl shadow-md shadow-sky-600/30 whitespace-nowrap cursor-pointer"
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
        <div className="md:hidden bg-slate-950 border-b border-slate-800 p-4 space-y-4 animate-in slide-in-from-top-2">
          {/* Mobile Role Switcher */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
              Active User Role:
            </span>
            <div className="grid grid-cols-5 gap-1 text-xs">
              {(['guest', 'client', 'technician', 'postal', 'admin'] as UserRole[]).map(r => (
                <button
                  key={r}
                  onClick={() => {
                    handleSelectRole(r);
                  }}
                  className={`py-1.5 px-1 rounded-lg text-center font-semibold text-[11px] capitalize border ${
                    currentUserRole === r
                      ? 'bg-sky-600 text-white border-sky-500'
                      : 'bg-slate-900 text-slate-300 border-slate-800'
                  }`}
                >
                  {r === 'technician' ? 'Tech' : r}
                </button>
              ))}
            </div>
            {onOpenAuthModal && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuthModal();
                }}
                className="w-full text-center py-1.5 text-xs text-sky-400 hover:underline flex items-center justify-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Open Firebase Auth &amp; Role Details</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-2 border-t border-slate-900">
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

            {(currentUserRole === 'guest' || currentUserRole === 'client' || currentUserRole === 'admin') && (
              <>
                <button
                  onClick={() => { setCurrentTab('designer'); setMobileMenuOpen(false); }}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-left text-sky-400"
                >
                  Switch Panels
                </button>
                <button
                  onClick={() => { setCurrentTab('replica'); setMobileMenuOpen(false); }}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-left text-white"
                >
                  Replica Panels
                </button>
              </>
            )}

            {(currentUserRole === 'client' || currentUserRole === 'admin') && (
              <button
                onClick={() => { setCurrentTab('portal'); setMobileMenuOpen(false); }}
                className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-left text-white"
              >
                Vessel Portal
              </button>
            )}

            {(currentUserRole === 'technician' || currentUserRole === 'admin') && (
              <button
                onClick={() => { setCurrentTab('technician'); setMobileMenuOpen(false); }}
                className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-left text-amber-300 font-bold col-span-2 flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>⚡ Technician Jobs Station</span>
              </button>
            )}

            {(currentUserRole === 'postal' || currentUserRole === 'admin') && (
              <button
                onClick={() => { setCurrentTab('postal'); setMobileMenuOpen(false); }}
                className="p-2.5 rounded-lg bg-purple-950/60 border border-purple-500/40 text-left text-purple-300 font-bold col-span-2 flex items-center gap-2"
              >
                <Package className="w-4 h-4 text-purple-400" />
                <span>📦 Postal Fulfillment Dispatch Station</span>
              </button>
            )}

            {currentUserRole === 'admin' && (
              <button
                onClick={() => { setCurrentTab('admin'); setMobileMenuOpen(false); }}
                className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-left text-sky-300 col-span-2"
              >
                Anthony's Master Workshop
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

