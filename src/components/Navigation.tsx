import React, { useState, useRef, useEffect } from 'react';
import { Logo } from './brand/Logo';
import { PWAInstallButton } from './pwa/PWAInstallButton';
import { UserRole, UserProfile } from '../types';
import { 
  Sparkles, 
  User, 
  Shield, 
  ShieldCheck,
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
  Key,
  LogOut,
  ChevronDown,
  Settings,
  Ship
} from 'lucide-react';
import { ROLE_CONFIGS } from '../lib/auth';
import { canAccessRoute, getDefaultRouteForRole, AppRoute } from '../lib/rbac';

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
  onOpenPermissionsMatrix?: () => void;
  currentUserProfile?: UserProfile;
  onOpenSignInModal?: () => void;
  onOpenSignOffModal?: () => void;
  onOpenAccountModal?: () => void;
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
  onOpenPermissionsMatrix,
  currentUserProfile,
  onOpenSignInModal,
  onOpenSignOffModal,
  onOpenAccountModal
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRole = (role: UserRole) => {
    setCurrentUserRole(role);
    // If current tab is not permitted for the new role, redirect to the role's default view
    if (!canAccessRoute(role, currentTab as AppRoute)) {
      setCurrentTab(getDefaultRouteForRole(role));
    } else {
      // If switching directly into role specific views
      if (role === 'technician') setCurrentTab('technician');
      else if (role === 'postal') setCurrentTab('postal');
      else if (role === 'admin') setCurrentTab('admin');
      else if (role === 'client' && currentTab === 'home') setCurrentTab('portal');
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

          {/* Switch Panels & Replica: check RBAC */}
          {canAccessRoute(currentUserRole, 'designer') && (
            <button
              onClick={() => setCurrentTab('designer')}
              className={`hover:text-white transition-colors flex items-center gap-1 ${currentTab === 'designer' ? 'text-sky-400 font-bold' : ''}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Switch Panels</span>
            </button>
          )}

          {canAccessRoute(currentUserRole, 'replica') && (
            <button
              onClick={() => setCurrentTab('replica')}
              className={`hover:text-white transition-colors ${currentTab === 'replica' ? 'text-white font-bold' : ''}`}
            >
              Replica Panels
            </button>
          )}

          {/* Client Vessel Portal: check RBAC */}
          {canAccessRoute(currentUserRole, 'portal') && (
            <button
              onClick={() => setCurrentTab('portal')}
              className={`hover:text-white transition-colors flex items-center gap-1 ${currentTab === 'portal' ? 'text-sky-400 font-bold' : ''}`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Vessel Portal</span>
            </button>
          )}

          {/* Technician Exclusive Workstation Tab */}
          {canAccessRoute(currentUserRole, 'technician') && (
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
          {canAccessRoute(currentUserRole, 'postal') && (
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
          {canAccessRoute(currentUserRole, 'admin') && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`hover:text-sky-300 transition-colors flex items-center gap-1 ${currentTab === 'admin' ? 'text-sky-400 font-bold' : ''}`}
            >
              <Wrench className="w-3.5 h-3.5 text-sky-400" />
              <span>Master Workshop</span>
            </button>
          )}
        </nav>

        {/* Zone 3: User Authentication & Role Controls */}
        <div className="flex items-center gap-2">
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

            {/* User Account / Sign In State */}
            {currentUserRole === 'guest' ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenSignInModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 text-sky-300 hover:text-white border border-sky-500/40 text-xs font-bold transition-all shadow-sm shadow-sky-950 cursor-pointer active:scale-95"
                  title="Sign in or register your vessel account"
                >
                  <Key className="w-3.5 h-3.5 text-sky-400" />
                  <span>Sign In</span>
                </button>
              </div>
            ) : (
              /* Signed-in Account Pill with Dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
                  title="Account settings & profile menu"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-slate-200 font-bold text-xs shrink-0">
                    {currentUserProfile?.avatarUrl ? (
                      <img src={currentUserProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-sky-400" />
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col text-left leading-none">
                    <span className="text-[11px] font-bold text-white max-w-[100px] truncate">
                      {currentUserProfile?.name || 'Account'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono capitalize">
                      {ROLE_CONFIGS[currentUserRole].badge}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 mb-2">
                      <div className="font-bold text-white truncate text-xs">{currentUserProfile?.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">{currentUserProfile?.email}</div>
                      <div className="mt-1 flex items-center justify-between gap-1 text-[10px]">
                        <span className={`px-2 py-0.5 rounded-full border font-mono uppercase ${ROLE_CONFIGS[currentUserRole].badgeClass}`}>
                          {ROLE_CONFIGS[currentUserRole].badge}
                        </span>
                        {currentUserProfile?.vesselName && (
                          <span className="text-sky-400 font-mono truncate max-w-[110px]" title={currentUserProfile.vesselName}>
                            ⛵ {currentUserProfile.vesselName}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenAccountModal?.();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <User className="w-3.5 h-3.5 text-sky-400" />
                      <span>Manage Account &amp; Specs</span>
                    </button>

                    {currentUserRole === 'client' && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setCurrentTab('portal');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <Ship className="w-3.5 h-3.5 text-sky-400" />
                        <span>Vessel Portal &amp; Electrical Log</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenAuthModal?.();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>Switch Role / Firebase Auth</span>
                    </button>

                    <div className="h-px bg-slate-800 my-1" />

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenSignOffModal?.();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 flex items-center gap-2 cursor-pointer font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Sign Off Session</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick 5-Role Switcher for rapid testing */}
            <div className="hidden xl:flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs gap-0.5">
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

              {/* Inspect Full RBAC Matrix Button */}
              {onOpenPermissionsMatrix && (
                <button
                  onClick={onOpenPermissionsMatrix}
                  className="p-1 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition-colors"
                  title="Inspect 5-Role RBAC Permissions Matrix"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
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
          {/* Mobile User Profile / Auth State Card */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5">
            {currentUserRole === 'guest' ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-950/70 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Guest Visitor</div>
                    <div className="text-[10px] text-slate-400">Sign in to save vessel specs</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenSignInModal?.();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-sm shadow-sky-600/30"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-slate-200 font-bold shrink-0">
                      {currentUserProfile?.avatarUrl ? (
                        <img src={currentUserProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-sky-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{currentUserProfile?.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{currentUserProfile?.email}</div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border shrink-0 ${ROLE_CONFIGS[currentUserRole].badgeClass}`}>
                    {ROLE_CONFIGS[currentUserRole].badge}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-xs">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAccountModal?.();
                    }}
                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl font-semibold flex items-center justify-center gap-1.5 border border-slate-750"
                  >
                    <User className="w-3.5 h-3.5 text-sky-400" />
                    <span>My Account</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenSignOffModal?.();
                    }}
                    className="py-1.5 px-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 rounded-xl font-semibold flex items-center justify-center gap-1.5 border border-rose-500/30"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sign Off</span>
                  </button>
                </div>
              </div>
            )}
          </div>

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

            {canAccessRoute(currentUserRole, 'designer') && (
              <button
                onClick={() => { setCurrentTab('designer'); setMobileMenuOpen(false); }}
                className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-left text-sky-400"
              >
                Switch Panels
              </button>
            )}

            {canAccessRoute(currentUserRole, 'replica') && (
              <button
                onClick={() => { setCurrentTab('replica'); setMobileMenuOpen(false); }}
                className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-left text-white"
              >
                Replica Panels
              </button>
            )}

            {canAccessRoute(currentUserRole, 'portal') && (
              <button
                onClick={() => { setCurrentTab('portal'); setMobileMenuOpen(false); }}
                className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-left text-white"
              >
                Vessel Portal
              </button>
            )}

            {canAccessRoute(currentUserRole, 'technician') && (
              <button
                onClick={() => { setCurrentTab('technician'); setMobileMenuOpen(false); }}
                className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-left text-amber-300 font-bold col-span-2 flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>⚡ Technician Jobs Station</span>
              </button>
            )}

            {canAccessRoute(currentUserRole, 'postal') && (
              <button
                onClick={() => { setCurrentTab('postal'); setMobileMenuOpen(false); }}
                className="p-2.5 rounded-lg bg-purple-950/60 border border-purple-500/40 text-left text-purple-300 font-bold col-span-2 flex items-center gap-2"
              >
                <Package className="w-4 h-4 text-purple-400" />
                <span>📦 Postal Fulfillment Dispatch Station</span>
              </button>
            )}

            {canAccessRoute(currentUserRole, 'admin') && (
              <button
                onClick={() => { setCurrentTab('admin'); setMobileMenuOpen(false); }}
                className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-left text-sky-300 col-span-2"
              >
                Anthony's Master Workshop
              </button>
            )}

            {onOpenPermissionsMatrix && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPermissionsMatrix();
                }}
                className="p-2.5 rounded-lg bg-slate-900/80 border border-emerald-500/30 text-left text-emerald-400 col-span-2 flex items-center gap-2 text-xs font-bold"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Inspect 5-Role RBAC Permissions Matrix</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

