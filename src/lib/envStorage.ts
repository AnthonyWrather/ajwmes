import { AppEnvironment, detectEnvironment } from './environment';
import { 
  DEFAULT_CATALOG, 
  DEFAULT_CATEGORIES,
  INITIAL_JOBS, 
  INITIAL_POSTAL_ORDERS, 
  INITIAL_VESSEL_SPEC, 
  INITIAL_SAMPLE_PANEL,
  DEFAULT_VESSELS,
  INITIAL_EXPENSES
} from '../data/seedData';
import { DEMO_PROFILES } from './auth';
import { 
  AI_STUDIO_DEV_JOBS, 
  AI_STUDIO_DEV_POSTAL_ORDERS, 
  AI_STUDIO_DEV_VESSEL_SPEC,
  AI_STUDIO_DEV_USERS,
  AI_STUDIO_PREVIEW_JOBS,
  AI_STUDIO_PREVIEW_POSTAL_ORDERS,
  AI_STUDIO_PREVIEW_VESSEL_SPEC,
  AI_STUDIO_PREVIEW_USERS,
  GITHUB_LIVE_PROD_USERS
} from '../data/environmentTestData';
import { JobRecord, CatalogItem, CategoryItem, PostalOrder, VesselSpec, CartItem, UserProfile, JobExpense, ImportMergeMode } from '../types';
import { mergeCatalogItems, mergeCategories } from '../utils/inventorySync';

/**
 * Scoped Local Storage Manager with Environment Partitioning
 * 
 * Ensures that changes made while developing in AI Studio dev,
 * testing in AI Studio preview, or deployed on GitHub never collide
 * or overwrite each other in the browser's persistent storage.
 */

export interface EnvironmentSeedData {
  jobs: JobRecord[];
  catalog: CatalogItem[];
  categories: CategoryItem[];
  postalOrders: PostalOrder[];
  vesselSpec: VesselSpec;
  vessels: VesselSpec[];
  users: UserProfile[];
  expenses: JobExpense[];
}

export interface ExportedEnvironmentData {
  version: string;
  exportedAt: string;
  environment: AppEnvironment;
  jobs: JobRecord[];
  catalog: CatalogItem[];
  categories?: CategoryItem[];
  postalOrders: PostalOrder[];
  vesselSpec: VesselSpec;
  cart?: CartItem[];
  usersList?: UserProfile[];
  expenses?: JobExpense[];
}

/**
 * Generates an environment-namespaced storage key
 * e.g., 'ajwmes_aistudio_dev_jobs' vs 'ajwmes_github_live_jobs'
 */
export function getEnvKey(baseKey: string, envCode?: AppEnvironment): string {
  const env = envCode ? envCode : detectEnvironment().envCode;
  const safeEnv = env.replace(/-/g, '_');
  return `ajwmes_${safeEnv}_${baseKey}`;
}

// In-memory storage fallback for Node.js test runners, headless CI, and SSR
const memoryStorage = new Map<string, string>();

interface StorageBackend {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

function getStorageBackend(): StorageBackend {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return {
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memoryStorage.set(key, value);
    },
    removeItem: (key: string) => {
      memoryStorage.delete(key);
    }
  };
}

/**
 * Safely retrieves an item from environment-scoped localStorage with automatic fallback
 * and migration from legacy un-namespaced keys.
 */
export function getEnvStorageItem<T>(baseKey: string, fallbackDefault: T, envCode?: AppEnvironment): T {
  const backend = getStorageBackend();
  const namespacedKey = getEnvKey(baseKey, envCode);

  try {
    const namespacedVal = backend.getItem(namespacedKey);
    if (namespacedVal !== null) {
      return JSON.parse(namespacedVal);
    }

    // Check if legacy un-namespaced key exists (migration path)
    const legacyKey = `ajwmes_${baseKey}`;
    const legacyVal = backend.getItem(legacyKey);
    if (legacyVal !== null) {
      const parsed = JSON.parse(legacyVal);
      // Copy over to new namespaced key for this environment
      backend.setItem(namespacedKey, JSON.stringify(parsed));
      return parsed;
    }
  } catch (e) {
    console.warn(`Could not parse storage item for ${namespacedKey}:`, e);
  }

  return fallbackDefault;
}

