// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { buildImagePageTree, chunkBySize, countSections } from './useImagePageGenerator';

describe('buildImagePageTree', () => {
  const form = { buttonText: 'اطلب', buttonBackgroundColor: '#ff0000', title: 'x', borderRadius: 12 };

  it('images in order, form after formAfter, colors and product applied', () => {
    const tree = buildImagePageTree(['u1', 'u2', 'u3'], { form, formAfter: 1, productId: 'p1' });
    expect(tree.map((b) => b.type)).toEqual(['image', 'image', 'productForm', 'image']);
    expect(tree[0].props).toMatchObject({ src: 'u1', width: 100, align: 'center' });
    expect(tree[2].props).toMatchObject({ buttonText: 'اطلب', buttonBackgroundColor: '#ff0000', productId: 'p1', inputBorderColor: '#e4e4e7', borderRadius: 12 });
    expect(new Set(tree.map((b) => b.id)).size).toBe(4);
  });

  it('out-of-range formAfter → form at the end', () => {
    const tree = buildImagePageTree(['u1', 'u2'], { form, formAfter: 9 });
    expect(tree.map((b) => b.type)).toEqual(['image', 'image', 'productForm']);
    expect(tree[2].props.productId).toBe('');
  });
});

describe('chunkBySize', () => {
  const b = (n) => ({ size: n });
  it('groups consecutive blobs under the limit, keeping order and start index', () => {
    expect(chunkBySize([b(2), b(2), b(1), b(3)], 4)).toEqual([
      { start: 0, items: [b(2), b(2)] },
      { start: 2, items: [b(1), b(3)] },
    ]);
  });
  it('a single oversized blob still gets its own chunk', () => {
    expect(chunkBySize([b(9), b(1)], 4)).toEqual([{ start: 0, items: [b(9)] }, { start: 1, items: [b(1)] }]);
  });
});

describe('countSections', () => {
  it('counts section.s like the server validator', () => {
    expect(countSections('<section class="s">a</section><section class="hero s" id="x">b</section><section class="x">c</section>')).toBe(2);
  });
});

describe('buildImagePageTree — AI layout plan (extras)', () => {
  const form = { buttonText: 'اطلب' };
  const extras = {
    topBar: { enabled: true, text: 'توصيل مجاني • الدفع عند الاستلام', backgroundColor: '#B91C1C', textColor: '#ffffff', direction: 'rtl' },
    overlays: [
      { section: 0, kind: 'button', text: 'اطلب الآن', x: 50, y: 88, width: 60, backgroundColor: '#F59E0B', textColor: '#111111', linkType: 'form' },
      { section: 1, kind: 'marquee', text: 'عرض محدود', x: 50, y: 10, width: 100, backgroundColor: '#000000', textColor: '#ffffff', linkType: 'form' },
      { section: 0, kind: 'button', text: 'واتساب', x: 50, y: 70, width: 50, backgroundColor: '#25D366', textColor: '#ffffff', linkType: 'whatsapp' },
    ],
    whatsappButton: true,
  };

  it('top bar = spacer block first, holding a full-width scrolling text', () => {
    const tree = buildImagePageTree(['u1', 'u2'], { form, formAfter: 1, extras, whatsapp: '0555123456' });
    expect(tree[0].type).toBe('spacer');
    expect(tree[0].props.backgroundColor).toBe('#B91C1C');
    expect(tree[0].props.elements).toHaveLength(1);
    expect(tree[0].props.elements[0]).toMatchObject({ type: 'text', content: 'توصيل مجاني • الدفع عند الاستلام', marquee: 'rtl', width: 100, x: 50, y: 50, color: '#ffffff' });
  });

  it('overlays land on their section image: a form button and a scrolling band', () => {
    const tree = buildImagePageTree(['u1', 'u2'], { form, formAfter: 1, extras, whatsapp: '0555123456' });
    const [img0, img1] = tree.filter((b) => b.type === 'image');
    expect(img0.props.elements[0]).toMatchObject({ type: 'button', text: 'اطلب الآن', linkType: 'form', x: 50, y: 88, width: 60, backgroundColor: '#F59E0B', textColor: '#111111' });
    expect(img0.props.elements[1]).toMatchObject({ type: 'button', linkType: 'whatsapp', whatsappNumber: '0555123456' });
    expect(img1.props.elements[0]).toMatchObject({ type: 'text', marquee: 'rtl', content: 'عرض محدود', width: 100, backgroundColor: '#000000' });
  });

  it('floating WhatsApp button only when the store has a number', () => {
    const withNum = buildImagePageTree(['u1'], { form, formAfter: 0, extras, whatsapp: '0555123456' });
    const fb = withNum.find((b) => b.type === 'floatingButton');
    expect(fb.props).toMatchObject({ linkType: 'whatsapp', whatsappNumber: '0555123456', backgroundColor: '#25D366' });
    const noNum = buildImagePageTree(['u1'], { form, formAfter: 0, extras, whatsapp: '' });
    expect(noNum.some((b) => b.type === 'floatingButton')).toBe(false);
    // and no WhatsApp overlay buttons without a number
    expect(noNum.find((b) => b.type === 'image').props.elements.some((e) => e.linkType === 'whatsapp')).toBe(false);
  });

  it('no plan → same page as before', () => {
    const tree = buildImagePageTree(['u1', 'u2'], { form, formAfter: 1 });
    expect(tree.map((b) => b.type)).toEqual(['image', 'image', 'productForm']);
    expect(tree[0].props.elements ?? []).toEqual([]);
  });
});

describe('buildImagePageTree — button look varies with the page', () => {
  const extras = { topBar: null, whatsappButton: false, overlays: [{ section: 0, kind: 'button', text: 'احصل عليه', x: 50, y: 88, width: 60, backgroundColor: '#000000', textColor: '#ffffff', linkType: 'form' }] };
  it('corners follow the form radius; animation is one of the lively ones', () => {
    const btn = (r, rand) => buildImagePageTree(['u1'], { form: { borderRadius: r }, formAfter: 0, extras, rand })[0].props.elements[0];
    expect(btn(0, () => 0).borderRadius).toBe(0);
    expect(btn(20, () => 0).borderRadius).toBe(20);
    expect(['pulse', 'bounce', 'glow', 'heartbeat', 'shake']).toContain(btn(8, () => 0.7).animation);
    expect(btn(8, () => 0).animation).not.toBe(btn(8, () => 0.99).animation);
  });
});
