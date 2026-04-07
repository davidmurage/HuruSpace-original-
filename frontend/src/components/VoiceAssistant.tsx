import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { canUseSpeechSynthesis, speakText, stopSpeech } from '../utils/speech';

interface SpeechRecognitionResultLike {
  transcript: string;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface VoiceAssistantProps {
  title: string;
  description: string;
  commandExamples: string[];
  onCommand: (command: string) => Promise<string | void> | string | void;
  getSummary?: () => string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  title,
  description,
  commandExamples,
  onCommand,
  getSummary,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('Ready');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const recognitionConstructor = useMemo(
    () =>
      typeof window === 'undefined'
        ? undefined
        : window.SpeechRecognition || window.webkitSpeechRecognition,
    []
  );

  const canSpeak = canUseSpeechSynthesis();

  const speak = (text: string) => {
    if (!canSpeak || !text) {
      return;
    }

    speakText(text);
  };

  const stopAll = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    stopSpeech();
  };

  const startListening = () => {
    if (!recognitionConstructor) {
      setStatus('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new recognitionConstructor();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = async (event) => {
      const nextTranscript = Array.from(event.results)
        .slice(event.resultIndex)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim();

      setTranscript(nextTranscript);
      setStatus('Processing command...');

      try {
        const response = await onCommand(nextTranscript);
        const spokenResponse = response || `Heard: ${nextTranscript}`;
        setStatus(spokenResponse);
        speak(spokenResponse);
      } catch (error) {
        console.error('Voice assistant command error:', error);
        setStatus('I could not complete that voice command.');
      }
    };

    recognition.onerror = () => {
      setStatus('Voice command failed. Please try again.');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
    setStatus('Listening...');
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      stopSpeech();
    };
  }, []);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={isListening ? stopAll : startListening}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold ${
            isListening
              ? 'bg-red-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          {isListening ? 'Stop listening' : 'Start voice command'}
        </button>

        {getSummary && (
          <button
            type="button"
            onClick={() => speak(getSummary())}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            <Volume2 size={16} />
            Read aloud
          </button>
        )}

        {canSpeak && (
          <button
            type="button"
            onClick={stopSpeech}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            <VolumeX size={16} />
            Stop audio
          </button>
        )}
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
        <div className="font-semibold text-slate-900">Status</div>
        <div className="mt-1">{status}</div>
        {transcript && (
          <div className="mt-3 text-xs text-slate-500">
            Last command: "{transcript}"
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Try saying
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {commandExamples.map((example) => (
            <span
              key={example}
              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
            >
              {example}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VoiceAssistant;
