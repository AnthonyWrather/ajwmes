import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Cloud, 
  Trash2, 
  Eye, 
  Loader2, 
  ShieldCheck, 
  Ship,
  Compass,
  Calculator,
  Clock,
  CheckCircle2,
  ChevronRight,
  Layers,
  Wrench
} from 'lucide-react';
import { 
  uploadSwitchPanelImage, 
  deleteSwitchPanelImage, 
  UploadedPanelImage,
  formatFileSize 
} from '../../lib/storage';
import { ImageLightboxModal } from '../common/ImageLightboxModal';
import { calculateReplicaPanelQuote } from '../../utils/electricalCalculations';

export interface PhotoEntry {
  id: string;
  url: string;
  name: string;
  formattedSize?: string;
  storagePath?: string;
  isCloud: boolean;
}

export interface ReplicaQuoteSubmitData {
  boatMake: string;
  boatModel: string;
  dimensions: string;
  switchCount: number;
  materialPreference: string;
  imageUrls: string[];
  notes: string;
  estimatedLabor?: number;
  estimatedMaterials?: number;
  estimatedTotal?: number;
}

export interface ReplicaPanelUploaderProps {
  onSubmitReplicaQuote: (data: ReplicaQuoteSubmitData) => void;
  onNavigateToPortal?: () => void;
}

export interface ClassicPreset {
  id: string;
  label: string;
  make: string;
  model: string;
  dimensions: string;
  switchCount: number;
  materialPref: string;
  notes: string;
}

export const CLASSIC_YACHT_PRESETS: ClassicPreset[] = [
  {
    id: 'westerly-konsort',
    label: 'Westerly Konsort 29',
    make: 'Westerly',
    model: 'Konsort 29',
    dimensions: '195mm x 140mm',
    switchCount: 8,
    materialPref: 'acrylic_black',
    notes: 'Classic 1980s Westerly Konsort drop-in replacement with modern rocker switches.'
  },
  {
    id: 'sadler-32',
    label: 'Sadler 32',
    make: 'Sadler',
    model: '32 (1983)',
    dimensions: '220mm x 150mm',
    switchCount: 10,
    materialPref: 'wood_teak',
    notes: 'Solid teak marine switchboard replica to match interior teak companionway joinery.'
  },
  {
    id: 'moody-33',
    label: 'Moody 33',
    make: 'Moody',
    model: '33 Mk II',
    dimensions: '240mm x 160mm',
    switchCount: 12,
    materialPref: 'acrylic_black',
    notes: 'Drop-in replacement for original Moody electrical panel with modern push-to-reset breakers.'
  },
  {
    id: 'bavaria-37',
    label: 'Bavaria 37',
    make: 'Bavaria',
    model: '37 Cruiser',
    dimensions: '260mm x 180mm',
    switchCount: 16,
    materialPref: 'acrylic_white',
    notes: 'White gloss marine acrylic replacement panel with engraved circuit nomenclature.'
  }
];

