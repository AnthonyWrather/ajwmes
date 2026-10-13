import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, JobRecord, PostalOrder } from '../../types';
import { 
  ROLE_CONFIGS, 
  DEMO_PROFILES, 
  saveAndSyncUserProfile 
} from '../../lib/auth';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Ship, 
  MapPin, 
  Shield, 
  ShieldCheck, 
  CheckCircle2, 
  LogOut, 
  Save, 
  Key, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink, 
  FileText, 
  Package, 
  Bell, 
  Wrench, 
  Zap, 
  Compass,
  Sparkles,
  Sliders
} from 'lucide-react';

interface AccountManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: UserProfile;
  currentUserRole: UserRole;
  onUpdateUserProfile: (profile: UserProfile) => void;
  onSelectRole: (role: UserRole) => void;
  onRequestSignOff: () => void;
  onOpenPermissionsMatrix?: () => void;
  onNavigateToPortal?: () => void;
  onNavigateToTracker?: () => void;
  jobs?: JobRecord[];
  postalOrders?: PostalOrder[];
}

// Preset marine avatar options
const PRESET_AVATARS = [
  { label: 'Marine Engineer (Sarah)', url: '/assets/images/avatar_designer_sarah_1791400201276.jpg' },
  { label: 'Helm Navigator', url: '/assets/images/marine_helm_navigation_1791400844235.jpg' },
  { label: 'Switchboard Specialist', url: '/assets/images/marine_switch_panel_laser_1791400808406.jpg' },
  { label: 'Cruiser Captain', url: '/assets/images/budget_small_cruiser_boat_1791420135992.jpg' },
];

