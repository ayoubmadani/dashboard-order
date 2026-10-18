// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

const calls = [];
const toBlob = vi.fn(async (node, opts) => {
  calls.push('toBlob');
  return new Blob(['x'], { type: opts.type });
});
vi.mock('html-to-image', () => ({ toBlob }));
vi.mock('./fonts.js', () => ({ loadFontCss: async () => "@font-face{font-family:'Lalezar';src:url(data:font/ttf;base64,AA==)}" }));

const { fillPlaceholders, captureSections, TRANSPARENT_PNG } = await import('./capture.js');

const page = (sections) => `<!doctype html><html dir="rtl" lang="ar"><head><style>.s{width:720px}</style></head><body>${sections}</body></html>`;

// jsdom: لا fonts ولا تخطيط — نضيفهما للـ iframe عند إلحاقه بالصفحة
let fonts, lastIframe;
beforeEach(() => {
  vi.restoreAllMocks();
  calls.length = 0;
  toBlob.mockClear();
  toBlob.mockImplementation(async (node, opts) => { calls.push('toBlob'); return new Blob(['x'], { type: opts.type }); });
  fonts = { ready: Promise.resolve(), load: vi.fn(async () => { calls.push('fonts.load'); return []; }) };
  const orig = document.body.appendChild.bind(document.body);
  vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
    const out = orig(node);
    if (node.tagName === 'IFRAME') {
      lastIframe = node;
      Object.defineProperty(node.contentDocument, 'fonts', { value: fonts, configurable: true });
      Object.defineProperty(node.contentWindow.HTMLElement.prototype, 'scrollHeight', {
        configurable: true,
        get() { return parseInt(this.style.height) || 800; },
      });
    }
    return out;
  });
});

describe('fillPlaceholders', () => {
  it('replaces IMG and DETAIL', () => {
    const out = fillPlaceholders('<img src="{{IMG_1}}"><img src="{{DETAIL_2}}">', { IMG: ['data:a'], DETAIL: ['data:b', 'data:c'] });
    expect(out).toBe('<img src="data:a"><img src="data:c">');
  });

  it('unknown placeholder → transparent', () => {
    expect(fillPlaceholders('{{IMG_3}}', { IMG: ['data:a'], DETAIL: [] })).toBe(TRANSPARENT_PNG);
  });
});

describe('captureSections', () => {
  it('captures every section.s in order', async () => {
    const blobs = await captureSections(page('<section class="s">1</section><div>x</div><section class="s hero">2</section>'));
    expect(blobs).toHaveLength(2);
    expect(toBlob.mock.calls.map((c) => c[0].textContent)).toEqual(['1', '2']);
  });

  it('capture crops tall sections', async () => {
    await captureSections(page('<section class="s" style="height:1500px">t</section>'));
    const opts = toBlob.mock.calls[0][1];
    expect(opts.height * opts.pixelRatio).toBeLessThanOrEqual(1100 * 1.5);
    expect(opts.width).toBe(720);
  });

  it('waits for fonts', async () => {
    await captureSections(page('<section class="s">a</section>'));
    expect(fonts.load).toHaveBeenCalledWith('48px Lalezar');
    expect(fonts.load).toHaveBeenCalledWith('26px Tajawal');
    expect(calls.indexOf('fonts.load')).toBeLessThan(calls.indexOf('toBlob'));
  });

  it('iframe has no allow-scripts and is removed', async () => {
    await captureSections(page('<section class="s">a</section>'));
    expect(lastIframe.getAttribute('sandbox')).toBe('allow-same-origin');
    expect(document.body.contains(lastIframe)).toBe(false);
  });

  it('falls back to jpeg when webp is unsupported', async () => {
    toBlob.mockImplementationOnce(async () => new Blob(['x'], { type: 'image/png' }));
    const [blob] = await captureSections(page('<section class="s">a</section>'));
    expect(blob.type).toBe('image/jpeg');
    expect(toBlob.mock.calls[1][1]).toMatchObject({ type: 'image/jpeg', quality: 0.9 });
  });
});
