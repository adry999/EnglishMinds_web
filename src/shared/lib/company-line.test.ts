import { describe, expect, it } from 'vitest';
import { legalCompanyLine } from './company-line';

describe('legalCompanyLine', () => {
  it('joins the legal name, CUI, trade register number and registered office', () => {
    expect(
      legalCompanyLine({
        legalName: 'Exemplu SRL',
        cui: 'RO12345678',
        registrationNumber: 'J12/345/2020',
        registeredOffice: 'Str. Mare 1, Cluj-Napoca',
      }),
    ).toBe('Exemplu SRL · CUI RO12345678 · Nr. Reg. Com. J12/345/2020 · Sediu: Str. Mare 1, Cluj-Napoca');
  });
});
