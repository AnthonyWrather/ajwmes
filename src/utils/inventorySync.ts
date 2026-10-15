import { 
  CatalogItem, 
  CategoryItem, 
  CatalogSnapshot, 
  ImportMergeMode, 
  InventoryItemsExport, 
  InventoryCategoriesExport, 
  FullCatalogExport, 
  ImportValidationResult 
} from '../types';

/**
 * Pure Utility Module for Marine Hardware Inventory & Category Synchronization
 * 
 * Provides decoupled serialization, schema validation, data cleansing, and merge algorithms
 * for independent stock control (Google Sheets sync) and catalog rollback points.
 */

const APP_VERSION = '1.2.0';

/**
 * Exports catalog items as a standalone JSON envelope
 */
export function exportItemsToJson(items: CatalogItem[], pretty = true): string {
  const payload: InventoryItemsExport = {
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    type: 'ajwmes_items',
    source: 'AJW Marine Electrical Services - Inventory Control',
    count: items.length,
    items
  };
  return JSON.stringify(payload, null, pretty ? 2 : undefined);
}

/**
 * Exports product categories as a standalone JSON envelope
 */
export function exportCategoriesToJson(categories: CategoryItem[], pretty = true): string {
  const payload: InventoryCategoriesExport = {
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    type: 'ajwmes_categories',
    source: 'AJW Marine Electrical Services - Inventory Control',
    count: categories.length,
    categories
  };
  return JSON.stringify(payload, null, pretty ? 2 : undefined);
}

/**
 * Exports full catalog (items, categories, and snapshots) as a comprehensive backup
 */
export function exportFullCatalogToJson(
  catalog: CatalogItem[], 
  categories: CategoryItem[], 
  snapshots: CatalogSnapshot[] = [], 
  pretty = true
): string {
  const payload: FullCatalogExport = {
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    type: 'ajwmes_full_catalog',
    company: 'AJW Marine Electrical Services',
    itemsCount: catalog.length,
    categoriesCount: categories.length,
    catalog,
    categories,
    snapshots
  };
  return JSON.stringify(payload, null, pretty ? 2 : undefined);
}

/**
 * Sanitizes and validates a single item record, coercing string numbers and providing safe defaults
 */
function sanitizeItem(raw: any, index: number): { item?: CatalogItem; warning?: string } {
  if (!raw || typeof raw !== 'object') {
    return { warning: `Row #${index + 1}: Skipped invalid non-object item.` };
  }

  const rawId = String(raw.id ?? raw.sku ?? raw.partNumber ?? '').trim();
  const rawName = String(raw.name ?? raw.title ?? raw.description ?? '').trim();

  if (!rawName) {
    return { warning: `Row #${index + 1}: Skipped item without a valid name or title.` };
  }

  const id = rawId || `item-${Date.now().toString(36)}-${index}`;
  const category = String(raw.category ?? 'cable').trim().toLowerCase();
  const specification = String(raw.specification ?? raw.spec ?? '').trim();
  const unit = String(raw.unit ?? 'each').trim();

  // Coerce unitPrice safely
  const parsedPrice = typeof raw.unitPrice === 'number' 
    ? raw.unitPrice 
    : parseFloat(String(raw.unitPrice ?? raw.price ?? 0));
  const unitPrice = isNaN(parsedPrice) ? 0 : Math.max(0, Number(parsedPrice.toFixed(2)));

  // Coerce stockCount safely
  const parsedStock = typeof raw.stockCount === 'number'
    ? raw.stockCount
    : parseInt(String(raw.stockCount ?? raw.stock ?? raw.quantity ?? 0), 10);
  const stockCount = isNaN(parsedStock) ? 0 : Math.max(0, parsedStock);

  // Derive inStock
  const inStock = typeof raw.inStock === 'boolean' 
    ? raw.inStock 
    : stockCount > 0;

  const imageUrl = raw.imageUrl ? String(raw.imageUrl).trim() : undefined;
  const imageStoragePath = raw.imageStoragePath ? String(raw.imageStoragePath).trim() : undefined;
  const badge = raw.badge ? String(raw.badge).trim() : undefined;

  const item: CatalogItem = {
    id,
    name: rawName,
    category,
    specification,
    unit,
    unitPrice,
    stockCount,
    inStock,
    ...(imageUrl ? { imageUrl } : {}),
    ...(imageStoragePath ? { imageStoragePath } : {}),
    ...(badge ? { badge } : {})
  };

  return { item };
}

