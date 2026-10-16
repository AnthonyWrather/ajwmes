import React, { useState, useRef, useEffect } from 'react';
import { Logo } from './brand/Logo';
import { PWAInstallButton } from './pwa/PWAInstallButton';
import { UserRole, UserProfile } from '../types';
import { 
  Sparkles, 
  User, 
  Wrench, 
  Menu, 
  X, 
  ShoppingBag, 
  Truck, 
  RefreshCw, 
  Zap, 
  Package, 
  Key,
  LogOut,
  ChevronDown,
  Ship
} from 'lucide-react';
import { ROLE_CONFIGS } from '../lib/auth';
import { canAccessRoute } from '../lib/rbac';
import { detectEnvironment, getEnvironmentBadge, canAccessEnvironmentSettings } from '../lib/environment';
import { APP_VERSION, FULL_VERSION_TAG, GIT_COMMIT_SHA } from '../version';

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUserRole: UserRole;
  setCurrentUserRole?: (role: UserRole) => void;
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
  onOpenEnvironmentSettings?: () => void;
  onOpenTeamRoles?: () => void;
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
  onOpenAccountModal,
  onOpenEnvironmentSettings,
  onOpenTeamRoles
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const envInfo = detectEnvironment();
  const envBadge = getEnvironmentBadge(envInfo.envCode);
  const canOpenEnvSettings = canAccessEnvironmentSettings(envInfo.envCode, currentUserRole);

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

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark, Anchor-Bolt & Release Version Label */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div 
            onClick={() => setCurrentTab('home')}
            className="cursor-pointer shrink-0"
            title="AJWMES · Home"
          >
            <Logo size="md" showSubtitle={false} />
          </div>

          {/* Release Version & Environment Tracker Tag */}
          <button
            data-testid="header-version-badge"
            disabled={!canOpenEnvSettings}
            onClick={canOpenEnvSettings ? onOpenEnvironmentSettings : undefined}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-medium transition-all shadow-xs ${
              canOpenEnvSettings
                ? `cursor-pointer active:scale-95 group ${envBadge.badgeClass}`
                : 'cursor-not-allowed opacity-75 bg-emerald-950/50 text-emerald-300/80 border-emerald-500/30'
            }`}
            title={
              canOpenEnvSettings
                ? `Release ${FULL_VERSION_TAG} [${envBadge.label}] · Commit: ${GIT_COMMIT_SHA} · Click to open Multi-Environment & Release Manager`
                : `Release ${FULL_VERSION_TAG} [${envBadge.label}] · Commit: ${GIT_COMMIT_SHA} · Multi-Environment & Release Manager requires Administrator privileges`
            }
          >
            <span className={`w-1.5 h-1.5 rounded-full ${envBadge.dotColor} animate-pulse`} />
            <span className="font-bold tracking-tight text-white group-hover:underline">{FULL_VERSION_TAG}</span>
            <span className="opacity-30">|</span>
            <span className="uppercase text-[9px] font-semibold tracking-wider">{envBadge.shortLabel}</span>
          </button>
        </div>

        {/* Zone 2: Clean Text Navigation Links - Role Adaptive (≥ 1280px) */}
        <nav className="hidden xl:flex items-center gap-4 text-xs font-semibold text-slate-400">

          <button
            data-testid="nav-tab-store"
            onClick={() => setCurrentTab('store')}
            className={`hover:text-sky-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${currentTab === 'store' ? 'text-sky-400 font-bold' : ''}`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-sky-400" />
            <span>Parts Store</span>
          </button>

          <button
            data-testid="nav-tab-tracker"
            onClick={() => setCurrentTab('tracker')}
            className={`hover:text-sky-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${currentTab === 'tracker' ? 'text-sky-400 font-bold' : ''}`}
          >
            <Truck className="w-3.5 h-3.5 text-sky-400" />
            <span>Track Order</span>
          </button>

          {/* Switch Panels & Replica: check RBAC */}
          {canAccessRoute(currentUserRole, 'designer') && (
            <button
              onClick={() => setCurrentTab('designer')}
              className={`hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${currentTab === 'designer' ? 'text-sky-400 font-bold' : ''}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Switch Panels</span>
            </button>
          )}

          {canAccessRoute(currentUserRole, 'replica') && (
            <button
              onClick={() => setCurrentTab('replica')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${currentTab === 'replica' ? 'text-white font-bold' : ''}`}
            >
              Replica Panels
            </button>
          )}

          {/* Client Vessel Portal: check RBAC */}
          {canAccessRoute(currentUserRole, 'portal') && (
            <button
              onClick={() => setCurrentTab('portal')}
              className={`hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${currentTab === 'portal' ? 'text-sky-400 font-bold' : ''}`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Vessel Portal</span>
            </button>
          )}

          {/* Technician Exclusive Workstation Tab */}
          {canAccessRoute(currentUserRole, 'technician') && (
            <button
              data-testid="nav-tab-technician"
              onClick={() => setCurrentTab('technician')}
              className={`hover:text-amber-300 transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg border whitespace-nowrap shrink-0 ${
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
              data-testid="nav-tab-postal"
              onClick={() => setCurrentTab('postal')}
              className={`hover:text-purple-300 transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg border whitespace-nowrap shrink-0 ${
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
              className={`hover:text-sky-300 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${currentTab === 'admin' ? 'text-sky-400 font-bold' : ''}`}
            >
              <Wrench className="w-3.5 h-3.5 text-sky-400" />
              <span>Master Workshop</span>
            </button>
          )}
        </nav>

        {/* Zone 3: User Authentication & Role Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Cart Icon & Badge Trigger */}
            <button
              data-testid="nav-cart-button"
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
                  data-testid="nav-signin-button"
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
              <div className="relative" ref={dropdownRef} data-testid="user-account-badge">
                <button
                  data-testid="user-account-button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 pr-2 sm:pr-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group max-w-[140px] xs:max-w-[170px] sm:max-w-[200px]"
                  title="Account settings & profile menu"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-slate-200 font-bold text-xs shrink-0">
                    {currentUserProfile?.avatarUrl ? (
                      <img src={currentUserProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-sky-400" />
                    )}
                  </div>
                  <div className="flex flex-col text-left leading-none min-w-0 max-w-[65px] xs:max-w-[90px] sm:max-w-[120px]">
                    <span data-testid="user-profile-name" className="text-[11px] font-bold text-white truncate block">
                      {currentUserProfile?.name || 'Account'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono capitalize truncate block">
                      {ROLE_CONFIGS[currentUserRole].badge}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${userDropdownOpen ? 'rotate-180' : ''}`} />
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
                      data-testid="nav-manage-account-button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenAccountModal?.();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <User className="w-3.5 h-3.5 text-sky-400" />
                      <span>{canAccessRoute(currentUserRole, 'portal') ? 'Manage Account & Specs' : 'Manage Account'}</span>
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

          {/* In-App PWA Install Button */}
          <PWAInstallButton />

          {/* Primary Action Button */}
          <button
            onClick={onOpenBookingModal}
            className="px-2.5 sm:px-3.5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:scale-95 transition-all rounded-xl shadow-md shadow-sky-600/30 whitespace-nowrap cursor-pointer shrink-0"
          >
            Book (£25/hr)
          </button>

          {/* Mobile menu toggle */}
          <button
            data-testid="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-slate-400 hover:text-white cursor-pointer"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Drawer Menu (< 1280px) */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-slate-950 border-b border-slate-800 p-4 space-y-4 animate-in slide-in-from-top-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
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

                <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2.5 border-t border-slate-800/80 text-xs">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAccountModal?.();
                    }}
                    className="py-1.5 px-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl font-semibold flex items-center justify-center gap-1 border border-slate-750"
                  >
                    <User className="w-3.5 h-3.5 text-sky-400" />
                    <span>Account</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenSignOffModal?.();
                    }}
                    className="py-1.5 px-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 rounded-xl font-semibold flex items-center justify-center gap-1 border border-rose-500/30"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sign Off</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Release Version & Target Environment Tracker */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${envBadge.dotColor} animate-pulse`} />
              <div className="flex flex-col">
                <span className="font-mono text-white font-bold">Release v{APP_VERSION}</span>
                <span className="text-[10px] text-slate-400 font-mono">{envInfo.envName}</span>
              </div>
            </div>
            <button
              data-testid="mobile-version-settings-button"
              disabled={!canOpenEnvSettings}
              onClick={() => {
                if (!canOpenEnvSettings) return;
                setMobileMenuOpen(false);
                onOpenEnvironmentSettings?.();
              }}
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold uppercase transition-colors ${
                canOpenEnvSettings
                  ? `cursor-pointer ${envBadge.badgeClass}`
                  : 'cursor-not-allowed opacity-50 bg-emerald-950/40 text-emerald-300/60 border-emerald-500/20'
              }`}
            >
              {envBadge.shortLabel} Settings
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-2 border-t border-slate-900">
            <button
              data-testid="mobile-nav-tab-store"
              onClick={() => { setCurrentTab('store'); setMobileMenuOpen(false); }}
              className="p-2.5 rounded-lg bg-slate-900 border border-sky-500/40 text-left text-sky-400 font-bold flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Parts Store {cartCount > 0 ? `(${cartCount})` : ''}</span>
            </button>
            <button
              data-testid="mobile-nav-tab-tracker"
              onClick={() => { setCurrentTab('tracker'); setMobileMenuOpen(false); }}
              className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-left text-sky-400 flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
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
                data-testid="mobile-nav-tab-technician"
                onClick={() => { setCurrentTab('technician'); setMobileMenuOpen(false); }}
                className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-left text-amber-300 font-bold col-span-2 flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>⚡ Technician Jobs Station</span>
              </button>
            )}

            {canAccessRoute(currentUserRole, 'postal') && (
              <button
                data-testid="mobile-nav-tab-postal"
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
          </div>
        </div>
      )}
    </header>
  );
};

