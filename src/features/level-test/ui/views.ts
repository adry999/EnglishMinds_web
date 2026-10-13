import type { ResultSummary } from '../model/describe-result';
import { DIPLOMA_NOTE, diplomaLine, formatDiplomaDate } from '../model/diploma-content';
import type { TestScore } from '../model/score-test';
import { choiceLabels, type Mode } from '../model/select-bank';
import { SKILL_LABELS, SKILLS, type Question } from '../model/types';
import { h } from './dom';

export type Handlers = {
  chooseMode(mode: Mode): void;
  chooseOption(choice: number): void;
  start(): void;
  back(): void;
  answer(option: number): void;
  replay(): void;
  restart(): void;
  bookDemo(): void;
  nameInput(value: string): void;
  download(): void;
  print(): void;
};

const heading = (text: string, className = 'level-test__title') => h('h2', { class: className, tabindex: -1 }, text);

export function modeView(on: Handlers): Node {
  const card = (title: string, description: string, onClick: () => void) => {
    const button = h(
      'button',
      { type: 'button', class: 'level-test__mode' },
      h('span', { class: 'level-test__eyebrow' }, '12 întrebări · 5 minute'),
      h('span', { class: 'level-test__mode-title' }, title),
      h('span', { class: 'level-test__mode-text' }, description),
    );
    button.addEventListener('click', onClick);
    return button;
  };
  const level = card(
    'Test de nivel',
    'Aflăm grupa potrivită. Întrebările se adaptează vârstei, cu imagini și audio pentru cei mici.',
    () => on.chooseMode('level'),
  );
  const exam = card(
    'Test pentru examen Cambridge',
    'Verificăm cât de pregătit e copilul pentru Starters, Movers, Flyers sau A2 Key.',
    () => on.chooseMode('exam'),
  );
  return h(
    'div',
    { class: 'level-test__step' },
    heading('Ce fel de test vrei să facă copilul?'),
    h('div', { class: 'level-test__modes' }, level, exam),
  );
}

export function setupView(mode: Mode, choice: number | null, on: Handlers): Node {
  const labelId = 'level-test-choice-label';
  const choices = choiceLabels(mode).map((label, index) => {
    const item = h(
      'button',
      { type: 'button', class: 'level-test__choice', 'aria-pressed': String(index === choice) },
      label,
    );
    item.addEventListener('click', () => on.chooseOption(index));
    return item;
  });
  const start = h('button', { type: 'button', class: 'button button--primary', disabled: choice === null }, 'Începe testul');
  start.addEventListener('click', on.start);
  const back = h('button', { type: 'button', class: 'level-test__link' }, 'Înapoi');
  back.addEventListener('click', on.back);
  return h(
    'div',
    { class: 'level-test__step' },
    heading(mode === 'level' ? 'Câți ani are copilul?' : 'Pentru ce examen se pregătește?'),
    h('p', { class: 'level-test__label', id: labelId }, mode === 'level' ? 'Vârsta' : 'Examenul Cambridge'),
    h('div', { class: 'level-test__choices', role: 'group', 'aria-labelledby': labelId }, ...choices),
    h('div', { class: 'level-test__actions' }, start, back),
  );
}

function mediaView(question: Question, speechAvailable: boolean, on: Handlers): Node | null {
  switch (question.kind) {
    case 'color':
      return h('div', {
        class: 'level-test__color',
        role: 'img',
        'aria-label': 'Cerc colorat',
        style: `--swatch: ${question.color}`,
      });
    case 'count':
      return h(
        'div',
        { class: 'level-test__stars', role: 'img', 'aria-label': `${question.count} stele` },
        ...Array.from({ length: question.count }, () => h('span', { class: 'level-test__star' })),
      );
    case 'audio': {
      if (!speechAvailable) {
        return h(
          'div',
          { class: 'level-test__passage' },
          h('p', { class: 'level-test__note' }, 'Browserul tău nu poate reda sunetul. Citește propoziția:'),
          h('p', { lang: 'en' }, question.say),
        );
      }
      const play = h(
        'button',
        { type: 'button', class: 'level-test__play' },
        h('span', { class: 'level-test__play-icon', 'aria-hidden': 'true' }),
        'Ascultă din nou',
      );
      play.addEventListener('click', on.replay);
      return play;
    }
    case 'text':
      return question.passage ? h('p', { class: 'level-test__passage', lang: 'en' }, question.passage) : null;
  }
}

const INSTRUCTION_ID = 'level-test-instruction';
const MEDIA_ID = 'level-test-media';

export function questionView(question: Question, index: number, total: number, speechAvailable: boolean, on: Handlers): Node {
  const media = mediaView(question, speechAvailable, on);
  if (media instanceof HTMLElement) media.id = MEDIA_ID;
  const title = heading(question.prompt, 'level-test__question');
  title.setAttribute('aria-describedby', media ? `${INSTRUCTION_ID} ${MEDIA_ID}` : INSTRUCTION_ID);
  const options = question.options.map((option, optionIndex) => {
    const item = h(
      'button',
      { type: 'button', class: 'level-test__option' },
      h('span', { class: 'level-test__letter', 'aria-hidden': 'true' }, 'ABC'[optionIndex] ?? ''),
      h('span', {}, option),
    );
    item.addEventListener('click', () => on.answer(optionIndex));
    return item;
  });
  return h(
    'div',
    { class: 'level-test__step' },
    h(
      'div',
      { class: 'level-test__meta' },
      h('span', { class: 'level-test__chip' }, SKILL_LABELS[question.skill]),
      h('span', { class: 'level-test__count' }, `${index + 1} / ${total}`),
    ),
    h(
      'div',
      {
        class: 'level-test__progress',
        role: 'progressbar',
        'aria-label': 'Progres',
        'aria-valuemin': 1,
        'aria-valuemax': total,
        'aria-valuenow': index + 1,
        'aria-valuetext': `Întrebarea ${index + 1} din ${total}`,
      },
      h('span', { class: 'level-test__progress-fill', style: `width: ${((index + 1) / total) * 100}%` }),
    ),
    h('p', { class: 'level-test__eyebrow', id: INSTRUCTION_ID }, question.instruction),
    media,
    title,
    h('div', { class: 'level-test__options' }, ...options),
  );
}

