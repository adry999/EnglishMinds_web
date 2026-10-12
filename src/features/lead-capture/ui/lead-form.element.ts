import type { AgeGroup } from '@shared/contracts/age-groups';
import { LEVEL_TEST_COMPLETED, createLeadSubmitted, type LevelTestCompletedDetail } from '@shared/contracts/domain-events';
import { MIN_ELAPSED_MS, validateLead, type LeadField, type LeadRequest, type LeadSource } from '@shared/contracts/lead.schema';
import { POLICY_VERSION } from '@shared/contracts/policy';
import { submitLead } from '../api/lead.client';
import { ageGroupForLevel } from '../model/age-preselect';
import { testLevelCode, testResultLabel, type TestOutcome } from '../model/test-result';
import { EMPTY_UTM, UTM_STORAGE_KEY, parseStoredUtm, parseUtm, type Utm } from '../model/utm';
import { leadWhatsappUrl } from '../model/whatsapp-message';

const FIELD_ORDER: readonly LeadField[] = ['parentName', 'phone', 'childAgeGroup', 'consent'];
const FIELD_ERRORS: Partial<Record<LeadField, string>> = {
  parentName: 'Scrie numele tău (cel puțin 2 litere).',
  phone: 'Scrie un număr de telefon din România, de exemplu 0722 123 456.',
  childAgeGroup: 'Alege vârsta din listă.',
  consent: 'Bifează acordul ca să te putem contacta.',
};
const GENERAL_ERROR = 'Verifică datele și încearcă din nou.';
const MIN_FILL_MS = MIN_ELAPSED_MS + 200;
const SEND_FAILED = 'Nu am putut trimite cererea. Scrie-ne pe WhatsApp sau sună-ne.';
const SENDING = 'Se trimite…';
const DEMO_NOTICE = 'Aceasta este o versiune demo a site-ului. Trimiterea formularului este dezactivată.';
const DONE_OPENED = 'Ți-am deschis WhatsApp cu mesajul completat. Trimite-l și te sunăm să stabilim ziua lecției.';
const DONE_BLOCKED = 'Am primit datele tale și te sunăm în curând. Dacă vrei, scrie-ne și pe WhatsApp.';
const DONE_UNSAVED = 'Nu am putut salva cererea pe site. Trimite mesajul din WhatsApp și rezervarea se finalizează acolo.';
const rateLimitedMessage = (phone: string): string =>
  `Ai trimis deja mai multe cereri în ultima oră. Scrie-ne pe WhatsApp sau sună-ne la ${phone}.`;

export class LeadForm extends HTMLElement {
  private startedAt = 0;
  private submitting = false;
  private testOutcome: TestOutcome | null = null;

  private readonly onTestCompleted = (event: Event): void => {
    const { mode, level } = (event as CustomEvent<LevelTestCompletedDetail>).detail;
    this.testOutcome = { mode, level };
    this.hidden = false;
  };

