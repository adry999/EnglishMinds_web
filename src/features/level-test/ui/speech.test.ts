import { describe, expect, it, vi } from 'vitest';
import { createSpeech } from './speech';

describe('createSpeech', () => {
  it('is unavailable without speechSynthesis', () => {
    const speech = createSpeech({} as Window);
    expect(speech.available).toBe(false);
    expect(speech.speak('cat')).toBe(false);
  });

  it('speaks British English slowly and cancels what was playing', () => {
    const spoken: { text: string; lang: string; rate: number }[] = [];
    const cancel = vi.fn();
    class Utterance {
      lang = '';
      rate = 1;
      constructor(public text: string) {}
    }
    const win = {
      speechSynthesis: { cancel, speak: (u: Utterance) => spoken.push({ text: u.text, lang: u.lang, rate: u.rate }) },
      SpeechSynthesisUtterance: Utterance,
    } as unknown as Window;
    expect(createSpeech(win).speak('cat')).toBe(true);
    expect(cancel).toHaveBeenCalled();
    expect(spoken).toEqual([{ text: 'cat', lang: 'en-GB', rate: 0.85 }]);
  });

  it('reports a failure instead of swallowing it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const win = {
      speechSynthesis: {
        cancel: () => undefined,
        speak: () => {
          throw new Error('no voice');
        },
      },
      SpeechSynthesisUtterance: class {},
    } as unknown as Window;
    expect(createSpeech(win).speak('cat')).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
