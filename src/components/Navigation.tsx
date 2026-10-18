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
  Ship,
  Camera
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
  appUpdateAvailable?: boolean;
  appUpdateTargetTag?: string;
  onApplyAppUpdate?: () => void;
  activeVersionTag?: string;
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
  onOpenTeamRoles,
  appUpdateAvailable = false,
  appUpdateTargetTag,
  onApplyAppUpdate,
  activeVersionTag
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const envInfo = detectEnvironment();
  const envBadge = getEnvironmentBadge(envInfo.envCode);
  const canOpenEnvSettings = canAccessEnvironmentSettings(envInfo.envCode, currentUserRole);
  const displayedFullTag = activeVersionTag || FULL_VERSION_TAG;

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
    <header className="sticky top-0 z-40 w-full max-w-full bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 min-h-16 py-2 flex items-center justify-between gap-1.5 sm:gap-4 min-w-0">
        {/* Zone 1: Brand Wordmark, Anchor-Bolt & Release Version Label */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
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
            className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 rounded-full border text-[10px] sm:text-[11px] font-mono font-medium transition-all shadow-xs shrink-0 ${
              canOpenEnvSettings
                ? `cursor-pointer active:scale-95 group ${envBadge.badgeClass}`
                : 'cursor-not-allowed opacity-75 bg-emerald-950/50 text-emerald-300/80 border-emerald-500/30'
            }`}
            title={
              canOpenEnvSettings
                ? `Release ${displayedFullTag} [${envBadge.label}] · Commit: ${GIT_COMMIT_SHA} · Click to open Multi-Environment & Release Manager`
                : `Release ${displayedFullTag} [${envBadge.label}] · Commit: ${GIT_COMMIT_SHA} · Multi-Environment & Release Manager requires Administrator privileges`
            }
          >
            <span className={`w-1.5 h-1.5 rounded-full ${envBadge.dotColor} animate-pulse`} />
            <span className="font-bold tracking-tight text-white group-hover:underline hidden 2xl:inline">{displayedFullTag}</span>
            <span className="font-bold tracking-tight text-white group-hover:underline 2xl:hidden">v{APP_VERSION}</span>
            <span className="opacity-30">|</span>
            <span className="uppercase text-[9px] font-semibold tracking-wider">{envBadge.shortLabel}</span>
          </button>

          {/* Persistent In-Browser Update Indicator Pill */}
          {appUpdateAvailable && (
            <button
              type="button"
              data-testid="header-update-available-badge"
              onClick={onApplyAppUpdate}
              className="flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-[10px] sm:text-[11px] font-mono font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              title={`New version ${appUpdateTargetTag || ''} ready — click to update and refresh immediately`}
            >
              <RefreshCw className="w-3 h-3 text-cyan-300 animate-spin shrink-0" />
              <span className="hidden lg:inline">Update Ready</span>
              {appUpdateTargetTag && (
                <span className="hidden 2xl:inline text-emerald-300 font-extrabold">({appUpdateTargetTag})</span>
              )}
            </button>
          )}
        </div>

        {/* Zone 2: Consistent Bordered Pill Navigation - Role Adaptive (≥ 1280px) */}
        <nav
          data-testid="desktop-nav-menu"
          className={`hidden xl:grid items-center justify-center gap-1.5 2xl:gap-2 text-xs font-semibold shrink-0 min-w-0 py-1 ${
            currentUserRole === 'admin'
              ? 'grid-cols-[repeat(4,max-content)]'
              : currentUserRole === 'client'
              ? 'grid-cols-[repeat(3,max-content)]'
              : 'grid-flow-col auto-cols-max'
          }`}
        >
          <button
            data-testid="nav-tab-store"
            onClick={() => setCurrentTab('store')}
            className={`transition-all flex items-center gap-1.5 px-2 2xl:px-2.5 py-1 rounded-lg border whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'store'
                ? 'bg-sky-950/80 text-sky-300 border-sky-500/50 font-bold shadow-xs shadow-sky-950'
                : 'text-sky-400/90 border-sky-500/30 hover:bg-sky-950/40 hover:text-sky-300'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Parts Store</span>
          </button>

          <button
            data-testid="nav-tab-tracker"
            onClick={() => setCurrentTab('tracker')}
            className={`transition-all flex items-center gap-1.5 px-2 2xl:px-2.5 py-1 rounded-lg border whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'tracker'
                ? 'bg-sky-950/80 text-sky-300 border-sky-500/50 font-bold shadow-xs shadow-sky-950'
                : 'text-sky-400/90 border-sky-500/30 hover:bg-sky-950/40 hover:text-sky-300'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Track Order</span>
          </button>

          {/* Switch Panels & Replica: check RBAC */}
          {canAccessRoute(currentUserRole, 'designer') && (
            <button
              data-testid="nav-tab-designer"
              onClick={() => setCurrentTab('designer')}
              className={`transition-all flex items-center gap-1.5 px-2 2xl:px-2.5 py-1 rounded-lg border whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'designer'
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 font-bold shadow-xs shadow-cyan-950'
                  : 'text-cyan-400/90 border-cyan-500/30 hover:bg-cyan-950/40 hover:text-cyan-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Switch Panels</span>
            </button>
          )}

          {canAccessRoute(currentUserRole, 'replica') && (
            <button
              data-testid="nav-tab-replica"
              onClick={() => setCurrentTab('replica')}
              className={`transition-all flex items-center gap-1.5 px-2 2xl:px-2.5 py-1 rounded-lg border whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'replica'
                  ? 'bg-teal-950/80 text-teal-300 border-teal-500/50 font-bold shadow-xs shadow-teal-950'
                  : 'text-teal-400/90 border-teal-500/30 hover:bg-teal-950/40 hover:text-teal-300'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Replica Panels</span>
            </button>
          )}

          {/* Client Vessel Portal: check RBAC */}
          {canAccessRoute(currentUserRole, 'portal') && (
            <button
              data-testid="nav-tab-portal"
              onClick={() => setCurrentTab('portal')}
              className={`transition-all flex items-center gap-1.5 px-2 2xl:px-2.5 py-1 rounded-lg border whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'portal'
                  ? 'bg-sky-950/80 text-sky-300 border-sky-500/50 font-bold shadow-xs shadow-sky-950'
                  : 'text-sky-400/90 border-sky-500/30 hover:bg-sky-950/40 hover:text-sky-300'
              }`}
            >
              <Ship className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Vessel Portal</span>
            </button>
          )}

          {/* Technician Exclusive Workstation Tab */}
          {canAccessRoute(currentUserRole, 'technician') && (
            <button
              data-testid="nav-tab-technician"
              onClick={() => setCurrentTab('technician')}
              className={`transition-all flex items-center gap-1.5 px-2 2xl:px-2.5 py-1 rounded-lg border whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'technician' 
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 font-bold shadow-xs shadow-amber-950' 
                  : 'text-amber-400/90 border-amber-500/30 hover:bg-amber-950/40 hover:text-amber-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Tech Jobs</span>
            </button>
          )}

          {/* Postal Exclusive Dispatch Tab */}
          {canAccessRoute(currentUserRole, 'postal') && (
            <button
              data-testid="nav-tab-postal"
              onClick={() => setCurrentTab('postal')}
              className={`transition-all flex items-center gap-1.5 px-2 2xl:px-2.5 py-1 rounded-lg border whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'postal' 
                  ? 'bg-purple-950/80 text-purple-300 border-purple-500/50 font-bold shadow-xs shadow-purple-950' 
                  : 'text-purple-400/90 border-purple-500/30 hover:bg-purple-950/40 hover:text-purple-300'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Postal Dispatch</span>
            </button>
          )}

          {/* Admin Workshop Tab */}
          {canAccessRoute(currentUserRole, 'admin') && (
            <button
              data-testid="nav-tab-admin"
              onClick={() => setCurrentTab('admin')}
              className={`transition-all flex items-center gap-1.5 px-2 2xl:px-2.5 py-1 rounded-lg border whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'admin' 
                  ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 font-bold shadow-xs shadow-rose-950' 
                  : 'text-rose-400/90 border-rose-500/30 hover:bg-rose-950/40 hover:text-rose-300'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Master Workshop</span>
            </button>
          )}
        </nav>

        {/* Zone 3: User Authentication & Role Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 min-w-0">
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
              className="relative p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer shrink-0"
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
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 text-sky-300 hover:text-white border border-sky-500/40 text-[11px] sm:text-xs font-bold transition-all shadow-sm shadow-sky-950 cursor-pointer active:scale-95 whitespace-nowrap"
                  title="Sign in or register your vessel account"
                >
                  <Key className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Sign In</span>
                </button>
              </div>
            ) : (
              /* Signed-in Account Pill with Dropdown */
              <div className="relative" ref={dropdownRef} data-testid="user-account-badge">
                <button
                  data-testid="user-account-button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1 sm:gap-2 p-1 pl-1 sm:pl-1.5 pr-1.5 sm:pr-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group max-w-[105px] sm:max-w-[200px]"
                  title="Account settings & profile menu"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-slate-200 font-bold text-xs shrink-0">
                    {currentUserProfile?.avatarUrl ? (
                      <img src={currentUserProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-sky-400" />
                    )}
                  </div>
                  <div className="flex flex-col text-left leading-none min-w-0 max-w-[44px] sm:max-w-[120px]">
                    <span data-testid="user-profile-name" className="text-[10px] sm:text-[11px] font-bold text-white truncate block">
                      {currentUserProfile?.name || 'Account'}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono capitalize truncate block">
                      {ROLE_CONFIGS[currentUserRole].badge}
                    </span>
                  </div>
                  <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 transition-transform shrink-0 ${userDropdownOpen ? 'rotate-180' : ''}`} />
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
                      data-testid="nav-signoff-button"
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
            className="px-2 sm:px-3.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:scale-95 transition-all rounded-xl shadow-md shadow-sky-600/30 whitespace-nowrap cursor-pointer shrink-0"
          >
            Book (£25/hr)
          </button>

          {/* Mobile menu toggle */}
          <button
            data-testid="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-1.5 sm:p-2 text-slate-400 hover:text-white cursor-pointer shrink-0"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Drawer Menu (< 1280px) */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-slate-950 border-b border-slate-800 p-3 sm:p-4 space-y-3 animate-in slide-in-from-top-2 max-h-[calc(100dvh-4.5rem)] overflow-y-auto">
          {/* Mobile User Profile / Auth State Card */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            {currentUserRole === 'guest' ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-950/70 border border-sky-500/30 flex items-center justify-center text-sky-400">
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
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-sm shadow-sky-600/30 cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-slate-200 font-bold shrink-0">
                      {currentUserProfile?.avatarUrl ? (
                        <img src={currentUserProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-sky-400" />
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

                <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80 text-xs">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAccountModal?.();
                    }}
                    className="py-1 px-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg font-semibold flex items-center justify-center gap-1 border border-slate-750 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-sky-400" />
                    <span>Account</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenSignOffModal?.();
                    }}
                    className="py-1 px-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 rounded-lg font-semibold flex items-center justify-center gap-1 border border-rose-500/30 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sign Off</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Release Version & Target Environment Tracker */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs">
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

          {/* Compact Multi-Item Mobile Navigation Pills (Matches Main Menu Button Size) */}
          <div
            data-testid="mobile-nav-grid"
            className="flex flex-wrap items-center gap-1.5 text-xs font-semibold pt-2 border-t border-slate-900"
          >
            {/* Parts Store */}
            <button
              data-testid="mobile-nav-tab-store"
              onClick={() => { setCurrentTab('store'); setMobileMenuOpen(false); }}
              className={`transition-all flex items-center gap-1.5 px-2.5 py-1 rounded-lg border whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'store'
                  ? 'bg-sky-950/80 text-sky-300 border-sky-500/50 font-bold shadow-xs shadow-sky-950'
                  : 'text-sky-400/90 border-sky-500/30 hover:bg-sky-950/40 hover:text-sky-300 bg-slate-900/60'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Parts Store {cartCount > 0 ? `(${cartCount})` : ''}</span>
            </button>

            {/* Track Order */}
            <button
              data-testid="mobile-nav-tab-tracker"
              onClick={() => { setCurrentTab('tracker'); setMobileMenuOpen(false); }}
              className={`transition-all flex items-center gap-1.5 px-2.5 py-1 rounded-lg border whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'tracker'
                  ? 'bg-sky-950/80 text-sky-300 border-sky-500/50 font-bold shadow-xs shadow-sky-950'
                  : 'text-sky-400/90 border-sky-500/30 hover:bg-sky-950/40 hover:text-sky-300 bg-slate-900/60'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Track Order</span>
            </button>

            {/* Switch Panels */}
            {canAccessRoute(currentUserRole, 'designer') && (
              <button
                data-testid="mobile-nav-tab-designer"
                onClick={() => { setCurrentTab('designer'); setMobileMenuOpen(false); }}
                className={`transition-all flex items-center gap-1.5 px-2.5 py-1 rounded-lg border whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'designer'
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 font-bold shadow-xs shadow-cyan-950'
                    : 'text-cyan-400/90 border-cyan-500/30 hover:bg-cyan-950/40 hover:text-cyan-300 bg-slate-900/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Switch Panels</span>
              </button>
            )}

            {/* Replica Panels */}
            {canAccessRoute(currentUserRole, 'replica') && (
              <button
                data-testid="mobile-nav-tab-replica"
                onClick={() => { setCurrentTab('replica'); setMobileMenuOpen(false); }}
                className={`transition-all flex items-center gap-1.5 px-2.5 py-1 rounded-lg border whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'replica'
                    ? 'bg-teal-950/80 text-teal-300 border-teal-500/50 font-bold shadow-xs shadow-teal-950'
                    : 'text-teal-400/90 border-teal-500/30 hover:bg-teal-950/40 hover:text-teal-300 bg-slate-900/60'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Replica Panels</span>
              </button>
            )}

            {/* Client Vessel Portal */}
            {canAccessRoute(currentUserRole, 'portal') && (
              <button
                data-testid="mobile-nav-tab-portal"
                onClick={() => { setCurrentTab('portal'); setMobileMenuOpen(false); }}
                className={`transition-all flex items-center gap-1.5 px-2.5 py-1 rounded-lg border whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'portal'
                    ? 'bg-sky-950/80 text-sky-300 border-sky-500/50 font-bold shadow-xs shadow-sky-950'
                    : 'text-sky-400/90 border-sky-500/30 hover:bg-sky-950/40 hover:text-sky-300 bg-slate-900/60'
                }`}
              >
                <Ship className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Vessel Portal</span>
              </button>
            )}

            {/* Technician Workstation */}
            {canAccessRoute(currentUserRole, 'technician') && (
              <button
                data-testid="mobile-nav-tab-technician"
                onClick={() => { setCurrentTab('technician'); setMobileMenuOpen(false); }}
                className={`transition-all flex items-center gap-1.5 px-2.5 py-1 rounded-lg border whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'technician'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 font-bold shadow-xs shadow-amber-950'
                    : 'text-amber-400/90 border-amber-500/30 hover:bg-amber-950/40 hover:text-amber-300 bg-slate-900/60'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Tech Jobs</span>
              </button>
            )}

            {/* Postal Dispatch */}
            {canAccessRoute(currentUserRole, 'postal') && (
              <button
                data-testid="mobile-nav-tab-postal"
                onClick={() => { setCurrentTab('postal'); setMobileMenuOpen(false); }}
                className={`transition-all flex items-center gap-1.5 px-2.5 py-1 rounded-lg border whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'postal'
                    ? 'bg-purple-950/80 text-purple-300 border-purple-500/50 font-bold shadow-xs shadow-purple-950'
                    : 'text-purple-400/90 border-purple-500/30 hover:bg-purple-950/40 hover:text-purple-300 bg-slate-900/60'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Postal Dispatch</span>
              </button>
            )}

            {/* Master Workshop Admin */}
            {canAccessRoute(currentUserRole, 'admin') && (
              <button
                data-testid="mobile-nav-tab-admin"
                onClick={() => { setCurrentTab('admin'); setMobileMenuOpen(false); }}
                className={`transition-all flex items-center gap-1.5 px-2.5 py-1 rounded-lg border whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'admin'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 font-bold shadow-xs shadow-rose-950'
                    : 'text-rose-400/90 border-rose-500/30 hover:bg-rose-950/40 hover:text-rose-300 bg-slate-900/60'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Master Workshop</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

