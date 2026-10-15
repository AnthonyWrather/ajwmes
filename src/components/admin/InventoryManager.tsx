import React, { useState, useRef } from 'react';
import { CatalogItem, CatalogSnapshot, CategoryItem, ImportMergeMode, ImportValidationResult } from '../../types';
import { 
  Plus, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  Clock, 
  Save, 
  Search, 
  AlertTriangle, 
  Trash2, 
  Truck, 
  Edit3, 
  FolderPlus, 
  Layers, 
  X, 
  ImageIcon, 
  Tag, 
  ArrowRight,
  Sparkles,
  PackageCheck,
  AlertCircle,
  UploadCloud,
  Loader2,
  Cloud,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  ChevronDown,
  FileDown,
  FileUp,
  FileText
} from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../../data/seedData';
import { 
  uploadCatalogItemImage, 
  deleteCatalogItemImage, 
  isFirebaseStorageUrl, 
  formatFileSize 
} from '../../lib/storage';
import {
  exportItemsToJson,
  exportCategoriesToJson,
  exportFullCatalogToJson,
  parseAndValidateItemsJson,
  parseAndValidateCategoriesJson,
  mergeCatalogItems,
  mergeCategories,
  downloadJsonFile,
  readJsonFile
} from '../../utils/inventorySync';

interface InventoryManagerProps {
  catalog: CatalogItem[];
  snapshots: CatalogSnapshot[];
  categories?: CategoryItem[];
  onUpdateCatalog: (newCatalog: CatalogItem[]) => void;
  onCreateSnapshot: (label: string) => void;
  onRestoreSnapshot: (snapshot: CatalogSnapshot) => void;
  onOpenSupplierReorder?: (item: CatalogItem) => void;
  onTriggerZeroStockTest?: (item: CatalogItem) => void;
  onAddCatalogItem?: (item: CatalogItem) => void;
  onEditCatalogItem?: (item: CatalogItem) => void;
  onDeleteCatalogItem?: (itemId: string) => void;
  onAddCategory?: (category: CategoryItem) => void;
  onEditCategory?: (oldId: string, updatedCategory: CategoryItem) => void;
  onDeleteCategory?: (categoryId: string, reassignToCategoryId?: string) => void;
  onUpdateCategories?: (categories: CategoryItem[]) => void;
}

const PRESET_IMAGE_OPTIONS = [
  { label: 'Tinned Cable Spool', url: '/assets/images/marine_cable_spool_crimping_1791421463275.jpg' },
  { label: 'Fuse Block Hardware', url: '/assets/images/marine_fuse_block_hardware_1791421472296.jpg' },
  { label: 'Lithium Battery Bank', url: '/assets/images/marine_lithium_battery_bank_1791400821608.jpg' },
  { label: 'Solar Array Yacht', url: '/assets/images/marine_solar_array_yacht_1791400831647.jpg' },
  { label: 'Laser Switch Panel', url: '/assets/images/marine_switch_panel_laser_1791400808406.jpg' },
  { label: 'Helm Navigation', url: '/assets/images/marine_helm_navigation_1791400844235.jpg' },
  { label: 'Clean Boat Wiring', url: '/assets/images/budget_boat_wiring_clean_1791420126772.jpg' },
  { label: 'Cruiser Vessel', url: '/assets/images/budget_small_cruiser_boat_1791420135992.jpg' },
];

