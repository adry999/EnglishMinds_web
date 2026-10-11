// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEVEL_TEST_COMPLETED } from '@shared/contracts/domain-events';
import { MID, YOUNG } from '../data/questions';
import { createDiplomaCanvas, downloadDiploma, printDiploma } from '../diploma/render-diploma';
import { defineLevelTest } from './level-test.element';

vi.mock('../diploma/render-diploma', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../diploma/render-diploma')>();
  return {
    createDiplomaCanvas: vi.fn(actual.createDiplomaCanvas),
    downloadDiploma: vi.fn(),
    printDiploma: vi.fn(),
  };
});

const MARKUP = `
  <level-test>
    <div class="level-test__ema"><p class="level-test__bubble">Hei!</p></div>
    <div class="level-test__card"><h2>Fără JS</h2></div>
  </level-test>`;

const card = () => document.querySelector('.level-test__card')!;
const bubble = () => document.querySelector('.level-test__bubble')!.textContent;
const button = (name: string) =>
  [...card().querySelectorAll('button')].find((item) => item.textContent?.replace(/\s+/g, ' ').includes(name))!;
const optionButtons = () => [...card().querySelectorAll<HTMLButtonElement>('.level-test__option')];

function mount() {
  const holder = document.createElement('div');
  holder.innerHTML = MARKUP;
  document.body.replaceChildren(...holder.childNodes);
}

function answerAll(bank: typeof YOUNG, pick: (index: number) => number) {
  bank.forEach((_question, index) => optionButtons()[pick(index)]!.click());
}

const cleanups: (() => void)[] = [];

function collectCompleted(): CustomEvent[] {
  const events: CustomEvent[] = [];
  const listener = (event: Event) => events.push(event as CustomEvent);
  document.addEventListener(LEVEL_TEST_COMPLETED, listener);
  cleanups.push(() => document.removeEventListener(LEVEL_TEST_COMPLETED, listener));
  return events;
}

function finishWithName(name: string) {
  button('Test de nivel').click();
  button('5–6 ani').click();
  button('Începe testul').click();
  answerAll(YOUNG, () => 0);
  const input = card().querySelector<HTMLInputElement>('input[name="childName"]')!;
  input.value = name;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function stubSpeech(speak: () => void, cancel = vi.fn()) {
  vi.stubGlobal('speechSynthesis', { cancel, speak });
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      lang = '';
      rate = 1;
      constructor(public text: string) {}
    },
  );
  mount();
}

