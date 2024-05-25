"use client"

import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { pdfjs, Document, Outline, Page } from "react-pdf"
import { FixedSizeList as List, FixedSizeList } from "react-window"
import AutoSizer from "react-virtualized-auto-sizer"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import "react-pdf/dist/esm/Page/TextLayer.css"
import "@/components/PdfViewer.css"

import type { PDFDocumentProxy } from "pdfjs-dist"
import { DBSchema, openDB } from "idb"
import React from "react"
import Image from "next/image"
import { useResizeObserver } from "@wojtekmaj/react-hooks"
import { processSpan, setAriaHiddenAttribute, getCoverImage } from "@/lib/utils"

export type PdfStore = DBSchema & {
  pdfs: {
    key: string
    value: {
      pdfFile: Blob
      coverImage: string
    }
  }
}

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url,
).toString()

type PDFFile = string | File | null

type PdfViewerProps = {
  providedPdf?: Uint8Array
  fingerprint?: string
}

export default function PdfViewer({
  providedPdf,
  fingerprint,
}: PdfViewerProps) {
  const [file, setFile] = useState<PDFFile | Blob>("")
  const [numPages, setNumPages] = useState<number>()
  const currPageIndexRef = useRef<number>(0)
  const [pageHeight, setPageHeight] = useState<number>()
  const [pageWidth, setPageWidth] = useState<number>()
  const [outerListRef, setOuterListRef] = useState<HTMLElement | null>(null)
  const [hasOutline, setHasOutline] = useState<boolean>(false)

  const visibleItemsRef = useRef({ start: 0, stop: 0 })
  const resizeOccured = useRef({ value: false, count: 0 })
  const listRef = useRef<FixedSizeList<any> | null>(null)

  const setListRef = (ref: FixedSizeList<any> | null) => {
    listRef.current = ref
  }

  useEffect(() => {
    if (providedPdf) {
      setFile(new Blob([providedPdf], { type: "application/pdf" }))
    }
  }, [providedPdf])

  useEffect(() => {
    if (fingerprint) {
      const storedPageIndex = localStorage.getItem(`pageIndex-${fingerprint}`)
      if (storedPageIndex) {
        currPageIndexRef.current = parseInt(storedPageIndex, 10)
        listRef.current?.scrollToItem(currPageIndexRef.current, "start")
      }
    }
  }, [fingerprint])

  const options = useMemo(
    () => ({
      cMapUrl: "/cmaps/",
      standardFontDataUrl: "/standard_fonts/",
    }),
    [],
  )

  const onResize = useCallback<ResizeObserverCallback>(() => {
    listRef?.current?.scrollToItem(currPageIndexRef.current, "start")
    resizeOccured.current = { value: true, count: 4 }
  }, [listRef])

  useResizeObserver(outerListRef, {}, onResize)

  async function onFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const { files } = event.target
    if (!files || !files[0]) return
    setFile(files[0])
  }

  async function storePdf(pdf: PDFDocumentProxy): Promise<void> {
    setNumPages(pdf.numPages)
    const firstPage = await pdf.getPage(1)
    const viewport = firstPage.getViewport({ scale: 1 })
    setPageHeight(viewport.height)
    setPageWidth(viewport.width)

    const dbName = "PdfDatabase"
    const storeName = "pdfs"

    const outline = await pdf.getOutline()
    setHasOutline(outline !== null)

    try {
      const db = await openDB<PdfStore>(dbName)
      const fingerprint = pdf.fingerprints[0]

      const existingEntry = await db.get(storeName, fingerprint)
      if (existingEntry) {
        console.log("PDF already stored in IndexedDB")
        return
      }

      const buffer = await pdf.getData()
      const blob = new Blob([buffer], { type: "application/pdf" })
      const coverImage = await getCoverImage(await pdf.getPage(1))

      await db.add(storeName, { pdfFile: blob, coverImage }, fingerprint)
      console.log("PDF & Image stored in IndexedDB")
    } catch (error) {
      console.error("Error storing PDF in IndexedDB:", error)
    }
  }

  function hideRepeateText() {
    const pages = document.querySelectorAll(".react-pdf__Page")
    const textCountMap: { [key: string]: number } = {}

    // this function has runs for around 10 pages at a time and runs almost everytime to user moves the page
    // it's not efficient, but gets the job done for now

    pages.forEach((page) => {
      const textLayer = page.querySelector(
        ".react-pdf__Page__textContent.textLayer",
      )
      if (textLayer) {
        const spans = textLayer.querySelectorAll('span[role="presentation"]')
        if (spans.length >= 6) {
          const firstSpan = spans[0]
          const secondSpan = spans[1]
          const thirdSpan = spans[2]
          const thirdToLastSpan = spans[spans.length - 3]
          const secondToLastSpan = spans[spans.length - 2]
          const lastSpan = spans[spans.length - 1]

          processSpan(firstSpan, 1, textCountMap)
          processSpan(secondSpan, 2, textCountMap)
          processSpan(thirdSpan, 3, textCountMap)
          processSpan(thirdToLastSpan, 4, textCountMap)
          processSpan(secondToLastSpan, 5, textCountMap)
          processSpan(lastSpan, 6, textCountMap)
        }
      }
    })

    pages.forEach((page) => {
      const textLayer = page.querySelector(
        ".react-pdf__Page__textContent.textLayer",
      )
      if (textLayer) {
        const spans = textLayer.querySelectorAll('span[role="presentation"]')
        if (spans.length >= 6) {
          const firstSpan = spans[0]
          const secondSpan = spans[1]
          const thirdSpan = spans[2]
          const thirdToLastSpan = spans[spans.length - 3]
          const secondToLastSpan = spans[spans.length - 2]
          const lastSpan = spans[spans.length - 1]

          setAriaHiddenAttribute(firstSpan, 1, textCountMap)
          setAriaHiddenAttribute(secondSpan, 2, textCountMap)
          setAriaHiddenAttribute(thirdSpan, 3, textCountMap)
          setAriaHiddenAttribute(thirdToLastSpan, 4, textCountMap)
          setAriaHiddenAttribute(secondToLastSpan, 5, textCountMap)
          setAriaHiddenAttribute(lastSpan, 6, textCountMap)
        }
      }
    })
  }

  const renderPage = ({
    index,
    width,
    style,
  }: {
    index: number
    width: number
    style: CSSProperties
  }) => {
    return (
      <div
        className={` ${index !== 0 && "border-t-[16px]"} border-t-slate-200/40`}
        style={style}
      >
        <Page
          pageNumber={index + 1}
          width={width - 16}
          onRenderSuccess={hideRepeateText}
          onError={() => "An error occurred in the Page component"}
          onGetStructTreeError={(error) =>
            "An error occurred in the Page component: " + error
          }
        />
      </div>
    )
  }

  const handleItemsRendered = ({
    visibleStartIndex,
    visibleStopIndex,
  }: {
    visibleStartIndex: number
    visibleStopIndex: number
  }) => {
    const prevVisibleStartValue = visibleItemsRef.current.start
    const prevVisibleStopValue = visibleItemsRef.current.stop

    if (
      prevVisibleStartValue !== visibleStartIndex ||
      prevVisibleStopValue !== visibleStopIndex
    ) {
      visibleItemsRef.current = {
        start: visibleStartIndex,
        stop: visibleStopIndex,
      }
      if (resizeOccured.current.value) {
        if (resizeOccured.current.count === 0) {
          resizeOccured.current.value = false
        }

        resizeOccured.current.count--
        return
      }

      if (
        Math.abs(prevVisibleStartValue - visibleStartIndex) > 10 ||
        Math.abs(prevVisibleStopValue - visibleStopIndex) > 10
      )
        return

      // could change logic slightly for mobile/smaller viewport down the line
      if (
        prevVisibleStartValue < visibleStartIndex ||
        prevVisibleStopValue < visibleStopIndex
      ) {
        currPageIndexRef.current = visibleStartIndex
        if (fingerprint)
          localStorage.setItem(
            `pageIndex-${fingerprint}`,
            currPageIndexRef.current.toString(),
          )
      } else if (
        prevVisibleStartValue > visibleStartIndex ||
        prevVisibleStopValue > visibleStopIndex
      ) {
        currPageIndexRef.current = visibleStopIndex
        if (fingerprint)
          localStorage.setItem(
            `pageIndex-${fingerprint}`,
            currPageIndexRef.current.toString(),
          )
      }
    }

    visibleItemsRef.current.start = visibleStartIndex
    visibleItemsRef.current.stop = visibleStopIndex
  }

  return (
    <div className="relative flex flex-auto flex-col items-center">
      {!providedPdf && (
        <div className="text-white">
          <label htmlFor="file">Load from file:</label>{" "}
          <input onChange={onFileChange} type="file" />
        </div>
      )}
      <AutoSizer>
        {({ height, width }) => {
          const pageScale = width / (pageWidth || 1)

          return (
            <div className="Example__container__document custom-read-aloud flex-auto">
              <Document
                file={file}
                onItemClick={({ pageIndex }) => {
                  listRef?.current?.scrollToItem(pageIndex, "start")
                  currPageIndexRef.current = pageIndex
                  if (fingerprint)
                    localStorage.setItem(
                      `pageIndex-${fingerprint}`,
                      currPageIndexRef.current.toString(),
                    )
                }}
                onLoadSuccess={storePdf}
                options={options}
                onError={() => "An error occurred in the Document component"}
              >
                {numPages && (
                  <>
                    {hasOutline && (
                      <div className="group absolute right-[16px] top-[24px] z-50 flex  min-h-24 min-w-24 flex-col">
                        <Image
                          src="/toc.svg"
                          alt="Table of Contents"
                          className="mr-[16px] self-end"
                          width={48}
                          height={48}
                        />
                        <div className=" mr-5  max-h-0 max-w-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:max-h-96 group-hover:max-w-[800px] group-hover:overflow-y-auto group-hover:bg-white group-hover:opacity-100">
                          <Outline
                            className="space-y-6 rounded-lg bg-slate-100/30 p-4"
                            onItemClick={({ pageIndex, dest }) => {
                              console.log("Destination:", dest)
                              listRef.current?.scrollToItem(pageIndex, "start")
                              currPageIndexRef.current = pageIndex
                              if (fingerprint) {
                                localStorage.setItem(
                                  `pageIndex-${fingerprint}`,
                                  currPageIndexRef.current.toString(),
                                )
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <List
                      ref={setListRef}
                      outerRef={setOuterListRef}
                      className="bg-white"
                      height={height}
                      itemCount={numPages}
                      itemSize={
                        pageHeight ? pageHeight * pageScale : height * pageScale
                      }
                      width={width}
                      onItemsRendered={handleItemsRendered}
                    >
                      {({ index, style }) =>
                        renderPage({ index, style, width })
                      }
                    </List>
                  </>
                )}
              </Document>
            </div>
          )
        }}
      </AutoSizer>
    </div>
  )
}
