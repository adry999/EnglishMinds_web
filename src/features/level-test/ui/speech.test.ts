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

  it('calls back when the utterance errors and cancels on demand', () => {
    const cancel = vi.fn();
    const utterances: { onerror?: (event: { error: string }) => void }[] = [];
    const win = {
      speechSynthesis: { cancel, speak: (u: { onerror?: (event: { error: string }) => void }) => utterances.push(u) },
      SpeechSynthesisUtterance: class {},
    } as unknown as Window;
    const onError = vi.fn();
    const speech = createSpeech(win);
    speech.speak('cat', onError);
    utterances[0]!.onerror!({ error: 'interrupted' });
    utterances[0]!.onerror!({ error: 'canceled' });
    expect(onError).not.toHaveBeenCalled();
    utterances[0]!.onerror!({ error: 'synthesis-failed' });
    expect(onError).toHaveBeenCalledTimes(1);
    cancel.mockClear();
    speech.cancel();
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('reports a failure to speak by returning false', () => {
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
  });
});
