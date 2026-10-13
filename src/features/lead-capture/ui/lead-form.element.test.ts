// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MIN_ELAPSED_MS } from '@shared/contracts/lead.schema';
import { LEAD_SUBMITTED, createLeadFormRequested, createLevelTestCompleted } from '@shared/contracts/domain-events';
import type { SubmitLeadResult } from '../api/lead.client';
import { submitLead } from '../api/lead.client';
import { defineLeadForm } from './lead-form.element';

vi.mock('../api/lead.client', () => ({ submitLead: vi.fn() }));
const submitMock = vi.mocked(submitLead);

const AGES = ['5–6 ani', '7–8 ani', '9–10 ani', '11–12 ani', '13–14 ani'];

function markup(source: string, { ages = true, hidden = false, demo = false } = {}): string {
  const id = (part: string) => `lead-${source}-${part}`;
  return `
  <lead-form class="lead-form" data-source="${source}" data-phone-display="+40 775 630 680" ${hidden ? 'hidden' : ''} ${demo ? 'data-demo' : ''}>
    <div class="lead-form__fallback"><p>Formularul are nevoie de JavaScript.</p></div>
    <form class="lead-form__form" novalidate hidden>
      <input id="${id('parentName')}" name="parentName" />
      <p class="lead-form__error" data-error-for="parentName"></p>
      <input id="${id('phone')}" name="phone" />
      <p class="lead-form__error" data-error-for="phone"></p>
      ${ages ? `<fieldset>${AGES.map((age) => `<label><input type="radio" name="childAgeGroup" value="${age}"><span>${age}</span></label>`).join('')}<p class="lead-form__error" data-error-for="childAgeGroup"></p></fieldset>` : ''}
      <input name="website" />
      <input id="${id('consent')}" name="consent" type="checkbox" />
      <p class="lead-form__error" data-error-for="consent"></p>
      <button class="lead-form__submit" type="submit">Rezervă</button>
      <p class="lead-form__alert" role="alert"></p>
      <p class="lead-form__alert-actions" hidden><a data-alert-whatsapp href="https://wa.me/40775630680">WhatsApp</a><a href="tel:+40775630680">Sună-ne</a></p>
      <p class="lead-form__status" role="status"></p>
    </form>
    <div class="lead-form__done" hidden tabindex="-1">
      <p>Mulțumim, <span data-name></span>!</p>
      <p data-done-text></p>
      <a data-whatsapp href="https://wa.me/40775630680">WhatsApp</a>
    </div>
  </lead-form>`;
}

type FakePopup = { opener: unknown; location: { replace: ReturnType<typeof vi.fn> }; close: ReturnType<typeof vi.fn> };
let popup: FakePopup | null;
let openSpy: ReturnType<typeof vi.spyOn>;
let now = 0;

function mount(source = 'home', options?: { ages?: boolean; hidden?: boolean; demo?: boolean }): HTMLElement {
  const holder = document.createElement('div');
  holder.innerHTML = markup(source, options);
  document.body.replaceChildren(...holder.childNodes);
  return document.querySelector('lead-form') as HTMLElement;
}

const el = <T extends Element>(selector: string): T => document.querySelector(selector) as T;
const input = (name: string): HTMLInputElement => el(`[name="${name}"]`);

function fill({ name = 'Ana Pop', phone = '0722 123 456', consent = true, age }: { name?: string; phone?: string; consent?: boolean; age?: string } = {}): void {
  input('parentName').value = name;
  input('phone').value = phone;
  input('consent').checked = consent;
  if (now < 4000) now = 4000;
  if (age) (el(`input[value="${age}"]`) as HTMLInputElement).checked = true;
}

