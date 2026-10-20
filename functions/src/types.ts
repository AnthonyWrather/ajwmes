/**
 * Shared Cloud Functions Type Definitions for ShipStation Carrier Gateway.
 */

export interface ConsignmentDimensionsInput {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface ShippingAddressInput {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  country?: string;
  phone?: string;
  isMarinaDelivery?: boolean;
  marinaName?: string;
  berthNumber?: string;
}

export interface GetShippingRatesRequest {
  orderId?: string;
  orderNumber?: string;
  shippingAddress: ShippingAddressInput;
  dimensions: ConsignmentDimensionsInput;
  preferredCarrier?: 'royal_mail' | 'dpd_uk';
}

export interface ShipStationRateQuoteResponse {
  serviceCode: string;
  serviceName: string;
  carrierCode: 'royal_mail' | 'dpd_uk';
  shipmentCostPounds: number;
  otherCostPounds: number;
  estimatedDeliveryDays?: number;
}

export interface GenerateShippingLabelRequest {
  orderId: string;
  orderNumber: string;
  shippingAddress: ShippingAddressInput;
  dimensions: ConsignmentDimensionsInput;
  carrierCode: 'royal_mail' | 'dpd_uk';
  serviceCode: string;
  testLabel?: boolean;
}

export interface ShipStationLabelResponse {
  success: boolean;
  shipmentId: string;
  trackingNumber: string;
  carrierCode: string;
  serviceCode: string;
  labelPdfBase64?: string;
  labelUrl?: string;
  isSimulated: boolean;
  error?: string;
}

export interface CreateShipStationOrderRequest {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  customerEmail?: string;
  shippingAddress: ShippingAddressInput;
  items: Array<{
    sku?: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  dimensions: ConsignmentDimensionsInput;
}
