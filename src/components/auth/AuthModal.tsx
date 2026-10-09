import React, { useState } from 'react';
import { UserRole, UserProfile } from '../../types';
import { 
  ROLE_CONFIGS, 
  DEMO_PROFILES, 
  signInWithGoogle, 
  signOutUser 
} from '../../lib/auth';
import { 
  X, 
  Shield, 
  CheckCircle2, 
  User, 
  Zap, 
  Package, 
  Wrench, 
  Globe, 
  Lock, 
  Key, 
  LogOut, 
  ExternalLink, 
  Sparkles, 
  AlertCircle,
  FileCode2,
  Database
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  currentUserProfile: UserProfile;
  onUpdateUserProfile: (profile: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  onSelectRole,
  currentUserProfile,
  onUpdateUserProfile
}) => {
  const [activeTab, setActiveTab] = useState<'roles' | 'google' | 'blueprint'>('roles');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthFeedback(null);
    try {
      const result = await signInWithGoogle();
      if (result.success && result.profile) {
        onUpdateUserProfile(result.profile);
        onSelectRole(result.profile.role);
        setAuthFeedback(`Signed in as ${result.profile.email} (${result.profile.role.toUpperCase()})`);
      } else if (result.error) {
        setAuthFeedback(result.error);
      }
    } catch (e: any) {
      setAuthFeedback(e?.message || 'Authentication error.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    const guestProfile = DEMO_PROFILES.find(p => p.role === 'guest') || DEMO_PROFILES[4];
    onUpdateUserProfile(guestProfile);
    onSelectRole('guest');
    setAuthFeedback('Signed out. Reset to Guest role.');
  };

  const handleSwitchToDemoProfile = (profile: UserProfile) => {
    onUpdateUserProfile(profile);
    onSelectRole(profile.role);
    setAuthFeedback(`Switched to demo identity: ${profile.name} (${profile.role.toUpperCase()})`);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'guest': return <Globe className="w-4 h-4 text-slate-400" />;
      case 'client': return <User className="w-4 h-4 text-sky-400" />;
      case 'technician': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'postal': return <Package className="w-4 h-4 text-purple-400" />;
      case 'admin': return <Wrench className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  User Roles &amp; Firebase Authentication
                </h3>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${ROLE_CONFIGS[currentUserRole].badgeClass}`}>
                  {ROLE_CONFIGS[currentUserRole].badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Role-Based Access Control (RBAC) · Guest, Client, Technician, Postal, and Admin.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'roles' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Switch Active Role ({currentUserRole.toUpperCase()})
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'google' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Firebase Google Sign-In</span>
          </button>
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'blueprint' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Auth Architecture &amp; Prepared Schema</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {authFeedback && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-sky-950/70 border border-sky-500/40 text-xs text-sky-200 flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{authFeedback}</span>
            </div>
            <button 
              onClick={() => setAuthFeedback(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab 1: Role Switcher & Permissions Matrix */}
        {activeTab === 'roles' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              Select any role below to experience the application from that perspective. The navigation links, permissions, and available modules dynamically adapt to the selected role.
            </div>

            <div className="space-y-3">
              {(Object.keys(ROLE_CONFIGS) as UserRole[]).map(roleKey => {
                const config = ROLE_CONFIGS[roleKey];
                const isSelected = currentUserRole === roleKey;
                const demoProfile = DEMO_PROFILES.find(p => p.role === roleKey);

                return (
                  <div
                    key={roleKey}
                    onClick={() => {
                      if (demoProfile) {
                        handleSwitchToDemoProfile(demoProfile);
                      } else {
                        onSelectRole(roleKey);
                      }
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-950 border-sky-500 shadow-lg shadow-sky-950/40 ring-1 ring-sky-500/40'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-950/70'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          {getRoleIcon(roleKey)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{config.label}</h4>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${config.badgeClass}`}>
                              {config.badge}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                                Active Now
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{config.tagline}</p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (demoProfile) handleSwitchToDemoProfile(demoProfile);
                          else onSelectRole(roleKey);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto ${
                          isSelected
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {isSelected ? 'Active Role' : 'Activate Role'}
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 mt-3 pt-2.5 border-t border-slate-900 leading-relaxed">
                      {config.description}
                    </p>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                        <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] block">
                          ✓ Authorized Capabilities:
                        </span>
                        {config.allowedFeatures.map((feat, i) => (
                          <div key={i} className="text-slate-300 flex items-start gap-1.5">
                            <span className="text-emerald-400">·</span>
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>

                      <div className="p-2.5 rounded-xl bg-rose-950/15 border border-rose-500/20 space-y-1">
                        <span className="text-rose-400 font-bold uppercase tracking-wider text-[10px] block">
                          ✗ Strict Role Boundaries:
                        </span>
                        {config.restrictedFeatures.length > 0 ? (
                          config.restrictedFeatures.map((feat, i) => (
                            <div key={i} className="text-slate-400 flex items-start gap-1.5">
                              <span className="text-rose-400">·</span>
                              <span>{feat}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-400">None (Master administrator privileges)</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Firebase Google Sign-In */}
        {activeTab === 'google' && (
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-sky-400 font-bold">
                    Current Authentication Identity
                  </span>
                  <h4 className="text-base font-bold text-white mt-0.5">
                    {currentUserProfile.name}
                  </h4>
                  <p className="text-slate-400 font-mono mt-0.5">
                    {currentUserProfile.email}
                  </p>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-mono uppercase px-2.5 py-1 rounded-full border ${ROLE_CONFIGS[currentUserRole].badgeClass}`}>
                    {ROLE_CONFIGS[currentUserRole].label}
                  </span>
                </div>
              </div>

              {currentUserProfile.id.startsWith('demo-') ? (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300">
                  Currently running in <strong>Instant Sandbox Mode</strong> with simulated profile ({currentUserProfile.name}). You can also sign in with a real Google account below.
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
                  <span>Authenticated via Firebase User ID: <code className="font-mono text-white">{currentUserProfile.id}</code></span>
                  <button
                    onClick={handleSignOut}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Google Login Action */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Connect Live Google Account
                </h4>
                <p className="text-slate-400 max-w-md mx-auto mt-1">
                  Authenticate using Firebase Authentication. If signing in with <code className="text-sky-300">anthonywrather@gmail.com</code>, master Admin privileges are automatically assigned.
                </p>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 mx-auto shadow-lg shadow-sky-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Key className="w-4 h-4" />
                <span>{isSigningIn ? 'Connecting to Google...' : 'Sign In with Google'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Firebase Auth Readiness Blueprint */}
        {activeTab === 'blueprint' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-sky-400 font-bold">
                <Database className="w-4 h-4" />
                <span>Firebase Authentication Prepared Architecture</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                The codebase has been analyzed and prepared for full Firebase Authentication integration. The schema, collection mapping, and security rules accommodate all 5 roles:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-[11px] font-mono text-sky-400 uppercase font-bold block">
                  1. Firestore User Entity Schema
                </span>
                <p className="text-slate-400 text-[11px]">
                  Document path: <code className="text-slate-200">/users/{'{uid}'}</code>
                </p>
                <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[10px] text-slate-300 space-y-1">
                  <div>uid: string (128 chars)</div>
                  <div>email: string (128 chars)</div>
                  <div>displayName: string (128 chars)</div>
                  <div>photoURL: string (512 chars)</div>
                  <div>role: 'guest' | 'client' | 'admin' | 'technician' | 'postal'</div>
                  <div>createdAt: ISO Timestamp</div>
                  <div>lastLoginAt: ISO Timestamp</div>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-[11px] font-mono text-purple-400 uppercase font-bold block">
                  2. Role-Based Access Control (ABAC)
                </span>
                <p className="text-slate-400 text-[11px]">
                  Permissions mapping across database collections:
                </p>
                <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[10px] text-slate-300 space-y-1">
                  <div>/jobs: Read: All; Write: Tech, Admin, Client (Quotes)</div>
                  <div>/postal_orders: Read: Client, Postal, Admin; Write: Postal, Admin</div>
                  <div>/catalog: Read: Public; Write: Admin only</div>
                  <div>/vessel_specs: Read/Write: Client (Owner) or Admin</div>
                  <div>/users: Read: Owner or Admin; Write: Owner/Admin</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <span className="text-[11px] font-mono text-emerald-400 uppercase font-bold block">
                3. Ready Integration Next Steps
              </span>
              <ul className="list-disc list-inside text-slate-300 space-y-1 text-[11px]">
                <li>Firebase Auth SDK (<code className="text-slate-200">getAuth</code>) is already initialized and connected to Firebase project <code className="text-slate-200">prime-sign-454323-a1</code>.</li>
                <li>When enabled in the Firebase Console, Google Authentication works out of the box with <code className="text-slate-200">signInWithGoogle()</code>.</li>
                <li>All 5 roles (<code className="text-slate-200">guest</code>, <code className="text-slate-200">client</code>, <code className="text-slate-200">technician</code>, <code className="text-slate-200">postal</code>, <code className="text-slate-200">admin</code>) are completely active in UI routing and permissions.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Current Role:</span>
            <span className="font-bold text-white capitalize">{currentUserRole}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
