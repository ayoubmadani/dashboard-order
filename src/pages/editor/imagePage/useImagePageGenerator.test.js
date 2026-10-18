// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { buildImagePageTree } from './useImagePageGenerator';

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
