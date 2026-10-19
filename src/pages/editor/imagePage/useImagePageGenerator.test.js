// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { buildImagePageTree, chunkBySize, countSections } from './useImagePageGenerator';

describe('buildImagePageTree', () => {
  const form = { buttonText: 'اطلب', buttonBackgroundColor: '#ff0000', title: 'x' };

  it('images in order, form after formAfter, colors and product applied', () => {
    const tree = buildImagePageTree(['u1', 'u2', 'u3'], { form, formAfter: 1, productId: 'p1' });
    expect(tree.map((b) => b.type)).toEqual(['image', 'image', 'productForm', 'image']);
    expect(tree[0].props).toMatchObject({ src: 'u1', width: 100, align: 'center' });
    expect(tree[2].props).toMatchObject({ buttonText: 'اطلب', buttonBackgroundColor: '#ff0000', productId: 'p1', inputBorderColor: '#e4e4e7' });
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
