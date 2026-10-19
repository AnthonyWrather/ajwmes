import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp, getApps } from 'firebase-admin/app';
import { validatePostalDispatcherAuth } from './authMiddleware.js';
import { 
  fetchRatesFromShipStation, 
  createLabelInShipStation, 
  createOrderInShipStation 
} from './shipstationClient.js';
import {
  GetShippingRatesRequest,
  ShipStationRateQuoteResponse,
  GenerateShippingLabelRequest,
  ShipStationLabelResponse,
  CreateShipStationOrderRequest
} from './types.js';

if (getApps().length === 0) {
  initializeApp();
}

// Google Secret Manager secrets
export const shipstationApiKey = defineSecret('SHIPSTATION_API_KEY');
export const shipstationApiSecret = defineSecret('SHIPSTATION_API_SECRET');

const REGION = 'europe-west2';

/**
 * Callable Function: getShippingRates
 * Proxies live carrier quote lookup through ShipStation REST API.
 */
export const getShippingRates = onCall<GetShippingRatesRequest, Promise<ShipStationRateQuoteResponse[]>>(
  {
    region: REGION,
    secrets: [shipstationApiKey, shipstationApiSecret],
    cors: true
  },
  async (request) => {
    validatePostalDispatcherAuth(request);

    const apiKey = shipstationApiKey.value() || process.env.SHIPSTATION_API_KEY;
    const apiSecret = shipstationApiSecret.value() || process.env.SHIPSTATION_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new HttpsError(
        'failed-precondition',
        'ShipStation API credentials are not provisioned in Secret Manager.'
      );
    }

    try {
      const quotes = await fetchRatesFromShipStation(apiKey, apiSecret, request.data);
      return quotes;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('getShippingRates error:', message);
      throw new HttpsError('internal', `Failed to retrieve carrier rates: ${message}`);
    }
  }
);

/**
 * Callable Function: generateShippingLabel
 * Generates official 4x6" carrier shipping label and tracking reference.
 */
export const generateShippingLabel = onCall<GenerateShippingLabelRequest, Promise<ShipStationLabelResponse>>(
  {
    region: REGION,
    secrets: [shipstationApiKey, shipstationApiSecret],
    cors: true
  },
  async (request) => {
    validatePostalDispatcherAuth(request);

    const apiKey = shipstationApiKey.value() || process.env.SHIPSTATION_API_KEY;
    const apiSecret = shipstationApiSecret.value() || process.env.SHIPSTATION_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new HttpsError(
        'failed-precondition',
        'ShipStation API credentials are not provisioned in Secret Manager.'
      );
    }

    try {
      const labelResult = await createLabelInShipStation(apiKey, apiSecret, request.data);
      return labelResult;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('generateShippingLabel error:', message);
      throw new HttpsError('internal', `Failed to generate shipping label: ${message}`);
    }
  }
);

/**
 * Callable Function: createShipStationOrder
 * Synchronizes order payload into ShipStation order management queue.
 */
export const createShipStationOrder = onCall<CreateShipStationOrderRequest, Promise<{ success: boolean; shipstationOrderId: number }>>(
  {
    region: REGION,
    secrets: [shipstationApiKey, shipstationApiSecret],
    cors: true
  },
  async (request) => {
    validatePostalDispatcherAuth(request);

    const apiKey = shipstationApiKey.value() || process.env.SHIPSTATION_API_KEY;
    const apiSecret = shipstationApiSecret.value() || process.env.SHIPSTATION_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new HttpsError(
        'failed-precondition',
        'ShipStation API credentials are not provisioned in Secret Manager.'
      );
    }

    try {
      return await createOrderInShipStation(apiKey, apiSecret, request.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('createShipStationOrder error:', message);
      throw new HttpsError('internal', `Failed to create ShipStation order: ${message}`);
    }
  }
);

/**
 * Inbound Webhook: shipstationWebhook
 * Listens for carrier tracking events (ORDER_SHIPPED, DELIVERED).
 */
export const shipstationWebhook = onRequest(
  {
    region: REGION,
    cors: true
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const eventData = req.body;
      console.log('Received ShipStation Webhook Event:', JSON.stringify(eventData));
      
      // Acknowledge webhook delivery to prevent ShipStation retry storms
      res.status(200).json({ received: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Error handling webhook event:', message);
      res.status(500).json({ error: message });
    }
  }
);
