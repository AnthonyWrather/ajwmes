import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, ExternalLink, Cloud, Check } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  imageTitle?: string;
  onClose: () => void;
  storagePath?: string;
  fileSize?: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  imageUrl,
  imageTitle,
  onClose,
  storagePath,
  fileSize
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen || !imageUrl) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (e) {
      console.warn('Could not copy URL to clipboard', e);
    }
  };

  const isFirebase = imageUrl.includes('firebasestorage.googleapis.com') || imageUrl.includes('appspot.com');

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Lightbox Header Bar */}
      <div 
        className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 text-white max-w-5xl mx-auto w-full z-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-950/80 border border-sky-500/30 text-sky-400">
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                {imageTitle || 'Switch Panel Reference Image'}
              </h4>
              {isFirebase && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  Firebase Cloud Storage
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {fileSize ? `${fileSize} · ` : ''}
              {storagePath || (isFirebase ? 'Permanent Cloud Asset' : 'Local Reference')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.5))}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.5))}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyUrl}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Copy Permanent Storage URL"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ExternalLink className="w-3.5 h-3.5 text-sky-400" />}
            <span className="hidden sm:inline">{copiedUrl ? 'Copied' : 'Copy URL'}</span>
          </button>
          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            download
            className="p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl transition-colors"
            title="Open / Download Full Size"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors ml-1"
            title="Close Lightbox"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div 
        className="flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden select-none"
        onClick={onClose}
      >
        <div 
          className="relative max-w-full max-h-full transition-transform duration-200 ease-out flex items-center justify-center"
          style={{ transform: `scale(${zoomLevel})` }}
          onClick={e => e.stopPropagation()}
        >
          <img
            src={imageUrl}
            alt={imageTitle || 'Switch panel preview'}
            className="max-h-[78vh] max-w-[90vw] object-contain rounded-xl shadow-2xl border border-slate-800"
          />
        </div>
      </div>

      {/* Footer Info */}
      <div 
        className="text-center text-[11px] text-slate-400 pb-2"
        onClick={e => e.stopPropagation()}
      >
        <span>Scroll / Zoom buttons to inspect screw holes, Carling switches, and breaker labels · ESC or click background to close</span>
      </div>
    </div>
  );
};
