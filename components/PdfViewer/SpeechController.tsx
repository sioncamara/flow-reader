import { useCallback, useEffect, useRef } from "react"
import { useRemoteStore } from "@/store/useRemoteStore"
import { useSpeech, useVoices } from "react-text-to-speech"

const SpeechController: React.FC = () => {
  const {
    readingPageIndex,
    currTextPageIndex,
    isPaused,
    isPlaying,
    rate,
    lang,
    voiceURI,
    combinedText,
    charIndexToNodeMap,
    listRef,
    setReachedUtteranceEnd,
    setReadingPageIndex,
    setIsPaused,
    setIsPlaying,
    setRate,
    setLang,
    setVoiceURI,
  } = useRemoteStore()
  const { languages, voices } = useVoices()

  const lastHighlightedWord = useRef<HTMLElement | null>(null)
  const currentCharIndexRef = useRef<number>(0)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const currentWordIndexRef = useRef<number>(0)

  const { start, stop } = useSpeech({
    text: combinedText,
    lang,
    voiceURI,
    rate,
    onStart: (event) => {
      console.log("Speech Started:", event)
      utteranceRef.current = event.utterance
    },
    onBoundary: (event) => {
      if (event.name === "word") {
        // console.log("event:", event)

        currentCharIndexRef.current = event.charIndex
        const currentWord = event.utterance.text.slice(
          event.charIndex,
          event.charIndex + event.charLength,
        )
        // console.log("currentWord:", currentWord)
        // console.log("event.charIndex:", event.charIndex)
        
        highlightCurrentWord(currentWord, event.charIndex)
        const isLastWord =
          event.charIndex + event.charLength >= event.utterance.text.length - 1

        // console.log('word end position:', event.charIndex + event.charLength);
        // console.log('text length:', event.utterance.text.length);

        // console.log("isLastWord:", isLastWord)
        if (isLastWord) {
        // since this function is passed to a hook, the value of state variables at the time of fn pass will
        // be the same as the value at the time of fn execution even if store value updates through other means
        // this means readingPageIndex will be the same as currTextPageIndex at the time of fn execution

        // if a user has not scrolled to the next page, then readingPageIndex needs to be updated
        // if user has already scrolled, then incrementing it by one has no effect since the value is being set to it's
        // current store value, which was set when the user scrolled to the next page, so no side effect will occure

            setTimeout(() => {
              setReadingPageIndex(readingPageIndex + 1) // only triggers side effect if user did not bring next page into view
              setReachedUtteranceEnd(true)
            }, 500) // 500ms delay to allow the utterance to finish before starting the next one (bit of a hack, but get's the job done for now)
        }

       
    }
    },
    onError: (error) => {
      console.error("Speech synthesis error:", error)
      setIsPaused(false)
    },
    onStop: (event) => {
      console.log("Speech Stopped:", event)
      setIsPaused(false)
    },
  })

  useEffect(() => {
    console.log("side effect triggered from currTextPageIndex being updated?")

    if (currTextPageIndex === readingPageIndex && isPlaying) {
      handlePlay()
      listRef?.scrollToItem(currTextPageIndex, 'start')
      setReachedUtteranceEnd(false) // not sure if there is a point to this. Think there is it was just also being done within handlePlay. Makes more sense here.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currTextPageIndex])

  // bug: if user scrolls far enough from current page, and comes back highlighting will stop despite everying looking right
  // my guess is that the auto list re-renders...nah that doesn't make much sense since the use effect should re-trigger.
  // I'd say not worth the time unless users are complaining about it.
  const highlightCurrentWord = useCallback(
    
    (word: string, charIndex: number) => {
    //   console.log('charIndex:', charIndex);
    //   console.log('word:', word);
    //   console.log('charIndexToNodeMap:', charIndexToNodeMap);
      if (charIndexToNodeMap) {
        if (lastHighlightedWord.current) {
            
            
          try {
            lastHighlightedWord.current.outerHTML =
              lastHighlightedWord.current.innerHTML
          } catch (error) {
            console.log(
              "appears that there is an issue with the reference getting updated properly",
            )
          }
        }

        const { node, localIndex } = charIndexToNodeMap[charIndex]
        const localWord = node.textContent!.slice(
          localIndex,
          localIndex + word.length,
        )

        if (localWord === word) {
            console.log('word matches');
          const range = document.createRange()
          range.setStart(node.firstChild!, localIndex)
          range.setEnd(node.firstChild!, localIndex + word.length)
          const highlightSpan = document.createElement("mark")
          range.surroundContents(highlightSpan)
          lastHighlightedWord.current = highlightSpan
        }
      }
    },
    [charIndexToNodeMap],
  )

  const handlePlay = () => {
    if (isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
    } else {
      window.speechSynthesis.cancel()
      start()
    }
    setIsPlaying(true)
  }

  const handlePause = () => {
    window.speechSynthesis.pause()
    setIsPaused(true)
    setIsPlaying(false)
  }

  const handleStop = () => {
    // stop()

    window.speechSynthesis.cancel()
    setIsPlaying(false)
  }

  const handleRateChange = (newRate: number) => {
    if (utteranceRef.current && window.speechSynthesis.speaking) {
      const currentIndex = currentWordIndexRef.current
      window.speechSynthesis.cancel()
      const newUtterance = createUtterance(combinedText, currentIndex)
      utteranceRef.current = newUtterance
      window.speechSynthesis.speak(newUtterance)
    }
    setRate(newRate)
  }

  const changeVoice = (newVoiceURI: string) => {
    if (utteranceRef.current && window.speechSynthesis.speaking) {
      const currentIndex = currentWordIndexRef.current
      window.speechSynthesis.cancel()
      const newUtterance = createUtterance(
        combinedText,
        currentIndex,
        newVoiceURI,
      )
      utteranceRef.current = newUtterance
      window.speechSynthesis.speak(newUtterance)
    }
    setVoiceURI(newVoiceURI)
  }

  const createUtterance = (
    text: string,
    startIndex: number,
    newVoiceURI?: string,
  ) => {
    const utterance = new SpeechSynthesisUtterance(text.slice(startIndex))
    utterance.lang = lang
    utterance.voice =
      voices.find((voice) => voice.name === (newVoiceURI || voiceURI)) || null
    utterance.rate = rate

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        currentWordIndexRef.current = startIndex + event.charIndex
      }
    }

    return utterance
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex flex-auto -translate-x-1/2 transform gap-3 rounded-lg bg-white p-2 shadow-md">
      <button onClick={handlePlay}>{isPaused ? "Resume" : "Play"}</button>
      <button onClick={handlePause}>Pause</button>
      <button onClick={handleStop}>Stop</button>
      <div className="flex flex-col items-center">
        <label htmlFor="rate-slider" className="text-sm">
          Rate: {rate.toFixed(1)}
        </label>
        <input
          id="rate-slider"
          type="range"
          min="0.5"
          max="10"
          step="0.1"
          value={rate}
          onChange={(e) => handleRateChange(parseFloat(e.target.value))}
          className="w-32"
        />
      </div>
      <select value={lang} onChange={(e) => setLang(e.target.value)}>
        <option value="">Choose a language</option>
        {languages.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
      <select value={voiceURI} onChange={(e) => setVoiceURI(e.target.value)}>
        <option value="">Choose a voice</option>
        {voices
          .filter((voice) => !lang || voice.lang === lang)
          .map((voice) => (
            <option
              key={`${voice.voiceURI}-${voice.lang}-${voice.default}`}
              value={voice.name}
            >
              {voice.name} ({voice.lang})
            </option>
          ))}
      </select>
    </div>
  )
}

export default SpeechController
