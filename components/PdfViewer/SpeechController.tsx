import { useCallback, useEffect, useRef, useState } from "react"
import { useRemoteStore } from "@/store/useRemoteStore"
import { useSpeech, useVoices } from "react-text-to-speech"
import type { CharIndexToNodeMap } from "@/store/useRemoteStore"

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
    wordSelectedOnOtherPage,
    setWordSelectedOnOtherPage,
    setReachedUtteranceEnd,
    setReadingPageIndex,
    setIsPaused,
    setIsPlaying,
    setRate,
    setLang,
    setVoiceURI,
  } = useRemoteStore()
  const { languages, voices } = useVoices()

  const [tempRate, setTempRate] = useState(rate)
  const [startOffset, setStartOffset] = useState<number>(0)
  const [parentElement, setParentElement] = useState<HTMLElement | null>(null)
  const lastHighlightedWord = useRef<HTMLElement | null>(null)
  const currentCharIndexRef = useRef<number>(0)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const nextWordIndexRef = useRef<number>(0)

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
        nextWordIndexRef.current = event.charIndex + event.charLength

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
    if (wordSelectedOnOtherPage) {
      startSpeechFromDoubleClick(parentElement as HTMLElement, startOffset)
      setWordSelectedOnOtherPage(false)
    }
    nextWordIndexRef.current = 0
    if (currTextPageIndex === readingPageIndex && isPlaying) {
      handlePlay()
      listRef?.scrollToItem(currTextPageIndex, "start")
      setReachedUtteranceEnd(false) // not sure if there is a point to this. Think there is it was just also being done within handlePlay. Makes more sense here.
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currTextPageIndex])

  useEffect(() => {
    // need to handle how to get this to work when clicking on a page other than the current one being spoken. Don't think this is worth fixing, unless a
    // consistant user pain point.
    // different area, but there is also bugs for some text (hiphen cases as well as other word break down issues) think the function I previoulsy had will resolve most of these.
    const handleDoubleClick = () => {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const startContainer = range.startContainer

        if (
          startContainer.nodeType === Node.TEXT_NODE &&
          startContainer.parentNode
        ) {
          const parentElement = startContainer.parentNode as HTMLElement

          const startOffset = range.startOffset

          handleStop()
          if (isPlaying && readingPageIndex !== currTextPageIndex) {
            console.log("should not do anything right now")
            setParentElement(parentElement)
            setStartOffset(startOffset)
            setWordSelectedOnOtherPage(true)
          } else {
            startSpeechFromDoubleClick(parentElement, startOffset)
          }
        }
      }
    }

    document.addEventListener("dblclick", handleDoubleClick)

    return () => {
      document.removeEventListener("dblclick", handleDoubleClick)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charIndexToNodeMap, voiceURI, rate, readingPageIndex])

  // bug: if user scrolls far enough from current page, and comes back highlighting will stop despite everying looking right
  // my guess is that the auto list re-renders...nah that doesn't make much sense since the use effect should re-trigger.
  // I'd say not worth the time unless users are complaining about it.
  const highlightCurrentWord = useCallback(
    (word: string, charIndex: number) => {
      //   console.log('charIndex:', charIndex);
      //   console.log('word:', word);
      // console.log('charIndexToNodeMap:', charIndexToNodeMap);

      // there is a big with highlighting "Create a site map (for websites) or list of screens (for desktop apps)."
      // this is from start small and stay small chapter 3 3rd page (Building it heading)

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
          // console.log('word matches');
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

  const startSpeechFromDoubleClick = (
    parentElement: HTMLElement,
    startOffset: number,
  ) => {
    let globalCharIndex = 0
    for (const [index, node] of Object.entries(
      charIndexToNodeMap as CharIndexToNodeMap,
    )) {
      if (node.node === parentElement) {
        globalCharIndex = parseInt(index) + startOffset
        break
      }
    }
    currentCharIndexRef.current = globalCharIndex
    nextWordIndexRef.current = globalCharIndex
    const newUtterance = createUtterance(combinedText, globalCharIndex)
    utteranceRef.current = newUtterance
    window.speechSynthesis.speak(newUtterance)
    setIsPlaying(true)
  }

  const handlePlay = () => {
    if (isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
    } else {
      window.speechSynthesis.cancel()
      // start()
      const newUtterance = createUtterance(
        combinedText,
        nextWordIndexRef.current,
      )
      utteranceRef.current = newUtterance
      window.speechSynthesis.speak(newUtterance)
    }
    setIsPlaying(true)
  }

  const handlePause = () => {
    window.speechSynthesis.pause()
    setIsPaused(true)
    setIsPlaying(false)
  }

  const handleStop = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
  }

  const handleVoiceChange = (newVoiceURI: string) => {
    if (utteranceRef.current && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
      const newUtterance = createUtterance(
        combinedText,
        nextWordIndexRef.current,
        { voiceURI: newVoiceURI },
      )
      utteranceRef.current = newUtterance
      window.speechSynthesis.speak(newUtterance)
    }
    setVoiceURI(newVoiceURI)
  }

  const handleRateChangeEnd = () => {
    if (utteranceRef.current && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
      const newUtterance = createUtterance(
        combinedText,
        nextWordIndexRef.current,
        { rate: tempRate },
      )
      window.speechSynthesis.speak(newUtterance)
    }
    setRate(tempRate)
  }

  const createUtterance = (
    text: string,
    startIndex: number,
    options?: { rate?: number; voiceURI?: string },
  ) => {
    const utterance = new SpeechSynthesisUtterance(text.slice(startIndex))
    utterance.lang = lang
    utterance.voice =
      voices.find((voice) => voice.name === (options?.voiceURI || voiceURI)) ||
      null
    utterance.rate = options?.rate || rate

    utterance.onstart = (event) => {
      console.log("Speech Started:", event)
      utteranceRef.current = utterance
    }

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        currentCharIndexRef.current = startIndex + event.charIndex
        nextWordIndexRef.current =
          startIndex + event.charIndex + event.charLength

        const currentWord = utterance.text.slice(
          event.charIndex,
          event.charIndex + event.charLength,
        )

        highlightCurrentWord(currentWord, startIndex + event.charIndex)
        const isLastWord =
          event.charIndex + event.charLength >= utterance.text.length - 1

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
    }

    utterance.onerror = (error) => {
      console.error("Speech synthesis error:", error)
      setIsPaused(false)
    }

    utterance.onend = (event) => {
      console.log("Speech Stopped:", event)
      console.log("this is the end")

      setIsPaused(false)
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
          Rate: {tempRate.toFixed(1) || rate.toFixed(1)}
        </label>
        <input
          id="rate-slider"
          type="range"
          min="0.5"
          max="10"
          step="0.1"
          value={tempRate || rate}
          onChange={(e) => setTempRate(parseFloat(e.target.value))}
          onMouseUp={handleRateChangeEnd}
          onTouchEnd={handleRateChangeEnd}
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
      <select
        value={voiceURI}
        onChange={(e) => handleVoiceChange(e.target.value)}
      >
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
