import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateItemWeightKg,
  calculateConsignmentDimensions,
  isSolentOrOffshorePostcode,
  mapShippingMethodToCarrierService,
  estimateCarrierRates,
  generateSimulatedTrackingNumber,
  generateSimulatedShipmentId
} from './shipstationCalculations';
import { PostalOrderItem, CatalogItem } from '../types';

describe('shipstationCalculations Utility Suite', () => {
  const sampleCatalog: CatalogItem[] = [
    {
      id: 'cat-victron-1',
      category: 'Inverters',
      name: 'Victron MultiPlus-II 12/3000/120',
      specification: '3kVA 120A Inverter Charger',
      unit: 'pcs',
      unitPrice: 1045.0,
      inStock: true,
      stockCount: 4,
      weightKg: 18.2
    },
    {
      id: 'cat-fuse-1',
      category: 'Consumables',
      name: 'Mega Fuse 250A 32V',
      specification: 'Marine rated',
      unit: 'pcs',
      unitPrice: 4.5,
      inStock: true,
      stockCount: 50,
      weightKg: 0.05
    }
  ];

  describe('estimateItemWeightKg', () => {
    it('should use explicit weightKg from catalog item when present', () => {
      const item: PostalOrderItem = {
        itemId: 'cat-victron-1',
        name: 'Victron MultiPlus-II 12/3000/120',
        unit: 'pcs',
        quantity: 1,
        unitPrice: 1045,
        lineTotal: 1045
      };
      const weight = estimateItemWeightKg(item, sampleCatalog);
      assert.strictEqual(weight, 18.2);
    });

    it('should fall back to regex heuristic for marine battery cables', () => {
      const item: PostalOrderItem = {
        itemId: 'unknown-cable',
        name: 'OceanFlex 70mm² Tinned Battery Cable Red',
        unit: 'm',
        quantity: 5,
        unitPrice: 14.5,
        lineTotal: 72.5
      };
      const weight = estimateItemWeightKg(item);
      assert.strictEqual(weight, 0.76);
    });

    it('should fall back to regex heuristic for custom switch panels', () => {
      const item: PostalOrderItem = {
        itemId: 'panel-01',
        name: 'Custom 12-Way Marine Switch Panel (Laser Cut)',
        unit: 'unit',
        quantity: 1,
        unitPrice: 280,
        lineTotal: 280
      };
      const weight = estimateItemWeightKg(item);
      assert.strictEqual(weight, 1.85);
    });

    it('should fall back to 0.15kg default for unrecognized items without catalog match', () => {
      const item: PostalOrderItem = {
        itemId: 'misc-99',
        name: 'Stainless Steel Fastener Bracket',
        unit: 'pcs',
        quantity: 2,
        unitPrice: 8,
        lineTotal: 16
      };
      const weight = estimateItemWeightKg(item);
      assert.strictEqual(weight, 0.15);
    });
  });

  describe('calculateConsignmentDimensions', () => {
    it('should return minimum parcel specs when items list is empty', () => {
      const dim = calculateConsignmentDimensions([]);
      assert.strictEqual(dim.weightKg, 0.25);
      assert.strictEqual(dim.lengthCm, 22);
      assert.strictEqual(dim.widthCm, 16);
      assert.strictEqual(dim.heightCm, 6);
    });

    it('should calculate dimensions and tare for light consumables', () => {
      const items: PostalOrderItem[] = [
        {
          itemId: 'fuse-1',
          name: 'Mega Fuse 125A',
          unit: 'pcs',
          quantity: 2,
          unitPrice: 4.5,
          lineTotal: 9.0
        }
      ];
      const dim = calculateConsignmentDimensions(items);
      // 2 * 0.04kg + 0.20kg tare = 0.28kg
      assert.strictEqual(dim.weightKg, 0.28);
      assert.strictEqual(dim.lengthCm, 28);
      assert.strictEqual(dim.widthCm, 20);
      assert.strictEqual(dim.heightCm, 10);
    });

    it('should use large heavy parcel box for inverters or items over 8kg', () => {
      const items: PostalOrderItem[] = [
        {
          itemId: 'victron-inverter',
          name: 'Victron MultiPlus Compact 12/2000/80',
          unit: 'pcs',
          quantity: 1,
          unitPrice: 850,
          lineTotal: 850
        }
      ];
      const dim = calculateConsignmentDimensions(items);
      assert.ok(dim.weightKg > 8.0);
      assert.strictEqual(dim.lengthCm, 52);
      assert.strictEqual(dim.widthCm, 38);
      assert.strictEqual(dim.heightCm, 28);
    });

    it('should use medium parcel box for switch panels', () => {
      const items: PostalOrderItem[] = [
        {
          itemId: 'panel-item',
          name: 'Custom 8-Way Marine Switch Panel',
          unit: 'unit',
          quantity: 1,
          unitPrice: 195,
          lineTotal: 195
        }
      ];
      const dim = calculateConsignmentDimensions(items);
      assert.strictEqual(dim.lengthCm, 42);
      assert.strictEqual(dim.widthCm, 32);
      assert.strictEqual(dim.heightCm, 18);
    });
  });

  describe('isSolentOrOffshorePostcode', () => {
    it('should identify Isle of Wight postcodes correctly', () => {
      const cowes = isSolentOrOffshorePostcode('PO31 7DL');
      assert.strictEqual(cowes.isOffshore, true);
      assert.strictEqual(cowes.isIsleOfWight, true);
      assert.strictEqual(cowes.isChannelIslands, false);
      assert.strictEqual(cowes.surchargePounds, 2.50);

      const ryde = isSolentOrOffshorePostcode('PO33 2JN');
      assert.strictEqual(ryde.isIsleOfWight, true);
    });

    it('should identify Channel Islands postcodes correctly', () => {
      const guernsey = isSolentOrOffshorePostcode('GY1 1AA');
      assert.strictEqual(guernsey.isOffshore, true);
      assert.strictEqual(guernsey.isChannelIslands, true);
      assert.strictEqual(guernsey.isIsleOfWight, false);
      assert.strictEqual(guernsey.surchargePounds, 5.50);

      const jersey = isSolentOrOffshorePostcode('JE2 3QP');
      assert.strictEqual(jersey.isChannelIslands, true);
      assert.strictEqual(jersey.surchargePounds, 5.50);
    });

    it('should classify UK mainland postcodes with zero offshore surcharge', () => {
      const gosport = isSolentOrOffshorePostcode('PO12 1NU');
      assert.strictEqual(gosport.isOffshore, false);
      assert.strictEqual(gosport.surchargePounds, 0);

      const southampton = isSolentOrOffshorePostcode('SO14 3TG');
      assert.strictEqual(southampton.isOffshore, false);
      assert.strictEqual(southampton.surchargePounds, 0);
    });
  });

  describe('mapShippingMethodToCarrierService', () => {
    it('should map royal_mail_tracked to Royal Mail Tracked 24', () => {
      const result = mapShippingMethodToCarrierService('royal_mail_tracked');
      assert.strictEqual(result.carrierCode, 'royal_mail');
      assert.strictEqual(result.serviceCode, 'royal_mail_tracked_24');
    });

    it('should map dpd_heavy to DPD UK Next Day Courier', () => {
      const result = mapShippingMethodToCarrierService('dpd_heavy');
      assert.strictEqual(result.carrierCode, 'dpd_uk');
      assert.strictEqual(result.serviceCode, 'dpd_next_day');
    });

    it('should map solent_pickup to workshop collection', () => {
      const result = mapShippingMethodToCarrierService('solent_pickup');
      assert.strictEqual(result.carrierCode, 'royal_mail');
      assert.strictEqual(result.serviceCode, 'workshop_collection');
    });
  });

  describe('estimateCarrierRates', () => {
    it('should generate rate quotes for royal mail and DPD', () => {
      const dimensions = { weightKg: 1.5, lengthCm: 28, widthCm: 20, heightCm: 10 };
      const quotes = estimateCarrierRates(dimensions, 'PO12 1NU');

      assert.strictEqual(quotes.length, 3);
      const rm24 = quotes.find(q => q.serviceCode === 'royal_mail_tracked_24');
      const rm48 = quotes.find(q => q.serviceCode === 'royal_mail_tracked_48');
      const dpd = quotes.find(q => q.serviceCode === 'dpd_next_day');

      assert.ok(rm24 && rm24.shipmentCostPounds > 0);
      assert.ok(rm48 && rm48.shipmentCostPounds > 0);
      assert.ok(dpd && dpd.shipmentCostPounds > 0);
      assert.ok(rm24.shipmentCostPounds > rm48.shipmentCostPounds);
    });

    it('should apply offshore surcharges for Channel Islands', () => {
      const dimensions = { weightKg: 1.5, lengthCm: 28, widthCm: 20, heightCm: 10 };
      const quotes = estimateCarrierRates(dimensions, 'GY1 1AA');
      for (const quote of quotes) {
        assert.strictEqual(quote.otherCostPounds, 5.50);
      }
    });
  });

  describe('generateSimulatedTrackingNumber & generateSimulatedShipmentId', () => {
    it('should format simulated Royal Mail tracking number as GB + 9 digits + RM', () => {
      const tn = generateSimulatedTrackingNumber('royal_mail');
      assert.match(tn, /^GB\d{9}RM$/);
    });

    it('should format simulated DPD tracking number as 1550 + 10 digits', () => {
      const tn = generateSimulatedTrackingNumber('dpd_uk');
      assert.match(tn, /^1550\d{10}$/);
    });

    it('should generate valid shipment reference string', () => {
      const id = generateSimulatedShipmentId();
      assert.match(id, /^shp_sim_[a-f0-9]+_\d{4}$/);
    });
  });
});
