import React, { useEffect, useState, useRef } from "react"
import { Page } from "react-pdf"
import { CSSProperties } from "react"
import { useRemoteStore } from "@/store/useRemoteStore"
import {
  combineNestedSpans,
  combineSpans,
  handleHyphenatedWords,
} from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

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
  const { toast } = useToast()

  const pageRef = useRef<HTMLDivElement | null>(
    null,
  ) as React.MutableRefObject<HTMLDivElement | null>

  useEffect(() => {
    if (!pageRef.current || index !== readingPageIndex || !postRender) {
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
        handleHyphenatedWords()
        console.log("Text layer and presentation spans found")
        const fullText = nodes
          .map((node) => node.textContent || "")
          .join(" ")
          .trim()

        setRemoteCombinedText(fullText)
        processIndexToNodeMap(nodes)
      } else if (attempts < maxAttempts) {
        attempts++
        timeoutId = setTimeout(checkForTextLayer, checkInterval)
      } else {
        toast({
          variant: "destructive",
          duration: 5000,
          title: "Uh oh!",
          description:
            "Unfortunately, this Document is not supported by Flow Reader. Please try a different Document.",
        })
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
  }, [postRender])

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

  return (
    <div
      ref={pageRef}
      className={` ${index !== 0 && "border-t-[16px]"} border-t-slate-200/40`}
      style={style}
    >
      <Page
        pageNumber={index + 1}
        width={width - 16}
        onRenderSuccess={() => {
          // hideRepeateText()
          combineNestedSpans()
          handleHyphenatedWords()
          setTimeout(() => {
            setPostRender(true)
          }, 1000)
          // combineSpans()
        }}
        onError={() => "An error occurred in the Page component"}
        onGetStructTreeError={(error) =>
          "An error occurred in the Page component: " + error
        }
      />
      {/* <div className="absolute left-0 top-0 z-50 flex flex-col gap-2 bg-white p-2">
      <button onClick={() => console.log(`index: ${index}, readingPageIndex: ${readingPageIndex}`)}>Print index</button>
      </div> */}
    </div>
  )
}

export default React.memo(PdfPage)
