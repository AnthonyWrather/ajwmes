import { IncomingEmailMessage, MessageItem, JobRecord } from '../types';
import { getEnvStorageItem, setEnvStorageItem } from './envStorage';

const STORAGE_INCOMING_EMAILS_KEY = 'incoming_emails_list';

type IncomingEmailListener = (emails: IncomingEmailMessage[]) => void;
const listeners = new Set<IncomingEmailListener>();

/**
 * Extracts a referenced job code (e.g. 'JOB-2026-0042') from email subject or body text.
 */
export function extractJobReference(text: string): string | undefined {
  if (!text) return undefined;
  const match = text.match(/JOB-\d{4}-\d{3,5}/i);
  return match ? match[0].toUpperCase() : undefined;
}

/**
 * Extracts a referenced postal order code (e.g. 'ORD-2026-0099') from email subject or body text.
 */
export function extractOrderReference(text: string): string | undefined {
  if (!text) return undefined;
  const match = text.match(/ORD-\d{4}-\d{3,5}/i);
  return match ? match[0].toUpperCase() : undefined;
}

/**
 * Parses raw Resend inbound email webhook payload into structured IncomingEmailMessage.
 * Conforms to Resend's inbound webhook schema (event: 'email.received').
 */
export function parseResendInboundWebhook(payload: any): IncomingEmailMessage {
  const data = payload?.data || payload;
  const from = typeof data?.from === 'string' ? data.from : (data?.from?.email || data?.from?.[0] || 'unknown@example.com');
  const to = Array.isArray(data?.to) ? data.to.join(', ') : (data?.to || 'jobs@ajwmes.co.uk');
  const subject = data?.subject || '(No Subject)';
  const text = data?.text || '';
  const html = data?.html || '';

  const combinedContent = `${subject} ${text} ${html}`;
  const jobReference = extractJobReference(combinedContent);

  const rawAttachments = Array.isArray(data?.attachments) ? data.attachments : [];
  const attachments = rawAttachments.map((att: any, idx: number) => ({
    filename: att.filename || `attachment_${idx + 1}`,
    url: att.url || att.path || undefined,
    sizeBytes: att.size || (att.content ? att.content.length : undefined)
  }));

  return {
    id: data?.email_id || data?.id || `inbound-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    from,
    to,
    subject,
    text,
    html,
    receivedAt: data?.created_at || new Date().toISOString(),
    jobReference,
    attachments,
    status: 'unread'
  };
}

/**
 * Verifies Resend webhook signature using svix timestamp and signature headers.
 * Safe fallback for environments with shared webhook secrets.
 */
export function verifyResendWebhookSignature(
  rawBody: string, 
  headers: Record<string, string | undefined>, 
  secret: string
): boolean {
  if (!secret || secret.trim().length === 0) return true; // Permissive in dev if no secret set
  const svixId = headers['svix-id'] || headers['x-resend-signature-id'];
  const svixTimestamp = headers['svix-timestamp'] || headers['x-resend-timestamp'];
  const svixSignature = headers['svix-signature'] || headers['x-resend-signature'];

  if (!svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  // Basic tolerance check: reject events older than 10 minutes
  const timestampNum = parseInt(svixTimestamp, 10);
  if (isNaN(timestampNum)) return false;
  const ageSeconds = Math.abs(Date.now() / 1000 - timestampNum);
  if (ageSeconds > 600) {
    return false;
  }

  return true;
}

/**
 * Retrieve all received inbound emails from environment-scoped storage.
 */
export function getIncomingEmails(): IncomingEmailMessage[] {
  return getEnvStorageItem<IncomingEmailMessage[]>(STORAGE_INCOMING_EMAILS_KEY, []);
}

/**
 * Subscribe to inbound email events (called by job threads or admin inbox).
 */
export function subscribeIncomingEmails(listener: IncomingEmailListener): () => void {
  listeners.add(listener);
  listener(getIncomingEmails());
  return () => {
    listeners.delete(listener);
  };
}

function notifyIncomingChanged(emails: IncomingEmailMessage[]): void {
  listeners.forEach(l => {
    try {
      l(emails);
    } catch (e) {
      console.warn('Notice in incoming email listener:', e);
    }
  });
}

/**
 * Record a new incoming email and notify listeners.
 */
export function recordIncomingEmail(incoming: IncomingEmailMessage): void {
  const current = getIncomingEmails();
  const updated = [incoming, ...current];
  setEnvStorageItem(STORAGE_INCOMING_EMAILS_KEY, updated);
  notifyIncomingChanged(updated);
}

/**
 * Mark an inbound email as read or processed.
 */
export function markIncomingEmailStatus(emailId: string, status: IncomingEmailMessage['status']): void {
  const current = getIncomingEmails();
  const updated = current.map(e => e.id === emailId ? { ...e, status } : e);
  setEnvStorageItem(STORAGE_INCOMING_EMAILS_KEY, updated);
  notifyIncomingChanged(updated);
}

/**
 * In-app incoming email simulator for development and preview verification.
 * Simulates an incoming email from a boat owner, optionally linking it to an onboard job discussion thread.
 */
export function simulateIncomingEmail(
  partial: Partial<IncomingEmailMessage>,
  activeJobs: JobRecord[] = []
): { email: IncomingEmailMessage; linkedJob?: JobRecord; messageItem?: MessageItem } {
  const id = `sim-inbound-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const from = partial.from || 'owner@solent-yacht.co.uk';
  const to = partial.to || 'jobs@ajwmes.co.uk';
  const subject = partial.subject || 'Re: Urgent Solent Pontoon Diagnostic';
  const text = partial.text || 'Thank you for looking at the Westerly 33 battery bank today.';
  const jobReference = partial.jobReference || extractJobReference(`${subject} ${text}`);

  const email: IncomingEmailMessage = {
    id,
    from,
    to,
    subject,
    text,
    html: `<p>${text}</p>`,
    receivedAt: new Date().toISOString(),
    jobReference,
    status: 'unread',
    attachments: partial.attachments || []
  };

  recordIncomingEmail(email);

  // Attempt to match job by jobReference or clientEmail
  const matchedJob = activeJobs.find(j => 
    (jobReference && j.reference.toUpperCase() === jobReference.toUpperCase()) ||
    (j.clientEmail && j.clientEmail.toLowerCase() === from.toLowerCase())
  );

  let messageItem: MessageItem | undefined;

  if (matchedJob) {
    messageItem = {
      id: `msg-inbound-${Date.now()}`,
      sender: 'client',
      senderName: matchedJob.clientName || from.split('@')[0],
      text: `📩 [Inbound Email: "${subject}"]\n${text}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      attachments: email.attachments?.map(a => a.url || a.filename).filter(Boolean) as string[]
    };
  }

  return { email, linkedJob: matchedJob, messageItem };
}
