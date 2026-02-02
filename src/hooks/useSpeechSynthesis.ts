import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    // Load voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text: string, gender: 'male' | 'female' = 'female', onEnd?: () => void) => {
    if (!isSupported) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find a suitable voice based on gender
    const preferredVoices = voices.filter(v => {
      const name = v.name.toLowerCase();
      if (gender === 'female') {
        return name.includes('female') || name.includes('samantha') || 
               name.includes('victoria') || name.includes('karen') ||
               name.includes('moira') || name.includes('tessa') ||
               name.includes('fiona') || name.includes('google uk english female');
      } else {
        return name.includes('male') || name.includes('daniel') || 
               name.includes('alex') || name.includes('fred') ||
               name.includes('thomas') || name.includes('google uk english male');
      }
    });

    // Use preferred voice or first available
    if (preferredVoices.length > 0) {
      utterance.voice = preferredVoices[0];
    } else if (voices.length > 0) {
      // Try to find any English voice
      const englishVoice = voices.find(v => v.lang.startsWith('en'));
      if (englishVoice) utterance.voice = englishVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = gender === 'female' ? 1.1 : 0.9;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, voices]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    voices,
  };
}
