import { CatalogItem, JobRecord, SwitchPanelConfig, VesselSpec, PostalOrder } from '../types';

export const DEFAULT_CATALOG: CatalogItem[] = [
  // Tinned Marine Cables
  {
    id: 'cab-15',
    category: 'cable',
    name: 'Tinned Single Core Marine Cable 1.5mm²',
    specification: 'Oceanflex tinned copper, 21A rated, ISO 6722, red/black',
    unit: 'per meter',
    unitPrice: 1.40,
    inStock: true,
    stockCount: 150,
    imageUrl: '/assets/images/marine_cable_spool_crimping_1791421463275.jpg',
    badge: 'Popular for Nav Lights'
  },
  {
    id: 'cab-25',
    category: 'cable',
    name: 'Tinned Twin Flat Marine Cable 2.5mm²',
    specification: 'Oceanflex tinned copper, Red/Black sheath, 29A rated, ideal for pumps & instruments',
    unit: 'per meter',
    unitPrice: 2.80,
    inStock: true,
    stockCount: 100,
    imageUrl: '/assets/images/marine_cable_spool_crimping_1791421463275.jpg',
    badge: 'Bestseller'
  },
  {
    id: 'cab-16',
    category: 'cable',
    name: 'Tinned Battery & Inverter Cable 16mm²',
    specification: 'Class 6 ultra flexible tinned copper, 110A rated',
    unit: 'per meter',
    unitPrice: 7.20,
    inStock: true,
    stockCount: 45,
    imageUrl: '/assets/images/marine_cable_spool_crimping_1791421463275.jpg'
  },
  {
    id: 'cab-35',
    category: 'cable',
    name: 'Tinned Battery Bank Cable 35mm²',
    specification: 'Class 6 ultra flexible tinned copper, 240A rated, heavy duty',
    unit: 'per meter',
    unitPrice: 13.50,
    inStock: true,
    stockCount: 30,
    imageUrl: '/assets/images/marine_cable_spool_crimping_1791421463275.jpg',
    badge: 'Battery Banks'
  },
  {
    id: 'cab-50',
    category: 'cable',
    name: 'Heavy Duty Starter/Inverter Cable 50mm²',
    specification: 'High capacity tinned marine cable, 345A rated',
    unit: 'per meter',
    unitPrice: 18.90,
    inStock: true,
    stockCount: 20,
    imageUrl: '/assets/images/marine_cable_spool_crimping_1791421463275.jpg'
  },

  // Fuse Blocks & Protection
  {
    id: 'fus-6w',
    category: 'fuses',
    name: 'Marine 6-Way ST-Blade Fuse Block with Cover',
    specification: 'Clear insulating cover, LED blown indicator, negative busbar, IP56',
    unit: 'each',
    unitPrice: 28.00,
    inStock: true,
    stockCount: 8,
    imageUrl: '/assets/images/marine_fuse_block_hardware_1791421472296.jpg',
    badge: 'Most Popular'
  },
  {
    id: 'fus-12w',
    category: 'fuses',
    name: 'Marine 12-Way ST-Blade Fuse Block with Cover',
    specification: 'With ground bus & write-on label slots, 100A max block',
    unit: 'each',
    unitPrice: 44.00,
    inStock: true,
    stockCount: 6,
    imageUrl: '/assets/images/marine_fuse_block_hardware_1791421472296.jpg',
    badge: 'Full Refits'
  },
  {
    id: 'fus-mrbf',
    category: 'fuses',
    name: 'MRBF Single Battery Terminal Fuse Holder',
    specification: 'Direct post-clamp mount, IP66 rated, 30A-300A compatible, ABYC compliant',
    unit: 'each',
    unitPrice: 26.50,
    inStock: true,
    stockCount: 12,
    imageUrl: '/assets/images/marine_fuse_block_hardware_1791421472296.jpg',
    badge: 'ABYC Essential'
  },
  {
    id: 'fus-anl',
    category: 'fuses',
    name: 'ANL High-Current Marine Fuse Holder & 150A Fuse',
    specification: 'Heavy duty transparent cover, tin-plated copper terminals',
    unit: 'kit',
    unitPrice: 22.00,
    inStock: true,
    stockCount: 10,
    imageUrl: '/assets/images/marine_fuse_block_hardware_1791421472296.jpg'
  },

  // Busbars & Power Distribution
  {
    id: 'bus-150',
    category: 'busbars',
    name: 'Dual 150A 4-Stud Marine Busbar with Cover',
    specification: 'Tinned copper bar, stainless steel M6 studs & flame retardant base',
    unit: 'each',
    unitPrice: 32.00,
    inStock: true,
    stockCount: 14,
    imageUrl: '/assets/images/marine_fuse_block_hardware_1791421472296.jpg'
  },
  {
    id: 'bus-250',
    category: 'busbars',
    name: 'Heavy Duty 250A Power Distribution Busbar',
    specification: '4x M8 studs, 3x M4 screws, rated up to 48V DC, insulated base',
    unit: 'each',
    unitPrice: 42.00,
    inStock: true,
    stockCount: 9,
    imageUrl: '/assets/images/marine_fuse_block_hardware_1791421472296.jpg'
  },

  // Marine Switches, Terminals & Accessories
  {
    id: 'sw-carl',
    category: 'switches',
    name: 'Carling-Style IP66 Sealed Rocker Switch (12V 20A)',
    specification: 'Dual blue LED illuminated, moisture sealed, laser etched actuator',
    unit: 'each',
    unitPrice: 8.50,
    inStock: true,
    stockCount: 40,
    imageUrl: '/assets/images/marine_fuse_block_hardware_1791421472296.jpg',
    badge: 'Marine Standard'
  },
  {
    id: 'sw-push',
    category: 'switches',
    name: 'Stainless Steel LED Ring Pushbutton (19mm)',
    specification: 'IP67 waterproof 316 stainless, cyan LED ring, latching/momentary',
    unit: 'each',
    unitPrice: 11.00,
    inStock: true,
    stockCount: 25,
    imageUrl: '/assets/images/marine_fuse_block_hardware_1791421472296.jpg'
  },
  {
    id: 'term-heatshrink-pack',
    category: 'switches',
    name: 'Marine Adhesive Heat-Shrink Crimp Terminal Pack (50pcs)',
    specification: 'Tinned copper barrels with dual-wall adhesive glue lining, rings, spades & butt connectors',
    unit: 'pack',
    unitPrice: 18.50,
    inStock: true,
    stockCount: 18,
    imageUrl: '/assets/images/marine_cable_spool_crimping_1791421463275.jpg',
    badge: 'Workshop Grade'
  },
  {
    id: 'sw-isolator-300',
    category: 'switches',
    name: 'Heavy-Duty Marine Battery Master Isolator Switch (300A)',
    specification: 'Ignition protected, removable key/knob, 48V rated, surface or rear mount',
    unit: 'each',
    unitPrice: 24.50,
    inStock: true,
    stockCount: 11,
    imageUrl: '/assets/images/marine_fuse_block_hardware_1791421472296.jpg',
    badge: 'Safety Essential'
  },
  {
    id: 'usb-fast-charger',
    category: 'switches',
    name: 'IP66 Waterproof Dual USB-C PD & QC 3.0 Marine Socket',
    specification: 'Rubber splash cap, blue voltmeter display, fast charges phones & tablets',
    unit: 'each',
    unitPrice: 16.50,
    inStock: true,
    stockCount: 22,
    imageUrl: '/assets/images/marine_fuse_block_hardware_1791421472296.jpg',
    badge: 'Budget Boater Pick'
  },

  // Victron Energy Power Hardware
  {
    id: 'vic-shunt',
    category: 'victron',
    name: 'Victron SmartShunt 500A/50mV Bluetooth Battery Monitor',
    specification: 'All-in-one battery monitor, Bluetooth readout to phone VictronConnect app',
    unit: 'each',
    unitPrice: 128.00,
    inStock: true,
    stockCount: 4,
    imageUrl: '/assets/images/marine_lithium_battery_bank_1791400821608.jpg',
    badge: 'Official Victron'
  },
  {
    id: 'vic-mppt',
    category: 'victron',
    name: 'Victron SmartSolar MPPT 75/15 Charge Controller',
    specification: 'Ultra-fast tracking, up to 220W (12V) solar, Bluetooth built-in',
    unit: 'each',
    unitPrice: 65.00,
    inStock: true,
    stockCount: 5,
    imageUrl: '/assets/images/marine_solar_array_yacht_1791400831647.jpg',
    badge: 'Official Victron'
  },
  {
    id: 'vic-dcdc',
    category: 'victron',
    name: 'Victron Orion-Tr Smart 12/12-30A Non-Isolated DC-DC Charger',
    specification: 'Smart alternator to lithium safe charging, engine shutdown detect',
    unit: 'each',
    unitPrice: 195.00,
    inStock: true,
    stockCount: 3,
    imageUrl: '/assets/images/marine_lithium_battery_bank_1791400821608.jpg',
    badge: 'Lithium Protection'
  },

  // Switch Panel Products
  {
    id: 'pan-face-6',
    category: 'panels',
    name: 'Replica/Custom 6-Gang Marine Faceplate (Faceplate Only)',
    specification: '3mm Matte Black Marine Acrylic, custom etched labels & border',
    unit: 'each',
    unitPrice: 45.00,
    inStock: true,
    stockCount: 99,
    imageUrl: '/assets/images/marine_switch_panel_laser_1791400808406.jpg',
    badge: 'Custom Engraved'
  },
  {
    id: 'pan-kit-6',
    category: 'panels',
    name: '6-Gang Replica/Custom Switch Panel DIY Kit',
    specification: 'Replica/custom faceplate + 6x Carling rockers + marine terminals + fuses',
    unit: 'kit',
    unitPrice: 88.00,
    inStock: true,
    stockCount: 99,
    imageUrl: '/assets/images/marine_switch_panel_laser_1791400808406.jpg',
    badge: 'Complete DIY Kit'
  },
  {
    id: 'pan-wired-6',
    category: 'panels',
    name: '6-Gang Switch Panel Fully Assembled & Bench-Tested',
    specification: 'Drop-in ready, tinned marine bus wiring, heatshrink labeled jumpers',
    unit: 'assembled',
    unitPrice: 135.00,
    inStock: true,
    stockCount: 99,
    imageUrl: '/assets/images/marine_switch_panel_laser_1791400808406.jpg',
    badge: 'Ready to Fit'
  }
];

