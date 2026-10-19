import {
  GetShippingRatesRequest,
  ShipStationRateQuoteResponse,
  GenerateShippingLabelRequest,
  ShipStationLabelResponse,
  CreateShipStationOrderRequest
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
