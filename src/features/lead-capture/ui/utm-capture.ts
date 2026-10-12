import { CONSENT_CHANGED, CONSENT_DATASET_KEY, type ConsentChangedDetail } from '@shared/contracts/domain-events';
import { UTM_STORAGE_KEY, parseUtm } from '../model/utm';

function consentGiven(): boolean {
  return (document.documentElement.dataset[CONSENT_DATASET_KEY] ?? '').trim() !== '';
}

function store(): void {
  const utm = parseUtm(window.location.search);
  if (!utm) return;
  try {
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
  } catch (error) {
    console.warn('[lead-capture] UTM nu a putut fi păstrat', error);
  }
}

function clear(): void {
  try {
    sessionStorage.removeItem(UTM_STORAGE_KEY);
  } catch (error) {
    console.warn('[lead-capture] UTM nu a putut fi șters', error);
  }
}

/**
 * Remembering the campaign across pages writes to the visitor's device, so it waits for consent to statistics or
 * marketing. Without it the lead form still reads the UTM from the address of the page it is on.
 */
export function captureUtm(): void {
  if (consentGiven()) store();
  document.addEventListener(CONSENT_CHANGED, (event) => {
    const { analytics, marketing } = (event as CustomEvent<ConsentChangedDetail>).detail;
    if (analytics || marketing) store();
    else clear();
  });
}
