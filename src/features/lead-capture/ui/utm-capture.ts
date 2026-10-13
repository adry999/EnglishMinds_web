import { CONSENT_CHANGED, CONSENT_DATASET_KEY, type ConsentChangedDetail } from '@shared/contracts/domain-events';
import { UTM_STORAGE_KEY, parseUtm } from '../model/utm';

function consentGiven(): boolean {
  return (document.documentElement.dataset[CONSENT_DATASET_KEY] ?? '').trim() !== '';
}

function saveUtmToSession(): void {
  const utm = parseUtm(window.location.search);
  if (!utm) return;
  try {
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
  } catch {
    return;
  }
}

function clearSavedUtm(): void {
  try {
    sessionStorage.removeItem(UTM_STORAGE_KEY);
  } catch {
    return;
  }
}

export function captureUtm(): void {
  if (consentGiven()) saveUtmToSession();
  document.addEventListener(CONSENT_CHANGED, (event) => {
    const { analytics, marketing } = (event as CustomEvent<ConsentChangedDetail>).detail;
    if (analytics || marketing) saveUtmToSession();
    else clearSavedUtm();
  });
}
