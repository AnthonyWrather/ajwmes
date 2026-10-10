import React, { useState } from 'react';
import { UserRole, UserProfile } from '../../types';
import { 
  ROLE_CONFIGS, 
  DEMO_PROFILES, 
  signInWithGoogle, 
  signInWithEmailOrAccount, 
  registerVesselAccount,
  saveAndSyncUserProfile 
} from '../../lib/auth';
import { 
  X, 
  Key, 
  User, 
  Mail, 
  Lock, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  Compass, 
  Ship, 
  Zap, 
  Package, 
  Wrench, 
  ArrowRight, 
  Anchor, 
  Sparkles,
  Phone,
  MapPin
} from 'lucide-react';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  onSuccessSignIn: (profile: UserProfile) => void;
  onOpenRegisterTab?: boolean;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  onSuccessSignIn,
  onOpenRegisterTab = false
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'quick_personas'>(
    onOpenRegisterTab ? 'register' : 'signin'
  );

  // Sign In form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regVesselName, setRegVesselName] = useState('');
  const [regVesselType, setRegVesselType] = useState('Sailing Yacht');
  const [regMarina, setRegMarina] = useState('Haslar Marina');

  // Loading & error feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const result = await signInWithGoogle();
      if (result.success && result.profile) {
        setSuccessMessage(`Welcome back, ${result.profile.name}! Signed in as ${result.profile.role.toUpperCase()}.`);
        setTimeout(() => {
          onSuccessSignIn(result.profile!);
          onClose();
        }, 600);
      } else if (result.error) {
        setErrorMessage(result.error);
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Google authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await signInWithEmailOrAccount(email, password);
      if (res.success && res.profile) {
        setSuccessMessage(`Welcome aboard, ${res.profile.name}!`);
        setTimeout(() => {
          onSuccessSignIn(res.profile!);
          onClose();
        }, 500);
      } else {
        setErrorMessage(res.error || 'Could not verify account.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      setErrorMessage('Full name and email are required to register.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const profile = await registerVesselAccount({
        name: regName,
        email: regEmail,
        phone: regPhone,
        vesselName: regVesselName,
        vesselType: regVesselType,
        marinaBerth: regMarina
      });

      setSuccessMessage(`Vessel owner account created for ${profile.name}! Redirecting...`);
      setTimeout(() => {
        onSuccessSignIn(profile);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectQuickPersona = async (profile: UserProfile) => {
    try {
      await saveAndSyncUserProfile(profile);
    } catch (e) {
      console.warn('Sync notice:', e);
    }
    setSuccessMessage(`Switched to ${profile.name} (${profile.role.toUpperCase()}) · Stored in database`);
    setTimeout(() => {
      onSuccessSignIn(profile);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Anchor className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>AJW Marine Portal Sign In</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-500/30">
                  Solent Verified
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sign in to manage vessel electrical specs, view live diagnostic jobs &amp; track orders.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 py-2 bg-slate-950/70 border-b border-slate-800 flex items-center gap-1.5 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('signin'); setErrorMessage(null); }}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'signin'
                ? 'bg-sky-600 text-white font-bold shadow-sm shadow-sky-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => { setActiveTab('register'); setErrorMessage(null); }}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-sky-600 text-white font-bold shadow-sm shadow-sky-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Ship className="w-3.5 h-3.5" />
            <span>Register Vessel</span>
          </button>

          <button
            onClick={() => { setActiveTab('quick_personas'); setErrorMessage(null); }}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ml-auto ${
              activeTab === 'quick_personas'
                ? 'bg-amber-600 text-white font-bold shadow-sm shadow-amber-600/30'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-500/20'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>1-Click Team Roles</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        <div className="px-6 pt-4 empty:hidden">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Authentication Notice</span>
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white text-xs">✕</button>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Tab 1: Sign In */}
        {activeTab === 'signin' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Primary: Google Sign In Button */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg active:scale-[0.99] disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isLoading ? 'Connecting to Google...' : 'Continue with Google Account'}</span>
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-[11px] font-mono uppercase text-slate-500">or sign in with email</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] text-slate-500 font-mono">e.g. anthonywrather@gmail.com</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="boatowner@solent-sail.co.uk"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Password / Access Passphrase</label>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('anthonywrather@gmail.com');
                      setPassword('ajwmarine2026');
                    }}
                    className="text-[11px] text-sky-400 hover:underline cursor-pointer"
                  >
                    Fill Admin Sample
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-sky-500/30"
                  />
                  <span>Keep me signed in on this vessel</span>
                </label>

                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-sky-400 hover:underline"
                >
                  Create boat account →
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                <Key className="w-4 h-4" />
                <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to AJW Portal'}</span>
              </button>
            </form>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                Testing without an account? Use the <strong>1-Click Team Roles</strong> tab above to preview any role (Admin, Yacht Client, Tech, Dispatch).
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Register Vessel Owner Account */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
            <div className="bg-sky-950/40 border border-sky-500/30 p-3.5 rounded-2xl text-xs text-sky-200 flex items-start gap-2.5">
              <Ship className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Register Your Vessel with AJW Marine</span>
                <span className="text-[11px] text-sky-300">
                  Save your vessel's electrical logs, request on-vessel diagnostics at £25/hr, design custom laser-cut panels, and direct message Anthony aboard your yacht.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Your Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Captain David Mercer"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="d.mercer@solent-sail.co.uk"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Mobile / VHF Contact</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="07700 900114"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Vessel Name</label>
                <div className="relative">
                  <Ship className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={regVesselName}
                    onChange={(e) => setRegVesselName(e.target.value)}
                    placeholder="Westerly Discus 33"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Vessel Type / Make</label>
                <select
                  value={regVesselType}
                  onChange={(e) => setRegVesselType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                >
                  <option value="Sailing Yacht">Sailing Yacht (Monohull)</option>
                  <option value="Motor Cruiser">Motor Cruiser / Sports Cruiser</option>
                  <option value="Catamaran">Catamaran / Multihull</option>
                  <option value="Commercial Fishing">Commercial Fishing / Workboat</option>
                  <option value="RIB / Tender">RIB / Fast Tender</option>
                  <option value="Narrowboat / Barge">Narrowboat / Inland Barge</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Home Marina / Mooring</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={regMarina}
                    onChange={(e) => setRegMarina(e.target.value)}
                    placeholder="Haslar Marina, Berth E-14"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              <Ship className="w-4 h-4" />
              <span>{isLoading ? 'Creating Vessel Account...' : 'Complete Registration & Open Vessel Portal'}</span>
            </button>
          </form>
        )}

        {/* Tab 3: Quick Switch Personas */}
        {activeTab === 'quick_personas' && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            <div className="text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              One-click instant authentication: test all functionality with realistic team personas.
            </div>

            <div className="space-y-2.5">
              {DEMO_PROFILES.map((profile) => {
                const config = ROLE_CONFIGS[profile.role];
                const isCurrent = currentUserRole === profile.role;

                return (
                  <div
                    key={profile.id}
                    onClick={() => handleSelectQuickPersona(profile)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-slate-950 border-sky-500 shadow-md ring-1 ring-sky-500/30'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                        {profile.role === 'admin' && <Wrench className="w-5 h-5 text-emerald-400" />}
                        {profile.role === 'technician' && <Zap className="w-5 h-5 text-amber-400" />}
                        {profile.role === 'postal' && <Package className="w-5 h-5 text-purple-400" />}
                        {profile.role === 'client' && <Ship className="w-5 h-5 text-sky-400" />}
                        {profile.role === 'guest' && <Compass className="w-5 h-5 text-slate-400" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-white">{profile.name}</h4>
                          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${config.badgeClass}`}>
                            {config.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">{profile.email}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isCurrent ? 'Active' : 'Sign In'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            <span>Encrypted Firebase Authentication</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
