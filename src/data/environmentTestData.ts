import { JobRecord, PostalOrder, VesselSpec } from '../types';

/**
 * Dedicated Test Datasets Partitioned by Environment
 * 
 * Guarantees that AI Studio, Preview, and GitHub Deployed environments
 * operate with isolated, realistic test data scenarios without conflicting.
 */

// 1. AI STUDIO DEV TEST DATA (Bench Diagnostics & High-Voltage Solent Prototypes)
export const AI_STUDIO_DEV_JOBS: JobRecord[] = [
  {
    id: 'ais-job-101',
    reference: 'AJW-AIS-001',
    vesselName: 'Solent Sovereign (AI Studio Dev Test)',
    vesselType: 'Oyster 495 Deck Saloon',
    clientName: 'Capt. Richard Pendelton',
    clientPhone: '07700 900881',
    clientEmail: 'pendelton.solent@ais-test.co.uk',
    berthLocation: 'Ocean Village Marina, Southampton (Pontoon B-12)',
    serviceCategory: 'lithium',
    status: 'in_progress',
    hourlyRate: 25,
    diagnosticHours: 4.5,
    totalLabor: 112.50,
    totalMaterials: 279.80,
    totalEstimated: 392.30,
    depositPaid: true,
    depositAmount: 100.00,
    createdAt: '2026-10-10 09:15',
    notes: 'Bench wiring verified in AI Studio workspace. CERBO GX CAN-bus communication tests passed.',
    materialsUsed: [
      {
        id: 'mat-ais-1',
        name: 'Heavy Duty Starter/Inverter Cable 50mm²',
        quantity: 12,
        unit: 'per meter',
        unitPrice: 18.90
      },
      {
        id: 'mat-ais-2',
        name: 'MRBF Single Battery Terminal Fuse Holder (300A)',
        quantity: 2,
        unit: 'each',
        unitPrice: 26.50
      }
    ],
    messages: [
      {
        id: 'msg-ais-1',
        sender: 'ajw',
        senderName: 'Anthony Wrather (Solent Lead)',
        timestamp: '10 Oct 09:20',
        text: 'AI Studio Test: 50mm² tinned cables crimped with 10-ton hydraulic press. DC busbar torqued to 14Nm.'
      }
    ]
  },
  {
    id: 'ais-job-102',
    reference: 'AJW-AIS-002',
    vesselName: 'Wight Phantom (AI Studio Dev Test)',
    vesselType: 'Axopar 37 Sun-Top',
    clientName: 'Dr. Jeremy Shaw',
    clientPhone: '07700 900882',
    clientEmail: 'j.shaw@solent-medical.co.uk',
    berthLocation: 'Cowes Yacht Haven (Berth D-04)',
    serviceCategory: 'custom_panel',
    status: 'scheduled',
    hourlyRate: 25,
    diagnosticHours: 1.0,
    totalLabor: 25.00,
    totalMaterials: 132.00,
    totalEstimated: 157.00,
    depositPaid: true,
    depositAmount: 50.00,
    createdAt: '2026-10-09 16:00',
    notes: 'Laser panel CAD profile saved in local AI Studio workspace storage.',
    materialsUsed: [
      {
        id: 'mat-ais-3',
        name: 'Carling Technologies Contura II Sealed Rocker Switch',
        quantity: 8,
        unit: 'each',
        unitPrice: 16.50
      }
    ],
    messages: []
  },
  {
    id: 'ais-job-103',
    reference: 'AJW-AIS-003',
    vesselName: 'Solent Pioneer (AI Studio Dev Test)',
    vesselType: 'Hallberg-Rassy 372',
    clientName: 'Fiona MacIntyre',
    clientPhone: '07700 900883',
    clientEmail: 'fiona.mac@solent-cruising.co.uk',
    berthLocation: 'Lymington Yacht Haven (Berth G-19)',
    serviceCategory: 'solar',
    status: 'completed',
    hourlyRate: 25,
    diagnosticHours: 5.0,
    totalLabor: 125.00,
    totalMaterials: 88.00,
    totalEstimated: 213.00,
    depositPaid: true,
    depositAmount: 50.00,
    createdAt: '2026-10-08 14:30',
    notes: 'Bluetooth telemetry verified via VictronConnect. Generating 21.4A at midday peak.',
    materialsUsed: [
      {
        id: 'mat-ais-4',
        name: 'Victron SmartSolar MPPT 75/15 Charge Controller',
        quantity: 1,
        unit: 'each',
        unitPrice: 88.00
      }
    ],
    messages: []
  }
];

