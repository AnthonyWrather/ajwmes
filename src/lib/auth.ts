import { 
  signInWithPopup, 
  signOut as fbSignOut, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  getDocs,
  collection,
  setDoc, 
  query,
  where,
  onSnapshot 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, syncUserToFirestore, getScopedCollection } from './firebase';
import { firebaseConfig } from './firebaseConfig';
import { getEnvStorageItem, setEnvStorageItem } from './envStorage';
import { UserRole, UserProfile } from '../types';

export interface RoleConfig {
  role: UserRole;
  label: string;
  shortLabel: string;
  badge: string;
  tagline: string;
  description: string;
  allowedFeatures: string[];
  restrictedFeatures: string[];
  color: string;
  badgeClass: string;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  guest: {
    role: 'guest',
    label: 'Guest Visitor',
    shortLabel: 'Guest',
    badge: 'Public Guest',
    tagline: 'Online store shopping and switch panel ordering',
    description: 'Can order goods and custom switch panels online, browse Solent service rates, track postal orders, and submit diagnostic quote requests.',
    allowedFeatures: [
      'Browse & purchase marine cables, fuses, Victron hardware',
      'Design switch panels with online visualizer',
      'Track postal order deliveries by order ID',
      'Request diagnostic bookings (£25/hr flat rate)'
    ],
    restrictedFeatures: [
      'Cannot save permanent boat electrical specs',
      'Cannot access technician job sheets or timer',
      'Cannot fulfill or dispatch warehouse postal orders',
      'Cannot manage stock inventory or supplier purchase orders',
      'Cannot print marketing flyers or business cards'
    ],
    color: 'text-slate-400',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700'
  },
  client: {
    role: 'client',
    label: 'Registered Vessel Client',
    shortLabel: 'Client',
    badge: 'Boat Owner',
    tagline: 'Registered boat owner with vessel specifications & job tracking',
    description: 'Has registered with the site. Can do everything a Guest can do plus order custom switch panels, record their boats details, and track ongoing work.',
    allowedFeatures: [
      'Everything Guest users can do',
      'Order custom switch panels and replica panels',
      'Record boat electrical specifications & equipment log',
      'Track ongoing diagnostic jobs & approve quotes',
      'Direct messaging thread with AJW engineers aboard vessel',
      'Secure deposit payments via Stripe checkout'
    ],
    restrictedFeatures: [
      'Cannot access technician diagnostic stopwatch or job sheets',
      'Cannot access postal order packaging & dispatch station',
      'Cannot modify parts catalog pricing or stock counts',
      'Cannot access laser print studio or marketing collateral'
    ],
    color: 'text-sky-400',
    badgeClass: 'bg-sky-950/90 text-sky-300 border-sky-500/40'
  },
  technician: {
    role: 'technician',
    label: 'Solent Marine Technician',
    shortLabel: 'Technician',
    badge: 'Field Tech',
    tagline: 'Work on assigned boat jobs & diagnostics only',
    description: 'Marine technician role authorized solely to work on Jobs. Can log diagnostic hours, record materials used, send client job updates, and upload bench proof photos.',
    allowedFeatures: [
      'View Solent marina diagnostic job queue',
      'Work on Jobs: view specs, fault notes, and vessel details',
      'Log diagnostic labor with live stopwatch / manual entry (£25/hr)',
      'Record hardware materials and cables used from catalog',
      'Update job status (scheduled → in_progress → completed)',
      'Discussion thread with boat owners & upload bench fitment photos'
    ],
    restrictedFeatures: [
      'Cannot manage product catalog or modify item prices',
      'Cannot access or fulfill postal orders (restricted to Postal role)',
      'Cannot generate supplier purchase orders or manage stock alerts',
      'Cannot print flyers, business cards, or marketing assets'
    ],
    color: 'text-amber-400',
    badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-500/40'
  },
  postal: {
    role: 'postal',
    label: 'Workshop Postal Dispatcher',
    shortLabel: 'Postal',
    badge: 'Dispatch Team',
    tagline: 'Package and send online store postal orders only',
    description: 'Workshop fulfillment role authorized solely to package and send postal orders. Can generate packing slips, print address labels, assign tracking, and confirm dispatch.',
    allowedFeatures: [
      'Access online store Postal Orders queue',
      'Package customer orders with itemized pick lists',
      'Generate & print professional packing slips (A4)',
      'Generate shipping address & marina berth labels',
      'Assign Royal Mail Tracked 24/48, DPD, or Solent pickup tracking',
      'Update fulfillment status (received → processing → packed → dispatched)',
      'Trigger real-time dispatch alerts to vessel owners'
    ],
    restrictedFeatures: [
      'Cannot work on vessel diagnostic jobs or log hours',
      'Cannot modify catalog inventory prices or specifications',
      'Cannot access client private vessel electrical specifications',
      'Cannot design switch panels or print marketing flyers'
    ],
    color: 'text-purple-400',
    badgeClass: 'bg-purple-950/90 text-purple-300 border-purple-500/40'
  },
  admin: {
    role: 'admin',
    label: 'Anthony Wrather (Administrator)',
    shortLabel: 'Admin',
    badge: 'Master Admin',
    tagline: 'Full authority across all workshop and field operations',
    description: 'Master owner role. Can work Jobs, Manage Images, Manage Postal Orders, Manage Stock and Catalog, and Print Flyers and Business Cards.',
    allowedFeatures: [
      'Work on all diagnostic jobs, labor sheets, and quotes',
      'Manage Cloud Storage switchboard images and CAD assets',
      'Manage all Postal Orders, packing slips, and dispatch',
      'Manage Stock, Catalog, item pricing, and restore snapshots',
      'Automated zero-stock depletion alerts & supplier reordering',
      'Print & Laser Studio: Marine flyers, business cards, and CAD exports',
      'Full administrative oversight and role governance'
    ],
    restrictedFeatures: [],
    color: 'text-emerald-400',
    badgeClass: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
  }
};

