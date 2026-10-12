import { describe, expect, it } from 'vitest';
import { validateLead, type LeadRequest } from './lead.schema';

const valid: LeadRequest = {
  parentName: '  Ana   Pop ',
  phone: '0722 123 456',
  childAgeGroup: '7–8 ani',
  source: 'home',
  testLevel: null,
  consent: true,
  policyVersion: '2',
  utm: { source: 'instagram', medium: 'paid', campaign: 'demo-toamna' },
  website: '',
  elapsedMs: 8400,
};

function fieldsOf(input: unknown): string[] {
  const result = validateLead(input);
  return result.ok ? [] : result.fields;
}

describe('validateLead', () => {
  it('accepts the spec example and normalizes name and phone', () => {
    const result = validateLead(valid);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lead.parentName).toBe('Ana   Pop');
    expect(result.lead.phone).toBe('+40722123456');
    expect(result.lead).not.toHaveProperty('website');
    expect(result.lead).not.toHaveProperty('elapsedMs');
  });

  it('keeps plain names valid', () => {
    expect(validateLead({ ...valid, parentName: 'Ana Pop' }).ok).toBe(true);
  });

  it('accepts a missing age group and empty UTM', () => {
    expect(validateLead({ ...valid, childAgeGroup: null, utm: { source: null, medium: null, campaign: null } }).ok).toBe(true);
  });

  it.each([
    ['parentName', { parentName: ' A ' }],
    ['parentName', { parentName: 'x'.repeat(101) }],
    ['parentName', { parentName: 'Ana\u0000Pop' }],
    ['parentName', { parentName: 'Ana\u200BPop' }],
    ['parentName', { parentName: '🙂🙂' }],
    ['utm', { utm: { source: 'a\u0007b', medium: null, campaign: null } }],
    ['phone', { phone: '+44 7911 123456' }],
    ['phone', { phone: '' }],
    ['childAgeGroup', { childAgeGroup: '4 ani' }],
    ['source', { source: 'facebook' }],
    ['consent', { consent: false }],
    ['policyVersion', { policyVersion: '0' }],
    ['utm', { utm: { source: 'x'.repeat(101), medium: null, campaign: null } }],
    ['testLevel', { testLevel: 'level:movers' }],
  ])('reports %s for %j', (field, patch) => {
    expect(fieldsOf({ ...valid, ...patch })).toEqual([field]);
  });

  it('accepts a test level only for the test source, in the level:/exam: format', () => {
    expect(validateLead({ ...valid, source: 'test', testLevel: 'level:movers' }).ok).toBe(true);
    expect(validateLead({ ...valid, source: 'test', testLevel: 'exam:a2-key' }).ok).toBe(true);
    expect(validateLead({ ...valid, source: 'test', testLevel: null }).ok).toBe(true);
    expect(fieldsOf({ ...valid, source: 'test', testLevel: 'movers' })).toEqual(['testLevel']);
    expect(fieldsOf({ ...valid, source: 'test', testLevel: 'level:<script>' })).toEqual(['testLevel']);
  });

  it('lists every invalid field once', () => {
    expect(fieldsOf({ ...valid, parentName: '', phone: '1', consent: false }).sort()).toEqual(['consent', 'parentName', 'phone']);
  });

  it('rejects non-objects without inventing field names', () => {
    expect(validateLead(null)).toEqual({ ok: false, fields: [] });
    expect(validateLead('text')).toEqual({ ok: false, fields: [] });
  });

  it('reports missing fields', () => {
    expect(fieldsOf({}).sort()).toEqual(['childAgeGroup', 'consent', 'parentName', 'phone', 'policyVersion', 'source', 'testLevel', 'utm']);
  });
});
