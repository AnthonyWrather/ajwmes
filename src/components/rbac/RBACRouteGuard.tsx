import React from 'react';
import { UserRole } from '../../types';
import { AppRoute, checkRouteAccess, getDefaultRouteForRole } from '../../lib/rbac';
import { ROLE_CONFIGS } from '../../lib/auth';
import { 
  ShieldAlert, 
  ArrowRight, 
  Key, 
  Home, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  ShieldCheck,
  Zap,
  Package,
  Wrench,
  User,
  Globe
} from 'lucide-react';

interface RBACRouteGuardProps {
  route: AppRoute;
  userRole: UserRole;
  onRedirect: (targetRoute: AppRoute) => void;
  onOpenAuthModal?: () => void;
  onOpenPermissionsMatrix?: () => void;
  children: React.ReactNode;
}

export const RBACRouteGuard: React.FC<RBACRouteGuardProps> = ({
  route,
  userRole,
  onRedirect,
  onOpenAuthModal,
  onOpenPermissionsMatrix,
  children
}) => {
  const check = checkRouteAccess(userRole, route);

  if (check.allowed) {
    return <>{children}</>;
  }

  const roleConfig = ROLE_CONFIGS[userRole] || ROLE_CONFIGS.guest;
  const userDefaultRoute = getDefaultRouteForRole(userRole);

  const getRoleIcon = (roleName: UserRole) => {
    switch (roleName) {
      case 'guest': return <Globe className="w-3.5 h-3.5" />;
      case 'client': return <User className="w-3.5 h-3.5" />;
      case 'technician': return <Zap className="w-3.5 h-3.5" />;
      case 'postal': return <Package className="w-3.5 h-3.5" />;
      case 'admin': return <Wrench className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4 sm:px-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border-2 border-rose-500/30 shadow-2xl shadow-rose-950/40 p-6 sm:p-10 text-center space-y-6">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Shield Header */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-950/60">
            <ShieldAlert className="w-10 h-10 animate-pulse" />
          </div>
          <span className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-400">
            <Lock className="w-4 h-4" />
          </span>
        </div>

        {/* Title & Route Identity */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider font-bold bg-rose-500/10 border border-rose-500/30 text-rose-300">
            <span>Access Control Enforced</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Route Access Restricted
          </h2>
          
          <p className="text-sm font-semibold text-slate-300 max-w-xl mx-auto">
            You attempted to access <span className="text-white underline decoration-rose-500 underline-offset-4 font-bold">{check.routeName}</span> ({route}).
          </p>
        </div>

        {/* Role Status Comparison Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-left">
          {/* Active Role */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
              Your Current Active Role:
            </span>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border flex items-center gap-1.5 ${roleConfig.badgeClass}`}>
                {getRoleIcon(userRole)}
                <span>{roleConfig.label}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              {roleConfig.tagline}
            </p>
          </div>

          {/* Required Roles */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
              Required Role(s) to Access:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {check.requiredRoles.map(reqRole => {
                const conf = ROLE_CONFIGS[reqRole];
                return (
                  <span 
                    key={reqRole} 
                    className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold border flex items-center gap-1 ${conf?.badgeClass || 'bg-slate-800 text-slate-200'}`}
                  >
                    {getRoleIcon(reqRole)}
                    <span>{conf?.shortLabel || reqRole}</span>
                  </span>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Strictly enforced to protect operational workflows.
            </p>
          </div>
        </div>

        {/* Diagnostic Explanation */}
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/20 text-xs text-slate-300 leading-relaxed text-left flex items-start gap-3">
          <Info className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-rose-200 block mb-0.5">Policy Rationale:</span>
            <p>{check.reason}</p>
          </div>
        </div>

        {/* Resolution Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-600/30 cursor-pointer"
            >
              <Key className="w-4 h-4" />
              <span>Switch Role / Sign In</span>
            </button>
          )}

          {userDefaultRoute !== route && (
            <button
              onClick={() => onRedirect(userDefaultRoute)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-700 cursor-pointer"
            >
              <span>Go to {roleConfig.shortLabel} View</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          )}

          <button
            onClick={() => onRedirect('home')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-800 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Solent Services</span>
          </button>
        </div>

        {onOpenPermissionsMatrix && (
          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={onOpenPermissionsMatrix}
              className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-4 cursor-pointer inline-flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Inspect Complete 5-Role Access Control Matrix</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