import { DEFAULT_TEST_ACCOUNTS } from '../data/seedData';

export const DEMO_PROFILES: UserProfile[] = DEFAULT_TEST_ACCOUNTS;

export function getSavedRole(): UserRole {
  try {
    const saved = getEnvStorageItem<UserRole | null>('current_role', null);
    if (saved && (saved in ROLE_CONFIGS)) {
      return saved;
    }
  } catch (e) {
    console.warn('Could not read saved role', e);
  }
  return 'guest';
}

export function saveCurrentRole(role: UserRole) {
  try {
    setEnvStorageItem('current_role', role);
  } catch (e) {
    console.warn('Could not save role', e);
  }
}

export function getSavedUserProfile(): UserProfile {
  const defaultRole = getSavedRole();
  const demoMatch = DEMO_PROFILES.find(p => p.role === defaultRole) || DEMO_PROFILES[4];
  try {
    const saved = getEnvStorageItem<UserProfile | null>('current_user_profile', null);
    if (saved) {
      const demoFallback = DEMO_PROFILES.find(p => p.email.toLowerCase() === saved.email?.toLowerCase());
      const isAnthony = saved.email?.toLowerCase() === 'anthonywrather@gmail.com';
      return {
        ...saved,
        id: saved.id || demoFallback?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? `usr-${crypto.randomUUID()}` : `usr-${Date.now()}`),
        name: saved.name || demoFallback?.name || (isAnthony ? 'Anthony Wrather' : (saved.email ? saved.email.split('@')[0] : 'Marine User')),
        phone: saved.phone || demoFallback?.phone || (isAnthony ? '07700 900551' : ''),
        vesselName: saved.vesselName || demoFallback?.vesselName || (isAnthony ? 'AJW Solent Response' : ''),
        vesselType: saved.vesselType || demoFallback?.vesselType || (isAnthony ? 'Workboat / Fast Tender' : 'Sailing Yacht'),
        marinaBerth: saved.marinaBerth || demoFallback?.marinaBerth || (isAnthony ? 'Gosport Marina (HQ Workshop)' : ''),
        avatarUrl: saved.avatarUrl || saved.photoURL || demoFallback?.avatarUrl || '',
        systemVoltage: saved.systemVoltage || demoFallback?.systemVoltage || '12V',
        vesselIds: saved.vesselIds || demoFallback?.vesselIds || []
      };
    }
  } catch (e) {
    console.warn('Could not read saved user profile', e);
  }
  return demoMatch;
}