export const INITIAL_SAMPLE_PANEL: SwitchPanelConfig = {
  material: 'acrylic_black',
  widthMm: 190,
  heightMm: 130,
  gangCount: 6,
  switches: [
    { position: 1, label: 'NAV LIGHTS', breakerRatingAmps: 10, switchType: 'rocker_illuminated' },
    { position: 2, label: 'ANCHOR LIGHT', breakerRatingAmps: 5, switchType: 'rocker_illuminated' },
    { position: 3, label: 'CABIN LIGHTS', breakerRatingAmps: 10, switchType: 'rocker_illuminated' },
    { position: 4, label: 'VHF RADIO', breakerRatingAmps: 15, switchType: 'rocker_illuminated' },
    { position: 5, label: 'BILGE PUMP AUTO', breakerRatingAmps: 15, switchType: 'rocker_illuminated' },
    { position: 6, label: 'SOLAR / BMS', breakerRatingAmps: 20, switchType: 'rocker_illuminated' },
  ],
  hasVoltmeter: true,
  hasUsbCharger: true,
  has12vSocket: false,
  mountingHoleStyle: '4_corner',
  backlightColor: 'cyan',
  packageOption: 'assembled_wired',
  estimatedPrice: 145.00
};

export const INITIAL_JOBS: JobRecord[] = [
  {
    id: 'job-101',
    reference: 'AJW-2026-088',
    clientName: 'David Mercer',
    clientEmail: 'd.mercer@solent-sail.co.uk',
    clientPhone: '07700 900142',
    vesselName: 'Windbird III',
    vesselType: 'Moody 33 Sailing Yacht',
    berthLocation: 'Haslar Marina, Gosport (Pontoon C14)',
    serviceCategory: 'lithium',
    status: 'in_progress',
    hourlyRate: 25,
    diagnosticHours: 3.5,
    materialsUsed: [
      { id: 'mat-1', name: 'Tinned Battery Cable 35mm²', quantity: 4, unit: 'per meter', unitPrice: 13.50 },
      { id: 'mat-2', name: 'MRBF Single Battery Terminal Fuse Holder', quantity: 1, unit: 'each', unitPrice: 26.50 },
      { id: 'mat-3', name: 'Heavy Duty 250A Power Distribution Busbar', quantity: 1, unit: 'each', unitPrice: 42.00 }
    ],
    notes: 'Upgrading 2x 110Ah lead-acid domestic batteries to 200Ah LiFePO4 bank. Installed Victron SmartShunt and Orion DC-DC charger to safeguard alternator diodes.',
    totalLabor: 87.50, // 3.5 hrs * £25
    totalMaterials: 122.50,
    totalEstimated: 210.00,
    depositPaid: true,
    depositAmount: 50.00,
    createdAt: '2026-10-06 11:20',
    messages: [
      {
        id: 'msg-1',
        sender: 'client',
        senderName: 'David Mercer',
        text: 'Hi Anthony, my house batteries are failing to hold charge overnight on anchor. Can we look at swapping to lithium with an alternator protection charger?',
        timestamp: '06 Oct 11:25'
      },
      {
        id: 'msg-2',
        sender: 'ajw',
        senderName: 'Anthony (AJW Marine)',
        text: 'Hi David! Yes, I was on pontoon C yesterday. Moody 33s have a great engine bay for an Orion 30A DC-DC unit. I will test your alternator output first at our £25/hr rate and size the battery cables safely.',
        timestamp: '06 Oct 12:05'
      },
      {
        id: 'msg-3',
        sender: 'client',
        senderName: 'David Mercer',
        text: 'Sounds perfect, go ahead. The companionway hatch is on the pontoon key code.',
        timestamp: '06 Oct 12:40'
      }
    ]
  },
  {
    id: 'job-102',
    reference: 'AJW-2026-089',
    clientName: 'Mark Henderson',
    clientEmail: 'm.henderson@gosport.net',
    clientPhone: '07700 900582',
    vesselName: 'Sea Sprite',
    vesselType: 'Westerly Konsort 29',
    berthLocation: 'Gosport Marina, Gosport (Berth A22)',
    serviceCategory: 'replica_panel',
    status: 'quote_sent',
    hourlyRate: 25,
    diagnosticHours: 0,
    materialsUsed: [],
    notes: 'Original 1982 Westerly Konsort plastic switchboard is cracked around screw holes. Client uploaded photo and wants exact dimension replacement in matte black acrylic with modern rocker switches.',
    totalLabor: 25.00, // 1 hour fitment estimated
    totalMaterials: 88.00, // DIY kit / panel
    totalEstimated: 113.00,
    depositPaid: false,
    depositAmount: 0,
    createdAt: '2026-10-07 09:15',
    replicaImages: [
      '/assets/images/marine_switch_panel_laser_1791400808406.jpg'
    ],
    messages: [
      {
        id: 'msg-10',
        sender: 'client',
        senderName: 'Mark Henderson',
        text: 'Hi Anthony, I uploaded photos of my cracked 1982 Westerly Konsort panel. Can you cut a replacement with the exact same 195mm x 140mm cutout?',
        timestamp: '07 Oct 09:20'
      },
      {
        id: 'msg-11',
        sender: 'ajw',
        senderName: 'Anthony (AJW Marine)',
        text: 'Hi Mark, I have the exact CAD outline template for the Westerly Konsort in my workshop library! I can laser cut it in 3mm UV-resistant matte black acrylic with crisp white engraved text. Quote sent for review.',
        timestamp: '07 Oct 10:02'
      }
    ]
  },
  {
    id: 'job-103',
    reference: 'AJW-2026-090',
    clientName: 'Sarah Jenkins',
    clientEmail: 's.jenkins@solent-yachting.com',
    clientPhone: '07700 900761',
    vesselName: 'Kestrel of Hamble',
    vesselType: 'Bavaria 37 Cruiser',
    berthLocation: 'Port Solent Marina (Pontoon F08)',
    serviceCategory: 'diagnostic',
    status: 'scheduled',
    hourlyRate: 25,
    diagnosticHours: 0,
    materialsUsed: [],
    notes: 'Intermittent NMEA 2000 depth transducer dropouts and parasitic battery drain of 0.8A with all master switches supposedly off.',
    totalLabor: 50.00, // 2 hour diagnostic allowance
    totalMaterials: 0,
    totalEstimated: 50.00,
    depositPaid: true,
    depositAmount: 25.00,
    createdAt: '2026-10-07 11:45',
    messages: [
      {
        id: 'msg-20',
        sender: 'client',
        senderName: 'Sarah Jenkins',
        text: 'Hello, I have an annoying battery drain at Port Solent. Every 4 days on the berth my starter battery is flat despite solar. Need diagnostics aboard.',
        timestamp: '07 Oct 11:48'
      },
      {
        id: 'msg-21',
        sender: 'ajw',
        senderName: 'Anthony (AJW Marine)',
        text: 'Booked in for Thursday morning. I will bring the DC clamp meter and thermal imager to trace the leakage current wire by wire.',
        timestamp: '07 Oct 12:15'
      }
    ]
  }
];

