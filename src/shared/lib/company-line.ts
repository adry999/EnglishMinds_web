export type CompanyIdentity = {
  readonly legalName: string;
  readonly cui: string;
  readonly registrationNumber: string;
  readonly registeredOffice: string;
};

export function legalCompanyLine(company: CompanyIdentity): string {
  return `${company.legalName} · CUI ${company.cui} · Nr. Reg. Com. ${company.registrationNumber} · Sediu: ${company.registeredOffice}`;
}
