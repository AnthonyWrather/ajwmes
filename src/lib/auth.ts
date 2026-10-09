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
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
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

export const DEMO_PROFILES: UserProfile[] = [
  {
    id: 'demo-admin',
    name: 'Anthony Wrather',
    email: 'anthonywrather@gmail.com',
    role: 'admin',
    phone: '07700 900551',
    avatarUrl: '/assets/images/avatar_designer_sarah_1791400201276.jpg'
  },
  {
    id: 'demo-tech',
    name: 'Jack Henderson',
    email: 'jack.tech@ajwmarine.co.uk',
    role: 'technician',
    phone: '07700 900882'
  },
  {
    id: 'demo-postal',
    name: 'Sarah Miller',
    email: 'sarah.postal@ajwmarine.co.uk',
    role: 'postal',
    phone: '07700 900663'
  },
  {
    id: 'demo-client',
    name: 'David Mercer',
    email: 'd.mercer@solent-sail.co.uk',
    role: 'client',
    phone: '07700 900114',
    vesselName: 'Westerly Discus 33',
    vesselType: 'Sailing Yacht',
    marinaBerth: 'Haslar Marina (Berth E-14)'
  },
  {
    id: 'demo-guest',
    name: 'Guest Browser',
    email: 'guest@solent-visitor.co.uk',
    role: 'guest'
  }
];

const LOCAL_STORAGE_USER_KEY = 'ajwmes_current_user_profile';
const LOCAL_STORAGE_ROLE_KEY = 'ajwmes_current_role';

export function getSavedRole(): UserRole {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_ROLE_KEY) as UserRole | null;
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
    localStorage.setItem(LOCAL_STORAGE_ROLE_KEY, role);
  } catch (e) {
    console.warn('Could not save role', e);
  }
}

export function getSavedUserProfile(): UserProfile {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Could not read saved user profile', e);
  }
  const defaultRole = getSavedRole();
  const demoMatch = DEMO_PROFILES.find(p => p.role === defaultRole) || DEMO_PROFILES[4];
  return demoMatch;
}

export function saveUserProfile(profile: UserProfile) {
  try {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
    saveCurrentRole(profile.role);
  } catch (e) {
    console.warn('Could not save user profile', e);
  }
}

/**
 * Sign in with Google using Firebase Authentication.
 * Handles popups safely, syncs or provisions user profile in Firestore `users/{uid}`.
 */
export async function signInWithGoogle(): Promise<{ success: boolean; user?: FirebaseUser; profile?: UserProfile; error?: string }> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;

    // Check if user already exists in Firestore users collection
    const userDocRef = doc(db, 'users', fbUser.uid);
    let assignedRole: UserRole = 'client';

    // Auto-grant admin to Anthony Wrather's email
    if (fbUser.email && fbUser.email.toLowerCase() === 'anthonywrather@gmail.com') {
      assignedRole = 'admin';
    }

    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.role) {
          assignedRole = data.role as UserRole;
        }
      } else {
        // Create initial user document in Firestore
        await setDoc(userDocRef, {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || 'Google User',
          photoURL: fbUser.photoURL || '',
          role: assignedRole,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (fsErr) {
      console.warn('Notice: Firestore user sync during login (local fallback active):', fsErr);
    }

    const profile: UserProfile = {
      id: fbUser.uid,
      name: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Marine User'),
      email: fbUser.email || '',
      role: assignedRole,
      avatarUrl: fbUser.photoURL || undefined
    };

    saveUserProfile(profile);
    return { success: true, user: fbUser, profile };
  } catch (error: any) {
    console.warn('Firebase signInWithGoogle notice:', error);
    const errCode = error?.code || '';
    let friendlyMessage = error instanceof Error ? error.message : 'Google sign-in could not be completed.';
    if (errCode === 'auth/popup-blocked') {
      friendlyMessage = 'Popup was blocked by the browser. Please allow popups or use 1-click test roles.';
    } else if (errCode === 'auth/popup-closed-by-user') {
      friendlyMessage = 'Sign-in window was closed before completing.';
    } else if (errCode === 'auth/unauthorized-domain') {
      friendlyMessage = 'Preview domain not yet in Firebase authorized domains. Pre-configured test roles are active.';
    }
    return { success: false, error: friendlyMessage };
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
 * Sync user role update to Firestore users collection.
 */
export async function syncUserRoleToFirestore(userId: string, newRole: UserRole) {
  if (!userId || userId.startsWith('demo-')) return;
  const userDocRef = doc(db, 'users', userId);
  try {
    await setDoc(userDocRef, { role: newRole, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
  }
}
