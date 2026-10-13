import { CONSENT_CHANGED, CONSENT_DATASET_KEY, type ConsentChangedDetail } from '@shared/contracts/domain-events';
import { UTM_STORAGE_KEY, parseUtm } from '../model/utm';

function consentGiven(): boolean {
  return (document.documentElement.dataset[CONSENT_DATASET_KEY] ?? '').trim() !== '';
}

function saveUtmToSession(): boolean {
  const utm = parseUtm(window.location.search);
  if (!utm) return false;
  try {
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
    return true;
  } catch {
    return false;
  }
}

function clearSavedUtm(): boolean {
  try {
    sessionStorage.removeItem(UTM_STORAGE_KEY);
    return true;
  } catch {
    return false;
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
