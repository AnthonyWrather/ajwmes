import React, { useState } from 'react';
import { CatalogItem, CatalogSnapshot } from '../../types';
import { Plus, Download, Upload, RotateCcw, Check, Clock, Save, Search, AlertCircle, AlertTriangle, Trash2, Truck, Mail, Bell, RefreshCw, Zap } from 'lucide-react';

interface InventoryManagerProps {
  catalog: CatalogItem[];
  snapshots: CatalogSnapshot[];
  onUpdateCatalog: (newCatalog: CatalogItem[]) => void;
  onCreateSnapshot: (label: string) => void;
  onRestoreSnapshot: (snapshot: CatalogSnapshot) => void;
  onOpenSupplierReorder?: (item: CatalogItem) => void;
  onTriggerZeroStockTest?: (item: CatalogItem) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  catalog,
  snapshots,
  onUpdateCatalog,
  onCreateSnapshot,
  onRestoreSnapshot,
  onOpenSupplierReorder,
  onTriggerZeroStockTest
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [isEditingItem, setIsEditingItem] = useState<CatalogItem | null>(null);
  const [showSnapshotDrawer, setShowSnapshotDrawer] = useState(false);
  const [backupSuccessMsg, setBackupSuccessMsg] = useState('');

  // Identify out of stock (0) and low stock (<5)
  const zeroStockItems = catalog.filter(item => (item.stockCount ?? 0) === 0 || !item.inStock);
  const zeroStockCount = zeroStockItems.length;

