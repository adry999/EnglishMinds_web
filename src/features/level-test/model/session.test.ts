import { describe, expect, it } from 'vitest';
import { YOUNG } from '../data/questions';
import { emaLine } from './ema-line';
import { currentQuestion, INITIAL_STATE, reduceTest, type TestState } from './test-session';

const play = (state: TestState, ...actions: Parameters<typeof reduceTest>[1][]) => actions.reduce(reduceTest, state);

describe('reduceTest', () => {
  it('walks mode → setup → question → result', () => {
    let state = play(INITIAL_STATE, { type: 'chooseMode', mode: 'level' }, { type: 'chooseOption', choice: 0 }, { type: 'start' });
    expect(state).toEqual({ step: 'question', mode: 'level', choice: 0, answers: [] });
    expect(currentQuestion(state)).toBe(YOUNG[0]);
    for (let index = 0; index < 11; index++) state = reduceTest(state, { type: 'answer', option: 0 });
    expect(state.step).toBe('question');
    state = reduceTest(state, { type: 'answer', option: 2 });
    expect(state.step).toBe('result');
    expect(state.step === 'result' && state.answers).toHaveLength(12);
  });

  it('does not start without a choice', () => {
    const setup = play(INITIAL_STATE, { type: 'chooseMode', mode: 'exam' });
    expect(reduceTest(setup, { type: 'start' })).toBe(setup);
  });

  it('ignores choices outside the list and invalid answers', () => {
    const setup = play(INITIAL_STATE, { type: 'chooseMode', mode: 'exam' });
    expect(reduceTest(setup, { type: 'chooseOption', choice: 4 })).toBe(setup);
    const question = play(setup, { type: 'chooseOption', choice: 1 }, { type: 'start' });
    expect(reduceTest(question, { type: 'answer', option: 3 })).toBe(question);
  });

  it('ignores actions that do not belong to the current step', () => {
    expect(reduceTest(INITIAL_STATE, { type: 'answer', option: 0 })).toBe(INITIAL_STATE);
    expect(reduceTest(INITIAL_STATE, { type: 'start' })).toBe(INITIAL_STATE);
  });

  it('goes back from setup to mode and restarts from anywhere', () => {
    const setup = play(INITIAL_STATE, { type: 'chooseMode', mode: 'level' });
    expect(reduceTest(setup, { type: 'back' })).toEqual(INITIAL_STATE);
    const question = play(setup, { type: 'chooseOption', choice: 2 }, { type: 'start' });
    expect(reduceTest(question, { type: 'restart' })).toEqual(INITIAL_STATE);
  });
});

describe('reduceTest no-ops keep the same reference', () => {
  const resultState = () => {
    let state = play(INITIAL_STATE, { type: 'chooseMode', mode: 'level' }, { type: 'chooseOption', choice: 0 }, { type: 'start' });
    for (let index = 0; index < 12; index++) state = reduceTest(state, { type: 'answer', option: 0 });
    return state;
  };

  it('answer on a result state changes nothing and never grows past 12 answers', () => {
    const result = resultState();
    expect(result.step).toBe('result');
    expect(reduceTest(result, { type: 'answer', option: 0 })).toBe(result);
  });

  it('restart on mode returns INITIAL_STATE by reference', () => {
    expect(reduceTest(INITIAL_STATE, { type: 'restart' })).toBe(INITIAL_STATE);
  });

  it('restart from result returns to mode', () => {
    expect(reduceTest(resultState(), { type: 'restart' })).toBe(INITIAL_STATE);
  });

  it('back is a no-op in question and result', () => {
    const question = play(INITIAL_STATE, { type: 'chooseMode', mode: 'level' }, { type: 'chooseOption', choice: 0 }, { type: 'start' });
    expect(reduceTest(question, { type: 'back' })).toBe(question);
    const result = resultState();
    expect(reduceTest(result, { type: 'back' })).toBe(result);
  });

  it('chooseMode outside the mode step is ignored', () => {
    const setup = play(INITIAL_STATE, { type: 'chooseMode', mode: 'level' });
    expect(reduceTest(setup, { type: 'chooseMode', mode: 'exam' })).toBe(setup);
    const question = play(setup, { type: 'chooseOption', choice: 0 }, { type: 'start' });
    expect(reduceTest(question, { type: 'chooseMode', mode: 'exam' })).toBe(question);
  });
});

describe('emaLine', () => {
  it('follows the design per step', () => {
    expect(emaLine(INITIAL_STATE, '')).toBe('Hei, eu sunt Ema! Alege testul și începem.');
    const setup = reduceTest(INITIAL_STATE, { type: 'chooseMode', mode: 'level' });
    expect(emaLine(setup, '')).toBe('Alege și începem! La final primești o diplomă.');
  });

  it('greets the first question, then encourages, and explains audio', () => {
    let state = play(INITIAL_STATE, { type: 'chooseMode', mode: 'level' }, { type: 'chooseOption', choice: 0 }, { type: 'start' });
    expect(emaLine(state, '')).toBe('Hai să începem! Alege răspunsul potrivit.');
    state = reduceTest(state, { type: 'answer', option: 0 });
    expect(emaLine(state, '')).toBe('Super! Mergem mai departe.');
    state = reduceTest(state, { type: 'answer', option: 0 });
    expect(currentQuestion(state)?.kind).toBe('audio');
    expect(emaLine(state, '')).toBe('Apasă „Ascultă din nou” și alege ce ai auzit.');
  });

  it('asks for the name, then congratulates by name on the result', () => {
    let state = play(INITIAL_STATE, { type: 'chooseMode', mode: 'level' }, { type: 'chooseOption', choice: 0 }, { type: 'start' });
    for (let index = 0; index < 12; index++) state = reduceTest(state, { type: 'answer', option: 0 });
    expect(emaLine(state, '  ')).toBe('Bravo! Scrie numele tău ca să-ți pregătesc diploma.');
    expect(emaLine(state, ' Ana ')).toBe('Bravo, Ana! Diploma ta e gata de descărcat.');
  });
});
