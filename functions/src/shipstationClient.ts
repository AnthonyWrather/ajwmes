import {
  GetShippingRatesRequest,
  ShipStationRateQuoteResponse,
  GenerateShippingLabelRequest,
  ShipStationLabelResponse,
  CreateShipStationOrderRequest,
  ShipStationWebhookPayload,
  ShipStationWebhookResult,
  PostalOrderStatus,
  PostalOrderTimelineEvent
} from './types.js';

const SHIPSTATION_API_BASE_URL = 'https://ssapi.shipstation.com';

/**
 * Builds HTTP Basic Authorization header value for ShipStation REST API.
 */
export function buildBasicAuthHeader(apiKey: string, apiSecret: string): string {
  const credentials = `${apiKey.trim()}:${apiSecret.trim()}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

/**
 * Standard Workshop Origin Address (Haslar Marina, Gosport PO12 1NU).
 */
export const WORKSHOP_ORIGIN = {
  name: 'AJW Marine Electrical Services',
  company: 'AJW Marine Electrical Services',
  street1: 'Haslar Marina Trade Yard',
  city: 'Gosport',
  state: 'Hampshire',
  postalCode: 'PO12 1NU',
  country: 'GB',
  phone: '023 9200 8500'
};

/**
 * Fetch live rate quotes from ShipStation /shipments/getrates endpoint.
 */
export async function fetchRatesFromShipStation(
  apiKey: string,
  apiSecret: string,
  request: GetShippingRatesRequest,
  fetchFn: typeof fetch = fetch
): Promise<ShipStationRateQuoteResponse[]> {
  const authHeader = buildBasicAuthHeader(apiKey, apiSecret);
  const carriersToQuery: Array<'royal_mail' | 'dpd_uk'> = request.preferredCarrier
    ? [request.preferredCarrier]
    : ['royal_mail', 'dpd_uk'];

  const results: ShipStationRateQuoteResponse[] = [];

  for (const carrier of carriersToQuery) {
    const payload = {
      carrierCode: carrier,
      fromPostalCode: WORKSHOP_ORIGIN.postalCode,
      toCountry: request.shippingAddress.country || 'GB',
      toPostalCode: request.shippingAddress.postcode,
      toCity: request.shippingAddress.city,
      weight: {
        value: request.dimensions.weightKg,
        units: 'kilograms'
      },
      dimensions: {
        units: 'centimeters',
        length: request.dimensions.lengthCm,
        width: request.dimensions.widthCm,
        height: request.dimensions.heightCm
      }
    };

    try {
      const response = await fetchFn(`${SHIPSTATION_API_BASE_URL}/shipments/getrates`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`ShipStation /shipments/getrates returned HTTP ${response.status} for ${carrier}:`, errorText);
        continue;
      }

      const rawRates = await response.json() as Array<{
        serviceName: string;
        serviceCode: string;
        shipmentCost: number;
        otherCost?: number;
      }>;

      if (Array.isArray(rawRates)) {
        for (const r of rawRates) {
          results.push({
            serviceCode: r.serviceCode,
            serviceName: r.serviceName,
            carrierCode: carrier,
            shipmentCostPounds: Number(r.shipmentCost || 0),
            otherCostPounds: Number(r.otherCost || 0),
            estimatedDeliveryDays: r.serviceCode.includes('24') || r.serviceCode.includes('next_day') ? 1 : 2
          });
        }
      }
    } catch (err) {
      console.warn(`Error querying ShipStation rates for ${carrier}:`, err);
    }
  }

  return results;
}

/**
 * Generate a live carrier shipping label from ShipStation /shipments/createlabelwithshipmentdetails.
 */
export async function createLabelInShipStation(
  apiKey: string,
  apiSecret: string,
  request: GenerateShippingLabelRequest,
  fetchFn: typeof fetch = fetch
): Promise<ShipStationLabelResponse> {
  const authHeader = buildBasicAuthHeader(apiKey, apiSecret);
  const addr = request.shippingAddress;
  const destinationStreet2 = addr.isMarinaDelivery && addr.marinaName
    ? `${addr.marinaName} (${addr.berthNumber || 'Visitors Pontoon'})`
    : (addr.addressLine2 || undefined);

  const payload = {
    carrierCode: request.carrierCode,
    serviceCode: request.serviceCode,
    packageCode: 'package',
    confirmation: 'none',
    shipDate: new Date().toISOString().split('T')[0],
    weight: {
      value: request.dimensions.weightKg,
      units: 'kilograms'
    },
    dimensions: {
      units: 'centimeters',
      length: request.dimensions.lengthCm,
      width: request.dimensions.widthCm,
      height: request.dimensions.heightCm
    },
    shipFrom: WORKSHOP_ORIGIN,
    shipTo: {
      name: addr.fullName,
      street1: addr.addressLine1,
      street2: destinationStreet2,
      city: addr.city,
      postalCode: addr.postcode,
      country: addr.country || 'GB',
      phone: addr.phone || ''
    },
    testLabel: Boolean(request.testLabel)
  };

  const response = await fetchFn(`${SHIPSTATION_API_BASE_URL}/shipments/createlabelwithshipmentdetails`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ShipStation label creation failed (HTTP ${response.status}): ${errorBody}`);
  }

  const result = await response.json() as {
    shipmentId: number | string;
    trackingNumber: string;
    labelData?: string; // base64 pdf data
    labelUrl?: string;
  };

  return {
    success: true,
    shipmentId: String(result.shipmentId),
    trackingNumber: result.trackingNumber,
    carrierCode: request.carrierCode,
    serviceCode: request.serviceCode,
    labelPdfBase64: result.labelData ? `data:application/pdf;base64,${result.labelData}` : undefined,
    labelUrl: result.labelUrl,
    isSimulated: false
  };
}

