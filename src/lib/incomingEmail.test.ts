import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  extractJobReference, 
  extractOrderReference,
  parseResendInboundWebhook,
  verifyResendWebhookSignature,
  simulateIncomingEmail,
  getIncomingEmails,
  markIncomingEmailStatus
} from './incomingEmail';
import { JobRecord } from '../types';

describe('incomingEmail', () => {
  describe('extractJobReference & extractOrderReference', () => {
    it('extracts standardized JOB reference from subject and body', () => {
      assert.equal(extractJobReference('Re: Question about JOB-2026-0042 lithium quote'), 'JOB-2026-0042');
      assert.equal(extractJobReference('Please check job-2026-0088 onboard Westerly'), 'JOB-2026-0088');
      assert.equal(extractJobReference('No reference in this string'), undefined);
    });

    it('extracts standardized ORD reference from order updates', () => {
      assert.equal(extractOrderReference('Where is ORD-2026-0099 delivery?'), 'ORD-2026-0099');
      assert.equal(extractOrderReference('ord-2026-0123 has arrived at Haslar Marina reception'), 'ORD-2026-0123');
      assert.equal(extractOrderReference('General inquiry'), undefined);
    });
  });

  describe('parseResendInboundWebhook', () => {
    it('parses structured payload from Resend webhook event', () => {
      const mockPayload = {
        type: 'email.received',
        created_at: '2026-10-15T14:20:00Z',
        data: {
          email_id: 're_msg_inbound_123',
          from: 'skipper@solent-yacht.co.uk',
          to: ['jobs@ajwmes.co.uk'],
          subject: 'Battery isolator quote JOB-2026-0042',
          text: 'Hi Anthony, please proceed with the isolator install on pontoon Berth 4.',
          attachments: [
            { filename: 'fault_photo.jpg', size: 245000 }
          ]
        }
      };

      const parsed = parseResendInboundWebhook(mockPayload);

      assert.equal(parsed.id, 're_msg_inbound_123');
      assert.equal(parsed.from, 'skipper@solent-yacht.co.uk');
      assert.equal(parsed.to, 'jobs@ajwmes.co.uk');
      assert.equal(parsed.jobReference, 'JOB-2026-0042');
      assert.equal(parsed.status, 'unread');
      assert.equal(parsed.attachments?.length, 1);
      assert.equal(parsed.attachments?.[0].filename, 'fault_photo.jpg');
    });
  });

  describe('verifyResendWebhookSignature', () => {
    it('validates recent timestamp and signature headers', () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const headers = {
        'svix-id': 'msg_test_123',
        'svix-timestamp': String(nowSeconds),
        'svix-signature': 'v1,mock_signature'
      };

      const valid = verifyResendWebhookSignature('{"mock":"body"}', headers, 'whsec_test123');
      assert.equal(valid, true);
    });

    it('rejects stale webhook timestamps older than 10 minutes', () => {
      const staleSeconds = Math.floor(Date.now() / 1000) - 1000; // > 15 minutes ago
      const headers = {
        'svix-id': 'msg_test_123',
        'svix-timestamp': String(staleSeconds),
        'svix-signature': 'v1,mock_signature'
      };

      const valid = verifyResendWebhookSignature('{"mock":"body"}', headers, 'whsec_test123');
      assert.equal(valid, false);
    });

    it('rejects missing svix signature headers', () => {
      const valid = verifyResendWebhookSignature('{}', {}, 'whsec_test123');
      assert.equal(valid, false);
    });
  });

  describe('simulateIncomingEmail & Discussion Thread Integration', () => {
    it('records email and links automatically to active job by reference', () => {
      const activeJobs: JobRecord[] = [
        {
          id: 'job-target-1',
          reference: 'JOB-2026-0042',
          clientName: 'Oliver Queen',
          clientEmail: 'oliver@starling.co.uk',
          clientPhone: '07700 900333',
          vesselName: 'Arrow Tender',
          vesselType: 'RIB',
          berthLocation: 'Ocean Village',
          serviceCategory: 'diagnostic',
          status: 'in_progress',
          hourlyRate: 25,
          diagnosticHours: 2,
          totalLabor: 50,
          totalMaterials: 0,
          totalEstimated: 50,
          materialsUsed: [],
          notes: '',
          depositPaid: true,
          depositAmount: 50,
          createdAt: '2026-10-15T10:00:00Z',
          messages: []
        }
      ];

      const { email, linkedJob, messageItem } = simulateIncomingEmail({
        from: 'oliver@starling.co.uk',
        subject: 'Re: JOB-2026-0042 Battery test aboard Arrow Tender',
        text: 'The pontoon power was reset. Please retest the Victron charger.'
      }, activeJobs);

      assert.ok(email.id.startsWith('sim-inbound-'));
      assert.equal(linkedJob?.id, 'job-target-1');
      assert.ok(messageItem);
      assert.equal(messageItem?.sender, 'client');
      assert.ok(messageItem?.text.includes('Victron charger'));

      // Check inbox status update
      markIncomingEmailStatus(email.id, 'read');
      const all = getIncomingEmails();
      const updated = all.find(e => e.id === email.id);
      assert.equal(updated?.status, 'read');
    });
  });
});
