import React, { useEffect, useState, useRef, useCallback } from "react"
import { Page } from "react-pdf"
import { CSSProperties } from "react"
import { useRemoteStore } from "@/store/useRemoteStore"
import {
  combineNestedSpans,
  combineSpans,
  handleHyphenatedWords,
  hideRepeateText,
  combineSplitWords,
} from "@/lib/utils"

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

  const setReadingPageIndex = useRemoteStore(
    (state) => state.setReadingPageIndex,
  )

  const pageRef = useRef<HTMLDivElement | null>(
    null,
  ) as React.MutableRefObject<HTMLDivElement | null>

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
      const textSpans = Array.from(
        pageRef.current.querySelectorAll(
          '.textLayer span[role="presentation"]',
        ) || [],
      )

      if (textSpans.length > 0) {
        const fullText = textSpans
          .map((textSpan) => textSpan.textContent || "") // commit before wokring on. Can check if textSpan ends in - combined with start of next is word
          .join(" ")
          .trim()
        setRemoteCombinedText(fullText)
        processIndexToNodeMap(textSpans)
        setCurrTextPageIndex(index)
      } else {
        console.log("No spans with role presentation found in the text layer")
        for (let i = 1; i <= 3; i++) {
          const nextPage = document.querySelector(
            `.react-pdf__Page[data-page-number="${index + i + 1}"]`,
          )
          if (!nextPage) {
            console.log(`Page ${index + i + 1} not found in the document`)
            break
          }

          const nextPageTextSpans = Array.from(
            nextPage.querySelectorAll('.textLayer span[role="presentation"]'),
          )

          if (nextPageTextSpans.length > 0) {
            const fullText = nextPageTextSpans
              .map((textSpan) => textSpan.textContent || "")
              .join(" ")
              .trim()
            setRemoteCombinedText(fullText)
            processIndexToNodeMap(nextPageTextSpans)
            setCurrTextPageIndex(index + i)
            setReadingPageIndex(index + i)
            break
          }
        }
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    readingPageIndex,
    isPlaying,
    reachedUtteranceEnd,
    wordSelectedOnOtherPage,
  ])

  const processIndexToNodeMap = (textSpans: Element[]) => {
    // Preprocess nodes to create a mapping of character indices to nodes
    const charIndexToNodeMap: {
      [key: number]: { node: Element; localIndex: number }
    } = {}
    let accumulatedLength = 0

    textSpans.forEach((textSpan) => {
      const nodeText = textSpan.textContent || "" // when appropriate condition is met remove - from nodeText
      for (let j = 0; j < nodeText.length; j++) {
        charIndexToNodeMap[accumulatedLength + j] = {
          node: textSpan,
          localIndex: j,
        }
      }
      accumulatedLength += nodeText.length + 1 // +1 for space between nodes
    })
    setCharIndexToNodeMap(charIndexToNodeMap)
  }

  const initializeTextIfInitialPage = useCallback(
    (textLayer: Element | null) => {
      if (index === readingPageIndex) {
        const textSpans = Array.from(
          textLayer?.querySelectorAll('span[role="presentation"]') || [],
        )
        const fullText = textSpans
          .map((textSpan) => textSpan.textContent || "")
          .join(" ")
          .trim()

        setRemoteCombinedText(fullText)
        processIndexToNodeMap(textSpans)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const onRenderSuccess = () => {
    setTimeout(() => {
      hideRepeateText() // can be made more efficient
      setTimeout(() => {
        combineSplitWords(index + 1, initializeTextIfInitialPage)
      }, 100)
    }, 1000)
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
        onError={() => "An error occurred in the Page component"}
        onGetStructTreeError={(error) =>
          "An error occurred in the Page component: " + error
        }
      />
    </div>
  )
}

export default React.memo(PdfPage)