export type ResultViewInput = {
  readonly mode: Mode;
  readonly summary: ResultSummary;
  readonly score: TestScore;
  readonly childName: string;
  readonly whatsappUrl: string;
  readonly date: Date;
};

export function resultView(input: ResultViewInput, on: Handlers): Node {
  const { summary, score } = input;
  const skills = SKILLS.map((skill) => {
    const { correct, total } = score.bySkill[skill];
    const percent = total === 0 ? 0 : (correct / total) * 100;
    return h(
      'li',
      { class: `level-test__skill level-test__skill--${skill}` },
      h('span', { class: 'level-test__skill-label' }, SKILL_LABELS[skill]),
      h('span', { class: 'level-test__skill-score' }, `${correct}/${total}`),
      h('span', { class: 'level-test__bar', 'aria-hidden': 'true' }, h('span', { style: `width: ${percent}%` })),
    );
  });

  const nameField = h('input', {
    class: 'level-test__name-input',
    id: 'level-test-child-name',
    name: 'childName',
    type: 'text',
    autocomplete: 'off',
    placeholder: 'Numele și prenumele copilului',
    maxlength: 60,
  });
  nameField.value = input.childName;
  nameField.addEventListener('input', () => on.nameInput(nameField.value));

  const download = h('button', { type: 'button', class: 'button button--sun level-test__download' });
  download.addEventListener('click', on.download);
  const print = h('button', { type: 'button', class: 'button level-test__print' }, 'Tipărește / salvează PDF (A4)');
  print.addEventListener('click', on.print);

  const book = h('button', { type: 'button', class: 'button button--sun level-test__book' }, 'Rezervă lecția demo');
  book.addEventListener('click', on.bookDemo);

  const restart = h('button', { type: 'button', class: 'level-test__link' }, 'Fă un alt test');
  restart.addEventListener('click', on.restart);

  return h(
    'div',
    { class: 'level-test__step' },
    h(
      'div',
      { class: 'level-test__result-head' },
      h('p', { class: 'level-test__eyebrow' }, summary.kicker),
      heading(summary.title, 'level-test__result-title'),
      h('p', { class: 'level-test__result-text' }, summary.description),
    ),
    h(
      'div',
      { class: 'level-test__result-grid' },
      h(
        'section',
        { class: 'level-test__skills', 'aria-labelledby': 'level-test-skills' },
        h(
          'div',
          { class: 'level-test__skills-head' },
          h('h3', { id: 'level-test-skills' }, 'Rezultat pe competențe'),
          h('span', { class: 'level-test__total' }, `${score.score}/${score.total}`),
        ),
        h('ul', { role: 'list' }, ...skills),
      ),
      h(
        'section',
        { class: 'level-test__diploma', 'aria-label': 'Diplomă' },
        h('label', { class: 'level-test__name-label', for: 'level-test-child-name' }, 'Cui se decernează diploma?'),
        nameField,
        h(
          'div',
          { class: 'level-test__preview', 'aria-hidden': 'true' },
          h('span', { class: 'level-test__preview-star' }),
          h('span', { class: 'level-test__preview-kicker' }, 'Diplomă'),
          h('span', { class: 'level-test__preview-small' }, 'Se acordă lui / ei'),
          h('span', { class: 'level-test__diploma-name' }),
          h('span', { class: 'level-test__preview-line' }, diplomaLine(input.mode)),
          h('span', { class: 'level-test__preview-title' }, summary.title),
          h('span', { class: 'level-test__preview-small' }, DIPLOMA_NOTE),
          h('span', { class: 'level-test__preview-small' }, `English Minds Academy · ${formatDiplomaDate(input.date)}`),
        ),
        download,
        print,
        h('p', { class: 'level-test__diploma-error', role: 'alert' }),
        h('p', { class: 'level-test__diploma-note', role: 'status' }),
      ),
    ),
    h(
      'div',
      { class: 'level-test__cta' },
      h(
        'div',
        {},
        h('h3', {}, 'Următorul pas: lecția demo gratuită'),
        h('p', {}, 'Lasă-ne numele și telefonul în formularul de mai jos și te sunăm să stabilim ziua lecției. Poți trimite rezultatul și pe WhatsApp.'),
      ),
      h(
        'div',
        { class: 'level-test__cta-actions' },
        book,
        h('a', { class: 'button button--outline-light level-test__whatsapp', href: input.whatsappUrl, target: '_blank', rel: 'noopener' }, 'Trimite rezultatul pe WhatsApp'),
      ),
    ),
    restart,
  );
}
