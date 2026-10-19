import { ConsignmentDimensions, PostalOrderItem, CatalogItem, ShipStationRateQuote, PostalOrder } from '../types';

/**
 * Deterministic marine electrical weight lookup table (kg per unit).
 * Applied when catalog item lacks explicit weightKg attribute.
 */
export const MARINE_WEIGHT_HEURISTICS: Array<{ match: RegExp; weightKg: number }> = [
  // Heavy tinned copper marine battery cables (per meter or unit)
  { match: /70mm|70\s*mm/i, weightKg: 0.76 },
  { match: /50mm|50\s*mm/i, weightKg: 0.54 },
  { match: /35mm|35\s*mm/i, weightKg: 0.38 },
  { match: /25mm|25\s*mm/i, weightKg: 0.28 },
  { match: /16mm|16\s*mm/i, weightKg: 0.18 },
  { match: /cable|wire|tri-rated|tinned.*copper/i, weightKg: 0.22 },

  // Heavy power conversion & batteries
  { match: /multiplus|quattro|inverter.*charger/i, weightKg: 10.2 },
  { match: /lithium|lifepo4|superpack|\bbattery\b(?!\s*cable)/i, weightKg: 14.5 },
  { match: /isolation.*transformer/i, weightKg: 12.0 },
  { match: /smartsolar|bluesolar|mppt.*100|mppt.*150/i, weightKg: 1.4 },
  { match: /orion.*tr|dc-dc.*charger/i, weightKg: 1.6 },
  { match: /cerbo.*gx|gx.*touch/i, weightKg: 0.6 },
  
  // Custom switch panels & switchboards
  { match: /switch.*panel|distribution.*board|breaker.*panel/i, weightKg: 1.85 },
  
  // Heavy electrical hardware
  { match: /lynx.*distributor|busbar.*500a|busbar.*250a/i, weightKg: 0.85 },
  { match: /battery.*switch|isolator.*switch/i, weightKg: 0.42 },
  { match: /smartshunt|bmv/i, weightKg: 0.35 },
  
  // Small consumables & terminals
  { match: /fuse|mega.*fuse|midi.*fuse|anl/i, weightKg: 0.04 },
  { match: /heatshrink|tubing/i, weightKg: 0.05 },
  { match: /lug|terminal|copper.*lug/i, weightKg: 0.03 }
];

/**
 * Estimate weight for an item using catalog specification or deterministic marine regex heuristics.
 */
export function estimateItemWeightKg(
  item: PostalOrderItem, 
  catalogItems?: CatalogItem[]
): number {
  // 1. Check explicit weight in catalog if available
  if (catalogItems && catalogItems.length > 0) {
    const catalogMatch = catalogItems.find(c => c.id === item.itemId);
    if (catalogMatch && typeof catalogMatch.weightKg === 'number' && catalogMatch.weightKg > 0) {
      return catalogMatch.weightKg;
    }
  }

  // 2. Scan regex heuristics against item name
  for (const rule of MARINE_WEIGHT_HEURISTICS) {
    if (rule.match.test(item.name)) {
      return rule.weightKg;
    }
  }

  // 3. Fallback standard marine consumable weight (0.15 kg)
  return 0.15;
}

/**
 * Calculate total consignment dimensions and weight for an order.
 * Incorporates packaging tare weight and selects appropriate box dimensions.
 */
export function calculateConsignmentDimensions(
  items: PostalOrderItem[],
  catalogItems?: CatalogItem[]
): ConsignmentDimensions {
  if (!items || items.length === 0) {
    return {
      weightKg: 0.25, // minimal empty box tare
      lengthCm: 22,
      widthCm: 16,
      heightCm: 6
    };
  }

  // Calculate total item weight with quantity multiplication
  let netWeightKg = 0;
  let hasHeavyHardware = false;
  let hasPanel = false;

  for (const item of items) {
    const unitWeight = estimateItemWeightKg(item, catalogItems);
    netWeightKg += unitWeight * Math.max(1, item.quantity);

    if (unitWeight >= 4.0 || /multiplus|quattro|battery|inverter/i.test(item.name)) {
      hasHeavyHardware = true;
    }
    if (/switch.*panel|distribution.*board/i.test(item.name)) {
      hasPanel = true;
    }
  }

  // Add box packaging tare (0.15 kg for small, 0.45 kg for heavy)
  const packagingTareKg = hasHeavyHardware ? 0.65 : (hasPanel ? 0.40 : 0.20);
  const totalWeightKg = Number((netWeightKg + packagingTareKg).toFixed(2));

  // Determine outer box dimensions based on contents & weight
  if (hasHeavyHardware || totalWeightKg >= 8.0) {
    return {
      weightKg: totalWeightKg,
      lengthCm: 52,
      widthCm: 38,
      heightCm: 28
    };
  }

  if (hasPanel || totalWeightKg >= 2.0) {
    return {
      weightKg: totalWeightKg,
      lengthCm: 42,
      widthCm: 32,
      heightCm: 18
    };
  }

  return {
    weightKg: totalWeightKg,
    lengthCm: 28,
    widthCm: 20,
    heightCm: 10
  };
}

