export type UserRole = 'guest' | 'client' | 'admin' | 'technician' | 'postal';

export interface RoleInfo {
  role: UserRole;
  label: string;
  shortLabel: string;
  badge: string;
  description: string;
  allowedFeatures: string[];
  color: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  photoURL?: string;
  vesselName?: string;
  vesselType?: string;
  marinaBerth?: string;
  systemVoltage?: '12V' | '24V';
  notifyJobUpdates?: boolean;
  notifyDispatchSms?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  updatedAt?: string;
  password?: string;
  passwordHash?: string;
  vesselIds?: string[];
  environment?: string;
}

export type ServiceType = 
  | 'diagnostic'
  | 'lithium'
  | 'solar'
  | 'navigation'
  | 'custom_panel'
  | 'replica_panel'
  | 'renovation';

export interface MessageItem {
  id: string;
  sender: 'client' | 'ajw';
  senderName: string;
  text: string;
  timestamp: string;
  attachments?: string[];
}

export interface MaterialLineItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface SwitchConfig {
  position: number;
  label: string;
  breakerRatingAmps: number;
  switchType: 'rocker_illuminated' | 'toggle' | 'push_button';
  icon?: string;
}

export interface SwitchPanelConfig {
  id?: string;
  material: 'acrylic_black' | 'acrylic_white' | 'wood_teak' | 'wood_birch';
  widthMm: number;
  heightMm: number;
  gangCount: number;
  switches: SwitchConfig[];
  hasVoltmeter: boolean;
  hasUsbCharger: boolean;
  has12vSocket: boolean;
  mountingHoleStyle: '4_corner' | '6_perimeter';
  backlightColor: 'cyan' | 'red' | 'amber' | 'blue';
  packageOption: 'faceplate_only' | 'diy_kit' | 'assembled_wired';
  estimatedPrice: number;
}

export interface JobRecord {
  id: string;
  reference: string;
  userId?: string;
  vesselId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  vesselName: string;
  vesselType: string;
  berthLocation: string;
  serviceCategory: ServiceType;
  status: 'quote_requested' | 'quote_sent' | 'quote_accepted' | 'scheduled' | 'in_progress' | 'completed';
  hourlyRate: number; // £25 flat rate
  diagnosticHours: number;
  materialsUsed: MaterialLineItem[];
  notes: string;
  replicaImages?: string[];
  panelConfig?: SwitchPanelConfig;
  totalLabor: number;
  totalMaterials: number;
  totalEstimated: number;
  depositPaid: boolean;
  depositAmount: number;
  stripePaymentId?: string;
  stripeSessionId?: string;
  createdAt: string;
  messages: MessageItem[];
  customerSignOff?: CustomerSignOffRecord;
  workPhotos?: string[];
  pendingOfflineSync?: boolean;
}

export interface CategoryItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  displayOrder?: number;
}

export interface CatalogItem {
  id: string;
  category: string;
  name: string;
  specification: string;
  unit: string;
  unitPrice: number;
  inStock: boolean;
  stockCount: number;
  imageUrl?: string;
  imageStoragePath?: string;
  badge?: string;
  weightKg?: number;
  dimensions?: { lengthCm: number; widthCm: number; heightCm: number };
}

export interface StockAlert {
  id: string;
  itemId: string;
  itemName: string;
  itemCategory: string;
  specification: string;
  stockCount: number;
  timestamp: string;
  triggerSource: 'order_placement' | 'manual_adjustment' | 'workshop_job' | 'simulation';
  emailRecipient: string;
  emailSubject: string;
  emailBody: string;
  dismissed?: boolean;
}

export interface SupplierInfo {
  id: string;
  name: string;
  category: string;
  email: string;
  phone: string;
  location: string;
  defaultLeadTime: string;
  accountNumber: string;
}

export interface SupplierPurchaseOrder {
  id: string;
  poNumber: string;
  itemId: string;
  itemName: string;
  supplierName: string;
  supplierEmail: string;
  quantity: number;
  unit: string;
  estimatedUnitCost: number;
  totalCost: number;
  shippingSpeed: 'standard_courier' | 'next_day_solent' | 'workshop_pickup';
  status: 'draft' | 'dispatched' | 'received';
  notes: string;
  createdAt: string;
}

export type ExpenseCategory = 
  | 'fuel'
  | 'travel'
  | 'subcontractor'
  | 'berthing_harbor'
  | 'equipment_hire'
  | 'consumables'
  | 'other';

