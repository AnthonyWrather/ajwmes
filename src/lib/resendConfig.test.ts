import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { 
  isValidResendApiKey, 
  getCustomResendApiKey, 
  setCustomResendApiKey, 
  clearCustomResendApiKey,
  resolveResendConfig,
  DEFAULT_RESEND_FROM
} from './resendConfig';

describe('Resend API Key Management & Validation', () => {
  beforeEach(() => {
    clearCustomResendApiKey();
  });

  describe('isValidResendApiKey', () => {
    it('accepts valid Resend API keys with re_ prefix and adequate length', () => {
      const validKey = 're_1234567890abcdef12345678';
      assert.equal(isValidResendApiKey(validKey), true);
    });

    it('rejects keys that do not start with re_', () => {
      assert.equal(isValidResendApiKey('AIzaSyCeLVmFhxzY8Ojh2NFUvuyGax-LVDk5tIg'), false);
      assert.equal(isValidResendApiKey('sk_live_1234567890abcdef'), false);
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

  describe('Custom Key Persistence (LocalStorage / Memory Backend)', () => {
    it('saves, retrieves, and clears custom API key', () => {
      const testKey = 're_live_solent_test_key_987654321';

      setCustomResendApiKey(testKey);
      assert.equal(getCustomResendApiKey(), testKey);

      const config = resolveResendConfig();
      assert.equal(config.apiKey, testKey);
      assert.equal(config.isConfigured, true);
      assert.equal(config.isSimulatedMode, false);

      clearCustomResendApiKey();
      assert.equal(getCustomResendApiKey(), null);

      const clearedConfig = resolveResendConfig();
      assert.equal(clearedConfig.isConfigured, false);
      assert.equal(clearedConfig.isSimulatedMode, true);
    });

    it('ignores invalid keys during persistence', () => {
      setCustomResendApiKey('invalid-key');
      assert.equal(getCustomResendApiKey(), null);
    });
  });

  describe('Default Configuration Resolution', () => {
    it('provides standard marine notifications sender address by default', () => {
      const config = resolveResendConfig();
      assert.equal(config.fromEmail, DEFAULT_RESEND_FROM);
      assert.equal(config.fromName, 'AJW Marine Electrical Services');
      assert.equal(config.replyTo, 'info@ajwmes.co.uk');
    });
  });
});
