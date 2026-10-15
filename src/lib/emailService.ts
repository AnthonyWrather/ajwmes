import { 
  EmailPayload, 
  EmailDispatchResult, 
  UserProfile, 
  PostalOrder, 
  JobRecord, 
  CustomerSignOffRecord, 
  StockAlert 
} from '../types';
import { resolveResendConfig } from './resendConfig';
import { 
  buildWelcomeEmail, 
  buildOrderConfirmationEmail, 
  buildOrderDispatchEmail, 
  buildDiagnosticQuoteEmail, 
  buildPontoonSignOffEmail, 
  buildZeroStockAlertEmail 
} from '../utils/emailTemplates';
import { enqueueOfflineEmail, registerSyncCallbacks } from './offlineSync';

// Register offline email queue flush callback
registerSyncCallbacks({
  onDispatchQueuedEmail: async (record) => {
    await sendEmail(record.payload);
  }
});

// In-memory simulated outbox for test verification and safe dev simulation
const simulatedOutbox: EmailPayload[] = [];

/**
 * Returns all simulated emails dispatched during the active session.
 */
export function getSimulatedOutbox(): EmailPayload[] {
  return [...simulatedOutbox];
}

/**
 * Clears the simulated email outbox.
 */
export function clearSimulatedOutbox(): void {
  simulatedOutbox.length = 0;
}

/**
 * Core email dispatch function.
 * 
 * Behavior:
 * 1. If device is offline (pontoon technician inside hull), queues to IndexedDB via enqueueOfflineEmail.
 * 2. If no live Resend API key is configured, stores in simulatedOutbox and logs to console.
 * 3. If live key is present and device is online, posts to https://api.resend.com/emails.
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailDispatchResult> {
  const config = resolveResendConfig();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // 1. Offline handling for pontoon field technicians
  if (!isOnline && typeof window !== 'undefined') {
    try {
      await enqueueOfflineEmail(payload);
      return {
        success: true,
        messageId: `offline-${Date.now()}`,
        queuedOffline: true
      };
    } catch (err: any) {
      console.warn('Could not queue email offline:', err);
    }
  }

  // 2. Simulated dev mode when no authentic API key is set
  if (config.isSimulatedMode || !config.apiKey) {
    const simId = `sim-email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    simulatedOutbox.push(payload);
    console.log(`[Resend Simulated Outbox] Dispatched to: ${payload.to} | Subject: "${payload.subject}" (ID: ${simId})`);
    return {
      success: true,
      messageId: simId,
      isSimulated: true
    };
  }

  // 3. Live dispatch to Resend REST API
  try {
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const fromAddress = payload.from || config.fromEmail;

    const requestBody: Record<string, any> = {
      from: fromAddress,
      to: recipients,
      subject: payload.subject,
      reply_to: payload.replyTo || config.replyTo
    };

    if (payload.html) requestBody.html = payload.html;
    if (payload.text) requestBody.text = payload.text;
    if (payload.tags && payload.tags.length > 0) requestBody.tags = payload.tags;
    if (payload.attachments && payload.attachments.length > 0) {
      requestBody.attachments = payload.attachments.map(att => ({
        filename: att.filename,
        content: att.content
      }));
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.message || data?.error?.message || `HTTP ${response.status}: Failed to send email via Resend`;
      console.warn('[Resend API Error]:', errMsg);
      return {
        success: false,
        error: errMsg
      };
    }

    return {
      success: true,
      messageId: data.id
    };
  } catch (error: any) {
    console.warn('[Resend Dispatch Notice]:', error);
    // If network error occurred, attempt offline queue fallback
    if (typeof window !== 'undefined') {
      try {
        await enqueueOfflineEmail(payload);
        return {
          success: true,
          messageId: `offline-fallback-${Date.now()}`,
          queuedOffline: true
        };
      } catch {
        // Fall through to error return
      }
    }
    return {
      success: false,
      error: error?.message || 'Network error communicating with Resend'
    };
  }
}

/**
 * Send an account registration welcome email to the newly created boat owner.
 */
export async function sendWelcomeEmail(profile: UserProfile): Promise<EmailDispatchResult> {
  const { subject, html, text } = buildWelcomeEmail(profile);
  return sendEmail({
    to: profile.email,
    subject,
    html,
    text,
    templateType: 'welcome',
    tags: [{ name: 'category', value: 'user_registration' }]
  });
}

/**
 * Send online store order confirmation email to the purchasing customer.
 */