/**
 * Saves an item into environment-scoped localStorage
 */
export function setEnvStorageItem<T>(baseKey: string, value: T, envCode?: AppEnvironment): void {
  const backend = getStorageBackend();
  const namespacedKey = getEnvKey(baseKey, envCode);
  try {
    backend.setItem(namespacedKey, JSON.stringify(value));
  } catch (e) {
    console.warn(`Could not save storage item for ${namespacedKey}:`, e);
  }
}

/**
 * Removes an item from environment-scoped localStorage
 */
export function removeEnvStorageItem(baseKey: string, envCode?: AppEnvironment): void {
  const backend = getStorageBackend();
  const namespacedKey = getEnvKey(baseKey, envCode);
  try {
    backend.removeItem(namespacedKey);
  } catch (e) {
    console.warn(`Could not remove storage item for ${namespacedKey}:`, e);
  }
}

/**
 * Returns the initial seed dataset suited for the specified environment
 */
export function getEnvironmentSeedData(envCode?: AppEnvironment): EnvironmentSeedData {
  const env = envCode || detectEnvironment().envCode;

  switch (env) {
    case 'aistudio-dev':
      return {
        jobs: AI_STUDIO_DEV_JOBS,
        postalOrders: AI_STUDIO_DEV_POSTAL_ORDERS,
        vesselSpec: AI_STUDIO_DEV_VESSEL_SPEC,
        vessels: DEFAULT_VESSELS,
        catalog: DEFAULT_CATALOG,
        categories: DEFAULT_CATEGORIES,
        users: AI_STUDIO_DEV_USERS,
        expenses: INITIAL_EXPENSES
      };

    case 'aistudio-preview':
      return {
        jobs: AI_STUDIO_PREVIEW_JOBS,
        postalOrders: AI_STUDIO_PREVIEW_POSTAL_ORDERS,
        vesselSpec: AI_STUDIO_PREVIEW_VESSEL_SPEC,
        vessels: DEFAULT_VESSELS,
        catalog: DEFAULT_CATALOG,
        categories: DEFAULT_CATEGORIES,
        users: AI_STUDIO_PREVIEW_USERS,
        expenses: INITIAL_EXPENSES
      };

    case 'github-preview':
      return {
        jobs: INITIAL_JOBS,
        postalOrders: INITIAL_POSTAL_ORDERS,
        vesselSpec: INITIAL_VESSEL_SPEC,
        vessels: DEFAULT_VESSELS,
        catalog: DEFAULT_CATALOG,
        categories: DEFAULT_CATEGORIES,
        users: DEMO_PROFILES.map(u => ({ ...u, environment: 'github-preview' })),
        expenses: INITIAL_EXPENSES
      };

    case 'github-deployed':
    default:
      return {
        jobs: [],
        postalOrders: [],
        vesselSpec: {
          ...INITIAL_VESSEL_SPEC,
          id: 'vessel-prod-solent',
          userId: 'usr-admin-prod-001',
          vesselName: 'AJW Solent Response',
          historyLog: []
        },
        vessels: [],
        catalog: [],
        categories: [],
        users: GITHUB_LIVE_PROD_USERS,
        expenses: []
      };
  }
}

/**
 * Resets the current environment's local storage to fresh baseline test data
 */
export function resetEnvironmentToTestData(envCode?: AppEnvironment): EnvironmentSeedData {
  const seed = getEnvironmentSeedData(envCode);
  setEnvStorageItem('jobs', seed.jobs, envCode);
  setEnvStorageItem('catalog', seed.catalog, envCode);
  setEnvStorageItem('categories', seed.categories, envCode);
  setEnvStorageItem('postal_orders', seed.postalOrders, envCode);
  setEnvStorageItem('vessel_spec', seed.vesselSpec, envCode);
  setEnvStorageItem('vessels', seed.vessels, envCode);
  setEnvStorageItem('users_list', seed.users, envCode);
  setEnvStorageItem('expenses', seed.expenses, envCode);
  setEnvStorageItem('cart', [], envCode);
  return seed;
}

/**
 * Exports current environment data as a structured JSON object
 */