/**
 * Parses and validates an items JSON string from user input or file upload.
 * Accepts standalone item envelopes, full catalog backups, or raw item arrays (Google Sheets JSON).
 */
export function parseAndValidateItemsJson(rawJson: string): ImportValidationResult<CatalogItem[]> {
  if (!rawJson || !rawJson.trim()) {
    return {
      success: false,
      count: 0,
      detectedType: 'unknown',
      error: 'Empty JSON content provided. Please upload or paste valid item data.'
    };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      detectedType: 'unknown',
      error: `Invalid JSON syntax: ${err.message || 'Check for missing brackets or quotes.'}`
    };
  }

  let rawList: any[] = [];
  let detectedType: ImportValidationResult<CatalogItem[]>['detectedType'] = 'unknown';

  if (Array.isArray(parsed)) {
    rawList = parsed;
    detectedType = 'items';
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.items)) {
      rawList = parsed.items;
      detectedType = 'items';
    } else if (Array.isArray(parsed.catalog)) {
      rawList = parsed.catalog;
      detectedType = parsed.categories ? 'full_catalog' : 'items';
    } else {
      return {
        success: false,
        count: 0,
        detectedType: 'unknown',
        error: 'JSON object does not contain an "items" or "catalog" array.'
      };
    }
  } else {
    return {
      success: false,
      count: 0,
      detectedType: 'unknown',
      error: 'Parsed JSON is neither an array nor an envelope object.'
    };
  }

  if (rawList.length === 0) {
    return {
      success: false,
      count: 0,
      detectedType,
      error: 'The provided JSON array contains 0 item records.'
    };
  }

  const items: CatalogItem[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();

  rawList.forEach((raw, idx) => {
    const { item, warning } = sanitizeItem(raw, idx);
    if (warning) {
      warnings.push(warning);
    }
    if (item) {
      if (seenIds.has(item.id)) {
        warnings.push(`Duplicate item ID "${item.id}" found in row #${idx + 1}; updated previous definition.`);
        const existingIdx = items.findIndex(i => i.id === item.id);
        if (existingIdx !== -1) {
          items[existingIdx] = item;
        }
      } else {
        seenIds.add(item.id);
        items.push(item);
      }
    }
  });

  if (items.length === 0) {
    return {
      success: false,
      count: 0,
      detectedType,
      error: 'No valid catalog items could be extracted from the file.',
      warnings
    };
  }

  return {
    success: true,
    data: items,
    count: items.length,
    detectedType,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Sanitizes and validates a single category record
 */
function sanitizeCategory(raw: any, index: number): { category?: CategoryItem; warning?: string } {
  if (!raw || typeof raw !== 'object') {
    return { warning: `Row #${index + 1}: Skipped invalid non-object category.` };
  }

  const rawLabel = String(raw.label ?? raw.name ?? raw.title ?? '').trim();
  if (!rawLabel) {
    return { warning: `Row #${index + 1}: Skipped category without a valid label or title.` };
  }

  const rawId = String(raw.id ?? raw.slug ?? '').trim();
  const id = (rawId || rawLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')) || `cat_${index}`;
  const description = raw.description ? String(raw.description).trim() : undefined;

  const category: CategoryItem = {
    id,
    label: rawLabel,
    ...(description ? { description } : {})
  };

  return { category };
}

/**
 * Parses and validates a category JSON string from user input or file upload.
 * Accepts standalone category envelopes, full catalog backups, or raw category arrays.
 */
export function parseAndValidateCategoriesJson(rawJson: string): ImportValidationResult<CategoryItem[]> {
  if (!rawJson || !rawJson.trim()) {
    return {
      success: false,
      count: 0,
      detectedType: 'unknown',
      error: 'Empty JSON content provided. Please upload or paste valid category data.'
    };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      detectedType: 'unknown',
      error: `Invalid JSON syntax: ${err.message || 'Check for missing brackets or quotes.'}`
    };
  }

  let rawList: any[] = [];
  let detectedType: ImportValidationResult<CategoryItem[]>['detectedType'] = 'unknown';

  if (Array.isArray(parsed)) {
    rawList = parsed;
    detectedType = 'categories';
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.categories)) {
      rawList = parsed.categories;
      detectedType = parsed.catalog ? 'full_catalog' : 'categories';
    } else {
      return {
        success: false,
        count: 0,
        detectedType: 'unknown',
        error: 'JSON object does not contain a "categories" array.'
      };
    }
  } else {
    return {
      success: false,
      count: 0,
      detectedType: 'unknown',
      error: 'Parsed JSON is neither an array nor an envelope object.'
    };
  }

  if (rawList.length === 0) {
    return {
      success: false,
      count: 0,
      detectedType,
      error: 'The provided JSON array contains 0 category records.'
    };
  }

  const categories: CategoryItem[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();

  rawList.forEach((raw, idx) => {
    const { category, warning } = sanitizeCategory(raw, idx);
    if (warning) {
      warnings.push(warning);
    }
    if (category) {
      if (seenIds.has(category.id)) {
        warnings.push(`Duplicate category ID "${category.id}" found in row #${idx + 1}; updated previous definition.`);
        const existingIdx = categories.findIndex(c => c.id === category.id);
        if (existingIdx !== -1) {
          categories[existingIdx] = category;
        }
      } else {
        seenIds.add(category.id);
        categories.push(category);
      }
    }
  });

  if (categories.length === 0) {
    return {
      success: false,
      count: 0,
      detectedType,
      error: 'No valid product categories could be extracted from the file.',
      warnings
    };
  }

  return {
    success: true,
    data: categories,
    count: categories.length,
    detectedType,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Merges newly imported catalog items with existing items based on chosen strategy.
 * - 'replace': Completely overwrites the existing list with new items.
 * - 'merge': Upserts items by id (updates matching SKU/ID, appends non-existent ones). Ideal for Google Sheets stock sync.
 */
export function mergeCatalogItems(
  existingItems: CatalogItem[], 
  newItems: CatalogItem[], 
  mode: ImportMergeMode
): CatalogItem[] {
  if (mode === 'replace') {
    return [...newItems];
  }

  const itemMap = new Map<string, CatalogItem>();
  existingItems.forEach(item => itemMap.set(item.id, { ...item }));

  newItems.forEach(newItem => {
    const current = itemMap.get(newItem.id);
    if (current) {
      itemMap.set(newItem.id, {
        ...current,
        ...newItem,
        // Preserve image attributes if new item did not specify them
        imageUrl: newItem.imageUrl || current.imageUrl,
        imageStoragePath: newItem.imageStoragePath || current.imageStoragePath,
        badge: newItem.badge !== undefined ? newItem.badge : current.badge
      });
    } else {
      itemMap.set(newItem.id, { ...newItem });
    }
  });

  return Array.from(itemMap.values());
}

/**
 * Merges newly imported categories with existing categories based on chosen strategy.
 * - 'replace': Completely overwrites the existing categories.
 * - 'merge': Upserts categories by id (updates matching slug/ID, appends new ones).
 */
export function mergeCategories(
  existingCategories: CategoryItem[], 
  newCategories: CategoryItem[], 
  mode: ImportMergeMode
): CategoryItem[] {
  if (mode === 'replace') {
    return [...newCategories];
  }

  const catMap = new Map<string, CategoryItem>();
  existingCategories.forEach(c => catMap.set(c.id, { ...c }));

  newCategories.forEach(newCat => {
    const current = catMap.get(newCat.id);
    if (current) {
      catMap.set(newCat.id, {
        ...current,
        ...newCat,
        description: newCat.description !== undefined ? newCat.description : current.description
      });
    } else {
      catMap.set(newCat.id, { ...newCat });
    }
  });

  return Array.from(catMap.values());
}

/**
 * Triggers a browser file download of JSON text
 */
export function downloadJsonFile(filename: string, jsonString: string): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Asynchronously reads the text content of a browser File object
 */
export function readJsonFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve((e.target?.result as string) || '');
    };
    reader.onerror = (err) => {
      reject(err);
    };
    reader.readAsText(file);
  });
}
