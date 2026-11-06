import { describe, expect, it } from 'vitest';
import { labelLinks } from './printLabels';

describe('labelLinks', () => {
  it('url files stay links; pdf files become a blob link; order kept', () => {
    const made = [];
    const toBlobUrl = (b64) => { made.push(b64); return `blob:${b64}`; };
    expect(labelLinks([{ type: 'pdf', data: 'QUJD' }, { type: 'url', data: 'https://zr/l.html' }], toBlobUrl))
      .toEqual(['blob:QUJD', 'https://zr/l.html']);
    expect(made).toEqual(['QUJD']);
  });
  it('ignores empty files', () => {
    expect(labelLinks([{ type: 'url', data: '' }, null], () => 'x')).toEqual([]);
  });
});
