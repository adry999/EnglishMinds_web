import type { Question } from './types';
import { choiceLabels, selectBank, type Mode } from './select-bank';

export type TestState =
  | { readonly step: 'mode' }
  | { readonly step: 'setup'; readonly mode: Mode; readonly choice: number | null }
  | { readonly step: 'question'; readonly mode: Mode; readonly choice: number; readonly answers: readonly number[] }
  | { readonly step: 'result'; readonly mode: Mode; readonly choice: number; readonly answers: readonly number[] };

export type TestAction =
  | { readonly type: 'chooseMode'; readonly mode: Mode }
  | { readonly type: 'chooseOption'; readonly choice: number }
  | { readonly type: 'start' }
  | { readonly type: 'answer'; readonly option: number }
  | { readonly type: 'back' }
  | { readonly type: 'restart' };

export const INITIAL_STATE: TestState = { step: 'mode' };

export function reduceTest(state: TestState, action: TestAction): TestState {
  switch (action.type) {
    case 'restart':
      return state.step === 'mode' ? state : INITIAL_STATE;
    case 'chooseMode':
      return state.step === 'mode' ? { step: 'setup', mode: action.mode, choice: null } : state;
    case 'back':
      return state.step === 'setup' ? INITIAL_STATE : state;
    case 'chooseOption': {
      if (state.step !== 'setup') return state;
      const valid = Number.isInteger(action.choice) && action.choice >= 0 && action.choice < choiceLabels(state.mode).length;
      return valid ? { ...state, choice: action.choice } : state;
    }
    case 'start':
      if (state.step !== 'setup' || state.choice === null) return state;
      return { step: 'question', mode: state.mode, choice: state.choice, answers: [] };
    case 'answer': {
      if (state.step !== 'question' || ![0, 1, 2].includes(action.option)) return state;
      const answers = [...state.answers, action.option];
      const done = answers.length >= selectBank(state.mode, state.choice).length;
      return { step: done ? 'result' : 'question', mode: state.mode, choice: state.choice, answers };
    }
  }
}

export function currentQuestion(state: TestState): Question | null {
  if (state.step !== 'question') return null;
  return selectBank(state.mode, state.choice)[state.answers.length] ?? null;
}
