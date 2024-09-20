import { useCallback, useEffect, useRef, useState } from "react"
import { useRemoteStore } from "@/store/useRemoteStore"
import { useVoices } from "@/lib/hooks"
import type { CharIndexToNodeMap } from "@/store/useRemoteStore"
import { toast } from "../ui/use-toast"
import RateSlider from "./RateSlider"
import SelectVoice from "./SelectVoice"

type FixedSizeListState = {
  instance: any
  isScrolling: boolean
  scrollDirection: "forward" | "backward"
  scrollOffset: number
  scrollUpdateWasRequested: boolean
}

const SpeechController: React.FC = () => {
  const {
    readingPageIndex,
    currTextPageIndex,
    isPlaying,
    rate,
    lang,
    voiceName,
    combinedText,
    charIndexToNodeMap,
    listRef,
    wordSelectedOnOtherPage,
    setWordSelectedOnOtherPage,
    setReachedUtteranceEnd,
    setReadingPageIndex,
    setIsPlaying,
    setRate,
    setLang,
    setVoiceName,
  } = useRemoteStore()
  const { voices } = useVoices()

  const [tempRate, setTempRate] = useState(rate)
  const [startOffset, setStartOffset] = useState<number>(0)
  const [parentElement, setParentElement] = useState<HTMLElement | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [rotation, setRotation] = useState(0)

  const lastHighlightedWord = useRef<HTMLElement | null>(null)
  const currentCharIndexRef = useRef<number>(0)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const nextWordIndexRef = useRef<number>(0)
  const isScrollingRef = useRef(false)
  const speechControllerRef = useRef<HTMLDivElement>(null)

  const [showSlider, setShowSlider] = useState(false)
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    hoverTimerRef.current = setTimeout(() => {
      setShowSlider(true)
    }, 500)
  }

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
    }
    setShowSlider(false)
  }

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (wordSelectedOnOtherPage) {
      startSpeechFromDoubleClick(parentElement as HTMLElement, startOffset)
      setWordSelectedOnOtherPage(false)
    }
    nextWordIndexRef.current = 0
    if (currTextPageIndex === readingPageIndex && isPlaying) {
      handlePlay()
      smoothScrollToItem(currTextPageIndex)
      setReachedUtteranceEnd(false) // not sure if there is a point to this. Think there is it was just also being done within handlePlay. Makes more sense here.
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currTextPageIndex])

  useEffect(() => {
    const handleDoubleClick = (event: MouseEvent) => {
      console.log("speechControllerRef.current:", speechControllerRef.current)
      console.log("event?.target:", event?.target)
      console.log(
        "cointains target:",
        speechControllerRef.current?.contains(event?.target as Node),
      )

      if (
        speechControllerRef.current &&
        speechControllerRef.current.contains(event?.target as Node)
      ) {
        event?.stopPropagation()
        return
      }
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
            setParentElement(parentElement)
            setStartOffset(startOffset)
            setWordSelectedOnOtherPage(true)
          } else {
            startSpeechFromDoubleClick(parentElement, startOffset)
          }
        } else {
          handleStop()
        }
      }
    }

    document.addEventListener("dblclick", handleDoubleClick)

    return () => {
      document.removeEventListener("dblclick", handleDoubleClick)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charIndexToNodeMap, voiceName, rate, readingPageIndex])

  const startSpeechFromDoubleClick = (
    providedParentElement: HTMLElement,
    startOffset: number,
  ) => {
    console.log("startSpeechFromDoubleClick")
    let globalCharIndex = 0
    if (charIndexToNodeMap === null) {
      toast({
        title: "Hi there 👋",
        description: "I was loading, please try again.",
      })
      return
    }

    const resetHighlightedWord = () => {
      // only use after appropriate check
      lastHighlightedWord.current!.outerHTML =
        lastHighlightedWord.current!.innerHTML
      lastHighlightedWord.current = null
    }

    let parentElement = providedParentElement
    if (lastHighlightedWord.current) {
      try {
        if (
          lastHighlightedWord.current.parentElement &&
          parentElement?.textContent?.includes(
            lastHighlightedWord.current.innerHTML,
          )
        ) {
          parentElement = lastHighlightedWord.current.parentElement
          console.log("parent element set")
        }
        resetHighlightedWord()
      } catch (error) {
        console.log("Error within resetHighlightedWord")
      }
    }

    for (const [index, node] of Object.entries(
      charIndexToNodeMap as CharIndexToNodeMap,
    )) {
      if (node.node === parentElement) {
        // for bug for selecting word at current or after current within current node
        // console.log('there was a node match');

        // console.log('index:', index);
        // console.log('startOffset:', startOffset);
        // console.log('combinedIndex:', parseInt(index) + startOffset);

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
    window.speechSynthesis.cancel()

    const newUtterance = createUtterance(combinedText, nextWordIndexRef.current)
    utteranceRef.current = newUtterance
    window.speechSynthesis.speak(newUtterance)

    setIsPlaying(true)
  }

  const handleStop = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
  }

  const handleVoiceChange = (newVoiceName: string) => {
    if (utteranceRef.current && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
      const newUtterance = createUtterance(
        combinedText,
        nextWordIndexRef.current,
        { voiceName: newVoiceName },
      )
      utteranceRef.current = newUtterance
      window.speechSynthesis.speak(newUtterance)
    }
    setVoiceName(newVoiceName)
  }

  const handleRateChangeEnd = (newRate: number[]) => {
    const newRateValue = newRate[0]
    setTempRate(newRateValue)

    if (utteranceRef.current && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
      const newUtterance = createUtterance(
        combinedText,
        nextWordIndexRef.current,
        { rate: newRateValue },
      )
      window.speechSynthesis.speak(newUtterance)
    }
    setRate(newRateValue)
  }

  const createUtterance = (
    text: string,
    startIndex: number,
    options?: { rate?: number; voiceName?: string },
  ) => {
    const utterance = new SpeechSynthesisUtterance(text.slice(startIndex))
    utterance.lang = lang
    utterance.voice =
      voices.find(
        (voice) => voice.name === (options?.voiceName || voiceName),
      ) || null
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

        // console.log("(inside utterance.onboundary) currentWord:", currentWord)
        // console.log(
        //   "(inside utterance.onboundary) currentCharIndexRef.current:",
        //   currentCharIndexRef.current,
        // )
        // console.log(
        //   "inside utterance.onboundary) charIndexToNodeMap:",
        //   charIndexToNodeMap,
        // )

        highlightCurrentWord(currentWord, startIndex + event.charIndex)
      }
    }

    utterance.onerror = (error) => {
      console.error("Speech synthesis error:", error)
      if (error.error !== "interrupted" && error.error !== "canceled")
        setIsPlaying(false)
    }

    utterance.onend = (event) => {
      console.log("Speech Stopped:", event)
      console.log("this is the end")
      setReadingPageIndex(readingPageIndex + 1) // only triggers side effect if user did not bring next page into view
      setReachedUtteranceEnd(true)
    }

    return utterance
  }

  const scrollToHighlightedWord = useCallback((element: HTMLElement) => {
    if (!element || isScrollingRef.current) return

    const rect = element.getBoundingClientRect()
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight

    const scrollThreshold = viewportHeight * 0.85

    const isNearBottom = rect.bottom > scrollThreshold

    const isInViewport =
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)

    const textIsBelowLargeImage = rect.bottom <= 1.75 * viewportHeight

    if (isNearBottom && (isInViewport || textIsBelowLargeImage)) {
      isScrollingRef.current = true
      const scrollOptions: ScrollIntoViewOptions = {
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      }
      element.scrollIntoView(scrollOptions)
      setTimeout(() => {
        isScrollingRef.current = false
      }, 1000)
    }
  }, [])

  // bug: if user scrolls far enough from current page, and comes back highlighting will stop despite everying looking right
  // my guess is that the auto list re-renders...nah that doesn't make much sense since the use effect should re-trigger.
  // I'd say not worth the time unless users are complaining about it.
  const highlightCurrentWord = useCallback(
    (word: string, charIndex: number) => {
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

        try {
          const { node, localIndex } = charIndexToNodeMap[charIndex]
          const localWord = node.textContent!.slice(
            localIndex,
            localIndex + word.length, // returns all if larger
          )

          if (localWord === word) {
            const range = document.createRange()
            range.setStart(node.firstChild!, localIndex)
            range.setEnd(node.firstChild!, localIndex + word.length)
            const highlightSpan = document.createElement("mark")
            range.surroundContents(highlightSpan)
            lastHighlightedWord.current = highlightSpan
            scrollToHighlightedWord(highlightSpan)
          }
        } catch (error) {
          console.log("Error in highlightCurrentWord:", error)
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [charIndexToNodeMap],
  )

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
  }

  const smoothScrollToItem = useCallback(
    (index: number) => {
      if (listRef) {
        const startTime = performance.now()
        const duration = 300

        const startScrollOffset = (listRef.state as FixedSizeListState)
          .scrollOffset
        const itemSize = listRef.props.itemSize as number
        const targetScrollOffset = index * itemSize

        const animateScroll = (currentTime: number) => {
          const elapsedTime = currentTime - startTime
          const progress = Math.min(elapsedTime / duration, 1)
          const easeProgress = easeInOutCubic(progress)

          const newScrollOffset =
            startScrollOffset +
            (targetScrollOffset - startScrollOffset) * easeProgress

          listRef.scrollTo(newScrollOffset)

          if (progress < 1) {
            requestAnimationFrame(animateScroll)
          }
        }

        requestAnimationFrame(animateScroll)
      }
    },
    [listRef],
  )

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === "Space" && !event.repeat) {
        event.preventDefault()
        handlePlayPauseButtonClick()
      }
    }

    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying])

  const handlePlayPauseButtonClick = () => {
    setIsAnimating(true)
    setRotation((prev) => prev + 360)

    setTimeout(() => {
      if (isPlaying) {
        handleStop()
      } else {
        handlePlay()
      }
    }, 150)

    setTimeout(() => {
      setIsAnimating(false)
    }, 300)
  }

  return (
    <>
      <div
        ref={speechControllerRef}
        className="fixed bottom-1 z-50 flex w-72 items-center justify-around gap-6  self-center rounded-lg bg-white p-2 px-6 shadow-md"
      >
        <div className="mr-3">
          <SelectVoice
            voices={voices.filter((voice) => voice.lang === lang)}
            voiceName={voiceName}
            selectedVoice={voices.find((voice) => voice.name === voiceName)}
            handleVoiceChange={handleVoiceChange}
            lang={lang}
            setLang={setLang}
          />
        </div>
        <button
          onClick={handlePlayPauseButtonClick}
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-sky-500 transition-colors hover:bg-sky-600 focus:outline-none"
          disabled={isAnimating}
        >
          <div
            className="relative h-6 w-6 transition-transform duration-300 ease-in-out"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <div
              className={`
              absolute inset-0 transition-all duration-300 ease-in-out
              ${isPlaying ? "scale-100 opacity-100" : "scale-60 opacity-0"}
            `}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="white"
                className="h-6 w-6"
              >
                <rect x="6" y="5" width="4" height="14" fill="white" />
                <rect x="14" y="5" width="4" height="14" fill="white" />
              </svg>
            </div>
            <div
              className={`
              absolute inset-0 transition-all duration-300 ease-in-out
              ${isPlaying ? "scale-60 opacity-0" : "scale-100 opacity-100"}
            `}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="white"
                className="h-6 w-6"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRateChangeEnd([Math.max(0.5, rate - 0.25)])}
            disabled={rate <= 0.5}
            className={`flex h-6 w-6 items-center justify-center rounded-full border border-sky-300 bg-white text-center text-xs font-medium transition-colors
            ${
              rate <= 0.5
                ? "cursor-not-allowed text-slate-400 opacity-50"
                : "text-slate-500 hover:bg-sky-600 hover:text-white"
            }`}
          >
            -
          </button>
          <div
            className="group relative flex cursor-pointer flex-col self-center"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className={`absolute bottom-full -my-2 overflow-hidden rounded-lg bg-white pl-4 shadow-md 
            ${showSlider ? "flex flex-1 gap-2 border-x-8 border-y-[16px] border-white" : "hidden"}`}
            >
              <RateSlider
                tempRate={tempRate}
                setTempRate={setTempRate}
                // @ts-ignore
                handleRateChangeEnd={handleRateChangeEnd}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-300 bg-white text-center text-xs font-medium text-slate-500 transition-colors group-hover:bg-sky-600 group-hover:text-white">
                <div className="flex items-baseline">
                  {rate.toFixed(2)}
                  <span className="relative -bottom-[0.2rem] font-sans  text-sm ">
                    x
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              handleRateChangeEnd([Math.min(2, rate + 0.25)])
            }}
            disabled={rate >= 2}
            className={`flex h-6 w-6 items-center justify-center rounded-full border border-sky-300 bg-white text-center text-xs font-medium transition-colors
            ${
              rate >= 2
                ? "cursor-not-allowed text-slate-400 opacity-50"
                : "text-slate-500 hover:bg-sky-600 hover:text-white"
            }`}
          >
            +
          </button>
        </div>
      </div>
    </>
  )
}

export default SpeechController
