import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  ROLE_MANUAL_CHAPTERS, 
  getChaptersForRole, 
  searchManualChapters 
} from './manualData';
import { UserRole } from '../types';

describe('ROLE_MANUAL_CHAPTERS & manualData utility suite', () => {
  const allRoles: UserRole[] = ['guest', 'client', 'technician', 'postal', 'admin', 'site'];

  it('provides at least one comprehensive manual chapter for each of the 6 roles', () => {
    for (const role of allRoles) {
      const chapters = getChaptersForRole(role);
      assert.ok(chapters.length >= 1, `Role "${role}" must have at least 1 manual chapter`);
      for (const chapter of chapters) {
        assert.equal(chapter.role, role);
        assert.ok(chapter.title.length > 5, 'Chapter must have a meaningful title');
        assert.ok(chapter.summary.length > 15, 'Chapter must have a descriptive summary');
        assert.ok(chapter.durationMinutes > 0, 'Duration must be positive');
        assert.ok(chapter.steps.length >= 2, 'Chapter must have at least 2 instructional steps');
      }
    }
  });

  it('guarantees each instructional step has valid title, description, and sequential timestamp', () => {
    for (const chapter of ROLE_MANUAL_CHAPTERS) {
      let previousTimestamp = -1;
      for (const step of chapter.steps) {
        assert.ok(step.id.length > 0, 'Step must have an ID');
        assert.ok(step.title.length > 0, 'Step must have a title');
        assert.ok(step.description.length > 0, 'Step must have a description');
        if (typeof step.timestampSeconds === 'number') {
          assert.ok(step.timestampSeconds >= previousTimestamp, `Step ${step.id} timestamp should be sequential`);
          previousTimestamp = step.timestampSeconds;
        }
      }
    }
  });

  it('correctly filters chapters by query text across titles, summaries, and steps', () => {
    // Search by title term
    const cadResults = searchManualChapters('CAD');
    assert.ok(cadResults.length > 0);
    assert.ok(cadResults.some(c => c.id === 'guest-cad-configurator'));

    // Search by step-specific safety tip term
    const lithiumResults = searchManualChapters('lithium');
    assert.ok(lithiumResults.length > 0);

    // Search by non-existent term
    const emptyResults = searchManualChapters('nonexistent-marine-xyz-term');
    assert.equal(emptyResults.length, 0);
  });

  it('supports combining search query with role scoping', () => {
    const techOnly = searchManualChapters('diagnostic', 'technician');
    assert.ok(techOnly.length > 0);
    for (const ch of techOnly) {
      assert.equal(ch.role, 'technician');
    }

    // Searching for technician term with postal filter should return empty or only matching postal
    const mismatch = searchManualChapters('stopwatch', 'postal');
    assert.equal(mismatch.length, 0);
  });

  it('returns all role chapters when search query is empty', () => {
    const all = searchManualChapters('');
    assert.equal(all.length, ROLE_MANUAL_CHAPTERS.length);

    const clientOnly = searchManualChapters('', 'client');
    assert.equal(clientOnly.length, getChaptersForRole('client').length);
  });
});