describe('<level-test>', () => {
  beforeEach(() => {
    vi.mocked(createDiplomaCanvas).mockClear();
    vi.mocked(downloadDiploma).mockReset();
    vi.mocked(printDiploma).mockReset();
    vi.stubGlobal('speechSynthesis', undefined);
    defineLevelTest();
    mount();
  });

  afterEach(() => {
    cleanups.splice(0).forEach((cleanup) => cleanup());
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('replaces the no-JS fallback with the mode choice without stealing focus on load', () => {
    expect(card().textContent).not.toContain('Fără JS');
    const heading = card().querySelector('h2')!;
    expect(heading.textContent).toBe('Ce fel de test vrei să facă copilul?');
    expect(document.activeElement).not.toBe(heading);
    expect(button('Test de nivel')).toBeTruthy();
    expect(button('Test pentru examen Cambridge')).toBeTruthy();
    expect(bubble()).toBe('Hei, eu sunt Ema! Alege testul și începem.');
  });

  it('keeps start disabled until an age is picked, with aria-pressed on the choice', () => {
    button('Test de nivel').click();
    expect(document.activeElement).toBe(card().querySelector('h2'));
    expect(card().querySelector('h2')!.textContent).toBe('Câți ani are copilul?');
    expect(button('Începe testul').disabled).toBe(true);
    button('9–10 ani').click();
    expect(button('9–10 ani').getAttribute('aria-pressed')).toBe('true');
    expect(button('5–6 ani').getAttribute('aria-pressed')).toBe('false');
    expect(button('Începe testul').disabled).toBe(false);
  });

  it('shows a question with progress, three named options and focuses the prompt', () => {
    button('Test de nivel').click();
    button('9–10 ani').click();
    button('Începe testul').click();
    const prompt = card().querySelector('h2')!;
    expect(prompt.textContent).toBe(MID[0]!.prompt);
    expect(document.activeElement).toBe(prompt);
    const progress = card().querySelector('[role="progressbar"]')!;
    expect(progress.getAttribute('aria-valuenow')).toBe('1');
    expect(progress.getAttribute('aria-valuemax')).toBe('12');
    expect(card().textContent).toContain('1 / 12');
    expect(optionButtons().map((item) => item.textContent?.trim().slice(1).trim())).toEqual([...MID[0]!.options]);
  });

  it('falls back to text for listening questions when speech is unavailable', () => {
    button('Test de nivel').click();
    button('9–10 ani').click();
    button('Începe testul').click();
    optionButtons()[0]!.click();
    optionButtons()[0]!.click();
    expect(card().textContent).toContain('Browserul tău nu poate reda sunetul. Citește propoziția:');
    expect(card().textContent).toContain('My brother is twelve years old.');
    expect(button('Ascultă din nou')).toBeUndefined();
  });

  it('speaks listening questions when speech is available', () => {
    const speak = vi.fn();
    stubSpeech(speak);
    button('Test de nivel').click();
    button('9–10 ani').click();
    button('Începe testul').click();
    optionButtons()[0]!.click();
    optionButtons()[0]!.click();
    expect(speak).toHaveBeenCalledTimes(1);
    button('Ascultă din nou').click();
    expect(speak).toHaveBeenCalledTimes(2);
  });

  it('switches to the text fallback when speaking throws', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    stubSpeech(() => {
      throw new Error('no voice');
    });
    button('Test de nivel').click();
    button('9–10 ani').click();
    button('Începe testul').click();
    optionButtons()[0]!.click();
    optionButtons()[0]!.click();
    expect(card().textContent).toContain('Browserul tău nu poate reda sunetul. Citește propoziția:');
    expect(card().textContent).toContain('My brother is twelve years old.');
    expect(button('Ascultă din nou')).toBeUndefined();
  });

  it('cancels speech when leaving a question and when disconnected', () => {
    const cancel = vi.fn();
    stubSpeech(vi.fn(), cancel);
    button('Test de nivel').click();
    button('9–10 ani').click();
    button('Începe testul').click();
    cancel.mockClear();
    optionButtons()[0]!.click();
    expect(cancel).toHaveBeenCalled();
    cancel.mockClear();
    document.querySelector('level-test')!.remove();
    expect(cancel).toHaveBeenCalled();
  });

  it('shows the result, emits level-test.completed once and asks for the name', () => {
    const events = collectCompleted();
    button('Test de nivel').click();
    button('9–10 ani').click();
    button('Începe testul').click();
    answerAll(MID, (index) => MID[index]!.answer);
    expect(card().querySelector('h2')!.textContent).toBe('A2 Key');
    expect(card().textContent).toContain('Nivelul recomandat');
    expect(card().textContent).toContain('12/12');
    expect(events).toHaveLength(1);
    expect(events[0]!.detail).toEqual({ mode: 'level', level: 'a2-key', score: 12, total: 12 });
    expect(bubble()).toBe('Bravo! Scrie numele tău ca să-ți pregătesc diploma.');
    expect(button('Scrie numele ca să descarci').disabled).toBe(true);
  });

  it('emits a second completed event after restarting and finishing again', () => {
    const events = collectCompleted();
    finishWithName('Ana');
    button('Fă un alt test').click();
    button('Test de nivel').click();
    button('5–6 ani').click();
    button('Începe testul').click();
    answerAll(YOUNG, () => 0);
    expect(events).toHaveLength(2);
  });

  it('updates the diploma preview, Ema and WhatsApp link as the name is typed, as text only', () => {
    button('Test pentru examen Cambridge').click();
    button('Starters').click();
    button('Începe testul').click();
    answerAll(YOUNG, () => 0);
    const input = card().querySelector<HTMLInputElement>('input[name="childName"]')!;
    input.focus();
    input.value = '<img src=x onerror=alert(1)>';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(card().querySelector('.level-test__diploma-name')!.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(card().querySelector('img')).toBeNull();
    expect(bubble()).toContain('Bravo, <img src=x onerror=alert(1)>!');
    expect(button('Descarcă diploma (PNG)').disabled).toBe(false);
    expect(document.activeElement).toBe(input);
    const whatsapp = card().querySelector<HTMLAnchorElement>('a.button--whatsapp')!;
    expect(decodeURIComponent(whatsapp.href)).toContain('<img src=x onerror=alert(1)> a făcut testul pe site');
  });

  it('shows a clear message when the diploma cannot be drawn', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    finishWithName('Ana');
    button('Descarcă diploma (PNG)').click();
    await vi.waitFor(() =>
      expect(card().querySelector('[role="alert"]')?.textContent).toBe(
        'Nu am putut pregăti diploma. Încearcă din nou sau fă o captură de ecran.',
      ),
    );
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  describe('diploma export', () => {
    const canvas = () => document.createElement('canvas');

    it('downloads the diploma with the cleaned name', async () => {
      const made = canvas();
      vi.mocked(createDiplomaCanvas).mockResolvedValueOnce(made);
      finishWithName('  Ana   Maria ');
      button('Descarcă diploma (PNG)').click();
      await vi.waitFor(() => expect(downloadDiploma).toHaveBeenCalledWith(document, made, 'Ana Maria'));
      expect(vi.mocked(createDiplomaCanvas).mock.calls[0]![1].childName).toBe('Ana Maria');
    });

    it('prints without downloading when the print window opens', async () => {
      const made = canvas();
      vi.mocked(createDiplomaCanvas).mockResolvedValueOnce(made);
      vi.mocked(printDiploma).mockReturnValue(true);
      finishWithName('Ana');
      button('Tipărește').click();
      await vi.waitFor(() => expect(printDiploma).toHaveBeenCalledWith(window, made, 'Ana'));
      expect(downloadDiploma).not.toHaveBeenCalled();
    });

    it('downloads and explains when the print popup is blocked', async () => {
      const made = canvas();
      vi.mocked(createDiplomaCanvas).mockResolvedValueOnce(made);
      vi.mocked(printDiploma).mockReturnValue(false);
      finishWithName('Ana');
      button('Tipărește').click();
      await vi.waitFor(() => expect(downloadDiploma).toHaveBeenCalledWith(document, made, 'Ana'));
      expect(card().querySelector('[role="status"]')!.textContent).toBe(
        'Fereastra de tipărire a fost blocată, am descărcat diploma ca imagine.',
      );
    });

    it('disables the buttons while an export is pending', async () => {
      let finish: (value: HTMLCanvasElement) => void = () => undefined;
      vi.mocked(createDiplomaCanvas).mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
      finishWithName('Ana');
      button('Descarcă diploma (PNG)').click();
      expect(button('Descarcă diploma (PNG)').disabled).toBe(true);
      expect(button('Tipărește').disabled).toBe(true);
      finish(canvas());
      await vi.waitFor(() => expect(button('Descarcă diploma (PNG)').disabled).toBe(false));
      expect(createDiplomaCanvas).toHaveBeenCalledTimes(1);
    });
  });

  it('restarts and keeps the typed name', () => {
    finishWithName('Ana');
    button('Fă un alt test').click();
    expect(card().querySelector('h2')!.textContent).toBe('Ce fel de test vrei să facă copilul?');
    button('Test de nivel').click();
    button('5–6 ani').click();
    button('Începe testul').click();
    answerAll(YOUNG, () => 1);
    expect(card().querySelector<HTMLInputElement>('input[name="childName"]')!.value).toBe('Ana');
  });

  it('does not enhance twice when reconnected', () => {
    const element = document.querySelector('level-test')!;
    button('Test de nivel').click();
    const title = card().querySelector('h2')!;
    const replace = vi.spyOn(card(), 'replaceChildren');
    element.remove();
    document.body.append(element);
    expect(card().querySelector('h2')).toBe(title);
    expect(replace).not.toHaveBeenCalled();
  });

  it('advances the progress bar and names the question for screen readers', () => {
    button('Test de nivel').click();
    button('5–6 ani').click();
    button('Începe testul').click();
    const progress = () => card().querySelector('[role="progressbar"]')!;
    expect(progress().getAttribute('aria-valuenow')).toBe('1');
    expect(progress().getAttribute('aria-valuetext')).toBe(`Întrebarea 1 din ${YOUNG.length}`);
    optionButtons()[0]!.click();
    expect(progress().getAttribute('aria-valuenow')).toBe('2');
    expect(progress().getAttribute('aria-valuetext')).toBe(`Întrebarea 2 din ${YOUNG.length}`);
  });

  it('describes the question heading by its instruction and passage', () => {
    button('Test de nivel').click();
    button('9–10 ani').click();
    button('Începe testul').click();
    optionButtons()[0]!.click();
    optionButtons()[0]!.click();
    const title = card().querySelector('h2')!;
    const described = title
      .getAttribute('aria-describedby')!
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent ?? '');
    expect(described).toHaveLength(2);
    expect(described[0]).toBe(MID[2]!.instruction);
    expect(described[1]).toContain('My brother is twelve years old.');
  });
});
