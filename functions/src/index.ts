import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { validatePostalDispatcherAuth, validateEmailCallerAuth } from './authMiddleware.js';
import { 
  fetchRatesFromShipStation, 
  createLabelInShipStation, 
  createOrderInShipStation,
  processShipstationWebhook
} from './shipstationClient.js';
import {
  sendEmailViaResend,
  validateEmailPayload
} from './resendClient.js';
import {
  GetShippingRatesRequest,
  ShipStationRateQuoteResponse,
  GenerateShippingLabelRequest,
  ShipStationLabelResponse,
  CreateShipStationOrderRequest,
  SendEmailFunctionRequest,
  SendEmailFunctionResponse
} from './types.js';

if (getApps().length === 0) {
  initializeApp();
}

// Google Secret Manager secrets
export const shipstationApiKey = defineSecret('SHIPSTATION_API_KEY');
export const shipstationApiSecret = defineSecret('SHIPSTATION_API_SECRET');
export const resendApiKey = defineSecret('RESEND_API_KEY');

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
 * Listens for carrier tracking events (ORDER_SHIPPED, DELIVERED), updates Firestore postal order status,
 * and appends verified PostalOrderTimelineEvent milestone records.
 */
export const shipstationWebhook = onRequest(
  {
    region: REGION,
    secrets: [shipstationApiKey, shipstationApiSecret],
    cors: true
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const apiKey = shipstationApiKey.value() || process.env.SHIPSTATION_API_KEY;
      const apiSecret = shipstationApiSecret.value() || process.env.SHIPSTATION_API_SECRET;
      const firestore = getFirestore();

      const result = await processShipstationWebhook({
        payload: req.body,
        query: req.query,
        headers: req.headers,
        firestore,
        apiKey,
        apiSecret
      });

      console.log('Processed ShipStation Webhook Event:', JSON.stringify(result));
      res.status(200).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Error handling webhook event:', message);
      // Return HTTP 200 with error property so ShipStation does not produce retry storms
      res.status(200).json({ received: true, success: false, error: message });
    }
  }
);

/**
 * Callable Function: sendEmail
 * Proxies transactional email dispatch through Resend with Google Secret Manager.
 * Validates RBAC caller privileges and email payload to prevent open relay abuse.
 */
export const sendEmail = onCall<SendEmailFunctionRequest, Promise<SendEmailFunctionResponse>>(
  {
    region: REGION,
    secrets: [resendApiKey],
    cors: true
  },
  async (request) => {
    // 1. Validate payload format and template
    const validation = validateEmailPayload(request.data);
    if (!validation.isValid) {
      throw new HttpsError('invalid-argument', validation.error || 'Invalid email dispatch payload.');
    }

    // 2. Authorize caller
    validateEmailCallerAuth(request, request.data.templateType);

    // 3. Resolve API key from Secret Manager (or process env fallback)
    const apiKey = resendApiKey.value() || process.env.RESEND_API_KEY;

    // 4. Send via Resend client (handles simulated fallback when unprovisioned)
    try {
      const result = await sendEmailViaResend(apiKey || '', request.data);
      if (!result.success) {
        throw new HttpsError('internal', result.error || 'Failed to dispatch email via Resend.');
      }
      return result;
    } catch (err: unknown) {
      if (err instanceof HttpsError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      console.error('sendEmail Cloud Function error:', message);
      throw new HttpsError('internal', `Failed to send email: ${message}`);
    }
  }
);

