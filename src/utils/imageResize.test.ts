import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { resizeImageToDataUrl } from './imageResize';

describe('imageResize utility module', () => {
  it('rejects if the file is not an image MIME type', async () => {
    const textFile = new File(['hello world'], 'test.txt', { type: 'text/plain' });
    await assert.rejects(
      async () => {
        await resizeImageToDataUrl(textFile);
      },
      {
        name: 'Error',
        message: 'Selected file is not an image'
      }
    );
  });

  describe('with simulated DOM environment', () => {
    const originalFileReader = globalThis.FileReader;
    const originalImage = (globalThis as any).Image;
    const originalDocument = (globalThis as any).document;

    before(() => {
      // Mock FileReader
      class MockFileReader {
        result: string | null = null;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        readAsDataURL(_blob: Blob) {
          this.result = 'data:image/jpeg;base64,mockimagedata';
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      }
      (globalThis as any).FileReader = MockFileReader;

      // Mock Image
      class MockImage {
        width = 800;
        height = 600;
        src = '';
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set onsrc(val: string) {
          this.src = val;
        }
        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 5);
        }
      }
      (globalThis as any).Image = MockImage;

      // Mock Canvas and document
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: (_type: string) => ({
          drawImage: (_img: any, _dx: number, _dy: number, _dw: number, _dh: number) => {}
        }),
        toDataURL: (format: string, _quality: number) => `data:${format};base64,resizedmockdata`
      };

      (globalThis as any).document = {
        createElement: (tag: string) => {
          if (tag === 'canvas') return mockCanvas;
          return {};
        }
      };
    });

    after(() => {
      globalThis.FileReader = originalFileReader;
      (globalThis as any).Image = originalImage;
      (globalThis as any).document = originalDocument;
    });

    it('resizes image and outputs formatted data URL', async () => {
      const imageFile = new File(['fake image bytes'], 'avatar.jpg', { type: 'image/jpeg' });
      const result = await resizeImageToDataUrl(imageFile, 400, 0.85);
      assert.ok(result.startsWith('data:image/jpeg;base64,'));
    });
  });
});
