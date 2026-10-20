import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidResendApiKey,
  isValidEmailAddress,
  validateEmailPayload,
  sendEmailViaResend
} from './resendClient.js';
import { validateEmailCallerAuth } from './authMiddleware.js';
import { CallableRequest } from 'firebase-functions/v2/https';

describe('Cloud Functions Resend Suite', () => {
  describe('Validation Helpers', () => {
    it('validates Resend API key format correctly', () => {
      assert.equal(isValidResendApiKey('re_test_key_1234567890abcdef'), true);
      assert.equal(isValidResendApiKey('invalid-key'), false);
      assert.equal(isValidResendApiKey('re_short'), false);
      assert.equal(isValidResendApiKey(''), false);
    });

    it('validates email addresses', () => {
      assert.equal(isValidEmailAddress('anthonywrather@gmail.com'), true);
      assert.equal(isValidEmailAddress('notifications@ajwmes.co.uk'), true);
      assert.equal(isValidEmailAddress('not-an-email'), false);
    });

    it('validates email payload completely', () => {
      const valid = validateEmailPayload({
        to: 'client@solent.co.uk',
        subject: 'Order Dispatch Confirmation',
        html: '<p>Dispatched</p>',
        templateType: 'order_dispatch'
      });
      assert.equal(valid.isValid, true);

      const invalidTemplate = validateEmailPayload({
        to: 'client@solent.co.uk',
        subject: 'Spam Subject',
        html: '<p>Spam</p>',
        templateType: 'unknown_spam_type' as any
      });
      assert.equal(invalidTemplate.isValid, false);

      const invalidAlertRecipient = validateEmailPayload({
        to: 'stranger@gmail.com',
        subject: 'Stock Depleted',
        html: '<p>Depleted</p>',
        templateType: 'zero_stock_alert'
      });
      assert.equal(invalidAlertRecipient.isValid, false);
      assert.match(invalidAlertRecipient.error || '', /workshop administrator mailboxes/i);
    });
  });

  describe('sendEmailViaResend', () => {
    it('returns simulated response when API key is unprovisioned or invalid', async () => {
      const result = await sendEmailViaResend('', {
        to: 'client@solent.co.uk',
        subject: 'Welcome aboard',
        html: '<p>Welcome</p>'
      });
      assert.equal(result.success, true);
      assert.equal(result.isSimulated, true);
      assert.match(result.messageId, /^sim-server-/);
    });

    it('successfully sends email via mocked fetch with valid key', async () => {
      const mockFetch: typeof fetch = async (url, options) => {
        assert.equal(url.toString(), 'https://api.resend.com/emails');
        assert.equal(options?.method, 'POST');
        const headers = options?.headers as Record<string, string>;
        assert.equal(headers['Authorization'], 'Bearer re_valid_key_1234567890abcdef');

        return {
          ok: true,
          status: 200,
          json: async () => ({ id: 'resend_msg_12345' })
        } as unknown as Response;
      };

      const result = await sendEmailViaResend(
        're_valid_key_1234567890abcdef',
        {
          to: 'client@solent.co.uk',
          subject: 'Order Confirmation',
          html: '<p>Your order is confirmed</p>'
        },
        mockFetch
      );

      assert.equal(result.success, true);
      assert.equal(result.messageId, 'resend_msg_12345');
    });

    it('handles Resend API error response gracefully', async () => {
      const mockFetch: typeof fetch = async () => {
        return {
          ok: false,
          status: 400,
          json: async () => ({ message: 'Domain not verified' })
        } as unknown as Response;
      };

      const result = await sendEmailViaResend(
        're_valid_key_1234567890abcdef',
        {
          to: 'client@solent.co.uk',
          subject: 'Order Confirmation',
          html: '<p>Your order is confirmed</p>'
        },
        mockFetch
      );

      assert.equal(result.success, false);
      assert.match(result.error || '', /Domain not verified/);
    });
  });

  describe('validateEmailCallerAuth', () => {
    it('allows unauthenticated caller for registration welcome email', () => {
      const req = { auth: undefined } as unknown as CallableRequest<unknown>;
      const authCtx = validateEmailCallerAuth(req, 'welcome');
      assert.equal(authCtx, null);
    });

    it('allows unauthenticated caller for order confirmation email', () => {
      const req = { auth: undefined } as unknown as CallableRequest<unknown>;
      const authCtx = validateEmailCallerAuth(req, 'order_confirmation');
      assert.equal(authCtx, null);
    });

    it('rejects unauthenticated caller for privileged templates', () => {
      const req = { auth: undefined } as unknown as CallableRequest<unknown>;
      assert.throws(() => {
        validateEmailCallerAuth(req, 'order_dispatch');
      }, /requires an authenticated session/);
    });

    it('allows postal role to send order_dispatch', () => {
      const req = {
        auth: {
          uid: 'postal_user_1',
          token: { email: 'sarah.postal@ajwmes.co.uk', role: 'postal' }
        }
      } as unknown as CallableRequest<unknown>;

      const authCtx = validateEmailCallerAuth(req, 'order_dispatch');
      assert.equal(authCtx?.role, 'postal');
    });

    it('allows admin role to send any template', () => {
      const req = {
        auth: {
          uid: 'admin_user_1',
          token: { email: 'anthonywrather@gmail.com', role: 'admin' }
        }
      } as unknown as CallableRequest<unknown>;

      const authCtx = validateEmailCallerAuth(req, 'order_dispatch');
      assert.equal(authCtx?.role, 'admin');
    });
  });
});