export const AccountManagementModal: React.FC<AccountManagementModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  currentUserRole,
  onUpdateUserProfile,
  onSelectRole,
  onRequestSignOff,
  onOpenPermissionsMatrix,
  onNavigateToPortal,
  onNavigateToTracker,
  jobs = [],
  postalOrders = []
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'vessel' | 'role' | 'activity' | 'security'>('profile');

  // Form states initialized with current profile
  const [name, setName] = useState(currentUserProfile.name);
  const [email, setEmail] = useState(currentUserProfile.email);
  const [phone, setPhone] = useState(currentUserProfile.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUserProfile.avatarUrl || '');
  const [vesselName, setVesselName] = useState(currentUserProfile.vesselName || '');
  const [vesselType, setVesselType] = useState(currentUserProfile.vesselType || 'Sailing Yacht');
  const [marinaBerth, setMarinaBerth] = useState(currentUserProfile.marinaBerth || '');

  // Preferences
  const [notifyJobUpdates, setNotifyJobUpdates] = useState(currentUserProfile.notifyJobUpdates ?? true);
  const [notifyDispatchSms, setNotifyDispatchSms] = useState(currentUserProfile.notifyDispatchSms ?? true);
  const [systemVoltagePref, setSystemVoltagePref] = useState<'12V' | '24V'>(currentUserProfile.systemVoltage || '12V');

  // Synchronize form values whenever modal opens or currentUserProfile updates
  useEffect(() => {
    if (isOpen) {
      const demoFallback = DEMO_PROFILES.find(p => p.email.toLowerCase() === currentUserProfile.email?.toLowerCase());

      setName(currentUserProfile.name || demoFallback?.name || '');
      setEmail(currentUserProfile.email || demoFallback?.email || '');
      setPhone(currentUserProfile.phone || demoFallback?.phone || '');
      setAvatarUrl(currentUserProfile.avatarUrl || currentUserProfile.photoURL || demoFallback?.avatarUrl || '');
      setVesselName(currentUserProfile.vesselName || demoFallback?.vesselName || '');
      setVesselType(currentUserProfile.vesselType || demoFallback?.vesselType || 'Sailing Yacht');
      setMarinaBerth(currentUserProfile.marinaBerth || demoFallback?.marinaBerth || '');
      setNotifyJobUpdates(currentUserProfile.notifyJobUpdates ?? demoFallback?.notifyJobUpdates ?? true);
      setNotifyDispatchSms(currentUserProfile.notifyDispatchSms ?? demoFallback?.notifyDispatchSms ?? true);
      setSystemVoltagePref(currentUserProfile.systemVoltage || demoFallback?.systemVoltage || '12V');
    }
  }, [isOpen, currentUserProfile]);

  // Feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  if (!isOpen) return null;

  const handleCopyUid = () => {
    navigator.clipboard.writeText(currentUserProfile.id);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const updatedProfile: UserProfile = {
      ...currentUserProfile,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      avatarUrl: avatarUrl.trim() || undefined,
      vesselName: vesselName.trim() || undefined,
      vesselType: vesselType.trim() || undefined,
      marinaBerth: marinaBerth.trim() || undefined,
      systemVoltage: systemVoltagePref,
      notifyJobUpdates,
      notifyDispatchSms,
      updatedAt: new Date().toISOString()
    };

    try {
      await saveAndSyncUserProfile(updatedProfile);
      onUpdateUserProfile(updatedProfile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.warn('Failed to save profile changes:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const roleConfig = ROLE_CONFIGS[currentUserRole] || ROLE_CONFIGS.guest;

  // Filter jobs and orders for this user strictly by UUID / email
  const userJobs = jobs.filter(j => 
    (j.userId && currentUserProfile.id && j.userId === currentUserProfile.id) ||
    (j.clientEmail && currentUserProfile.email && j.clientEmail.toLowerCase() === currentUserProfile.email.toLowerCase())
  );

  const userOrders = postalOrders.filter(o =>
    (o.userId && currentUserProfile.id && o.userId === currentUserProfile.id) ||
    (o.customerEmail && currentUserProfile.email && o.customerEmail.toLowerCase() === currentUserProfile.email.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with profile banner */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center text-slate-300 font-bold text-xl shadow-inner">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-7 h-7 text-slate-400" />
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950" title="Active session" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white">{currentUserProfile.name}</h3>
                <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${roleConfig.badgeClass}`}>
                  {roleConfig.badge}
                </span>
                {currentUserProfile.id.startsWith('demo-') && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30">
                    Preview Sandbox
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{currentUserProfile.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onRequestSignOff();
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sign off current user"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Off</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs font-semibold scrollbar-none">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'profile'
                ? 'bg-sky-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile &amp; Details</span>
          </button>

          <button
            onClick={() => setActiveTab('vessel')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'vessel'
                ? 'bg-sky-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Ship className="w-3.5 h-3.5" />
            <span>Vessel Specifications</span>
          </button>

          <button
            onClick={() => setActiveTab('role')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'role'
                ? 'bg-sky-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Role &amp; Permissions</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'activity'
                ? 'bg-sky-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Activity &amp; Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'security'
                ? 'bg-sky-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Session &amp; Security</span>
          </button>
        </div>

        {/* Success toast notification */}
        {saveSuccess && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Account profile updated and synchronized to Firestore successfully!</span>
            </div>
            <button onClick={() => setSaveSuccess(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>
        )}

        {/* Tab 1: Profile & Contact */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveChanges} className="p-6 overflow-y-auto space-y-5 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Mobile / VHF Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07700 900551"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Custom Avatar URL</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Avatar Selector Presets */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 block">Choose Solent Profile Avatar</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = avatarUrl === preset.url;
                  return (
                    <div
                      key={preset.url}
                      onClick={() => setAvatarUrl(preset.url)}
                      className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-sky-950/70 border-sky-500 ring-1 ring-sky-500/40'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <img src={preset.url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      <span className="text-[10px] text-slate-300 truncate">{preset.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-800">
              <span className="text-xs text-slate-400">Updates save to local memory &amp; live Firestore.</span>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Vessel Specifications */}
        {activeTab === 'vessel' && (
          <form onSubmit={handleSaveChanges} className="p-6 overflow-y-auto space-y-5 flex-1">
            <div className="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-500/30 text-xs text-sky-200 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Ship className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Vessel Electrical Link</span>
                  <span className="text-[11px] text-sky-300">
                    Your vessel profile links to Anthony's Gosport diagnostic work sheets, laser switchboard templates, and historical maintenance logs.
                  </span>
                </div>
              </div>

              {onNavigateToPortal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToPortal();
                  }}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Full Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Vessel Name</label>
                <input
                  type="text"
                  value={vesselName}
                  onChange={(e) => setVesselName(e.target.value)}
                  placeholder="Westerly Discus 33"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Vessel Type / Hull</label>
                <input
                  type="text"
                  value={vesselType}
                  onChange={(e) => setVesselType(e.target.value)}
                  placeholder="Sailing Yacht / Motor Cruiser"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Home Marina &amp; Berth</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={marinaBerth}
                    onChange={(e) => setMarinaBerth(e.target.value)}
                    placeholder="Haslar Marina (Berth E-14)"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">System DC Voltage</label>
                <select
                  value={systemVoltagePref}
                  onChange={(e) => setSystemVoltagePref(e.target.value as '12V' | '24V')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                >
                  <option value="12V">12V DC System (Standard Solent leisure crafts)</option>
                  <option value="24V">24V DC System (Heavy yachts &amp; commercial)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end border-t border-slate-800">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/30 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Vessel Details'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Role & Permissions */}
        {activeTab === 'role' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
            {/* Active Role Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Active Role Assignment</span>
                  <h4 className="text-base font-bold text-white mt-0.5">{roleConfig.label}</h4>
                </div>
                <span className={`text-xs font-mono uppercase px-3 py-1 rounded-full border ${roleConfig.badgeClass}`}>
                  {roleConfig.badge}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">{roleConfig.description}</p>
            </div>

            {/* Allowed & Restricted Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] block">
                  ✓ Authorized Features:
                </span>
                <div className="space-y-1.5 text-slate-300">
                  {roleConfig.allowedFeatures.map((feat, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-emerald-400 font-bold">·</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-2">
                <span className="text-rose-400 font-bold uppercase tracking-wider text-[10px] block">
                  ✗ Strict Role Boundaries:
                </span>
                <div className="space-y-1.5 text-slate-400">
                  {roleConfig.restrictedFeatures.length > 0 ? (
                    roleConfig.restrictedFeatures.map((feat, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px]">
                        <span className="text-rose-400">·</span>
                        <span>{feat}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-300 text-[11px]">None. Master admin capabilities granted.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Switch Persona for preview */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-white text-xs">Switch Active Persona</h5>
                  <p className="text-[11px] text-slate-400">Instantly experience the application as any team member.</p>
                </div>

                {onOpenPermissionsMatrix && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPermissionsMatrix();
                    }}
                    className="px-2.5 py-1 rounded-lg text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>View RBAC Matrix</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {(['guest', 'client', 'technician', 'postal', 'admin'] as UserRole[]).map((r) => {
                  const isCurrent = currentUserRole === r;
                  const profileMatch = DEMO_PROFILES.find(p => p.role === r);
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        onSelectRole(r);
                        if (profileMatch) onUpdateUserProfile(profileMatch);
                      }}
                      className={`p-2 rounded-xl text-center capitalize border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-sky-600 text-white font-bold border-sky-500 shadow-sm'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      <div className="text-[11px] font-bold">{r === 'technician' ? 'Tech' : r}</div>
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">{ROLE_CONFIGS[r].badge}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Activity & Orders */}
        {activeTab === 'activity' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Vessel Jobs &amp; Quotes</span>
                  <div className="text-lg font-bold text-white">{userJobs.length} active records</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Postal Orders</span>
                  <div className="text-lg font-bold text-white">{userOrders.length} orders placed</div>
                </div>
              </div>
            </div>

            {/* Recent Orders List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-white text-xs">Recent Consignments &amp; Parts Orders</h5>
                {onNavigateToTracker && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToTracker();
                    }}
                    className="text-[11px] text-sky-400 hover:underline cursor-pointer"
                  >
                    Track All Orders →
                  </button>
                )}
              </div>

              {userOrders.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-center">
                  No online store orders found under {currentUserProfile.email}.
                </div>
              ) : (
                <div className="space-y-2">
                  {userOrders.slice(0, 3).map(order => (
                    <div key={order.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sky-400 font-bold">{order.orderNumber}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 capitalize">
                            {order.orderStatus.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {order.items.length} items · Total £{order.total.toFixed(2)}
                        </p>
                      </div>

                      {order.trackingNumber && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block font-mono">Tracking:</span>
                          <span className="font-mono text-slate-300 text-[11px]">{order.trackingNumber}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Diagnostic Jobs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-white text-xs">Vessel Work &amp; Diagnostic Jobs</h5>
                {onNavigateToPortal && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToPortal();
                    }}
                    className="text-[11px] text-sky-400 hover:underline cursor-pointer"
                  >
                    View Job Sheets →
                  </button>
                )}
              </div>

              {userJobs.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-center">
                  No active diagnostic jobs recorded. Book an on-vessel inspection at £25/hr.
                </div>
              ) : (
                <div className="space-y-2">
                  {userJobs.slice(0, 3).map(job => (
                    <div key={job.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-400 font-bold">{job.reference}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 capitalize">
                            {job.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {job.vesselName} ({job.serviceCategory})
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-emerald-400 font-bold">
                          {job.diagnosticHours}h logged (£{job.totalLabor})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Session & Security */}
        {activeTab === 'security' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
            {/* Account ID / UID & Database Status */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-sky-400 font-bold block">
                  Firebase Authentication &amp; Firestore Database Record
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Stored in Firestore
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-500 font-mono">Document Path: /users/{currentUserProfile.id}</div>
                  <code className="text-sky-300 font-mono text-[11px] truncate block">{currentUserProfile.id}</code>
                </div>
                <button
                  onClick={handleCopyUid}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUid ? 'Copied' : 'Copy UID'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-400 font-mono">
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[9px] text-slate-500 block uppercase">DB Collection</span>
                  <span className="text-slate-200 font-bold">users/{currentUserProfile.id}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[9px] text-slate-500 block uppercase">Account Role</span>
                  <span className="text-sky-300 font-bold capitalize">{currentUserProfile.role}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 col-span-2 sm:col-span-1">
                  <span className="text-[9px] text-slate-500 block uppercase">Last Synchronized</span>
                  <span className="text-slate-300">{currentUserProfile.updatedAt ? new Date(currentUserProfile.updatedAt).toLocaleTimeString() : 'Just now'}</span>
                </div>
              </div>
            </div>

            {/* Notification preferences */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                Notification Preferences
              </span>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
                <div className="space-y-0.5">
                  <div className="font-semibold text-white">Diagnostic Job Sheet Alerts</div>
                  <div className="text-[11px] text-slate-400">Receive email notification when hours or parts are logged aboard your boat</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyJobUpdates}
                  onChange={(e) => setNotifyJobUpdates(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-sky-500/30"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
                <div className="space-y-0.5">
                  <div className="font-semibold text-white">Postal Order Dispatch SMS</div>
                  <div className="text-[11px] text-slate-400">Send Royal Mail Tracked 24 notification when your cable kit is packed</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyDispatchSms}
                  onChange={(e) => setNotifyDispatchSms(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-sky-500/30"
                />
              </label>
            </div>

            {/* Danger Zone */}
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
              <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block">
                Session Control
              </span>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">End Active Session</div>
                  <div className="text-[11px] text-slate-400">Sign off and return to public guest browsing</div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequestSignOff();
                  }}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Off Now</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Connected as <strong className="text-white">{currentUserProfile.name}</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
