import type { AgeGroup } from '@shared/contracts/age-groups';
import { site } from '@shared/content/site';

export type WhatsappLead = {
  readonly parentName: string;
  readonly phone: string;
  readonly childAgeGroup: AgeGroup | null;
  readonly testResult: string | null;
};

const tidy = (value: string): string => value.trim().replace(/\s+/g, ' ');

export function leadWhatsappText(lead: WhatsappLead): string {
  const intro = `Bună ziua! Sunt ${tidy(lead.parentName)} (${tidy(lead.phone)}).`;
  if (lead.testResult) return `${intro} Am făcut testul de nivel: ${lead.testResult}. Aș dori o lecție demo gratuită.`;
  if (lead.childAgeGroup) return `${intro} Aș dori o lecție demo gratuită pentru copilul meu (${lead.childAgeGroup}).`;
  return `${intro} Aș dori o lecție demo gratuită.`;
}

export function leadWhatsappUrl(lead: WhatsappLead): string {
  return `${site.contact.whatsappUrl}?text=${encodeURIComponent(leadWhatsappText(lead))}`;
}
