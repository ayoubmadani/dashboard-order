import { describe, expect, it } from 'vitest';
import { newAttribute, setMode, addValue, editText, setColor, setImage, setValueName, removeValue, cleanAttributes, attributeErrors } from './attributeEditing';

const t = (k) => k;

describe('attribute editing (same as the mobile app)', () => {
  it('a new attribute is named first and opens on text', () => {
    const a = newAttribute('Taille');
    expect(a).toMatchObject({ type: 'color', name: 'Taille', displayMode: 'text', variants: [] });
  });
  it('switching text / colour / image clears the values', () => {
    const a = addValue(newAttribute('x'), 'S');
    expect(setMode(a, 'color')).toMatchObject({ displayMode: 'color', variants: [] });
    expect(setMode(a, 'text')).toBe(a);
  });
  it('text rows: value and name follow what is typed', () => {
    const a = addValue(newAttribute('x'));
    const id = a.variants[0].id;
    expect(editText(a, id, 'XL').variants[0]).toMatchObject({ value: 'XL', name: 'XL' });
  });
  it('colour keeps its custom name when the code changes; empty name falls back to the code', () => {
    let a = addValue(setMode(newAttribute('Couleur'), 'color'), '#000000');
    const id = a.variants[0].id;
    a = setValueName(a, id, 'Noir');
    a = setColor(a, id, '#111111');
    expect(a.variants[0]).toMatchObject({ value: '#111111', name: 'Noir' });
    expect(setValueName(a, id, '  ').variants[0].name).toBe('#111111');
  });
  it('image value carries the library image id', () => {
    let a = addValue(setMode(newAttribute('Modèle'), 'image'));
    a = setImage(a, a.variants[0].id, 'https://x/a.jpg', 'img1');
    expect(a.variants[0]).toMatchObject({ value: 'https://x/a.jpg', name: 'https://x/a.jpg', imageId: 'img1' });
  });
  it('empty rows are kept while editing and dropped on save', () => {
    const a = addValue(addValue(newAttribute('x'), 'S'));
    expect(a.variants).toHaveLength(2);
    expect(cleanAttributes([a])[0].variants.map((v) => v.value)).toEqual(['S']);
    expect(removeValue(a, a.variants[0].id).variants).toHaveLength(1);
  });
  it('errors: no name, duplicate names, no filled value, duplicate values', () => {
    const a = addValue(addValue(newAttribute('Taille'), 'S'), 'S');
    const b = addValue(newAttribute('taille'));
    const c = newAttribute('');
    const e = attributeErrors([a, b, c], t);
    expect(e[`attr_${a.id}`]).toBe('attributes.name_duplicate');
    expect(e[`attr_empty_${b.id}`]).toBe('attributes.one_variant_required');
    expect(e[`attr_${c.id}`]).toBe('attributes.name_required');
    expect(e[`variant_${a.variants[1].id}`]).toBe('attributes.duplicate_value');
    expect(e[`variant_${a.variants[0].id}`]).toBeUndefined();
  });
});
