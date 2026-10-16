import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, UserRole, JobRecord, PostalOrder, VesselSpec } from '../../types';
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
  Sliders,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { resizeImageToDataUrl } from '../../utils/imageResize';
import { canAccessRoute } from '../../lib/rbac';

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
  onSelectVessel?: (vesselId: string) => void;
  vessels?: VesselSpec[];
  jobs?: JobRecord[];
  postalOrders?: PostalOrder[];
}

// Preset marine avatar options with clean relative paths and labels
export const PRESET_AVATARS = [
  { label: 'Marine Engineer (Sarah)', url: '/assets/images/avatar_designer_sarah_1791400201276.jpg' },
  { label: 'Helm Navigator', url: '/assets/images/marine_helm_navigation_1791400844235.jpg' },
  { label: 'Switchboard Specialist', url: '/assets/images/marine_switch_panel_laser_1791400808406.jpg' },
  { label: 'Cruiser Captain', url: '/assets/images/budget_small_cruiser_boat_1791420135992.jpg' },
  { label: 'LiFePO4 Battery Bank', url: '/assets/images/marine_lithium_battery_bank_1791400821608.jpg' },
  { label: 'Solent Solar Array', url: '/assets/images/marine_solar_array_yacht_1791400831647.jpg' },
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
  onSelectVessel,
  vessels = [],
  jobs = [],
  postalOrders = []
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'vessel' | 'role' | 'activity' | 'security'>('profile');
  const canAccessVesselPortal = canAccessRoute(currentUserRole, 'portal');

  // Form states initialized with current profile
  const [name, setName] = useState(currentUserProfile.name);
  const [email, setEmail] = useState(currentUserProfile.email);
  const [phone, setPhone] = useState(currentUserProfile.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUserProfile.avatarUrl || '');

  // Photo upload and dragging states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [photoMeta, setPhotoMeta] = useState<string | null>(null);

  // Preferences
  const [notifyJobUpdates, setNotifyJobUpdates] = useState(currentUserProfile.notifyJobUpdates ?? true);
  const [notifyDispatchSms, setNotifyDispatchSms] = useState(currentUserProfile.notifyDispatchSms ?? true);

  // Ensure activeTab falls back to 'profile' if current role does not have access to the Vessel Portal
  useEffect(() => {
    if (!canAccessVesselPortal && activeTab === 'vessel') {
      setActiveTab('profile');
    }
  }, [canAccessVesselPortal, activeTab]);

  // Synchronize form values whenever modal opens or active user ID changes
  useEffect(() => {
    if (isOpen) {
      const demoFallback = DEMO_PROFILES.find(p => p.email.toLowerCase() === currentUserProfile.email?.toLowerCase());

      setName(currentUserProfile.name || demoFallback?.name || '');
      setEmail(currentUserProfile.email || demoFallback?.email || '');
      setPhone(currentUserProfile.phone || demoFallback?.phone || '');
      setAvatarUrl(currentUserProfile.avatarUrl || currentUserProfile.photoURL || demoFallback?.avatarUrl || '');
      setNotifyJobUpdates(currentUserProfile.notifyJobUpdates ?? demoFallback?.notifyJobUpdates ?? true);
      setNotifyDispatchSms(currentUserProfile.notifyDispatchSms ?? demoFallback?.notifyDispatchSms ?? true);
      setPhotoError(null);
      setPhotoMeta(null);
    }
  }, [isOpen, currentUserProfile.id]);

  // Feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  // Handle client-side photo processing for avatar
  const handlePhotoSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    setPhotoError(null);
    setIsProcessingPhoto(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file, 400, 0.88);
      setAvatarUrl(dataUrl);
      setPhotoMeta(`${file.name} (${Math.round(file.size / 1024)} KB)`);
    } catch (err) {
      console.error('Failed to process photo:', err);
      setPhotoError('Unable to process photo file. Please try another image.');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoSelect(file);
    }
    e.target.value = '';
  };

  const handleSelectPreset = (url: string) => {
    setAvatarUrl(url);
    setPhotoMeta(null);
    setPhotoError(null);
  };

  const handleClearAvatar = () => {
    setAvatarUrl('');
    setPhotoMeta(null);
    setPhotoError(null);
  };

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

  // Resolve all registered vessels for this user
  const userVessels = (vessels || []).filter(v => 
    (currentUserProfile.id && v.userId === currentUserProfile.id) ||
    (currentUserProfile.email && v.userId && v.userId.toLowerCase() === currentUserProfile.email.toLowerCase()) ||
    (currentUserProfile.vesselIds && currentUserProfile.vesselIds.includes(v.id))
  );

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
    <div data-testid="account-management-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with profile banner */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div data-testid="modal-avatar-preview" className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center text-slate-300 font-bold text-xl shadow-inner">
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
            data-testid="account-tab-profile"
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

          {canAccessVesselPortal && (
            <button
              data-testid="account-tab-vessel"
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
          )}

          <button
            data-testid="account-tab-role"
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
            data-testid="account-tab-activity"
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
            data-testid="account-tab-security"
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
          <form onSubmit={handleSaveChanges} className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Section A: Profile Photo & Avatar Studio */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-sky-400" />
                    <span>Profile Photo &amp; Avatar</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Upload a custom photo from your device, paste an image URL, or choose a system marine avatar.
                  </p>
                </div>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleClearAvatar}
                    className="px-2.5 py-1 text-[11px] text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-500/30 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    title="Remove custom avatar and reset to default"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Reset to Default</span>
                  </button>
                )}
              </div>

              {/* Interactive Photo Dropzone & Preview Row */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Avatar Preview Box */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative w-20 h-20 rounded-2xl bg-slate-900 border-2 border-slate-700 hover:border-sky-500 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer transition-all shadow-inner"
                  title="Click to choose a photo from your device"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name || 'Profile'} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-9 h-9 text-slate-500 group-hover:text-sky-400 transition-colors" />
                  )}

                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-white font-semibold transition-opacity">
                    <Camera className="w-4 h-4 text-sky-400 mb-0.5" />
                    <span>Change</span>
                  </div>
                </div>

                {/* Upload & Drag Zone */}
                <div 
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingPhoto(true);
                  }}
                  onDragLeave={() => setIsDraggingPhoto(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingPhoto(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handlePhotoSelect(file);
                  }}
                  className={`flex-1 w-full p-3.5 rounded-xl border border-dashed transition-all flex flex-col sm:flex-row items-center justify-between gap-3 ${
                    isDraggingPhoto 
                      ? 'border-sky-400 bg-sky-950/40 text-sky-200' 
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                    data-testid="profile-photo-file-input"
                  />

                  <div className="text-center sm:text-left">
                    <div className="text-xs font-semibold text-white flex items-center justify-center sm:justify-start gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-sky-400" />
                      <span>{photoMeta ? 'Photo Attached' : 'Pick a Photo from Device'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {photoMeta ? (
                        <span className="text-emerald-400 font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span>{photoMeta}</span>
                        </span>
                      ) : (
                        <span>Supports JPG, PNG, WebP (auto-optimized for fast Solent field sync)</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      data-testid="upload-profile-photo-button"
                      disabled={isProcessingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-sky-600/30 disabled:opacity-50"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isProcessingPhoto ? 'Optimizing...' : 'Pick Photo'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {photoError && (
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{photoError}</span>
                </div>
              )}

              {/* Custom Avatar URL or Path field */}
              <div className="space-y-1.5 pt-2 border-t border-slate-850">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="profile-avatar-url-input" className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Avatar URL or Local Data Path</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {avatarUrl.startsWith('data:') 
                      ? 'Custom Uploaded Photo' 
                      : avatarUrl.startsWith('/assets/') 
                        ? 'System Supplied Avatar' 
                        : avatarUrl.startsWith('http') 
                          ? 'External Web Image' 
                          : 'Default SVG Avatar'}
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="profile-avatar-url-input"
                    data-testid="profile-avatar-url-input"
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => {
                      setAvatarUrl(e.target.value);
                      setPhotoMeta(null);
                      setPhotoError(null);
                    }}
                    placeholder="/assets/images/... or https://example.com/avatar.jpg"
                    className="w-full pl-3 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30"
                  />
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleClearAvatar}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                      title="Clear URL"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* System Supplied Profile Avatar Presets */}
              <div className="space-y-2 pt-2 border-t border-slate-850">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Choose System Marine Avatar
                  </label>
                  <span className="text-[10px] text-sky-400 font-mono">
                    Click to fill URL &amp; update profile
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_AVATARS.map((preset, index) => {
                    const isSelected = avatarUrl === preset.url;
                    return (
                      <button
                        key={preset.url}
                        type="button"
                        data-testid={`preset-avatar-${index}`}
                        onClick={() => handleSelectPreset(preset.url)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-950/80 border-sky-400 ring-2 ring-sky-500/50 text-white shadow-sm shadow-sky-950'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-300'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img 
                            src={preset.url} 
                            alt={preset.label} 
                            className="w-10 h-10 rounded-lg object-cover border border-slate-700" 
                          />
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-semibold text-slate-200 block truncate">
                            {preset.label}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono block truncate">
                            {isSelected ? '✓ Selected' : 'System Marine'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section B: Contact & Personal Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono text-slate-400">
                Contact &amp; Account Identity
              </h4>

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

                <div className="space-y-1.5 sm:col-span-2">
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
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-800">
              <span className="text-xs text-slate-400">Updates save to local memory &amp; live Firestore.</span>
              <button
                type="submit"
                data-testid="save-profile-button"
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
        {activeTab === 'vessel' && canAccessVesselPortal && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1" data-testid="account-vessel-tab-content">
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
                  data-testid="vessel-portal-link-btn"
                  onClick={() => {
                    onClose();
                    onNavigateToPortal();
                  }}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Open Full Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* List of boats registered or no boats registered */}
            {userVessels.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono text-slate-400">
                    Registered Vessels ({userVessels.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">Technical specs configured in Vessel Portal</span>
                </div>

                <div className="space-y-3">
                  {userVessels.map(vessel => (
                    <div
                      key={vessel.id}
                      data-testid={`registered-vessel-card-${vessel.id}`}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">{vessel.vesselName}</span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-sky-950 text-sky-300 border border-sky-800/60 font-semibold">
                            {vessel.systemVoltage} DC
                          </span>
                          {vessel.hullType && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium border border-slate-700/60">
                              {vessel.hullType}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 font-medium">
                          {vessel.makeModel} {vessel.year ? `(${vessel.year})` : ''}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                          {vessel.homeMarina && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {vessel.homeMarina} {vessel.berthPontoon ? `· ${vessel.berthPontoon}` : ''}
                            </span>
                          )}
                          {vessel.lengthOverall && (
                            <span>LOA: {vessel.lengthOverall}</span>
                          )}
                          {vessel.lengthWaterline && (
                            <span>LWL: {vessel.lengthWaterline}</span>
                          )}
                          {vessel.beam && (
                            <span>Beam: {vessel.beam}</span>
                          )}
                          {vessel.draft && (
                            <span>Draft: {vessel.draft}</span>
                          )}
                        </div>
                      </div>

                      {onNavigateToPortal && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectVessel) onSelectVessel(vessel.id);
                            onClose();
                            onNavigateToPortal();
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>Open in Portal</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                data-testid="no-vessels-registered"
                className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Ship className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">No boats registered</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    You have no vessels linked to your account yet. Register your boat in the full vessel portal to configure battery banks, solar arrays, and switchboard schematics.
                  </p>
                </div>
                {onNavigateToPortal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToPortal();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/30 transition-all cursor-pointer"
                  >
                    <span>Register a Boat in Vessel Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
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
                      data-testid={`switch-persona-${r}`}
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
            {canAccessVesselPortal && (
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
            )}
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
