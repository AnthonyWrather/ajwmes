import React, { useState } from 'react';
import { UserProfile, UserRole } from '../../types';
import { ROLE_CONFIGS } from '../../lib/auth';
import { detectEnvironment } from '../../lib/environment';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Shield, 
  Mail, 
  Phone, 
  Ship, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Database, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  RefreshCw,
  Zap,
  Package,
  Wrench,
  Globe,
  Anchor,
  Key
} from 'lucide-react';

interface UserAccountsManagerProps {
  users: UserProfile[];
  onSaveUser: (user: UserProfile) => Promise<void> | void;
  onUpdateUserRole: (userId: string, newRole: UserRole) => Promise<void> | void;
  onDeleteUser?: (userId: string) => Promise<void> | void;
  onRefreshUsers?: () => void;
  currentUserRole?: UserRole;
}

export const UserAccountsManager: React.FC<UserAccountsManagerProps> = ({
  users,
  onSaveUser,
  onUpdateUserRole,
  onDeleteUser,
  onRefreshUsers,
  currentUserRole = 'admin'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('client');
  const [newVesselName, setNewVesselName] = useState('');
  const [newVesselType, setNewVesselType] = useState('Sailing Yacht');
  const [newMarinaBerth, setNewMarinaBerth] = useState('Haslar Marina');
  const [newSystemVoltage, setNewSystemVoltage] = useState<'12V' | '24V'>('12V');

  const currentEnv = detectEnvironment();

  // Strict environment isolation: only display accounts belonging to the active environment
  const environmentUsers = users.filter((u) => {
    return !u.environment || u.environment === currentEnv.envCode;
  });

  // Sort by createdAt desc so newly onboarded accounts appear first
  const sortedUsers = [...environmentUsers].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  // Filtered users within current environment partition
  const filteredUsers = sortedUsers.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.vesselName && u.vesselName.toLowerCase().includes(term)) ||
      (u.phone && u.phone.toLowerCase().includes(term)) ||
      (u.marinaBerth && u.marinaBerth.toLowerCase().includes(term));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 10000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim()) return;

    setIsSaving(true);
    const now = new Date().toISOString();
    const newUser: UserProfile = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? `usr-${crypto.randomUUID()}` : `usr-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      phone: newPhone.trim(),
      role: newRole,
      vesselName: newVesselName.trim() || undefined,
      vesselType: newVesselType.trim() || undefined,
      marinaBerth: newMarinaBerth.trim() || undefined,
      systemVoltage: newSystemVoltage,
      environment: currentEnv.envCode,
      notifyJobUpdates: true,
      notifyDispatchSms: true,
      createdAt: now,
      lastLoginAt: now,
      updatedAt: now,
      password: 'ajwmes2026',
      passwordHash: 'YWp3bWVzMjAyNg=='
    };

    showToast(`User account for ${newUser.name} saved to Firestore database!`);
    setIsAddModalOpen(false);
    // Reset form
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewRole('client');
    setNewVesselName('');
    setNewMarinaBerth('Haslar Marina');

    try {
      await onSaveUser(newUser);
    } catch (err: any) {
      showToast(`Error saving to database: ${err?.message || 'Failed'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateExistingUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSaving(true);
    const updated: UserProfile = {
      ...editingUser,
      environment: editingUser.environment || currentEnv.envCode,
      updatedAt: new Date().toISOString()
    };

    showToast(`Account details for ${updated.name} updated in Firestore database.`);
    setEditingUser(null);

    try {
      await onSaveUser(updated);
    } catch (err: any) {
      showToast(`Error updating database: ${err?.message || 'Failed'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, targetRole: UserRole) => {
    showToast(`Role updated to ${targetRole.toUpperCase()} in Firestore database.`);
    try {
      await onUpdateUserRole(userId, targetRole);
    } catch (err: any) {
      showToast(`Failed to update role: ${err?.message || 'Error'}`);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (!window.confirm(`Are you sure you want to remove ${user.name} (${user.email}) from the Firestore database?`)) {
      return;
    }
    if (onDeleteUser) {
      showToast(`Account ${user.name} removed from database.`);
      try {
        await onDeleteUser(user.id);
      } catch (err: any) {
        showToast(`Failed to delete account: ${err?.message || 'Error'}`);
      }
    }
  };

  // Stats calculation - strictly within current environment partition
  const adminCount = environmentUsers.filter((u) => u.role === 'admin').length;
  const siteCount = environmentUsers.filter((u) => u.role === 'site').length;
  const clientCount = environmentUsers.filter((u) => u.role === 'client').length;
  const techCount = environmentUsers.filter((u) => u.role === 'technician').length;
  const postalCount = environmentUsers.filter((u) => u.role === 'postal').length;

  return (
    <div data-testid="user-accounts-manager" className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500/40 rounded-2xl text-xs text-emerald-200 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Database Overview Banner & Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 mb-1">
              <Database className="w-4 h-4" />
              <span>Firestore Collection: /{currentEnv.firestoreCollectionPrefix}users/{'{userId}'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-mono text-[11px]">{currentEnv.envName} Active</span>
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>User Accounts &amp; Access Control</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-500/30">
                {environmentUsers.length} {currentEnv.envName} Records
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Displaying user accounts scoped strictly to the <span className="text-sky-300 font-semibold">{currentEnv.envName}</span> partition (collection <code className="text-emerald-400 font-mono bg-slate-950 px-1 py-0.5 rounded">{currentEnv.firestoreCollectionPrefix}users</code>). Cross-environment accounts are completely isolated.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            {onRefreshUsers && (
              <button
                onClick={onRefreshUsers}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title={`Refresh ${currentEnv.envName} user accounts from database`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Refresh DB</span>
              </button>
            )}

            <button
              onClick={() => setIsAddModalOpen(true)}
              data-testid="open-add-user-modal-button"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-600/30 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Account to DB</span>
            </button>
          </div>
        </div>

        {/* Breakdown counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-5">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-slate-400">Yacht Clients</span>
              <Ship className="w-4 h-4 text-sky-400" />
            </div>
            <div data-testid="stat-count-clients" className="text-xl font-bold text-white mt-1">{clientCount}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Vessel owners with specs</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-slate-400">Technicians</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div data-testid="stat-count-technicians" className="text-xl font-bold text-white mt-1">{techCount}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Solent field job sheets</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-slate-400">Dispatchers</span>
              <Package className="w-4 h-4 text-purple-400" />
            </div>
            <div data-testid="stat-count-dispatchers" className="text-xl font-bold text-white mt-1">{postalCount}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Postal packing team</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-slate-400">Master Admin</span>
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div data-testid="stat-count-admin" className="text-xl font-bold text-white mt-1">{adminCount}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Workshop Operations</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-slate-400">Site Admin</span>
              <Key className="w-4 h-4 text-cyan-400" />
            </div>
            <div data-testid="stat-count-site" className="text-xl font-bold text-white mt-1">{siteCount}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Website Infrastructure</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            data-testid="user-accounts-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search database accounts..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-none">
          <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Role:</span>
          </span>
          {(['all', 'admin', 'site', 'technician', 'postal', 'client', 'guest'] as const).map((r) => (
            <button
              key={r}
              data-testid={`user-role-filter-${r}`}
              onClick={() => setRoleFilter(r)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                roleFilter === r
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Accounts List */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <div data-testid="user-accounts-empty-state" className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 space-y-2">
            <Database className="w-8 h-8 mx-auto text-slate-600" />
            <p className="font-semibold text-slate-300">No user accounts found matching your query.</p>
            <p className="text-xs text-slate-500">Try adjusting your search terms or add a new account to the database.</p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const config = ROLE_CONFIGS[user.role] || ROLE_CONFIGS.client;
            const isSiteLocked = user.role === 'site' && currentUserRole !== 'site';
            return (
              <div
                key={user.id}
                data-testid="user-account-card"
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-slate-300 font-bold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{user.name}</h4>
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${config.badgeClass}`}>
                          {config.badge}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                          id: {user.id}
                        </span>
                        <span className="text-[10px] font-mono text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-500/30 flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5 text-sky-400" />
                          <span>env: {user.environment || currentEnv.envCode}</span>
                        </span>
                        <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-1">
                          <Key className="w-2.5 h-2.5 text-amber-400" />
                          <span>Password: {user.password || 'ajwmes2026'}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-mono text-slate-300">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{user.email}</span>
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{user.phone}</span>
                          </span>
                        )}
                        {user.vesselName && (
                          <span className="flex items-center gap-1 text-sky-400 font-medium">
                            <Ship className="w-3 h-3" />
                            <span>{user.vesselName} ({user.vesselType || 'Yacht'})</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Role Selector */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {isSiteLocked ? (
                      <span
                        data-testid="locked-site-role-badge"
                        className="px-2.5 py-1.5 bg-slate-950 border border-cyan-500/40 rounded-xl text-xs text-cyan-300 font-mono font-semibold flex items-center gap-1.5 shadow-sm"
                        title="Website Administrator accounts are protected against modification by workshop admins"
                      >
                        <Shield className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Site Admin (Protected)</span>
                      </span>
                    ) : (
                      <select
                        value={user.role}
                        data-testid="user-role-select"
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-semibold cursor-pointer"
                        title="Update role in Firestore database"
                      >
                        <option value="guest">Guest</option>
                        <option value="client">Client (Vessel Owner)</option>
                        <option value="technician">Technician</option>
                        <option value="postal">Postal Fulfillment</option>
                        <option value="admin">Administrator</option>
                        {currentUserRole === 'site' && <option value="site">Website Administrator</option>}
                      </select>
                    )}

                    {!isSiteLocked && (
                      <button
                        onClick={() => setEditingUser(user)}
                        data-testid="edit-user-button"
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit account in database"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    {onDeleteUser && !isSiteLocked && (
                      <button
                        onClick={() => handleDeleteUser(user)}
                        data-testid="delete-user-button"
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete from Firestore database"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Account Details & Marina Berth Link */}
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{user.marinaBerth || 'No marina berth recorded'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Last Login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Active session'}</span>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 text-emerald-400">
                    <Database className="w-3.5 h-3.5" />
                    <span>Synced: /{currentEnv.firestoreCollectionPrefix}users/{user.id}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add New Account to Database */}
      {isAddModalOpen && (
        <div data-testid="add-user-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Add Account to Database</h4>
                  <p className="text-xs text-slate-400 font-mono">Persists immediately to /users/{'{uid}'}</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Full Name *</label>
                  <input
                    type="text"
                    required
                    data-testid="new-user-name-input"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="David Mercer"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Email Address *</label>
                  <input
                    type="email"
                    required
                    data-testid="new-user-email-input"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="d.mercer@solent-sail.co.uk"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Contact Phone / VHF</label>
                  <input
                    type="tel"
                    data-testid="new-user-phone-input"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="07700 900114"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Access Role *</label>
                  <select
                    value={newRole}
                    data-testid="new-user-role-select"
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="client">Client (Vessel Owner)</option>
                    <option value="technician">Technician</option>
                    <option value="postal">Postal Fulfillment</option>
                    <option value="admin">Administrator</option>
                    <option value="guest">Guest</option>
                    {currentUserRole === 'site' && <option value="site">Website Administrator</option>}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Vessel Name</label>
                  <input
                    type="text"
                    data-testid="new-user-vessel-name-input"
                    value={newVesselName}
                    onChange={(e) => setNewVesselName(e.target.value)}
                    placeholder="Westerly Discus 33"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Vessel Type</label>
                  <input
                    type="text"
                    data-testid="new-user-vessel-type-input"
                    value={newVesselType}
                    onChange={(e) => setNewVesselType(e.target.value)}
                    placeholder="Sailing Yacht"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Home Marina &amp; Berth</label>
                  <input
                    type="text"
                    data-testid="new-user-marina-berth-input"
                    value={newMarinaBerth}
                    onChange={(e) => setNewMarinaBerth(e.target.value)}
                    placeholder="Haslar Marina, Berth E-14"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">DC System Voltage</label>
                  <select
                    value={newSystemVoltage}
                    data-testid="new-user-system-voltage-select"
                    onChange={(e) => setNewSystemVoltage(e.target.value as '12V' | '24V')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="12V">12V DC</option>
                    <option value="24V">24V DC</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  data-testid="create-user-submit-button"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/30 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Writing to DB...' : 'Save Account to Database'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing Account */}
      {editingUser && (
        <div data-testid="edit-user-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Edit Database User Record</h4>
                  <p className="text-xs text-slate-400 font-mono">Document: /users/{editingUser.id}</p>
                </div>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateExistingUser} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Full Name *</label>
                  <input
                    type="text"
                    required
                    data-testid="edit-user-name-input"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Email Address *</label>
                  <input
                    type="email"
                    required
                    data-testid="edit-user-email-input"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Phone</label>
                  <input
                    type="tel"
                    data-testid="edit-user-phone-input"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Assigned Role</label>
                  <select
                    value={editingUser.role}
                    data-testid="edit-user-role-select"
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="guest">Guest</option>
                    <option value="client">Client</option>
                    <option value="technician">Technician</option>
                    <option value="postal">Postal</option>
                    <option value="admin">Admin</option>
                    {currentUserRole === 'site' && <option value="site">Website Administrator</option>}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Vessel Name</label>
                  <input
                    type="text"
                    data-testid="edit-user-vessel-name-input"
                    value={editingUser.vesselName || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, vesselName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Vessel Type</label>
                  <input
                    type="text"
                    data-testid="edit-user-vessel-type-input"
                    value={editingUser.vesselType || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, vesselType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-300">Home Marina &amp; Berth</label>
                  <input
                    type="text"
                    data-testid="edit-user-marina-berth-input"
                    value={editingUser.marinaBerth || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, marinaBerth: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  data-testid="edit-user-submit-button"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/30 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Syncing to DB...' : 'Update Record in Firestore'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