export const INITIAL_VESSEL_SPEC: VesselSpec = {
  id: 'vessel-windbird-3',
  vesselName: 'Windbird III',
  makeModel: 'Moody 33 Centre Cockpit',
  year: 1979,
  hinNumber: 'MDY-33-0412-1979',
  sailNumber: 'GBR-4019K',
  homeMarina: 'Haslar Marina, Gosport',
  berthPontoon: 'Pontoon C, Berth 14',
  systemVoltage: '12V',
  houseBatteryType: 'LiFePO4 Lithium',
  houseCapacityAh: 200,
  houseBankInstalled: 'October 2026',
  starterBatteryType: 'Varta Silver Dynamic 85Ah Heavy Duty Lead-Acid',
  starterCapacityAh: 85,
  starterCca: 800,
  alternatorRating: 'Hitachi 55A Engine Alternator with Belt Upgrade',
  dcDcCharger: 'Victron Orion-Tr Smart 12/12-30A Non-Isolated (Bluetooth)',
  solarWatts: 350,
  solarType: '2x 175W Rigid Monocrystalline Panels on Stainless Stern Arch',
  solarController: 'Victron SmartSolar MPPT 100/30 (Bluetooth)',
  batteryMonitor: 'Victron SmartShunt 500A/50mV on House Negative Bus',
  shorePowerRating: '230V 16A Shore Connection with 30mA RCD Consumer Unit',
  hasGalvanicIsolator: true,
  inverterModel: 'Victron Phoenix 12/800VA Pure Sine Wave',
  navigationNetwork: 'NMEA 2000 Micro-C Powered Backbone with Dual Terminators',
  chartplotterModel: 'Raymarine Axiom 9+ Touch MFD with Navionics UK+Ireland',
  vhfAisDetails: 'Standard Horizon Matrix GX2400GPS with NMEA 2000 AIS (MMSI: 235084129)',
  bilgePumpConfig: 'Rule 1100 GPH Automatic Submersible with SuperSwitch Float & Cockpit Audio Alarm',
  switchPanelModel: 'AJWMES 6-Gang Replica/Custom Matte Black Marine Acrylic Switch Panel with Push Breakers',
  generalNotes: 'Full DC negative distribution bus upgrade completed. Tinned 35mm² battery interconnects with MRBF terminal fuse protection.',
  lastInspectionDate: '2026-10-06',
  historyLog: [
    {
      id: 'log-1',
      date: '2026-10-06',
      title: 'Lithium (LiFePO4) 200Ah Bank Conversion & DC-DC Protection',
      contractor: 'AJW Marine Electrical Services',
      category: 'battery_upgrade',
      description: 'Replaced failing dual 110Ah lead-acid domestic bank with 200Ah LiFePO4 bank. Installed Victron Orion-Tr Smart 30A DC-DC charger to safeguard engine alternator from overheating/diode burnout, plus MRBF fuse on positive terminal.',
      partsReplaced: [
        '200Ah LiFePO4 Battery Bank',
        'Victron Orion-Tr Smart 12/12-30A',
        '35mm² Tinned Battery Cable & Heavy Duty Busbar',
        'MRBF 200A Terminal Fuse'
      ],
      jobReference: 'AJW-2026-088'
    },
    {
      id: 'log-2',
      date: '2026-06-12',
      title: 'Solar Stern Arch Array & SmartSolar MPPT Installation',
      contractor: 'AJW Marine Electrical Services',
      category: 'solar',
      description: 'Mounted two 175W rigid monocrystalline solar panels onto existing stainless stern arch. Routed UV-resistant twin 6mm² marine solar cable through deck gland to Victron SmartSolar MPPT 100/30.',
      partsReplaced: [
        '2x 175W Rigid Solar Panels',
        'Victron SmartSolar MPPT 100/30',
        'Scanstrut Double Cable Seal'
      ],
      jobReference: 'AJW-2026-041'
    },
    {
      id: 'log-3',
      date: '2025-09-18',
      title: 'Galvanic Isolator & 230V AC Shore Power Safety Audit',
      contractor: 'AJW Marine Electrical Services',
      category: 'inspection',
      description: 'Annual Solent marina shore power inspection. Installed 16A Zinc Saver galvanic isolator in green/yellow earth conductor to prevent underwater galvanic anode wasting in Haslar marina slip.',
      partsReplaced: [
        'Sterling Power 16A Waterproof Galvanic Isolator',
        'Hager 16A 30mA Type A RCD'
      ],
      jobReference: 'AJW-2025-119'
    },
    {
      id: 'log-4',
      date: '2024-04-05',
      title: 'Primary Bilge Pump Rewire & Cockpit High-Water Alarm',
      contractor: 'Owner & AJW Marine',
      category: 'maintenance',
      description: 'Rewired automatic bilge pump feed directly to domestic bus with 15A continuous fuse bypass. Added dash override 3-way toggle switch (Auto / Off / Manual) with 85dB piezo warning buzzer.',
      partsReplaced: [
        'Rule 1100 GPH Submersible Pump',
        'Rule-A-Matic Plus Float Switch',
        'Tinned 2.5mm² Twin Cable'
      ]
    }
  ]
};

