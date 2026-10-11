export type Speech = {
  readonly available: boolean;
  speak(text: string): boolean;
};

type SpeechWindow = Window & { SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance };

export function createSpeech(win: Window): Speech {
  const speechWindow = win as SpeechWindow;
  const synth = speechWindow.speechSynthesis;
  const Utterance = speechWindow.SpeechSynthesisUtterance;
  const available = Boolean(synth && Utterance);
  return {
    available,
    speak(text) {
      if (!synth || !Utterance) return false;
      try {
        const utterance = new Utterance(text);
        utterance.lang = 'en-GB';
        utterance.rate = 0.85;
        synth.cancel();
        synth.speak(utterance);
        return true;
      } catch (error) {
        console.warn('[level-test] speechSynthesis a eșuat', error);
        return false;
      }
    },
  };
}
