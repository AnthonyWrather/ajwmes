import { SupplierInfo, CatalogItem, StockAlert } from '../types';

export const MARINE_SUPPLIERS: SupplierInfo[] = [
  {
    id: 'sup-aquafax',
    name: 'Aquafax Marine Distribution Ltd',
    category: 'fuses',
    email: 'orders@aquafax.co.uk',
    phone: '01582 568700',
    location: 'Hamble River / Poole Depot',
    defaultLeadTime: 'Next Day Courier (Pre-12:00)',
    accountNumber: 'AJW-MAR-44910'
  },
  {
    id: 'sup-marlin',
    name: 'Marlin Marine Cable & Wire UK',
    category: 'cable',
    email: 'trade@marlin-marine-cable.co.uk',
    phone: '01329 845210',
    location: 'Fareham Industrial Park, Hampshire',
    defaultLeadTime: 'Same Day Solent Courier / Next Day',
    accountNumber: 'AJW-CABLE-772'
  },
  {
    id: 'sup-victron-energy',
    name: 'Energy Solutions (UK) — Victron Authorized',
    category: 'victron',
    email: 'sales@energy-solutions.co.uk',
    phone: '01634 290772',
    location: 'Solent Marine Technical Distribution',
    defaultLeadTime: '1-2 Working Days',
    accountNumber: 'AJW-VICT-9043'
  },
  {
    id: 'sup-furneaux',
    name: 'Furneaux Riddall Marine Electrical',
    category: 'switches',
    email: 'orders@furneaux-riddall.co.uk',
    phone: '023 9266 8621',
    location: 'Portsmouth Marine Hub, PO3 5NY',
    defaultLeadTime: 'Next Morning Workshop Delivery',
    accountNumber: 'AJW-ELEC-2209'
  },
  {
    id: 'sup-solent-laser',
    name: 'Solent Marine Laser & Acrylic Engraving',
    category: 'panels',
    email: 'supply@solent-marine-laser.co.uk',
    phone: '023 9252 4410',
    location: 'Haslar Marina Yard, Gosport PO12 1NU',
    defaultLeadTime: '24-48 Hours Custom Mill',
    accountNumber: 'AJW-PANEL-011'
  }
];

export function getDefaultSupplierForCategory(category: string): SupplierInfo {
  const match = MARINE_SUPPLIERS.find(s => s.category === category);
  return match || MARINE_SUPPLIERS[0];
}

export function generateStockAlertEmail(item: CatalogItem, triggerSource: StockAlert['triggerSource']): {
  subject: string;
  body: string;
} {
  const timeStr = new Date().toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const sourceLabels: Record<StockAlert['triggerSource'], string> = {
    order_placement: 'Online Postal Order Fulfillment',
    manual_adjustment: 'Workshop Inventory Adjustment / Tally',
    workshop_job: 'Vessel Diagnostics Job Sheet Allocation',
    simulation: 'Inventory Automation Test / Depletion Trigger'
  };

  const supplier = getDefaultSupplierForCategory(item.category);
  const recommendedQty = item.category === 'cable' ? 50 : 10;
  const estimatedWholesale = (item.unitPrice * 0.65).toFixed(2);

  const subject = `🚨 [ZERO STOCK ALERT] ${item.name} is at 0 units — AJW Marine Restock Needed`;

  const body = `URGENT WORKSHOP INVENTORY ALERT
--------------------------------------------------
To: anthonywrather@gmail.com
From: AJW Marine Electrical Systems <inventory-alerts@ajwmarineelectrical.co.uk>
Timestamp: ${timeStr}
Alert Level: CRITICAL (STOCK COUNT = 0)

Part Details:
• Item Name:     ${item.name}
• Specification: ${item.specification}
• Category:      ${item.category.toUpperCase()}
• Remaining:     0 ${item.unit} (COMPLETELY DEPLETED)
• Trigger Event: ${sourceLabels[triggerSource]}

Primary Wholesaler:
• Supplier:      ${supplier.name}
• Order Email:   ${supplier.email}
• Trade Acc #:   ${supplier.accountNumber}
• Est. Lead:     ${supplier.defaultLeadTime}

Recommended Action:
Draft a trade replenishment order immediately to avoid job delays for Solent vessel refits.
• Suggested Batch: ${recommendedQty} ${item.unit}(s)
• Est. Trade Unit: £${estimatedWholesale} (ex VAT)

Click "Reorder from Supplier" in your AJW dashboard to auto-generate the purchase order.
`;

  return { subject, body };
}

export function generateSupplierPOEmail(params: {
  poNumber: string;
  item: CatalogItem;
  supplier: SupplierInfo;
  quantity: number;
  unitCost: number;
  shippingSpeed: string;
  deliveryNotes?: string;
}): {
  subject: string;
  body: string;
} {
  const total = (params.quantity * params.unitCost).toFixed(2);
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const subject = `PURCHASE ORDER [${params.poNumber}]: ${params.quantity}x ${params.item.name} — AJW Marine Electrical Services`;

  const body = `Attn: Trade Sales & Fulfillment Desk
${params.supplier.name}
Via: ${params.supplier.email}

RE: TRADE PURCHASE ORDER ${params.poNumber}
Date: ${dateStr}
AJW Trade Account: ${params.supplier.accountNumber}

Dear ${params.supplier.name} Orders Team,

Please process and dispatch the following workshop restocking order urgently for AJW Marine Electrical Services:

ORDER SUMMARY:
----------------------------------------------------------------------
Item:         ${params.item.name}
Part / Spec:  ${params.item.specification}
Quantity:     ${params.quantity} ${params.item.unit}
Agreed Trade: £${params.unitCost.toFixed(2)} / ${params.item.unit} (ex. VAT)
Subtotal:     £${total} (Trade PO)
Dispatch:     ${params.shippingSpeed.replace(/_/g, ' ').toUpperCase()}
----------------------------------------------------------------------

DELIVERY ADDRESS:
AJW Marine Electrical Services
Workshop Unit 4, Haslar Marina Yard
Haslar Road, Gosport, Hampshire
PO12 1NU, United Kingdom
FAO: Anthony Wrather (Mobile: 07700 900224)

SPECIAL INSTRUCTIONS:
Please bill to our existing trade account. Stock level in our Gosport workshop currently stands at 0 units; earliest dispatch is greatly appreciated to fulfill scheduled yacht diagnostics in the Solent.

${params.deliveryNotes ? `Notes: ${params.deliveryNotes}\n` : ''}
Thank you,

Anthony Wrather
Owner & Marine Electrical Technician
AJW Marine Electrical Services
Email: anthonywrather@gmail.com | Phone: 07700 900224
Web: ajwmarineelectrical.co.uk
`;

  return { subject, body };
}
