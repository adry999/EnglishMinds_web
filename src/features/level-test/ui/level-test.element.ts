import { createLeadFormRequested, createLevelTestCompleted } from '@shared/contracts/domain-events';
import { createDiplomaCanvas, downloadDiploma, printDiploma } from '../diploma/render-diploma';
import { describeResult } from '../model/describe-result';
import { cleanChildName } from '../model/diploma-content';
import { emaLine } from '../model/ema-line';
import { resultWhatsappUrl } from '../model/result-message';
import { scoreTest } from '../model/score-test';
import { selectBank } from '../model/select-bank';
import { currentQuestion, INITIAL_STATE, reduceTest, type TestAction, type TestState } from '../model/test-session';
import { createSpeech, type Speech } from './speech';
import { modeView, questionView, resultView, setupView, type Handlers } from './views';

const PRINT_BLOCKED = 'Fereastra de tipărire a fost blocată, am descărcat diploma ca imagine.';
const DIPLOMA_ERROR = 'Nu am putut pregăti diploma. Încearcă din nou sau fă o captură de ecran.';

export class LevelTest extends HTMLElement {
  private state: TestState = INITIAL_STATE;
  private childName = '';
  private speechFailed = false;
  private exporting = false;
  private speech: Speech = createSpeech(window);
  private readonly handlers: Handlers = {
    chooseMode: (mode) => this.dispatch({ type: 'chooseMode', mode }),
    chooseOption: (choice) => this.dispatch({ type: 'chooseOption', choice }),
    start: () => this.dispatch({ type: 'start' }),
    back: () => this.dispatch({ type: 'back' }),
    answer: (option) => this.dispatch({ type: 'answer', option }),
    replay: () => this.speakCurrent(),
    restart: () => this.dispatch({ type: 'restart' }),
    bookDemo: () => void this.dispatchEvent(createLeadFormRequested()),
    nameInput: (value) => this.updateName(value),
    download: () => void this.exportDiploma('download'),
    print: () => void this.exportDiploma('print'),
  };

