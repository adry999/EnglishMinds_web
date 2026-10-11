import { describe, expect, it } from 'vitest';
import { ageGroupForLevel } from './age-preselect';
import { testLevelCode, testResultLabel } from './test-result';
import { EMPTY_UTM, parseStoredUtm, parseUtm } from './utm';
import { leadWhatsappText, leadWhatsappUrl } from './whatsapp-message';

describe('leadWhatsappText', () => {
  const base = { parentName: '  Ana  Pop ', phone: ' 0722  123 456 ', childAgeGroup: null, testResult: null };

  it('introduces the parent with the phone they typed', () => {
    expect(leadWhatsappText(base)).toBe('Bună ziua! Sunt Ana Pop (0722 123 456). Aș dori o lecție demo gratuită.');
  });

  it('mentions the child age group when chosen', () => {
    expect(leadWhatsappText({ ...base, childAgeGroup: '7–8 ani' })).toBe(
      'Bună ziua! Sunt Ana Pop (0722 123 456). Aș dori o lecție demo gratuită pentru copilul meu (7–8 ani).',
    );
  });

  it('mentions the test result instead of the age group', () => {
    expect(leadWhatsappText({ ...base, childAgeGroup: '7–8 ani', testResult: 'grupa recomandată Movers' })).toBe(
      'Bună ziua! Sunt Ana Pop (0722 123 456). Am făcut testul de nivel: grupa recomandată Movers. Aș dori o lecție demo gratuită.',
    );
  });

  it('builds an encoded wa.me link', () => {
    const url = leadWhatsappUrl({ ...base, parentName: 'Ștefan & Co' });
    expect(url.startsWith('https://wa.me/40775630680?text=')).toBe(true);
    expect(decodeURIComponent(url.split('?text=')[1] ?? '')).toContain('Sunt Ștefan & Co (0722 123 456)');
  });
});

describe('test result', () => {
  it('encodes mode and level for the server', () => {
    expect(testLevelCode({ mode: 'level', level: 'movers' })).toBe('level:movers');
    expect(testLevelCode({ mode: 'exam', level: 'a2-key' })).toBe('exam:a2-key');
    expect(testLevelCode({ mode: 'level', level: 'b1-preliminary' })).toBe('level:b1-preliminary');
    expect(testLevelCode({ mode: 'level', level: 'Not A Slug' })).toBeNull();
  });

  it('labels the result in Romanian', () => {
    expect(testResultLabel({ mode: 'level', level: 'movers' })).toBe('grupa recomandată Movers');
    expect(testResultLabel({ mode: 'level', level: 'b1-preliminary' })).toBe('grupa recomandată B1 Preliminary');
    expect(testResultLabel({ mode: 'exam', level: 'a2-key' })).toBe('test pentru examenul Cambridge A2 Key');
    expect(testResultLabel({ mode: 'level', level: 'necunoscut' })).toBe('grupa recomandată necunoscut');
  });
});

describe('utm', () => {
  it('reads the three UTM parameters, trimmed and capped at 100 characters', () => {
    expect(parseUtm(`?utm_source=%20instagram%20&utm_medium=paid&utm_campaign=${'x'.repeat(120)}&x=1`)).toEqual({
      source: 'instagram',
      medium: 'paid',
      campaign: 'x'.repeat(100),
    });
  });

  it('returns null when no UTM parameter is present or all are empty', () => {
    expect(parseUtm('?grupa=movers')).toBeNull();
    expect(parseUtm('?utm_source=&utm_medium=%20')).toBeNull();
    expect(parseUtm('')).toBeNull();
  });

  it('keeps partial UTM', () => {
    expect(parseUtm('?utm_campaign=demo')).toEqual({ ...EMPTY_UTM, campaign: 'demo' });
  });

  it('reads stored UTM defensively', () => {
    expect(parseStoredUtm(JSON.stringify({ source: 'fb', medium: null, campaign: 'c' }))).toEqual({ source: 'fb', medium: null, campaign: 'c' });
    expect(parseStoredUtm(null)).toBeNull();
    expect(parseStoredUtm('{broken')).toBeNull();
    expect(parseStoredUtm(JSON.stringify({ source: 5 }))).toBeNull();
    expect(parseStoredUtm(JSON.stringify({ source: null, medium: null, campaign: null }))).toBeNull();
  });
});

describe('ageGroupForLevel', () => {
  it('maps a level slug to its age group', () => {
    expect(ageGroupForLevel('movers')).toBe('9–10 ani');
    expect(ageGroupForLevel('a2-key')).toBe('13–14 ani');
  });

  it('ignores unknown slugs', () => {
    expect(ageGroupForLevel('b1-preliminary')).toBeNull();
    expect(ageGroupForLevel('')).toBeNull();
  });
});
