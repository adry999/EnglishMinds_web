import { site } from '@shared/content/site';
import type { ResultSummary } from './describe-result';

export function resultWhatsappUrl(summary: ResultSummary, score: number, total: number, childName: string): string {
  const who = childName.trim().replace(/\s+/g, ' ') || 'Copilul meu';
  const text = `Bună ziua! ${who} a făcut testul pe site: ${summary.kicker.toLowerCase()} – ${summary.title} (${score}/${total}). Aș dori o lecție demo gratuită.`;
  return `${site.contact.whatsappUrl}?text=${encodeURIComponent(text)}`;
}
