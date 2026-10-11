import { UTM_STORAGE_KEY, parseUtm } from '../model/utm';

export function captureUtm(): void {
  const utm = parseUtm(window.location.search);
  if (!utm) return;
  try {
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
  } catch (error) {
    console.warn('[lead-capture] UTM nu a putut fi păstrat', error);
  }
}