  connectedCallback(): void {
    if (this.source === 'test') document.addEventListener(LEVEL_TEST_COMPLETED, this.onTestCompleted);
    if (this.dataset.enhanced === 'true') return;
    this.enhance();
    if (this.dataset.enhanced !== 'true' && document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.enhance(), { once: true });
    }
  }

  disconnectedCallback(): void {
    document.removeEventListener(LEVEL_TEST_COMPLETED, this.onTestCompleted);
  }

  private get source(): LeadSource {
    const source = this.dataset.source;
    return source === 'landing' || source === 'test' ? source : 'home';
  }

  private enhance(): void {
    if (this.dataset.enhanced === 'true') return;
    const form = this.querySelector<HTMLFormElement>('form.lead-form__form');
    if (!form) return;
    this.querySelector('.lead-form__fallback')?.remove();
    form.hidden = false;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.submit(form).catch((error: unknown) => console.error('[lead-form] trimiterea a eșuat', error));
    });
    form.addEventListener('input', (event) => this.clearError(form, event.target));
    form.addEventListener('change', (event) => this.clearError(form, event.target));
    this.preselectAge(form);
    this.startedAt = performance.now();
    this.dataset.enhanced = 'true';
  }

  private preselectAge(form: HTMLFormElement): void {
    const slug = new URLSearchParams(window.location.search).get('grupa');
    const age = slug ? ageGroupForLevel(slug) : null;
    if (!age) return;
    for (const radio of form.querySelectorAll<HTMLInputElement>('input[name="childAgeGroup"]')) {
      if (radio.value === age) radio.checked = true;
    }
  }

  private utm(): Utm {
    const fromAddress = parseUtm(window.location.search);
    if (fromAddress) return fromAddress;
    try {
      return parseStoredUtm(sessionStorage.getItem(UTM_STORAGE_KEY)) ?? EMPTY_UTM;
    } catch (error) {
      console.warn('[lead-form] UTM indisponibil', error);
      return EMPTY_UTM;
    }
  }

  private request(form: HTMLFormElement): LeadRequest {
    const data = new FormData(form);
    const text = (name: string): string => {
      const value = data.get(name);
      return typeof value === 'string' ? value : '';
    };
    const age = text('childAgeGroup');
    return {
      parentName: text('parentName'),
      phone: text('phone'),
      childAgeGroup: age === '' ? null : age,
      source: this.source,
      testLevel: this.source === 'test' && this.testOutcome ? testLevelCode(this.testOutcome) : null,
      consent: data.get('consent') !== null,
      policyVersion: POLICY_VERSION,
      utm: this.utm(),
      website: text('website'),
      elapsedMs: Math.round(performance.now() - this.startedAt),
    };
  }

  private async submit(form: HTMLFormElement): Promise<void> {
    if (this.submitting) return;
    const request = this.request(form);
    this.clearAll(form);
    const local = validateLead(request);
    if (!local.ok) {
      this.showFieldErrors(form, local.fields);
      return;
    }
    if (this.dataset.demo !== undefined) {
      this.setStatus(form, DEMO_NOTICE);
      return;
    }
    const popup = window.open('', '_blank');
    if (popup) popup.opener = null;
    this.setSubmitting(form, true);
    try {
      const ageGroup: AgeGroup | null = local.lead.childAgeGroup;
      const whatsappUrl = leadWhatsappUrl({
        parentName: request.parentName,
        phone: request.phone,
        childAgeGroup: ageGroup,
        testResult: this.source === 'test' && this.testOutcome ? testResultLabel(this.testOutcome) : null,
      });
      const remaining = MIN_FILL_MS - (performance.now() - this.startedAt);
      if (remaining > 0) await new Promise<void>((done) => setTimeout(done, remaining));
      const result = await submitLead({ ...request, elapsedMs: Math.round(performance.now() - this.startedAt) });
      if (result.kind === 'ok' || result.kind === 'network' || result.kind === 'server') {
        popup?.location.replace(whatsappUrl);
        const text = result.kind !== 'ok' ? DONE_UNSAVED : popup ? DONE_OPENED : DONE_BLOCKED;
        this.showDone(form, local.lead.parentName, whatsappUrl, text);
        if (result.kind === 'ok') this.dispatchEvent(createLeadSubmitted({ source: this.source, ageGroup }));
        return;
      }
      if (result.kind === 'validation' && !FIELD_ORDER.some((field) => result.fields.includes(field))) {
        console.warn('[lead-form] server rejected fields the parent cannot fix', result.fields);
        popup?.location.replace(whatsappUrl);
        this.showDone(form, local.lead.parentName, whatsappUrl, DONE_UNSAVED);
        return;
      }
      popup?.close();
      if (result.kind === 'validation') this.showFieldErrors(form, result.fields);
      else this.showRateLimited(form, whatsappUrl);
    } catch (error) {
      popup?.close();
      this.showAlert(form, SEND_FAILED);
      console.error('[lead-form] trimiterea a eșuat', error);
    } finally {
      this.setSubmitting(form, false);
    }
  }

  private setSubmitting(form: HTMLFormElement, submitting: boolean): void {
    this.submitting = submitting;
    const button = form.querySelector<HTMLButtonElement>('.lead-form__submit');
    if (button) button.disabled = submitting;
    form.toggleAttribute('aria-busy', submitting);
    this.setStatus(form, submitting ? SENDING : '');
  }

  private setStatus(form: HTMLFormElement, message: string): void {
    const status = form.querySelector('.lead-form__status');
    if (status) status.textContent = message;
  }

  private showFieldErrors(form: HTMLFormElement, fields: readonly string[]): void {
    const known = FIELD_ORDER.filter((field) => fields.includes(field));
    if (known.length === 0) {
      this.showAlert(form, GENERAL_ERROR);
      return;
    }
    let first: HTMLInputElement | null = null;
    for (const field of known) {
      const message = form.querySelector(`[data-error-for="${field}"]`);
      if (message) message.textContent = FIELD_ERRORS[field] ?? GENERAL_ERROR;
      const control = form.querySelector<HTMLInputElement>(`[name="${field}"]`);
      control?.setAttribute('aria-invalid', 'true');
      first ??= control;
    }
    first?.focus();
  }

  private showRateLimited(form: HTMLFormElement, whatsappUrl: string): void {
    this.showAlert(form, rateLimitedMessage(this.dataset.phoneDisplay ?? ''));
    const actions = form.querySelector<HTMLElement>('.lead-form__alert-actions');
    if (!actions) return;
    actions.querySelector<HTMLAnchorElement>('[data-alert-whatsapp]')?.setAttribute('href', whatsappUrl);
    actions.hidden = false;
  }

  private showAlert(form: HTMLFormElement, message: string): void {
    const alert = form.querySelector('.lead-form__alert');
    if (alert) alert.textContent = message;
  }

  private clearError(form: HTMLFormElement, target: EventTarget | null): void {
    if (!(target instanceof HTMLInputElement) || target.name === '') return;
    for (const control of form.querySelectorAll(`[name="${target.name}"]`)) control.removeAttribute('aria-invalid');
    const message = form.querySelector(`[data-error-for="${target.name}"]`);
    if (message) message.textContent = '';
  }

  private clearAll(form: HTMLFormElement): void {
    for (const message of form.querySelectorAll('[data-error-for], .lead-form__alert')) message.textContent = '';
    for (const control of form.querySelectorAll('[aria-invalid]')) control.removeAttribute('aria-invalid');
    const actions = form.querySelector<HTMLElement>('.lead-form__alert-actions');
    if (actions) actions.hidden = true;
  }

  private showDone(form: HTMLFormElement, name: string, whatsappUrl: string, text: string): void {
    const done = this.querySelector<HTMLElement>('.lead-form__done');
    if (!done) return;
    const nameSlot = done.querySelector('[data-name]');
    if (nameSlot) nameSlot.textContent = name;
    const textSlot = done.querySelector('[data-done-text]');
    if (textSlot) textSlot.textContent = text;
    done.querySelector<HTMLAnchorElement>('[data-whatsapp]')?.setAttribute('href', whatsappUrl);
    form.hidden = true;
    done.hidden = false;
    done.focus();
  }
}

export function defineLeadForm(): void {
  if (!customElements.get('lead-form')) customElements.define('lead-form', LeadForm);
}
