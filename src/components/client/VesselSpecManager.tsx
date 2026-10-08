import React, { useState } from 'react';
import { VesselSpec, ElectricalLogEntry } from '../../types';
import { generateVesselPdf } from '../../utils/generateVesselPdf';
import { Anchor, Battery, Sun, Zap, Shield, Wrench, Plus, Check, Edit3, Save, Printer, Calendar, FileText, ChevronDown, ChevronUp, AlertCircle, Download, FileDown } from 'lucide-react';

interface VesselSpecManagerProps {
  vesselSpec: VesselSpec;
  onUpdateVesselSpec: (updated: VesselSpec) => void;
}

export const VesselSpecManager: React.FC<VesselSpecManagerProps> = ({
  vesselSpec,
  onUpdateVesselSpec
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'overview' | 'dc_power' | 'ac_safety' | 'nav_electronics' | 'history'>('overview');
  const [formData, setFormData] = useState<VesselSpec>(vesselSpec);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Log Entry Modal State
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [newLogTitle, setNewLogTitle] = useState('');
  const [newLogDate, setNewLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [newLogContractor, setNewLogContractor] = useState('AJW Marine Electrical Services');
  const [newLogCategory, setNewLogCategory] = useState<ElectricalLogEntry['category']>('battery_upgrade');
  const [newLogDesc, setNewLogDesc] = useState('');
  const [newLogParts, setNewLogParts] = useState('');

  const handleFieldChange = (field: keyof VesselSpec, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateVesselSpec(formData);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddLogEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogTitle.trim()) return;

    const newEntry: ElectricalLogEntry = {
      id: `log-${Date.now()}`,
      date: newLogDate,
      title: newLogTitle.trim(),
      contractor: newLogContractor.trim() || 'AJW Marine Electrical Services',
      category: newLogCategory,
      description: newLogDesc.trim(),
      partsReplaced: newLogParts ? newLogParts.split(',').map(s => s.trim()) : [],
      jobReference: `AJW-2026-${Math.floor(100 + Math.random() * 900)}`
    };

    const updated = {
      ...formData,
      historyLog: [newEntry, ...formData.historyLog]
    };

    setFormData(updated);
    onUpdateVesselSpec(updated);
    setShowAddLogModal(false);
    setNewLogTitle('');
    setNewLogDesc('');
    setNewLogParts('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePrintSpec = () => {
    window.print();
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      generateVesselPdf(formData);
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('Could not generate PDF. Please try again or use the print function.');
    } finally {
      setTimeout(() => setIsGeneratingPdf(false), 600);
    }
  };

  return (
    <div className="w-full space-y-6 text-slate-100">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 mb-1">
            <Anchor className="w-4 h-4" />
            <span>Vessel Technical &amp; Electrical Dossier</span>
            <span aria-hidden="true">·</span>
            <span>Audited &amp; Owner Managed</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            <span>{formData.vesselName}</span>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-sky-950 border border-sky-500/30 text-sky-300">
              {formData.systemVoltage} DC
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {formData.makeModel} ({formData.year}) · {formData.homeMarina} ({formData.berthPontoon})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-semibold shadow-sm transition-all"
                title="Download formatted marine survey PDF dossier"
              >
                <FileDown className="w-3.5 h-3.5 text-sky-400" />
                <span>{isGeneratingPdf ? 'Creating PDF...' : 'Download PDF Spec'}</span>
              </button>

              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/30 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Vessel Specs</span>
              </button>

              <button
                onClick={handlePrintSpec}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                title="Print or export PDF spec sheet"
              >
                <Printer className="w-3.5 h-3.5 text-sky-400" />
                <span>Print</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormData(vesselSpec);
                  setIsEditing(false);
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAll}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save All Changes</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Vessel electrical configuration updated and saved to your portal!</span>
        </div>
      )}

      {/* Category Pills Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveCategory('overview')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
            activeCategory === 'overview' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Anchor className="w-3.5 h-3.5" />
          <span>Vessel Details</span>
        </button>
        <button
          onClick={() => setActiveCategory('dc_power')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
            activeCategory === 'dc_power' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Battery className="w-3.5 h-3.5" />
          <span>DC Batteries &amp; Charging</span>
        </button>
        <button
          onClick={() => setActiveCategory('ac_safety')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
            activeCategory === 'ac_safety' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>AC Shore &amp; Galvanic Safety</span>
        </button>
        <button
          onClick={() => setActiveCategory('nav_electronics')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
            activeCategory === 'nav_electronics' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Navigation &amp; Panels</span>
        </button>
        <button
          onClick={() => setActiveCategory('history')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
            activeCategory === 'history' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Electrical History Log ({formData.historyLog.length})</span>
        </button>
      </div>

      {/* Main Tab Views */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        {/* Category 1: Overview & Vessel Identity */}
        {activeCategory === 'overview' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Vessel Identity &amp; Location</h3>
                <p className="text-xs text-slate-400">Basic hull identification and marina mooring location.</p>
              </div>
              <span className="text-xs font-mono text-slate-400">Audited Oct 2026</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Vessel Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.vesselName}
                    onChange={e => handleFieldChange('vesselName', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-semibold"
                  />
                ) : (
                  <p className="font-bold text-white text-sm bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {formData.vesselName}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Make &amp; Model</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.makeModel}
                    onChange={e => handleFieldChange('makeModel', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-semibold"
                  />
                ) : (
                  <p className="font-bold text-white text-sm bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {formData.makeModel}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Year of Build</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.year}
                    onChange={e => handleFieldChange('year', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                ) : (
                  <p className="font-bold text-white text-sm bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 font-mono">
                    {formData.year}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">HIN / Hull Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.hinNumber}
                    onChange={e => handleFieldChange('hinNumber', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                ) : (
                  <p className="font-semibold text-white bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 font-mono">
                    {formData.hinNumber || 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Sail / Reg Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.sailNumber}
                    onChange={e => handleFieldChange('sailNumber', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                ) : (
                  <p className="font-semibold text-white bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 font-mono">
                    {formData.sailNumber || 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Primary DC Voltage</label>
                {isEditing ? (
                  <select
                    value={formData.systemVoltage}
                    onChange={e => handleFieldChange('systemVoltage', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="12V">12V DC Standard</option>
                    <option value="24V">24V DC Commercial/Large</option>
                    <option value="12V/24V Dual">12V/24V Dual Voltage</option>
                  </select>
                ) : (
                  <p className="font-bold text-sky-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 font-mono">
                    {formData.systemVoltage} DC
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Home Marina &amp; Port</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.homeMarina}
                    onChange={e => handleFieldChange('homeMarina', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                ) : (
                  <p className="font-medium text-white bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {formData.homeMarina}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Berth / Pontoon</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.berthPontoon}
                    onChange={e => handleFieldChange('berthPontoon', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                ) : (
                  <p className="font-medium text-white bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {formData.berthPontoon}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Last Electrical Inspection</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.lastInspectionDate}
                    onChange={e => handleFieldChange('lastInspectionDate', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                ) : (
                  <p className="font-medium text-emerald-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 font-mono">
                    {formData.lastInspectionDate}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1 text-xs">General Vessel Electrical Notes</label>
              {isEditing ? (
                <textarea
                  rows={2}
                  value={formData.generalNotes}
                  onChange={e => handleFieldChange('generalNotes', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              ) : (
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  {formData.generalNotes}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Category 2: DC Batteries & Charging */}
        {activeCategory === 'dc_power' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Battery className="w-4 h-4 text-sky-400" />
                  <span>DC Battery Banks &amp; Smart Charging System</span>
                </h3>
                <p className="text-xs text-slate-400">House bank chemistry, starter batteries, alternator protection, and solar array.</p>
              </div>
              <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-500/30">
                {formData.houseCapacityAh}Ah Domestic Capacity
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">House Battery Chemistry</label>
                {isEditing ? (
                  <select
                    value={formData.houseBatteryType}
                    onChange={e => handleFieldChange('houseBatteryType', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-medium"
                  >
                    <option value="LiFePO4 Lithium">LiFePO4 Lithium (Lithium Iron Phosphate)</option>
                    <option value="AGM Deep Cycle">AGM Deep Cycle (Absorbent Glass Mat)</option>
                    <option value="Gel">Gel Deep Cycle</option>
                    <option value="Flooded Lead-Acid">Flooded Lead-Acid (Standard Marine)</option>
                  </select>
                ) : (
                  <p className="font-bold text-sky-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {formData.houseBatteryType}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Domestic Capacity (Amp-Hours)</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.houseCapacityAh}
                    onChange={e => handleFieldChange('houseCapacityAh', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                ) : (
                  <p className="font-bold text-white text-sm bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 font-mono">
                    {formData.houseCapacityAh} Ah @ {formData.systemVoltage}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">House Bank Installation Date</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.houseBankInstalled}
                    onChange={e => handleFieldChange('houseBankInstalled', e.target.value)}
                    placeholder="e.g. October 2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                ) : (
                  <p className="font-medium text-white bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {formData.houseBankInstalled}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Engine Starter Battery</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.starterBatteryType}
                    onChange={e => handleFieldChange('starterBatteryType', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                ) : (
                  <p className="font-medium text-white bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {formData.starterBatteryType}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Starter Capacity &amp; CCA</label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Ah"
                      value={formData.starterCapacityAh}
                      onChange={e => handleFieldChange('starterCapacityAh', Number(e.target.value))}
                      className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                    <input
                      type="number"
                      placeholder="CCA"
                      value={formData.starterCca}
                      onChange={e => handleFieldChange('starterCca', Number(e.target.value))}
                      className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                ) : (
                  <p className="font-medium text-white bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 font-mono">
                    {formData.starterCapacityAh} Ah · {formData.starterCca} CCA
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Battery Monitor / Shunt</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.batteryMonitor}
                    onChange={e => handleFieldChange('batteryMonitor', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                ) : (
                  <p className="font-semibold text-sky-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {formData.batteryMonitor}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Alternator Output &amp; Diodes</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.alternatorRating}
                    onChange={e => handleFieldChange('alternatorRating', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                ) : (
                  <p className="font-medium text-white bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {formData.alternatorRating}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">DC-DC Charger (Lithium Protection)</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.dcDcCharger}
                    onChange={e => handleFieldChange('dcDcCharger', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                ) : (
                  <p className="font-semibold text-emerald-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {formData.dcDcCharger}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Solar Array Output</label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.solarWatts}
                      onChange={e => handleFieldChange('solarWatts', Number(e.target.value))}
                      className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                    <input
                      type="text"
                      value={formData.solarType}
                      onChange={e => handleFieldChange('solarType', e.target.value)}
                      placeholder="e.g. Stern arch rigid panels"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                ) : (
                  <p className="font-medium text-amber-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {formData.solarWatts}W Total · {formData.solarType}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Solar MPPT Charge Controller</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.solarController}
                    onChange={e => handleFieldChange('solarController', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                ) : (
                  <p className="font-medium text-white bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {formData.solarController}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Category 3: AC Shore Power & Galvanic Safety */}
        {activeCategory === 'ac_safety' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-400" />
                  <span>230V AC Shore Power &amp; Cathodic Galvanic Isolation</span>
                </h3>
                <p className="text-xs text-slate-400">Marina shore lead, RCD residual current device, galvanic isolator, and pure sine inverter.</p>
              </div>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                formData.hasGalvanicIsolator
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-950 text-rose-300 border-rose-500/30'
              }`}>
                {formData.hasGalvanicIsolator ? 'Galvanic Protected' : 'Warning: No Isolator'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Shore Power Connection &amp; RCD</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.shorePowerRating}
                    onChange={e => handleFieldChange('shorePowerRating', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                ) : (
                  <p className="font-medium text-white bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {formData.shorePowerRating}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Galvanic Isolator Status (Electrolysis Prevention)</label>
                {isEditing ? (
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasGalvanicIsolator}
                      onChange={e => handleFieldChange('hasGalvanicIsolator', e.target.checked)}
                      className="rounded text-sky-600 focus:ring-0"
                    />
                    <span className="text-white font-medium">Galvanic Isolator (Zinc Saver) Installed &amp; Tested</span>
                  </label>
                ) : (
                  <p className="font-semibold text-emerald-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>Sterling 16A Zinc Saver Active (Prevents marina slip anode corrosion)</span>
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-400 font-semibold block mb-1">Inverter / Charger Model</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.inverterModel}
                    onChange={e => handleFieldChange('inverterModel', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                ) : (
                  <p className="font-medium text-white bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {formData.inverterModel}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Category 4: Navigation, Helm & Bilge Systems */}
        {activeCategory === 'nav_electronics' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-sky-400" />
                  <span>Helm Electronics, Navigation Backbone &amp; Safety Circuits</span>
                </h3>
                <p className="text-xs text-slate-400">NMEA 2000 networks, MFD chartplotter, VHF/AIS, primary bilge pump wiring, and replica/custom switchboard.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Navigation Instrument Backbone</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.navigationNetwork}
                    onChange={e => handleFieldChange('navigationNetwork', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                ) : (
                  <p className="font-medium text-white bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {formData.navigationNetwork}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Multifunction Chartplotter (MFD)</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.chartplotterModel}
                    onChange={e => handleFieldChange('chartplotterModel', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                ) : (
                  <p className="font-medium text-white bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {formData.chartplotterModel}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">VHF Radio &amp; AIS Transponder / MMSI</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.vhfAisDetails}
                    onChange={e => handleFieldChange('vhfAisDetails', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                ) : (
                  <p className="font-medium text-white bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {formData.vhfAisDetails}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Automatic Bilge Pump Configuration</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.bilgePumpConfig}
                    onChange={e => handleFieldChange('bilgePumpConfig', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                ) : (
                  <p className="font-medium text-emerald-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {formData.bilgePumpConfig}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-400 font-semibold block mb-1">Main DC Switchboard &amp; Breakers</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.switchPanelModel}
                    onChange={e => handleFieldChange('switchPanelModel', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                ) : (
                  <p className="font-medium text-sky-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {formData.switchPanelModel}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Category 5: Chronological Electrical History Log */}
        {activeCategory === 'history' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-sky-400" />
                  <span>Vessel Electrical History &amp; Upgrade Timeline</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Comprehensive audit trail of diagnostics, battery conversions, solar installs, and panel refits.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-semibold shadow-sm transition-all"
                  title="Download formatted history log PDF"
                >
                  <FileDown className="w-3.5 h-3.5 text-sky-400" />
                  <span>Download Audit PDF</span>
                </button>

                <button
                  onClick={() => setShowAddLogModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Electrical Upgrade</span>
                </button>
              </div>
            </div>

            {/* Timeline Entries */}
            <div className="space-y-4">
              {formData.historyLog.map((entry, index) => (
                <div
                  key={entry.id}
                  className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-5 space-y-3 relative group hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sky-400 font-bold">{entry.date}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-300 font-semibold">{entry.contractor}</span>
                      {entry.jobReference && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-slate-400 text-[10px]">{entry.jobReference}</span>
                        </>
                      )}
                    </div>

                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 self-start sm:self-auto capitalize">
                      {entry.category.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug">
                    {entry.title}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {entry.description}
                  </p>

                  {entry.partsReplaced && entry.partsReplaced.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-slate-500 font-medium">Components &amp; Hardware:</span>
                      {entry.partsReplaced.map((part, pIdx) => (
                        <span key={pIdx} className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
                          {part}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add New History Log Entry Modal */}
      {showAddLogModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-3xl p-6 text-slate-100 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400" />
                <span>Add Vessel Electrical History Entry</span>
              </h3>
              <button
                onClick={() => setShowAddLogModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLogEntry} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newLogDate}
                    onChange={e => setNewLogDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Work Category</label>
                  <select
                    value={newLogCategory}
                    onChange={e => setNewLogCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="battery_upgrade">Battery Bank Upgrade</option>
                    <option value="solar">Solar &amp; Charging Array</option>
                    <option value="switch_panel">Switch Panel Refit</option>
                    <option value="navigation">Navigation &amp; NMEA</option>
                    <option value="diagnostic">Diagnostic &amp; Fault Repair</option>
                    <option value="inspection">Safety Audit &amp; Anode Check</option>
                    <option value="maintenance">Routine Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Upgrade / Work Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Installed Victron SmartShunt on house bank"
                  value={newLogTitle}
                  onChange={e => setNewLogTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Electrician / Contractor</label>
                <input
                  type="text"
                  value={newLogContractor}
                  onChange={e => setNewLogContractor(e.target.value)}
                  placeholder="AJW Marine Electrical Services"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Technical Work Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Details of the installation, wiring gauges used, fuses fitted, or test results..."
                  value={newLogDesc}
                  onChange={e => setNewLogDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Components Fitted (comma separated)</label>
                <input
                  type="text"
                  placeholder="Victron SmartShunt, 35mm² cable, 150A ANL fuse"
                  value={newLogParts}
                  onChange={e => setNewLogParts(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl shadow-sm transition-all"
                >
                  Save Entry to Vessel History
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
