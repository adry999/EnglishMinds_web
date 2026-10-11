export type Speech = {
  readonly available: boolean;
  speak(text: string, onError?: () => void): boolean;
  cancel(): void;
};

type SpeechWindow = Window & { SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance };

export function createSpeech(win: Window): Speech {
  const speechWindow = win as SpeechWindow;
  const synth = speechWindow.speechSynthesis;
  const Utterance = speechWindow.SpeechSynthesisUtterance;
  const available = Boolean(synth && Utterance);
  return {
    available,
    speak(text, onError) {
      if (!synth || !Utterance) return false;
      try {
        const utterance = new Utterance(text);
        utterance.lang = 'en-GB';
        utterance.rate = 0.85;
        if (onError) {
          utterance.onerror = (event) => {
            if (event.error !== 'interrupted' && event.error !== 'canceled') onError();
          };
        }
        synth.cancel();
        synth.speak(utterance);
        return true;
      } catch (error) {
        console.warn('[level-test] speechSynthesis a eșuat', error);
        return false;
      }
    },
    cancel() {
      try {
        synth?.cancel();
      } catch (error) {
        console.warn('[level-test] speechSynthesis.cancel a eșuat', error);
      }
    },
  };
}
