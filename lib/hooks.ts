import { useEffect, useState } from "react";

export function useVoices() {
    const [languages, setLanguages] = useState<string[]>([]);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
    function setData(voices: SpeechSynthesisVoice[]) {
      setLanguages(Array.from(new Set(voices.map(({ lang }) => lang))));
      setVoices(voices);
    }
  
    useEffect(() => {
      const synth = window.speechSynthesis;
      if (!synth) return;
      const voices = synth.getVoices();
      if (voices.length) setData(voices);
      else {
        const onVoicesChanged = () => setData(synth.getVoices());
        synth.addEventListener("voiceschanged", onVoicesChanged);
        return () => synth.removeEventListener("voiceschanged", onVoicesChanged);
      }
    }, []);
  
    return { languages, voices };
  }