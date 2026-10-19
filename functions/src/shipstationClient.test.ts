import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  buildBasicAuthHeader, 
  fetchRatesFromShipStation, 
  createLabelInShipStation, 
  createOrderInShipStation,
  WORKSHOP_ORIGIN 
} from './shipstationClient.js';
import { validatePostalDispatcherAuth } from './authMiddleware.js';
import { CallableRequest } from 'firebase-functions/v2/https';

describe('Cloud Functions ShipStation Client & Auth Suite', () => {
  describe('buildBasicAuthHeader', () => {
    it('creates correct base64 encoded basic auth header', () => {
      const header = buildBasicAuthHeader('test_key', 'test_secret');
      const expected = `Basic ${Buffer.from('test_key:test_secret').toString('base64')}`;
      assert.strictEqual(header, expected);
    });

    it('trims whitespace from credentials', () => {
      const header = buildBasicAuthHeader('  api_key_123  ', '  sec_456  ');
      const expected = `Basic ${Buffer.from('api_key_123:sec_456').toString('base64')}`;
      assert.strictEqual(header, expected);
    });
  });

  describe('fetchRatesFromShipStation', () => {
    it('successfully queries carrier rates and maps responses', async () => {
      const mockFetch: typeof fetch = async (input, init) => {
        assert.ok(String(input).includes('/shipments/getrates'));
        assert.ok(init?.headers);
        const body = JSON.parse(String(init?.body));
        assert.strictEqual(body.fromPostalCode, WORKSHOP_ORIGIN.postalCode);
        assert.strictEqual(body.toPostalCode, 'PO12 1NU');

        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              serviceName: 'Royal Mail Tracked 24',
              serviceCode: 'royal_mail_tracked_24',
              shipmentCost: 5.45,
              otherCost: 0
            }
          ]
        } as unknown as Response;
      };

      const rates = await fetchRatesFromShipStation(
        'dummy_key',
        'dummy_secret',
        {
          shippingAddress: {
            fullName: 'Oliver Queen',
            addressLine1: 'Haslar Marina Berth E14',
            city: 'Gosport',
            postcode: 'PO12 1NU'
          },
          dimensions: {
            weightKg: 3.5,
            lengthCm: 25,
            widthCm: 20,
            heightCm: 15
          },
          preferredCarrier: 'royal_mail'
        },
        mockFetch
      );

      assert.strictEqual(rates.length, 1);
      assert.strictEqual(rates[0].serviceCode, 'royal_mail_tracked_24');
      assert.strictEqual(rates[0].shipmentCostPounds, 5.45);
      assert.strictEqual(rates[0].carrierCode, 'royal_mail');
    });

    it('handles HTTP error gracefully without throwing unhandled rejection', async () => {
      const mockFetch: typeof fetch = async () => {
        return {
          ok: false,
          status: 401,
          text: async () => 'Unauthorized'
        } as unknown as Response;
      };

      const rates = await fetchRatesFromShipStation(
        'bad_key',
        'bad_secret',
        {
          shippingAddress: {
            fullName: 'Oliver Queen',
            addressLine1: 'Haslar Marina Berth E14',
            city: 'Gosport',
            postcode: 'PO12 1NU'
          },
          dimensions: {
            weightKg: 1,
            lengthCm: 10,
            widthCm: 10,
            heightCm: 10
          },
          preferredCarrier: 'royal_mail'
        },
        mockFetch
      );

      assert.deepStrictEqual(rates, []);
    });
  });

  describe('createLabelInShipStation', () => {
    it('creates label and parses shipment details', async () => {
      const mockFetch: typeof fetch = async (input, init) => {
        assert.ok(String(input).includes('/shipments/createlabelwithshipmentdetails'));
        const body = JSON.parse(String(init?.body));
        assert.strictEqual(body.carrierCode, 'royal_mail');
        assert.strictEqual(body.serviceCode, 'royal_mail_tracked_24');

        return {
          ok: true,
          status: 200,
          json: async () => ({
            shipmentId: 9948214,
            trackingNumber: 'GB982411024RM',
            labelData: 'JVBERi0xLjQKJ...'
          })
        } as unknown as Response;
      };

      const result = await createLabelInShipStation(
        'key',
        'secret',
        {
          orderId: 'ORD-2026-0042',
          orderNumber: 'ORD-2026-0042',
          shippingAddress: {
            fullName: 'Oliver Queen',
            addressLine1: 'Haslar Marina',
            addressLine2: 'Berth E14',
            city: 'Gosport',
            postcode: 'PO12 1NU'
          },
          dimensions: {
            weightKg: 2.5,
            lengthCm: 20,
            widthCm: 15,
            heightCm: 10
          },
          carrierCode: 'royal_mail',
          serviceCode: 'royal_mail_tracked_24'
        },
        mockFetch
      );

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.shipmentId, '9948214');
      assert.strictEqual(result.trackingNumber, 'GB982411024RM');
      assert.ok(result.labelPdfBase64?.includes('JVBERi0xLjQKJ'));
      assert.strictEqual(result.isSimulated, false);
    });
  });

  describe('createOrderInShipStation', () => {
    it('syncs order record to ShipStation', async () => {
      const mockFetch: typeof fetch = async (input, init) => {
        assert.ok(String(input).includes('/orders/createorder'));
        const body = JSON.parse(String(init?.body));
        assert.strictEqual(body.orderNumber, 'ORD-2026-0042');
        assert.strictEqual(body.items.length, 1);

        return {
          ok: true,
          status: 200,
          json: async () => ({
            orderId: 1002345
          })
        } as unknown as Response;
      };

      const result = await createOrderInShipStation(
        'key',
        'secret',
        {
          orderId: 'ORD-2026-0042',
          orderNumber: 'ORD-2026-0042',
          orderDate: '2026-10-20T00:00:00Z',
          orderStatus: 'paid',
          customerEmail: 'oliver@queen.co.uk',
          shippingAddress: {
            fullName: 'Oliver Queen',
            addressLine1: 'Haslar Marina',
            city: 'Gosport',
            postcode: 'PO12 1NU'
          },
          items: [
            {
              name: 'Victron SmartSolar MPPT 75/15',
              quantity: 1,
              unitPrice: 65.0
            }
          ],
          dimensions: {
            weightKg: 1.2,
            lengthCm: 15,
            widthCm: 10,
            heightCm: 6
          }
        },
        mockFetch
      );

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.shipstationOrderId, 1002345);
    });
  });

  describe('validatePostalDispatcherAuth', () => {
    it('rejects unauthenticated requests', () => {
      const mockReq = { auth: undefined } as unknown as CallableRequest<unknown>;
      assert.throws(() => validatePostalDispatcherAuth(mockReq), {
        message: 'The function must be called while authenticated.'
      });
    });

    it('rejects guest or client without postal role', () => {
      const mockReq = {
        auth: {
          uid: 'client-1',
          token: {
            email: 'client@example.com',
            role: 'client'
          }
        }
      } as unknown as CallableRequest<unknown>;

      assert.throws(() => validatePostalDispatcherAuth(mockReq), {
        message: /Insufficient permissions/
      });
    });

    it('accepts authorized postal dispatcher', () => {
      const mockReq = {
        auth: {
          uid: 'postal-1',
          token: {
            email: 'sarah.postal@ajwmes.co.uk',
            role: 'postal'
          }
        }
      } as unknown as CallableRequest<unknown>;

      const ctx = validatePostalDispatcherAuth(mockReq);
      assert.strictEqual(ctx.uid, 'postal-1');
      assert.strictEqual(ctx.role, 'postal');
    });

    it('accepts administrator dispatcher', () => {
      const mockReq = {
        auth: {
          uid: 'admin-1',
          token: {
            email: 'anthonywrather@gmail.com',
            role: 'admin'
          }
        }
      } as unknown as CallableRequest<unknown>;

      const ctx = validatePostalDispatcherAuth(mockReq);
      assert.strictEqual(ctx.uid, 'admin-1');
      assert.strictEqual(ctx.role, 'admin');
    });
  });
});
