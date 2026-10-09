import React, { useState } from 'react';
import { Camera, Upload, Check, AlertCircle, Sparkles } from 'lucide-react';

interface ReplicaPanelUploaderProps {
  onSubmitReplicaQuote: (data: {
    boatMake: string;
    boatModel: string;
    dimensions: string;
    switchCount: number;
    materialPreference: string;
    imageUrls: string[];
    notes: string;
  }) => void;
}

export const ReplicaPanelUploader: React.FC<ReplicaPanelUploaderProps> = ({ onSubmitReplicaQuote }) => {
  const [boatMake, setBoatMake] = useState('Westerly');
  const [boatModel, setBoatModel] = useState('Konsort 29');
  const [dimensions, setDimensions] = useState('195mm x 140mm');
  const [switchCount, setSwitchCount] = useState(8);
  const [materialPref, setMaterialPref] = useState('acrylic_black');
  const [notes, setNotes] = useState('Current plastic panel has cracked screw lugs and faded rocker labels.');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([
    '/assets/images/marine_switch_panel_laser_1791400808406.jpg'
  ]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      setUploadedPhotos(prev => [...prev, objectUrl]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReplicaQuote({
      boatMake,
      boatModel,
      dimensions,
      switchCount,
      materialPreference: materialPref,
      imageUrls: uploadedPhotos,
      notes
    });
    setIsSubmitted(true);
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Replica & Replacement Switchboards</span>
        </div>
        <h3 className="text-xl font-bold text-white">
          Replace Broken or Faded 1970s–1990s Panels
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          We specialize in exact drop-in replacements for Westerly, Sadler, Moody, Rival, and classic yachts. Upload photos of your old panel with approximate measurements and we will match the cutout and mounting holes.
        </p>
      </div>

      {isSubmitted ? (
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-6 text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <Check className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">Replica Quote Request Submitted</h4>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Anthony will review your photos and dimensions against our marine laser CAD templates and send an itemized quote in your discussion thread.
          </p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="text-xs font-semibold text-sky-400 hover:underline"
          >
            Submit Another Inquiry
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Vessel Make</label>
              <input
                type="text"
                required
                value={boatMake}
                onChange={e => setBoatMake(e.target.value)}
                placeholder="e.g. Westerly, Sadler, Moody, Bavaria"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Model & Year</label>
              <input
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
                value={switchCount}
                onChange={e => setSwitchCount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              >
                {[4, 6, 8, 10, 12, 16].map(n => (
                  <option key={n} value={n}>{n} Switches</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Replacement Material</label>
              <select
                value={materialPref}
                onChange={e => setMaterialPref(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              >
                <option value="acrylic_black">Matte Black Marine Acrylic</option>
                <option value="acrylic_white">White Gloss Marine Acrylic</option>
                <option value="wood_teak">Solid Marine Teak</option>
                <option value="wood_birch">Marine Birch Plywood</option>
              </select>
            </div>
          </div>

          {/* Photo Upload Box */}
          <div className="space-y-2 pt-1">
            <label className="text-slate-300 font-semibold block">
              Photos of Existing Panel & Mounting Cavity
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {uploadedPhotos.map((url, i) => (
                <div key={i} className="relative aspect-4/3 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 group">
                  <img src={url} alt="Panel reference" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-2 text-[10px] bg-black/60 px-1 rounded text-white">
                    Photo {i + 1}
                  </span>
                </div>
              ))}

              <label className="aspect-4/3 border-2 border-dashed border-slate-800 hover:border-sky-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-400 hover:text-white bg-slate-950/60">
                <Camera className="w-5 h-5 text-sky-400 mb-1" />
                <span className="text-[11px] font-medium">Add Photo</span>
                <span className="text-[9px] text-slate-500">Camera / Files</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSimulateUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Tip: Holding a tape measure across the panel helps us verify mounting hole spacing exactly.</span>
            </p>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Specific Notes / Circuit Changes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Would like to add a 12V USB charger and change the old fuses to modern push-to-reset circuit breakers."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-sm shadow-sky-600/30 transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Send Replica Panel Inquiry</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
