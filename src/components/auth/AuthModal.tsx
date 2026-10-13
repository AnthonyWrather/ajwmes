import React, { useState } from 'react';
import { UserRole, UserProfile } from '../../types';
import { 
  ROLE_CONFIGS, 
  DEMO_PROFILES, 
  signInWithEmailOrAccount, 
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
  Database,
  ShieldCheck
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  currentUserProfile: UserProfile;
  onUpdateUserProfile: (profile: UserProfile) => void;
  onOpenPermissionsMatrix?: () => void;
  onOpenRegister?: (email?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  onSelectRole,
  currentUserProfile,
  onUpdateUserProfile,
  onOpenPermissionsMatrix,
  onOpenRegister
}) => {
  const [activeTab, setActiveTab] = useState<'roles' | 'email' | 'blueprint'>('roles');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);
  const [notFoundEmail, setNotFoundEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  if (!isOpen) return null;

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setAuthFeedback('Please enter an email address.');
      return;
    }
    setIsSigningIn(true);
    setAuthFeedback(null);
    setNotFoundEmail(null);
    try {
      const result = await signInWithEmailOrAccount(emailInput, passwordInput);
      if (result.success && result.profile) {
        onUpdateUserProfile(result.profile);
        onSelectRole(result.profile.role);
        setAuthFeedback(`Signed in as ${result.profile.email} (${result.profile.role.toUpperCase()})`);
      } else if (result.error) {
        setAuthFeedback(result.error);
        if (result.notFound) {
          setNotFoundEmail(emailInput.trim().toLowerCase());
        }
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
            onClick={() => setActiveTab('email')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'email' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Email Sign-In</span>
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
          {onOpenPermissionsMatrix && (
            <button
              onClick={() => {
                onClose();
                onOpenPermissionsMatrix();
              }}
              className="ml-auto px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-500/30 font-bold"
              title="Open full 5-role Route and Action Matrix"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full RBAC Matrix</span>
            </button>
          )}
        </div>

        {/* Feedback Alert */}
        {authFeedback && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-sky-950/70 border border-sky-500/40 text-xs text-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{authFeedback}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {notFoundEmail && onOpenRegister && (
                <button
                  type="button"
                  onClick={() => {
                    const email = notFoundEmail;
                    setAuthFeedback(null);
                    setNotFoundEmail(null);
                    onOpenRegister(email);
                  }}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Register Account Now →
                </button>
              )}
              <button 
                onClick={() => { setAuthFeedback(null); setNotFoundEmail(null); }}
                className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
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
                          {demoProfile && (
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono mt-1">
                              <span className="text-slate-400">{demoProfile.email}</span>
                              <span className="text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30 text-[10px]">
                                Password: ajwmes2026
                              </span>
                            </div>
                          )}
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

        {/* Tab 2: Email & Password Sign-In */}
        {activeTab === 'email' && (
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
                  Currently running in <strong>Instant Sandbox Mode</strong> with simulated profile ({currentUserProfile.name}). Sign in with a registered email and password below.
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
                  <span>Authenticated User ID: <code className="font-mono text-white">{currentUserProfile.id}</code></span>
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

            {/* Email Login Form */}
            <form onSubmit={handleEmailSignIn} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3.5">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-sky-400" />
                <h4 className="text-sm font-bold text-white">Email &amp; Password Sign In</h4>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">Email Address</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="anthonywrather@gmail.com"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300 font-semibold">Password</label>
                  <span className="text-[10px] text-amber-300 font-mono">
                    Test Password: <strong>ajwmes2026</strong>
                  </span>
                </div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* 1-click test fill chips */}
              <div className="pt-1 space-y-1.5">
                <span className="text-[10px] text-slate-400 font-mono block">1-Click Test Credentials (Password: ajwmes2026):</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Admin', email: 'anthonywrather@gmail.com' },
                    { label: 'Tech', email: 'jack.tech@ajwmes.co.uk' },
                    { label: 'Postal', email: 'sarah.postal@ajwmes.co.uk' },
                    { label: 'Client', email: 'd.mercer@solent-sail.co.uk' },
                    { label: 'Guest', email: 'guest@solent-visitor.co.uk' }
                  ].map(acc => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => {
                        setEmailInput(acc.email);
                        setPasswordInput('ajwmes2026');
                      }}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/50 rounded-lg text-[10px] text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{isSigningIn ? 'Verifying...' : 'Sign In with Email'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailInput('anthonywrather@gmail.com');
                    setPasswordInput('ajwmes2026');
                  }}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Fill Admin
                </button>
              </div>
            </form>
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
                <li>Firebase Auth SDK (<code className="text-slate-200">getAuth</code>) is already initialized and connected to Firebase project <code className="text-slate-200">gen-lang-client-0618772940</code>.</li>
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
