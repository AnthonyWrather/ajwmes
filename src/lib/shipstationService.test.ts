import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { 
  fetchLiveCarrierRates, 
  generateCarrierShippingLabel, 
  generateThermalLabelSvg 
} from './shipstationService';
import { 
  resolveShipStationConfig, 
  setCustomShipStationApiKey, 
  clearCustomShipStationApiKey,
  getCustomShipStationApiKey
} from './shipstationConfig';
import { PostalOrder } from '../types';

describe('shipstationService and shipstationConfig Suite', () => {
  beforeEach(() => {
    clearCustomShipStationApiKey();
  });

  const mockOrder: PostalOrder = {
    id: 'po-test-101',
    orderNumber: 'PO-2026-0042',
    customerName: 'Captain James Cook',
    customerEmail: 'j.cook@endeavour.marina',
    customerPhone: '07700 900123',
    shippingAddress: {
      fullName: 'Captain James Cook',
      email: 'j.cook@endeavour.marina',
      phone: '07700 900123',
      addressLine1: 'Berth 42, Pontoon B',
      city: 'Cowes',
      postcode: 'PO31 7DL',
      isMarinaDelivery: true,
      marinaName: 'Cowes Yacht Haven',
      berthNumber: 'Pontoon B-42'
    },
    shippingMethod: 'royal_mail_tracked',
    shippingCost: 4.85,
    items: [
      {
        itemId: 'cable-01',
        name: '50mm² Marine Battery Cable (Red)',
        unit: 'm',
        quantity: 3,
        unitPrice: 12.0,
        lineTotal: 36.0
      }
    ],
    subtotal: 36.0,
    total: 40.85,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    orderStatus: 'packed',
    createdAt: '2026-10-19'
  };

  describe('shipstationConfig', () => {
    it('should default to simulated mode when no custom key is configured', () => {
      const config = resolveShipStationConfig();
      assert.strictEqual(config.mode, 'simulated');
      assert.ok(config.carrierDefaults.royalMailServiceCode);
    });

    it('should persist and retrieve custom API key', () => {
      setCustomShipStationApiKey('test_ss_live_key_987654321');
      const retrieved = getCustomShipStationApiKey();
      assert.strictEqual(retrieved, 'test_ss_live_key_987654321');

      const config = resolveShipStationConfig();
      assert.strictEqual(config.mode, 'live');

      clearCustomShipStationApiKey();
      assert.strictEqual(getCustomShipStationApiKey(), null);
    });
  });

  describe('fetchLiveCarrierRates', () => {
    it('should calculate live quotes based on order dimensions and postcode', async () => {
      const quotes = await fetchLiveCarrierRates(mockOrder);
      assert.ok(Array.isArray(quotes));
      assert.strictEqual(quotes.length, 3);
      
      const rm24 = quotes.find(q => q.serviceCode === 'royal_mail_tracked_24');
      assert.ok(rm24);
      assert.ok(rm24.shipmentCostPounds > 0);
      // Cowes PO31 has Isle of Wight surcharge
      assert.strictEqual(rm24.otherCostPounds, 2.50);
    });
  });

  describe('generateCarrierShippingLabel', () => {
    it('should generate simulated label result with tracking and SVG data URI', async () => {
      const result = await generateCarrierShippingLabel(mockOrder);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.isSimulated, true);
      assert.strictEqual(result.carrierCode, 'royal_mail');
      assert.match(result.trackingNumber, /^GB\d{9}RM$/);
      assert.match(result.shipmentId, /^shp_sim_/);
      assert.ok(result.labelUrl?.startsWith('data:image/svg+xml'));
      assert.ok(result.labelPdfBase64?.startsWith('data:image/svg+xml'));
    });

    it('should generate DPD label if DPD service code is selected', async () => {
      const result = await generateCarrierShippingLabel(mockOrder, 'dpd_next_day');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.carrierCode, 'dpd_uk');
      assert.match(result.trackingNumber, /^1550\d{10}$/);
    });
  });

  describe('generateThermalLabelSvg', () => {
    it('should generate SVG markup containing crucial order and carrier details', () => {
      const svg = generateThermalLabelSvg(
        mockOrder,
        'royal_mail',
        'Royal Mail Tracked 24',
        'GB123456789RM',
        { weightKg: 2.1, lengthCm: 28, widthCm: 20, heightCm: 10 }
      );

      assert.ok(svg.includes('ROYAL MAIL TRACKED 24'));
      assert.ok(svg.includes('PO-2026-0042'));
      assert.ok(svg.includes('CAPTAIN JAMES COOK'));
      assert.ok(svg.includes('PO31 7DL'));
      assert.ok(svg.includes('COWES YACHT HAVEN'));
      assert.ok(svg.includes('GB123456789RM'));
      assert.ok(svg.includes('2.1 kg'));
    });
  });
});
