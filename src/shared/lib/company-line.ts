export type CompanyIdentity = {
  readonly legalName: string;
  readonly cui: string;
  readonly registrationNumber: string;
  readonly registeredOffice: string;
};

/** The one-line company identification the law asks for on a commercial site (Legea 365/2002 art. 5). */
export function companyLine(company: CompanyIdentity): string {
  return `${company.legalName} · CUI ${company.cui} · Nr. Reg. Com. ${company.registrationNumber} · Sediu: ${company.registeredOffice}`;
}
