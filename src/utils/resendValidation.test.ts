import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidResendApiKey,
  isValidEmailAddress,
  validateEmailPayload
} from './resendValidation';

describe('Resend Validation Suite', () => {
  describe('isValidResendApiKey', () => {
    it('accepts valid Resend API keys with re_ prefix and length >= 24', () => {
      assert.equal(isValidResendApiKey('re_1234567890abcdef12345678'), true);
      assert.equal(isValidResendApiKey('re_prod_solent_marine_api_99'), true);
    });

    it('rejects keys without re_ prefix', () => {
      assert.equal(isValidResendApiKey('dummy_test_1234567890abcdef12345678'), false);
      assert.equal(isValidResendApiKey('AIzaSyCeLVmFhxzY8Ojh2NFUvuyGax-LVDk5tIg'), false);
    });

    it('rejects keys shorter than 24 characters', () => {
      assert.equal(isValidResendApiKey('re_short'), false);
    });

    it('rejects placeholder or whitespace-containing keys', () => {
      assert.equal(isValidResendApiKey('re_1234567890 your_api_key_here'), false);
      assert.equal(isValidResendApiKey('re_1234567890 placeholder_key_123'), false);
      assert.equal(isValidResendApiKey(''), false);
      assert.equal(isValidResendApiKey(null), false);
      assert.equal(isValidResendApiKey(undefined), false);
    });
  });

  describe('isValidEmailAddress', () => {
    it('accepts valid email addresses', () => {
      assert.equal(isValidEmailAddress('anthonywrather@gmail.com'), true);
      assert.equal(isValidEmailAddress('notifications@ajwmes.co.uk'), true);
      assert.equal(isValidEmailAddress('skipper.john@solent-yachting.com'), true);
    });

    it('rejects malformed email addresses', () => {
      assert.equal(isValidEmailAddress(''), false);
      assert.equal(isValidEmailAddress('plainaddress'), false);
      assert.equal(isValidEmailAddress('@missingusername.com'), false);
      assert.equal(isValidEmailAddress('missingdomain@'), false);
      assert.equal(isValidEmailAddress('has space@solent.co.uk'), false);
    });
  });

  describe('validateEmailPayload', () => {
    it('accepts a fully valid payload with HTML', () => {
      const result = validateEmailPayload({
        to: 'client@solent.co.uk',
        subject: 'Order Dispatch Notification',
        html: '<p>Your order has been dispatched.</p>',
        templateType: 'order_dispatch'
      });
      assert.equal(result.isValid, true);
      assert.deepEqual(result.recipients, ['client@solent.co.uk']);
    });

    it('accepts payload with multiple valid recipients and text only', () => {
      const result = validateEmailPayload({
        to: ['skipper1@solent.co.uk', 'skipper2@solent.co.uk'],
        subject: 'Pontoon Sign-off',
        text: 'Work completed successfully on pontoon B12.',
        templateType: 'pontoon_signoff'
      });
      assert.equal(result.isValid, true);
      assert.equal(result.recipients?.length, 2);
    });

    it('rejects empty or non-object payloads', () => {
      assert.equal(validateEmailPayload(null).isValid, false);
      assert.equal(validateEmailPayload('not an object').isValid, false);
    });

    it('rejects missing or empty recipient', () => {
      assert.equal(validateEmailPayload({ subject: 'Test', html: '<p>Hi</p>' }).isValid, false);
      assert.equal(validateEmailPayload({ to: [], subject: 'Test', html: '<p>Hi</p>' }).isValid, false);
      assert.equal(validateEmailPayload({ to: 'invalid-email', subject: 'Test', html: '<p>Hi</p>' }).isValid, false);
    });

    it('rejects payloads with missing subject', () => {
      const result = validateEmailPayload({
        to: 'client@solent.co.uk',
        subject: '',
        html: '<p>Content</p>'
      });
      assert.equal(result.isValid, false);
      assert.match(result.error || '', /subject is required/i);
    });

    it('rejects payloads missing both HTML and text', () => {
      const result = validateEmailPayload({
        to: 'client@solent.co.uk',
        subject: 'Test Subject'
      });
      assert.equal(result.isValid, false);
      assert.match(result.error || '', /either HTML or text/i);
    });

    it('rejects invalid template types', () => {
      const result = validateEmailPayload({
        to: 'client@solent.co.uk',
        subject: 'Test',
        html: '<p>Hi</p>',
        templateType: 'unrecognized_template' as any
      });
      assert.equal(result.isValid, false);
      assert.match(result.error || '', /Invalid email templateType/i);
    });

    it('rejects invalid replyTo address', () => {
      const result = validateEmailPayload({
        to: 'client@solent.co.uk',
        subject: 'Test',
        html: '<p>Hi</p>',
        replyTo: 'not-an-email'
      });
      assert.equal(result.isValid, false);
      assert.match(result.error || '', /Invalid replyTo/i);
    });
  });
});