export async function sendOrderConfirmationEmail(order: PostalOrder): Promise<EmailDispatchResult> {
  if (!order.customerEmail) {
    return { success: false, error: 'Order is missing customer email address' };
  }
  const { subject, html, text } = buildOrderConfirmationEmail(order);
  return sendEmail({
    to: order.customerEmail,
    subject,
    html,
    text,
    templateType: 'order_confirmation',
    orderId: order.id,
    tags: [
      { name: 'category', value: 'store_order' },
      { name: 'order_ref', value: order.orderNumber || order.id }
    ]
  });
}

/**
 * Send dispatch notification email with carrier tracking details to customer.
 */
export async function sendOrderDispatchEmail(order: PostalOrder): Promise<EmailDispatchResult> {
  if (!order.customerEmail) {
    return { success: false, error: 'Order is missing customer email address' };
  }
  const { subject, html, text } = buildOrderDispatchEmail(order);
  return sendEmail({
    to: order.customerEmail,
    subject,
    html,
    text,
    templateType: 'order_dispatch',
    orderId: order.id,
    tags: [
      { name: 'category', value: 'order_dispatch' },
      { name: 'carrier', value: order.carrier || 'royal_mail' }
    ]
  });
}

/**
 * Send diagnostic quote approval request to boat owner.
 */
export async function sendDiagnosticQuoteEmail(job: JobRecord): Promise<EmailDispatchResult> {
  if (!job.clientEmail) {
    return { success: false, error: 'Job record is missing client email address' };
  }
  const { subject, html, text } = buildDiagnosticQuoteEmail(job);
  return sendEmail({
    to: job.clientEmail,
    subject,
    html,
    text,
    templateType: 'diagnostic_quote',
    jobReference: job.reference,
    tags: [
      { name: 'category', value: 'diagnostic_quote' },
      { name: 'job_ref', value: job.reference }
    ]
  });
}

/**
 * Send customer pontoon sign-off confirmation receipt to boat owner.
 */
export async function sendPontoonSignOffEmail(job: JobRecord, signOff: CustomerSignOffRecord): Promise<EmailDispatchResult> {
  if (!job.clientEmail) {
    return { success: false, error: 'Job record is missing client email address' };
  }
  const { subject, html, text } = buildPontoonSignOffEmail(job, signOff);
  return sendEmail({
    to: job.clientEmail,
    subject,
    html,
    text,
    templateType: 'pontoon_signoff',
    jobReference: job.reference,
    tags: [
      { name: 'category', value: 'customer_signoff' },
      { name: 'job_ref', value: job.reference }
    ]
  });
}

/**
 * Send automated zero stock depletion alert to workshop administrator (Anthony Wrather).
 */
export async function sendZeroStockEmail(alert: StockAlert): Promise<EmailDispatchResult> {
  const { subject, html, text } = buildZeroStockAlertEmail(alert);
  return sendEmail({
    to: alert.emailRecipient || 'anthonywrather@gmail.com',
    subject,
    html,
    text,
    templateType: 'zero_stock_alert',
    tags: [
      { name: 'category', value: 'inventory_alert' },
      { name: 'item_id', value: alert.itemId }
    ]
  });
}

/**
 * Send an immediate test email to verify Resend API key connectivity.
 */
export async function sendTestEmail(targetEmail = 'anthonywrather@gmail.com'): Promise<EmailDispatchResult> {
  const config = resolveResendConfig();
  const timestamp = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return sendEmail({
    to: targetEmail,
    subject: `Resend Verification Test - AJW Marine (${timestamp})`,
    html: `
      <div style="font-family: sans-serif; background-color: #0a192f; color: #e2e8f0; padding: 24px; border-radius: 12px; border: 1px solid #1e3a5f;">
        <h2 style="color: #f59e0b; margin-top: 0;">⚡ AJW Marine Electrical Services</h2>
        <p>This is a successful test email dispatched via <strong>Resend</strong>.</p>
        <div style="background-color: #0f2744; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 12px; color: #38bdf8;">
          Timestamp: ${timestamp}<br>
          Sender: ${config.fromEmail}<br>
          Recipient: ${targetEmail}<br>
          Mode: ${config.isSimulatedMode ? 'Simulated Development Outbox' : 'Live Resend API (HTTP 200)'}
        </div>
        <p style="font-size: 11px; color: #64748b; margin-top: 16px;">
          AJW Marine Electrical Services • Gosport Marina & Solent
        </p>
      </div>
    `,
    text: `AJW Marine Electrical Services - Resend Test Email\nDispatched at ${timestamp}\nSender: ${config.fromEmail}\nRecipient: ${targetEmail}`,
    templateType: 'custom',
    tags: [{ name: 'test_probe', value: 'settings_modal' }]
  });
}