export const AI_STUDIO_DEV_POSTAL_ORDERS: PostalOrder[] = [
  {
    id: 'ais-ord-101',
    orderNumber: 'AJW-AIS-10492',
    customerName: 'Marcus Vance',
    customerEmail: 'm.vance@solent-yachts.co.uk',
    customerPhone: '07700 900112',
    shippingAddress: {
      fullName: 'Marcus Vance',
      email: 'm.vance@solent-yachts.co.uk',
      phone: '07700 900112',
      addressLine1: 'Berth 42, Hamble Point Marina',
      addressLine2: 'School Lane',
      city: 'Hamble',
      postcode: 'SO31 4NB',
      isMarinaDelivery: true,
      marinaName: 'Hamble Point Marina',
      berthNumber: 'Berth 42'
    },
    shippingMethod: 'royal_mail_tracked',
    shippingCost: 4.50,
    orderStatus: 'dispatched',
    items: [
      {
        itemId: 'cab-25',
        name: 'Tinned Twin Flat Marine Cable 2.5mm²',
        unit: 'per meter',
        quantity: 25,
        unitPrice: 2.80,
        lineTotal: 70.00
      },
      {
        itemId: 'fus-6w',
        name: 'Marine 6-Way ST-Blade Fuse Block with Cover',
        unit: 'each',
        quantity: 1,
        unitPrice: 28.00,
        lineTotal: 28.00
      }
    ],
    subtotal: 98.00,
    total: 102.50,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    carrier: 'Royal Mail Tracked 24',
    trackingNumber: 'GB-AIS-DEV-109482',
    createdAt: '2026-10-10 11:30',
    dispatchedAt: '2026-10-10 15:45',
    notes: 'AI Studio Test Postal Order · Dispatched from Southampton Workshop'
  } as any,
  {
    id: 'ais-ord-102',
    orderNumber: 'AJW-AIS-10493',
    customerName: 'Helena Rowe',
    customerEmail: 'h.rowe@portsmouth-sailing.co.uk',
    customerPhone: '07700 900113',
    shippingAddress: {
      fullName: 'Helena Rowe',
      email: 'h.rowe@portsmouth-sailing.co.uk',
      phone: '07700 900113',
      addressLine1: 'Gunwharf Quays Marina, Berth M-08',
      city: 'Portsmouth',
      postcode: 'PO1 3TZ',
      isMarinaDelivery: true,
      marinaName: 'Gunwharf Quays Marina',
      berthNumber: 'Berth M-08'
    },
    shippingMethod: 'royal_mail_tracked',
    shippingCost: 4.50,
    orderStatus: 'processing',
    items: [
      {
        itemId: 'fus-12w',
        name: 'Marine 12-Way ST-Blade Fuse Block with Cover',
        unit: 'each',
        quantity: 1,
        unitPrice: 44.00,
        lineTotal: 44.00
      }
    ],
    subtotal: 44.00,
    total: 48.50,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    createdAt: '2026-10-11 08:15',
    notes: 'Awaiting Carling labels from laser engraving bench'
  } as any
];

export const AI_STUDIO_DEV_VESSEL_SPEC: VesselSpec = {
  id: 'ais-vessel-spec-1',
  vesselName: 'Solent Sovereign (AI Studio Dev Prototype)',
  makeModel: 'Oyster 495 Deck Saloon (2024)',
  year: 2024,
  hinNumber: 'OYS-495-2024-001',
  sailNumber: 'GBR-8842',
  homeMarina: 'Ocean Village Marina, Southampton',
  berthPontoon: 'Pontoon B, Berth 12',
  systemVoltage: '24V',
  houseBatteryType: 'LiFePO4 Lithium',
  houseCapacityAh: 600,
  houseBankInstalled: '2026-10',
  starterBatteryType: 'AGM 100Ah',
  starterCapacityAh: 100,
  starterCca: 900,
  alternatorRating: '120A Heavy Duty Mastervolt with Alpha Pro Regulator',
  dcDcCharger: 'Victron Orion-Tr Smart 24/24-17A Isolated (Bluetooth)',
  solarWatts: 500,
  solarType: 'Walk-on Monocrystalline Coachroof Array',
  solarController: 'Victron SmartSolar MPPT 100/30 (Bluetooth)',
  batteryMonitor: 'Victron Lynx Shunt 1000A VE.Can',
  shorePowerRating: '230V 32A Shore Connection with Galvanic Isolation',
  hasGalvanicIsolator: true,
  inverterModel: 'Victron MultiPlus-II 24/5000/120 Pure Sine Wave',
  navigationNetwork: 'NMEA 2000 Micro-C Powered Backbone with Dual Terminators',
  chartplotterModel: 'Dual Raymarine Axiom Pro 12S Touch Displays',
  vhfAisDetails: 'Raymarine Ray90 Modular VHF with Class B AIS Transponder',
  bilgePumpConfig: 'Dual Rule 2000 GPH Automatic Submersible with SuperSwitch',
  switchPanelModel: 'AJWMES 8-Gang Custom Matte Black Marine Switch Panel',
  generalNotes: 'Isolated bench test configuration inside AI Studio development environment.',
  lastInspectionDate: '2026-10-10',
  historyLog: []
};

