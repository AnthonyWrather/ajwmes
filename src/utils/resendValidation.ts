import { EmailPayload, EmailTemplateType } from '../types';

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
 * Validates whether a provided string conforms to the Resend API key format.
 * Resend production and test keys begin with 're_' followed by alphanumeric characters.
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

export interface EmailPayloadValidationResult {
  isValid: boolean;
  error?: string;
  recipients?: string[];
}

/**
 * Validates an email payload before sending or queueing.
 * Prevents open relays, malformed headers, and oversized payloads.
 */
export function validateEmailPayload(payload: unknown): EmailPayloadValidationResult {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, error: 'Payload must be a non-null object' };
  }

  const p = payload as Partial<EmailPayload>;

  // Validate recipients ('to')
  if (!p.to) {
    return { isValid: false, error: 'Recipient email address (to) is required' };
  }

  const rawRecipients = Array.isArray(p.to) ? p.to : [p.to];
  if (rawRecipients.length === 0) {
    return { isValid: false, error: 'At least one recipient email address is required' };
  }
  if (rawRecipients.length > 10) {
    return { isValid: false, error: 'Exceeded maximum recipients limit (max 10)' };
  }

  const recipients: string[] = [];
  for (const r of rawRecipients) {
    if (typeof r !== 'string' || !isValidEmailAddress(r)) {
      return { isValid: false, error: `Invalid recipient email address: "${r}"` };
    }
    recipients.push(r.trim().toLowerCase());
  }

  // Validate subject
  if (!p.subject || typeof p.subject !== 'string' || p.subject.trim().length === 0) {
    return { isValid: false, error: 'Email subject is required' };
  }
  if (p.subject.length > 250) {
    return { isValid: false, error: 'Email subject exceeds maximum length of 250 characters' };
  }

  // Validate content: either html or text must be present
  const hasHtml = typeof p.html === 'string' && p.html.trim().length > 0;
  const hasText = typeof p.text === 'string' && p.text.trim().length > 0;
  if (!hasHtml && !hasText) {
    return { isValid: false, error: 'Email must contain either HTML or text content' };
  }

  // Validate templateType if provided
  if (p.templateType && !ALLOWED_EMAIL_TEMPLATES.includes(p.templateType)) {
    return { isValid: false, error: `Invalid email templateType: "${p.templateType}"` };
  }

  // Validate optional replyTo
  if (p.replyTo && !isValidEmailAddress(p.replyTo)) {
    return { isValid: false, error: `Invalid replyTo email address: "${p.replyTo}"` };
  }

  return {
    isValid: true,
    recipients
  };
}