export const INITIAL_POSTAL_ORDERS: PostalOrder[] = [
  {
    id: 'ord-101',
    orderNumber: 'AJW-POST-2841',
    customerName: 'Marcus Bennett',
    customerEmail: 'm.bennett@solentsailor.co.uk',
    customerPhone: '07700 900412',
    shippingAddress: {
      fullName: 'Marcus Bennett',
      email: 'm.bennett@solentsailor.co.uk',
      phone: '07700 900412',
      addressLine1: 'Hamble Point Marina, School Lane',
      addressLine2: 'Berth F-12 (Yacht "Sea Rover")',
      city: 'Southampton',
      postcode: 'SO31 4NB',
      isMarinaDelivery: true,
      marinaName: 'Hamble Point Marina',
      berthNumber: 'Pontoon F-12',
      deliveryNotes: 'Leave in marina office if not on board.'
    },
    shippingMethod: 'royal_mail_tracked',
    shippingCost: 4.50,
    items: [
      {
        itemId: 'cab-25',
        name: 'Tinned Twin Flat Marine Cable 2.5mm²',
        unit: 'per meter',
        quantity: 12,
        unitPrice: 2.80,
        lineTotal: 33.60
      },
      {
        itemId: 'fus-6w',
        name: 'Marine 6-Way ST-Blade Fuse Block with Cover',
        unit: 'each',
        quantity: 1,
        unitPrice: 28.00,
        lineTotal: 28.00
      },
      {
        itemId: 'sw-carl',
        name: 'Carling-Style IP66 Sealed Rocker Switch (12V 20A)',
        unit: 'each',
        quantity: 2,
        unitPrice: 8.50,
        lineTotal: 17.00
      }
    ],
    subtotal: 78.60,
    total: 83.10,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    orderStatus: 'received',
    createdAt: '2026-10-07 14:15',
    notes: 'Wiring in a new automatic bilge pump and dashboard switch.'
  },
  {
    id: 'ord-102',
    orderNumber: 'AJW-POST-2839',
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah.jenkins@cowesyacht.com',
    customerPhone: '07700 900892',
    shippingAddress: {
      fullName: 'Sarah Jenkins',
      email: 'sarah.jenkins@cowesyacht.com',
      phone: '07700 900892',
      addressLine1: '14 High Street',
      city: 'Cowes, Isle of Wight',
      postcode: 'PO31 7BD',
      isMarinaDelivery: false,
      deliveryNotes: 'Safe place: Porch'
    },
    shippingMethod: 'royal_mail_tracked',
    shippingCost: 4.50,
    items: [
      {
        itemId: 'vic-shunt',
        name: 'Victron SmartShunt 500A/50mV Bluetooth Battery Monitor',
        unit: 'each',
        quantity: 1,
        unitPrice: 128.00,
        lineTotal: 128.00
      },
      {
        itemId: 'fus-mrbf',
        name: 'MRBF Single Battery Terminal Fuse Holder',
        unit: 'each',
        quantity: 1,
        unitPrice: 26.50,
        lineTotal: 26.50
      }
    ],
    subtotal: 154.50,
    total: 154.50, // Free shipping over £75
    paymentMethod: 'card',
    paymentStatus: 'paid',
    orderStatus: 'dispatched',
    trackingNumber: 'GB289192482RM',
    trackingCarrier: 'Royal Mail Tracked 24',
    createdAt: '2026-10-06 09:30',
    dispatchedAt: '2026-10-06 15:45',
    notes: 'Dispatched from Gosport workshop.'
  },
  {
    id: 'ord-103',
    orderNumber: 'AJW-POST-2845',
    customerName: 'David Mercer',
    customerEmail: 'd.mercer@solent-sail.co.uk',
    customerPhone: '07700 900552',
    shippingAddress: {
      fullName: 'David Mercer',
      email: 'd.mercer@solent-sail.co.uk',
      phone: '07700 900552',
      addressLine1: 'Gosport Marina, Mumby Road',
      addressLine2: 'Berth D-18 (Yacht "Solent Wind")',
      city: 'Gosport',
      postcode: 'PO12 1AH',
      isMarinaDelivery: true,
      marinaName: 'Gosport Marina',
      berthNumber: 'Pontoon D-18',
      deliveryNotes: 'Drop with marina reception or leave on pontoon'
    },
    shippingMethod: 'solent_pickup',
    shippingCost: 0,
    items: [
      {
        itemId: 'cab-25',
        name: 'Tinned Twin Flat Marine Cable 2.5mm²',
        unit: 'per meter',
        quantity: 20,
        unitPrice: 2.80,
        lineTotal: 56.00
      },
      {
        itemId: 'term-heatshrink-pack',
        name: 'Marine Adhesive Heat-Shrink Crimp Terminal Pack (50pcs)',
        unit: 'pack',
        quantity: 1,
        unitPrice: 18.50,
        lineTotal: 18.50
      }
    ],
    subtotal: 74.50,
    total: 74.50,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    orderStatus: 'processing',
    createdAt: '2026-10-08 08:30',
    notes: 'Bench assembly in progress: continuous spool measurement & crimp QA.'
  },
  {
    id: 'ord-104',
    orderNumber: 'AJW-POST-2830',
    customerName: 'Capt. Tom Hall',
    customerEmail: 't.hall@yachtclub-solent.org',
    customerPhone: '07700 900721',
    shippingAddress: {
      fullName: 'Capt. Tom Hall',
      email: 't.hall@yachtclub-solent.org',
      phone: '07700 900721',
      addressLine1: 'Port Solent Marina, The Boardwalk',
      addressLine2: 'Berth B-04',
      city: 'Portsmouth',
      postcode: 'PO6 4TP',
      isMarinaDelivery: true,
      marinaName: 'Port Solent Marina',
      berthNumber: 'Berth B-04',
      deliveryNotes: 'Delivered to vessel'
    },
    shippingMethod: 'royal_mail_tracked',
    shippingCost: 4.50,
    items: [
      {
        itemId: 'bus-150',
        name: 'Dual 150A 4-Stud Marine Busbar with Cover',
        unit: 'each',
        quantity: 1,
        unitPrice: 32.00,
        lineTotal: 32.00
      },
      {
        itemId: 'sw-isolator-300',
        name: 'Heavy-Duty Marine Battery Master Isolator Switch (300A)',
        unit: 'each',
        quantity: 1,
        unitPrice: 24.50,
        lineTotal: 24.50
      }
    ],
    subtotal: 56.50,
    total: 61.00,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    orderStatus: 'delivered',
    trackingNumber: 'GB194829104RM',
    trackingCarrier: 'Royal Mail Tracked 24',
    createdAt: '2026-10-04 11:15',
    dispatchedAt: '2026-10-04 16:30',
    deliveredAt: '2026-10-05 13:40',
    notes: 'Delivered safely and signed for at Port Solent marina office.'
  }
];