// 2. AI STUDIO SHARED PREVIEW TEST DATA
export const AI_STUDIO_PREVIEW_JOBS: JobRecord[] = [
  {
    id: 'pre-job-201',
    reference: 'AJW-PRE-001',
    vesselName: 'Solent Horizon (Preview Mode)',
    vesselType: 'Sunseeker Manhattan 52',
    clientName: 'Captain Edward Cole',
    clientPhone: '07700 900991',
    clientEmail: 'e.cole@solent-preview.co.uk',
    berthLocation: 'Swanwick Marina, River Hamble (Berth C-08)',
    serviceCategory: 'diagnostic',
    status: 'in_progress',
    hourlyRate: 25,
    diagnosticHours: 2.0,
    totalLabor: 50.00,
    totalMaterials: 0,
    totalEstimated: 50.00,
    depositPaid: true,
    depositAmount: 25.00,
    createdAt: '2026-10-10 14:00',
    notes: 'Testing preview channel synchronization and role-based permissions.',
    materialsUsed: [],
    messages: []
  }
];

export const AI_STUDIO_PREVIEW_POSTAL_ORDERS: PostalOrder[] = [
  {
    id: 'pre-ord-201',
    orderNumber: 'AJW-PRE-8841',
    customerName: 'Gareth Evans',
    customerEmail: 'g.evans@solent-preview.co.uk',
    customerPhone: '07700 900114',
    shippingAddress: {
      fullName: 'Gareth Evans',
      email: 'g.evans@solent-preview.co.uk',
      phone: '07700 900114',
      addressLine1: 'Berth 18, Port Hamble Marina',
      addressLine2: 'Satchell Lane',
      city: 'Hamble',
      postcode: 'SO31 4NN',
      isMarinaDelivery: true,
      marinaName: 'Port Hamble Marina',
      berthNumber: 'Berth 18'
    },
    shippingMethod: 'dpd_heavy',
    shippingCost: 8.50,
    orderStatus: 'packed',
    items: [
      {
        itemId: 'cab-16',
        name: 'Tinned Battery & Inverter Cable 16mm²',
        unit: 'per meter',
        quantity: 10,
        unitPrice: 7.20,
        lineTotal: 72.00
      }
    ],
    subtotal: 72.00,
    total: 80.50,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    carrier: 'DPD Express Next Day',
    trackingNumber: 'DPD-PRE-884192',
    createdAt: '2026-10-10 14:00',
    notes: 'Preview Environment Test Order'
  } as any
];

export const AI_STUDIO_PREVIEW_VESSEL_SPEC: VesselSpec = {
  id: 'pre-vessel-spec-1',
  vesselName: 'Solent Horizon (Preview Showcase)',
  makeModel: 'Sunseeker Manhattan 52 (2022)',
  year: 2022,
  hinNumber: 'SSK-52-2022-094',
  sailNumber: 'GBR-M52',
  homeMarina: 'Swanwick Marina, River Hamble',
  berthPontoon: 'Pontoon C, Berth 08',
  systemVoltage: '24V',
  houseBatteryType: 'AGM Deep Cycle',
  houseCapacityAh: 800,
  houseBankInstalled: '2025-05',
  starterBatteryType: 'Twin Varta 110Ah',
  starterCapacityAh: 110,
  starterCca: 1000,
  alternatorRating: 'Dual 140A Engine Alternators',
  dcDcCharger: 'Victron Orion-Tr Smart 24/24-30A',
  solarWatts: 400,
  solarType: 'Flybridge Hardtop Solar Matrix',
  solarController: 'Victron SmartSolar MPPT 100/30',
  batteryMonitor: 'Mastervolt MasterBus MasterShunt 500',
  shorePowerRating: '230V 32A Dual Shore Connection',
  hasGalvanicIsolator: true,
  inverterModel: 'Mastervolt Mass Combi Ultra 24/3500-100',
  navigationNetwork: 'Simrad NMEA 2000 SimNet Network',
  chartplotterModel: 'Dual Simrad NSS12 evo3S Displays',
  vhfAisDetails: 'Simrad RS90 Black Box VHF / AIS Transceiver',
  bilgePumpConfig: '4x Whale Supersub Smart 1100 GPH Pumps',
  switchPanelModel: 'Factory Sunseeker Digital Switching + AJW Custom Backup',
  generalNotes: 'Shared preview demonstration spec for clients and inspectors.',
  lastInspectionDate: '2026-10-09',
  historyLog: []
};
