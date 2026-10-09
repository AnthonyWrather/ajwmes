import React, { useState, useRef } from 'react';
import { ServiceType, JobRecord, SwitchPanelConfig } from '../../types';
import { 
  Calendar, 
  Wrench, 
  Shield, 
  Check, 
  X, 
  Clock, 
  MapPin, 
  Anchor, 
  Camera, 
  Cloud, 
  Loader2, 
  Trash2 
} from 'lucide-react';
import { uploadSwitchPanelImage, deleteSwitchPanelImage } from '../../lib/storage';

interface BookingQuoteModalProps {
  initialService?: ServiceType;
  initialPanelConfig?: SwitchPanelConfig;
  isOpen: boolean;
  onClose: () => void;
  onSubmitBooking: (jobData: Partial<JobRecord>) => void;
}

export const BookingQuoteModal: React.FC<BookingQuoteModalProps> = ({
  initialService = 'diagnostic',
  initialPanelConfig,
  isOpen,
  onClose,
  onSubmitBooking
}) => {
  const [formMode, setFormMode] = useState<'quote' | 'returning'>('quote');
  const [service, setService] = useState<ServiceType>(initialService);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [vesselName, setVesselName] = useState('');
  const [vesselType, setVesselType] = useState('Sailing Yacht (30-36ft)');
  const [berthLocation, setBerthLocation] = useState('Haslar Marina, Gosport');
  const [notes, setNotes] = useState('');
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // Switch Panel / Electrical Photos State (Firebase Storage)
  const [attachedPhotos, setAttachedPhotos] = useState<Array<{ url: string; name: string; storagePath?: string }>>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setIsUploadingPhoto(true);
    setUploadProgress(0);

    try {
      const uploaded = await uploadSwitchPanelImage(file, {
        jobReference: `INQ-${vesselName || 'VESSEL'}`,
        vesselName: vesselName || 'Inquiry Vessel',
        category: 'existing_panel',
        onProgress: (info) => setUploadProgress(info.progress)
      });

      setAttachedPhotos(prev => [...prev, {
        url: uploaded.url,
        name: uploaded.originalName,
        storagePath: uploaded.storagePath
      }]);
    } catch (err) {
      console.error('Failed to upload photo:', err);
      alert(err instanceof Error ? err.message : 'Photo upload failed');
    } finally {
      setIsUploadingPhoto(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async (index: number) => {
    const photo = attachedPhotos[index];
    if (photo.storagePath) {
      try {
        await deleteSwitchPanelImage(photo.storagePath);
      } catch (e) {
        console.warn('Could not delete from storage:', e);
      }
    }
    setAttachedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reference = `AJW-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newJob: Partial<JobRecord> = {
      reference,
      clientName: clientName.trim() || 'Boat Owner',
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      vesselName: vesselName.trim() || 'Vessel',
      vesselType,
      berthLocation,
      serviceCategory: service,
      status: 'quote_requested',
      hourlyRate: 25,
      diagnosticHours: 0,
      materialsUsed: [],
      notes: notes.trim(),
      panelConfig: initialPanelConfig,
      replicaImages: attachedPhotos.map(p => p.url),
      totalLabor: 25,
      totalMaterials: initialPanelConfig ? initialPanelConfig.estimatedPrice : 0,
      totalEstimated: 25 + (initialPanelConfig ? initialPanelConfig.estimatedPrice : 0),
      depositPaid: false,
      depositAmount: 0,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'client',
          senderName: clientName || 'Boat Owner',
          text: `Inquiry submitted for ${vesselName} at ${berthLocation}: "${notes}"${attachedPhotos.length > 0 ? ` (${attachedPhotos.length} photos attached to Firebase Storage)` : ''}`,
          timestamp: 'Just now'
        }
      ]
    };

    onSubmitBooking(newJob);
    setSubmittedRef(reference);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 max-w-xl w-full rounded-3xl p-6 text-slate-100 shadow-2xl relative animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedRef ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <Check className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white">Inquiry Received &amp; Thread Opened</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              Your job tracking reference is <strong className="text-sky-400 font-mono text-sm">{submittedRef}</strong>. 
              {attachedPhotos.length > 0 && (
                <span className="block text-emerald-400 mt-1">
                  ✓ {attachedPhotos.length} photos uploaded to Firebase Cloud Storage.
                </span>
              )}
              Anthony will inspect your inquiry and reply directly in your client portal thread.
            </p>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/30 transition-all cursor-pointer"
              >
                Go to Discussion Thread
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Modal Title & Tabs */}
            <div>
              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl w-fit mb-3">
                <button
                  type="button"
                  onClick={() => setFormMode('quote')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    formMode === 'quote' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  New Customer Quote
                </button>
                <button
                  type="button"
                  onClick={() => setFormMode('returning')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    formMode === 'returning' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Book a Service (Existing Client)
                </button>
              </div>

              <h3 className="text-lg font-bold text-white">
                {formMode === 'quote' ? 'Request Diagnostic or Refit Quote' : 'Book a Marine Service Aboard'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Transparent flat rate of £25 / hour labor + materials. Serving Gosport &amp; Solent marinas.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Service Selection */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Service Type</label>
                <select
                  value={service}
                  onChange={e => setService(e.target.value as ServiceType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="diagnostic">12V Electrical Fault Finding &amp; Battery Drain Check (£25/hr)</option>
                  <option value="renovation">Day Boat, Bilge Pump or Console Tidy-Up (£25/hr)</option>
                  <option value="custom_panel">Replica/Custom Switch Panel (From £45)</option>
                  <option value="replica_panel">Replica Replacement Switchboard</option>
                  <option value="lithium">Lithium (LiFePO4) Battery Bank Upgrade</option>
                  <option value="solar">Solar Array &amp; MPPT Controller Install</option>
                  <option value="navigation">Marine Navigation &amp; NMEA 2000 Equipment</option>
                </select>
              </div>

              {/* Vessel & Location Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Boat Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Windbird III"
                    value={vesselName}
                    onChange={e => setVesselName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Marina / Berth Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Haslar Marina, Pontoon C"
                    value={berthLocation}
                    onChange={e => setBerthLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Contact Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Mercer"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="dave@example.co.uk"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Mobile / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    placeholder="07700 900..."
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Photo Upload to Firebase Storage */}
              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-sky-400" />
                    <span>Attach Photos (Switch Panel or Wiring Fault)</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <Cloud className="w-3 h-3" />
                    <span>Firebase Storage</span>
                  </span>
                </div>

                {/* Attached photos list */}
                {attachedPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {attachedPhotos.map((photo, i) => (
                      <div key={i} className="relative group w-16 h-12 rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                        <img src={photo.url} alt="Attached" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(i)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload bar */}
                {isUploadingPhoto ? (
                  <div className="text-[11px] text-sky-300 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                    <span>Uploading to Firebase Cloud Storage ({uploadProgress}%)...</span>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 text-[11px] text-sky-400 hover:text-sky-300 cursor-pointer pt-0.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>+ Add image file (JPG, PNG, WEBP)</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      disabled={isUploadingPhoto}
                      onChange={handleUploadPhoto}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Problem / Scope notes */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Fault Symptoms or Project Scope</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe what is happening: e.g. batteries losing voltage overnight, starter solenoid clicking, intermittent depth sounder, or need solar arch wired."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>£25 / hr · No hidden callout surcharges</span>
                </div>
                <button
                  type="submit"
                  disabled={isUploadingPhoto}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md shadow-sky-600/30 transition-all cursor-pointer"
                >
                  Submit &amp; Open Chat Thread
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
