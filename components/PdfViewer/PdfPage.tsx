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

const PdfPage: React.FC<PDFPageProps> = ({ index, width, style }) => {
  const remoteState = useRemoteStore((state) => state.remoteState)
  const [textLayer, setTextLayer] = useState<Element | null>(null)
  const [textNodes, setTextNodes] = useState<Element[]>([])
  const [charIndexToNodeMap, setCharIndexToNodeMap] = useState<{
    [key: number]: { node: Element; localIndex: number }
  } | null>(null)

  const [combinedText, setCombinedText] = useState<string>("")
  const { languages, voices } = useVoices()
  const [lang, setLang] = useState("en-US")
  const [voiceURI, setVoiceURI] = useState(
    "Microsoft Guy Online (Natural) - English (United States)",
  )
  const [isPaused, setIsPaused] = useState(false)
  const [rate, setRate] = useState(2.4)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const currentWordIndexRef = useRef(0)

  const pageRef = useRef<HTMLDivElement | null>(
    null,
  ) as React.MutableRefObject<HTMLDivElement | null>
  const lastHighlightedWord = useRef<HTMLElement | null>(null)
  const textContentRef = useRef<string>("")
  const currentCharIndexRef = useRef<number>(0)

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
      }
    },
    onError: (error) => {
      console.error("Speech synthesis error:", error)
      setIsPaused(false)

      // if (utteranceRef.current && window.speechSynthesis.speaking) {
      //   const currentIndex = currentWordIndexRef.current
      //   window.speechSynthesis.cancel()

      //   const newUtterance = createUtterance(combinedText, currentIndex)
      //   utteranceRef.current = newUtterance

      //   window.speechSynthesis.speak(newUtterance)

      //   console.log(
      //     "Speech synthesis encountered an error. Attempting to resume...",
      //   )
      // } else {
      //   setIsPaused(false)
      //   console.log("Speech synthesis encountered an error and has stopped.")
      // }
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

  const loadTextNodes = () => {
    if (pageRef.current) {
      const textLayer = pageRef.current.querySelector(".textLayer")
      setTextLayer(textLayer)

      console.log("textLayer:", textLayer)
      // if (textLayer) {
      //   const nodes = Array.from(
      //     textLayer.querySelectorAll('span[role="presentation"]'),
      //   )
      //   console.log("nodes:", nodes)
      //   setTextNodes(nodes)
      // }
    }
  }

  useEffect(() => {
    if (textLayer) {
      const nodes = Array.from(
        textLayer.querySelectorAll('span[role="presentation"]'),
      )
      console.log("nodes:", nodes)

      // Preprocess nodes to create a mapping of character indices to nodes
      const charIndexToNodeMap: {
        [key: number]: { node: Element; localIndex: number }
      } = {}
      let accumulatedLength = 0

      nodes.forEach((node, i) => {
        const nodeText = node.textContent || ""
        for (let j = 0; j < nodeText.length; j++) {
          charIndexToNodeMap[accumulatedLength + j] = { node, localIndex: j }
        }
        accumulatedLength += nodeText.length + 1 // +1 for space between nodes
      })

      setCharIndexToNodeMap(charIndexToNodeMap)
    }
  }, [textLayer])

  const highlightCurrentWord = useCallback(
    (word: string, charIndex: number) => {
      if (charIndexToNodeMap) {
        if (lastHighlightedWord.current) {
          lastHighlightedWord.current.outerHTML =
            lastHighlightedWord.current.innerHTML
        }

        const { node, localIndex } = charIndexToNodeMap[charIndex]
        const localWord = node.textContent!.slice(
          localIndex,
          localIndex + word.length,
        )

        if (localWord === word) {
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

  const getTextContent = (textContent: TextContent) => {
    // console.log("textContent:", textContent)
    const fullText = textContent.items
      .filter((item): item is TextItem => "str" in item && item.str !== "")
      .map((item) => item.str)
      .join(" ")

    // console.log("fullText:", fullText)

    textContentRef.current = fullText
    setCombinedText(fullText)

    // const sentenceRegex = /[^.!?]+(?:[.!?]+|$)/g
    // const sentences = fullText.match(sentenceRegex) || []
    // const trimmedSentences = sentences.map((sentence) => sentence.trim())
    // const nonEmptySentences = trimmedSentences.filter(
    //   (sentence) => sentence.length > 0,
    // )

    // console.log("nonEmptySentences:", nonEmptySentences)

    // setSentences(nonEmptySentences)
  }

  return (
    <div
      ref={pageRef}
      className={` ${index !== 0 && "border-t-[16px]"} border-t-slate-200/40`}
      style={style}
    >
      <Page
        pageNumber={index + 1}
        width={width - 16}
        onGetTextSuccess={getTextContent}
        onRenderSuccess={() => {
          hideRepeateText()
          combineNestedSpans()
          handleHyphenatedWords()
          combineSpans()
          if (textLayer === null) {
            loadTextNodes()
          }
        }}
        onError={() => "An error occurred in the Page component"}
        onGetStructTreeError={(error) =>
          "An error occurred in the Page component: " + error
        }
      />
      <div>Remote State: {remoteState ? "On" : "Off"}</div>
      <div className="absolute left-0 top-0 z-50 flex flex-col gap-2 bg-white p-2">
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
            } else {
              window.speechSynthesis.cancel()
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
        <button onClick={stop}>Stop</button>
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

export default React.memo(PdfPage)
