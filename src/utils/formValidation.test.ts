import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEmail,
  validateUkPhone,
  validateBookingQuoteForm,
  validateVesselSpecForm,
  validateSwitchConfig
} from './formValidation';
import { SwitchConfig, VesselSpec } from '../types';

describe('formValidation', () => {
  describe('validateEmail', () => {
    it('accepts valid email addresses and normalizes to lowercase', () => {
      const result1 = validateEmail('AnthonyWrather@Gmail.Com');
      assert.equal(result1.isValid, true);
      assert.equal(result1.formatted, 'anthonywrather@gmail.com');

      const result2 = validateEmail('  admin@ajwmes.co.uk  ');
      assert.equal(result2.isValid, true);
      assert.equal(result2.formatted, 'admin@ajwmes.co.uk');

      const result3 = validateEmail('skipper+solent@cowes-marina.org');
      assert.equal(result3.isValid, true);
    });

    it('rejects empty, missing, or whitespace-only emails', () => {
      assert.equal(validateEmail('').isValid, false);
      assert.equal(validateEmail('   ').isValid, false);
      assert.equal(validateEmail(undefined as unknown as string).isValid, false);
    });

    it('rejects malformed email formats', () => {
      assert.equal(validateEmail('plainaddress').isValid, false);
      assert.equal(validateEmail('missingdomain@').isValid, false);
      assert.equal(validateEmail('@nodomain.com').isValid, false);
      assert.equal(validateEmail('user@domain').isValid, false);
      assert.equal(validateEmail('user@.com').isValid, false);
    });
  });

  describe('validateUkPhone', () => {
    it('accepts and normalizes valid standard UK mobile numbers', () => {
      const mob1 = validateUkPhone('07700 900551');
      assert.equal(mob1.isValid, true);
      assert.equal(mob1.formatted, '07700 900551');

      const mob2 = validateUkPhone('07700900551');
      assert.equal(mob2.isValid, true);
      assert.equal(mob2.formatted, '07700 900551');

      const mobDashes = validateUkPhone('07700-900-551');
      assert.equal(mobDashes.isValid, true);
      assert.equal(mobDashes.formatted, '07700 900551');
    });

    it('accepts and normalizes international UK numbers (+44 / 0044)', () => {
      const intlPlus = validateUkPhone('+44 7700 900551');
      assert.equal(intlPlus.isValid, true);
      assert.equal(intlPlus.formatted, '07700 900551');

      const intl00 = validateUkPhone('0044 7700 900551');
      assert.equal(intl00.isValid, true);
      assert.equal(intl00.formatted, '07700 900551');
    });

    it('accepts Solent area landlines (023 Portsmouth/Southampton, 01983 Isle of Wight)', () => {
      const portsmouth = validateUkPhone('02392 123456');
      assert.equal(portsmouth.isValid, true);

      const iow = validateUkPhone('01983 821000');
      assert.equal(iow.isValid, true);
    });

    it('rejects invalid or incomplete phone numbers', () => {
      assert.equal(validateUkPhone('12345').isValid, false);
      assert.equal(validateUkPhone('07700abc').isValid, false);
      assert.equal(validateUkPhone('+1 555 1234567').isValid, false); // US number
    });

    it('handles optional phone vs required phone correctly', () => {
      // Optional: empty string is valid
      assert.equal(validateUkPhone('', false).isValid, true);
      assert.equal(validateUkPhone('   ', false).isValid, true);

      // Required: empty string is invalid
      assert.equal(validateUkPhone('', true).isValid, false);
    });
  });

  describe('validateBookingQuoteForm', () => {
    const validBooking = {
      clientName: 'David Mercer',
      clientEmail: 'd.mercer@solent-sail.co.uk',
      clientPhone: '07700 900114',
      vesselName: 'Windbird III',
      berthLocation: 'Haslar Marina, Gosport (Pontoon E-14)'
    };

    it('passes for complete, valid diagnostic quote requests', () => {
      const result = validateBookingQuoteForm(validBooking);
      assert.equal(result.isValid, true);
      assert.deepEqual(result.errors, {});
    });

    it('flags missing client name or short name', () => {
      const invalid = { ...validBooking, clientName: 'A' };
      const result = validateBookingQuoteForm(invalid);
      assert.equal(result.isValid, false);
      assert.ok(result.errors.clientName);
    });

    it('flags invalid email addresses', () => {
      const invalid = { ...validBooking, clientEmail: 'notanemail' };
      const result = validateBookingQuoteForm(invalid);
      assert.equal(result.isValid, false);
      assert.ok(result.errors.clientEmail);
    });

    it('flags invalid telephone numbers when provided', () => {
      const invalid = { ...validBooking, clientPhone: 'badphone123' };
      const result = validateBookingQuoteForm(invalid);
      assert.equal(result.isValid, false);
      assert.ok(result.errors.clientPhone);
    });

    it('flags missing vessel name', () => {
      const invalid = { ...validBooking, vesselName: ' ' };
      const result = validateBookingQuoteForm(invalid);
      assert.equal(result.isValid, false);
      assert.ok(result.errors.vesselName);
    });

    it('captures multiple errors simultaneously', () => {
      const invalid = {
        clientName: '',
        clientEmail: 'bad-email',
        clientPhone: '999',
        vesselName: '',
        berthLocation: ''
      };
      const result = validateBookingQuoteForm(invalid);
      assert.equal(result.isValid, false);
      assert.ok(result.errors.clientName);
      assert.ok(result.errors.clientEmail);
      assert.ok(result.errors.clientPhone);
      assert.ok(result.errors.vesselName);
      assert.ok(result.errors.berthLocation);
    });
  });

  describe('validateVesselSpecForm', () => {
    it('passes for valid vessel electrical specifications', () => {
      const validSpec: Partial<VesselSpec> = {
        vesselName: 'Kestrel of Hamble',
        systemVoltage: '12V',
        houseCapacityAh: 400,
        solarWatts: 350,
        year: 2018
      };
      const result = validateVesselSpecForm(validSpec);
      assert.equal(result.isValid, true);
      assert.deepEqual(result.errors, {});
    });

    it('rejects missing vessel name', () => {
      const result = validateVesselSpecForm({ vesselName: '' });
      assert.equal(result.isValid, false);
      assert.ok(result.errors.vesselName);
    });

    it('rejects unsupported system voltage values', () => {
      const result = validateVesselSpecForm({
        vesselName: 'Test Yacht',
        systemVoltage: '48V' as unknown as VesselSpec['systemVoltage']
      });
      assert.equal(result.isValid, false);
      assert.ok(result.errors.systemVoltage);
    });

    it('rejects negative or impossible battery capacities', () => {
      const negResult = validateVesselSpecForm({
        vesselName: 'Test Boat',
        houseCapacityAh: -100
      });
      assert.equal(negResult.isValid, false);
      assert.ok(negResult.errors.houseCapacityAh);

      const hugeResult = validateVesselSpecForm({
        vesselName: 'Test Boat',
        houseCapacityAh: 999999
      });
      assert.equal(hugeResult.isValid, false);
      assert.ok(hugeResult.errors.houseCapacityAh);
    });

    it('rejects unreasonable vessel build years', () => {
      const oldResult = validateVesselSpecForm({
        vesselName: 'Old Boat',
        year: 1850
      });
      assert.equal(oldResult.isValid, false);
      assert.ok(oldResult.errors.year);
    });
  });

  describe('validateSwitchConfig', () => {
    const validSwitches: SwitchConfig[] = [
      { position: 1, label: 'NAV LIGHTS', breakerRatingAmps: 10, switchType: 'rocker_illuminated' },
      { position: 2, label: 'BILGE PUMP', breakerRatingAmps: 15, switchType: 'rocker_illuminated' },
      { position: 3, label: 'VHF RADIO', breakerRatingAmps: 10, switchType: 'rocker_illuminated' },
      { position: 4, label: 'CABIN LIGHTS', breakerRatingAmps: 10, switchType: 'rocker_illuminated' }
    ];

    it('passes for matching gang count and valid breaker configurations', () => {
      const result = validateSwitchConfig(validSwitches, 4);
      assert.equal(result.isValid, true);
      assert.equal(result.errors.length, 0);
    });

    it('flags gang count mismatches', () => {
      const result = validateSwitchConfig(validSwitches, 6);
      assert.equal(result.isValid, false);
      assert.match(result.errors[0], /gang count/i);
    });

    it('flags blank circuit labels', () => {
      const invalid = [
        ...validSwitches.slice(0, 3),
        { position: 4, label: '   ', breakerRatingAmps: 10, switchType: 'rocker_illuminated' as const }
      ];
      const result = validateSwitchConfig(invalid, 4);
      assert.equal(result.isValid, false);
      assert.match(result.errors[0], /circuit label cannot be blank/i);
    });

    it('flags breaker ratings outside safe marine ranges (<5A or >60A)', () => {
      const tooLow = [
        ...validSwitches.slice(0, 3),
        { position: 4, label: 'AUX', breakerRatingAmps: 2, switchType: 'rocker_illuminated' as const }
      ];
      const resultLow = validateSwitchConfig(tooLow, 4);
      assert.equal(resultLow.isValid, false);
      assert.match(resultLow.errors[0], /must be between 5A and 60A/i);

      const tooHigh = [
        ...validSwitches.slice(0, 3),
        { position: 4, label: 'AUX', breakerRatingAmps: 100, switchType: 'rocker_illuminated' as const }
      ];
      const resultHigh = validateSwitchConfig(tooHigh, 4);
      assert.equal(resultHigh.isValid, false);
      assert.match(resultHigh.errors[0], /must be between 5A and 60A/i);
    });
  });
});
