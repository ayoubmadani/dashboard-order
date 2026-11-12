import { describe, expect, it } from 'vitest';
import { blockConflict } from './blockRules';

describe('blockConflict', () => {
  it('the theme product already has its own order form: no order form beside it', () => {
    expect(blockConflict('productForm', ['image', 'themeProduct'])).toBe('themeProduct');
    expect(blockConflict('themeProduct', ['productForm'])).toBe('productForm');
  });
  it('other blocks are free', () => {
    expect(blockConflict('image', ['themeProduct', 'productForm'])).toBeNull();
    expect(blockConflict('productForm', ['image'])).toBeNull();
  });
});