  const lowStockItems = catalog.filter(item => (item.stockCount ?? 0) > 0 && (item.stockCount ?? 0) < 5);
  const lowStockCount = lowStockItems.length;

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'zero_stock', label: `🚨 Depleted (0)${zeroStockCount > 0 ? ` (${zeroStockCount})` : ''}` },
    { id: 'low_stock', label: `⚠️ Low Stock (<5)${lowStockCount > 0 ? ` (${lowStockCount})` : ''}` },
    { id: 'cable', label: 'Tinned Cables' },
    { id: 'fuses', label: 'Fuse Blocks' },
    { id: 'busbars', label: 'Busbars & Dist' },
    { id: 'switches', label: 'Marine Switches' },
    { id: 'victron', label: 'Victron Power' },
    { id: 'panels', label: 'Replica/Custom Panels' },
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
                          item.specification.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handlePriceChange = (id: string, newPrice: number) => {
    onUpdateCatalog(catalog.map(item => item.id === id ? { ...item, unitPrice: newPrice } : item));
  };

  const handleStockCountChange = (id: string, newCount: number) => {
    const validCount = Math.max(0, Math.floor(newCount));
    onUpdateCatalog(
      catalog.map(item =>
        item.id === id
          ? {
              ...item,
              stockCount: validCount,
              inStock: validCount > 0
            }
          : item
      )
    );
  };

  const handleToggleStock = (id: string) => {
    onUpdateCatalog(catalog.map(item => {
      if (item.id === id) {
        const nextInStock = !item.inStock;
        return {
          ...item,
          inStock: nextInStock,
          stockCount: nextInStock ? Math.max(item.stockCount ?? 0, 5) : 0
        };
      }
      return item;
    }));
  };


  const handleSaveSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotLabel.trim()) return;
    onCreateSnapshot(snapshotLabel.trim());
    setSnapshotLabel('');
    setBackupSuccessMsg('New save point created!');
    setTimeout(() => setBackupSuccessMsg(''), 3000);
  };

  const handleDownloadBackupJSON = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      company: 'AJW Marine Electrical Services',
      catalog,
      snapshots
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ajwmes-catalog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadBackupJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed.catalog)) {
            onUpdateCatalog(parsed.catalog);
            setBackupSuccessMsg(`Restored ${parsed.catalog.length} items from ${file.name}`);
            setTimeout(() => setBackupSuccessMsg(''), 4000);
          }
        } catch (err) {
          alert('Invalid backup file. Please select a valid AJWMES catalog JSON.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header with Save Point & Backup Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">Materials & Hardware</span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
            Pricing, Stock & Backup Snapshots
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your hardware catalog, update cable & fuse prices, create rollback save points, and download backups.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSnapshotDrawer(!showSnapshotDrawer)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Save Points ({snapshots.length})</span>
          </button>

          <button
            onClick={handleDownloadBackupJSON}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
            title="Download full catalog backup JSON file"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export JSON</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>Import JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleUploadBackupJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {backupSuccessMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{backupSuccessMsg}</span>
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
                Create a point-in-time snapshot before doing major price changes. Roll back anytime.
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
              <p className="text-xs text-slate-500 italic col-span-full">No save points recorded yet. Create one above!</p>
            ) : (
              snapshots.map(snap => (
                <div key={snap.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
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
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 space-y-3 shadow-lg shadow-rose-950/30 animate-in fade-in duration-200">
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
                  Automated notification alerts active (sent to anthonywrather@gmail.com). Immediate supplier reorder recommended.
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
            {zeroStockItems.map(item => (
              <div
                key={item.id}
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

          <p className="text-xs text-slate-300 leading-relaxed">
            The items listed below have dipped below the 5-unit workshop reserve. Keep replacement inventory ready to ensure rapid turnaround times for marine diagnostics and refits:
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {lowStockItems.map(item => (
              <div
                key={item.id}
                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-amber-500/30 text-xs"
              >
                <span className="font-semibold text-white">{item.name}</span>
                <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border bg-amber-950 text-amber-300 border-amber-500/40">
                  {item.stockCount ?? 0} {item.unit} left
                </span>
                {onOpenSupplierReorder && (
                  <button
                    type="button"
                    onClick={() => onOpenSupplierReorder(item)}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                    title="Draft supplier purchase order"
                  >
                    <Truck className="w-2.5 h-2.5" />
                    <span>Reorder</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleStockCountChange(item.id, (item.stockCount ?? 0) + 10)}
                  className="px-2 py-0.5 bg-sky-950 hover:bg-sky-900 text-sky-400 hover:text-sky-300 border border-sky-800/50 rounded text-[11px] font-semibold transition-colors"
                  title="Restock +10 units"
                >
                  +10 Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? cat.id === 'low_stock'
                    ? 'bg-amber-600 text-white shadow-xs font-bold'
                    : 'bg-sky-600 text-white shadow-xs font-bold'
                  : cat.id === 'low_stock'
                  ? 'text-amber-400 hover:text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search parts, specs..."
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
                <th className="p-3.5 text-center">Stock Level (&lt;5 Warning)</th>
                <th className="p-3.5 text-right">Unit Price</th>
                <th className="p-3.5 text-center">Availability</th>
                <th className="p-3.5 pr-5 text-right">Quick Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.map(item => {
                const isLowStock = (item.stockCount ?? 0) < 5;
                const isOutOfStock = (item.stockCount ?? 0) <= 0 || !item.inStock;

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isLowStock ? 'bg-amber-950/15 hover:bg-amber-950/25' : 'hover:bg-slate-900/80'
                    }`}
                  >
                    <td className="p-3.5 pl-5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">{item.name}</span>
                        {isLowStock && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide uppercase border ${
                              isOutOfStock
                                ? 'bg-rose-950/90 text-rose-300 border-rose-500/50 shadow-xs'
                                : 'bg-amber-950/90 text-amber-300 border-amber-500/50 shadow-xs animate-pulse'
                            }`}
                            title={`Stock count is ${item.stockCount ?? 0} units (below 5 units threshold). Proactive restock recommended.`}
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{isOutOfStock ? 'Out of Stock (0)' : `Low Stock: ${item.stockCount ?? 0} left`}</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.specification}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="capitalize text-[11px] text-slate-400 font-medium">
                        {item.category}
                      </span>
                    </td>
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
                            {isLowStock && <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />}
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
                        {isLowStock && (
                          <span className="text-[9px] font-mono text-amber-400/90 font-semibold tracking-wide">
                            &lt; 5 UNITS RESERVE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-white tabular-nums">
                      £{item.unitPrice.toFixed(2)}
                      <span className="text-[10px] text-slate-500 block font-normal">/{item.unit}</span>
                    </td>
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
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="inline-flex items-center gap-1">
                          <span className="text-slate-500 text-[10px]">Price £</span>
                          <input
                            type="number"
                            step="0.10"
                            min="0"
                            value={item.unitPrice}
                            onChange={e => handlePriceChange(item.id, Number(e.target.value) || 0)}
                            className="w-16 bg-slate-950 border border-slate-800 text-xs px-2 py-1 rounded text-white font-mono text-right focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div className="inline-flex items-center gap-1">
                          <span className="text-slate-500 text-[10px]">Stock</span>
                          <input
                            type="number"
                            min="0"
                            value={item.stockCount ?? 0}
                            onChange={e => handleStockCountChange(item.id, Number(e.target.value) || 0)}
                            className={`w-16 bg-slate-950 border text-xs px-2 py-1 rounded font-mono text-right focus:outline-none ${
                              isOutOfStock
                                ? 'border-rose-500/60 text-rose-300 bg-rose-950/20'
                                : isLowStock
                                ? 'border-amber-500/50 text-amber-300'
                                : 'border-slate-800 text-white'
                            }`}
                          />
                        </div>

                        {/* Reorder from Supplier & Quick Test Actions */}
                        <div className="flex items-center gap-1.5 mt-1">
                          {onOpenSupplierReorder && (
                            <button
                              type="button"
                              onClick={() => onOpenSupplierReorder(item)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${
                                isOutOfStock
                                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                                  : 'bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white'
                              }`}
                              title="Draft Reorder from Supplier"
                            >
                              <Truck className="w-2.5 h-2.5" />
                              <span>{isOutOfStock ? 'Reorder Now' : 'Reorder'}</span>
                            </button>
                          )}

                          {!isOutOfStock && (
                            <button
                              type="button"
                              onClick={() => handleStockCountChange(item.id, 0)}
                              className="text-[9px] text-slate-500 hover:text-rose-400 font-mono transition-colors"
                              title="Set stockCount to 0 to test automated email & toast notification alert"
                            >
                              [0 Alert]
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