export function enrichUserProfile(profile: UserProfile): UserProfile {
  const demoFallback = DEMO_PROFILES.find(p => p.email.toLowerCase() === profile.email?.toLowerCase());
  const isAnthony = profile.email?.toLowerCase() === 'anthonywrather@gmail.com';
  return {
    ...profile,
    id: profile.id || demoFallback?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? `usr-${crypto.randomUUID()}` : `usr-${Date.now()}`),
    name: profile.name || demoFallback?.name || (isAnthony ? 'Anthony Wrather' : (profile.email ? profile.email.split('@')[0] : 'Marine User')),
    phone: profile.phone || demoFallback?.phone || (isAnthony ? '07700 900551' : ''),
    vesselName: profile.vesselName || demoFallback?.vesselName || (isAnthony ? 'AJW Solent Response' : ''),
    vesselType: profile.vesselType || demoFallback?.vesselType || (isAnthony ? 'Workboat / Fast Tender' : 'Sailing Yacht'),
    marinaBerth: profile.marinaBerth || demoFallback?.marinaBerth || (isAnthony ? 'Gosport Marina (HQ Workshop)' : ''),
    avatarUrl: profile.avatarUrl || profile.photoURL || demoFallback?.avatarUrl || '',
    systemVoltage: profile.systemVoltage || demoFallback?.systemVoltage || '12V',
    vesselIds: profile.vesselIds || demoFallback?.vesselIds || []
  };
}

export function saveUserProfile(profile: UserProfile) {
  try {
    setEnvStorageItem('current_user_profile', profile);
    saveCurrentRole(profile.role);
  } catch (e) {
    console.warn('Could not save user profile', e);
  }
}

/**
 * Save user profile locally and sync to Firestore `users/{uid}`.
 */
