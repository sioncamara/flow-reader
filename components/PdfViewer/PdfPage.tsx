import React, { useCallback, useEffect, useState, useRef } from "react"
import { Page } from "react-pdf"
import { CSSProperties } from "react"
import {
  combineNestedSpans,
  combineSpans,
  handleHyphenatedWords,
  hideRepeateText,
} from "@/lib/utils"
import { useRemoteStore } from "@/store/useRemoteStore"
import { TextContent, TextItem } from "pdfjs-dist/types/src/display/api"
import { useSpeech, useVoices } from "react-text-to-speech"

type PDFPageProps = {
  index: number
  width: number
  style: CSSProperties
}

const highlightPattern = (text: string, pattern: string) => {
  // console.log("text:", text);
  return text.replace(pattern, (value: any) => `<mark>${value}</mark>`)
}

const PdfPage: React.FC<PDFPageProps> = ({ index, width, style }) => {
  const remoteState = useRemoteStore((state) => state.remoteState)
  const [searchText, setSearchText] = useState("")
  const [sentences, setSentences] = useState<string[]>([])
  const [combinedText, setCombinedText] = useState<string>("")
  const { languages, voices } = useVoices()
  const [lang, setLang] = useState("en-US")
  const [voiceURI, setVoiceURI] = useState(
    "Microsoft Guy Online (Natural) - English (United States)",
  )
  const [isPaused, setIsPaused] = useState(false)
  const [rate, setRate] = useState(1.5)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const currentWordIndexRef = useRef(0)

  const textRenderer = useCallback((props: any) => {
    // console.log("customTextRenderer props:", props);
    return highlightPattern(props.str, searchText);
  }, [searchText]);

  function onChange(event: {
    target: { value: React.SetStateAction<string> }
  }) {
    setSearchText(event.target.value)
  }

  const { start } = useSpeech({
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
        currentWordIndexRef.current = event.charIndex
      }
    },
    onError: (error) => {
      console.error("Speech synthesis error:", error)

      if (utteranceRef.current && window.speechSynthesis.speaking) {
        const currentIndex = currentWordIndexRef.current
        window.speechSynthesis.cancel()

        const newUtterance = createUtterance(combinedText, currentIndex)
        utteranceRef.current = newUtterance

        window.speechSynthesis.speak(newUtterance)

        console.log(
          "Speech synthesis encountered an error. Attempting to resume...",
        )
      } else {
        setIsPaused(false)
        console.log("Speech synthesis encountered an error and has stopped.")
      }
    },
    onResume: (event) => {
      console.log("Speech Resumed:", event)
    },
    onPause: (event) => {
      console.log("Speech Paused:", event)
    },
    onStop: (event) => {
      console.log("Speech Stopped:", event)
      setIsPaused(false)
    },
    onQueueChange: (queue) => {
      console.log("Queue updated:", queue)
    },
  })

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

  const changeRate = (newRate: number) => {
    if (utteranceRef.current && window.speechSynthesis.speaking) {
      const currentIndex = currentWordIndexRef.current
      window.speechSynthesis.cancel()
      const newUtterance = createUtterance(combinedText, currentIndex)
      utteranceRef.current = newUtterance
      window.speechSynthesis.speak(newUtterance)
    }
    setRate(newRate)
  }

  const increaseRate = () => {
    const newRate = Math.min(rate + 1, 10)
    changeRate(newRate)
  }

  const handleStartReading = useCallback(() => {
    const status = getSpeechStatus()
    console.log("Speech status:", status)

    if (status.paused) {
      window.speechSynthesis.cancel() // Clear any paused speech
    }

    if (status.speaking || status.pending) {
      window.speechSynthesis.cancel() // Stop any ongoing speech
    }

    const combinedText = sentences.join(" ")
    setCombinedText(combinedText)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentences])

  const getSpeechStatus = () => {
    return {
      speaking: window.speechSynthesis.speaking,
      pending: window.speechSynthesis.pending,
      paused: window.speechSynthesis.paused,
    }
  }

  useEffect(() => {
    if (combinedText) {
      start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinedText])

  return (
    <div
      className={` ${index !== 0 && "border-t-[16px]"} border-t-slate-200/40`}
      style={style}
    >
      <Page
        pageNumber={index + 1}
        width={width - 16}
        customTextRenderer={ textRenderer}
        onGetTextSuccess={(textContent: TextContent) => {
          const fullText = textContent.items
            .filter((item): item is TextItem => "str" in item)
            .map((item) => item.str)
            .join(" ")

          const sentenceRegex = /[^.!?]+(?:[.!?]+|$)/g
          const sentences = fullText.match(sentenceRegex) || []
          const trimmedSentences = sentences.map((sentence) => sentence.trim())
          const nonEmptySentences = trimmedSentences.filter(
            (sentence) => sentence.length > 0,
          )

          setSentences(nonEmptySentences)
        }}
        onRenderSuccess={() => {
          hideRepeateText()
          combineNestedSpans()
          handleHyphenatedWords()
          combineSpans()
        }}
        onError={() => "An error occurred in the Page component"}
        onGetStructTreeError={(error) =>
          "An error occurred in the Page component: " + error
        }
      />
      <div>Remote State: {remoteState ? "On" : "Off"}</div>
      <div className="absolute left-0 top-0 z-50 flex flex-col gap-2 bg-white p-2">
        <div>
          <label htmlFor="search" className="mr-2">
            Search:
          </label>
          <input
            type="search"
            id="search"
            value={searchText}
            onChange={onChange}
          />
        </div>

        <div>
          <label htmlFor="lang" className="mr-2">
            Language:
          </label>
          <select
            id="lang"
            value={lang}
            onChange={(e) => {
              setLang(e.target.value)
              setVoiceURI("")
            }}
          >
            <option value="">Choose a language</option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="voice" className="mr-2">
            Voice:
          </label>
          <select
            id="voice"
            value={voiceURI}
            onChange={(e) => {
              console.log("e.target.value:", e.target.value)
              changeVoice(e.target.value)
            }}
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
      </div>
      <div className="absolute left-1/2 top-0 z-50 flex flex-auto gap-3 bg-white p-2">
        <button
          onClick={() => {
            if (isPaused) {
              window.speechSynthesis.resume()
              console.log("is paused case")

              setIsPaused(false)
            } else if (combinedText === "") {
              handleStartReading()
              console.log("handleStartReading case")
            } else {
              start()
              console.log("start case")
            }
          }}
        >
          Play
        </button>
        <button
          onClick={() => {
            window.speechSynthesis.pause()
            setIsPaused(true)
          }}
        >
          Pause
        </button>
        <button onClick={increaseRate}>Increase Rate</button>
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
            onChange={(e) => changeRate(parseFloat(e.target.value))}
            className="w-32"
          />
        </div>
      </div>
    </div>
  )
}

export default PdfPage
