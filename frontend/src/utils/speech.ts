export const canUseSpeechSynthesis = () =>
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  typeof SpeechSynthesisUtterance !== 'undefined';

export const speakText = (text: string) => {
  if (!canUseSpeechSynthesis() || !text.trim()) {
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
  return true;
};

export const stopSpeech = () => {
  if (canUseSpeechSynthesis()) {
    window.speechSynthesis.cancel();
  }
};
