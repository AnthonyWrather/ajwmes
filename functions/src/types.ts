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

export type EmailTemplateType =
  | 'welcome'
  | 'order_confirmation'
  | 'order_dispatch'
  | 'diagnostic_quote'
  | 'pontoon_signoff'
  | 'zero_stock_alert'
  | 'custom';

export interface EmailAttachmentInput {
  filename: string;
  content: string; // Base64
  contentType?: string;
}

export interface SendEmailFunctionRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  templateType?: EmailTemplateType;
  tags?: { name: string; value: string }[];
  attachments?: EmailAttachmentInput[];
  jobReference?: string;
  orderId?: string;
}

export interface SendEmailFunctionResponse {
  success: boolean;
  messageId: string;
  isSimulated?: boolean;
  error?: string;
}

export type PostalOrderStatus =
  | 'pending'
  | 'received'
  | 'processing'
  | 'packed'
  | 'ready_for_pickup'
  | 'dispatched'
  | 'delivered';

export interface PostalOrderTimelineEvent {
  id: string;
  status: PostalOrderStatus;
  title: string;
  description: string;
  timestamp: string;
  location?: string;
  carrier?: string;
  trackingNumber?: string;
  completed?: boolean;
  isCurrent?: boolean;
  operator?: string;
  notes?: string;
}

export type ShipStationWebhookEventType =
  | 'ORDER_SHIPPED'
  | 'SHIP_NOTIFY'
  | 'ITEM_DELIVERED'
  | 'DELIVERED'
  | 'ORDER_NOTIFY';

export interface ShipStationWebhookPayload {
  event?: ShipStationWebhookEventType | string;
  resource_type?: string;
  resource_url?: string;
  orderNumber?: string;
  order_number?: string;
  orderId?: string;
  order_id?: string;
  shipstationOrderId?: number | string;
  trackingNumber?: string;
  tracking_number?: string;
  carrierCode?: string;
  carrier?: string;
  status?: string;
  orderStatus?: string;
  environment?: string;
  location?: string;
  notes?: string;
  shipDate?: string;
}

export interface ShipStationWebhookResult {
  received: boolean;
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  status?: PostalOrderStatus;
  matchedCollection?: string;
  error?: string;
  reason?: string;
}

