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

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
      data-testid="image-lightbox-modal"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-2 sm:p-6 animate-in fade-in duration-200 overflow-x-hidden"
      onClick={onClose}
    >
      {/* Lightbox Header Bar */}
      <div 
        className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-white max-w-5xl mx-auto w-full z-10 gap-2 shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-xl bg-sky-950/80 border border-sky-500/30 text-sky-400 shrink-0">
            <Cloud className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                {imageTitle || 'Switch Panel Reference Image'}
              </h4>
              {isFirebase && (
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 shrink-0">
                  Firebase Cloud Storage
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate">
              {fileSize ? `${fileSize} · ` : ''}
              {storagePath || (isFirebase ? 'Permanent Cloud Asset' : 'Local Reference')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.5))}
            className="hidden sm:flex p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.5))}
            className="hidden sm:flex p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyUrl}
            className="hidden sm:flex px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold items-center gap-1.5 transition-colors"
            title="Copy Permanent Storage URL"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ExternalLink className="w-3.5 h-3.5 text-sky-400" />}
            <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
          </button>
          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            download
            className="p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl transition-colors shrink-0"
            title="Open / Download Full Size"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            data-testid="image-lightbox-close"
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors ml-0.5 sm:ml-1 shrink-0"
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
