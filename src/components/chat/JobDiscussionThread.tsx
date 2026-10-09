import React, { useState, useRef } from 'react';
import { JobRecord, MessageItem } from '../../types';
import { 
  Send, 
  Paperclip, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  CreditCard, 
  ExternalLink, 
  Image as ImageIcon, 
  Truck, 
  Package, 
  Bell, 
  Cloud, 
  Loader2, 
  Eye, 
  Plus 
} from 'lucide-react';
import { uploadSwitchPanelImage, isFirebaseStorageUrl } from '../../lib/storage';
import { ImageLightboxModal } from '../common/ImageLightboxModal';

interface JobDiscussionThreadProps {
  job: JobRecord;
  currentUserRole: 'client' | 'admin';
  onSendMessage: (jobId: string, message: MessageItem) => void;
  onApproveQuote?: (jobId: string) => void;
  onPayDeposit?: (jobId: string, amount: number) => void;
  onNavigateToTracker?: (orderId?: string) => void;
}

export const JobDiscussionThread: React.FC<JobDiscussionThreadProps> = ({
  job,
  currentUserRole,
  onSendMessage,
  onApproveQuote,
  onPayDeposit,
  onNavigateToTracker
}) => {
  const [inputText, setInputText] = useState('');
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Lightbox Modal State
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: MessageItem = {
      id: `msg-${Date.now()}`,
      sender: currentUserRole === 'admin' ? 'ajw' : 'client',
      senderName: currentUserRole === 'admin' ? 'Anthony (AJW Marine)' : job.clientName,
      text: inputText.trim(),
      timestamp: 'Just now'
    };

    onSendMessage(job.id, newMessage);
    setInputText('');
  };

  const handleSimulateStripePay = () => {
    setIsProcessingStripe(true);
    setTimeout(() => {
      setIsProcessingStripe(false);
      if (onPayDeposit) onPayDeposit(job.id, 50);
    }, 1500);
  };

  // Upload an image attachment directly to Firebase Storage
  const handleAttachPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setIsUploadingPhoto(true);
    setUploadProgress(0);

    try {
      const uploaded = await uploadSwitchPanelImage(file, {
        jobReference: job.reference,
        vesselName: job.vesselName,
        category: 'chat_attachment',
        onProgress: (info) => {
          setUploadProgress(info.progress);
        }
      });

      const senderName = currentUserRole === 'admin' ? 'Anthony (AJW Marine)' : job.clientName;
      const photoMessage: MessageItem = {
        id: `msg-photo-${Date.now()}`,
        sender: currentUserRole === 'admin' ? 'ajw' : 'client',
        senderName,
        text: `📷 [Attached Switch Panel Image: ${file.name}]\nSaved to Firebase Cloud Storage (${uploaded.formattedSize}).`,
        timestamp: 'Just now',
        attachments: [uploaded.url]
      };

      onSendMessage(job.id, photoMessage);
    } catch (err) {
      console.error('Failed to attach photo to chat:', err);
      alert(err instanceof Error ? err.message : 'Photo upload failed. Check connection.');
    } finally {
      setIsUploadingPhoto(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[650px] shadow-xl">
      {/* Lightbox Modal */}
      <ImageLightboxModal
        isOpen={!!lightboxUrl}
        imageUrl={lightboxUrl}
        imageTitle={lightboxTitle}
        onClose={() => setLightboxUrl(null)}
      />

      {/* Thread Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono text-sky-400 font-semibold">{job.reference}</span>
            <span aria-hidden="true">·</span>
            <span>{job.vesselName} ({job.vesselType})</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-300">{job.berthLocation}</span>
          </div>
          <h3 className="text-base font-bold text-white mt-0.5">
            Service Discussion &amp; Diagnostic Record
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-sky-950/80 border border-sky-500/30 text-sky-300 capitalize">
            {job.status.replace('_', ' ')}
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Flat Rate: £{job.hourlyRate}/hr
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Messages Feed */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none">
            {/* Initial Job Brief Banner */}
            <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold text-slate-200">Initial Job Scope &amp; Notes</span>
                <span>{job.createdAt}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{job.notes}</p>

              {/* Uploaded Switch Panel Photos Section */}
              {job.replicaImages && job.replicaImages.length > 0 && (
                <div className="pt-2 border-t border-slate-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-sky-400 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Switch Panel Reference Photos ({job.replicaImages.length})</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <Cloud className="w-3 h-3" />
                      <span>Firebase Storage</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {job.replicaImages.map((img: string, i: number) => (
                      <div
                        key={i}
                        onClick={() => {
                          setLightboxUrl(img);
                          setLightboxTitle(`Switch Panel Reference Photo ${i + 1}`);
                        }}
                        className="group relative aspect-4/3 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 hover:border-sky-500 cursor-pointer transition-all shadow-sm"
                      >
                        <img 
                          src={img} 
                          alt={`Reference ${i + 1}`} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                        <span className="absolute bottom-1 left-1.5 text-[9px] bg-black/75 px-1 rounded text-white font-mono">
                          Photo {i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Conversation Messages */}
            {job.messages.map((msg: MessageItem) => {
              const isDispatchNotification = 
                msg.senderName.includes('Postal Dispatch') || 
                msg.text.includes('Postal Order') || 
                msg.text.includes('POSTAL DISPATCH') ||
                msg.text.includes('DELIVERY CONFIRMED') ||
                msg.text.includes('WORKSHOP PACKING');

              const isMe =
                !isDispatchNotification && (
                  (currentUserRole === 'admin' && msg.sender === 'ajw') ||
                  (currentUserRole === 'client' && msg.sender === 'client')
                );

              // Extract order number if present
              const orderMatch = msg.text.match(/AJW-POST-\d+/);
              const extractedOrderNumber = orderMatch ? orderMatch[0] : null;

              if (isDispatchNotification) {
                return (
                  <div key={msg.id} className="w-full my-2">
                    <div className="bg-gradient-to-r from-sky-950/70 to-indigo-950/50 border border-sky-500/40 rounded-2xl p-4 shadow-lg space-y-2.5">
                      <div className="flex items-center justify-between gap-2 border-b border-sky-500/20 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-sky-900/60 text-sky-400 border border-sky-500/30">
                            <Truck className="w-4 h-4" />
                          </span>
                          <div>
                            <span className="font-bold text-white text-xs block">{msg.senderName}</span>
                            <span className="text-[10px] text-sky-300 font-mono">Live Postal Fulfillment Event</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                      </div>

                      <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line pl-1">
                        {msg.text}
                      </div>

                      {onNavigateToTracker && (
                        <div className="pt-1 flex items-center justify-end">
                          <button
                            onClick={() => onNavigateToTracker(extractedOrderNumber || undefined)}
                            className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-950/80 border border-sky-500/30 hover:border-sky-500/60 transition-all cursor-pointer"
                          >
                            <span>Open in Visual Order Tracker</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1">
                    <span className="font-semibold text-slate-300">{msg.senderName}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm whitespace-pre-line ${
                      isMe
                        ? 'bg-sky-600 text-white rounded-br-xs'
                        : 'bg-slate-800 border border-slate-700/80 text-slate-100 rounded-bl-xs'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {/* Inline Image Attachment if any */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/20 grid grid-cols-2 gap-2">
                        {msg.attachments.map((attachUrl, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setLightboxUrl(attachUrl);
                              setLightboxTitle(`Chat Attachment from ${msg.senderName}`);
                            }}
                            className="aspect-4/3 rounded-lg overflow-hidden bg-black/40 border border-white/20 cursor-pointer hover:opacity-90 transition-opacity relative group"
                          >
                            <img src={attachUrl} alt="Attached switch panel" className="w-full h-full object-cover" />
                            <span className="absolute bottom-1 right-1 text-[8px] bg-black/75 px-1 rounded text-white font-mono">
                              Click to zoom
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Uploading progress notification */}
          {isUploadingPhoto && (
            <div className="bg-sky-950/70 border border-sky-500/40 rounded-xl p-2.5 mb-2 text-xs text-sky-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span>Uploading photo to Firebase Storage...</span>
              </span>
              <span className="font-mono font-bold">{uploadProgress}%</span>
            </div>
          )}

          {/* Message Input Box */}
          <form onSubmit={handleSend} className="pt-3 border-t border-slate-800 flex gap-2 items-center">
            {/* Attach Image button with Firebase Storage upload */}
            <label 
              className="p-2.5 bg-slate-950 border border-slate-800 hover:border-sky-500 text-slate-400 hover:text-sky-400 rounded-xl cursor-pointer transition-colors"
              title="Upload Switch Panel Photo to Firebase Storage"
            >
              <Paperclip className="w-4 h-4" />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                disabled={isUploadingPhoto}
                onChange={handleAttachPhoto}
                className="hidden"
              />
            </label>

            <input
              type="text"
              placeholder={`Reply as ${currentUserRole === 'admin' ? 'Anthony (AJW Marine)' : job.clientName}...`}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>

        {/* Sidebar: Itemized Quote & Stripe Payment Panel */}
        <div className="w-full md:w-72 bg-slate-950/70 border-t md:border-t-0 md:border-l border-slate-800 p-4 flex flex-col justify-between text-xs space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>Job Billing Sheet</span>
              </span>
              <span className="text-[10px] text-slate-400">Audited Log</span>
            </div>

            {/* Diagnostic Time */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Labor Hours (@ £25/hr)</span>
                <span className="font-mono text-white tabular-nums">{job.diagnosticHours}h</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Labor Subtotal</span>
                <span className="font-mono text-white tabular-nums">£{job.totalLabor.toFixed(2)}</span>
              </div>
            </div>

            {/* Materials Breakdown */}
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-300 block">Materials Used:</span>
              {job.materialsUsed.length === 0 ? (
                <span className="text-[10px] text-slate-500 italic">No materials billed yet</span>
              ) : (
                job.materialsUsed.map((m: any) => (
                  <div key={m.id} className="text-[11px] flex justify-between text-slate-400">
                    <span className="truncate max-w-[140px]">{m.quantity}x {m.name}</span>
                    <span className="font-mono text-slate-200 tabular-nums">
                      £{(m.quantity * m.unitPrice).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Total Balance */}
            <div className="pt-3 border-t border-slate-800 space-y-1">
              <div className="flex justify-between text-sm font-bold text-white">
                <span>Total Amount:</span>
                <span className="font-mono text-sky-400 tabular-nums">
                  £{(job.totalLabor + job.totalMaterials).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Deposit Status:</span>
                <span className={job.depositPaid ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                  {job.depositPaid ? `Paid (£${job.depositAmount})` : 'Unpaid'}
                </span>
              </div>
            </div>
          </div>

          {/* Client Action: Stripe Payment or Approval */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            {job.status === 'quote_sent' && currentUserRole === 'client' && (
              <button
                onClick={() => onApproveQuote && onApproveQuote(job.id)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Quote</span>
              </button>
            )}

            {!job.depositPaid ? (
              <button
                onClick={handleSimulateStripePay}
                disabled={isProcessingStripe}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-sky-600/30"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isProcessingStripe ? 'Opening Stripe...' : 'Pay Deposit via Stripe'}</span>
              </button>
            ) : (
              <div className="w-full py-2 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-semibold rounded-xl text-[11px] flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Deposit Secured via Stripe</span>
              </div>
            )}
            <p className="text-[10px] text-slate-500 text-center">
              Stripe 256-bit encryption · Apple Pay &amp; Cards
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
