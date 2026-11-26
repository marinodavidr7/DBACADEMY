import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

function mapSpeechError(errorCode: string): string {
  switch (errorCode) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Permiso de micrófono denegado. Habilita el acceso al micrófono en tu navegador para dictar notas.';
    case 'audio-capture':
      return 'No se detectó ningún micrófono disponible en este dispositivo.';
    case 'no-speech':
      return 'No se detectó voz. Intenta hablar más cerca del micrófono.';
    case 'network':
      return 'Error de red al procesar el reconocimiento de voz. Verifica tu conexión.';
    case 'aborted':
      return '';
    default:
      return 'No se pudo continuar con el dictado por voz. Intenta de nuevo.';
  }
}

export interface UseSpeechDictationOptions {
  initialLang?: string;
  onFinalTranscript: (transcript: string) => void;
}

export function useSpeechDictation({
  initialLang = 'es-DO',
  onFinalTranscript,
}: UseSpeechDictationOptions) {
  const [isSupported] = useState<boolean>(() => Boolean(getSpeechRecognitionConstructor()));
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [speechLang, setSpeechLang] = useState<string>(initialLang);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onFinalRef = useRef(onFinalTranscript);
  onFinalRef.current = onFinalTranscript;
  const manualStopRef = useRef(false);

  const cleanupRecognition = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      rec.onstart = null;
      rec.onend = null;
      rec.onerror = null;
      rec.onresult = null;
      try {
        rec.abort();
      } catch {
        // Ignore abort errors during cleanup
      }
      recognitionRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    manualStopRef.current = true;
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        cleanupRecognition();
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, [cleanupRecognition]);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) {
      setError('Tu navegador no soporta la API de dictado por voz (Web Speech API).');
      return;
    }

    cleanupRecognition();
    manualStopRef.current = false;
    setError(null);
    setInterimTranscript('');

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = speechLang;

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event: SpeechRecognitionEventLike) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) {
          finalChunk += text;
        } else {
          interimChunk += text;
        }
      }
      setInterimTranscript(interimChunk.trim());
      if (finalChunk.trim()) {
        onFinalRef.current(finalChunk.trim());
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEventLike) => {
      const msg = mapSpeechError(event.error);
      if (msg) {
        setError(msg);
      }
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'audio-capture') {
        setIsListening(false);
        setInterimTranscript('');
      }
    };

    rec.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      recognitionRef.current = null;
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      setError('No se pudo iniciar el micrófono. Verifica que no esté en uso por otra pestaña.');
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [cleanupRecognition, speechLang]);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    return () => {
      cleanupRecognition();
    };
  }, [cleanupRecognition]);

  return {
    isSupported,
    isListening,
    interimTranscript,
    error,
    speechLang,
    setSpeechLang,
    start,
    stop,
    toggle,
    clearError,
  };
}