export const ReplicaPanelUploader: React.FC<ReplicaPanelUploaderProps> = ({ 
  onSubmitReplicaQuote,
  onNavigateToPortal
}) => {
  const [boatMake, setBoatMake] = useState('Westerly');
  const [boatModel, setBoatModel] = useState('Konsort 29');
  const [dimensions, setDimensions] = useState('195mm x 140mm');
  const [switchCount, setSwitchCount] = useState(8);
  const [materialPref, setMaterialPref] = useState('acrylic_black');
  const [notes, setNotes] = useState('Current plastic panel has cracked screw lugs and faded rocker labels.');
  
  // Photo management state with initial sample asset
  const [photos, setPhotos] = useState<PhotoEntry[]>([
    {
      id: 'photo-sample-1',
      url: '/assets/images/marine_switch_panel_laser_1791400808406.jpg',
      name: 'westerly_konsort_sample_plate.jpg',
      formattedSize: '1.2 MB',
      isCloud: false
    }
  ]);

  // Upload progression state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Lightbox inspector state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');
  const [lightboxStoragePath, setLightboxStoragePath] = useState<string | undefined>(undefined);
  const [lightboxSize, setLightboxSize] = useState<string | undefined>(undefined);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Pure Calculation
  const estimatedQuote = calculateReplicaPanelQuote({
    switchCount,
    materialPreference: materialPref
  });

  const handleApplyPreset = (preset: ClassicPreset) => {
    setBoatMake(preset.make);
    setBoatModel(preset.model);
    setDimensions(preset.dimensions);
    setSwitchCount(preset.switchCount);
    setMaterialPref(preset.materialPref);
    setNotes(preset.notes);
  };

  // Handle file uploads directly to Firebase Cloud Storage (with local base64 fallback)
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    const fileList = Array.from(files);

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadStatus(`Processing ${file.name} (${i + 1}/${fileList.length})...`);

        const uploaded: UploadedPanelImage = await uploadSwitchPanelImage(file, {
          jobReference: `REP-${sanitizeForJob(boatMake)}-${sanitizeForJob(boatModel)}`,
          vesselName: `${boatMake} ${boatModel}`,
          category: 'existing_panel',
          onProgress: (info) => {
            const overall = Math.round(((i + info.progress / 100) / fileList.length) * 100);
            setUploadProgress(overall);
          }
        });

        const newEntry: PhotoEntry = {
          id: uploaded.id,
          url: uploaded.url,
          name: uploaded.originalName,
          formattedSize: uploaded.formattedSize,
          storagePath: uploaded.storagePath,
          isCloud: !uploaded.storagePath.startsWith('local_')
        };

        setPhotos(prev => [...prev, newEntry]);
      }

      setUploadStatus('Upload complete! Saved and ready for quote submission.');
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadStatus('');
      }, 800);
    } catch (err) {
      console.error('Firebase Storage upload error:', err);
      const message = err instanceof Error ? err.message : 'Upload failed. Please check network connectivity.';
      setUploadError(message);
      setIsUploading(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const sanitizeForJob = (str: string) => {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
  };

  // Remove photo and clean up from Firebase Storage if applicable
  const handleRemovePhoto = async (photo: PhotoEntry) => {
    if (photo.isCloud && photo.storagePath) {
      try {
        await deleteSwitchPanelImage(photo.storagePath);
      } catch (e) {
        console.warn('Could not delete from storage:', e);
      }
    }
    setPhotos(prev => prev.filter(p => p.id !== photo.id));
  };

  const handleOpenLightbox = (photo: PhotoEntry) => {
    setLightboxUrl(photo.url);
    setLightboxTitle(photo.name);
    setLightboxStoragePath(photo.storagePath);
    setLightboxSize(photo.formattedSize);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReplicaQuote({
      boatMake,
      boatModel,
      dimensions,
      switchCount,
      materialPreference: materialPref,
      imageUrls: photos.map(p => p.url),
      notes,
      estimatedLabor: estimatedQuote.digitizingLabor,
      estimatedMaterials: estimatedQuote.totalMaterials,
      estimatedTotal: estimatedQuote.totalEstimated
    });
    setIsSubmitted(true);
  };

  return (
    <div data-testid="replica-card" className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Lightbox Modal */}
      <ImageLightboxModal
        isOpen={!!lightboxUrl}
        imageUrl={lightboxUrl}
        imageTitle={lightboxTitle}
        storagePath={lightboxStoragePath}
        fileSize={lightboxSize}
        onClose={() => setLightboxUrl(null)}
      />

      <div className="border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Replica &amp; Replacement Switchboards</span>
            <span aria-hidden="true">·</span>
            <span data-testid="replica-cloud-badge" className="flex items-center gap-1 text-emerald-400">
              <Cloud className="w-3.5 h-3.5" />
              <span>Firebase Cloud Storage Enabled</span>
            </span>
          </div>

          <span data-testid="replica-turnaround-badge" className="text-[11px] font-mono text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>3–5 Days Turnaround</span>
          </span>
        </div>
        <h3 className="text-xl font-bold text-white">
          Replace Broken or Faded 1970s–1990s Panels
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          We specialize in exact drop-in replacements for Westerly, Sadler, Moody, Rival, and classic yachts. Upload photos of your old panel with approximate measurements and we will match the cutout and mounting holes.
        </p>

        {/* Quick Boat Preset Pills */}
        <div className="pt-3">
          <span className="text-[10px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
            Popular Solent Classic Yacht Templates:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {CLASSIC_YACHT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                data-testid={`replica-preset-${preset.id}`}
                onClick={() => handleApplyPreset(preset)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                  boatMake === preset.make && boatModel === preset.model
                    ? 'bg-sky-950 text-sky-300 border-sky-500/60 font-semibold shadow-xs shadow-sky-500/20'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <Compass className="w-3 h-3 text-sky-400" />
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {isSubmitted ? (
        <div data-testid="replica-success-card" className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <Check className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">Replica Quote Request Submitted</h4>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Your switchboard measurements for <strong className="text-white">{boatMake} {boatModel}</strong> and <strong className="text-emerald-400">{photos.length} uploaded panel photos</strong> are saved permanently in Firebase Cloud Storage.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 max-w-sm mx-auto text-xs text-left space-y-1.5 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Dimensions:</span>
              <span className="text-white font-medium">{dimensions}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Switch Apertures:</span>
              <span className="text-white font-medium">{switchCount} gangs</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Estimated Total:</span>
              <span className="text-sky-400 font-bold">£{estimatedQuote.totalEstimated.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {onNavigateToPortal && (
              <button
                type="button"
                data-testid="replica-view-portal-btn"
                onClick={onNavigateToPortal}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>View Quote in Vessel Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              data-testid="replica-new-inquiry-btn"
              onClick={() => setIsSubmitted(false)}
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            >
              Submit Another Inquiry
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Vessel Make</label>
              <input
                data-testid="replica-make-input"
                type="text"
                required
                value={boatMake}
                onChange={e => setBoatMake(e.target.value)}
                placeholder="e.g. Westerly, Sadler, Moody, Bavaria"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Model &amp; Year</label>
              <input
                data-testid="replica-model-input"
                type="text"
                required
                value={boatModel}
                onChange={e => setBoatModel(e.target.value)}
                placeholder="e.g. Centaur 26 (1978), Konsort 29"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Dimensions (approx.)</label>
              <input
                data-testid="replica-dimensions-input"
                type="text"
                value={dimensions}
                onChange={e => setDimensions(e.target.value)}
                placeholder="e.g. 200mm W x 140mm H"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Switch Quantity</label>
              <select
                data-testid="replica-switch-count-select"
                value={switchCount}
                onChange={e => setSwitchCount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                {[4, 6, 8, 10, 12, 16].map(n => (
                  <option key={n} value={n}>{n} Switches</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Replacement Material</label>
              <select
                data-testid="replica-material-select"
                value={materialPref}
                onChange={e => setMaterialPref(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="acrylic_black">Matte Black Marine Acrylic</option>
                <option value="acrylic_white">White Gloss Marine Acrylic</option>
                <option value="wood_teak">Solid Marine Teak (+£25)</option>
                <option value="wood_birch">Marine Birch Plywood (+£15)</option>
              </select>
            </div>
          </div>

          {/* Live Dynamic Estimation Card */}
          <div data-testid="replica-estimate-card" className="bg-slate-950/80 border border-sky-500/30 rounded-xl p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5 font-bold text-white text-xs">
                <Calculator className="w-4 h-4 text-sky-400" />
                <span>Instant Gosport Workshop Replica Estimate</span>
              </span>
              <div className="flex items-center gap-2">
                {estimatedQuote.materialSurcharge > 0 && (
                  <span data-testid="replica-surcharge-badge" className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40">
                    +£{estimatedQuote.materialSurcharge.toFixed(2)} {materialPref === 'wood_teak' ? 'Teak' : 'Birch'} Surcharge
                  </span>
                )}
                <span className="text-[11px] text-slate-400">Total:</span>
                <span data-testid="replica-estimated-total" className="text-base font-extrabold text-sky-400 font-mono">
                  £{estimatedQuote.totalEstimated.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono text-slate-300">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">CAD Digitizing:</span>
                <span data-testid="replica-labor-cost" className="font-bold text-white">£{estimatedQuote.digitizingLabor.toFixed(2)}</span>
                <span className="text-[9px] text-slate-500 block">1hr @ £25/hr</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Laser Cut Plate:</span>
                <span className="font-bold text-white">£{estimatedQuote.laserCuttingBase.toFixed(2)}</span>
                <span className="text-[9px] text-slate-500 block">Base setup</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Hardware ({switchCount} Sw.):</span>
                <span className="font-bold text-white">£{estimatedQuote.switchesHardware.toFixed(2)}</span>
                <span className="text-[9px] text-slate-500 block">£8.00 / switch</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Materials Subtotal:</span>
                <span data-testid="replica-materials-cost" className="font-bold text-emerald-400">£{estimatedQuote.totalMaterials.toFixed(2)}</span>
                <span className="text-[9px] text-slate-500 block">Hardware &amp; plate</span>
              </div>
            </div>
          </div>

          {/* Firebase Storage Photo Upload Box */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-slate-300 font-semibold block">
                  Photos of Existing Panel &amp; Mounting Cavity
                </label>
                <p className="text-[11px] text-slate-400">
                  Uploaded files are stored persistently in Firebase Cloud Storage and survive server deployments.
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                <Cloud className="w-3.5 h-3.5" />
                <span>{photos.filter(p => p.isCloud).length} Cloud Assets</span>
              </span>
            </div>

            {/* Error Message if upload failed */}
            {uploadError && (
              <div className="bg-rose-950/50 border border-rose-500/50 rounded-xl p-3 text-rose-200 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{uploadError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadError(null)}
                  className="text-xs text-rose-400 hover:underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Upload Progress Bar */}
            {isUploading && (
              <div data-testid="replica-upload-progress" className="bg-slate-950 border border-sky-500/40 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-sky-400 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{uploadStatus || 'Uploading to Firebase Storage...'}</span>
                  </span>
                  <span className="font-mono text-white font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-sky-500 to-emerald-400 h-2 rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Photos Grid */}
            <div data-testid="replica-photos-grid" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {photos.map((photo, index) => (
                <div 
                  key={photo.id}
                  data-testid={`replica-photo-card-${index}`}
                  className="relative aspect-4/3 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 group shadow-md"
                >
                  <img 
                    src={photo.url} 
                    alt={photo.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                  />

                  {/* Top Cloud Badge */}
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                    {photo.isCloud ? (
                      <span className="text-[9px] font-mono bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded flex items-center gap-0.5 backdrop-blur-xs">
                        <Cloud className="w-2.5 h-2.5" />
                        <span>Cloud</span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono bg-slate-900/90 text-slate-300 border border-slate-700/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
                        Reference
                      </span>
                    )}
                  </div>

                  {/* Quick Action Overlay on Hover / Active */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      data-testid={`replica-inspect-photo-${index}`}
                      onClick={() => handleOpenLightbox(photo)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
                      title="Inspect full resolution"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      data-testid={`replica-remove-photo-${index}`}
                      onClick={() => handleRemovePhoto(photo)}
                      className="p-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg transition-colors cursor-pointer"
                      title="Delete photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="absolute bottom-1.5 left-2 right-2 text-[10px] bg-black/75 px-1.5 py-0.5 rounded text-white truncate backdrop-blur-xs">
                    {photo.name}
                  </span>
                </div>
              ))}

              {/* Drag and Drop / Add Photo Card */}
              <label 
                data-testid="replica-upload-dropzone"
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  handleFileUpload(e.dataTransfer.files);
                }}
                className={`aspect-4/3 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-sky-400 bg-sky-950/40 text-white'
                    : 'border-slate-800 hover:border-sky-500 text-slate-400 hover:text-white bg-slate-950/60'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-sky-950/80 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-1">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-slate-200">
                  {isUploading ? 'Uploading...' : 'Upload Photos'}
                </span>
                <span className="text-[9px] text-slate-400 text-center px-1">
                  Drag &amp; drop or browse
                </span>
                <span className="text-[8px] text-emerald-400 font-mono mt-0.5">
                  Firebase Cloud Storage
                </span>
                <input
                  ref={fileInputRef}
                  data-testid="replica-file-upload-input"
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={isUploading}
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2 pt-1">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Tip: Holding a tape measure across the panel helps us verify mounting hole spacing exactly.</span>
              </span>
              <span className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Max 25MB · High resolution supported</span>
              </span>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Specific Notes / Circuit Changes</label>
            <textarea
              data-testid="replica-notes-input"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Would like to add a 12V USB charger and change the old fuses to modern push-to-reset circuit breakers."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Estimated: <strong className="text-sky-400 font-mono">£{estimatedQuote.totalEstimated.toFixed(2)}</strong> ({switchCount} circuits)
            </span>
            <button
              type="submit"
              data-testid="replica-submit-btn"
              disabled={isUploading}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm shadow-sky-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Send Replica Panel Inquiry ({photos.length} Photos)</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
