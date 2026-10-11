import { currentQuestion, type TestState } from './test-session';

export function emaLine(state: TestState, childName: string): string {
  switch (state.step) {
    case 'mode':
      return 'Hei, eu sunt Ema! Alege testul și începem.';
    case 'setup':
      return 'Alege și începem! La final primești o diplomă.';
    case 'question':
      if (currentQuestion(state)?.kind === 'audio') return 'Apasă „Ascultă din nou” și alege ce ai auzit.';
      return state.answers.length === 0 ? 'Hai să începem! Alege răspunsul potrivit.' : 'Super! Mergem mai departe.';
    case 'result': {
      const name = childName.trim().replace(/\s+/g, ' ');
      return name ? `Bravo, ${name}! Diploma ta e gata de descărcat.` : 'Bravo! Scrie numele tău ca să-ți pregătesc diploma.';
    }
  }
}
