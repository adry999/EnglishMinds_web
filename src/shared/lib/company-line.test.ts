import { describe, expect, it } from 'vitest';
import { companyLine } from './company-line';

describe('companyLine', () => {
  it('joins the legal name, CUI, trade register number and registered office', () => {
    expect(
      companyLine({
        legalName: 'Exemplu SRL',
        cui: 'RO12345678',
        registrationNumber: 'J12/345/2020',
        registeredOffice: 'Str. Mare 1, Cluj-Napoca',
      }),
    ).toBe('Exemplu SRL · CUI RO12345678 · Nr. Reg. Com. J12/345/2020 · Sediu: Str. Mare 1, Cluj-Napoca');
  });
});
