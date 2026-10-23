import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  buildBasicAuthHeader, 
  fetchRatesFromShipStation, 
  createLabelInShipStation, 
  createOrderInShipStation,
  parseShipStationWebhookPayload,
  fetchShipStationShipmentDetails,
  resolveTargetCollections,
  processShipstationWebhook,
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

  describe('ShipStation Inbound Webhook Parser & Processor', () => {
    describe('parseShipStationWebhookPayload', () => {
      it('parses direct ORDER_SHIPPED payload correctly', () => {
        const payload = {
          event: 'ORDER_SHIPPED',
          orderNumber: 'AJW-POST-2841',
          trackingNumber: 'GB123456789RM',
          carrierCode: 'royal_mail'
        };
        const parsed = parseShipStationWebhookPayload(payload, { env: 'ais_dev' });
        assert.strictEqual(parsed.rawEvent, 'ORDER_SHIPPED');
        assert.strictEqual(parsed.orderNumber, 'AJW-POST-2841');
        assert.strictEqual(parsed.trackingNumber, 'GB123456789RM');
        assert.strictEqual(parsed.carrierCode, 'royal_mail');
        assert.strictEqual(parsed.targetStatus, 'dispatched');
        assert.strictEqual(parsed.envHint, 'ais_dev');
      });

      it('parses direct DELIVERED payload correctly', () => {
        const payload = {
          event: 'DELIVERED',
          orderNumber: 'AJW-POST-2839',
          trackingNumber: '15501234567890',
          carrierCode: 'dpd_uk'
        };
        const parsed = parseShipStationWebhookPayload(payload);
        assert.strictEqual(parsed.rawEvent, 'DELIVERED');
        assert.strictEqual(parsed.targetStatus, 'delivered');
        assert.strictEqual(parsed.carrierCode, 'dpd_uk');
      });

      it('parses standard ShipStation SHIP_NOTIFY and extracts orderNumber from resource_url', () => {
        const payload = {
          resource_type: 'SHIP_NOTIFY',
          resource_url: 'https://ssapi.shipstation.com/shipments?orderNumber=AJW-POST-2845'
        };
        const parsed = parseShipStationWebhookPayload(payload);
        assert.strictEqual(parsed.rawEvent, 'SHIP_NOTIFY');
        assert.strictEqual(parsed.targetStatus, 'dispatched');
        assert.strictEqual(parsed.orderNumber, 'AJW-POST-2845');
        assert.strictEqual(parsed.resourceUrl, 'https://ssapi.shipstation.com/shipments?orderNumber=AJW-POST-2845');
      });

      it('extracts environment from x-environment header or query param', () => {
        const parsedWithHeader = parseShipStationWebhookPayload({}, {}, { 'x-environment': 'gh_pre' });
        assert.strictEqual(parsedWithHeader.envHint, 'gh_pre');

        const parsedWithQuery = parseShipStationWebhookPayload({}, { env: 'ais_dev' });
        assert.strictEqual(parsedWithQuery.envHint, 'ais_dev');
      });
    });

    describe('fetchShipStationShipmentDetails', () => {
      it('fetches shipments from resource_url and ignores voided shipments', async () => {
        const mockFetch: typeof fetch = async (url) => {
          assert.ok(String(url).includes('/shipments'));
          return {
            ok: true,
            status: 200,
            json: async () => ({
              shipments: [
                {
                  shipmentId: 101,
                  orderNumber: 'AJW-POST-2841',
                  trackingNumber: 'VOIDED999',
                  voided: true
                },
                {
                  shipmentId: 102,
                  orderNumber: 'AJW-POST-2841',
                  trackingNumber: 'GB987654321RM',
                  carrierCode: 'royal_mail',
                  shipDate: '2026-10-24',
                  voided: false
                }
              ]
            })
          } as unknown as Response;
        };

        const details = await fetchShipStationShipmentDetails(
          'test_key',
          'test_secret',
          'https://ssapi.shipstation.com/shipments?orderId=123',
          mockFetch
        );

        assert.ok(details);
        assert.strictEqual(details.orderNumber, 'AJW-POST-2841');
        assert.strictEqual(details.trackingNumber, 'GB987654321RM');
        assert.strictEqual(details.carrierCode, 'royal_mail');
        assert.strictEqual(details.shipDate, '2026-10-24');
      });

      it('returns null gracefully on HTTP failure without unhandled error', async () => {
        const mockFetch: typeof fetch = async () => {
          return {
            ok: false,
            status: 500
          } as unknown as Response;
        };

        const details = await fetchShipStationShipmentDetails(
          'test_key',
          'test_secret',
          'https://ssapi.shipstation.com/shipments?orderId=123',
          mockFetch
        );

        assert.strictEqual(details, null);
      });
    });

    describe('resolveTargetCollections', () => {
      it('prioritizes environment-scoped collection when hint is provided', () => {
        const devCols = resolveTargetCollections('ais_dev');
        assert.strictEqual(devCols[0], 'ais_dev_postal_orders');

        const prCols = resolveTargetCollections('gh_pre');
        assert.strictEqual(prCols[0], 'gh_pre_postal_orders');

        const prodCols = resolveTargetCollections('live');
        assert.strictEqual(prodCols[0], 'postal_orders');
      });

      it('defaults to root collection first and includes all candidate collections', () => {
        const cols = resolveTargetCollections();
        assert.strictEqual(cols[0], 'postal_orders');
        assert.ok(cols.includes('ais_dev_postal_orders'));
        assert.ok(cols.includes('gh_pre_postal_orders'));
      });
    });

    describe('processShipstationWebhook', () => {
      function createMockFirestore(initialData: Record<string, Record<string, any>>) {
        const store: Record<string, Map<string, any>> = {};
        for (const [col, docs] of Object.entries(initialData)) {
          store[col] = new Map();
          for (const [id, data] of Object.entries(docs)) {
            store[col].set(id, { ...data, id });
          }
        }

        return {
          _store: store,
          collection(colName: string) {
            if (!store[colName]) {
              store[colName] = new Map();
            }
            const colMap = store[colName];

            return {
              doc(docId: string) {
                return {
                  id: docId,
                  ref: this,
                  async get() {
                    const exists = colMap.has(docId);
                    return {
                      exists,
                      id: docId,
                      data: () => exists ? JSON.parse(JSON.stringify(colMap.get(docId))) : undefined
                    };
                  },
                  async set(data: any, options?: { merge?: boolean }) {
                    const existing = colMap.get(docId) || {};
                    const merged = options?.merge ? { ...existing, ...data } : data;
                    colMap.set(docId, merged);
                    return { writeTime: new Date() };
                  }
                };
              },
              where(field: string, op: string, value: any) {
                return {
                  limit(num: number) {
                    return {
                      async get() {
                        const matching: any[] = [];
                        for (const [id, doc] of colMap.entries()) {
                          let match = false;
                          if (op === '==') {
                            match = doc[field] === value;
                          } else if (op === 'in' && Array.isArray(value)) {
                            match = value.includes(doc[field]);
                          }
                          if (match) {
                            matching.push({
                              id,
                              ref: {
                                id,
                                async set(data: any, options?: { merge?: boolean }) {
                                  const existing = colMap.get(id) || {};
                                  const merged = options?.merge ? { ...existing, ...data } : data;
                                  colMap.set(id, merged);
                                  return { writeTime: new Date() };
                                }
                              },
                              data: () => JSON.parse(JSON.stringify(doc))
                            });
                            if (matching.length >= num) break;
                          }
                        }
                        return {
                          empty: matching.length === 0,
                          docs: matching
                        };
                      }
                    };
                  }
                };
              }
            };
          }
        };
      }

      it('updates orderStatus to dispatched and appends timeline event', async () => {
        const mockDb = createMockFirestore({
          ais_dev_postal_orders: {
            'ord-101': {
              id: 'ord-101',
              orderNumber: 'AJW-POST-2841',
              orderStatus: 'packed',
              shippingAddress: {
                fullName: 'Marcus Bennett',
                city: 'Southampton',
                postcode: 'SO31 4NB',
                isMarinaDelivery: true,
                marinaName: 'Hamble Point Marina',
                berthNumber: 'Pontoon F-12'
              },
              timeline: [
                {
                  id: 'evt-1',
                  status: 'received',
                  title: 'Order Placed',
                  timestamp: '2026-10-07 14:15'
                }
              ]
            }
          }
        });

        const result = await processShipstationWebhook({
          payload: {
            event: 'ORDER_SHIPPED',
            orderNumber: 'AJW-POST-2841',
            trackingNumber: 'GB123456789RM',
            carrierCode: 'royal_mail'
          },
          query: { env: 'ais_dev' },
          firestore: mockDb
        });

        assert.strictEqual(result.received, true);
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.orderNumber, 'AJW-POST-2841');
        assert.strictEqual(result.status, 'dispatched');
        assert.strictEqual(result.matchedCollection, 'ais_dev_postal_orders');

        const updatedDoc = mockDb._store['ais_dev_postal_orders'].get('ord-101');
        assert.strictEqual(updatedDoc.orderStatus, 'dispatched');
        assert.strictEqual(updatedDoc.trackingNumber, 'GB123456789RM');
        assert.ok(updatedDoc.dispatchedAt);
        assert.strictEqual(updatedDoc.timeline.length, 2);
        assert.strictEqual(updatedDoc.timeline[1].status, 'dispatched');
        assert.strictEqual(updatedDoc.timeline[1].trackingNumber, 'GB123456789RM');
      });

      it('updates orderStatus to delivered and sets deliveredAt', async () => {
        const mockDb = createMockFirestore({
          postal_orders: {
            'ord-102': {
              id: 'ord-102',
              orderNumber: 'AJW-POST-2839',
              orderStatus: 'dispatched',
              trackingNumber: '155099887766',
              shippingAddress: {
                fullName: 'Sarah Jenkins',
                city: 'Cowes',
                postcode: 'PO31 7BD'
              },
              timeline: []
            }
          }
        });

        const result = await processShipstationWebhook({
          payload: {
            event: 'DELIVERED',
            orderNumber: 'AJW-POST-2839',
            carrierCode: 'dpd_uk'
          },
          firestore: mockDb
        });

        assert.strictEqual(result.received, true);
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.status, 'delivered');
        assert.strictEqual(result.matchedCollection, 'postal_orders');

        const updatedDoc = mockDb._store['postal_orders'].get('ord-102');
        assert.strictEqual(updatedDoc.orderStatus, 'delivered');
        assert.ok(updatedDoc.deliveredAt);
        assert.strictEqual(updatedDoc.timeline.length, 1);
        assert.strictEqual(updatedDoc.timeline[0].status, 'delivered');
      });

      it('falls back across collections when no environment hint is provided', async () => {
        const mockDb = createMockFirestore({
          gh_pre_postal_orders: {
            'ord-200': {
              id: 'ord-200',
              orderNumber: 'AJW-PR-999',
              orderStatus: 'packed',
              timeline: []
            }
          }
        });

        const result = await processShipstationWebhook({
          payload: {
            event: 'ORDER_SHIPPED',
            orderNumber: 'AJW-PR-999'
          },
          firestore: mockDb
        });

        assert.strictEqual(result.received, true);
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.matchedCollection, 'gh_pre_postal_orders');
      });

      it('handles order not found gracefully with HTTP 200 acknowledgment', async () => {
        const mockDb = createMockFirestore({
          postal_orders: {}
        });

        const result = await processShipstationWebhook({
          payload: {
            event: 'ORDER_SHIPPED',
            orderNumber: 'NON-EXISTENT-ORDER'
          },
          firestore: mockDb
        });

        assert.strictEqual(result.received, true);
        assert.strictEqual(result.success, true);
        assert.ok(result.reason?.includes('Order not found'));
      });

      it('ignores events that do not trigger status updates without throwing errors', async () => {
        const mockDb = createMockFirestore({});
        const result = await processShipstationWebhook({
          payload: {
            event: 'ORDER_NOTIFY'
          },
          firestore: mockDb
        });

        assert.strictEqual(result.received, true);
        assert.strictEqual(result.success, true);
        assert.ok(result.reason?.includes('does not trigger'));
      });

      it('is idempotent and prevents duplicate timeline entries on webhook replay', async () => {
        const mockDb = createMockFirestore({
          postal_orders: {
            'ord-103': {
              id: 'ord-103',
              orderNumber: 'AJW-POST-2849',
              orderStatus: 'dispatched',
              trackingNumber: 'GB112233445RM',
              timeline: [
                {
                  id: 'evt-existing',
                  status: 'dispatched',
                  title: 'Consignment Dispatched via Royal Mail Tracked 24',
                  trackingNumber: 'GB112233445RM',
                  carrier: 'Royal Mail Tracked 24'
                }
              ]
            }
          }
        });

        const result = await processShipstationWebhook({
          payload: {
            event: 'ORDER_SHIPPED',
            orderNumber: 'AJW-POST-2849',
            trackingNumber: 'GB112233445RM',
            carrierCode: 'royal_mail'
          },
          firestore: mockDb
        });

        assert.strictEqual(result.received, true);
        assert.strictEqual(result.success, true);

        const updatedDoc = mockDb._store['postal_orders'].get('ord-103');
        // Timeline should not have duplicated the dispatched event
        assert.strictEqual(updatedDoc.timeline.length, 1);
      });
    });
  });
});
