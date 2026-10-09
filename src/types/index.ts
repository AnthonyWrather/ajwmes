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
  vesselName?: string;
  vesselType?: string;
  marinaBerth?: string;
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
  createdAt: string;
  messages: MessageItem[];
}

export interface CatalogItem {
  id: string;
  category: 'cable' | 'fuses' | 'busbars' | 'panels' | 'victron' | 'switches';
  name: string;
  specification: string;
  unit: string;
  unitPrice: number;
  inStock: boolean;
  stockCount: number;
  imageUrl?: string;
  badge?: string;
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

export interface PostalOrder {
  id: string;
  orderNumber: string;
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
  orderStatus: PostalOrderStatus;
  trackingNumber?: string;
  trackingCarrier?: string;
  createdAt: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  notes?: string;
}

export interface CatalogSnapshot {
  id: string;
  timestamp: string;
  label: string;
  itemsCount: number;
  items: CatalogItem[];
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

export interface VesselSpec {
  id: string;
  vesselName: string;
  makeModel: string;
  year: number;
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
}