const submit = (): void => {
  el<HTMLFormElement>('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
};
const flush = async (): Promise<void> => {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
};

beforeEach(() => {
  defineLeadForm();
  now = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  popup = { opener: window, location: { replace: vi.fn() }, close: vi.fn() };
  openSpy = vi.spyOn(window, 'open').mockImplementation(() => popup as unknown as Window);
  submitMock.mockReset();
  sessionStorage.clear();
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('<lead-form> in demo mode', () => {
  it('shows the thank-you state with a demo line, without sending, opening WhatsApp or announcing a lead', async () => {
    const host = mount('home', { demo: true });
    const announced = vi.fn();
    host.addEventListener(LEAD_SUBMITTED, announced);
    fill();
    submit();
    await flush();
    expect(submitMock).not.toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();
    expect(announced).not.toHaveBeenCalled();
    expect(el<HTMLFormElement>('form').hidden).toBe(true);
    expect(el<HTMLElement>('.lead-form__done').hidden).toBe(false);
    expect(el('[data-name]').textContent).toBe('Ana Pop');
    expect(el('[data-done-text]').textContent).toContain('Am primit datele tale și te sunăm în curând.');
    expect(el('[data-done-text]').textContent).toContain('versiune demo');
    expect(decodeURIComponent(el<HTMLAnchorElement>('[data-whatsapp]').href)).toContain('Sunt Ana Pop (0722 123 456)');
  });

  it('keeps the validation errors for an incomplete form', async () => {
    mount('home', { demo: true });
    submit();
    await flush();
    expect(el('[data-error-for="parentName"]').textContent).not.toBe('');
    expect(el('.lead-form__status').textContent).toBe('');
  });
});

describe('<lead-form>', () => {
  it('shows the form, removes the fallback and enhances once', () => {
    const host = mount();
    expect(el<HTMLFormElement>('form').hidden).toBe(false);
    expect(document.querySelector('.lead-form__fallback')).toBeNull();
    expect(host.dataset.enhanced).toBe('true');
    const form = el('form');
    host.remove();
    document.body.append(host);
    expect(el('form')).toBe(form);
  });

  it('flags empty required fields, focuses the first and sends nothing', async () => {
    mount();
    submit();
    await flush();
    expect(el('[data-error-for="parentName"]').textContent).toBe('Scrie numele tău (cel puțin 2 litere).');
    expect(el('[data-error-for="phone"]').textContent).toBe('Scrie un număr de telefon din România, de exemplu 0722 123 456.');
    expect(el('[data-error-for="consent"]').textContent).toBe('Bifează acordul ca să te putem contacta.');
    expect(input('parentName').getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(input('parentName'));
    expect(submitMock).not.toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('clears a field error while the parent types', async () => {
    mount();
    submit();
    await flush();
    input('phone').value = '07';
    input('phone').dispatchEvent(new Event('input', { bubbles: true }));
    expect(el('[data-error-for="phone"]').textContent).toBe('');
    expect(input('phone').hasAttribute('aria-invalid')).toBe(false);
  });

  it('opens the WhatsApp window before the request, saves, then shows thanks and emits lead.submitted', async () => {
    let resolve: (value: SubmitLeadResult) => void = () => undefined;
    submitMock.mockReturnValue(new Promise((done) => (resolve = done)));
    sessionStorage.setItem('em-utm', JSON.stringify({ source: 'instagram', medium: 'paid', campaign: 'demo' }));
    const host = mount('landing');
    const events: unknown[] = [];
    document.addEventListener(LEAD_SUBMITTED, (event) => events.push((event as CustomEvent).detail), { once: true });
    now = 4200;
    fill({ age: '9–10 ani' });
    submit();
    expect(openSpy).toHaveBeenCalledWith('', '_blank');
    expect(popup?.opener).toBeNull();
    expect(submitMock).toHaveBeenCalledTimes(1);
    expect(submitMock.mock.calls[0]?.[0]).toEqual({
      parentName: 'Ana Pop',
      phone: '0722 123 456',
      childAgeGroup: '9–10 ani',
      source: 'landing',
      testLevel: null,
      consent: true,
      policyVersion: '2',
      utm: { source: 'instagram', medium: 'paid', campaign: 'demo' },
      website: '',
      elapsedMs: 4200,
    });
    expect(el<HTMLButtonElement>('.lead-form__submit').disabled).toBe(true);
    expect(el('.lead-form__status').textContent).toBe('Se trimite…');

    resolve({ kind: 'ok' });
    await flush();
    const url = popup?.location.replace.mock.calls[0]?.[0] as string;
    expect(decodeURIComponent(url)).toContain('Sunt Ana Pop (0722 123 456). Aș dori o lecție demo gratuită pentru copilul meu (9–10 ani).');
    expect(el<HTMLFormElement>('form').hidden).toBe(true);
    expect(el<HTMLElement>('.lead-form__done').hidden).toBe(false);
    expect(el('[data-name]').textContent).toBe('Ana Pop');
    expect(el('[data-done-text]').textContent).toBe('Ți-am deschis WhatsApp cu mesajul completat. Trimite-l și te sunăm să stabilim ziua lecției.');
    expect(el<HTMLAnchorElement>('[data-whatsapp]').href).toBe(url);
    expect(document.activeElement).toBe(el('.lead-form__done'));
    expect(events).toEqual([{ source: 'landing', ageGroup: '9–10 ani' }]);
    expect(host.contains(document.activeElement)).toBe(true);
  });

  it('sends only once on a double submit', async () => {
    submitMock.mockReturnValue(new Promise(() => undefined));
    mount();
    fill();
    submit();
    submit();
    await flush();
    expect(submitMock).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledTimes(1);
  });

  it('shows WhatsApp and call buttons when the window is blocked', async () => {
    openSpy.mockReturnValue(null);
    submitMock.mockResolvedValue({ kind: 'ok' });
    mount();
    fill();
    submit();
    await flush();
    expect(el('[data-done-text]').textContent).toBe('Am primit datele tale și te sunăm în curând. Dacă vrei, scrie-ne și pe WhatsApp.');
    expect(el<HTMLAnchorElement>('[data-whatsapp]').href).toContain('https://wa.me/40775630680?text=');
  });

  it.each(['network', 'server'] as const)('still sends the parent to WhatsApp on a %s failure, without emitting', async (kind) => {
    submitMock.mockResolvedValue({ kind });
    const events: unknown[] = [];
    const listener = (event: Event): void => {
      events.push(event);
    };
    document.addEventListener(LEAD_SUBMITTED, listener);
    mount();
    fill();
    submit();
    await flush();
    document.removeEventListener(LEAD_SUBMITTED, listener);
    expect(popup?.location.replace).toHaveBeenCalledTimes(1);
    expect(el('[data-done-text]').textContent).toBe('Nu am putut salva cererea pe site. Trimite mesajul din WhatsApp și rezervarea se finalizează acolo.');
    expect(events).toEqual([]);
  });

  it('closes the window and shows field errors on a server validation answer', async () => {
    submitMock.mockResolvedValue({ kind: 'validation', fields: ['phone'] });
    mount();
    fill();
    submit();
    await flush();
    expect(popup?.close).toHaveBeenCalled();
    expect(el('[data-error-for="phone"]').textContent).toContain('0722 123 456');
    expect(el<HTMLFormElement>('form').hidden).toBe(false);
    expect(el<HTMLButtonElement>('.lead-form__submit').disabled).toBe(false);
  });

  it.each([[['utm']], [[]], [['policyVersion']], [['source']]])(
    'hands an unfixable server rejection (%j) to WhatsApp without a submitted event',
    async (fields) => {
      submitMock.mockResolvedValue({ kind: 'validation', fields });
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const events: unknown[] = [];
      const listener = (event: Event): void => void events.push(event);
      document.addEventListener(LEAD_SUBMITTED, listener);
      mount();
      fill();
      submit();
      await flush();
      document.removeEventListener(LEAD_SUBMITTED, listener);
      expect(popup?.close).not.toHaveBeenCalled();
      expect(popup?.location.replace).toHaveBeenCalledTimes(1);
      expect(el('[data-done-text]').textContent).toContain('Nu am putut salva cererea pe site');
      expect(el<HTMLElement>('.lead-form__done').hidden).toBe(false);
      expect(events).toEqual([]);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    },
  );

  it('closes the window and explains the hourly limit', async () => {
    submitMock.mockResolvedValue({ kind: 'rate_limited' });
    mount();
    fill();
    submit();
    await flush();
    expect(popup?.close).toHaveBeenCalled();
    expect(el('.lead-form__alert').textContent).toBe(
      'Ai trimis deja mai multe cereri în ultima oră. Scrie-ne pe WhatsApp sau sună-ne la +40 775 630 680.',
    );
    const actions = el<HTMLElement>('.lead-form__alert-actions');
    expect(actions.hidden).toBe(false);
    const href = actions.querySelector<HTMLAnchorElement>('[data-alert-whatsapp]')?.getAttribute('href') ?? '';
    expect(href).toContain('wa.me');
    expect(href).toContain(encodeURIComponent('Ana Pop'));
    expect(actions.querySelector('a[href^="tel:"]')).not.toBeNull();
    submitMock.mockResolvedValue({ kind: 'validation', fields: ['phone'] });
    submit();
    await flush();
    expect(actions.hidden).toBe(true);
  });

  it('prefers UTM from the current address over the stored one', async () => {
    submitMock.mockResolvedValue({ kind: 'ok' });
    sessionStorage.setItem('em-utm', JSON.stringify({ source: 'old', medium: null, campaign: null }));
    window.history.replaceState({}, '', '/?utm_source=google&utm_campaign=toamna');
    mount();
    fill();
    submit();
    await flush();
    expect(submitMock.mock.calls[0]?.[0].utm).toEqual({ source: 'google', medium: null, campaign: 'toamna' });
  });

  it('preselects the age group from ?grupa=', () => {
    window.history.replaceState({}, '', '/lectie-demo/?grupa=movers');
    mount('landing');
    expect((el('input[value="9–10 ani"]') as HTMLInputElement).checked).toBe(true);
  });

  it('on the test page, appears after the test and sends the result', async () => {
    submitMock.mockResolvedValue({ kind: 'ok' });
    const host = mount('test', { ages: false, hidden: true });
    expect(host.hidden).toBe(true);
    document.body.append(document.createElement('div'));
    document.body.lastElementChild?.dispatchEvent(createLevelTestCompleted({ mode: 'level', level: 'movers', score: 9, total: 12 }));
    expect(host.hidden).toBe(false);
    fill();
    submit();
    await flush();
    expect(submitMock.mock.calls[0]?.[0]).toMatchObject({ source: 'test', testLevel: 'level:movers', childAgeGroup: null });
    expect(decodeURIComponent(popup?.location.replace.mock.calls[0]?.[0] as string)).toContain('Am făcut testul de nivel: grupa recomandată Movers.');
  });

  it('stops listening for test results once removed', () => {
    const host = mount('test', { ages: false, hidden: true });
    host.remove();
    document.dispatchEvent(createLevelTestCompleted({ mode: 'exam', level: 'a2-key', score: 9, total: 12 }));
    expect(host.hidden).toBe(true);
  });

  it('waits out the bot timer before sending, then reports the real elapsed time', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    submitMock.mockResolvedValue({ kind: 'ok' });
    mount();
    fill();
    now = 1000;
    submit();
    await flush();
    expect(submitMock).not.toHaveBeenCalled();
    now = 3300;
    await vi.advanceTimersByTimeAsync(2200);
    await flush();
    expect(submitMock).toHaveBeenCalledTimes(1);
    expect(submitMock.mock.calls[0]?.[0].elapsedMs).toBeGreaterThanOrEqual(MIN_ELAPSED_MS + 200);
    vi.useRealTimers();
  });

  it('closes the window, alerts and re-enables the button when sending throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    submitMock.mockRejectedValue(new Error('boom'));
    mount();
    fill();
    submit();
    await flush();
    expect(popup?.close).toHaveBeenCalled();
    expect(el('.lead-form__alert').textContent).toBe('Nu am putut trimite cererea. Scrie-ne pe WhatsApp sau sună-ne.');
    expect(el<HTMLButtonElement>('.lead-form__submit').disabled).toBe(false);
  });
});

describe('<lead-form source="test"> when the result asks for the booking form', () => {
  let scrollSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollSpy = vi.fn();
    (HTMLElement.prototype as { scrollIntoView: unknown }).scrollIntoView = scrollSpy;
    window.matchMedia = ((query: string) => ({ matches: query.includes('reduce') && reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() })) as unknown as typeof window.matchMedia;
    reduced = false;
  });

  let reduced = false;

  it('unhides the form, scrolls it into view and focuses the parent name field', () => {
    const host = mount('test', { hidden: true });
    document.dispatchEvent(createLeadFormRequested());
    expect(host.hidden).toBe(false);
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(document.activeElement).toBe(input('parentName'));
  });

  it('scrolls without animation when the visitor prefers reduced motion', () => {
    reduced = true;
    mount('test', { hidden: true });
    document.dispatchEvent(createLeadFormRequested());
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  });

  it('focuses the thank-you message instead when the form was already sent', () => {
    mount('test');
    el<HTMLFormElement>('form').hidden = true;
    el<HTMLElement>('.lead-form__done').hidden = false;
    document.dispatchEvent(createLeadFormRequested());
    expect(document.activeElement).toBe(el('.lead-form__done'));
  });

  it('is ignored by forms of other pages', () => {
    mount('home');
    document.dispatchEvent(createLeadFormRequested());
    expect(scrollSpy).not.toHaveBeenCalled();
  });
});
