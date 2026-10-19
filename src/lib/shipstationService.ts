import { 
  PostalOrder, 
  ShipStationRateQuote, 
  ShipStationLabelResult, 
  CatalogItem,
  ConsignmentDimensions
} from '../types';
import { resolveShipStationConfig } from './shipstationConfig';
import { 
  calculateConsignmentDimensions, 
  estimateCarrierRates, 
  mapShippingMethodToCarrierService,
  generateSimulatedTrackingNumber,
  generateSimulatedShipmentId
} from '../utils/shipstationCalculations';
import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

/**
 * Generate simulated 4x6" (100mm x 150mm) SVG Thermal Shipping Label.
 * Formatted with standard UK carrier barcodes, return address, and delivery block.
 */
export function generateThermalLabelSvg(
  order: PostalOrder,
  carrierCode: 'royal_mail' | 'dpd_uk',
  serviceName: string,
  trackingNumber: string,
  dimensions: ConsignmentDimensions
): string {
  const isRoyalMail = carrierCode === 'royal_mail';
  const carrierTitle = isRoyalMail ? 'ROYAL MAIL TRACKED 24' : 'DPD UK NEXT DAY EXPRESS';
  const carrierBadge = isRoyalMail ? '24' : 'DPD';
  const addr = order.shippingAddress;
  const destinationLine = addr.isMarinaDelivery && addr.marinaName
    ? `${addr.marinaName} (${addr.berthNumber || 'Visitors Pontoon'})`
    : (addr.addressLine2 || '');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="100%" height="100%" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: #ffffff;">
    <rect width="400" height="600" fill="#ffffff" stroke="#000000" stroke-width="4"/>
    
    <!-- Top Carrier Header & Service Badge -->
    <rect x="12" y="12" width="376" height="74" fill="#000000"/>
    <text x="24" y="44" font-size="20" font-weight="900" fill="#ffffff" letter-spacing="1">${carrierTitle}</text>
    <text x="24" y="68" font-size="11" font-weight="bold" fill="#facc15">SOLENT MARINA PRIORITY DISPATCH · POSTAL CONSIGNMENT</text>
    <rect x="314" y="16" width="66" height="66" fill="#facc15"/>
    <text x="347" y="58" font-size="32" font-weight="900" fill="#000000" text-anchor="middle">${carrierBadge}</text>

    <!-- Return Address Bar -->
    <line x1="12" y1="94" x2="388" y2="94" stroke="#000000" stroke-width="1.5"/>
    <text x="16" y="108" font-size="9" font-weight="bold" fill="#475569">RETURN: AJW Marine Electrical · Haslar Marina Trade Yard · Gosport PO12 1NU</text>
    <line x1="12" y1="116" x2="388" y2="116" stroke="#000000" stroke-width="1.5"/>

    <!-- 2D DataMatrix Simulation Block & Route Info -->
    <g transform="translate(16, 126)">
      <rect x="0" y="0" width="70" height="70" fill="#000000"/>
      <!-- Grid pattern simulating 2D matrix -->
      <rect x="4" y="4" width="8" height="8" fill="#ffffff"/>
      <rect x="16" y="4" width="8" height="8" fill="#ffffff"/>
      <rect x="28" y="4" width="8" height="8" fill="#ffffff"/>
      <rect x="52" y="4" width="14" height="8" fill="#ffffff"/>
      <rect x="4" y="16" width="8" height="14" fill="#ffffff"/>
      <rect x="20" y="20" width="12" height="12" fill="#ffffff"/>
      <rect x="36" y="16" width="8" height="8" fill="#ffffff"/>
      <rect x="52" y="20" width="10" height="10" fill="#ffffff"/>
      <rect x="8" y="36" width="12" height="8" fill="#ffffff"/>
      <rect x="24" y="36" width="14" height="14" fill="#ffffff"/>
      <rect x="44" y="36" width="18" height="12" fill="#ffffff"/>
      <rect x="4" y="52" width="14" height="14" fill="#ffffff"/>
      <rect x="36" y="52" width="10" height="14" fill="#ffffff"/>
      <rect x="52" y="52" width="14" height="14" fill="#ffffff"/>
    </g>

    <text x="96" y="142" font-size="12" font-weight="bold" fill="#000000">DISPATCH REF: ${order.orderNumber}</text>
    <text x="96" y="160" font-size="10" fill="#334155">WEIGHT: ${dimensions.weightKg} kg · PACK 1 OF 1</text>
    <text x="96" y="176" font-size="10" fill="#334155">DIM: ${dimensions.lengthCm}x${dimensions.widthCm}x${dimensions.heightCm} cm</text>
    <text x="96" y="192" font-size="9" fill="#64748b">CLASS: ${serviceName}</text>

    <!-- Deliver To Box -->
    <rect x="12" y="206" width="376" height="190" fill="#f8fafc" stroke="#000000" stroke-width="2"/>
    <text x="24" y="228" font-size="10" font-weight="900" fill="#475569" letter-spacing="1">DELIVER TO:</text>
    <text x="24" y="254" font-size="18" font-weight="900" fill="#000000">${addr.fullName.toUpperCase()}</text>
    
    ${destinationLine ? `<text x="24" y="278" font-size="13" font-weight="bold" fill="#0284c7">${destinationLine.toUpperCase()}</text>` : ''}
    <text x="24" y="${destinationLine ? 300 : 278}" font-size="13" fill="#1e293b">${addr.addressLine1.toUpperCase()}</text>
    <text x="24" y="${destinationLine ? 322 : 300}" font-size="14" font-weight="bold" fill="#000000">${addr.city.toUpperCase()}</text>
    <text x="24" y="${destinationLine ? 362 : 340}" font-size="28" font-weight="900" fill="#000000" letter-spacing="2">${addr.postcode.toUpperCase()}</text>
    <text x="24" y="${destinationLine ? 384 : 362}" font-size="10" fill="#64748b">TEL: ${addr.phone || 'N/A'}</text>

    <!-- 1D Barcode Simulation Block -->
    <g transform="translate(24, 412)">
      <!-- Simulated bars -->
      <rect x="0" y="0" width="4" height="74" fill="#000000"/>
      <rect x="8" y="0" width="2" height="74" fill="#000000"/>
      <rect x="14" y="0" width="6" height="74" fill="#000000"/>
      <rect x="24" y="0" width="3" height="74" fill="#000000"/>
      <rect x="32" y="0" width="5" height="74" fill="#000000"/>
      <rect x="42" y="0" width="2" height="74" fill="#000000"/>
      <rect x="48" y="0" width="7" height="74" fill="#000000"/>
      <rect x="60" y="0" width="3" height="74" fill="#000000"/>
      <rect x="68" y="0" width="5" height="74" fill="#000000"/>
      <rect x="78" y="0" width="2" height="74" fill="#000000"/>
      <rect x="84" y="0" width="8" height="74" fill="#000000"/>
      <rect x="96" y="0" width="4" height="74" fill="#000000"/>
      <rect x="104" y="0" width="2" height="74" fill="#000000"/>
      <rect x="110" y="0" width="6" height="74" fill="#000000"/>
      <rect x="120" y="0" width="3" height="74" fill="#000000"/>
      <rect x="128" y="0" width="5" height="74" fill="#000000"/>
      <rect x="138" y="0" width="2" height="74" fill="#000000"/>
      <rect x="144" y="0" width="7" height="74" fill="#000000"/>
      <rect x="156" y="0" width="4" height="74" fill="#000000"/>
      <rect x="164" y="0" width="2" height="74" fill="#000000"/>
      <rect x="170" y="0" width="6" height="74" fill="#000000"/>
      <rect x="180" y="0" width="3" height="74" fill="#000000"/>
      <rect x="188" y="0" width="5" height="74" fill="#000000"/>
      <rect x="198" y="0" width="2" height="74" fill="#000000"/>
      <rect x="204" y="0" width="7" height="74" fill="#000000"/>
      <rect x="216" y="0" width="4" height="74" fill="#000000"/>
      <rect x="224" y="0" width="2" height="74" fill="#000000"/>
      <rect x="230" y="0" width="6" height="74" fill="#000000"/>
      <rect x="240" y="0" width="3" height="74" fill="#000000"/>
      <rect x="248" y="0" width="5" height="74" fill="#000000"/>
      <rect x="258" y="0" width="2" height="74" fill="#000000"/>
      <rect x="264" y="0" width="7" height="74" fill="#000000"/>
      <rect x="276" y="0" width="3" height="74" fill="#000000"/>
      <rect x="284" y="0" width="6" height="74" fill="#000000"/>
      <rect x="294" y="0" width="4" height="74" fill="#000000"/>
      <rect x="302" y="0" width="2" height="74" fill="#000000"/>
      <rect x="308" y="0" width="7" height="74" fill="#000000"/>
      <rect x="320" y="0" width="3" height="74" fill="#000000"/>
      <rect x="328" y="0" width="5" height="74" fill="#000000"/>
      <rect x="338" y="0" width="3" height="74" fill="#000000"/>
      <rect x="346" y="0" width="4" height="74" fill="#000000"/>
    </g>

    <!-- Tracking Number Text under Barcode -->
    <text x="200" y="506" font-size="14" font-weight="bold" fill="#000000" text-anchor="middle" letter-spacing="3">${trackingNumber}</text>

    <!-- Footer Barcode & Legal Info -->
    <line x1="12" y1="520" x2="388" y2="520" stroke="#000000" stroke-width="1.5"/>
    <text x="24" y="542" font-size="10" font-weight="bold" fill="#000000">SOLENT REGIONAL HUB: SOUTHAMPTON (SOU)</text>
    <text x="24" y="558" font-size="9" fill="#475569">DISPATCH DATE: ${order.createdAt || new Date().toISOString().split('T')[0]} · SIMULATED THERMAL 4x6" LABEL</text>
    <text x="24" y="574" font-size="8" fill="#94a3b8">DO NOT FOLD OR CREASE BARCODES · AJW-SS-V1-SIM</text>
  </svg>`;
}

/**
 * Fetch carrier rates for an order.
 * In Phase 2: If live mode with Cloud Functions enabled, queries the getShippingRates callable function.
 * Seamlessly falls back to local deterministic calculation if offline or unconfigured.
 */
export async function fetchLiveCarrierRates(
  order: PostalOrder,
  catalogItems?: CatalogItem[]
): Promise<ShipStationRateQuote[]> {
  const config = resolveShipStationConfig();
  const dimensions = calculateConsignmentDimensions(order.items, catalogItems);

  // Live Cloud Function invocation when configured and online
  if (config.mode === 'live' && config.useCloudFunctions !== false && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const getRatesFn = httpsCallable<{
        orderId: string;
        orderNumber: string;
        shippingAddress: unknown;
        dimensions: unknown;
      }, ShipStationRateQuote[]>(functions, 'getShippingRates');

      const response = await getRatesFn({
        orderId: order.id,
        orderNumber: order.orderNumber,
        shippingAddress: order.shippingAddress,
        dimensions: {
          weightKg: dimensions.weightKg,
          lengthCm: dimensions.lengthCm,
          widthCm: dimensions.widthCm,
          heightCm: dimensions.heightCm
        }
      });

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (backendError) {
      console.warn('ShipStation Cloud Function getShippingRates call failed, falling back to local rate simulation:', backendError);
    }
  }

  // Pure deterministic fallback
  try {
    const postcode = order.shippingAddress?.postcode || 'PO12 1NU';
    return estimateCarrierRates(dimensions, postcode);
  } catch (error) {
    console.warn('Failed to calculate carrier rates, falling back to defaults:', error);
    return [
      {
        serviceCode: 'royal_mail_tracked_24',
        serviceName: 'Royal Mail Tracked 24',
        carrierCode: 'royal_mail',
        shipmentCostPounds: 4.85,
        otherCostPounds: 0,
        estimatedDeliveryDays: 1
      }
    ];
  }
}

/**
 * Generate a shipping label for an order.
 * In Phase 2: If live mode with Cloud Functions enabled, calls the generateShippingLabel callable function.
 * Otherwise creates a deterministic SVG thermal label and tracking number.
 */
export async function generateCarrierShippingLabel(
  order: PostalOrder,
  selectedServiceCode?: string,
  catalogItems?: CatalogItem[]
): Promise<ShipStationLabelResult> {
  const config = resolveShipStationConfig();
  const dimensions = calculateConsignmentDimensions(order.items, catalogItems);

  // If a specific service was selected, determine carrier
  const isDpd = selectedServiceCode?.includes('dpd') || order.shippingMethod === 'dpd_heavy';
  const carrierCode: 'royal_mail' | 'dpd_uk' = isDpd ? 'dpd_uk' : 'royal_mail';
  
  const mapped = mapShippingMethodToCarrierService(order.shippingMethod);
  const serviceCode = selectedServiceCode || mapped.serviceCode;
  const serviceName = isDpd ? 'DPD UK Next Day (Express)' : 'Royal Mail Tracked 24';

  // Live Cloud Function invocation when configured and online
  if (config.mode === 'live' && config.useCloudFunctions !== false && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const generateLabelFn = httpsCallable<{
        orderId: string;
        orderNumber: string;
        shippingAddress: unknown;
        dimensions: unknown;
        carrierCode: string;
        serviceCode: string;
      }, ShipStationLabelResult>(functions, 'generateShippingLabel');

      const response = await generateLabelFn({
        orderId: order.id,
        orderNumber: order.orderNumber,
        shippingAddress: order.shippingAddress,
        dimensions: {
          weightKg: dimensions.weightKg,
          lengthCm: dimensions.lengthCm,
          widthCm: dimensions.widthCm,
          heightCm: dimensions.heightCm
        },
        carrierCode,
        serviceCode
      });

      if (response.data && response.data.success) {
        return response.data;
      }
    } catch (backendError) {
      console.warn('ShipStation Cloud Function generateShippingLabel failed, falling back to local thermal simulation:', backendError);
    }
  }

  // Simulated fallback
  const trackingNumber = generateSimulatedTrackingNumber(carrierCode);
  const shipmentId = generateSimulatedShipmentId();

  const svgContent = generateThermalLabelSvg(
    order,
    carrierCode,
    serviceName,
    trackingNumber,
    dimensions
  );

  const encodedSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;

  return {
    success: true,
    shipmentId,
    trackingNumber,
    carrierCode,
    serviceCode,
    labelUrl: encodedSvg,
    labelPdfBase64: encodedSvg,
    isSimulated: config.mode === 'simulated'
  };
}
