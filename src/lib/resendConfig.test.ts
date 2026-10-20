import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  isValidResendApiKey, 
  resolveResendConfig,
  DEFAULT_RESEND_FROM,
  DEFAULT_RESEND_REPLY_TO
} from './resendConfig';

describe('Resend Configuration & Validation', () => {
  describe('isValidResendApiKey', () => {
    it('accepts valid Resend API keys with re_ prefix and adequate length', () => {
      const validKey = 're_1234567890abcdef12345678';
      assert.equal(isValidResendApiKey(validKey), true);
    });

    it('rejects keys that do not start with re_', () => {
      assert.equal(isValidResendApiKey('AIzaSyCeLVmFhxzY8Ojh2NFUvuyGax-LVDk5tIg'), false);
      assert.equal(isValidResendApiKey('invalid_format_test_1234567890abcdef'), false);
    });

    it('rejects keys shorter than 24 characters', () => {
      assert.equal(isValidResendApiKey('re_short123'), false);
    });

    it('rejects keys with whitespace or placeholder text', () => {
      assert.equal(isValidResendApiKey('re_1234567890 your_api_key_here'), false);
      assert.equal(isValidResendApiKey('re_1234567890 placeholder_key_123'), false);
      assert.equal(isValidResendApiKey('re_1234567890<REPLACE_ME>12345'), false);
    });

    it('rejects non-string or null values safely', () => {
      assert.equal(isValidResendApiKey(null), false);
      assert.equal(isValidResendApiKey(undefined), false);
      assert.equal(isValidResendApiKey(12345), false);
      assert.equal(isValidResendApiKey({}), false);
    });
  });

  describe('Server-Side Gateway Configuration Resolution', () => {
    it('provides standard marine notifications sender and reply-to addresses', () => {
      const config = resolveResendConfig();
      assert.equal(config.fromEmail, DEFAULT_RESEND_FROM);
      assert.equal(config.fromName, 'AJW Marine Electrical Services');
      assert.equal(config.replyTo, DEFAULT_RESEND_REPLY_TO);
    });

    it('never exposes client-side API keys in resolved config', () => {
      const config = resolveResendConfig();
      assert.equal(config.apiKey, '');
      assert.equal(config.isConfigured, true);
    });
  });
});
