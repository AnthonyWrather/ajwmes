import React from 'react';
import { ActionCheckResult } from '../../lib/rbac';
import { ROLE_CONFIGS } from '../../lib/auth';
import { UserRole } from '../../types';
import { ShieldAlert, X, Key, ArrowRight, Lock } from 'lucide-react';

interface RBACActionDeniedToastProps {
  denial: ActionCheckResult | null;
  onDismiss: () => void;
  onSwitchRole?: (targetRole: UserRole) => void;
  onOpenAuthModal?: () => void;
}

export const RBACActionDeniedToast: React.FC<RBACActionDeniedToastProps> = ({
  denial,
  onDismiss,
  onSwitchRole,
  onOpenAuthModal
}) => {
  if (!denial) return null;

  const currentRoleConfig = ROLE_CONFIGS[denial.currentRole];
  const recommendedRole = denial.requiredRoles[0] || 'admin';
  const recommendedRoleConfig = ROLE_CONFIGS[recommendedRole];

  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-md w-full p-4 rounded-2xl bg-slate-900/98 border-2 border-rose-500/80 shadow-2xl shadow-rose-950/80 backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="p-2.5 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-400 shrink-0 shadow-inner">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
        </div>

        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300 font-bold px-2 py-0.5 rounded bg-rose-950/90 border border-rose-500/40">
              RBAC Action Blocked
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Role: {currentRoleConfig?.shortLabel || denial.currentRole}
            </span>
          </div>

          <h4 className="text-xs sm:text-sm font-bold text-white">
            Permission Denied: {denial.actionName}
          </h4>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            {denial.reason}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            {onSwitchRole && recommendedRole && (
              <button
                onClick={() => {
                  onSwitchRole(recommendedRole);
                  onDismiss();
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-rose-600/30 cursor-pointer"
              >
                <span>Switch to {recommendedRoleConfig?.shortLabel || recommendedRole}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onOpenAuthModal && (
              <button
                onClick={() => {
                  onOpenAuthModal();
                  onDismiss();
                }}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-sky-400" />
                <span>Auth / Roles</span>
              </button>
            )}
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          title="Dismiss Alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
