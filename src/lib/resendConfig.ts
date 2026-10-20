import { ResendAppConfig } from '../types';
import { isValidResendApiKey } from '../utils/resendValidation';

export const DEFAULT_RESEND_FROM = 'AJW Marine <notifications@ajwmes.co.uk>';
export const DEFAULT_RESEND_REPLY_TO = 'info@ajwmes.co.uk';
export const TEST_ONBOARDING_FROM = 'AJW Marine <onboarding@resend.dev>';

export { isValidResendApiKey };

/**
 * Resolves active Resend configuration.
 * In accordance with Issue #20, all transactional email is dispatched via a server-side
 * Firebase Cloud Function (europe-west2) backed by Google Secret Manager.
 * No API keys are read or stored client-side.
 */
export function resolveResendConfig(): ResendAppConfig {
  const envFrom = typeof import.meta !== 'undefined' && import.meta.env && typeof import.meta.env.VITE_RESEND_FROM_EMAIL === 'string'
    ? import.meta.env.VITE_RESEND_FROM_EMAIL.trim()
    : undefined;
  const envReplyTo = typeof import.meta !== 'undefined' && import.meta.env && typeof import.meta.env.VITE_RESEND_REPLY_TO === 'string'
    ? import.meta.env.VITE_RESEND_REPLY_TO.trim()
    : undefined;

  const fromEmail = envFrom || DEFAULT_RESEND_FROM;
  const replyTo = envReplyTo || DEFAULT_RESEND_REPLY_TO;

  return {
    apiKey: '',
    fromEmail,
    fromName: 'AJW Marine Electrical Services',
    replyTo,
    isConfigured: true,
    isSimulatedMode: false
  };
}

export const resendConfig: ResendAppConfig = resolveResendConfig();

export default resendConfig;
