import { ManualChapter, UserRole } from '../types';

export const ROLE_MANUAL_CHAPTERS: ManualChapter[] = [
  // --- GUEST ROLE ---
  {
    id: 'guest-cad-configurator',
    title: 'Custom Switch Panel CAD Configurator',
    summary: 'Design bespoke marine acrylic switch panels with live cutout geometry, voltmeters, and instant fabrication quotation.',
    role: 'guest',
    durationMinutes: 4,
    videoUrl: '/videos/guest-cad-configurator.mp4',
    vttUrl: '/videos/guest-cad-configurator.vtt',
    posterUrl: '/assets/cad-preview.png',
    jumpTab: 'designer',
    steps: [
      {
        id: 'step-guest-cad-1',
        title: 'Open Switch Panel Designer',
        description: 'Navigate to the Switch Panels tab from the top navigation bar to open the vector CAD workspace.',
        timestampSeconds: 0,
        shortcut: 'Click "Switch Panels"'
      },
      {
        id: 'step-guest-cad-2',
        title: 'Configure Panel Dimensions & Material',
        description: 'Specify width (150mm–500mm), height (100mm–400mm), corner radius, and material (Gloss Black Acrylic or Brushed Silver).',
        timestampSeconds: 30,
        safetyTip: 'Ensure at least 25mm clearance between component cutouts and panel edges for structural integrity.'
      },
      {
        id: 'step-guest-cad-3',
        title: 'Add Rocker Switches & Digital Voltmeters',
        description: 'Drag and drop standard Contura rocker switches, USB-C marine chargers, and battery monitor displays onto the grid.',
        timestampSeconds: 75
      },
      {
        id: 'step-guest-cad-4',
        title: 'Review Live Surcharges & Export Quote',
        description: 'Inspect the automatically calculated laser cutting and component cost, then click Add to Basket or Request Formal Quote.',
        timestampSeconds: 150
      }
    ]
  },
  {
    id: 'guest-replica-quoter',
    title: 'Weathered Switchboard Photo Replica Quoter',
    summary: 'Upload a smartphone photo of an aged or broken boat electrical panel to extract dimensions and request a 1:1 acrylic replica.',
    role: 'guest',
    durationMinutes: 3,
    videoUrl: '/videos/guest-replica-quoter.mp4',
    vttUrl: '/videos/guest-replica-quoter.vtt',
    posterUrl: '/assets/replica-preview.png',
    jumpTab: 'replica',
    steps: [
      {
        id: 'step-guest-rep-1',
        title: 'Upload Pontoon Photo',
        description: 'Upload a clear head-on photo of the existing switchboard with a ruler or coin for scale reference.',
        timestampSeconds: 0
      },
      {
        id: 'step-guest-rep-2',
        title: 'Select Panel Architecture Preset',
        description: 'Choose between Compact Tender, Offshore Cruiser, or Twin Engine Flybridge templates to prefill baseline component counts.',
        timestampSeconds: 45
      },
      {
        id: 'step-guest-rep-3',
        title: 'Submit for CAD Laser Studio Engineering',
        description: 'Enter your contact details and Solent berth location to submit the job directly to the workshop queue.',
        timestampSeconds: 110
      }
    ]
  },
  {
    id: 'guest-consignment-tracking',
    title: 'Tracking Postal Electrical Consignments',
    summary: 'Track the status of mail-in alternator repairs, custom panel builds, and dispatched packages using your tracking reference.',
    role: 'guest',
    durationMinutes: 2,
    videoUrl: '/videos/guest-consignment-tracking.mp4',
    vttUrl: '/videos/guest-consignment-tracking.vtt',
    jumpTab: 'tracker',
    steps: [
      {
        id: 'step-guest-trk-1',
        title: 'Enter Postal Tracking Reference',
        description: 'Input your 13-character Royal Mail Tracked reference (e.g. GB-123456789-RM) or AJW workshop consignment code.',
        timestampSeconds: 0,
        shortcut: 'Press Enter to search'
      },
      {
        id: 'step-guest-trk-2',
        title: 'Inspect Milestone Timeline',
        description: 'View real-time progression from Workshop Intake, Bench Testing, Component Rewire, to Carrier Out for Delivery.',
        timestampSeconds: 40
      }
    ]
  },

  // --- CLIENT ROLE ---
  {
    id: 'client-vessel-management',
    title: 'Boat Owner Vessel Profile & Battery Bank Spec',
    summary: 'Manage your vessel specifications, system voltage (12V/24V), battery chemistry (LiFePO4/AGM), and marina berth.',
    role: 'client',
    durationMinutes: 4,
    videoUrl: '/videos/client-vessel-management.mp4',
    vttUrl: '/videos/client-vessel-management.vtt',
    jumpTab: 'portal',
    steps: [
      {
        id: 'step-cli-vessel-1',
        title: 'Access Vessel Portal',
        description: 'Open the Vessel Portal from the top navigation to view your registered vessels and electrical history.',
        timestampSeconds: 0
      },
      {
        id: 'step-cli-vessel-2',
        title: 'Update Battery Chemistry & Capacity',
        description: 'Specify your service bank capacity (e.g. 400Ah Lithium LiFePO4) and engine cranking battery configuration.',
        timestampSeconds: 40,
        safetyTip: 'Verify alternator charging voltage regulation before switching lead-acid banks to drop-in lithium.'
      },
      {
        id: 'step-cli-vessel-3',
        title: 'Export jsPDF Marine Electrical Certificate',
        description: 'Click "Export Electrical Summary (PDF)" to generate an insurer-approved compliance certificate and schematic rollup.',
        timestampSeconds: 120
      }
    ]
  },
  {
    id: 'client-diagnostic-signoff',
    title: 'Pontoon Diagnostic Review & Digital Sign-Off',
    summary: 'Review field technician inspection notes, photo proofs of pontoon repairs, and approve completed work orders.',
    role: 'client',
    durationMinutes: 3,
    videoUrl: '/videos/client-diagnostic-signoff.mp4',
    vttUrl: '/videos/client-diagnostic-signoff.vtt',
    jumpTab: 'portal',
    steps: [
      {
        id: 'step-cli-sign-1',
        title: 'Open Technician Work Order Thread',
        description: 'Review the chronological timeline of fault diagnostics and high-resolution photo proofs captured aboard your vessel.',
        timestampSeconds: 0
      },
      {
        id: 'step-cli-sign-2',
        title: 'Verify Labor Hours & Materials',
        description: 'Inspect the flat-rate £25/hour stopwatch breakdown and listed marine-grade tinned wire / fuses.',
        timestampSeconds: 50
      },
      {
        id: 'step-cli-sign-3',
        title: 'Digital Customer Sign-Off',
        description: 'Sign digitally to authorize completed work and receive your VAT invoice and warranty certificate via email.',
        timestampSeconds: 110
      }
    ]
  },

  // --- TECHNICIAN ROLE ---
  {
    id: 'tech-diagnostic-workstation',
    title: 'Pontoon Diagnostic Workstation & Stopwatch Billing',
    summary: 'Operate the pontoon technician workstation, track precision labor billing (£25/hr), and log tinned marine components.',
    role: 'technician',
    durationMinutes: 5,
    videoUrl: '/videos/tech-diagnostic-workstation.mp4',
    vttUrl: '/videos/tech-diagnostic-workstation.vtt',
    jumpTab: 'technician',
    steps: [
      {
        id: 'step-tech-diag-1',
        title: 'Select Scheduled Vessel Job',
        description: 'Select an assigned pontoon job from the field queue to view the vessel berth, fault symptoms, and history.',
        timestampSeconds: 0
      },
      {
        id: 'step-tech-diag-2',
        title: 'Start Diagnostic Stopwatch',
        description: 'Click "Start Timer" when boarding the vessel. The system tracks billable hours calculated at the £25/hr flat rate.',
        timestampSeconds: 45,
        shortcut: 'Click Start / Pause'
      },
      {
        id: 'step-tech-diag-3',
        title: 'Requisition Marine Materials',
        description: 'Add marine-grade tinned copper cable (16mm²–70mm²), ANL fuses, busbars, and Victron battery protect modules.',
        timestampSeconds: 110
      },
      {
        id: 'step-tech-diag-4',
        title: 'Capture Canvas Digital Signature',
        description: 'Hand the tablet to the vessel owner to record a digital signature directly onto the HTML5 touch canvas.',
        timestampSeconds: 190,
        safetyTip: 'Always verify bilge isolation and master breaker lockouts before completing pontoon handoff.'
      }
    ]
  },
  {
    id: 'tech-offline-resilience',
    title: 'Faraday Blackout & Offshore Offline Synchronization',
    summary: 'Maintain full diagnostic capability inside steel/aluminum boat hulls with automatic IndexedDB queueing and sync recovery.',
    role: 'technician',
    durationMinutes: 3,
    videoUrl: '/videos/tech-offline-resilience.mp4',
    vttUrl: '/videos/tech-offline-resilience.vtt',
    jumpTab: 'technician',
    steps: [
      {
        id: 'step-tech-off-1',
        title: 'Identify Offline Mode Indicator',
        description: 'When operating in remote marinas without cellular signal, the amber "Offline Pontoon Mode" banner activates.',
        timestampSeconds: 0
      },
      {
        id: 'step-tech-off-2',
        title: 'Log Jobs & Photos Locally',
        description: 'All stopwatch increments, inspection notes, and high-resolution photos are securely saved to local IndexedDB storage.',
        timestampSeconds: 40
      },
      {
        id: 'step-tech-off-3',
        title: 'Automatic Background Reconnection',
        description: 'Once re-entering 4G/WiFi coverage on the marina head, the mutation queue replays automatically to Cloud Firestore.',
        timestampSeconds: 100
      }
    ]
  },

  // --- POSTAL ROLE ---
  {
    id: 'postal-fulfillment-dispatch',
    title: 'Workshop Postal Intake, Thermal Labels & Dispatch',
    summary: 'Receive mail-in electrical assemblies, calculate ShipStation carrier rates, and print 4x6" thermal courier shipping labels.',
    role: 'postal',
    durationMinutes: 4,
    videoUrl: '/videos/postal-fulfillment-dispatch.mp4',
    vttUrl: '/videos/postal-fulfillment-dispatch.vtt',
    jumpTab: 'postal',
    steps: [
      {
        id: 'step-post-1',
        title: 'Process Inbound Consignment',
        description: 'Scan or select the postal consignment from the intake bench queue.',
        timestampSeconds: 0
      },
      {
        id: 'step-post-2',
        title: 'Dimension Package & Fetch Live Carrier Rates',
        description: 'Enter package weight (kg) and box dimensions. The system queries ShipStation for Royal Mail Tracked 24 and DPD Express rates.',
        timestampSeconds: 45
      },
      {
        id: 'step-post-3',
        title: 'Generate 4x6" SVG Thermal Courier Label',
        description: 'Click "Generate Thermal Label" to render an authentic 4x6" SVG label with Royal Mail 2D matrix barcode and packing slip.',
        timestampSeconds: 110,
        safetyTip: 'Ensure thermal printers are set to 203 DPI (8 dots/mm) for optimal postal barcode scanning.'
      },
      {
        id: 'step-post-4',
        title: 'Advance Postal Timeline & Notify Client',
        description: 'Mark the package as Dispatched. An automated transactional email with tracking links is sent to the client.',
        timestampSeconds: 170
      }
    ]
  },

  // --- ADMIN ROLE ---
  {
    id: 'admin-workshop-financials',
    title: 'Master Workshop Financials, Expenses & Rollups',
    summary: 'Oversee workshop gross revenue, technician labor margins, material cost markups, and billable vs overhead classification.',
    role: 'admin',
    durationMinutes: 5,
    videoUrl: '/videos/admin-workshop-financials.mp4',
    vttUrl: '/videos/admin-workshop-financials.vtt',
    jumpTab: 'admin',
    steps: [
      {
        id: 'step-adm-fin-1',
        title: 'Workshop Revenue KPI Dashboard',
        description: 'Review total revenue, active technician hours billed, pending postal orders, and inventory valuation.',
        timestampSeconds: 0
      },
      {
        id: 'step-adm-fin-2',
        title: 'Track Job Expenses & Supplier Invoices',
        description: 'Log supplier receipts, classify expenses as Billable Client Materials or Workshop Overhead, and link purchase orders.',
        timestampSeconds: 60
      },
      {
        id: 'step-adm-fin-3',
        title: 'Export Financial & Tax Summary',
        description: 'Generate comprehensive financial snapshots for HMRC accounting and workshop profit/loss analysis.',
        timestampSeconds: 140
      }
    ]
  },
  {
    id: 'admin-inventory-laser',
    title: 'Hardware Inventory Sync & Laser Cut Studio',
    summary: 'Manage marine electrical stock, configure automated zero-stock alerts, and review switch panel CAD laser cut paths.',
    role: 'admin',
    durationMinutes: 4,
    videoUrl: '/videos/admin-inventory-laser.mp4',
    vttUrl: '/videos/admin-inventory-laser.vtt',
    jumpTab: 'admin',
    steps: [
      {
        id: 'step-adm-inv-1',
        title: 'Inventory Catalog & Depletion Alerts',
        description: 'Monitor live component quantities. When stock reaches 0, automated re-order drafts are created for suppliers.',
        timestampSeconds: 0
      },
      {
        id: 'step-adm-inv-2',
        title: 'Laser Cut Studio Vector Inspection',
        description: 'Review vector laser toolpaths for client-submitted switch panels prior to acrylic cutting on the workshop CNC bed.',
        timestampSeconds: 70
      }
    ]
  },

  // --- SITE ROLE ---
  {
    id: 'site-environment-admin',
    title: 'Platform Infrastructure, Multi-Environment & Security',
    summary: 'Configure Firebase Cloud Function gateways, inspect live environment variables, manage Stripe keys, and audit RBAC permissions.',
    role: 'site',
    durationMinutes: 4,
    videoUrl: '/videos/site-environment-admin.mp4',
    vttUrl: '/videos/site-environment-admin.vtt',
    steps: [
      {
        id: 'step-site-1',
        title: 'Access Platform & Environment Settings',
        description: 'Open the Site Administrator console to review detected runtime hosting (AI Studio Dev, Preview, or Production).',
        timestampSeconds: 0
      },
      {
        id: 'step-site-2',
        title: 'Inspect Gateway Diagnostics & API Keys',
        description: 'Verify connectivity status for Resend email dispatch, ShipStation postal courier APIs, and Stripe payment gateways.',
        timestampSeconds: 50,
        safetyTip: 'Never expose production secret keys in browser storage; verify keys via the server-side Cloud Function health probes.'
      },
      {
        id: 'step-site-3',
        title: 'Audit User Accounts & RBAC Matrix',
        description: 'Manage registered user accounts, adjust user roles between guest/client/technician/postal/admin, and inspect role guard rules.',
        timestampSeconds: 120
      }
    ]
  }
];

export function getChaptersForRole(role: UserRole): ManualChapter[] {
  return ROLE_MANUAL_CHAPTERS.filter(ch => ch.role === role);
}

export function searchManualChapters(query: string, filterRole?: UserRole): ManualChapter[] {
  const clean = query.trim().toLowerCase();
  let list = filterRole ? getChaptersForRole(filterRole) : ROLE_MANUAL_CHAPTERS;
  if (!clean) return list;

  return list.filter(ch => {
    const titleMatch = ch.title.toLowerCase().includes(clean);
    const summaryMatch = ch.summary.toLowerCase().includes(clean);
    const stepMatch = ch.steps.some(s => 
      s.title.toLowerCase().includes(clean) || 
      s.description.toLowerCase().includes(clean) || 
      (s.safetyTip && s.safetyTip.toLowerCase().includes(clean))
    );
    return titleMatch || summaryMatch || stepMatch;
  });
}