/**
 * Creates or updates an order in ShipStation /orders/createorder.
 */
export async function createOrderInShipStation(
  apiKey: string,
  apiSecret: string,
  request: CreateShipStationOrderRequest,
  fetchFn: typeof fetch = fetch
): Promise<{ success: boolean; shipstationOrderId: number }> {
  const authHeader = buildBasicAuthHeader(apiKey, apiSecret);
  const addr = request.shippingAddress;

  const payload = {
    orderNumber: request.orderNumber,
    orderDate: request.orderDate || new Date().toISOString(),
    orderStatus: 'awaiting_shipment',
    customerEmail: request.customerEmail,
    billTo: {
      name: addr.fullName,
      street1: addr.addressLine1,
      city: addr.city,
      postalCode: addr.postcode,
      country: addr.country || 'GB'
    },
    shipTo: {
      name: addr.fullName,
      street1: addr.addressLine1,
      street2: addr.addressLine2,
      city: addr.city,
      postalCode: addr.postcode,
      country: addr.country || 'GB',
      phone: addr.phone
    },
    items: request.items.map((item, idx) => ({
      lineItemKey: `${request.orderNumber}-${idx + 1}`,
      sku: item.sku || `SKU-${idx + 1}`,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    })),
    weight: {
      value: request.dimensions.weightKg,
      units: 'kilograms'
    },
    dimensions: {
      units: 'centimeters',
      length: request.dimensions.lengthCm,
      width: request.dimensions.widthCm,
      height: request.dimensions.heightCm
    }
  };

  const response = await fetchFn(`${SHIPSTATION_API_BASE_URL}/orders/createorder`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ShipStation order creation failed (HTTP ${response.status}): ${errorBody}`);
  }

  const result = await response.json() as { orderId: number };
  return {
    success: true,
    shipstationOrderId: result.orderId
  };
}

export interface ParsedWebhookEvent {
  rawEvent?: string;
  resourceUrl?: string;
  orderNumber?: string;
  orderId?: string;
  shipstationOrderId?: number | string;
  trackingNumber?: string;
  carrierCode?: string;
  targetStatus?: PostalOrderStatus;
  envHint?: string;
  location?: string;
  notes?: string;
  shipDate?: string;
}

/**
 * Parses raw inbound ShipStation webhook body and query/header parameters into structured event data.
 * Supports both official ShipStation webhooks (resource_url + SHIP_NOTIFY) and direct JSON payloads.
 */
export function parseShipStationWebhookPayload(
  body: ShipStationWebhookPayload | any,
  query?: Record<string, any>,
  headers?: Record<string, any>
): ParsedWebhookEvent {
  const payload = (typeof body === 'object' && body !== null) ? body : {};
  const q = (typeof query === 'object' && query !== null) ? query : {};
  const h = (typeof headers === 'object' && headers !== null) ? headers : {};

  const rawEvent = (payload.event || payload.resource_type || payload.action || '').toString().toUpperCase();
  const resourceUrl = typeof payload.resource_url === 'string' ? payload.resource_url : undefined;

  let orderNumber = payload.orderNumber || payload.order_number || q.orderNumber || q.order_number;
  let orderId = payload.orderId || payload.order_id || q.orderId || q.order_id;
  const shipstationOrderId = payload.shipstationOrderId || payload.orderId_shipstation || q.shipstationOrderId;
  const trackingNumber = payload.trackingNumber || payload.tracking_number || payload.tracking || q.trackingNumber;
  const carrierCode = (payload.carrierCode || payload.carrier || q.carrierCode || 'royal_mail').toString().toLowerCase();
  const envHint = q.env || h['x-environment'] || payload.environment;
  const location = payload.location || q.location;
  const notes = payload.notes || q.notes;
  const shipDate = payload.shipDate || payload.ship_date;

  // If resourceUrl exists and orderNumber or orderId was not supplied, try parsing query params from resourceUrl
  if (resourceUrl && (!orderNumber || !orderId)) {
    try {
      const parsedUrl = new URL(resourceUrl);
      const urlOrderNum = parsedUrl.searchParams.get('orderNumber');
      const urlOrderId = parsedUrl.searchParams.get('orderId');
      if (urlOrderNum && !orderNumber) orderNumber = urlOrderNum;
      if (urlOrderId && !orderId) orderId = urlOrderId;
    } catch {
      // Ignore URL parsing errors
    }
  }

  // Determine target status
  let targetStatus: PostalOrderStatus | undefined = undefined;
  const statusStr = (payload.status || payload.orderStatus || '').toString().toLowerCase();

  if (
    rawEvent === 'ORDER_SHIPPED' ||
    rawEvent === 'SHIP_NOTIFY' ||
    statusStr === 'dispatched' ||
    statusStr === 'shipped'
  ) {
    targetStatus = 'dispatched';
  } else if (
    rawEvent === 'DELIVERED' ||
    rawEvent === 'ITEM_DELIVERED' ||
    statusStr === 'delivered'
  ) {
    targetStatus = 'delivered';
  }

  return {
    rawEvent,
    resourceUrl,
    orderNumber: orderNumber ? String(orderNumber) : undefined,
    orderId: orderId ? String(orderId) : undefined,
    shipstationOrderId: shipstationOrderId ? String(shipstationOrderId) : undefined,
    trackingNumber: trackingNumber ? String(trackingNumber) : undefined,
    carrierCode,
    targetStatus,
    envHint: envHint ? String(envHint) : undefined,
    location: location ? String(location) : undefined,
    notes: notes ? String(notes) : undefined,
    shipDate: shipDate ? String(shipDate) : undefined
  };
}

/**
 * Fetches shipment details from ShipStation's resource_url (e.g. /shipments?orderId=...).
 */
export async function fetchShipStationShipmentDetails(
  apiKey: string,
  apiSecret: string,
  resourceUrl: string,
  fetchFn: typeof fetch = fetch
): Promise<{
  orderNumber?: string;
  orderId?: string;
  trackingNumber?: string;
  carrierCode?: string;
  shipDate?: string;
} | null> {
  try {
    const authHeader = buildBasicAuthHeader(apiKey, apiSecret);
    const response = await fetchFn(resourceUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`Failed to fetch shipment details from ${resourceUrl} (HTTP ${response.status})`);
      return null;
    }

    const data = await response.json() as {
      shipments?: Array<{
        shipmentId?: number | string;
        orderId?: number | string;
        orderNumber?: string;
        trackingNumber?: string;
        carrierCode?: string;
        shipDate?: string;
        voided?: boolean;
      }>;
      orderNumber?: string;
      trackingNumber?: string;
      carrierCode?: string;
    };

    if (Array.isArray(data.shipments) && data.shipments.length > 0) {
      // Find latest non-voided shipment
      const validShipment = data.shipments.find(s => !s.voided) || data.shipments[0];
      return {
        orderNumber: validShipment.orderNumber,
        orderId: validShipment.orderId ? String(validShipment.orderId) : undefined,
        trackingNumber: validShipment.trackingNumber,
        carrierCode: validShipment.carrierCode,
        shipDate: validShipment.shipDate
      };
    }

    if (data.orderNumber || data.trackingNumber) {
      return {
        orderNumber: data.orderNumber,
        trackingNumber: data.trackingNumber,
        carrierCode: data.carrierCode
      };
    }

    return null;
  } catch (err) {
    console.warn(`Error in fetchShipStationShipmentDetails:`, err);
    return null;
  }
}

/**
 * Resolves candidate Firestore collections based on environment hints.
 */
export function resolveTargetCollections(envHint?: string): string[] {
  const norm = (envHint || '').toLowerCase().trim();
  const knownPrefixes: Record<string, string> = {
    'ais_dev': 'ais_dev_postal_orders',
    'aistudio-dev': 'ais_dev_postal_orders',
    'ais_pre': 'ais_pre_postal_orders',
    'aistudio-preview': 'ais_pre_postal_orders',
    'gh_pre': 'gh_pre_postal_orders',
    'github-preview': 'gh_pre_postal_orders',
    'live': 'postal_orders',
    'prod': 'postal_orders',
    'production': 'postal_orders',
    'github-deployed': 'postal_orders'
  };

  const primary = knownPrefixes[norm] || (norm.endsWith('postal_orders') ? norm : undefined);

  const defaultOrder = [
    'postal_orders',
    'ais_dev_postal_orders',
    'gh_pre_postal_orders',
    'ais_pre_postal_orders'
  ];

  if (primary) {
    return [primary, ...defaultOrder.filter(c => c !== primary)];
  }

  return defaultOrder;
}

export interface ProcessWebhookOptions {
  payload: any;
  query?: Record<string, any>;
  headers?: Record<string, any>;
  firestore: any;
  apiKey?: string;
  apiSecret?: string;
  fetchFn?: typeof fetch;
}

/**
 * Processes an inbound ShipStation webhook, queries Firestore for the matching postal order,
 * transitions orderStatus, and appends a verified PostalOrderTimelineEvent.
 */
export async function processShipstationWebhook(
  options: ProcessWebhookOptions
): Promise<ShipStationWebhookResult> {
  const { payload, query, headers, firestore, apiKey, apiSecret, fetchFn = fetch } = options;

  const parsed = parseShipStationWebhookPayload(payload, query, headers);

  // If resource_url is present, enrich details if credentials exist
  if (parsed.resourceUrl && apiKey && apiSecret) {
    const shipmentDetails = await fetchShipStationShipmentDetails(
      apiKey,
      apiSecret,
      parsed.resourceUrl,
      fetchFn
    );
    if (shipmentDetails) {
      if (!parsed.orderNumber && shipmentDetails.orderNumber) {
        parsed.orderNumber = shipmentDetails.orderNumber;
      }
      if (!parsed.orderId && shipmentDetails.orderId) {
        parsed.orderId = shipmentDetails.orderId;
      }
      if (!parsed.trackingNumber && shipmentDetails.trackingNumber) {
        parsed.trackingNumber = shipmentDetails.trackingNumber;
      }
      if (shipmentDetails.carrierCode) {
        parsed.carrierCode = shipmentDetails.carrierCode;
      }
      if (shipmentDetails.shipDate && !parsed.shipDate) {
        parsed.shipDate = shipmentDetails.shipDate;
      }
    }
  }

  if (!parsed.targetStatus) {
    return {
      received: true,
      success: true,
      reason: `Event '${parsed.rawEvent || 'UNKNOWN'}' does not trigger an order status update.`
    };
  }

  if (!firestore) {
    return {
      received: true,
      success: false,
      error: 'Firestore instance is not initialized.'
    };
  }

  const candidateCollections = resolveTargetCollections(parsed.envHint);
  let matchedDocRef: any = null;
  let matchedDocData: any = null;
  let matchedCollection: string | null = null;

  for (const colName of candidateCollections) {
    try {
      const colRef = firestore.collection(colName);

      // 1. Try by orderId doc ID if available
      if (parsed.orderId) {
        const docSnap = await colRef.doc(parsed.orderId).get();
        if (docSnap && docSnap.exists) {
          matchedDocRef = colRef.doc(parsed.orderId);
          matchedDocData = docSnap.data();
          matchedCollection = colName;
          break;
        }
      }

      // 2. Try by orderNumber
      if (parsed.orderNumber) {
        const snapshot = await colRef.where('orderNumber', '==', parsed.orderNumber).limit(1).get();
        if (snapshot && !snapshot.empty) {
          const doc = snapshot.docs[0];
          matchedDocRef = doc.ref;
          matchedDocData = doc.data();
          matchedCollection = colName;
          break;
        }
      }

      // 3. Try by shipstationOrderId
      if (parsed.shipstationOrderId) {
        const numId = Number(parsed.shipstationOrderId);
        const snapshot = await colRef.where('shipstationOrderId', 'in', [parsed.shipstationOrderId, isNaN(numId) ? parsed.shipstationOrderId : numId]).limit(1).get();
        if (snapshot && !snapshot.empty) {
          const doc = snapshot.docs[0];
          matchedDocRef = doc.ref;
          matchedDocData = doc.data();
          matchedCollection = colName;
          break;
        }
      }

      // 4. Try by trackingNumber
      if (parsed.trackingNumber) {
        const snapshot = await colRef.where('trackingNumber', '==', parsed.trackingNumber).limit(1).get();
        if (snapshot && !snapshot.empty) {
          const doc = snapshot.docs[0];
          matchedDocRef = doc.ref;
          matchedDocData = doc.data();
          matchedCollection = colName;
          break;
        }
      }
    } catch (err) {
      console.warn(`Error querying collection ${colName}:`, err);
    }
  }

  if (!matchedDocRef || !matchedDocData) {
    console.warn(`No matching order found for webhook: orderNumber=${parsed.orderNumber}, orderId=${parsed.orderId}`);
    return {
      received: true,
      success: true,
      reason: 'Order not found in collections.'
    };
  }

  const targetStatus = parsed.targetStatus;
  const existingTimeline: PostalOrderTimelineEvent[] = Array.isArray(matchedDocData.timeline) 
    ? [...matchedDocData.timeline] 
    : [];

  const carrierName = parsed.carrierCode === 'dpd_uk' 
    ? 'DPD Express' 
    : (parsed.carrierCode === 'royal_mail' ? 'Royal Mail Tracked 24' : (matchedDocData.carrier || 'Royal Mail Tracked 24'));
  const effectiveTracking = parsed.trackingNumber || matchedDocData.trackingNumber || '';

  // Avoid duplicate timeline events if identical status event exists
  const alreadyHasEvent = existingTimeline.some(e => e.status === targetStatus && (e.trackingNumber === effectiveTracking || e.carrier === carrierName));

  const nowIso = new Date().toISOString();
  const eventTimestamp = parsed.shipDate || nowIso;

  if (!alreadyHasEvent) {
    const isDispatched = targetStatus === 'dispatched';
    const destinationLabel = matchedDocData.shippingAddress?.isMarinaDelivery
      ? `${matchedDocData.shippingAddress.marinaName || 'Solent Marina'} (${matchedDocData.shippingAddress.berthNumber || 'Berth Pontoon'})`
      : `${matchedDocData.shippingAddress?.city || 'Vessel Location'}, ${matchedDocData.shippingAddress?.postcode || ''}`;

    const newMilestone: PostalOrderTimelineEvent = {
      id: `evt-wh-${Date.now()}-${targetStatus}`,
      status: targetStatus,
      title: isDispatched ? `Consignment Dispatched via ${carrierName}` : 'Final Delivery Confirmed on Vessel',
      description: isDispatched
        ? `Carrier tracking confirmed (${effectiveTracking || 'In Transit'}). Outbound delivery in transit across postal network.`
        : `Package delivered to ${destinationLabel}. Left safely according to delivery notes.`,
      timestamp: eventTimestamp,
      location: isDispatched ? (parsed.location || 'Gosport Distribution Hub') : (parsed.location || destinationLabel),
      carrier: carrierName,
      trackingNumber: effectiveTracking || undefined,
      completed: true,
      operator: isDispatched ? 'ShipStation Webhook Gateway' : 'Carrier Delivery Network',
      notes: parsed.notes || `Verified by carrier status event (${parsed.rawEvent || targetStatus})`
    };

    existingTimeline.push(newMilestone);
  }

  const updateData: Record<string, any> = {
    orderStatus: targetStatus,
    updatedAt: nowIso,
    timeline: existingTimeline
  };

  if (targetStatus === 'dispatched' && !matchedDocData.dispatchedAt) {
    updateData.dispatchedAt = eventTimestamp;
  } else if (targetStatus === 'delivered' && !matchedDocData.deliveredAt) {
    updateData.deliveredAt = eventTimestamp;
  }

  if (parsed.trackingNumber) {
    updateData.trackingNumber = parsed.trackingNumber;
  }
  if (parsed.carrierCode) {
    updateData.trackingCarrier = carrierName;
    updateData.carrier = carrierName;
  }

  await matchedDocRef.set(updateData, { merge: true });

  return {
    received: true,
    success: true,
    orderId: matchedDocRef.id,
    orderNumber: matchedDocData.orderNumber || parsed.orderNumber,
    status: targetStatus,
    matchedCollection: matchedCollection || undefined
  };
}
