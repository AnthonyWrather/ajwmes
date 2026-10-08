import React, { useState, useEffect } from 'react';
import { JobRecord, MaterialLineItem, CatalogItem } from '../../types';
import { Play, Pause, RotateCcw, Plus, Trash2, Check, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';

interface DiagnosticTimerModalProps {
  job: JobRecord;
  catalog: CatalogItem[];
  onSaveJobSheet: (jobId: string, hours: number, materials: MaterialLineItem[]) => void;
  onClose: () => void;
}

export const DiagnosticTimerModal: React.FC<DiagnosticTimerModalProps> = ({
  job,
  catalog,
  onSaveJobSheet,
  onClose
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(Math.round(job.diagnosticHours * 3600));
  const [materials, setMaterials] = useState<MaterialLineItem[]>(job.materialsUsed);
  const [selectedCatalogId, setSelectedCatalogId] = useState(catalog[0]?.id || '');
  const [addQty, setAddQty] = useState(1);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const hoursLogged = Number((seconds / 3600).toFixed(2));
  const laborCost = Number((hoursLogged * job.hourlyRate).toFixed(2));
  const materialsCost = materials.reduce((sum, m) => sum + m.quantity * m.unitPrice, 0);
  const totalCost = Number((laborCost + materialsCost).toFixed(2));

  const formatStopwatch = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleAddMaterial = () => {
    const item = catalog.find(c => c.id === selectedCatalogId);
    if (!item) return;

    const existing = materials.find(m => m.id === item.id);
    if (existing) {
      setMaterials(materials.map(m => m.id === item.id ? { ...m, quantity: m.quantity + addQty } : m));
    } else {
      setMaterials([...materials, {
        id: item.id,
        name: item.name,
        quantity: addQty,
        unit: item.unit,
        unitPrice: item.unitPrice
      }]);
    }
  };

  const handleRemoveMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const handleSave = () => {
    onSaveJobSheet(job.id, hoursLogged, materials);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 max-w-2xl w-full rounded-2xl p-6 text-slate-100 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider">
              Field Diagnostics & Labor Logger
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {job.vesselName} — {job.reference}
            </h3>
            <span className="text-xs text-slate-400">{job.berthLocation}</span>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Rate</span>
            <span className="text-base font-bold text-white font-mono">£{job.hourlyRate}/hr</span>
          </div>
        </div>

        {/* Stopwatch Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="text-xs text-slate-400 block mb-1">On-Vessel Diagnostic Stopwatch</span>
            <div className="text-3xl sm:text-4xl font-mono font-extrabold text-sky-400 tabular-nums">
              {formatStopwatch(seconds)}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              = <strong className="text-white">{hoursLogged} hrs</strong> (@ £25/hr = £{laborCost.toFixed(2)})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30'
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/30'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isRunning ? 'Pause Timer' : 'Start Timer'}</span>
            </button>
            <button
              onClick={() => {
                setIsRunning(false);
                setSeconds(0);
              }}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Materials Added Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">
              Add Materials Used from Catalog
            </label>
            <span className="text-xs text-slate-400">Materials Total: £{materialsCost.toFixed(2)}</span>
          </div>

          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedCatalogId}
                onChange={e => setSelectedCatalogId(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                {catalog.map(item => {
                  const isLow = (item.stockCount ?? 0) < 5;
                  return (
                    <option key={item.id} value={item.id}>
                      {isLow ? `⚠️ [Low Stock: ${item.stockCount ?? 0} left] ` : ''}
                      {item.name} — £{item.unitPrice.toFixed(2)} ({item.unit})
                    </option>
                  );
                })}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={addQty}
                  onChange={e => setAddQty(Number(e.target.value) || 1)}
                  className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-white font-mono text-center focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Warning badge if selected catalog item has low stock */}
            {(() => {
              const selectedItem = catalog.find(c => c.id === selectedCatalogId);
              if (selectedItem && (selectedItem.stockCount ?? 0) < 5) {
                return (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      <strong>Low Workshop Stock:</strong> Only {selectedItem.stockCount ?? 0} {selectedItem.unit}(s) available. Proactively reorder soon.
                    </span>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Table of materials */}
          <div className="max-h-36 overflow-y-auto bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800/80">
            {materials.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">No materials billed yet</div>
            ) : (
              materials.map(m => (
                <div key={m.id} className="p-2.5 flex items-center justify-between text-xs">
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="font-medium text-white truncate block">{m.name}</span>
                    <span className="text-[11px] text-slate-400">{m.quantity} {m.unit} @ £{m.unitPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-white font-bold tabular-nums">
                      £{(m.quantity * m.unitPrice).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleRemoveMaterial(m.id)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Summary & Save */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500 block">Labor</span>
              <span className="font-mono font-bold text-white">£{laborCost.toFixed(2)}</span>
            </div>
            <span>+</span>
            <div>
              <span className="text-slate-500 block">Parts</span>
              <span className="font-mono font-bold text-white">£{materialsCost.toFixed(2)}</span>
            </div>
            <span>=</span>
            <div>
              <span className="text-slate-500 block">Total Due</span>
              <span className="font-mono font-extrabold text-sky-400 text-base">£{totalCost.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl shadow-sm shadow-sky-600/30 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Update Job Sheet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
