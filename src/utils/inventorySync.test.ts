import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  exportItemsToJson,
  exportCategoriesToJson,
  exportFullCatalogToJson,
  parseAndValidateItemsJson,
  parseAndValidateCategoriesJson,
  mergeCatalogItems,
  mergeCategories
} from './inventorySync';
import { CatalogItem, CategoryItem, CatalogSnapshot } from '../types';

describe('inventorySync utility module', () => {
  const sampleItems: CatalogItem[] = [
    {
      id: 'cable-10awg',
      name: '10 AWG Tinned Marine Cable',
      category: 'cable',
      specification: 'Multi-strand marine copper, 30A rated',
      unit: 'per meter',
      unitPrice: 4.50,
      stockCount: 150,
      inStock: true,
      imageUrl: '/assets/images/cable.jpg',
      badge: 'Solent Standard'
    },
    {
      id: 'fuse-block-6way',
      name: 'Blue Sea 6-Way Fuse Block',
      category: 'fuses',
      specification: 'With negative bus, 100A total',
      unit: 'each',
      unitPrice: 48.00,
      stockCount: 0,
      inStock: false
    }
  ];

  const sampleCategories: CategoryItem[] = [
    {
      id: 'cable',
      label: 'Tinned Marine Cable & Wire',
      description: 'Marine-grade multi-strand tinned copper'
    },
    {
      id: 'fuses',
      label: 'Circuit Protection & Fuses',
      description: 'Marine breakers, mega fuses, and fuse blocks'
    }
  ];

  describe('exportItemsToJson', () => {
    it('serializes items to structured envelope JSON', () => {
      const json = exportItemsToJson(sampleItems);
      const parsed = JSON.parse(json);

      assert.equal(parsed.type, 'ajwmes_items');
      assert.equal(parsed.count, 2);
      assert.equal(parsed.items.length, 2);
      assert.equal(parsed.items[0].id, 'cable-10awg');
      assert.ok(parsed.exportedAt);
      assert.ok(parsed.version);
    });

    it('handles empty item array', () => {
      const json = exportItemsToJson([]);
      const parsed = JSON.parse(json);
      assert.equal(parsed.count, 0);
      assert.deepEqual(parsed.items, []);
    });
  });

  describe('exportCategoriesToJson', () => {
    it('serializes categories to structured envelope JSON', () => {
      const json = exportCategoriesToJson(sampleCategories);
      const parsed = JSON.parse(json);

      assert.equal(parsed.type, 'ajwmes_categories');
      assert.equal(parsed.count, 2);
      assert.equal(parsed.categories.length, 2);
      assert.equal(parsed.categories[1].id, 'fuses');
    });
  });

  describe('exportFullCatalogToJson', () => {
    it('serializes complete catalog, categories, and snapshots', () => {
      const snapshots: CatalogSnapshot[] = [
        {
          id: 'snap-1',
          timestamp: '2026-10-15 10:00',
          label: 'Pre-season stock count',
          itemsCount: 2,
          items: sampleItems
        }
      ];

      const json = exportFullCatalogToJson(sampleItems, sampleCategories, snapshots);
      const parsed = JSON.parse(json);

      assert.equal(parsed.type, 'ajwmes_full_catalog');
      assert.equal(parsed.itemsCount, 2);
      assert.equal(parsed.categoriesCount, 2);
      assert.equal(parsed.snapshots.length, 1);
    });
  });

  describe('parseAndValidateItemsJson', () => {
    it('successfully parses envelope format { items: [...] }', () => {
      const envelope = exportItemsToJson(sampleItems);
      const result = parseAndValidateItemsJson(envelope);

      assert.equal(result.success, true);
      assert.equal(result.count, 2);
      assert.equal(result.detectedType, 'items');
      assert.equal(result.data?.[0].id, 'cable-10awg');
      assert.equal(result.data?.[0].unitPrice, 4.50);
    });

    it('successfully parses legacy envelope format { catalog: [...] }', () => {
      const legacyEnvelope = JSON.stringify({
        catalog: sampleItems,
        exportedAt: '2026-10-15'
      });
      const result = parseAndValidateItemsJson(legacyEnvelope);

      assert.equal(result.success, true);
      assert.equal(result.count, 2);
      assert.equal(result.data?.[1].name, 'Blue Sea 6-Way Fuse Block');
    });

    it('successfully parses raw item arrays (Google Sheets export style)', () => {
      const rawArray = JSON.stringify([
        {
          id: 'solar-panel-175w',
          name: 'Victron 175W Rigid Solar Panel',
          category: 'solar',
          price: '165.50', // string from Google Sheets
          stock: '12',     // string from Google Sheets
          unit: 'each'
        }
      ]);

      const result = parseAndValidateItemsJson(rawArray);
      assert.equal(result.success, true);
      assert.equal(result.count, 1);
      assert.equal(result.data?.[0].id, 'solar-panel-175w');
      assert.equal(result.data?.[0].unitPrice, 165.50); // coerced to number
      assert.equal(result.data?.[0].stockCount, 12);     // coerced to number
      assert.equal(result.data?.[0].inStock, true);      // derived from stockCount > 0
    });

    it('coerces negative values and NaN safely', () => {
      const data = JSON.stringify([
        {
          name: 'Test Item',
          unitPrice: -50,
          stockCount: -5
        }
      ]);
      const result = parseAndValidateItemsJson(data);
      assert.equal(result.success, true);
      assert.equal(result.data?.[0].unitPrice, 0);
      assert.equal(result.data?.[0].stockCount, 0);
      assert.equal(result.data?.[0].inStock, false);
    });

    it('rejects invalid JSON syntax with meaningful error message', () => {
      const result = parseAndValidateItemsJson('{ invalid json,');
      assert.equal(result.success, false);
      assert.ok(result.error?.includes('Invalid JSON syntax'));
    });

    it('rejects empty or whitespace content', () => {
      const result = parseAndValidateItemsJson('   ');
      assert.equal(result.success, false);
      assert.ok(result.error?.includes('Empty JSON'));
    });

    it('flags items without a name and returns warnings', () => {
      const data = JSON.stringify([
        { id: 'valid-1', name: 'Valid Item 1' },
        { id: 'invalid-2', unitPrice: 10 } // missing name
      ]);
      const result = parseAndValidateItemsJson(data);
      assert.equal(result.success, true);
      assert.equal(result.count, 1);
      assert.ok(result.warnings && result.warnings.length > 0);
    });

    it('handles duplicate item IDs by taking the latest update and providing a warning', () => {
      const data = JSON.stringify([
        { id: 'item-dup', name: 'First Version', stockCount: 5 },
        { id: 'item-dup', name: 'Second Version', stockCount: 15 }
      ]);
      const result = parseAndValidateItemsJson(data);
      assert.equal(result.success, true);
      assert.equal(result.count, 1);
      assert.equal(result.data?.[0].stockCount, 15);
      assert.ok(result.warnings?.some(w => w.includes('Duplicate item ID')));
    });
  });

  describe('parseAndValidateCategoriesJson', () => {
    it('successfully parses envelope format { categories: [...] }', () => {
      const envelope = exportCategoriesToJson(sampleCategories);
      const result = parseAndValidateCategoriesJson(envelope);

      assert.equal(result.success, true);
      assert.equal(result.count, 2);
      assert.equal(result.data?.[0].id, 'cable');
    });

    it('successfully parses raw category array', () => {
      const raw = JSON.stringify([
        {
          label: 'Inverters & Chargers',
          description: 'Pure sine wave inverters'
        }
      ]);
      const result = parseAndValidateCategoriesJson(raw);
      assert.equal(result.success, true);
      assert.equal(result.count, 1);
      assert.equal(result.data?.[0].id, 'inverters_chargers'); // auto slugified
      assert.equal(result.data?.[0].label, 'Inverters & Chargers');
    });

    it('rejects invalid JSON syntax', () => {
      const result = parseAndValidateCategoriesJson('not-json');
      assert.equal(result.success, false);
      assert.ok(result.error);
    });

    it('skips categories missing label and records warnings', () => {
      const raw = JSON.stringify([
        { id: 'bad-1', description: 'No title' },
        { id: 'good-1', label: 'Good Category' }
      ]);
      const result = parseAndValidateCategoriesJson(raw);
      assert.equal(result.success, true);
      assert.equal(result.count, 1);
      assert.equal(result.data?.[0].id, 'good-1');
      assert.ok(result.warnings?.length);
    });
  });

  describe('mergeCatalogItems', () => {
    const existing: CatalogItem[] = [
      {
        id: 'cable-10awg',
        name: '10 AWG Marine Cable',
        category: 'cable',
        specification: 'Standard spec',
        unit: 'm',
        unitPrice: 4.00,
        stockCount: 50,
        inStock: true,
        imageUrl: '/images/cable.jpg'
      },
      {
        id: 'fuse-100a',
        name: '100A ANL Fuse',
        category: 'fuses',
        specification: 'Gold plated',
        unit: 'each',
        unitPrice: 6.50,
        stockCount: 10,
        inStock: true
      }
    ];

    it('replaces all items when mode is "replace"', () => {
      const newItems: CatalogItem[] = [
        {
          id: 'switch-carling',
          name: 'Carling Rocker Switch',
          category: 'switches',
          specification: 'SPST On/Off',
          unit: 'each',
          unitPrice: 9.50,
          stockCount: 30,
          inStock: true
        }
      ];

      const merged = mergeCatalogItems(existing, newItems, 'replace');
      assert.equal(merged.length, 1);
      assert.equal(merged[0].id, 'switch-carling');
    });

    it('merges & updates stock counts and appends new items when mode is "merge"', () => {
      const updatesFromSheet: CatalogItem[] = [
        // Update stockCount and price on cable-10awg
        {
          id: 'cable-10awg',
          name: '10 AWG Marine Cable',
          category: 'cable',
          specification: 'Standard spec',
          unit: 'm',
          unitPrice: 4.75, // price increase
          stockCount: 120, // restocked!
          inStock: true
        },
        // Brand new item added in Google Sheet
        {
          id: 'switch-carling',
          name: 'Carling Rocker Switch',
          category: 'switches',
          specification: 'SPST On/Off',
          unit: 'each',
          unitPrice: 9.50,
          stockCount: 30,
          inStock: true
        }
      ];

      const merged = mergeCatalogItems(existing, updatesFromSheet, 'merge');
      assert.equal(merged.length, 3); // 2 original + 1 new

      const updatedCable = merged.find(i => i.id === 'cable-10awg');
      assert.ok(updatedCable);
      assert.equal(updatedCable.unitPrice, 4.75);
      assert.equal(updatedCable.stockCount, 120);
      assert.equal(updatedCable.imageUrl, '/images/cable.jpg'); // preserved from existing!

      const untouchedFuse = merged.find(i => i.id === 'fuse-100a');
      assert.ok(untouchedFuse);
      assert.equal(untouchedFuse.stockCount, 10);

      const addedSwitch = merged.find(i => i.id === 'switch-carling');
      assert.ok(addedSwitch);
      assert.equal(addedSwitch.stockCount, 30);
    });
  });

  describe('mergeCategories', () => {
    it('replaces all categories when mode is "replace"', () => {
      const newCats: CategoryItem[] = [
        { id: 'lithium', label: 'Lithium LiFePO4' }
      ];
      const merged = mergeCategories(sampleCategories, newCats, 'replace');
      assert.equal(merged.length, 1);
      assert.equal(merged[0].id, 'lithium');
    });

    it('upserts and merges categories when mode is "merge"', () => {
      const incoming: CategoryItem[] = [
        { id: 'cable', label: 'Tinned Marine Cable & Wire (Updated)', description: 'Solent tested' },
        { id: 'panels', label: 'Switch Panels' }
      ];
      const merged = mergeCategories(sampleCategories, incoming, 'merge');
      assert.equal(merged.length, 3);

      const updatedCable = merged.find(c => c.id === 'cable');
      assert.equal(updatedCable?.label, 'Tinned Marine Cable & Wire (Updated)');
      assert.equal(updatedCable?.description, 'Solent tested');

      const untouchedFuses = merged.find(c => c.id === 'fuses');
      assert.ok(untouchedFuses);

      const addedPanels = merged.find(c => c.id === 'panels');
      assert.ok(addedPanels);
    });
  });
});
