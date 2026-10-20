import React from 'react';
import { UserRole } from '../../types';
import { 
  ROUTE_ACCESS_MATRIX, 
  ACTION_ACCESS_MATRIX, 
  AppRoute, 
  RbacAction, 
  canAccessRoute, 
  canPerformAction 
} from '../../lib/rbac';
import { ROLE_CONFIGS, DEMO_PROFILES } from '../../lib/auth';
import { 
  X, 
  ShieldCheck, 
  Check, 
  Lock, 
  AlertTriangle, 
  Globe, 
  User, 
  Zap, 
  Package, 
  Wrench, 
  Key, 
  ChevronRight,
  Info
} from 'lucide-react';

interface RBACPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onNavigateToRoute?: (route: AppRoute) => void;
}

export const RBACPermissionsModal: React.FC<RBACPermissionsModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  onSelectRole,
  onNavigateToRoute
}) => {
  const [activeTab, setActiveTab] = React.useState<'routes' | 'actions' | 'overview'>('routes');

  if (!isOpen) return null;

  const roles: UserRole[] = ['guest', 'client', 'technician', 'postal', 'admin', 'site'];

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'guest': return <Globe className="w-3.5 h-3.5" />;
      case 'client': return <User className="w-3.5 h-3.5" />;
      case 'technician': return <Zap className="w-3.5 h-3.5" />;
      case 'postal': return <Package className="w-3.5 h-3.5" />;
      case 'admin': return <Wrench className="w-3.5 h-3.5" />;
      case 'site': return <Key className="w-3.5 h-3.5" />;
    }
  };

  const routesList = Object.values(ROUTE_ACCESS_MATRIX);
  const actionsList = Object.values(ACTION_ACCESS_MATRIX);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Centralized Role-Based Access Control (RBAC) Matrix
                </h3>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${ROLE_CONFIGS[currentUserRole].badgeClass}`}>
                  Current: {ROLE_CONFIGS[currentUserRole].shortLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Strict route-level and action-level permission rules across all 5 user roles.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('routes')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                activeTab === 'routes' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Route Authorization Matrix ({routesList.length})
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                activeTab === 'actions' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Action Permissions Matrix ({actionsList.length})
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                activeTab === 'overview' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Role Profiles Overview
            </button>
          </div>

          <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400">
            Click any role column to switch identity
          </span>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Route Authorization Matrix */}
          {activeTab === 'routes' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400">
                      <th className="py-3 px-4 font-bold text-white">Route / Application View</th>
                      <th className="py-3 px-3 font-semibold">Category</th>
                      {roles.map(r => {
                        const isCurrent = currentUserRole === r;
                        const conf = ROLE_CONFIGS[r];
                        return (
                          <th 
                            key={r} 
                            onClick={() => onSelectRole(r)}
                            className={`py-3 px-3 text-center cursor-pointer transition-colors ${
                              isCurrent ? 'bg-sky-950/60 text-sky-300 font-bold' : 'hover:bg-slate-800/60'
                            }`}
                            title={`Switch to ${conf.label}`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border flex items-center gap-1 ${conf.badgeClass}`}>
                                {getRoleIcon(r)}
                                <span>{conf.shortLabel}</span>
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] text-sky-400 font-mono font-black uppercase tracking-wider">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {routesList.map(item => (
                      <tr key={item.route} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{item.name}</span>
                            <span className="text-[10px] font-mono text-slate-500">({item.route})</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            {item.description}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono">
                            {item.category}
                          </span>
                        </td>
                        {roles.map(r => {
                          const allowed = canAccessRoute(r, item.route);
                          const isCurrent = currentUserRole === r;
                          return (
                            <td 
                              key={r} 
                              className={`py-3 px-3 text-center ${isCurrent ? 'bg-sky-950/20' : ''}`}
                            >
                              {allowed ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40" title={`Allowed for ${r}`}>
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-950/80 text-rose-400 border border-rose-500/40" title={`Denied for ${r}`}>
                                  <Lock className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Enforcement rule:</strong> When any user changes their role or attempts to navigate to a route outside their permission boundary, the centralized <code className="text-sky-300 font-mono">RBACRouteGuard</code> intercepts the render, halts execution, and displays an informative policy boundary screen with one-click resolution.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Action Permissions Matrix */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400">
                      <th className="py-3 px-4 font-bold text-white">Privileged Action / Capability</th>
                      <th className="py-3 px-3 font-semibold">Category</th>
                      {roles.map(r => {
                        const isCurrent = currentUserRole === r;
                        const conf = ROLE_CONFIGS[r];
                        return (
                          <th 
                            key={r} 
                            onClick={() => onSelectRole(r)}
                            className={`py-3 px-3 text-center cursor-pointer transition-colors ${
                              isCurrent ? 'bg-sky-950/60 text-sky-300 font-bold' : 'hover:bg-slate-800/60'
                            }`}
                            title={`Switch to ${conf.label}`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border flex items-center gap-1 ${conf.badgeClass}`}>
                                {getRoleIcon(r)}
                                <span>{conf.shortLabel}</span>
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] text-sky-400 font-mono font-black uppercase tracking-wider">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {actionsList.map(item => (
                      <tr key={item.action} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">
                            {item.name}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            {item.description}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono">
                            {item.category}
                          </span>
                        </td>
                        {roles.map(r => {
                          const allowed = canPerformAction(r, item.action);
                          const isCurrent = currentUserRole === r;
                          return (
                            <td 
                              key={r} 
                              className={`py-3 px-3 text-center ${isCurrent ? 'bg-sky-950/20' : ''}`}
                            >
                              {allowed ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40" title={`Allowed for ${r}`}>
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-950/80 text-rose-400 border border-rose-500/40" title={`Denied for ${r}`}>
                                  <Lock className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Runtime Middleware Protection:</strong> All state mutations across catalog updates, technician diagnostic hours, postal orders, and vessel specs are wrapped with <code className="text-sky-300 font-mono">enforceAction()</code>. Unauthorized calls are rejected and trigger an interactive Action Denied toast.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Role Profiles Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map(r => {
                const conf = ROLE_CONFIGS[r];
                const isCurrent = currentUserRole === r;
                const demoProfile = DEMO_PROFILES.find(p => p.role === r);
                return (
                  <div 
                    key={r}
                    className={`p-5 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                      isCurrent 
                        ? 'bg-slate-900 border-sky-500 shadow-lg shadow-sky-950/60 ring-1 ring-sky-500' 
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border flex items-center gap-1.5 ${conf.badgeClass}`}>
                          {getRoleIcon(r)}
                          <span>{conf.label}</span>
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-mono uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded-md font-bold">
                            Active
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-medium text-slate-300">
                        {conf.tagline}
                      </p>

                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {conf.description}
                      </p>

                      {demoProfile && (
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono space-y-0.5">
                          <div className="text-slate-400">Test Account: <span className="text-white font-medium">{demoProfile.email}</span></div>
                          <div className="text-slate-400">Password: <span className="text-amber-300 font-bold">ajwmes2026</span></div>
                        </div>
                      )}

                      <div className="pt-2 space-y-1">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block">
                          Key Allowed Capabilities:
                        </span>
                        <ul className="text-[11px] text-slate-300 space-y-1">
                          {conf.allowedFeatures.slice(0, 3).map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {conf.restrictedFeatures.length > 0 && (
                        <div className="pt-1 space-y-1">
                          <span className="text-[10px] font-mono text-rose-400 font-bold uppercase block">
                            Strict Role Boundaries:
                          </span>
                          <ul className="text-[11px] text-slate-400 space-y-1">
                            {conf.restrictedFeatures.slice(0, 2).map((feat, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => {
                          onSelectRole(r);
                        }}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isCurrent 
                            ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30' 
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {isCurrent ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Currently Active Role</span>
                          </>
                        ) : (
                          <>
                            <span>Switch to {conf.shortLabel} Identity</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>5-Role Governance System: Guest, Client, Technician, Postal, Admin</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