  connectedCallback(): void {
    if (this.dataset.enhanced === 'true') return;
    if (!this.cardRegion()) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.connectedCallback(), { once: true });
      }
      return;
    }
    this.speech = createSpeech(window);
    this.dataset.enhanced = 'true';
    this.render({ focus: false });
  }

  disconnectedCallback(): void {
    this.speech.cancel();
  }

  private cardRegion(): HTMLElement | null {
    return this.querySelector<HTMLElement>(':scope > .level-test__card');
  }

  private dispatch(action: TestAction): void {
    const previous = this.state;
    this.state = reduceTest(this.state, action);
    if (this.state === previous) return;
    if (previous.step === 'question' || action.type === 'restart') this.speech.cancel();
    if (action.type === 'restart') this.speechFailed = false;
    const stepChanged = previous.step !== this.state.step;
    const isOptionChange = action.type === 'chooseOption';
    this.render({ focus: !isOptionChange || stepChanged, focusChoice: isOptionChange });
    if (this.state.step === 'question') this.speakCurrent();
    if (this.state.step === 'result' && previous.step !== 'result') this.announceResult();
  }

  private speakCurrent(): void {
    const question = currentQuestion(this.state);
    if (question?.kind !== 'audio') return;
    if (!this.speech.speak(question.say, () => this.speechBroke())) this.speechBroke();
  }

  private speechBroke(): void {
    if (this.speechFailed) return;
    this.speechFailed = true;
    if (this.state.step === 'question') this.render({ focus: this.contains(document.activeElement) });
  }

  private resultData() {
    if (this.state.step !== 'result') return null;
    const bank = selectBank(this.state.mode, this.state.choice);
    const score = scoreTest(bank, this.state.answers);
    const summary = describeResult(this.state.mode, this.state.choice, score.score, score.total);
    return { mode: this.state.mode, score, summary };
  }

  private announceResult(): void {
    const data = this.resultData();
    if (!data) return;
    this.dispatchEvent(
      createLevelTestCompleted({ mode: data.mode, level: data.summary.level, score: data.score.score, total: data.score.total }),
    );
  }

  private render({ focus, focusChoice = false }: { focus: boolean; focusChoice?: boolean }): void {
    const region = this.cardRegion();
    if (!region) return;
    const bubble = this.querySelector('.level-test__bubble');
    if (bubble) bubble.textContent = emaLine(this.state, this.childName);

    const state = this.state;
    let view: Node;
    if (state.step === 'mode') view = modeView(this.handlers);
    else if (state.step === 'setup') view = setupView(state.mode, state.choice, this.handlers);
    else if (state.step === 'question') {
      const bank = selectBank(state.mode, state.choice);
      const question = bank[state.answers.length];
      if (!question) return;
      view = questionView(question, state.answers.length, bank.length, this.speech.available && !this.speechFailed, this.handlers);
    } else {
      const data = this.resultData();
      if (!data) return;
      view = resultView(
        {
          ...data,
          childName: this.childName,
          whatsappUrl: resultWhatsappUrl(data.summary, data.score.score, data.score.total, cleanChildName(this.childName)),
          date: new Date(),
        },
        this.handlers,
      );
    }
    region.replaceChildren(view);
    if (state.step === 'result') this.refreshDiploma();
    if (focusChoice && state.step === 'setup' && state.choice !== null) {
      region.querySelectorAll<HTMLButtonElement>('.level-test__choice')[state.choice]?.focus();
    } else if (focus) {
      region.querySelector<HTMLElement>('h2')?.focus();
    }
  }

  private updateName(value: string): void {
    this.childName = value;
    const bubble = this.querySelector('.level-test__bubble');
    if (bubble) bubble.textContent = emaLine(this.state, this.childName);
    this.refreshDiploma();
  }

  private refreshDiploma(): void {
    const region = this.cardRegion();
    const data = this.resultData();
    if (!region || !data) return;
    const cleanName = cleanChildName(this.childName);
    const hasName = cleanName.length > 0;
    const name = region.querySelector('.level-test__diploma-name');
    if (name) {
      name.textContent = hasName ? cleanName : 'Numele copilului';
      name.classList.toggle('is-empty', !hasName);
    }
    const download = region.querySelector<HTMLButtonElement>('.level-test__download');
    if (download) {
      download.disabled = !hasName || this.exporting;
      download.textContent = hasName ? 'Descarcă diploma (PNG)' : 'Scrie numele ca să descarci';
    }
    const print = region.querySelector<HTMLButtonElement>('.level-test__print');
    if (print) {
      print.hidden = !hasName;
      print.disabled = this.exporting;
    }
    const whatsapp = region.querySelector<HTMLAnchorElement>('a.level-test__whatsapp');
    if (whatsapp) whatsapp.href = resultWhatsappUrl(data.summary, data.score.score, data.score.total, cleanName);
  }

  private async exportDiploma(kind: 'download' | 'print'): Promise<void> {
    const data = this.resultData();
    const region = this.cardRegion();
    const cleanName = cleanChildName(this.childName);
    if (!data || !region || !cleanName || this.exporting) return;
    const error = region.querySelector('.level-test__diploma-error');
    const note = region.querySelector('.level-test__diploma-note');
    if (error) error.textContent = '';
    if (note) note.textContent = '';
    // Opened synchronously, before any await, so Safari treats it as user-initiated.
    const popup = kind === 'print' ? window.open('', '_blank') : null;
    this.exporting = true;
    this.refreshDiploma();
    try {
      const canvas = await createDiplomaCanvas(document, {
        childName: cleanName,
        mode: data.mode,
        title: data.summary.title,
        score: data.score.score,
        total: data.score.total,
        date: new Date(),
      });
      if (kind === 'print') {
        if (printDiploma(popup, canvas, cleanName)) return;
        if (note) note.textContent = PRINT_BLOCKED;
      }
      downloadDiploma(document, canvas, cleanName);
    } catch (cause) {
      popup?.close();
      console.error('[level-test] diploma nu a putut fi generată', cause);
      if (error) error.textContent = DIPLOMA_ERROR;
    } finally {
      this.exporting = false;
      this.refreshDiploma();
    }
  }
}

export function defineLevelTest(): void {
  if (!customElements.get('level-test')) customElements.define('level-test', LevelTest);
}
