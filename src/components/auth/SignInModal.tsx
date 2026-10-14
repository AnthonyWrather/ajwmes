import React, { useState } from 'react';
import { UserRole, UserProfile } from '../../types';
import { 
  ROLE_CONFIGS, 
  DEMO_PROFILES, 
  getActiveDemoProfiles,
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
  Anchor, 
  Phone,
  MapPin,
  Eye,
  EyeOff
} from 'lucide-react';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  onSuccessSignIn: (profile: UserProfile) => void;
  onOpenRegisterTab?: boolean;
  initialTab?: 'signin' | 'register' | 'quick_personas';
  initialEmail?: string;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  onSuccessSignIn,
  onOpenRegisterTab = false,
  initialTab,
  initialEmail = ''
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'quick_personas'>(
    initialTab || (onOpenRegisterTab ? 'register' : 'signin')
  );

  // Sync activeTab and prefilled email when modal opens or initialTab/initialEmail changes
  React.useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      } else if (onOpenRegisterTab) {
        setActiveTab('register');
      } else {
        setActiveTab('signin');
      }
      if (initialEmail) {
        setEmail(initialEmail);
        setRegEmail(initialEmail);
      }
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialTab, onOpenRegisterTab, initialEmail]);

  // Sign In form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regPhone, setRegPhone] = useState('');
  const [regVesselName, setRegVesselName] = useState('');
  const [regVesselType, setRegVesselType] = useState('Sailing Yacht');
  const [regMarina, setRegMarina] = useState('Haslar Marina');

  // Loading & feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await signInWithEmailOrAccount(email, password);
      if (res.success && res.profile) {
        setSuccessMessage(`Welcome back, ${res.profile.name}! Signed in as ${res.profile.role.toUpperCase()}.`);
        setTimeout(() => {
          onSuccessSignIn(res.profile!);
          onClose();
        }, 500);
      } else if (res.notFound) {
        // Refuse login, transfer email and redirect to vessel registration
        const cleanEnteredEmail = email.trim().toLowerCase();
        setRegEmail(cleanEnteredEmail);
        if (password && password.length >= 6) {
          setRegPassword(password);
          setRegConfirmPassword(password);
        }
        setActiveTab('register');
        setErrorMessage(`No account found for "${cleanEnteredEmail}". Login refused. We have redirected you to the registration page with your email address copied over.`);
      } else {
        setErrorMessage(res.error || 'Could not verify account credentials.');
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
      setErrorMessage('Full name and email address are required to register.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const profile = await registerVesselAccount({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        vesselName: regVesselName,
        vesselType: regVesselType,
        marinaBerth: regMarina
      });

      setSuccessMessage(`Vessel owner account created for ${profile.name}! Opening portal...`);
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
    onSuccessSignIn(profile);
    setSuccessMessage(`Switched to ${profile.name} (${profile.role.toUpperCase()})`);
    saveAndSyncUserProfile(profile).catch((e) => {
      console.warn('Sync notice:', e);
    });
    setTimeout(() => {
      onClose();
    }, 150);
  };

  return (
    <div data-testid="auth-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Anchor className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>AJWMES Portal Sign In</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-500/30">
                  Solent Verified
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sign in to manage vessel electrical specs, view diagnostic jobs &amp; track orders.
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
            data-testid="tab-signin"
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
            onClick={() => { 
              if (email.trim() && !regEmail.trim()) {
                setRegEmail(email.trim().toLowerCase());
              }
              setActiveTab('register'); 
              setErrorMessage(null); 
            }}
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
            <div data-testid="auth-error-message" className="p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500/50 text-xs text-rose-200 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-white block">Authentication Notice</span>
                <span className="text-rose-200 leading-relaxed">{errorMessage}</span>
              </div>
              <button 
                onClick={() => setErrorMessage(null)} 
                className="text-rose-400 hover:text-white text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {successMessage && (
            <div data-testid="auth-success-message" className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Tab 1: Email & Password Sign In */}
        {activeTab === 'signin' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Quick Test Accounts Filler */}
            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test Accounts &amp; Roles (Password: <code className="text-amber-300 font-mono font-bold bg-amber-950/60 px-1 py-0.5 rounded border border-amber-500/30">ajwmes2026</code>)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">1-click fill</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Admin (Anthony)', email: 'anthonywrather@gmail.com' },
                  { label: 'Technician (Jack)', email: 'jack.tech@ajwmes.co.uk' },
                  { label: 'Postal (Sarah)', email: 'sarah.postal@ajwmes.co.uk' },
                  { label: 'Client (David)', email: 'd.mercer@solent-sail.co.uk' },
                  { label: 'Guest', email: 'guest@solent-visitor.co.uk' }
                ].map(acc => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword('ajwmes2026');
                    }}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/50 rounded-lg text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] text-slate-500 font-mono">e.g. anthonywrather@gmail.com</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    data-testid="auth-email-input"
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
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-slate-500">Test Password:</span>
                    <code className="text-amber-300 font-mono font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                      ajwmes2026
                    </code>
                  </div>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    data-testid="auth-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
                  <span>Keep me signed in</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    if (email.trim()) {
                      setRegEmail(email.trim().toLowerCase());
                    }
                    if (password && password.length >= 6) {
                      setRegPassword(password);
                      setRegConfirmPassword(password);
                    }
                    setActiveTab('register');
                    setErrorMessage(null);
                  }}
                  className="text-sky-400 hover:underline cursor-pointer"
                >
                  Create boat account →
                </button>
              </div>

              <button
                data-testid="auth-submit-button"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                <Key className="w-4 h-4" />
                <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to AJWMES Portal'}</span>
              </button>
            </form>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                Standard email and password authentication. Safe across all browsers, containers, and Firebase hosting domains.
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
                <span className="font-bold block">Register Your Vessel with AJWMES</span>
                <span className="text-[11px] text-sky-300">
                  Save your vessel's electrical specs, request diagnostic bookings (£25/hr), order custom panels, and direct message Anthony aboard your yacht.
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
                    placeholder="David Mercer"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Email Address *</label>
                  {regEmail && email && regEmail.toLowerCase() === email.trim().toLowerCase() && (
                    <span className="text-[10px] text-sky-400 font-mono bg-sky-950/60 border border-sky-500/30 px-1.5 py-0.5 rounded">
                      Transferred from sign-in
                    </span>
                  )}
                </div>
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
                <label className="text-xs font-semibold text-slate-300">Password * (min 6 characters)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
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
              One-click instant authentication: test all functionality with operational accounts for the active environment.
            </div>

            <div className="space-y-2.5">
              {getActiveDemoProfiles().map((profile) => {
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
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-mono mt-0.5">
                          <span className="text-slate-400">{profile.email}</span>
                          <span className="text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30 text-[10px]">
                            Password: {profile.password || 'ajwmes2026'}
                          </span>
                        </div>
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
            <span>Encrypted Email &amp; Password Authentication</span>
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