const PRESET_UNITS = ['per meter', 'each', 'pack', 'pair', 'kit', 'roll'];

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  catalog,
  snapshots,
  categories = DEFAULT_CATEGORIES,
  onUpdateCatalog,
  onCreateSnapshot,
  onRestoreSnapshot,
  onOpenSupplierReorder,
  onAddCatalogItem,
  onEditCatalogItem,
  onDeleteCatalogItem,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onUpdateCategories
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [showSnapshotDrawer, setShowSnapshotDrawer] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showSyncMenu, setShowSyncMenu] = useState(false);

  // Standalone Items Import Modal State
  const [isImportItemsModalOpen, setIsImportItemsModalOpen] = useState(false);
  const [importItemsText, setImportItemsText] = useState('');
  const [importItemsMode, setImportItemsMode] = useState<ImportMergeMode>('merge');
  const [importItemsValidation, setImportItemsValidation] = useState<ImportValidationResult<CatalogItem[]> | null>(null);

  // Standalone Categories Import Modal State
  const [isImportCategoriesModalOpen, setIsImportCategoriesModalOpen] = useState(false);
  const [importCategoriesText, setImportCategoriesText] = useState('');
  const [importCategoriesMode, setImportCategoriesMode] = useState<ImportMergeMode>('merge');
  const [importCategoriesValidation, setImportCategoriesValidation] = useState<ImportValidationResult<CategoryItem[]> | null>(null);

  // Item Modal State (Add or Edit)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [itemFormData, setItemFormData] = useState({
    id: '',
    name: '',
    category: categories[0]?.id || 'cable',
    specification: '',
    unit: 'each',
    unitPrice: 10,
    stockCount: 15,
    inStock: true,
    imageUrl: '',
    imageStoragePath: '',
    badge: ''
  });

  // Image Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previousUploadedImagePath, setPreviousUploadedImagePath] = useState<string | null>(null);
  const [imageSourceTab, setImageSourceTab] = useState<'upload' | 'preset' | 'url'>('upload');

  // Item Delete Confirmation Modal State
  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);

  // Category Manager Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    id: '',
    label: '',
    description: ''
  });

  // Category Delete Confirmation Modal State
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);
  const [reassignCategoryTarget, setReassignCategoryTarget] = useState<string>('');

  // Identify out of stock (0) and low stock (<5)
  const zeroStockItems = catalog.filter(item => (item.stockCount ?? 0) === 0 || !item.inStock);
  const zeroStockCount = zeroStockItems.length;

  const lowStockItems = catalog.filter(item => (item.stockCount ?? 0) > 0 && (item.stockCount ?? 0) < 5);
  const lowStockCount = lowStockItems.length;

  // Build filter tabs including dynamic categories
  const filterPills = [
    { id: 'all', label: 'All Items' },
    { id: 'zero_stock', label: `🚨 Depleted (0)${zeroStockCount > 0 ? ` (${zeroStockCount})` : ''}` },
    { id: 'low_stock', label: `⚠️ Low Stock (<5)${lowStockCount > 0 ? ` (${lowStockCount})` : ''}` },
    ...categories.map((c, idx) => {
      const catId = c.id || `cat-${idx}`;
      const count = catalog.filter(i => i.category === catId).length;
      return {
        id: catId,
        label: `${c.label || 'Category'} (${count})`
      };
    })
  ];

  const filteredItems = catalog.filter(item => {
    const matchesCat =
      selectedCategory === 'all'
        ? true
        : selectedCategory === 'zero_stock'
        ? (item.stockCount ?? 0) === 0 || !item.inStock
        : selectedCategory === 'low_stock'
        ? (item.stockCount ?? 0) > 0 && (item.stockCount ?? 0) < 5
        : item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.specification.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // Inline Quick Adjusters
  const handlePriceChange = (id: string, newPrice: number) => {
    const updated = catalog.map(item => item.id === id ? { ...item, unitPrice: Math.max(0, newPrice) } : item);
    onUpdateCatalog(updated);
  };

  const handleStockCountChange = (id: string, newCount: number) => {
    const validCount = Math.max(0, Math.floor(newCount));
    const updated = catalog.map(item =>
      item.id === id
        ? {
            ...item,
            stockCount: validCount,
            inStock: validCount > 0
          }
        : item
    );
    onUpdateCatalog(updated);
  };

  const handleToggleStock = (id: string) => {
    const updated = catalog.map(item => {
      if (item.id === id) {
        const nextInStock = !item.inStock;
        return {
          ...item,
          inStock: nextInStock,
          stockCount: nextInStock ? Math.max(item.stockCount ?? 0, 5) : 0
        };
      }
      return item;
    });
    onUpdateCatalog(updated);
  };

  // Snapshot Handlers
  const handleSaveSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotLabel.trim()) return;
    onCreateSnapshot(snapshotLabel.trim());
    setSnapshotLabel('');
    showNotification('New catalog snapshot save point created!');
  };

  // -------------------------------------------------------------
  // Granular Stock & JSON Sync Handlers (Items, Categories, Full)
  // -------------------------------------------------------------
  const handleExportItemsJSON = () => {
    const json = exportItemsToJson(catalog);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadJsonFile(`ajwmes-inventory-items-${dateStr}.json`, json);
    showNotification(`Exported ${catalog.length} items to JSON for stock control.`);
  };

  const handleExportCategoriesJSON = () => {
    const json = exportCategoriesToJson(categories);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadJsonFile(`ajwmes-categories-${dateStr}.json`, json);
    showNotification(`Exported ${categories.length} categories to JSON.`);
  };

  const handleExportFullBackupJSON = () => {
    const json = exportFullCatalogToJson(catalog, categories, snapshots);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadJsonFile(`ajwmes-catalog-full-backup-${dateStr}.json`, json);
    showNotification(`Exported full catalog backup (${catalog.length} items, ${categories.length} categories).`);
  };

  // Items Import State Handlers
  const handleItemsTextChange = (text: string) => {
    setImportItemsText(text);
    if (!text.trim()) {
      setImportItemsValidation(null);
      return;
    }
    const result = parseAndValidateItemsJson(text);
    setImportItemsValidation(result);
  };

  const handleItemsFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const content = await readJsonFile(file);
        setImportItemsText(content);
        const result = parseAndValidateItemsJson(content);
        setImportItemsValidation(result);
      } catch (err: any) {
        setImportItemsValidation({
          success: false,
          count: 0,
          detectedType: 'unknown',
          error: `File read error: ${err.message || 'Could not read file.'}`
        });
      }
    }
  };

  const handleApplyImportItems = () => {
    if (!importItemsValidation?.data) return;
    const merged = mergeCatalogItems(catalog, importItemsValidation.data, importItemsMode);
    onUpdateCatalog(merged);
    showNotification(
      `Successfully imported ${importItemsValidation.data.length} items (${importItemsMode === 'merge' ? 'Stock updated & merged' : 'Catalog replaced'}).`
    );
    setIsImportItemsModalOpen(false);
    setImportItemsText('');
    setImportItemsValidation(null);
  };

  // Categories Import State Handlers
  const handleCategoriesTextChange = (text: string) => {
    setImportCategoriesText(text);
    if (!text.trim()) {
      setImportCategoriesValidation(null);
      return;
    }
    const result = parseAndValidateCategoriesJson(text);
    setImportCategoriesValidation(result);
  };

  const handleCategoriesFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const content = await readJsonFile(file);
        setImportCategoriesText(content);
        const result = parseAndValidateCategoriesJson(content);
        setImportCategoriesValidation(result);
      } catch (err: any) {
        setImportCategoriesValidation({
          success: false,
          count: 0,
          detectedType: 'unknown',
          error: `File read error: ${err.message || 'Could not read file.'}`
        });
      }
    }
  };

  const handleApplyImportCategories = () => {
    if (!importCategoriesValidation?.data) return;
    const merged = mergeCategories(categories, importCategoriesValidation.data, importCategoriesMode);
    if (onUpdateCategories) {
      onUpdateCategories(merged);
    }
    showNotification(
      `Successfully imported ${importCategoriesValidation.data.length} categories (${importCategoriesMode === 'merge' ? 'Merged & appended' : 'Replaced all'}).`
    );
    setIsImportCategoriesModalOpen(false);
    setImportCategoriesText('');
    setImportCategoriesValidation(null);
  };

  const handleUploadFullBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const content = await readJsonFile(file);
        const itemsResult = parseAndValidateItemsJson(content);
        const catsResult = parseAndValidateCategoriesJson(content);

        let importedItemsCount = 0;
        let importedCatsCount = 0;

        if (itemsResult.success && itemsResult.data) {
          onUpdateCatalog(itemsResult.data);
          importedItemsCount = itemsResult.data.length;
        }

        if (catsResult.success && catsResult.data && onUpdateCategories) {
          onUpdateCategories(catsResult.data);
          importedCatsCount = catsResult.data.length;
        }

        if (importedItemsCount > 0 || importedCatsCount > 0) {
          showNotification(
            `Restored full catalog from ${file.name}: ${importedItemsCount} items and ${importedCatsCount} categories.`
          );
        } else {
          alert('Could not detect valid items or categories in the selected backup file.');
        }
      } catch (err: any) {
        alert(`Failed to parse backup file: ${err.message || 'Invalid JSON format.'}`);
      }
    }
  };

  // -------------------------------------------------------------
  // Item Modal Handlers (Add / Edit)
  // -------------------------------------------------------------
  const openAddItemModal = () => {
    setEditingItem(null);
    setPreviousUploadedImagePath(null);
    setUploadError(null);
    setIsUploadingImage(false);
    setUploadProgress(0);
    setImageSourceTab('upload');
    const newId = `item-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
    setItemFormData({
      id: newId,
      name: '',
      category: categories[0]?.id || 'cable',
      specification: '',
      unit: 'each',
      unitPrice: 12.50,
      stockCount: 20,
      inStock: true,
      imageUrl: '',
      imageStoragePath: '',
      badge: ''
    });
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: CatalogItem) => {
    setEditingItem(item);
    const existingCloudPath = item.imageStoragePath || (isFirebaseStorageUrl(item.imageUrl || '') ? item.imageUrl! : null);
    setPreviousUploadedImagePath(existingCloudPath);
    setUploadError(null);
    setIsUploadingImage(false);
    setUploadProgress(0);
    setImageSourceTab(
      existingCloudPath 
        ? 'upload' 
        : (item.imageUrl?.startsWith('/assets/') ? 'preset' : (item.imageUrl ? 'url' : 'upload'))
    );
    setItemFormData({
      id: item.id,
      name: item.name,
      category: item.category,
      specification: item.specification,
      unit: item.unit,
      unitPrice: item.unitPrice,
      stockCount: item.stockCount ?? 0,
      inStock: item.inStock,
      imageUrl: item.imageUrl || '',
      imageStoragePath: item.imageStoragePath || '',
      badge: item.badge || ''
    });
    setIsItemModalOpen(true);
  };

  // Image upload handling for Add/Edit item form
  const handleImageFileSelect = async (file: File) => {
    if (!file) return;
    setIsUploadingImage(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const result = await uploadCatalogItemImage(
        file,
        itemFormData.id || editingItem?.id || 'new_item',
        (info) => {
          setUploadProgress(info.progress);
        }
      );

      // Clean up previous temporary uploaded image if replaced during this session
      if (
        itemFormData.imageStoragePath &&
        itemFormData.imageStoragePath !== previousUploadedImagePath &&
        itemFormData.imageStoragePath !== result.storagePath
      ) {
        deleteCatalogItemImage(itemFormData.imageStoragePath);
      }

      setItemFormData(prev => ({
        ...prev,
        imageUrl: result.url,
        imageStoragePath: result.storagePath
      }));
      setImageSourceTab('upload');
      showNotification(`Image "${file.name}" uploaded successfully (${result.formattedSize}).`);
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setUploadError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    // If an image was uploaded during this modal session (not saved yet), delete it from storage
    if (itemFormData.imageStoragePath && itemFormData.imageStoragePath !== previousUploadedImagePath) {
      deleteCatalogItemImage(itemFormData.imageStoragePath);
    }
    setItemFormData(prev => ({
      ...prev,
      imageUrl: '',
      imageStoragePath: ''
    }));
  };

  const handleSaveItemForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemFormData.name.trim()) {
      alert('Please provide an item name.');
      return;
    }

    const cleanedItem: CatalogItem = {
      id: itemFormData.id.trim() || `item-${Date.now()}`,
      name: itemFormData.name.trim(),
      category: itemFormData.category || categories[0]?.id || 'cable',
      specification: itemFormData.specification.trim(),
      unit: itemFormData.unit.trim() || 'each',
      unitPrice: Number(itemFormData.unitPrice) || 0,
      stockCount: Number(itemFormData.stockCount) || 0,
      inStock: itemFormData.inStock && Number(itemFormData.stockCount) > 0,
      imageUrl: itemFormData.imageUrl.trim() || undefined,
      imageStoragePath: itemFormData.imageStoragePath.trim() || undefined,
      badge: itemFormData.badge.trim() || undefined
    };

    if (editingItem) {
      // If previous uploaded image was replaced or cleared, delete the old one from storage
      if (
        previousUploadedImagePath &&
        previousUploadedImagePath !== cleanedItem.imageStoragePath
      ) {
        deleteCatalogItemImage(previousUploadedImagePath);
      }

      if (onEditCatalogItem) {
        onEditCatalogItem(cleanedItem);
      } else {
        const nextCatalog = catalog.map(item => item.id === cleanedItem.id ? cleanedItem : item);
        onUpdateCatalog(nextCatalog);
      }
      showNotification(`Item "${cleanedItem.name}" updated successfully.`);
    } else {
      if (onAddCatalogItem) {
        onAddCatalogItem(cleanedItem);
      } else {
        onUpdateCatalog([cleanedItem, ...catalog]);
      }
      showNotification(`New item "${cleanedItem.name}" added to catalog.`);
    }

    setIsItemModalOpen(false);
  };

  // -------------------------------------------------------------
  // Item Delete Handlers - deletes item and associated image
  // -------------------------------------------------------------
  const handleConfirmDeleteItem = async () => {
    if (!itemToDelete) return;
    const targetId = itemToDelete.id;
    const targetName = itemToDelete.name;

    // Delete associated image from storage
    const imageToDelete = itemToDelete.imageStoragePath || itemToDelete.imageUrl;
    if (imageToDelete) {
      try {
        await deleteCatalogItemImage(imageToDelete);
      } catch (e) {
        console.warn('Could not delete image on item delete:', e);
      }
    }

    if (onDeleteCatalogItem) {
      onDeleteCatalogItem(targetId);
    } else {
      const nextCatalog = catalog.filter(i => i.id !== targetId);
      onUpdateCatalog(nextCatalog);
    }

    setItemToDelete(null);
    showNotification(`Item "${targetName}" and associated images permanently deleted.`);
  };

  // -------------------------------------------------------------
  // Category Manager Handlers (Add / Edit / Delete)
  // -------------------------------------------------------------
  const openAddCategoryMode = () => {
    setEditingCategory(null);
    setCategoryFormData({
      id: '',
      label: '',
      description: ''
    });
  };

  const startEditCategory = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setCategoryFormData({
      id: cat.id,
      label: cat.label,
      description: cat.description || ''
    });
  };

  const handleSaveCategoryForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.label.trim()) {
      alert('Please enter a category title.');
      return;
    }

    // Auto slugify id if empty
    const rawId = categoryFormData.id.trim() || categoryFormData.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const cleanId = rawId || `cat_${Date.now()}`;

    const newCategory: CategoryItem = {
      id: cleanId,
      label: categoryFormData.label.trim(),
      description: categoryFormData.description.trim() || undefined
    };

    if (editingCategory) {
      const oldId = editingCategory.id;
      if (onEditCategory) {
        onEditCategory(oldId, newCategory);
      }
      // If category id changed, update items
      if (oldId !== cleanId) {
        const nextCatalog = catalog.map(item => item.category === oldId ? { ...item, category: cleanId } : item);
        onUpdateCatalog(nextCatalog);
      }
      showNotification(`Category "${newCategory.label}" updated.`);
    } else {
      // Check for duplicate id
      if (categories.some(c => c.id === cleanId)) {
        alert(`A category with ID "${cleanId}" already exists. Please choose a different slug.`);
        return;
      }
      if (onAddCategory) {
        onAddCategory(newCategory);
      }
      showNotification(`Category "${newCategory.label}" created.`);
    }

    setEditingCategory(null);
    setCategoryFormData({ id: '', label: '', description: '' });
  };

  const handleStartDeleteCategory = (cat: CategoryItem) => {
    const itemsInCat = catalog.filter(i => i.category === cat.id);
    setCategoryToDelete(cat);
    // Find default reassign target
    const fallback = categories.find(c => c.id !== cat.id)?.id || '';
    setReassignCategoryTarget(fallback);
  };

  const handleConfirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    const catId = categoryToDelete.id;
    const catLabel = categoryToDelete.label;

    if (onDeleteCategory) {
      onDeleteCategory(catId, reassignCategoryTarget);
    } else {
      // Reassign items locally
      if (reassignCategoryTarget) {
        const nextCatalog = catalog.map(i => i.category === catId ? { ...i, category: reassignCategoryTarget } : i);
        onUpdateCatalog(nextCatalog);
      }
    }

    if (selectedCategory === catId) {
      setSelectedCategory('all');
    }

    setCategoryToDelete(null);
    showNotification(`Category "${catLabel}" deleted.`);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header with Add Item & Categories Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">Workshop Catalog</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/50">
              {catalog.length} Items · {categories.length} Categories
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Hardware Catalog &amp; Category Manager
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Add new parts, modify specifications and prices, delete obsolete inventory, and organize marine supply categories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add New Hardware Item Button */}
          <button
            onClick={openAddItemModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-950 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>

          {/* Manage Categories Button */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Categories ({categories.length})</span>
          </button>

          {/* Save Points Drawer Toggle */}
          <button
            onClick={() => setShowSnapshotDrawer(!showSnapshotDrawer)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Snapshots ({snapshots.length})</span>
          </button>

          {/* Export Items Button */}
          <button
            onClick={handleExportItemsJSON}
            data-testid="export-items-button"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
            title="Export catalog items as standalone JSON for stock control & spreadsheets"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Export Items</span>
            <span className="sm:hidden">Items</span>
          </button>

          {/* Import Items Button */}
          <button
            onClick={() => {
              setImportItemsText('');
              setImportItemsValidation(null);
              setIsImportItemsModalOpen(true);
            }}
            data-testid="import-items-button"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
            title="Import or restore items from JSON with stock merge or replace options"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Import Items</span>
            <span className="sm:hidden">Import</span>
          </button>

          {/* More Sync & Backup Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowSyncMenu(!showSyncMenu)}
              data-testid="sync-menu-button"
              className="flex items-center gap-1 px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-colors"
              title="More sync & backup options (Categories, Full Catalog)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              <span>Data Sync</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showSyncMenu && (
              <div 
                className="absolute right-0 mt-1 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-30 animate-in fade-in zoom-in-95 space-y-1"
                data-testid="sync-menu-dropdown"
              >
                <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  Item Stock (Google Sheets)
                </div>
                <button
                  onClick={() => {
                    setShowSyncMenu(false);
                    handleExportItemsJSON();
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Export Items JSON</span>
                </button>
                <button
                  onClick={() => {
                    setShowSyncMenu(false);
                    setImportItemsText('');
                    setImportItemsValidation(null);
                    setIsImportItemsModalOpen(true);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5 text-sky-400" />
                  <span>Import / Merge Items</span>
                </button>

                <div className="border-t border-slate-800 my-1"></div>
                <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  Product Categories
                </div>
                <button
                  onClick={() => {
                    setShowSyncMenu(false);
                    handleExportCategoriesJSON();
                  }}
                  data-testid="dropdown-export-categories"
                  className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Export Categories JSON</span>
                </button>
                <button
                  onClick={() => {
                    setShowSyncMenu(false);
                    setImportCategoriesText('');
                    setImportCategoriesValidation(null);
                    setIsImportCategoriesModalOpen(true);
                  }}
                  data-testid="dropdown-import-categories"
                  className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Import Categories JSON</span>
                </button>

                <div className="border-t border-slate-800 my-1"></div>
                <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  Full Catalog Backup
                </div>
                <button
                  onClick={() => {
                    setShowSyncMenu(false);
                    handleExportFullBackupJSON();
                  }}
                  data-testid="dropdown-export-full"
                  className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export Full Backup</span>
                </button>
                <label 
                  data-testid="dropdown-import-full-label"
                  className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Restore Full Backup File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      setShowSyncMenu(false);
                      handleUploadFullBackup(e);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Snapshot / Save Point Drawer */}
      {showSnapshotDrawer && (
        <div className="bg-slate-900 border border-sky-500/30 p-4 rounded-2xl space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>Catalog Save Points (Rollback Snapshots)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Create a point-in-time snapshot before major updates. Roll back anytime.
              </p>
            </div>

            <form onSubmit={handleSaveSnapshot} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. October 2026 Price Update..."
                value={snapshotLabel}
                onChange={e => setSnapshotLabel(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs px-3 py-1.5 rounded-lg text-white focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Point</span>
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
            {snapshots.length === 0 ? (
              <p className="text-xs text-slate-500 italic col-span-full">No save points recorded yet.</p>
            ) : (
              snapshots.map((snap, idx) => (
                <div key={snap.id ? `snap-${snap.id}-${idx}` : `snap-${idx}`} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-[160px]">{snap.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{snap.timestamp} · {snap.itemsCount} items</p>
                  </div>
                  <button
                    onClick={() => onRestoreSnapshot(snap)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 text-[11px] font-semibold rounded-lg flex items-center gap-1"
                    title="Restore catalog to this snapshot"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Critical Zero Inventory Depleted Banner */}
      {zeroStockCount > 0 && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 space-y-3 shadow-lg shadow-rose-950/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-rose-500/20 rounded-lg text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                  <span>🚨 Urgent Stock Depletion Alert — {zeroStockCount} {zeroStockCount === 1 ? 'item is' : 'items are'} at 0 units</span>
                </h3>
                <p className="text-[11px] text-rose-300/80 mt-0.5">
                  Automated notification alert active. Quick restock or supplier reorder recommended.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedCategory !== 'zero_stock' ? (
                <button
                  onClick={() => setSelectedCategory('zero_stock')}
                  className="text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-500/30 px-3 py-1.5 rounded-lg border border-rose-500/40 transition-colors"
                >
                  Filter table to 0-stock items ({zeroStockCount})
                </button>
              ) : (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Show all items ({catalog.length})
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {zeroStockItems.map((item, idx) => (
              <div
                key={item.id ? `zero-${item.id}-${idx}` : `zero-${idx}`}
                className="p-2.5 rounded-xl bg-slate-950 border border-rose-500/40 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-white text-xs truncate">{item.name}</div>
                  <div className="text-[10px] text-rose-400 font-mono mt-0.5">
                    0 {item.unit} left · OUT OF STOCK
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onOpenSupplierReorder && (
                    <button
                      type="button"
                      onClick={() => onOpenSupplierReorder(item)}
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <Truck className="w-3 h-3" />
                      <span>Reorder</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleStockCountChange(item.id, 10)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-semibold transition-colors"
                    title="Quick restock +10"
                  >
                    +10
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proactive Low Inventory Banner */}
      {lowStockCount > 0 && (
        <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-md shadow-amber-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wider">
                Low Inventory Warning — {lowStockCount} {lowStockCount === 1 ? 'item requires' : 'items require'} restock (&lt; 5 units)
              </h3>
            </div>
            {selectedCategory !== 'low_stock' ? (
              <button
                onClick={() => setSelectedCategory('low_stock')}
                className="text-xs font-semibold text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 px-3 py-1 rounded-lg border border-amber-500/40 transition-colors self-start sm:self-auto"
              >
                Filter table to low stock items ({lowStockCount})
              </button>
            ) : (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 px-3 py-1 rounded-lg transition-colors self-start sm:self-auto"
              >
                Show all items ({catalog.length})
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {lowStockItems.map((item, idx) => (
              <div
                key={item.id ? `low-${item.id}-${idx}` : `low-${idx}`}
                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-amber-500/30 text-xs"
              >
                <span className="font-semibold text-white">{item.name}</span>
                <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border bg-amber-950 text-amber-300 border-amber-500/40">
                  {item.stockCount ?? 0} {item.unit} left
                </span>
                <button
                  type="button"
                  onClick={() => handleStockCountChange(item.id, (item.stockCount ?? 0) + 10)}
                  className="px-2 py-0.5 bg-sky-950 hover:bg-sky-900 text-sky-400 hover:text-sky-300 border border-sky-800/50 rounded text-[11px] font-semibold transition-colors"
                >
                  +10 Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto scrollbar-none max-w-full">
          {filterPills.map((pill, idx) => (
            <button
              key={`pill-${pill.id}-${idx}`}
              onClick={() => setSelectedCategory(pill.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === pill.id
                  ? pill.id === 'low_stock'
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : pill.id === 'zero_stock'
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'bg-sky-600 text-white font-bold shadow-xs'
                  : pill.id === 'low_stock'
                  ? 'text-amber-400 hover:text-amber-300 font-semibold'
                  : pill.id === 'zero_stock'
                  ? 'text-rose-400 hover:text-rose-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}

          {/* Quick Categories Manage Pill */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-2.5 py-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-950/70 border border-indigo-500/30 rounded-lg whitespace-nowrap flex items-center gap-1 transition-colors"
            title="Add, rename or delete categories"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Manage Categories</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search parts, specs, categories..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 bg-slate-900 border border-slate-800 text-xs pl-8 pr-3 py-2 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-mono">
              <tr>
                <th className="p-3.5 pl-5">Hardware Item &amp; Specs</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 text-center">Stock Level</th>
                <th className="p-3.5 text-right">Unit Price</th>
                <th className="p-3.5 text-center">Availability</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-semibold text-slate-400">No hardware items match your filter.</p>
                    <p className="text-xs mt-1">Try clearing your search query or add a new item using the button above.</p>
                    <button
                      onClick={openAddItemModal}
                      className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Item</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isLowStock = (item.stockCount ?? 0) < 5;
                  const isOutOfStock = (item.stockCount ?? 0) <= 0 || !item.inStock;
                  const categoryInfo = categories.find(c => c.id === item.category);

                  return (
                    <tr
                      key={item.id ? `item-${item.id}-${idx}` : `item-${idx}`}
                      className={`transition-colors ${
                        isLowStock ? 'bg-amber-950/15 hover:bg-amber-950/25' : 'hover:bg-slate-900/80'
                      }`}
                    >
                      {/* Name & Specs */}
                      <td className="p-3.5 pl-5">
                        <div className="flex items-start gap-3">
                          {item.imageUrl ? (
                            <div className="relative shrink-0 mt-0.5">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-10 h-10 rounded-lg object-cover bg-slate-950 border border-slate-800"
                                onError={e => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                              {(item.imageStoragePath || isFirebaseStorageUrl(item.imageUrl)) && (
                                <span 
                                  className="absolute -bottom-1 -right-1 p-0.5 bg-sky-950 text-sky-400 border border-sky-800 rounded-full shadow-xs"
                                  title="Cloud uploaded image stored in Firebase"
                                >
                                  <Cloud className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-white">{item.name}</span>
                              {item.badge && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/40 font-mono">
                                  {item.badge}
                                </span>
                              )}
                              {isLowStock && (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide uppercase border ${
                                    isOutOfStock
                                      ? 'bg-rose-950/90 text-rose-300 border-rose-500/50 shadow-xs'
                                      : 'bg-amber-950/90 text-amber-300 border-amber-500/50 shadow-xs animate-pulse'
                                  }`}
                                >
                                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span>{isOutOfStock ? 'Depleted (0)' : `Low: ${item.stockCount ?? 0} left`}</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 max-w-md line-clamp-1">{item.specification}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-medium capitalize">
                          <Tag className="w-2.5 h-2.5 text-sky-400" />
                          <span>{categoryInfo?.label || item.category}</span>
                        </span>
                      </td>

                      {/* Stock Level */}
                      <td className="p-3.5 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <div className="inline-flex items-center gap-1.5">
                            <span
                              className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${
                                isLowStock
                                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-xs'
                                  : 'bg-slate-950 text-slate-200 border-slate-800'
                              }`}
                            >
                              <span>{item.stockCount ?? 0}</span>
                              <span className="text-[10px] text-slate-400 font-normal">{item.unit}</span>
                            </span>

                            {/* Quick +/- buttons */}
                            <div className="inline-flex items-center rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => handleStockCountChange(item.id, Math.max(0, (item.stockCount ?? 0) - 1))}
                                className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition-colors"
                                title="Decrease stock by 1"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStockCountChange(item.id, (item.stockCount ?? 0) + 1)}
                                className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition-colors"
                                title="Increase stock by 1"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleStockCountChange(item.id, (item.stockCount ?? 0) + 10)}
                              className="px-1.5 py-0.5 bg-sky-950 hover:bg-sky-900 text-sky-400 hover:text-sky-300 border border-sky-800/60 text-[10px] font-semibold rounded transition-colors"
                              title="Quick restock +10 units"
                            >
                              +10
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="p-3.5 text-right font-mono font-bold text-white tabular-nums">
                        £{item.unitPrice.toFixed(2)}
                        <span className="text-[10px] text-slate-500 block font-normal">/{item.unit}</span>
                      </td>

                      {/* Availability */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleStock(item.id)}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border transition-colors ${
                            item.inStock && (item.stockCount ?? 0) > 0
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {item.inStock && (item.stockCount ?? 0) > 0 ? 'Available' : 'Out of Stock'}
                        </button>
                      </td>

                      {/* Actions: Edit, Delete, Reorder */}
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Item Button */}
                          <button
                            type="button"
                            onClick={() => openEditItemModal(item)}
                            className="p-1.5 bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                            title="Modify item specifications, pricing or image"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Item Button */}
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition-colors"
                            title="Delete item from catalog"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Reorder Button */}
                          {onOpenSupplierReorder && (
                            <button
                              type="button"
                              onClick={() => onOpenSupplierReorder(item)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 rounded-lg transition-colors"
                              title="Draft supplier purchase order"
                            >
                              <Truck className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================= */}
      {/* MODAL 1: ADD / MODIFY ITEM MODAL                             */}
      {/* ============================================================= */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400 border border-sky-500/20">
                  {editingItem ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingItem ? `Modify Hardware Item: ${editingItem.name}` : 'Add New Hardware Item'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingItem ? 'Update specifications, pricing, stock levels and images.' : 'Create a new stock item in the workshop catalog.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItemForm} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Item Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Victron Blue Smart IP65 Charger 12V 15A"
                  value={itemFormData.name}
                  onChange={e => setItemFormData({ ...itemFormData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">Category</label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[10px] text-sky-400 hover:underline"
                    >
                      + Manage Categories
                    </button>
                  </div>
                  <select
                    value={itemFormData.category}
                    onChange={e => setItemFormData({ ...itemFormData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-white focus:outline-none focus:border-sky-500 capitalize"
                  >
                    {categories.map((cat, idx) => (
                      <option key={cat.id ? `cat-opt-${cat.id}-${idx}` : `cat-opt-${idx}`} value={cat.id || ''}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit of Measure</label>
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="text"
                      placeholder="e.g. each, per meter, pack"
                      value={itemFormData.unit}
                      onChange={e => setItemFormData({ ...itemFormData, unit: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {PRESET_UNITS.map((u, idx) => (
                      <button
                        key={u ? `unit-${u}-${idx}` : `unit-${idx}`}
                        type="button"
                        onClick={() => setItemFormData({ ...itemFormData, unit: u })}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          itemFormData.unit === u
                            ? 'bg-sky-600 text-white border-sky-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Specification */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Technical Specification / Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 7-step smart charger with built-in Bluetooth, IP65 waterproof housing for boat bilges"
                  value={itemFormData.specification}
                  onChange={e => setItemFormData({ ...itemFormData, specification: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Unit Price & Stock Count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit Price (£)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 font-mono text-xs">£</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={itemFormData.unitPrice}
                      onChange={e => setItemFormData({ ...itemFormData, unitPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 text-xs pl-7 pr-3 py-2 rounded-xl text-white font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Warehouse Stock Count</label>
                  <input
                    type="number"
                    min="0"
                    value={itemFormData.stockCount}
                    onChange={e => {
                      const count = parseInt(e.target.value, 10) || 0;
                      setItemFormData({
                        ...itemFormData,
                        stockCount: count,
                        inStock: count > 0
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Badge & In Stock Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Product Badge (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Bestseller, Official Victron, New"
                    value={itemFormData.badge}
                    onChange={e => setItemFormData({ ...itemFormData, badge: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemFormData.inStock}
                      onChange={e => setItemFormData({ ...itemFormData, inStock: e.target.checked })}
                      className="w-4 h-4 rounded text-sky-600 bg-slate-950 border-slate-800 focus:ring-sky-500"
                    />
                    <span className="text-xs font-semibold text-slate-300">Item is available for purchase in store</span>
                  </label>
                </div>
              </div>

              {/* Product Image Section (Upload / Presets / Direct URL) */}
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                    <span>Product Hardware Image</span>
                  </label>
                  {/* Image source tabs */}
                  <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setImageSourceTab('upload')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
                        imageSourceTab === 'upload'
                          ? 'bg-sky-600 text-white font-bold shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <UploadCloud className="w-3 h-3" />
                      <span>Upload Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSourceTab('preset')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                        imageSourceTab === 'preset'
                          ? 'bg-sky-600 text-white font-bold shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>Presets</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSourceTab('url')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                        imageSourceTab === 'url'
                          ? 'bg-sky-600 text-white font-bold shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>Web URL</span>
                    </button>
                  </div>
                </div>

                {/* TAB 1: UPLOAD IMAGE */}
                {imageSourceTab === 'upload' && (
                  <div className="space-y-2">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml,image/heic,image/gif"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageFileSelect(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    {/* Active Upload Preview Card */}
                    {itemFormData.imageUrl ? (
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={itemFormData.imageUrl}
                            alt="Preview"
                            className="w-14 h-14 rounded-lg object-cover bg-slate-900 border border-slate-700/80 shrink-0"
                            onError={e => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-semibold text-white">Active Product Image</span>
                              {itemFormData.imageStoragePath || isFirebaseStorageUrl(itemFormData.imageUrl) ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800/60">
                                  <Cloud className="w-2.5 h-2.5" />
                                  <span>Cloud Storage</span>
                                </span>
                              ) : itemFormData.imageUrl.startsWith('/assets/') ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                                  <span>Preset Asset</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>Uploaded</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-sm">
                              {itemFormData.imageStoragePath || itemFormData.imageUrl}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              This image is bound to this item and will be deleted if the item is removed.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingImage}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                            title="Upload a new photo to replace this one"
                          >
                            <RefreshCw className="w-3 h-3 text-sky-400" />
                            <span>Replace</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            disabled={isUploadingImage}
                            className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold rounded-lg flex items-center gap-1 border border-rose-800/40 transition-colors"
                            title="Remove image from item"
                          >
                            <Trash2 className="w-3 h-3 text-rose-400" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Drag & Drop Upload Dropzone */
                      <div
                        onDragOver={e => {
                          e.preventDefault();
                          setIsDragOver(true);
                        }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={e => {
                          e.preventDefault();
                          setIsDragOver(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleImageFileSelect(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-6 rounded-xl border-2 border-dashed cursor-pointer text-center transition-all ${
                          isDragOver
                            ? 'border-sky-400 bg-sky-950/30 text-white scale-[1.01]'
                            : 'border-slate-800 bg-slate-950/70 hover:border-sky-500/60 hover:bg-slate-950 text-slate-400'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-3 bg-sky-500/10 rounded-2xl text-sky-400 border border-sky-500/20">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">
                              Click to upload product image or drag &amp; drop
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              PNG, JPG, WEBP, SVG, HEIC up to 25 MB · Stored securely in Firebase Storage
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Uploading progress bar */}
                    {isUploadingImage && (
                      <div className="p-3 bg-sky-950/40 border border-sky-500/40 rounded-xl space-y-1.5 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs text-sky-300">
                          <span className="flex items-center gap-1.5 font-semibold">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                            <span>Uploading image to Firebase Cloud Storage...</span>
                          </span>
                          <span className="font-mono font-bold">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-sky-500 h-1.5 rounded-full transition-all duration-200"
                            style={{ width: `${Math.max(5, uploadProgress)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Upload error banner */}
                    {uploadError && (
                      <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center justify-between gap-2">
                        <span>{uploadError}</span>
                        <button
                          type="button"
                          onClick={() => setUploadError(null)}
                          className="text-rose-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: MARINE PRESETS */}
                {imageSourceTab === 'preset' && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-400">
                      Select one of our high-resolution marine electrical workshop presets:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PRESET_IMAGE_OPTIONS.map((preset, idx) => (
                        <button
                          key={preset.url ? `preset-${preset.url}-${idx}` : `preset-${idx}`}
                          type="button"
                          onClick={() => {
                            setItemFormData({
                              ...itemFormData,
                              imageUrl: preset.url,
                              imageStoragePath: ''
                            });
                          }}
                          className={`p-1.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                            itemFormData.imageUrl === preset.url
                              ? 'border-sky-500 bg-sky-950/40 text-white shadow-xs'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                          }`}
                        >
                          <img src={preset.url} alt={preset.label} className="w-7 h-7 rounded object-cover shrink-0" />
                          <span className="text-[10px] truncate">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: WEB URL */}
                {imageSourceTab === 'url' && (
                  <div className="space-y-1">
                    <input
                      type="url"
                      placeholder="https://example.com/product-image.jpg"
                      value={itemFormData.imageUrl}
                      onChange={e => {
                        setItemFormData({
                          ...itemFormData,
                          imageUrl: e.target.value,
                          imageStoragePath: ''
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    />
                    <p className="text-[10px] text-slate-500">
                      Provide a direct web URL to an external product photo.
                    </p>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingImage}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-sky-950 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingItem ? 'Save Item Changes' : 'Create Hardware Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: DELETE ITEM CONFIRMATION MODAL                      */}
      {/* ============================================================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Catalog Item</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Are you sure you want to delete this hardware item from the catalog and store?
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-3">
                {itemToDelete.imageUrl ? (
                  <img
                    src={itemToDelete.imageUrl}
                    alt={itemToDelete.name}
                    className="w-12 h-12 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{itemToDelete.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Category: {itemToDelete.category} · Price: £{itemToDelete.unitPrice.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Current Stock: {itemToDelete.stockCount ?? 0} {itemToDelete.unit}
                  </p>
                </div>
              </div>

              {/* Explicit image deletion notice as requested */}
              {itemToDelete.imageUrl && (
                <div className="flex items-center gap-2 p-2 bg-rose-950/50 border border-rose-500/30 rounded-lg text-rose-300 text-[11px] mt-1">
                  <Trash2 className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span>The associated product image will be permanently deleted from cloud storage.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteItem}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-950"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete &amp; Remove Image</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: CATEGORY MANAGER MODAL                              */}
      {/* ============================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Manage Product Categories</h3>
                  <p className="text-xs text-slate-400">
                    Add new hardware classifications, rename existing categories, or remove unused ones.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCategoriesJSON}
                  data-testid="export-categories-button"
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500/50 rounded-lg text-xs font-semibold text-indigo-300 transition-colors"
                  title="Export categories as JSON"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Export</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImportCategoriesText('');
                    setImportCategoriesValidation(null);
                    setIsImportCategoriesModalOpen(true);
                  }}
                  data-testid="import-categories-button"
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500/50 rounded-lg text-xs font-semibold text-indigo-300 transition-colors"
                  title="Import categories from JSON"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Import</span>
                </button>
                <button
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    setEditingCategory(null);
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-lg ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Subform: Add / Edit Category */}
            <form onSubmit={handleSaveCategoryForm} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  {editingCategory ? <Edit3 className="w-3.5 h-3.5" /> : <FolderPlus className="w-3.5 h-3.5" />}
                  <span>{editingCategory ? `Edit Category: ${editingCategory.label}` : 'Add New Category'}</span>
                </span>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={openAddCategoryMode}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Category Title / Label <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Navigation & Chartplotters"
                    value={categoryFormData.label}
                    onChange={e => {
                      const val = e.target.value;
                      setCategoryFormData({
                        ...categoryFormData,
                        label: val,
                        id: editingCategory ? categoryFormData.id : val.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-xs px-3 py-1.5 rounded-lg text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Category Slug / ID</label>
                  <input
                    type="text"
                    placeholder="e.g. navigation"
                    value={categoryFormData.id}
                    onChange={e => setCategoryFormData({ ...categoryFormData, id: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-xs px-3 py-1.5 rounded-lg text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. NMEA 2000 drop cables, GPS antennas, and marine displays"
                  value={categoryFormData.description}
                  onChange={e => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 text-xs px-3 py-1.5 rounded-lg text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Save className="w-3 h-3" />
                  <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                </button>
              </div>
            </form>

            {/* Category List Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Active Categories ({categories.length})</h4>
              <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                {categories.map((cat, idx) => {
                  const itemCount = catalog.filter(i => i.category === cat.id).length;
                  const isEditingThis = editingCategory?.id === cat.id;

                  return (
                    <div
                      key={cat.id ? `cat-manage-${cat.id}-${idx}` : `cat-manage-${idx}`}
                      className={`p-3 flex items-center justify-between gap-3 text-xs transition-colors ${
                        isEditingThis ? 'bg-sky-950/30' : 'bg-slate-950/60 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{cat.label}</span>
                          <span className="font-mono text-[10px] text-slate-500">[{cat.id}]</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900 text-sky-400 border border-slate-800 font-mono">
                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{cat.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditCategory(cat)}
                          className="p-1.5 bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                          title="Modify category name and description"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartDeleteCategory(cat)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition-colors"
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 4: DELETE CATEGORY CONFIRMATION MODAL                  */}
      {/* ============================================================= */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Category: {categoryToDelete.label}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Are you sure you want to delete this category?
                </p>
              </div>
            </div>

            {catalog.filter(i => i.category === categoryToDelete.id).length > 0 ? (
              <div className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-xl text-xs space-y-2">
                <p className="font-semibold text-amber-300">
                  ⚠️ This category currently has {catalog.filter(i => i.category === categoryToDelete.id).length} assigned items!
                </p>
                <p className="text-[11px] text-slate-300">
                  Choose which category these items should be moved to so they remain accessible:
                </p>
                <select
                  value={reassignCategoryTarget}
                  onChange={e => setReassignCategoryTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs px-2.5 py-1.5 rounded-lg text-white"
                >
                  {categories
                    .filter(c => c.id !== categoryToDelete.id)
                    .map((c, idx) => (
                      <option key={c.id ? `reassign-${c.id}-${idx}` : `reassign-${idx}`} value={c.id || ''}>
                        Move to: {c.label}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <p className="text-xs text-slate-300">
                This category has 0 items and can be safely removed.
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-950"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete Category</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ============================================================= */}
      {/* MODAL 5: IMPORT ITEMS (STANDALONE STOCK SYNC)                 */}
      {/* ============================================================= */}
      {isImportItemsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400 border border-sky-500/20">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Import Hardware Items &amp; Stock</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-950 text-sky-300 border border-sky-500/30 font-mono">
                      Stock Sync
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sync stock levels from Google Sheets or restore items from an AJWMES JSON export.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportItemsModalOpen(false);
                  setImportItemsText('');
                  setImportItemsValidation(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* File Upload Zone */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Choose JSON File from Computer:
              </label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-sky-500/60 bg-slate-950/50 hover:bg-slate-950 p-4 rounded-xl cursor-pointer transition-colors text-center">
                <UploadCloud className="w-7 h-7 text-sky-400 mb-1" />
                <span className="text-xs font-semibold text-slate-200">Click to browse or select .json file</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Compatible with .json arrays or AJWMES envelopes</span>
                <input
                  type="file"
                  accept=".json"
                  data-testid="import-items-file-input"
                  onChange={handleItemsFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Paste JSON Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Or Paste JSON Data Directly:
                </label>
                {importItemsText && (
                  <button
                    type="button"
                    onClick={() => handleItemsTextChange('')}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Clear Text
                  </button>
                )}
              </div>
              <textarea
                value={importItemsText}
                onChange={e => handleItemsTextChange(e.target.value)}
                data-testid="import-items-textarea"
                placeholder='[&#10;  {&#10;    "id": "cable-10awg",&#10;    "name": "10 AWG Tinned Marine Cable",&#10;    "category": "cable",&#10;    "stockCount": 120,&#10;    "unitPrice": 4.50&#10;  }&#10;]'
                rows={5}
                className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Validation Feedback */}
            {importItemsValidation && (
              <div 
                data-testid="import-items-validation"
                className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                  importItemsValidation.success 
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {importItemsValidation.success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Ready to import {importItemsValidation.count} items ({importItemsValidation.detectedType} detected)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{importItemsValidation.error}</span>
                    </>
                  )}
                </div>

                {importItemsValidation.warnings && importItemsValidation.warnings.length > 0 && (
                  <div className="text-[11px] text-amber-300/90 pl-6 space-y-0.5 border-t border-slate-800/60 pt-1 mt-1">
                    {importItemsValidation.warnings.slice(0, 3).map((w, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{w}</span>
                      </div>
                    ))}
                    {importItemsValidation.warnings.length > 3 && (
                      <div className="text-slate-400 italic">
                        + {importItemsValidation.warnings.length - 3} more minor notices
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Import Strategy Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Choose Import Strategy:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label 
                  data-testid="mode-merge"
                  className={`p-3 rounded-xl border cursor-pointer transition-colors flex flex-col justify-between ${
                    importItemsMode === 'merge'
                      ? 'bg-sky-950/40 border-sky-500/60 ring-1 ring-sky-500/40'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-white flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
                      <span>Merge &amp; Update Stock</span>
                    </div>
                    <input
                      type="radio"
                      name="importItemsMode"
                      value="merge"
                      checked={importItemsMode === 'merge'}
                      onChange={() => setImportItemsMode('merge')}
                      className="text-sky-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ideal for Google Sheets updates. Updates matching SKUs/IDs, appends new items, and preserves photos.
                  </p>
                </label>

                <label 
                  data-testid="mode-replace"
                  className={`p-3 rounded-xl border cursor-pointer transition-colors flex flex-col justify-between ${
                    importItemsMode === 'replace'
                      ? 'bg-rose-950/40 border-rose-500/60 ring-1 ring-rose-500/40'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-white flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                      <span>Replace Entire Catalog</span>
                    </div>
                    <input
                      type="radio"
                      name="importItemsMode"
                      value="replace"
                      checked={importItemsMode === 'replace'}
                      onChange={() => setImportItemsMode('replace')}
                      className="text-rose-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Completely overwrites all current items with the imported dataset.
                  </p>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsImportItemsModalOpen(false);
                  setImportItemsText('');
                  setImportItemsValidation(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyImportItems}
                disabled={!importItemsValidation?.success || !importItemsValidation?.data?.length}
                data-testid="apply-import-items-button"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-sky-950 cursor-pointer disabled:cursor-not-allowed transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Apply Items Import ({importItemsValidation?.count || 0})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 6: IMPORT CATEGORIES (STANDALONE SYNC)                   */}
      {/* ============================================================= */}
      {isImportCategoriesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Import Product Categories</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-mono">
                      Category Sync
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Import and organize marine hardware classifications independently.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportCategoriesModalOpen(false);
                  setImportCategoriesText('');
                  setImportCategoriesValidation(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* File Upload Zone */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Choose Categories JSON File:
              </label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-indigo-500/60 bg-slate-950/50 hover:bg-slate-950 p-4 rounded-xl cursor-pointer transition-colors text-center">
                <UploadCloud className="w-7 h-7 text-indigo-400 mb-1" />
                <span className="text-xs font-semibold text-slate-200">Click to browse or select .json file</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Compatible with category arrays or AJWMES category exports</span>
                <input
                  type="file"
                  accept=".json"
                  data-testid="import-categories-file-input"
                  onChange={handleCategoriesFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Paste JSON Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Or Paste Categories JSON Directly:
                </label>
                {importCategoriesText && (
                  <button
                    type="button"
                    onClick={() => handleCategoriesTextChange('')}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Clear Text
                  </button>
                )}
              </div>
              <textarea
                value={importCategoriesText}
                onChange={e => handleCategoriesTextChange(e.target.value)}
                data-testid="import-categories-textarea"
                placeholder='[&#10;  {&#10;    "id": "solar",&#10;    "label": "Solar Panels & Victron MPPT",&#10;    "description": "Rigid solar arrays, controllers & cables"&#10;  }&#10;]'
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Validation Feedback */}
            {importCategoriesValidation && (
              <div 
                data-testid="import-categories-validation"
                className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                  importCategoriesValidation.success 
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {importCategoriesValidation.success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Ready to import {importCategoriesValidation.count} categories</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{importCategoriesValidation.error}</span>
                    </>
                  )}
                </div>

                {importCategoriesValidation.warnings && importCategoriesValidation.warnings.length > 0 && (
                  <div className="text-[11px] text-amber-300/90 pl-6 space-y-0.5 border-t border-slate-800/60 pt-1 mt-1">
                    {importCategoriesValidation.warnings.slice(0, 3).map((w, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Import Strategy Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Choose Import Strategy:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label 
                  data-testid="cat-mode-merge"
                  className={`p-3 rounded-xl border cursor-pointer transition-colors flex flex-col justify-between ${
                    importCategoriesMode === 'merge'
                      ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/40'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-white flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Merge &amp; Append</span>
                    </div>
                    <input
                      type="radio"
                      name="importCategoriesMode"
                      value="merge"
                      checked={importCategoriesMode === 'merge'}
                      onChange={() => setImportCategoriesMode('merge')}
                      className="text-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Updates matching category titles/descriptions and appends newly defined categories.
                  </p>
                </label>

                <label 
                  data-testid="cat-mode-replace"
                  className={`p-3 rounded-xl border cursor-pointer transition-colors flex flex-col justify-between ${
                    importCategoriesMode === 'replace'
                      ? 'bg-rose-950/40 border-rose-500/60 ring-1 ring-rose-500/40'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-white flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                      <span>Replace All Categories</span>
                    </div>
                    <input
                      type="radio"
                      name="importCategoriesMode"
                      value="replace"
                      checked={importCategoriesMode === 'replace'}
                      onChange={() => setImportCategoriesMode('replace')}
                      className="text-rose-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Completely replaces the existing category list with the imported categories.
                  </p>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsImportCategoriesModalOpen(false);
                  setImportCategoriesText('');
                  setImportCategoriesValidation(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyImportCategories}
                disabled={!importCategoriesValidation?.success || !importCategoriesValidation?.data?.length}
                data-testid="apply-import-categories-button"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-950 cursor-pointer disabled:cursor-not-allowed transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Apply Categories Import ({importCategoriesValidation?.count || 0})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
