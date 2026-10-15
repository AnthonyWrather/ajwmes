import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  buildWelcomeEmail, 
  buildOrderConfirmationEmail, 
  buildOrderDispatchEmail,
  buildDiagnosticQuoteEmail,
  buildPontoonSignOffEmail,
  buildZeroStockAlertEmail,
  wrapEmailLayout
} from './emailTemplates';
import { UserProfile, PostalOrder, JobRecord, CustomerSignOffRecord, StockAlert } from '../types';

describe('emailTemplates', () => {
  describe('wrapEmailLayout', () => {
    it('wraps content in responsive marine styled HTML email markup', () => {
      const html = wrapEmailLayout('Test Title', '<p>Hello Sailor</p>');
      assert.ok(html.includes('<!DOCTYPE html>'));
      assert.ok(html.includes('AJW Marine Electrical Services'));
      assert.ok(html.includes('Hello Sailor'));
      assert.ok(html.includes('07700 900551'));
    });
  });

  describe('buildWelcomeEmail', () => {
    it('creates personalized welcome message with vessel details', () => {
      const profile: UserProfile = {
        id: 'usr-test-1',
        name: 'Sarah Connor',
        email: 'sarah@solent-sail.co.uk',
        role: 'client',
        vesselName: 'Westerly Discus 33',
        vesselType: 'Sailing Sloop',
        marinaBerth: 'Haslar Marina Berth E-14'
      };

      const { subject, html, text } = buildWelcomeEmail(profile);

      assert.ok(subject.includes('Sarah Connor'));
      assert.ok(html.includes('Westerly Discus 33'));
      assert.ok(html.includes('Haslar Marina Berth E-14'));
      assert.ok(text.includes('Sarah Connor'));
      assert.ok(text.includes('sarah@solent-sail.co.uk'));
    });

    it('falls back gracefully when vessel name is omitted', () => {
      const profile: UserProfile = {
        id: 'usr-test-2',
        name: '',
        email: 'guest@solent.co.uk',
        role: 'guest'
      };

      const { subject, html } = buildWelcomeEmail(profile);
      assert.ok(subject.includes('Skipper'));
      assert.ok(html.includes('Skipper'));
    });
  });

  describe('buildOrderConfirmationEmail', () => {
    it('formats order line items and pricing correctly', () => {
      const order: PostalOrder = {
        id: 'ord-101',
        orderNumber: 'ORD-2026-0042',
        customerName: 'Captain James',
        customerEmail: 'james@hms-surprise.co.uk',
        customerPhone: '07700 900888',
        shippingAddress: {
          fullName: 'Captain James',
          email: 'james@hms-surprise.co.uk',
          phone: '07700 900888',
          addressLine1: 'Port Hamble Marina',
          city: 'Southampton',
          postcode: 'SO31 4NN',
          berthNumber: 'Berth C12'
        },
        shippingMethod: 'royal_mail_tracked',
        shippingCost: 4.50,
        subtotal: 141.00,
        total: 145.50,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        orderStatus: 'received',
        createdAt: '2026-10-15T12:00:00Z',
        items: [
          {
            itemId: 'item-1',
            name: 'Tinned Copper Battery Cable 25mm²',
            unit: 'meter',
            quantity: 2,
            unitPrice: 35.00,
            lineTotal: 70.00
          },
          {
            itemId: 'item-2',
            name: 'Blue Sea Systems Marine Fuse Block',
            unit: 'piece',
            quantity: 1,
            unitPrice: 75.50,
            lineTotal: 75.50
          }
        ]
      };

      const { subject, html, text } = buildOrderConfirmationEmail(order);

      assert.ok(subject.includes('ORD-2026-0042'));
      assert.ok(html.includes('Tinned Copper Battery Cable 25mm²'));
      assert.ok(html.includes('145.50'));
      assert.ok(html.includes('Port Hamble Marina'));
      assert.ok(text.includes('Captain James'));
    });
  });

  describe('buildOrderDispatchEmail', () => {
    it('includes carrier and tracking number', () => {
      const order: PostalOrder = {
        id: 'ord-102',
        orderNumber: 'ORD-2026-0099',
        customerName: 'Lady Eleanor',
        customerEmail: 'eleanor@cowes.co.uk',
        customerPhone: '07700 900999',
        shippingAddress: {
          fullName: 'Lady Eleanor',
          email: 'eleanor@cowes.co.uk',
          phone: '07700 900999',
          addressLine1: 'Cowes Yacht Haven',
          city: 'Cowes',
          postcode: 'PO31 7BD',
          marinaName: 'Cowes Yacht Haven'
        },
        shippingMethod: 'royal_mail_tracked',
        shippingCost: 4.50,
        subtotal: 84.50,
        total: 89.00,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        orderStatus: 'dispatched',
        carrier: 'Royal Mail Tracked 24',
        trackingNumber: 'GB123456789RM',
        createdAt: '2026-10-15T10:00:00Z',
        items: []
      };

      const { subject, html, text } = buildOrderDispatchEmail(order);

      assert.ok(subject.includes('Royal Mail Tracked 24'));
      assert.ok(html.includes('GB123456789RM'));
      assert.ok(text.includes('Cowes Yacht Haven'));
    });
  });

  describe('buildDiagnosticQuoteEmail', () => {
    it('computes diagnostic labor and materials rollup', () => {
      const job: JobRecord = {
        id: 'job-99',
        reference: 'JOB-2026-0088',
        clientName: 'Oliver Queen',
        clientEmail: 'oliver@starling.co.uk',
        clientPhone: '07700 900333',
        vesselName: 'Arrow Tender',
        vesselType: 'Fast RIB',
        berthLocation: 'Ocean Village Marina',
        serviceCategory: 'diagnostic',
        status: 'quote_sent',
        hourlyRate: 25,
        diagnosticHours: 3.5,
        totalLabor: 87.50,
        totalMaterials: 50.00,
        totalEstimated: 137.50,
        materialsUsed: [
          {
            id: 'mat-1',
            name: 'Heavy Duty Isolator Switch',
            quantity: 1,
            unit: 'piece',
            unitPrice: 50.00
          }
        ],
        notes: 'Alternator charging circuit intermittent under load.',
        depositPaid: false,
        depositAmount: 0,
        createdAt: '2026-10-15T09:00:00Z',
        messages: []
      };

      const { subject, html, text } = buildDiagnosticQuoteEmail(job);

      assert.ok(subject.includes('Arrow Tender'));
      assert.ok(html.includes('Ocean Village Marina'));
      assert.ok(html.includes('3.5 hrs @ £25/hr'));
      assert.ok(html.includes('137.50'));
      assert.ok(html.includes('Alternator charging circuit'));
      assert.ok(text.includes('JOB-2026-0088'));
    });
  });

  describe('buildPontoonSignOffEmail', () => {
    it('summarizes digital signoff captured aboard vessel', () => {
      const job: JobRecord = {
        id: 'job-50',
        reference: 'JOB-2026-0050',
        clientName: 'Marcus Brody',
        clientEmail: 'brody@solent.co.uk',
        clientPhone: '07700 900555',
        vesselName: 'Sea Fox',
        vesselType: 'Motor Cruiser',
        berthLocation: 'Gosport Marina Berth D-2',
        serviceCategory: 'lithium',
        status: 'completed',
        hourlyRate: 25,
        diagnosticHours: 4,
        totalLabor: 100,
        totalMaterials: 0,
        totalEstimated: 100,
        materialsUsed: [],
        notes: '',
        depositPaid: true,
        depositAmount: 50,
        createdAt: '2026-10-14T10:00:00Z',
        messages: []
      };

      const signOff: CustomerSignOffRecord = {
        jobId: 'job-50',
        jobReference: 'JOB-2026-0050',
        clientName: 'Marcus Brody',
        signerRole: 'vessel_owner',
        signatureDataUrl: 'data:image/png;base64,mockSign',
        signedAtOffline: '2026-10-15T15:30:00Z',
        agreedDiagnosticHours: 4,
        agreedTotalEstimate: 100,
        customerFeedback: 'Outstanding fast repair on the pontoon.',
        synced: true
      };

      const { subject, html, text } = buildPontoonSignOffEmail(job, signOff);

      assert.ok(subject.includes('Sea Fox'));
      assert.ok(html.includes('Marcus Brody'));
      assert.ok(html.includes('vessel owner'));
      assert.ok(html.includes('Outstanding fast repair'));
      assert.ok(text.includes('100.00'));
    });
  });

  describe('buildZeroStockAlertEmail', () => {
    it('creates urgent depletion alert for workshop controller', () => {
      const alert: StockAlert = {
        id: 'alt-1',
        itemId: 'prod-awg10-cable',
        itemName: 'AWG 10 Marine Grade Cable (Red/Black)',
        itemCategory: 'cables_wire',
        specification: '10 AWG Tinned Copper 30m',
        stockCount: 0,
        timestamp: '15/10/2026, 17:45',
        triggerSource: 'order_placement',
        emailRecipient: 'anthonywrather@gmail.com',
        emailSubject: 'Zero Stock Alert: AWG 10 Marine Grade Cable',
        emailBody: 'Stock reached 0'
      };

      const { subject, html, text } = buildZeroStockAlertEmail(alert);

      assert.ok(subject.includes('URGENT'));
      assert.ok(subject.includes('AWG 10 Marine Grade Cable'));
      assert.ok(html.includes('order placement'));
      assert.ok(text.includes('10 AWG Tinned Copper 30m'));
    });
  });
});