export interface JobExpense {
  id: string;
  jobId: string;
  jobReference: string;
  vesselName: string;
  clientName?: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  vendor?: string;
  receiptReference?: string;
  receiptUrl?: string;
  isBillableToClient: boolean;
  paymentMethod?: 'company_card' | 'cash' | 'bacs_transfer' | 'fuel_card' | 'personal_reimbursement';
  status: 'recorded' | 'billed' | 'reimbursed';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CartItem {
  item: CatalogItem;
  quantity: number;
}

export interface PostalOrderShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  isMarinaDelivery?: boolean;
  marinaName?: string;
  berthNumber?: string;
  deliveryNotes?: string;
}

export interface PostalOrderItem {
  itemId: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
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
  completed: boolean;
  isCurrent?: boolean;
  operator?: string;
  notes?: string;
}

export interface PostalOrder {
  id: string;
  orderNumber: string;
  userId?: string;
  vesselId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: PostalOrderShippingAddress;
  shippingMethod: 'royal_mail_tracked' | 'dpd_heavy' | 'solent_pickup';
  shippingCost: number;
  items: PostalOrderItem[];
  subtotal: number;
  total: number;
  paymentMethod: 'card' | 'bank_transfer';
  paymentStatus: 'paid' | 'pending';
  stripePaymentId?: string;
  stripeSessionId?: string;
  orderStatus: PostalOrderStatus;
  trackingNumber?: string;
  trackingCarrier?: string;
  carrier?: string;
  shipstationOrderId?: string;
  shipstationShipmentId?: string;
  shippingLabelUrl?: string;
  shippingLabelBase64?: string;
  createdAt: string;
  packedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  notes?: string;
  timeline?: PostalOrderTimelineEvent[];
}

