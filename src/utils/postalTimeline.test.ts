import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  getStatusTier, 
  getOrderProgressPercent, 
  buildOrderTimelineSteps, 
  buildOrderTimelineHistory 
} from './postalTimeline';
import { PostalOrder, PostalOrderTimelineEvent } from '../types';

describe('postalTimeline utility module', () => {
  const baseOrder: PostalOrder = {
    id: 'ord-test-101',
    orderNumber: 'AJW-POST-2026-101',
    userId: 'usr-client-001',
    customerName: 'Oliver Sterling',
    customerEmail: 'oliver.sailing@solentmarine.co.uk',
    customerPhone: '07700 900888',
    shippingAddress: {
      fullName: 'Oliver Sterling',
      email: 'oliver.sailing@solentmarine.co.uk',
      phone: '07700 900888',
      addressLine1: 'Haslar Marina',
      addressLine2: 'Berth D-12',
      city: 'Gosport',
      postcode: 'PO12 1NU',
      isMarinaDelivery: true,
      marinaName: 'Haslar Marina',
      berthNumber: 'D-12',
      deliveryNotes: 'Leave in deck locker if skipper ashore'
    },
    items: [
      {
        itemId: 'cat-cable-25mm',
        name: '25mm² Tinned Copper Battery Cable (Red)',
        quantity: 5,
        unitPrice: 8.50,
        unit: 'per meter',
        lineTotal: 42.50
      }
    ],
    subtotal: 42.50,
    shippingCost: 4.50,
    total: 47.00,
    shippingMethod: 'royal_mail_tracked',
    paymentStatus: 'paid',
    paymentMethod: 'card',
    orderStatus: 'received',
    createdAt: '2026-10-16 10:00'
  };

  describe('getStatusTier', () => {
    it('maps received and pending to tier 0', () => {
      assert.strictEqual(getStatusTier('received'), 0);
      assert.strictEqual(getStatusTier('pending'), 0);
    });

    it('maps processing and packed to tier 1', () => {
      assert.strictEqual(getStatusTier('processing'), 1);
      assert.strictEqual(getStatusTier('packed'), 1);
    });

    it('maps ready_for_pickup and dispatched to tier 2', () => {
      assert.strictEqual(getStatusTier('ready_for_pickup'), 2);
      assert.strictEqual(getStatusTier('dispatched'), 2);
    });

    it('maps delivered to tier 3', () => {
      assert.strictEqual(getStatusTier('delivered'), 3);
    });

    it('defaults unknown status to tier 0', () => {
      assert.strictEqual(getStatusTier('unknown' as any), 0);
    });
  });

  describe('getOrderProgressPercent', () => {
    it('returns correct percentage for each lifecycle stage', () => {
      assert.strictEqual(getOrderProgressPercent({ ...baseOrder, orderStatus: 'received' }), 25);
      assert.strictEqual(getOrderProgressPercent({ ...baseOrder, orderStatus: 'packed' }), 50);
      assert.strictEqual(getOrderProgressPercent({ ...baseOrder, orderStatus: 'dispatched' }), 75);
      assert.strictEqual(getOrderProgressPercent({ ...baseOrder, orderStatus: 'delivered' }), 100);
    });
  });

  describe('buildOrderTimelineSteps', () => {
    it('returns exactly 4 standardized steps for received order', () => {
      const steps = buildOrderTimelineSteps(baseOrder);
      assert.strictEqual(steps.length, 4);
      assert.strictEqual(steps[0].key, 'received');
      assert.strictEqual(steps[0].status, 'current');
      assert.strictEqual(steps[1].key, 'packed');
      assert.strictEqual(steps[1].status, 'upcoming');
      assert.strictEqual(steps[2].key, 'dispatched');
      assert.strictEqual(steps[2].status, 'upcoming');
      assert.strictEqual(steps[3].key, 'delivered');
      assert.strictEqual(steps[3].status, 'upcoming');
    });

    it('updates step statuses appropriately for dispatched orders', () => {
      const dispatchedOrder: PostalOrder = {
        ...baseOrder,
        orderStatus: 'dispatched',
        trackingNumber: 'GB987654321RM',
        trackingCarrier: 'Royal Mail Tracked 24'
      };
      const steps = buildOrderTimelineSteps(dispatchedOrder);
      assert.strictEqual(steps[0].status, 'completed');
      assert.strictEqual(steps[1].status, 'completed');
      assert.strictEqual(steps[2].status, 'current');
      assert.strictEqual(steps[3].status, 'upcoming');
      assert.match(steps[2].description, /GB987654321RM/);
    });

    it('formats destination label correctly for marina vs residential address', () => {
      const marinaSteps = buildOrderTimelineSteps(baseOrder);
      assert.match(marinaSteps[3].sublabel, /Haslar Marina/);

      const resOrder: PostalOrder = {
        ...baseOrder,
        shippingAddress: {
          fullName: 'Oliver Sterling',
          email: 'oliver.sailing@solentmarine.co.uk',
          phone: '07700 900888',
          addressLine1: '12 Forton Road',
          city: 'Gosport',
          postcode: 'PO12 4HA',
          isMarinaDelivery: false
        }
      };
      const resSteps = buildOrderTimelineSteps(resOrder);
      assert.strictEqual(resSteps[3].sublabel, 'Gosport, PO12 4HA');
    });

    it('adapts step labels for workshop collection vs delivery', () => {
      const pickupOrder: PostalOrder = {
        ...baseOrder,
        shippingMethod: 'solent_pickup',
        orderStatus: 'ready_for_pickup'
      };
      const steps = buildOrderTimelineSteps(pickupOrder);
      assert.strictEqual(steps[1].label, 'Bench Prepared');
      assert.strictEqual(steps[2].label, 'Ready for Collection');
      assert.strictEqual(steps[3].label, 'Collected by Skipper');
    });
  });

  describe('buildOrderTimelineHistory', () => {
    it('constructs initial receipt event for new orders', () => {
      const history = buildOrderTimelineHistory(baseOrder);
      assert.strictEqual(history.length, 1);
      assert.strictEqual(history[0].status, 'received');
      assert.match(history[0].description, /£47\.00/);
    });

    it('constructs cumulative history for fully delivered orders', () => {
      const deliveredOrder: PostalOrder = {
        ...baseOrder,
        orderStatus: 'delivered',
        trackingNumber: 'GB123456789RM',
        trackingCarrier: 'Royal Mail Tracked 24'
      };
      const history = buildOrderTimelineHistory(deliveredOrder);
      assert.strictEqual(history.length, 4);
      assert.strictEqual(history[0].status, 'received');
      assert.strictEqual(history[1].status, 'packed');
      assert.strictEqual(history[2].status, 'dispatched');
      assert.strictEqual(history[3].status, 'delivered');
    });

    it('preserves and chronologically merges custom checkpoint notes', () => {
      const customEvent: PostalOrderTimelineEvent = {
        id: 'custom-note-001',
        status: 'processing',
        title: 'Cable Custom Crimp',
        description: 'M8 heavy duty tinned lug crimped and heatshrink sealed.',
        timestamp: '2026-10-16 11:15',
        location: 'Bench 2',
        completed: true,
        operator: 'Sarah Miller'
      };

      const orderWithNote: PostalOrder = {
        ...baseOrder,
        orderStatus: 'packed',
        timeline: [customEvent]
      };

      const history = buildOrderTimelineHistory(orderWithNote);
      assert.strictEqual(history.some(e => e.id === 'custom-note-001'), true);
      // Ensure history is ordered chronologically
      for (let i = 0; i < history.length - 1; i++) {
        assert.ok(history[i].timestamp <= history[i + 1].timestamp);
      }
    });
  });
});
