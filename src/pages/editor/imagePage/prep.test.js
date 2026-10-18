// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

const removeBackground = vi.fn(async () => new Blob(['png'], { type: 'image/png' }));
vi.mock('@imgly/background-removal', () => ({ removeBackground }));

const { downscale, extractPalette, removeBackgroundCached, blobToDataUrl } = await import('./prep.js');

// jsdom بلا canvas: canvas وهمي يسجّل المقاس ويرجع بكسلات محددة
let lastCanvas;
function fakeCanvas(pixels) {
  vi.spyOn(document, 'createElement').mockImplementation(() => {
    lastCanvas = {
      width: 0, height: 0,
      getContext: () => ({
        drawImage() {},
        getImageData: (_x, _y, w, h) => ({ data: pixels ?? new Uint8ClampedArray(w * h * 4) }),
      }),
      toBlob: (cb, type) => cb(new Blob(['x'], { type })),
    };
    return lastCanvas;
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  globalThis.createImageBitmap = vi.fn(async () => ({ width: 4000, height: 3000, close() {} }));
});

describe('downscale', () => {
  it('4000×3000 → longest side 1600, jpeg', async () => {
    fakeCanvas();
    const out = await downscale(new Blob(['a'], { type: 'image/jpeg' }));
    expect([lastCanvas.width, lastCanvas.height]).toEqual([1600, 1200]);
    expect(out.type).toBe('image/jpeg');
  });

  it('undecodable image → unsupported_image', async () => {
    globalThis.createImageBitmap = vi.fn(async () => { throw new Error('decode'); });
    await expect(downscale(new Blob(['a'], { type: 'image/heic' }))).rejects.toThrow('unsupported_image');
  });
});

describe('extractPalette', () => {
  it('returns hex colors, excludes transparent', async () => {
    const px = [];
    for (let i = 0; i < 64 * 64; i++) {
      if (i % 4 === 0) px.push(0, 255, 0, 0); // شفاف — يُتجاهل
      else if (i % 4 === 1) px.push(255, 255, 255, 255); // أبيض — يُتجاهل
      else if (i % 2 === 0) px.push(200, 30, 40, 255);
      else px.push(20, 60, 180, 255);
    }
    fakeCanvas(new Uint8ClampedArray(px));
    const colors = await extractPalette(new Blob(['a'], { type: 'image/png' }), 5);
    expect(colors.length).toBeGreaterThan(0);
    colors.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/));
    expect(colors).not.toContain('#00ff00');
    expect(colors).not.toContain('#ffffff');
    expect(colors).toContain('#c81e28');
    expect(colors).toContain('#143cb4');
  });
});

describe('removeBackgroundCached', () => {
  it('cache hit returns stored blob without calling remover', async () => {
    const input = new Blob(['same-bytes'], { type: 'image/jpeg' });
    const a = await removeBackgroundCached(input);
    const b = await removeBackgroundCached(new Blob(['same-bytes'], { type: 'image/jpeg' }));
    expect(removeBackground).toHaveBeenCalledTimes(1);
    expect(b.type).toBe('image/png');
    expect(await b.text()).toBe(await a.text());
  });
});

describe('blobToDataUrl', () => {
  it('encodes as data URL', async () => {
    expect(await blobToDataUrl(new Blob(['hi'], { type: 'text/plain' }))).toBe('data:text/plain;base64,aGk=');
  });
});
