import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeImageUrl } from './imageUrl';

describe('imageUrl utility module', () => {
  it('returns empty string when url is undefined or empty', () => {
    assert.equal(normalizeImageUrl(undefined), '');
    assert.equal(normalizeImageUrl(''), '');
  });

  it('normalizes legacy /src/assets/images/ path to /assets/images/', () => {
    const raw = '/src/assets/images/marine_switch_panel_laser_1791400808406.jpg';
    const normalized = normalizeImageUrl(raw);
    assert.equal(normalized, '/assets/images/marine_switch_panel_laser_1791400808406.jpg');
  });

  it('leaves standard /assets/images/ paths unchanged', () => {
    const path = '/assets/images/marine_lithium_battery_bank_1791400821608.jpg';
    assert.equal(normalizeImageUrl(path), path);
  });

  it('leaves external remote HTTP/HTTPS URLs untouched', () => {
    const remote = 'https://firebasestorage.googleapis.com/v0/b/project/o/image.jpg?alt=media';
    assert.equal(normalizeImageUrl(remote), remote);
  });

  it('preserves data:image base64 URLs without modification', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    assert.equal(normalizeImageUrl(dataUrl), dataUrl);
  });
});
