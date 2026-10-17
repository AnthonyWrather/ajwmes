import React, { useState } from 'react';
import { UserProfile, UserRole } from '../../types';
import { ROLE_CONFIGS, signOutUser } from '../../lib/auth';
import { 
  LogOut, 
  X, 
  ShieldAlert, 
  User, 
  Check, 
  HelpCircle,
  Ship,
  Lock
} from 'lucide-react';

interface SignOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: UserProfile;
  currentUserRole: UserRole;
  onConfirmSignOff: () => void;
}

export const SignOffModal: React.FC<SignOffModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  currentUserRole,
  onConfirmSignOff
}) => {
  const [isSigningOff, setIsSigningOff] = useState(false);

  if (!isOpen) return null;

  const handleSignOff = async () => {
    setIsSigningOff(true);
    try {
      await signOutUser();
      onConfirmSignOff();
      onClose();
    } catch (e) {
      console.warn('Sign out notice:', e);
      onConfirmSignOff();
      onClose();
    } finally {
      setIsSigningOff(false);
    }
  };

  const roleConfig = ROLE_CONFIGS[currentUserRole] || ROLE_CONFIGS.guest;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Sign Off &amp; Exit Session
              </h3>
              <p className="text-xs text-slate-400">
                End current authenticated session
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* User Identity Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-lg overflow-hidden shrink-0">
              {currentUserProfile.avatarUrl ? (
                <img src={currentUserProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-slate-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white truncate">
                  {currentUserProfile.name}
                </h4>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${roleConfig.badgeClass}`}>
                  {roleConfig.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                {currentUserProfile.email}
              </p>
              {currentUserProfile.vesselName && (
                <div className="flex items-center gap-1.5 text-[11px] text-sky-400 mt-1">
                  <Ship className="w-3 h-3" />
                  <span>{currentUserProfile.vesselName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-2 text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
            <p>
              When you sign off, your session will switch back to <strong>Guest Visitor</strong> mode:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
              <li>Items in your shopping basket will be preserved.</li>
              <li>Private vessel electrical logs and technician job sheets will be locked.</li>
              <li>You can sign back in at any time from the top navigation bar.</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSigningOff}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Stay Signed In
          </button>

          <button
            type="button"
            data-testid="confirm-signoff-button"
            onClick={handleSignOff}
            disabled={isSigningOff}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span>{isSigningOff ? 'Signing Off...' : 'Confirm Sign Off'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