export function exportEnvironmentData(envCode?: AppEnvironment): ExportedEnvironmentData {
  const currentEnv = envCode || detectEnvironment().envCode;
  const seed = getEnvironmentSeedData(currentEnv);

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    environment: currentEnv,
    jobs: getEnvStorageItem('jobs', seed.jobs, currentEnv),
    catalog: getEnvStorageItem('catalog', seed.catalog, currentEnv),
    categories: getEnvStorageItem('categories', seed.categories, currentEnv),
    postalOrders: getEnvStorageItem('postal_orders', seed.postalOrders, currentEnv),
    vesselSpec: getEnvStorageItem('vessel_spec', seed.vesselSpec, currentEnv),
    cart: getEnvStorageItem('cart', [], currentEnv),
    usersList: getEnvStorageItem('users_list', seed.users, currentEnv),
    expenses: getEnvStorageItem('expenses', seed.expenses, currentEnv),
  };
}

/**
 * Imports structured JSON data into the current environment
 */
export function importEnvironmentData(data: Partial<ExportedEnvironmentData>, envCode?: AppEnvironment): boolean {
  try {
    const currentEnv = envCode || detectEnvironment().envCode;
    if (data.jobs && Array.isArray(data.jobs)) {
      setEnvStorageItem('jobs', data.jobs, currentEnv);
    }
    if (data.catalog && Array.isArray(data.catalog)) {
      setEnvStorageItem('catalog', data.catalog, currentEnv);
    }
    if (data.categories && Array.isArray(data.categories)) {
      setEnvStorageItem('categories', data.categories, currentEnv);
    }
    if (data.postalOrders && Array.isArray(data.postalOrders)) {
      setEnvStorageItem('postal_orders', data.postalOrders, currentEnv);
    }
    if (data.vesselSpec && typeof data.vesselSpec === 'object') {
      setEnvStorageItem('vessel_spec', data.vesselSpec, currentEnv);
    }
    if (data.usersList && Array.isArray(data.usersList)) {
      setEnvStorageItem('users_list', data.usersList, currentEnv);
    }
    if (data.expenses && Array.isArray(data.expenses)) {
      setEnvStorageItem('expenses', data.expenses, currentEnv);
    }
    if (data.cart && Array.isArray(data.cart)) {
      setEnvStorageItem('cart', data.cart, currentEnv);
    }
    return true;
  } catch (e) {
    console.error('Failed to import environment data:', e);
    return false;
  }
}

/**
 * Exports only catalog items for current or specified environment
 */
export function exportCatalogItems(envCode?: AppEnvironment): CatalogItem[] {
  const currentEnv = envCode || detectEnvironment().envCode;
  const seed = getEnvironmentSeedData(currentEnv);
  return getEnvStorageItem('catalog', seed.catalog, currentEnv);
}

/**
 * Imports catalog items with either replace or merge strategy
 */
export function importCatalogItems(
  items: CatalogItem[],
  mode: ImportMergeMode = 'replace',
  envCode?: AppEnvironment
): boolean {
  try {
    const currentEnv = envCode || detectEnvironment().envCode;
    const existing = exportCatalogItems(currentEnv);
    const updated = mergeCatalogItems(existing, items, mode);
    setEnvStorageItem('catalog', updated, currentEnv);
    return true;
  } catch (e) {
    console.error('Failed to import catalog items:', e);
    return false;
  }
}

/**
 * Exports only product categories for current or specified environment
 */
export function exportCategories(envCode?: AppEnvironment): CategoryItem[] {
  const currentEnv = envCode || detectEnvironment().envCode;
  const seed = getEnvironmentSeedData(currentEnv);
  return getEnvStorageItem('categories', seed.categories, currentEnv);
}

/**
 * Imports product categories with either replace or merge strategy
 */
export function importCategories(
  categories: CategoryItem[],
  mode: ImportMergeMode = 'replace',
  envCode?: AppEnvironment
): boolean {
  try {
    const currentEnv = envCode || detectEnvironment().envCode;
    const existing = exportCategories(currentEnv);
    const updated = mergeCategories(existing, categories, mode);
    setEnvStorageItem('categories', updated, currentEnv);
    return true;
  } catch (e) {
    console.error('Failed to import categories:', e);
    return false;
  }
}
