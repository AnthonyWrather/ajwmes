import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { 
  sendEmail, 
  sendWelcomeEmail, 
  sendOrderConfirmationEmail, 
  sendOrderDispatchEmail,
  sendDiagnosticQuoteEmail,
  sendPontoonSignOffEmail,
  sendZeroStockEmail,
  sendTestEmail,
  getSimulatedOutbox, 
  clearSimulatedOutbox 
} from './emailService';
import { clearCustomResendApiKey } from './resendConfig';
import { UserProfile, PostalOrder, JobRecord, CustomerSignOffRecord, StockAlert } from '../types';

describe('emailService', () => {
  beforeEach(() => {
    clearCustomResendApiKey();
    clearSimulatedOutbox();
  });

  describe('sendEmail in simulated mode', () => {
    it('dispatches to simulated outbox when no live Resend key is configured', async () => {
      const res = await sendEmail({
        to: 'skipper@solent-yacht.co.uk',
        subject: 'Diagnostic Scheduled',
        text: 'Your pontoon inspection is booked for 10:00.'
      });

      assert.equal(res.success, true);
      assert.equal(res.isSimulated, true);
      assert.ok(res.messageId?.startsWith('sim-email-'));

      const outbox = getSimulatedOutbox();
      assert.equal(outbox.length, 1);
      assert.equal(outbox[0].to, 'skipper@solent-yacht.co.uk');
      assert.equal(outbox[0].subject, 'Diagnostic Scheduled');
    });

    it('clears simulated outbox successfully', async () => {
      await sendEmail({ to: 'one@solent.co.uk', subject: 'One' });
      await sendEmail({ to: 'two@solent.co.uk', subject: 'Two' });
      assert.equal(getSimulatedOutbox().length, 2);

      clearSimulatedOutbox();
      assert.equal(getSimulatedOutbox().length, 0);
    });
  });

  describe('Action Dispatchers', () => {
    it('sendWelcomeEmail creates and dispatches welcome template', async () => {
      const profile: UserProfile = {
        id: 'usr-wel-1',
        name: 'Sarah Connor',
        email: 'sarah.connor@solent-sail.co.uk',
        role: 'client',
        vesselName: 'Westerly Discus 33'
      };

      const res = await sendWelcomeEmail(profile);
      assert.equal(res.success, true);

      const outbox = getSimulatedOutbox();
      assert.equal(outbox.length, 1);
      assert.equal(outbox[0].to, 'sarah.connor@solent-sail.co.uk');
      assert.ok(outbox[0].subject.includes('Sarah Connor'));
      assert.equal(outbox[0].templateType, 'welcome');
    });

    it('sendOrderConfirmationEmail checks for customer email', async () => {
      const invalidOrder: PostalOrder = {
        id: 'ord-bad',
        orderNumber: 'ORD-BAD',
        customerName: 'No Email User',
        customerEmail: '',
        customerPhone: '07700 900111',
        shippingAddress: {
          fullName: 'No Email User',
          email: 'user@example.com',
          phone: '07700 900111',
          addressLine1: 'Berth 1',
          city: 'Gosport',
          postcode: 'PO12 1AH'
        },
        shippingMethod: 'royal_mail_tracked',
        shippingCost: 4.50,
        subtotal: 45.50,
        total: 50,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        orderStatus: 'received',
        createdAt: '2026-10-15T10:00:00Z',
        items: []
      };

      const res = await sendOrderConfirmationEmail(invalidOrder);
      assert.equal(res.success, false);
      assert.ok(res.error?.includes('missing customer email'));

      const validOrder: PostalOrder = {
        ...invalidOrder,
        id: 'ord-good',
        customerEmail: 'buyer@solent.co.uk'
      };

      const validRes = await sendOrderConfirmationEmail(validOrder);
      assert.equal(validRes.success, true);
      assert.equal(getSimulatedOutbox().length, 1);
    });

    it('sendOrderDispatchEmail includes carrier tag and tracking template', async () => {
      const order: PostalOrder = {
        id: 'ord-disp-1',
        orderNumber: 'ORD-2026-0099',
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
        shippingMethod: 'dpd_heavy',
        shippingCost: 8.50,
        subtotal: 171.50,
        total: 180,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        orderStatus: 'dispatched',
        carrier: 'DPD Next Day Marine',
        trackingNumber: 'DPD99887766GB',
        createdAt: '2026-10-15T11:00:00Z',
        items: []
      };

      const res = await sendOrderDispatchEmail(order);
      assert.equal(res.success, true);

      const outbox = getSimulatedOutbox();
      assert.equal(outbox[0].to, 'james@hms-surprise.co.uk');
      assert.ok(outbox[0].subject.includes('DPD Next Day Marine'));
      assert.equal(outbox[0].templateType, 'order_dispatch');
    });

    it('sendDiagnosticQuoteEmail validates client email and formats quote', async () => {
      const job: JobRecord = {
        id: 'job-q-1',
        reference: 'JOB-2026-0042',
        clientName: 'Oliver Queen',
        clientEmail: 'oliver@starling.co.uk',
        clientPhone: '07700 900333',
        vesselName: 'Queen Tender',
        vesselType: 'RIB',
        berthLocation: 'Ocean Village',
        serviceCategory: 'diagnostic',
        status: 'quote_sent',
        hourlyRate: 25,
        diagnosticHours: 2,
        totalLabor: 50,
        totalMaterials: 20,
        totalEstimated: 70,
        materialsUsed: [],
        notes: 'Check 12V bilge pump wiring',
        depositPaid: false,
        depositAmount: 0,
        createdAt: '2026-10-15T12:00:00Z',
        messages: []
      };

      const res = await sendDiagnosticQuoteEmail(job);
      assert.equal(res.success, true);
      assert.equal(getSimulatedOutbox().length, 1);
      assert.ok(getSimulatedOutbox()[0].subject.includes('Queen Tender'));
    });

    it('sendPontoonSignOffEmail summarizes agreed hours and estimates', async () => {
      const job: JobRecord = {
        id: 'job-s-1',
        reference: 'JOB-2026-0050',
        clientName: 'Marcus Brody',
        clientEmail: 'brody@solent.co.uk',
        clientPhone: '07700 900555',
        vesselName: 'Sea Fox',
        vesselType: 'Cruiser',
        berthLocation: 'Gosport Marina',
        serviceCategory: 'lithium',
        status: 'completed',
        hourlyRate: 25,
        diagnosticHours: 3,
        totalLabor: 75,
        totalMaterials: 0,
        totalEstimated: 75,
        materialsUsed: [],
        notes: '',
        depositPaid: true,
        depositAmount: 50,
        createdAt: '2026-10-15T10:00:00Z',
        messages: []
      };

      const signOff: CustomerSignOffRecord = {
        jobId: 'job-s-1',
        jobReference: 'JOB-2026-0050',
        clientName: 'Marcus Brody',
        signerRole: 'vessel_owner',
        signatureDataUrl: 'data:image/png;base64,sig',
        signedAtOffline: '2026-10-15T16:00:00Z',
        agreedDiagnosticHours: 3,
        agreedTotalEstimate: 75,
        synced: true
      };

      const res = await sendPontoonSignOffEmail(job, signOff);
      assert.equal(res.success, true);
      assert.ok(getSimulatedOutbox()[0].subject.includes('Sea Fox'));
    });

    it('sendZeroStockEmail dispatches urgent notification to admin', async () => {
      const alert: StockAlert = {
        id: 'alt-unit-1',
        itemId: 'cable-tinned-25',
        itemName: 'Tinned Copper Battery Cable 25mm²',
        itemCategory: 'cables_wire',
        specification: '25mm² 170A Red',
        stockCount: 0,
        timestamp: '15/10/2026, 18:00',
        triggerSource: 'order_placement',
        emailRecipient: 'anthonywrather@gmail.com',
        emailSubject: 'Zero Stock Alert',
        emailBody: 'Cable depleted'
      };

      const res = await sendZeroStockEmail(alert);
      assert.equal(res.success, true);
      assert.equal(getSimulatedOutbox()[0].to, 'anthonywrather@gmail.com');
      assert.ok(getSimulatedOutbox()[0].subject.includes('URGENT'));
    });

    it('sendTestEmail generates formatted probe for settings modal verification', async () => {
      const res = await sendTestEmail('anthonywrather@gmail.com');
      assert.equal(res.success, true);
      assert.equal(getSimulatedOutbox().length, 1);
      assert.ok(getSimulatedOutbox()[0].subject.includes('Resend Verification Test'));
    });
  });
});
