import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { POLICY_VERSION } from '@shared/contracts/policy';

const legal = (name: string) => readFileSync(resolve(import.meta.dirname, `../../content/legal/${name}.md`), 'utf8');

describe('privacy policy text', () => {
  const text = legal('confidentialitate');

  it('explains transfers outside the EU under the Data Privacy Framework', () => {
    expect(text).toContain('## Transferuri în afara UE');
    expect(text).toContain('10 iulie 2023');
    expect(text).toContain('clauzelor contractuale standard');
    for (const processor of ['Google Analytics 4', 'Google Ads', 'Meta Pixel', 'WhatsApp']) expect(text).toContain(processor);
  });

  it('names Meta Platforms Ireland as joint controller and links Meta’s terms', () => {
    expect(text).toContain('Meta Platforms Ireland');
    expect(text).toContain('operatori asociați');
    expect(text).toContain('C-40/17');
    expect(text).toContain('https://www.facebook.com/legal/controller_addendum');
  });

  it('offers email, not only phone, for data requests', () => {
    expect(text).toMatch(/## Cum ne contactezi\s+[^#]*adresa de email/);
  });

  it('has a bumped policy version, so everyone gives consent again', () => {
    expect(POLICY_VERSION).not.toBe('1');
  });
});

describe('terms text', () => {
  const text = legal('termeni');

  it('mentions ANPC and the alternative dispute resolution platform', () => {
    expect(text).toContain('https://reclamatiisal.anpc.ro/');
    expect(text).toContain('soluționarea alternativă a litigiilor');
  });

  it('states the Cambridge trademark and claims no affiliation', () => {
    expect(text).toContain('Cambridge University Press & Assessment');
    expect(text).toContain('mărci');
    expect(text).toContain('nu pretinde nicio afiliere');
    expect(text).toContain('Nu este un certificat Cambridge');
  });
});
