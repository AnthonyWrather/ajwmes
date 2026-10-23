import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { 
  getEnvironmentSeedData, 
  resetEnvironmentToTestData, 
  getEnvKey, 
  getEnvStorageItem, 
  setEnvStorageItem, 
  removeEnvStorageItem,
  exportEnvironmentData,
  EnvironmentSeedData
} from './envStorage';
import { PostalOrderItem } from '../types';

describe('Environment Scoped Storage & Seed Data Manager', () => {
  describe('getEnvironmentSeedData', () => {
    it('returns fully-typed EnvironmentSeedData for aistudio-dev environment', () => {
      const seed: EnvironmentSeedData = getEnvironmentSeedData('aistudio-dev');
      assert.ok(seed, 'Seed data should be defined');
      assert.ok(Array.isArray(seed.jobs) && seed.jobs.length > 0, 'Should include dev jobs');
      assert.ok(Array.isArray(seed.postalOrders) && seed.postalOrders.length > 0, 'Should include dev postal orders');
      assert.ok(Array.isArray(seed.vessels) && seed.vessels.length > 0, 'Should include vessels array without as any');
      assert.ok(seed.vesselSpec && typeof seed.vesselSpec.vesselName === 'string', 'Should include dev vesselSpec');
      assert.ok(Array.isArray(seed.catalog) && seed.catalog.length > 0, 'Should include catalog items');
      assert.ok(Array.isArray(seed.categories) && seed.categories.length > 0, 'Should include catalog categories');
      assert.ok(Array.isArray(seed.users) && seed.users.length > 0, 'Should include dev users');
      assert.ok(Array.isArray(seed.expenses) && seed.expenses.length > 0, 'Should include expenses');
    });

    it('returns fully-typed EnvironmentSeedData for aistudio-preview environment', () => {
      const seed: EnvironmentSeedData = getEnvironmentSeedData('aistudio-preview');
      assert.ok(seed, 'Seed data should be defined');
      assert.ok(Array.isArray(seed.vessels) && seed.vessels.length > 0, 'Should include preview vessels array');
      assert.ok(seed.vesselSpec && seed.vesselSpec.vesselName.includes('Preview'), 'Should include preview vessel');
    });

    it('returns fully-typed EnvironmentSeedData for github-preview environment', () => {
      const seed: EnvironmentSeedData = getEnvironmentSeedData('github-preview');
      assert.ok(seed, 'Seed data should be defined');
      assert.ok(Array.isArray(seed.vessels) && seed.vessels.length > 0, 'Should include preview vessels array');
      assert.ok(seed.users.every(u => u.environment === 'github-preview'), 'All users tagged with preview env');
    });

    it('returns production baseline with empty default data for github-deployed environment', () => {
      const seed: EnvironmentSeedData = getEnvironmentSeedData('github-deployed');
      assert.ok(seed, 'Seed data should be defined');
      assert.deepEqual(seed.jobs, [], 'Production jobs start empty');
      assert.deepEqual(seed.postalOrders, [], 'Production postal orders start empty');
      assert.deepEqual(seed.catalog, [], 'Production catalog starts empty');
      assert.deepEqual(seed.categories, [], 'Production categories start empty');
      assert.deepEqual(seed.vessels, [], 'Production custom vessels start empty');
      assert.equal(seed.vesselSpec.id, 'vessel-prod-solent');
    });
  });

  describe('getEnvKey', () => {
    it('generates properly formatted environment-namespaced storage keys', () => {
      assert.equal(getEnvKey('vessels', 'aistudio-dev'), 'ajwmes_aistudio_dev_vessels');
      assert.equal(getEnvKey('jobs', 'aistudio-preview'), 'ajwmes_aistudio_preview_jobs');
      assert.equal(getEnvKey('orders', 'github-preview'), 'ajwmes_github_preview_orders');
      assert.equal(getEnvKey('users', 'github-deployed'), 'ajwmes_github_deployed_users');
    });
  });

  describe('Storage CRUD & Fallback Behaviors', () => {
    it('persists and retrieves items under environment-scoped keys', () => {
      const testVessels = [{ id: 'test-vessel-1', vesselName: 'Test Cutter', year: 2020 }];
      setEnvStorageItem('test_vessels', testVessels, 'aistudio-dev');

      const retrieved = getEnvStorageItem('test_vessels', [], 'aistudio-dev');
      assert.deepEqual(retrieved, testVessels);

      removeEnvStorageItem('test_vessels', 'aistudio-dev');
      const afterRemoval = getEnvStorageItem('test_vessels', [{ fallback: true }], 'aistudio-dev');
      assert.deepEqual(afterRemoval, [{ fallback: true }]);
    });

    it('returns fallback default when key does not exist', () => {
      const fallback = { empty: true };
      const retrieved = getEnvStorageItem('non_existent_key_123', fallback, 'aistudio-dev');
      assert.deepEqual(retrieved, fallback);
    });
  });

  describe('resetEnvironmentToTestData', () => {
    it('resets environment local storage and returns typed EnvironmentSeedData', () => {
      const resetSeed = resetEnvironmentToTestData('aistudio-dev');
      assert.ok(resetSeed);
      assert.ok(Array.isArray(resetSeed.vessels));

      const storedJobs = getEnvStorageItem('jobs', [], 'aistudio-dev');
      assert.equal(storedJobs.length, resetSeed.jobs.length);

      const storedVessels = getEnvStorageItem('vessels', [], 'aistudio-dev');
      assert.equal(storedVessels.length, resetSeed.vessels.length);
    });
  });

  describe('exportEnvironmentData', () => {
    it('exports complete snapshot of current environment storage', () => {
      const exported = exportEnvironmentData('aistudio-dev');
      assert.equal(exported.environment, 'aistudio-dev');
      assert.ok(exported.exportedAt);
      assert.ok(Array.isArray(exported.jobs));
      assert.ok(Array.isArray(exported.catalog));
      assert.ok(Array.isArray(exported.postalOrders));
      assert.ok(exported.vesselSpec);
    });
  });

  describe('PostalOrderItem Standardized Contract & Backward Compatibility', () => {
    it('allows standard unitPrice and lineTotal as well as optional legacy price and total aliases', () => {
      const standardItem: PostalOrderItem = {
        itemId: 'item-101',
        name: 'Tinned Battery Cable 25mm²',
        unit: 'per meter',
        quantity: 5,
        unitPrice: 12.50,
        lineTotal: 62.50
      };

      assert.equal(standardItem.unitPrice, 12.50);
      assert.equal(standardItem.lineTotal, 62.50);
      assert.equal(standardItem.price, undefined);
      assert.equal(standardItem.total, undefined);

      const legacyItem: PostalOrderItem = {
        itemId: 'item-legacy-102',
        name: 'Legacy Terminal Block',
        unit: 'each',
        quantity: 2,
        unitPrice: 15.00,
        lineTotal: 30.00,
        price: 15.00,
        total: 30.00
      };

      const resolvedUnitPrice = legacyItem.unitPrice ?? legacyItem.price ?? 0;
      const resolvedLineTotal = legacyItem.lineTotal ?? legacyItem.total ?? 0;
      assert.equal(resolvedUnitPrice, 15.00);
      assert.equal(resolvedLineTotal, 30.00);
    });
  });
});
