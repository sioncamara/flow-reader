import React, {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react"
import { Page } from "react-pdf"
import { CSSProperties } from "react"
import { useRemoteStore } from "@/store/useRemoteStore"
import {
  combineNestedSpans,
  combineSpans,
  // combineSplitWords,
  combineSplitWords2,
  englishLetters,
  handleHyphenatedWords,
  hideRepeateText,
} from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

import arrayWords from "an-array-of-english-words"

type PDFPageProps = {
  index: number
  width: number
  style: CSSProperties
}

const PdfPage: React.FC<PDFPageProps> = ({ index, width, style }) => {
  const isPlaying = useRemoteStore((state) => state.isPlaying)
  const readingPageIndex = useRemoteStore((state) => state.readingPageIndex)
  const reachedUtteranceEnd = useRemoteStore(
    (state) => state.reachedUtteranceEnd,
  )
  const wordSelectedOnOtherPage = useRemoteStore(
    (state) => state.wordSelectedOnOtherPage,
  )

  const setRemoteCombinedText = useRemoteStore((state) => state.setCombinedText)
  const setCurrTextPageIndex = useRemoteStore(
    (state) => state.setCurrTextPageIndex,
  )
  const setCharIndexToNodeMap = useRemoteStore(
    (state) => state.setCharIndexToNodeMap,
  )

  const [postRender, setPostRender] = useState(false)
  const [processText, setProcessText] = useState(false)
  const [renderSuccessCalledCount, setRenderSuccessCalledCount] = useState(0)
  const { toast } = useToast()

  const pageRef = useRef<HTMLDivElement | null>(
    null,
  ) as React.MutableRefObject<HTMLDivElement | null>

  // useLayoutEffect(() => {
  //   if (!pageRef.current || index !== readingPageIndex || !postRender) {
  //     // console.log(`Page: ${index}, Reading: ${readingPageIndex}, Match: ${index === readingPageIndex}`);
  //     return
  //   }

  //   console.log(
  //     `Page: ${index}, Reading: ${readingPageIndex}, Match: ${index === readingPageIndex}`,
  //   )

  //   let timeoutId: NodeJS.Timeout
  //   let attempts = 0
  //   const maxAttempts = 20
  //   const checkInterval = 250 // Check every 250ms

  //   const checkForTextLayer = () => {
  //     console.log("attempt ", attempts)

  //     const nodes = Array.from(
  //       pageRef.current?.querySelectorAll(
  //         '.textLayer span[role="presentation"]',
  //       ) || [],
  //     )

  //     if (nodes.length > 0) {
  //       // combineNestedSpans()
  //       // combineSpans()
  //       // combineSplitWords()
  //       // handleHyphenatedWords()
  //       // hideRepeateText()
  //       console.log("Text layer and presentation spans found")
  //       // const fullText = nodes
  //       //   .map((node) => node.textContent || "")
  //       //   .join(" ")
  //       //   .trim()

  //       // console.log("fullText: ", fullText)

  //       // setRemoteCombinedText(fullText)
  //       // processIndexToNodeMap(nodes)
  //       setProcessText(true)
  //     } else if (attempts < maxAttempts) {
  //       attempts++
  //       timeoutId = setTimeout(checkForTextLayer, checkInterval)
  //     } else {
  //       toast({
  //         variant: "destructive",
  //         duration: 5000,
  //         title: "Uh oh!",
  //         description:
  //           "Unfortunately, this Document is not supported by Flow Reader. Please try a different Document.",
  //       })
  //       console.log(
  //         "Max attempts reached, text layer or presentation spans not found",
  //       )
  //     }
  //   }

  //   checkForTextLayer()

  //   return () => {
  //     console.log("Cleanup timeout")
  //     clearTimeout(timeoutId)
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [postRender])

  // useEffect(() => {
  //   if (processText) {
  //     const nodes = Array.from(
  //       pageRef.current?.querySelectorAll(
  //         '.textLayer span[role="presentation"]',
  //       ) || [],
  //     )

  //     const fullText = nodes
  //       .map((node) => node.textContent || "")
  //       .join(" ")
  //       .trim()

  //     console.log("fullText: ", fullText)

  //     setRemoteCombinedText(fullText)
  //     processIndexToNodeMap(nodes)
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [processText])

  useEffect(() => {
    if (!pageRef.current || index !== readingPageIndex) {
      return
    }

    if (
      wordSelectedOnOtherPage ||
      reachedUtteranceEnd ||
      (index === readingPageIndex && !isPlaying)
    ) {
      console.log(
        "condition met wordSelectedOnOtherPage: ",
        wordSelectedOnOtherPage,
      )
      const nodes = Array.from(
        pageRef.current.querySelectorAll(
          '.textLayer span[role="presentation"]',
        ) || [],
      )

      if (nodes.length > 0) {
        const fullText = nodes
          .map((node) => node.textContent || "")
          .join(" ")
          .trim()
        console.log("fullText: ", fullText)
        setRemoteCombinedText(fullText)
        processIndexToNodeMap(nodes)
        setCurrTextPageIndex(index)
      } else {
        console.log("No presentation spans found in the text layer")
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    readingPageIndex,
    isPlaying,
    reachedUtteranceEnd,
    wordSelectedOnOtherPage,
  ])

  const processIndexToNodeMap = (nodes: Element[]) => {
    // Preprocess nodes to create a mapping of character indices to nodes
    const charIndexToNodeMap: {
      [key: number]: { node: Element; localIndex: number }
    } = {}
    let accumulatedLength = 0

    nodes.forEach((node) => {
      const nodeText = node.textContent || ""
      for (let j = 0; j < nodeText.length; j++) {
        charIndexToNodeMap[accumulatedLength + j] = { node, localIndex: j }
      }
      accumulatedLength += nodeText.length + 1 // +1 for space between nodes
    })
    setCharIndexToNodeMap(charIndexToNodeMap)
  }

  function waitForDOMUpdate(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 0)
      })
    })
  }

  const onRenderSuccess2 = () => {
    if (index === 8) {
      combineSplitWords(index + 1)
    }
    // combineSplitWords2()

    // Wait for DOM updates to complete
    // await waitForDOMUpdate()

    // if (index === readingPageIndex) {
    //   const nodes = Array.from(
    //   pageRef.current?.querySelectorAll(
    //     '.textLayer span[role="presentation"]',
    //   ) || [],
    // )
    // // console.log("nodes length: ", nodes.length); // omg this only prints if it's the current page face palm
    // // console.log("index: ", index);
    // }

    // console.log('render triggered');

    // Now we can be more confident that the DOM has been updated
    setPostRender(true)

    //  // combineNestedSpans()
    //  combineSplitWords()
    //  // handleHyphenatedWords()
    //  // hideRepeateText()

    //  setTimeout(() => {
    //    setPostRender(true)
    //  }, 1000)
    //  // combineSpans()
  }

  const onRenderSuccess = () => {
    // if (renderSuccessCalledCount > 5) return

    setTimeout(() => {
      combineSplitWords(index + 1)
    }, 1000)

    setPostRender(true)
    // setRenderSuccessCalledCount(prev => prev + 1)
  }

  function combineSplitWords(
    pageNumber: number,
    maxAttempts: number = 11,
  ): void {
    const englishWords = new Set(arrayWords)
    // englishWords.delete("et")
    const englishLettersMinusAandI = new Set(englishLetters)
    englishLettersMinusAandI.delete("a")
    englishLettersMinusAandI.delete("A")
    englishLettersMinusAandI.delete("i")
    englishLettersMinusAandI.delete("I")

    const currWordEndPunctuationMarks = new Set<string>([
      ",",
      ":",
      ";",
      "-",
      "'",
      ")",
      '"',
      "...",
    ])

    const endsWithLetterRegex = /[a-zA-Z]$/

    function endsWithLetter(word: string): boolean {
      return endsWithLetterRegex.test(word)
    }

    function attemptCombineWords(attempt: number): void {
      if (attempt > maxAttempts) {
        console.log(`Max attempts reached for page ${pageNumber}`)
        return
      }

      const page = document.querySelector(
        `.react-pdf__Page[data-page-number="${pageNumber}"]`,
      )
      if (!page) {
        console.log(`Page ${pageNumber} not found`)
        return
      }

      const textLayer = page.querySelector(
        ".react-pdf__Page__textContent.textLayer",
      )
      // if (!textLayer) {
      //   console.log(`Text layer not found on page ${pageNumber}`);
      //   return;
      // }

      const spans = Array.from(
        textLayer?.querySelectorAll('span[role="presentation"]') || [],
      )

      if (spans.length === 0) {
        if (pageNumber === 9)
          console.log(
            `No spans found on page ${pageNumber}, attempt ${attempt}. Retrying...`,
          )
        setTimeout(() => attemptCombineWords(attempt + 1), 500)
        return
      }

      if (pageNumber === 9) {
        console.log("spans found on attempt: ", attempt)

        console.log("english words has fi: ", englishWords.has("fi"))
        console.log("english words has nd: ", englishWords.has("nd"))
        console.log("english words has find: ", englishWords.has("find"))
      }
      for (let i = 0; i < spans.length - 1; i++) {
        const currentSpan = spans[i] as HTMLSpanElement
        const nextSpan = spans[i + 1] as HTMLSpanElement

        const rawCurrentWord = currentSpan.textContent || ""
        const currentWord = rawCurrentWord?.trimStart().toLowerCase()
        const trimmedCurrentWord = currentWord?.trimEnd()
        const nextWord = nextSpan.textContent?.trimEnd().toLowerCase() || ""
        const combinedWord = currentWord + nextWord

        const hasCurrentNotNextHasCombined = (() => {
          const nextWordEndInPunctuation =
            !endsWithLetter(nextWord) && englishWords.has(nextWord.slice(0, -1))

          const combinedWordEndInPunctuation =
            !endsWithLetter(combinedWord) &&
            englishWords.has(combinedWord.slice(0, -1))

          if (nextWord === "slackening?") {
            console.log("It's slackening")
            console.log("ends in punctuation: ", nextWordEndInPunctuation)
            console.log("ends with letter: ", endsWithLetter(nextWord))

            console.log("currentWord: ", currentWord)

            console.log(
              "---------------------The conditions---------------------",
            )
            console.log(
              "englishWords.has(currentWord): ",
              englishWords.has(currentWord),
            )
            console.log(
              "!englishWords.has(nextWord): ",
              !englishWords.has(nextWord),
            )
            console.log(
              "!nextWordEndInPunctuation: ",
              !nextWordEndInPunctuation,
            )
            console.log(
              "(englishWords.has(combinedWord) || combinedWordEndInPunctuation): ",
              englishWords.has(combinedWord) || combinedWordEndInPunctuation,
            )
          }

          return (
            englishWords.has(currentWord) &&
            !englishWords.has(nextWord) &&
            !nextWordEndInPunctuation &&
            (englishWords.has(combinedWord) || combinedWordEndInPunctuation)
          )
        })()

        const notFirstWordSecondMightBeCombinedIs =
          (!englishWords.has(currentWord) ||
            englishLettersMinusAandI.has(currentWord)) &&
          (!englishWords.has(nextWord) ||
            !nextSpan.textContent?.includes(" ")) &&
          englishWords.has(combinedWord)

        const isFragmentWordOrStartOfWord =
          ((!englishWords.has(currentWord) &&
            englishLetters.has(currentWord[0]) &&
            !currWordEndPunctuationMarks.has(
              trimmedCurrentWord[trimmedCurrentWord.length - 1],
            )) ||
            englishLettersMinusAandI.has(rawCurrentWord)) &&
          !englishWords.has(nextWord) &&
          !nextSpan.textContent?.includes(" ")

        if (currentWord !== "" && nextWord !== "") {
          if (notFirstWordSecondMightBeCombinedIs) {
            currentSpan.textContent! += nextSpan.textContent
            nextSpan.remove()
            i++
          } else if (hasCurrentNotNextHasCombined) {
            currentSpan.textContent! += nextSpan.textContent
            nextSpan.remove()
            i++
          } else if (isFragmentWordOrStartOfWord) {
            currentSpan.textContent! += nextSpan.textContent
            nextSpan.remove()
            // i++
          }
        }
      }

      const nodes = Array.from(
        textLayer?.querySelectorAll('span[role="presentation"]') || [],
      )

      if (pageNumber === 9) {
        // console.log("spans found on attempt: ", attempt)
        console.log("nodes: ", nodes)
        // console.log('textLayer: ', textLayer);
      }

      if (index === readingPageIndex) {
        const fullText = nodes
          .map((node) => node.textContent || "")
          .join(" ")
          .trim()

        setRemoteCombinedText(fullText)
        processIndexToNodeMap(nodes)
      }
    }

    attemptCombineWords(1)
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
        onRenderSuccess={onRenderSuccess}
        // onRenderTextLayerSuccess={renderSuccessCalledCount > 10 ? undefined : onRenderSuccess}
        onError={() => "An error occurred in the Page component"}
        onGetStructTreeError={(error) =>
          "An error occurred in the Page component: " + error
        }
      />
      {/* <div className="absolute left-0 top-0 z-50 flex flex-col gap-2 bg-white p-2">
      <button onClick={() => console.log(`index: ${index}, readingPageIndex: ${readingPageIndex}`)}>Print index</button>
      </div> */}
      <div className="absolute left-0 top-0 z-50 flex flex-col gap-2 bg-white p-2">
        <button
          onClick={() => {
            const nodes = Array.from(
              pageRef.current?.querySelectorAll(
                '.textLayer span[role="presentation"]',
              ) || [],
            )
            console.log(`Page ${index + 1} nodes:`, nodes)
          }}
        >
          Log Nodes
        </button>
      </div>
    </div>
  )
}

export default React.memo(PdfPage)
