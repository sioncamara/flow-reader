import React, { useCallback, useEffect, useState, useRef } from "react"
import { Page } from "react-pdf"
import { CSSProperties } from "react"
import { useRemoteStore } from "@/store/useRemoteStore"
import { TextContent, TextItem } from "pdfjs-dist/types/src/display/api"
import { useVoices } from "react-text-to-speech"

type PDFPageProps = {
  index: number
  width: number
  style: CSSProperties
}

const PdfPage: React.FC<PDFPageProps> = ({ index, width, style }) => {
  const setRemoteCombinedText = useRemoteStore((state) => state.setCombinedText)
const isPlaying = useRemoteStore((state) => state.isPlaying)
const setCurrTextPageIndex = useRemoteStore((state) => state.setCurrTextPageIndex)
const currTextPageIndex = useRemoteStore((state) => state.currTextPageIndex)
const remoteCharIndexToNodeMap = useRemoteStore((state) => state.charIndexToNodeMap)
const setRemoteCharIndexToNodeMap = useRemoteStore((state) => state.setCharIndexToNodeMap)
const readingPageIndex = useRemoteStore((state) => state.readingPageIndex)
const reachedUtteranceEnd = useRemoteStore((state) => state.reachedUtteranceEnd)

  const [combinedText, setCombinedText] = useState<string>("")

  const pageRef = useRef<HTMLDivElement | null>(
    null,
  ) as React.MutableRefObject<HTMLDivElement | null>
  const textContentRef = useRef<string>("")


  useEffect(() => {
    if (!pageRef.current || index !== readingPageIndex) {
      // console.log(`Page: ${index}, Reading: ${readingPageIndex}, Match: ${index === readingPageIndex}`);
      return
    }

    console.log(
      `Page: ${index}, Reading: ${readingPageIndex}, Match: ${index === readingPageIndex}`,
    )

    let timeoutId: NodeJS.Timeout
    let attempts = 0
    const maxAttempts = 20
    const checkInterval = 250 // Check every 250ms

    const checkForTextLayer = () => {
      console.log("attempt ", attempts)

      const nodes = Array.from(
        pageRef.current?.querySelectorAll(
          '.textLayer span[role="presentation"]',
        ) || [],
      )

      if (nodes.length > 0) {
        console.log("Text layer and presentation spans found")
        processIndexToNodeMap(nodes)
      } else if (attempts < maxAttempts) {
        attempts++
        timeoutId = setTimeout(checkForTextLayer, checkInterval)
      } else {
        console.log(
          "Max attempts reached, text layer or presentation spans not found",
        )
      }
    }

    checkForTextLayer()

    return () => {
      console.log("Cleanup timeout")
      clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {    
    if (!pageRef.current || index !== readingPageIndex) {
      return
    }

    console.log(
      `%cPage: ${index}, Reading: ${readingPageIndex}, Match: ${index === readingPageIndex}`,
      "color: green; font-weight: bold;",
    )

    console.log(`readingPageIndex: ${readingPageIndex}, currTextPageIndex: ${currTextPageIndex}`);
    

    if (reachedUtteranceEnd || index === readingPageIndex && (!isPlaying)) {
      const nodes = Array.from(
        pageRef.current.querySelectorAll(
          '.textLayer span[role="presentation"]',
        ) || [],
      )
      if (nodes.length > 0) {
        processIndexToNodeMap(nodes)
        setRemoteCombinedText(combinedText)
        setCurrTextPageIndex(index)        
      } else {
        console.log("No presentation spans found in the text layer")
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readingPageIndex, isPlaying, reachedUtteranceEnd])

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
    if (index === readingPageIndex)
      setRemoteCharIndexToNodeMap(charIndexToNodeMap)
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
    if (index === readingPageIndex) {
      setRemoteCombinedText(fullText)
    }

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
        onError={() => "An error occurred in the Page component"}
        onGetStructTreeError={(error) =>
          "An error occurred in the Page component: " + error
        }
      />
      <div className="absolute left-0 top-0 z-50 flex flex-col gap-2 bg-white p-2">
      

        <button
          onClick={() => {
            console.log("index:", index)
            console.log("readingPageIndex:", readingPageIndex)
          }}
        >
          print index
        </button>
      </div>
    </div>
  )
}

export default React.memo(PdfPage)