/**
 * Solent & Offshore UK Postcode Classification.
 * Detects Isle of Wight (PO30-PO41) and Channel Islands (GY, JE).
 */
export function isSolentOrOffshorePostcode(postcode: string): {
  isOffshore: boolean;
  isIsleOfWight: boolean;
  isChannelIslands: boolean;
  surchargePounds: number;
  areaLabel: string;
} {
  const clean = (postcode || '').trim().toUpperCase().replace(/\s+/g, '');
  
  // Isle of Wight postcodes: PO30 through PO41
  const iowMatch = /^PO(3[0-9]|4[0-1])/.test(clean);
  
  // Channel Islands: GY (Guernsey) and JE (Jersey)
  const ciMatch = /^(GY|JE)/.test(clean);

  if (ciMatch) {
    return {
      isOffshore: true,
      isIsleOfWight: false,
      isChannelIslands: true,
      surchargePounds: 5.50,
      areaLabel: 'Channel Islands (Offshore)'
    };
  }

  if (iowMatch) {
    return {
      isOffshore: true,
      isIsleOfWight: true,
      isChannelIslands: false,
      surchargePounds: 2.50,
      areaLabel: 'Isle of Wight (Solent Offshore)'
    };
  }

  return {
    isOffshore: false,
    isIsleOfWight: false,
    isChannelIslands: false,
    surchargePounds: 0,
    areaLabel: 'UK Mainland'
  };
}

/**
 * Maps the checkout shippingMethod enum to the corresponding ShipStation carrier and service.
 */
export function mapShippingMethodToCarrierService(
  shippingMethod: PostalOrder['shippingMethod'],
  _isOffshore = false
): {
  carrierCode: 'royal_mail' | 'dpd_uk';
  serviceCode: string;
  defaultServiceName: string;
} {
  switch (shippingMethod) {
    case 'dpd_heavy':
      return {
        carrierCode: 'dpd_uk',
        serviceCode: 'dpd_next_day',
        defaultServiceName: 'DPD UK Next Day Courier'
      };
    case 'solent_pickup':
      return {
        carrierCode: 'royal_mail',
        serviceCode: 'workshop_collection',
        defaultServiceName: 'Haslar Workshop Berth Collection'
      };
    case 'royal_mail_tracked':
    default:
      return {
        carrierCode: 'royal_mail',
        serviceCode: 'royal_mail_tracked_24',
        defaultServiceName: 'Royal Mail Tracked 24'
      };
  }
}

/**
 * Generates dynamic carrier rate quotes for workshop rate comparison.
 */
export function estimateCarrierRates(
  dimensions: ConsignmentDimensions,
  postcode: string
): ShipStationRateQuote[] {
  const offshore = isSolentOrOffshorePostcode(postcode);
  const weight = dimensions.weightKg;

  // Base pricing tiers
  const rm24Base = weight <= 2 ? 4.85 : (weight <= 5 ? 7.20 : 11.50);
  const rm48Base = weight <= 2 ? 3.95 : (weight <= 5 ? 5.85 : 9.20);
  const dpdBase = weight <= 5 ? 8.95 : (weight <= 15 ? 12.50 : 18.00);

  const quotes: ShipStationRateQuote[] = [
    {
      serviceCode: 'royal_mail_tracked_24',
      serviceName: 'Royal Mail Tracked 24',
      carrierCode: 'royal_mail',
      shipmentCostPounds: Number((rm24Base + (offshore.isChannelIslands ? 2.50 : 0)).toFixed(2)),
      otherCostPounds: offshore.surchargePounds,
      estimatedDeliveryDays: offshore.isOffshore ? 2 : 1
    },
    {
      serviceCode: 'royal_mail_tracked_48',
      serviceName: 'Royal Mail Tracked 48',
      carrierCode: 'royal_mail',
      shipmentCostPounds: Number((rm48Base + (offshore.isChannelIslands ? 2.00 : 0)).toFixed(2)),
      otherCostPounds: offshore.surchargePounds,
      estimatedDeliveryDays: offshore.isOffshore ? 3 : 2
    },
    {
      serviceCode: 'dpd_next_day',
      serviceName: 'DPD UK Next Day (Express)',
      carrierCode: 'dpd_uk',
      shipmentCostPounds: Number((dpdBase + (offshore.isOffshore ? 4.50 : 0)).toFixed(2)),
      otherCostPounds: offshore.surchargePounds,
      estimatedDeliveryDays: offshore.isChannelIslands ? 2 : 1
    }
  ];

  return quotes;
}

/**
 * Generates a valid simulated carrier tracking number.
 */
export function generateSimulatedTrackingNumber(carrierCode: 'royal_mail' | 'dpd_uk'): string {
  if (carrierCode === 'dpd_uk') {
    // DPD UK: 14 digit consignment reference starting with 1550
    const suffix = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    return `1550${suffix}`;
  }

  // Royal Mail: GB + 9 digits + RM
  const digits = Math.floor(100000000 + Math.random() * 900000000).toString();
  return `GB${digits}RM`;
}

/**
 * Generates a simulated ShipStation shipment reference ID.
 */
export function generateSimulatedShipmentId(): string {
  const hex = Math.floor(Date.now() / 1000).toString(16);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `shp_sim_${hex}_${rand}`;
}