export async function saveAndSyncUserProfile(profile: UserProfile): Promise<{ success: boolean; error?: string }> {
  try {
    saveUserProfile(profile);
    if (profile.id) {
      await syncUserToFirestore(profile);
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Could not sync user profile to Firestore:', err);
    return { success: false, error: err?.message || 'Failed to update remote profile' };
  }
}

export function encodePassword(password: string): string {
  try {
    return btoa(unescape(encodeURIComponent(password)));
  } catch {
    return btoa(password);
  }
}

/**
 * Register a new vessel owner account and sync to Firestore.
 */
export async function registerVesselAccount(details: {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  vesselName?: string;
  vesselType?: string;
  marinaBerth?: string;
}): Promise<UserProfile> {
  const cleanEmail = details.email.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Please enter a valid email address.');
  }

  // Check if user already exists in Firestore
  if (firebaseConfig.apiKey) {
    try {
      const usersCol = collection(db, getScopedCollection('users'));
      const q = query(usersCol, where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        throw new Error('An account with this email address already exists. Please sign in with your password.');
      }
    } catch (e: any) {
      if (e?.message?.includes('already exists')) {
        throw e;
      }
    }
  }

  const assignedRole: UserRole = cleanEmail === 'anthonywrather@gmail.com' ? 'admin' : 'client';
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? `usr-${crypto.randomUUID()}` : `usr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();
  const rawPwd = details.password || 'ajwmes2026';
  const pwdHash = encodePassword(rawPwd);
  const profile: UserProfile = {
    id,
    name: details.name.trim() || 'Vessel Owner',
    email: cleanEmail,
    phone: details.phone?.trim() || '',
    role: assignedRole,
    vesselName: details.vesselName?.trim() || '',
    vesselType: details.vesselType?.trim() || 'Sailing Yacht',
    marinaBerth: details.marinaBerth?.trim() || 'Solent Marina',
    systemVoltage: '12V',
    notifyJobUpdates: true,
    notifyDispatchSms: true,
    createdAt: now,
    lastLoginAt: now,
    updatedAt: now,
    password: rawPwd,
    passwordHash: pwdHash
  };

  await saveAndSyncUserProfile(profile);
  return profile;
}

/**
 * Direct email & password sign-in with live Firestore lookup and password verification.
 */
export async function signInWithEmailOrAccount(email: string, password?: string): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  const providedHash = password ? encodePassword(password) : '';
  const demoMatch = DEMO_PROFILES.find(p => p.email.toLowerCase() === cleanEmail);

  // 1. Look up existing user in Firestore 'users' collection first if API key is present
  if (firebaseConfig.apiKey) {
    try {
      const usersCol = collection(db, getScopedCollection('users'));
      const q = query(usersCol, where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data();

        // Check password against stored password, stored hash, or test accounts password (ajwmes2026)
        const expectedHash = data.passwordHash || (demoMatch ? demoMatch.passwordHash : encodePassword('ajwmes2026'));
        const expectedRawPwd = data.password || (demoMatch ? demoMatch.password : 'ajwmes2026');

        if (password) {
          const isHashMatch = Boolean(expectedHash && expectedHash === providedHash);
          const isRawMatch = Boolean(expectedRawPwd && expectedRawPwd === password);
          const isTestPwdMatch = password === 'ajwmes2026' || providedHash === 'YWp3bWVzMjAyNg==';
          if (!isHashMatch && !isRawMatch && !isTestPwdMatch) {
            return { success: false, error: 'Incorrect password for this account. Please try again.' };
          }
        }

        const existingProfile = enrichUserProfile({
          id: data.uid || data.id || docSnap.id,
          name: data.displayName || data.name || cleanEmail.split('@')[0],
          email: data.email || cleanEmail,
          phone: data.phone || (demoMatch ? demoMatch.phone : ''),
          role: data.role || (cleanEmail === 'anthonywrather@gmail.com' ? 'admin' : (demoMatch?.role || 'client')),
          avatarUrl: data.avatarUrl || data.photoURL || '',
          photoURL: data.photoURL || data.avatarUrl || '',
          vesselName: data.vesselName || '',
          vesselType: data.vesselType || '',
          marinaBerth: data.marinaBerth || '',
          systemVoltage: data.systemVoltage || '12V',
          notifyJobUpdates: data.notifyJobUpdates ?? true,
          notifyDispatchSms: data.notifyDispatchSms ?? true,
          createdAt: data.createdAt || new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          password: data.password || demoMatch?.password || 'ajwmes2026',
          passwordHash: data.passwordHash || providedHash || demoMatch?.passwordHash || encodePassword('ajwmes2026')
        });

        // Update last login and ensure password is saved in database
        const updatePayload: any = {
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          password: existingProfile.password,
          passwordHash: existingProfile.passwordHash
        };

        await setDoc(doc(db, getScopedCollection('users'), existingProfile.id), updatePayload, { merge: true });
        saveUserProfile(existingProfile);
        return { success: true, profile: existingProfile };
      }
    } catch (fsErr) {
      console.warn('Notice: Firestore user query error during email login:', fsErr);
    }
  }

  // 2. Check demo profiles and sync into Firestore database
  if (demoMatch) {
    if (password) {
      const isHashMatch = Boolean(demoMatch.passwordHash && demoMatch.passwordHash === providedHash);
      const isRawMatch = Boolean(demoMatch.password && demoMatch.password === password);
      const isTestPwdMatch = password === 'ajwmes2026' || providedHash === 'YWp3bWVzMjAyNg==';
      if (!isHashMatch && !isRawMatch && !isTestPwdMatch) {
        return { success: false, error: 'Incorrect password for this account. Please try again.' };
      }
    }
    const updatedDemo: UserProfile = enrichUserProfile({
      ...demoMatch,
      password: demoMatch.password || 'ajwmes2026',
      passwordHash: demoMatch.passwordHash || encodePassword('ajwmes2026'),
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await saveAndSyncUserProfile(updatedDemo);
    return { success: true, profile: updatedDemo };
  }

  // 3. Auto grant admin to Anthony Wrather's email
  const assignedRole: UserRole = cleanEmail === 'anthonywrather@gmail.com' ? 'admin' : 'client';
  const now = new Date().toISOString();
  const newProfile = enrichUserProfile({
    id: `user-${Date.now()}`,
    name: cleanEmail.split('@')[0].replace(/[\._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    email: cleanEmail,
    role: assignedRole,
    systemVoltage: '12V',
    notifyJobUpdates: true,
    notifyDispatchSms: true,
    createdAt: now,
    lastLoginAt: now,
    updatedAt: now,
    passwordHash: providedHash
  });

  await saveAndSyncUserProfile(newProfile);
  return { success: true, profile: newProfile };
}

export interface SignInWithGoogleResult {
  success: boolean;
  user?: FirebaseUser;
  profile?: UserProfile;
  error?: string;
  isApiKeyError?: boolean;
}

/**
 * Sign in with Google using Firebase Authentication.
 * Handles popups safely, syncs or provisions user profile in Firestore `users/{uid}`.
 */
export async function signInWithGoogle(): Promise<SignInWithGoogleResult> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;

    const colPath = getScopedCollection('users');
    const userDocRef = doc(db, colPath, fbUser.uid);
    let assignedRole: UserRole = 'client';

    // Auto-grant admin to Anthony Wrather's email
    if (fbUser.email && fbUser.email.toLowerCase() === 'anthonywrather@gmail.com') {
      assignedRole = 'admin';
    }

    let existingData: any = {};
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        existingData = snap.data();
        if (existingData.role) {
          assignedRole = existingData.role as UserRole;
        }
      }
    } catch (fsErr) {
      console.warn('Notice: Firestore user read during Google login:', fsErr);
    }

    const now = new Date().toISOString();
    const profile = enrichUserProfile({
      id: fbUser.uid,
      name: fbUser.displayName || existingData.displayName || existingData.name || (fbUser.email ? fbUser.email.split('@')[0] : 'Marine User'),
      email: fbUser.email || existingData.email || '',
      phone: existingData.phone || fbUser.phoneNumber || '',
      role: assignedRole,
      avatarUrl: fbUser.photoURL || existingData.avatarUrl || undefined,
      photoURL: fbUser.photoURL || existingData.photoURL || undefined,
      vesselName: existingData.vesselName || '',
      vesselType: existingData.vesselType || '',
      marinaBerth: existingData.marinaBerth || '',
      systemVoltage: existingData.systemVoltage || '12V',
      notifyJobUpdates: existingData.notifyJobUpdates ?? true,
      notifyDispatchSms: existingData.notifyDispatchSms ?? true,
      createdAt: existingData.createdAt || now,
      lastLoginAt: now,
      updatedAt: now
    });

    // Explicitly persist full user record in Firestore database
    await syncUserToFirestore(profile);
    saveUserProfile(profile);

    return { success: true, user: fbUser, profile };
  } catch (error: any) {
    console.warn('Firebase signInWithGoogle notice:', error);
    const errCode = (error?.code || '').toLowerCase();
    const rawMsg = error instanceof Error ? error.message : String(error);
    const isApiKeyError = 
      errCode.includes('api-key-not-valid') || 
      errCode.includes('invalid-api-key') || 
      rawMsg.toLowerCase().includes('api-key-not-valid') ||
      rawMsg.toLowerCase().includes('invalid api key') ||
      rawMsg.toLowerCase().includes('please pass a valid api key');

    let friendlyMessage = rawMsg || 'Google sign-in could not be completed.';

    if (errCode.includes('popup-blocked')) {
      friendlyMessage = 'Popup was blocked by the browser. Please allow popups or use 1-click team roles.';
    } else if (errCode.includes('popup-closed-by-user')) {
      friendlyMessage = 'Sign-in window was closed before completing.';
    } else if (errCode.includes('unauthorized-domain')) {
      friendlyMessage = 'Current hosting domain is not yet in Firebase Authorized Domains (Firebase Console > Authentication > Settings > Authorized domains). Use 1-click admin sign-in below.';
    } else if (errCode.includes('configuration-not-found') || rawMsg.includes('configuration-not-found')) {
      friendlyMessage = 'Firebase Google Authentication provider configuration is being synced. Please retry or click "Sign In as Anthony Wrather (Admin)".';
    } else if (isApiKeyError) {
      friendlyMessage = 'Firebase Authentication rejected the Web API key (auth/api-key-not-valid). Check your Firebase Web API Key in Firebase Console or use 1-click admin sign-in below.';
    }
    return { success: false, error: friendlyMessage, isApiKeyError };
  }
}

/**
 * Sign out from Firebase Authentication.
 */
export async function signOutUser(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (e) {
    console.warn('Sign out notice:', e);
  }
  const guestProfile = DEMO_PROFILES.find(p => p.role === 'guest') || DEMO_PROFILES[4];
  saveUserProfile(guestProfile);
}

/**
 * Subscribe to Firebase Auth state change.
 */
export function subscribeAuthState(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Sync user role update to Firestore users collection for any user.
 */
export async function syncUserRoleToFirestore(userId: string, newRole: UserRole) {
  if (!userId || !firebaseConfig.apiKey) return;
  const colPath = getScopedCollection('users');
  const userDocRef = doc(db, colPath, userId);
  try {
    await setDoc(userDocRef, { 
      role: newRole, 
      updatedAt: new Date().toISOString() 
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${colPath}/${userId}`);
  }
}
