import { SendEmailFunctionRequest, SendEmailFunctionResponse, EmailTemplateType } from './types.js';

export const DEFAULT_RESEND_FROM = 'AJW Marine <notifications@ajwmes.co.uk>';
export const DEFAULT_RESEND_REPLY_TO = 'info@ajwmes.co.uk';
export const TEST_ONBOARDING_FROM = 'AJW Marine <onboarding@resend.dev>';

export const ALLOWED_EMAIL_TEMPLATES: EmailTemplateType[] = [
  'welcome',
  'order_confirmation',
  'order_dispatch',
  'diagnostic_quote',
  'pontoon_signoff',
  'zero_stock_alert',
  'custom'
];

/**
 * Validates standard email address format using RFC 5322 regex.
 */
export function isValidEmailAddress(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

/**
 * Validates Resend API key format (must start with re_ and be >= 24 chars).
 */
export function isValidResendApiKey(key: unknown): boolean {
  if (typeof key !== 'string') return false;
  const trimmed = key.trim();
  return (
    trimmed.startsWith('re_') &&
    trimmed.length >= 24 &&
    !trimmed.includes(' ') &&
    !trimmed.includes('<') &&
    !trimmed.toLowerCase().includes('your_') &&
    !trimmed.toLowerCase().includes('placeholder')
  );
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  recipients?: string[];
}

/**
 * Validates email request payload to enforce integrity and prevent open-relay abuse.
 */
export function validateEmailPayload(payload: unknown): ValidationResult {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, error: 'Payload must be a non-null object' };
  }

  const p = payload as Partial<SendEmailFunctionRequest>;

  // Recipients validation
  if (!p.to) {
    return { isValid: false, error: 'Recipient address (to) is required' };
  }

  const rawRecipients = Array.isArray(p.to) ? p.to : [p.to];
  if (rawRecipients.length === 0) {
    return { isValid: false, error: 'At least one recipient address is required' };
  }
  if (rawRecipients.length > 10) {
    return { isValid: false, error: 'Maximum 10 recipients per email dispatch' };
  }

  const recipients: string[] = [];
  for (const r of rawRecipients) {
    if (typeof r !== 'string' || !isValidEmailAddress(r)) {
      return { isValid: false, error: `Invalid recipient email address: "${r}"` };
    }
    recipients.push(r.trim().toLowerCase());
  }

  // Subject validation
  if (!p.subject || typeof p.subject !== 'string' || p.subject.trim().length === 0) {
    return { isValid: false, error: 'Email subject is required' };
  }
  if (p.subject.length > 250) {
    return { isValid: false, error: 'Email subject exceeds 250 character limit' };
  }

  // Content validation
  const hasHtml = typeof p.html === 'string' && p.html.trim().length > 0;
  const hasText = typeof p.text === 'string' && p.text.trim().length > 0;
  if (!hasHtml && !hasText) {
    return { isValid: false, error: 'Email must contain either HTML or text content' };
  }

  // Template type validation
  if (p.templateType && !ALLOWED_EMAIL_TEMPLATES.includes(p.templateType)) {
    return { isValid: false, error: `Unrecognized email templateType: "${p.templateType}"` };
  }

  // Zero-stock depletion alerts should only be sent to authorized admin/workshop mailboxes
  if (p.templateType === 'zero_stock_alert') {
    const isAuthorizedAdminRecipient = recipients.every(
      (email) => email === 'anthonywrather@gmail.com' || email.endsWith('@ajwmes.co.uk')
    );
    if (!isAuthorizedAdminRecipient) {
      return {
        isValid: false,
        error: 'Zero stock depletion alerts can only be addressed to workshop administrator mailboxes.'
      };
    }
  }

  // Reply-to address validation
  if (p.replyTo && !isValidEmailAddress(p.replyTo)) {
    return { isValid: false, error: `Invalid replyTo address: "${p.replyTo}"` };
  }

  return {
    isValid: true,
    recipients
  };
}

/**
 * Dispatches transactional email through the Resend REST API or simulates if key is not provisioned.
 */
export async function sendEmailViaResend(
  apiKey: string,
  payload: SendEmailFunctionRequest,
  fetchFn: typeof fetch = fetch
): Promise<SendEmailFunctionResponse> {
  if (!apiKey || !isValidResendApiKey(apiKey)) {
    const simId = `sim-server-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[Resend Cloud Function] Simulated dispatch to ${JSON.stringify(payload.to)} | ID: ${simId}`);
    return {
      success: true,
      messageId: simId,
      isSimulated: true
    };
  }

  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
  const fromAddress = payload.from || DEFAULT_RESEND_FROM;
  const replyToAddress = payload.replyTo || DEFAULT_RESEND_REPLY_TO;

  const requestBody: Record<string, unknown> = {
    from: fromAddress,
    to: recipients,
    subject: payload.subject,
    reply_to: replyToAddress
  };

  if (payload.html) requestBody.html = payload.html;
  if (payload.text) requestBody.text = payload.text;
  if (payload.tags && payload.tags.length > 0) requestBody.tags = payload.tags;
  if (payload.attachments && payload.attachments.length > 0) {
    requestBody.attachments = payload.attachments.map((att) => ({
      filename: att.filename,
      content: att.content
    }));
  }

  try {
    const response = await fetchFn('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = (data && (data.message || data.error?.message)) || `HTTP ${response.status} from Resend`;
      console.warn('[Resend API Error]:', errMsg);
      return {
        success: false,
        messageId: '',
        error: errMsg
      };
    }

    return {
      success: true,
      messageId: (data && data.id) || `msg-${Date.now()}`
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Resend Network Error]:', message);
    return {
      success: false,
      messageId: '',
      error: `Network error reaching Resend API: ${message}`
    };
  }
}
