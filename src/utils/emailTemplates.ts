import { 
  UserProfile, 
  PostalOrder, 
  PostalOrderShippingAddress,
  JobRecord, 
  CustomerSignOffRecord, 
  StockAlert 
} from '../types';

/**
 * Formats a PostalOrderShippingAddress object or string into a clean destination summary.
 */
export function formatShippingAddress(addr?: PostalOrderShippingAddress | string): string {
  if (!addr) return 'Gosport Workshop Pickup';
  if (typeof addr === 'string') return addr;
  const parts = [
    addr.addressLine1,
    addr.addressLine2,
    addr.city,
    addr.postcode,
    addr.marinaName ? `Marina: ${addr.marinaName}` : null,
    addr.berthNumber ? `Berth: ${addr.berthNumber}` : null
  ].filter(Boolean);
  return parts.join(', ');
}

/**
 * Common HTML email wrapper conforming to AJW Marine branding:
 * Deep Navy background (#0A192F), warm amber accents (#F59E0B),
 * clean responsive typography and Solent marine workshop signature.
 */
export function wrapEmailLayout(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #050d1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #0a192f; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #0d2040 0%, #0a192f 100%); padding: 24px; border-bottom: 2px solid #f59e0b; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .header p { margin: 4px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #38bdf8; font-weight: 700; }
    .content { padding: 28px 24px; font-size: 14px; line-height: 1.6; color: #cbd5e1; }
    .footer { background-color: #061122; padding: 20px 24px; border-top: 1px solid #1e293b; text-align: center; font-size: 11px; color: #64748b; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #0284c7; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 13px; border-radius: 8px; margin: 16px 0; text-align: center; }
    .badge { display: inline-block; padding: 3px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 4px; background-color: #082f49; color: #38bdf8; border: 1px solid #0284c7; }
    .card { background-color: #0f2744; border: 1px solid #1e3a5f; border-radius: 12px; padding: 16px; margin: 16px 0; }
    .card table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .card th { text-align: left; color: #94a3b8; padding-bottom: 8px; border-bottom: 1px solid #1e3a5f; }
    .card td { padding: 8px 0; border-bottom: 1px solid #1e3a5f40; color: #e2e8f0; }
    .price { font-weight: 700; color: #f59e0b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ AJW Marine Electrical Services</h1>
      <p>Gosport & Solent Diagnostic Workshop</p>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p><strong>AJW Marine Electrical Services</strong> • Solent Fast Response Workshop</p>
      <p>Gosport Marina • Haslar • Port Hamble • Ocean Village • Cowes</p>
      <p>Flat Diagnostic Rate: £25/hr • Phone: 07700 900551 • Web: <a href="https://ajwmes.co.uk" style="color: #38bdf8; text-decoration: none;">ajwmes.co.uk</a></p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 1. Account Registration & Welcome Email
 */
export function buildWelcomeEmail(profile: UserProfile): { subject: string; html: string; text: string } {
  const subject = `Welcome aboard AJW Marine Electrical Services, ${profile.name || 'Skipper'}!`;
  
  const vesselText = profile.vesselName 
    ? `<div class="card">
        <strong>Registered Vessel:</strong> ${escapeHtml(profile.vesselName)}<br>
        <strong>Type:</strong> ${escapeHtml(profile.vesselType || 'Yacht / Motorboat')}<br>
        <strong>Berth / Marina:</strong> ${escapeHtml(profile.marinaBerth || 'Solent Area')}
      </div>`
    : '';

  const html = wrapEmailLayout('Welcome to AJW Marine Electrical Services', `
    <span class="badge">Vessel Account Active</span>
    <h2 style="color: #ffffff; margin: 12px 0 8px;">Welcome Aboard, ${escapeHtml(profile.name || 'Skipper')}!</h2>
    <p>Thank you for registering with <strong>AJW Marine Electrical Services</strong>. Your account gives you 24/7 access to our Solent marine electrical platform.</p>
    
    ${vesselText}

    <div class="card">
      <h4 style="margin: 0 0 8px; color: #f59e0b;">What you can do now:</h4>
      <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13px;">
        <li>Log & maintain your boat's permanent 12V/24V electrical specifications</li>
        <li>Order custom switch panels and laser-engraved replicas</li>
        <li>Track real-time pontoon diagnostic jobs & chat directly with onboard engineers</li>
        <li>Order marine hardware, cables, and Victron components from our store</li>
      </ul>
    </div>

    <div style="text-align: center;">
      <a href="https://ajwmes.co.uk" class="btn">Open Your Vessel Portal</a>
    </div>

    <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
      Need immediate urgent pontoon assistance? Call Anthony directly on <strong>07700 900551</strong> (£25/hr standard flat rate).
    </p>
  `);

  const text = `Welcome Aboard, ${profile.name || 'Skipper'}!\n\n` +
    `Thank you for registering with AJW Marine Electrical Services.\n` +
    `Your vessel account (${profile.email}) is now active.\n\n` +
    `Platform highlights:\n` +
    `- Maintain permanent vessel electrical specs\n` +
    `- Custom switch panel designer\n` +
    `- Live pontoon diagnostic tracking at £25/hr flat rate\n\n` +
    `Access your vessel portal: https://ajwmes.co.uk\n` +
    `AJW Marine Electrical Services • 07700 900551`;

  return { subject, html, text };
}

/**
 * 2. Online Store Order Confirmation Email
 */
export function buildOrderConfirmationEmail(order: PostalOrder): { subject: string; html: string; text: string } {
  const orderRef = order.orderNumber || order.id;
  const subject = `Order Confirmed: ${orderRef} (AJW Marine Electrical)`;
  const formattedAddress = formatShippingAddress(order.shippingAddress);

  const itemsRows = order.items.map(i => `
    <tr>
      <td><strong>${escapeHtml(i.name)}</strong></td>
      <td style="text-align: center;">${i.quantity}</td>
      <td style="text-align: right;" class="price">£${(i.lineTotal || i.unitPrice * i.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = wrapEmailLayout(`Order Confirmation ${orderRef}`, `
    <span class="badge">Order Confirmed</span>
    <h2 style="color: #ffffff; margin: 12px 0 8px;">Thank You for Your Order!</h2>
    <p>We've received your order <strong>${escapeHtml(orderRef)}</strong> and our Gosport workshop team is preparing it for packaging.</p>

    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
          <tr>
            <td colspan="2" style="padding-top: 12px; font-weight: bold; color: #ffffff;">Grand Total:</td>
            <td style="padding-top: 12px; text-align: right; font-weight: bold; font-size: 15px;" class="price">£${order.total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h4 style="margin: 0 0 6px; color: #38bdf8;">Delivery Destination:</h4>
      <p style="margin: 0; font-size: 12px; line-height: 1.5;">
        <strong>Recipient:</strong> ${escapeHtml(order.customerName)}<br>
        <strong>Address / Marina Berth:</strong> ${escapeHtml(formattedAddress)}
      </p>
    </div>

    <div style="text-align: center;">
      <a href="https://ajwmes.co.uk" class="btn">Track Order Online</a>
    </div>
  `);

  const text = `Order Confirmed: ${orderRef}\n\n` +
    `Customer: ${order.customerName}\n` +
    `Total: £${order.total.toFixed(2)}\n\n` +
    `Items:\n` +
    order.items.map(i => `- ${i.name} x${i.quantity}: £${(i.lineTotal || i.unitPrice * i.quantity).toFixed(2)}`).join('\n') +
    `\n\nShipping Destination: ${formattedAddress}\n` +
    `Track your delivery at: https://ajwmes.co.uk\n` +
    `AJW Marine Electrical Services`;

  return { subject, html, text };
}

/**
 * 3. Postal Order Dispatch & Carrier Tracking Email
 */
export function buildOrderDispatchEmail(order: PostalOrder): { subject: string; html: string; text: string } {
  const orderRef = order.orderNumber || order.id;
  const carrierName = order.carrier || order.trackingCarrier || 'Royal Mail Tracked 24';
  const trackingNumber = order.trackingNumber || 'PENDING';
  const subject = `Dispatched: ${orderRef} via ${carrierName}`;
  const formattedAddress = formatShippingAddress(order.shippingAddress);

  const html = wrapEmailLayout(`Dispatched ${orderRef}`, `
    <span class="badge" style="background-color: #064e3b; color: #34d399; border-color: #059669;">Dispatched & On The Way</span>
    <h2 style="color: #ffffff; margin: 12px 0 8px;">Your Marine Hardware Has Been Dispatched!</h2>
    <p>Good news! Your order <strong>${escapeHtml(orderRef)}</strong> was packed and handed to <strong>${escapeHtml(carrierName)}</strong> at our Gosport workshop.</p>

    <div class="card">
      <h4 style="margin: 0 0 8px; color: #f59e0b;">Carrier Tracking Information:</h4>
      <p style="margin: 0 0 6px; font-size: 13px;">
        <strong>Carrier:</strong> ${escapeHtml(carrierName)}<br>
        <strong>Tracking Number:</strong> <span style="font-family: monospace; font-size: 14px; color: #38bdf8; font-weight: bold;">${escapeHtml(trackingNumber)}</span>
      </p>
      <p style="margin: 8px 0 0; font-size: 11px; color: #94a3b8;">
        Marina berths: couriers will typically leave items with the marina dockmaster / reception office if you are away from your berth.
      </p>
    </div>

    <div style="text-align: center;">
      <a href="https://ajwmes.co.uk" class="btn">View Live Tracking Timeline</a>
    </div>
  `);

  const text = `Order Dispatched: ${orderRef}\n\n` +
    `Carrier: ${carrierName}\n` +
    `Tracking Number: ${trackingNumber}\n` +
    `Destination: ${formattedAddress}\n\n` +
    `Track online: https://ajwmes.co.uk\n` +
    `AJW Marine Electrical Services • Gosport`;

  return { subject, html, text };
}

/**
 * 4. Pontoon Diagnostic Quote & Approval Email
 */
export function buildDiagnosticQuoteEmail(job: JobRecord): { subject: string; html: string; text: string } {
  const subject = `Diagnostic Quote: ${job.reference} (${job.vesselName})`;

  const materialsRows = (job.materialsUsed || []).map(m => `
    <tr>
      <td>${escapeHtml(m.name)}</td>
      <td style="text-align: center;">${m.quantity} ${escapeHtml(m.unit)}</td>
      <td style="text-align: right;" class="price">£${(m.unitPrice * m.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = wrapEmailLayout(`Quote for ${job.vesselName}`, `
    <span class="badge">Diagnostic Quote</span>
    <h2 style="color: #ffffff; margin: 12px 0 8px;">Pontoon Diagnostic Estimate</h2>
    <p>Here is your electrical diagnostic quote for <strong>${escapeHtml(job.vesselName)}</strong> (${escapeHtml(job.vesselType)}) berthed at <strong>${escapeHtml(job.berthLocation)}</strong>.</p>

    <div class="card">
      <table>
        <tbody>
          <tr>
            <td>Diagnostic Labor (${job.diagnosticHours} hrs @ £${job.hourlyRate}/hr):</td>
            <td style="text-align: right;" class="price">£${(job.totalLabor || job.diagnosticHours * job.hourlyRate).toFixed(2)}</td>
          </tr>
          ${materialsRows}
          <tr>
            <td style="padding-top: 10px; font-weight: bold; color: #ffffff;">Estimated Total:</td>
            <td style="padding-top: 10px; text-align: right; font-weight: bold; font-size: 15px;" class="price">£${job.totalEstimated.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    ${job.notes ? `<div class="card"><h4 style="margin: 0 0 6px; color: #38bdf8;">Technician Fault Notes:</h4><p style="margin: 0; font-size: 12px; font-style: italic;">"${escapeHtml(job.notes)}"</p></div>` : ''}

    <div style="text-align: center;">
      <a href="https://ajwmes.co.uk" class="btn">Review & Approve Quote</a>
    </div>
  `);

  const text = `Diagnostic Quote: ${job.reference} (${job.vesselName})\n\n` +
    `Vessel: ${job.vesselName} (${job.berthLocation})\n` +
    `Diagnostic Labor: ${job.diagnosticHours}h @ £${job.hourlyRate}/hr = £${(job.diagnosticHours * job.hourlyRate).toFixed(2)}\n` +
    `Total Estimated: £${job.totalEstimated.toFixed(2)}\n\n` +
    `Technician Notes: ${job.notes || 'None'}\n\n` +
    `Review online: https://ajwmes.co.uk\n` +
    `AJW Marine Electrical Services`;

  return { subject, html, text };
}

/**
 * 5. Pontoon Customer Sign-Off & Electrical Certificate Receipt Email
 */
export function buildPontoonSignOffEmail(job: JobRecord, signOff: CustomerSignOffRecord): { subject: string; html: string; text: string } {
  const subject = `Electrical Sign-Off Completed: ${job.vesselName} (${job.reference})`;

  const html = wrapEmailLayout(`Sign-off for ${job.vesselName}`, `
    <span class="badge" style="background-color: #064e3b; color: #34d399; border-color: #059669;">Signed Aboard Pontoon</span>
    <h2 style="color: #ffffff; margin: 12px 0 8px;">Work Completed & Signed Off</h2>
    <p>Thank you for approving our electrical work aboard <strong>${escapeHtml(job.vesselName)}</strong> on the pontoon.</p>

    <div class="card">
      <h4 style="margin: 0 0 8px; color: #f59e0b;">Sign-Off Verification:</h4>
      <p style="margin: 0 0 6px; font-size: 12px;">
        <strong>Signed By:</strong> ${escapeHtml(signOff.clientName)} (${signOff.signerRole.replace('_', ' ')})<br>
        <strong>Captured Aboard:</strong> ${new Date(signOff.signedAtOffline).toLocaleString('en-GB')}<br>
        <strong>Agreed Labor:</strong> ${signOff.agreedDiagnosticHours} hours (£25/hr flat rate)<br>
        <strong>Agreed Total:</strong> <span class="price">£${signOff.agreedTotalEstimate.toFixed(2)}</span>
      </p>
      ${signOff.customerFeedback ? `<p style="margin: 8px 0 0; font-size: 11px; color: #94a3b8; font-style: italic;">"${escapeHtml(signOff.customerFeedback)}"</p>` : ''}
    </div>

    <p style="font-size: 12px; color: #94a3b8;">
      A permanent record of this diagnostic visit and electrical schematic is logged into your boat owner portal.
    </p>

    <div style="text-align: center;">
      <a href="https://ajwmes.co.uk" class="btn">View Vessel History Log</a>
    </div>
  `);

  const text = `Electrical Sign-Off Completed: ${job.vesselName} (${job.reference})\n\n` +
    `Signed By: ${signOff.clientName} (${signOff.signerRole})\n` +
    `Date: ${new Date(signOff.signedAtOffline).toLocaleString('en-GB')}\n` +
    `Agreed Labor: ${signOff.agreedDiagnosticHours}h @ £25/hr\n` +
    `Agreed Total: £${signOff.agreedTotalEstimate.toFixed(2)}\n\n` +
    `Feedback: ${signOff.customerFeedback || 'N/A'}\n\n` +
    `View vessel electrical certificate at: https://ajwmes.co.uk\n` +
    `AJW Marine Electrical Services`;

  return { subject, html, text };
}

/**
 * 6. Zero Stock Depletion Alert Email (for Admin Anthony Wrather)
 */
export function buildZeroStockAlertEmail(alert: StockAlert): { subject: string; html: string; text: string } {
  const subject = `⚠️ URGENT: 0 Stock Depletion - ${alert.itemName}`;

  const html = wrapEmailLayout(`Zero Stock: ${alert.itemName}`, `
    <span class="badge" style="background-color: #881337; color: #fda4af; border-color: #f43f5e;">Zero Stock Depletion</span>
    <h2 style="color: #ffffff; margin: 12px 0 8px;">Workshop Hardware Out of Stock</h2>
    <p>Automated inventory alert: <strong>${escapeHtml(alert.itemName)}</strong> has reached <strong>0 units</strong> in stock.</p>

    <div class="card">
      <p style="margin: 0; font-size: 12px; line-height: 1.6;">
        <strong>Item:</strong> ${escapeHtml(alert.itemName)}<br>
        <strong>Category:</strong> ${escapeHtml(alert.itemCategory)}<br>
        <strong>Specification:</strong> ${escapeHtml(alert.specification)}<br>
        <strong>Trigger Source:</strong> ${escapeHtml(alert.triggerSource.replace('_', ' '))}<br>
        <strong>Depleted At:</strong> ${escapeHtml(alert.timestamp)}
      </p>
    </div>

    <div style="text-align: center;">
      <a href="https://ajwmes.co.uk" class="btn" style="background-color: #e11d48;">Reorder From Supplier</a>
    </div>
  `);

  const text = `URGENT ZERO STOCK ALERT: ${alert.itemName}\n\n` +
    `Category: ${alert.itemCategory}\n` +
    `Specification: ${alert.specification}\n` +
    `Trigger: ${alert.triggerSource}\n` +
    `Depleted At: ${alert.timestamp}\n\n` +
    `Open Supplier Reorder: https://ajwmes.co.uk\n` +
    `AJW Marine Inventory Controller`;

  return { subject, html, text };
}