export interface ConsignmentDimensions {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface ShipStationRateQuote {
  serviceCode: string;
  serviceName: string;
  carrierCode: 'royal_mail' | 'dpd_uk';
  shipmentCostPounds: number;
  otherCostPounds: number;
  estimatedDeliveryDays?: number;
}

export interface ShipStationLabelResult {
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

export interface ShipStationAppConfig {
  apiKey?: string;
  apiSecret?: string;
  mode: 'live' | 'simulated';
  useCloudFunctions?: boolean;
  gatewayStatus?: 'cloud_function' | 'simulated_local';
  carrierDefaults: {
    royalMailServiceCode: string;
    dpdServiceCode: string;
  };
}

export interface CatalogSnapshot {
  id: string;
  timestamp: string;
  label: string;
  itemsCount: number;
  items: CatalogItem[];
}

export type ImportMergeMode = 'replace' | 'merge';

export interface InventoryItemsExport {
  version: string;
  exportedAt: string;
  type: 'ajwmes_items';
  source: string;
  count: number;
  items: CatalogItem[];
}

export interface InventoryCategoriesExport {
  version: string;
  exportedAt: string;
  type: 'ajwmes_categories';
  source: string;
  count: number;
  categories: CategoryItem[];
}

export interface FullCatalogExport {
  version: string;
  exportedAt: string;
  type: 'ajwmes_full_catalog';
  company: string;
  itemsCount: number;
  categoriesCount: number;
  catalog: CatalogItem[];
  categories: CategoryItem[];
  snapshots?: CatalogSnapshot[];
}

export interface ImportValidationResult<T> {
  success: boolean;
  data?: T;
  count: number;
  detectedType: 'items' | 'categories' | 'full_catalog' | 'unknown';
  error?: string;
  warnings?: string[];
}

export interface ElectricalLogEntry {
  id: string;
  date: string;
  title: string;
  contractor: string;
  category: 'diagnostic' | 'battery_upgrade' | 'solar' | 'switch_panel' | 'navigation' | 'inspection' | 'maintenance';
  description: string;
  partsReplaced?: string[];
  jobReference?: string;
}

export const HULL_TYPES = [
  'Monohull Fin Keel',
  'Monohull Wing Keel',
  'Monohull Bilge Keel',
  'Monohull Long Keel',
  'Monohull Lifting Keel',
  'Catamaran',
  'Trimaran',
  'Tender',
  'RIB',
  'Motor Cruiser',
  'Displacement Trawler',
  'Other'
] as const;

export type HullType = typeof HULL_TYPES[number] | string;

export interface VesselSpec {
  id: string;
  userId?: string;
  vesselName: string;
  makeModel: string;
  year: number;
  hullType?: HullType;
  lengthOverall?: string; // LOA (e.g. 30.00 ft / 9.14 m)
  lengthWaterline?: string; // LWL (e.g. 29.00 ft / 8.84 m)
  beam?: string; // Beam (e.g. 15.33 ft / 4.67 m)
  draft?: string; // Draft (e.g. 2.00 ft / 0.61 m)
  displacement?: string; // Displacement (e.g. 10,500 lbs / 4,763 kg)
  hinNumber: string;
  sailNumber: string;
  homeMarina: string;
  berthPontoon: string;
  systemVoltage: '12V' | '24V' | '12V/24V Dual';
  houseBatteryType: 'LiFePO4 Lithium' | 'AGM Deep Cycle' | 'Gel' | 'Flooded Lead-Acid';
  houseCapacityAh: number;
  houseBankInstalled: string;
  starterBatteryType: string;
  starterCapacityAh: number;
  starterCca: number;
  alternatorRating: string;
  dcDcCharger: string;
  solarWatts: number;
  solarType: string;
  solarController: string;
  batteryMonitor: string;
  shorePowerRating: string;
  hasGalvanicIsolator: boolean;
  inverterModel: string;
  navigationNetwork: string;
  chartplotterModel: string;
  vhfAisDetails: string;
  bilgePumpConfig: string;
  switchPanelModel: string;
  generalNotes: string;
  lastInspectionDate: string;
  historyLog: ElectricalLogEntry[];
}

export interface FirestoreConnectionState {
  isConnected: boolean;
  isChecking: boolean;
  lastConnectedAt: string | null;
  pendingSyncCount: number;
  errorMessage?: string;
  isSimulatedOffline?: boolean;
  isIsolatedMode?: boolean;
  environment?: string;
  environmentName?: string;
  hasApiKey?: boolean;
}

export interface CustomerSignOffRecord {
  jobId: string;
  jobReference: string;
  clientName: string;
  signerRole: 'vessel_owner' | 'skipper' | 'marina_agent';
  signatureDataUrl: string; // Base64 data URL from signature pad
  signedAtOffline: string;  // ISO timestamp when captured on pontoon
  signedAtSynced?: string;  // ISO timestamp when synchronized to cloud
  agreedDiagnosticHours: number;
  agreedTotalEstimate: number;
  customerFeedback?: string;
  synced: boolean;
}

export interface OfflineQueuedMedia {
  id: string;
  jobId: string;
  jobReference: string;
  vesselName: string;
  category: 'work_fitment' | 'diagnostic_meter' | 'multimeter_test' | 'damage_report';
  blob?: Blob;
  previewUrl: string;
  fileName: string;
  fileSizeBytes: number;
  capturedAt: string;
  status: 'queued' | 'uploading' | 'synced' | 'failed';
  remoteUrl?: string;
  errorMessage?: string;
}

export interface OfflineJobSheetUpdate {
  jobId: string;
  hours: number;
  materials: MaterialLineItem[];
  status?: JobRecord['status'];
  notes?: string;
  queuedAt: string;
  synced: boolean;
}

export interface OfflineSyncQueueStatus {
  totalPending: number;
  pendingJobs: number;
  pendingPhotos: number;
  pendingSignatures: number;
  pendingEmails?: number;
  isSyncing: boolean;
  syncProgressPercent: number;
  lastSyncedAt: string | null;
  lastError?: string;
}

export type EmailTemplateType =
  | 'welcome'
  | 'order_confirmation'
  | 'order_dispatch'
  | 'diagnostic_quote'
  | 'pontoon_signoff'
  | 'zero_stock_alert'
  | 'custom';

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 string
  contentType?: string;
}

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  templateType?: EmailTemplateType;
  tags?: { name: string; value: string }[];
  attachments?: EmailAttachment[];
  jobReference?: string;
  orderId?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
  queuedOffline?: boolean;
  isSimulated?: boolean;
}

export interface QueuedEmailRecord {
  id: string;
  payload: EmailPayload;
  queuedAt: string;
  retryCount: number;
  lastError?: string;
  status: 'queued' | 'sending' | 'sent' | 'failed';
}

export interface ResendAppConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  isConfigured: boolean;
  isSimulatedMode: boolean;
}

export interface IncomingEmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  receivedAt: string;
  jobReference?: string;
  matchedUserId?: string;
  attachments?: { filename: string; url?: string; sizeBytes?: number }[];
  status: 'unread' | 'read' | 'processed';
}

export interface StripeAppConfig {
  publishableKey: string;
  mode: 'test' | 'live' | 'simulated';
  isConfigured: boolean;
  depositPaymentLink?: string;
  storePaymentLink?: string;
}

export interface StripePaymentResult {
  success: boolean;
  paymentId: string;
  status: 'paid' | 'pending' | 'failed';
  amountPounds: number;
  currency: string;
  feeEstimated: number;
  simulated: boolean;
  error?: string;
  redirectUrl?: string;
}


