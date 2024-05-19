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

import "./test.css"

import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist"
import { DBSchema, openDB } from "idb"
import React from "react"
import Image from "next/image"
import { useResizeObserver } from "@wojtekmaj/react-hooks"

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
  pdfTest?: Uint8Array
}

export default function PdfViewer({ pdfTest }: PdfViewerProps) {
  const [file, setFile] = useState<PDFFile | Blob>("")
  const [numPages, setNumPages] = useState<number>()
  const currPageIndexRef = useRef<number>(0)
  const [pageHeight, setPageHeight] = useState<number>()
  const [pageWidth, setPageWidth] = useState<number>()
  const [listElement, setListElement] = useState<Element | null>(null)
  const [outerListRef, setOuterListRef] = useState<HTMLElement | null>(null)
  const [isListRefReady, setIsListRefReady] = useState(false)
  // const [listRef, setListRef] = useState<any| null>(null);

  const visibleItemsRef = useRef({ start: 0, stop: 0 })
  const overscanItemsRef = useRef({ start: 0, stop: 0 })

  const listRef = React.createRef<FixedSizeList<any>>()
  const lastChangeRef = useRef<"start" | "stop" | null>(null)
  // const outerListRef = React.createRef<Element>()

  useEffect(() => {
    if (pdfTest) {
      setFile(new Blob([pdfTest], { type: "application/pdf" }))
    }
  }, [pdfTest])

  useEffect(() => {
    if (listRef?.current) {
      console.log("listRef is set")
      setIsListRefReady(true)
    }
  }, [listRef.current])

  const options = useMemo(
    () => ({
      cMapUrl: "/cmaps/",
      standardFontDataUrl: "/standard_fonts/",
    }),
    [],
  )

  const onResize = useCallback<ResizeObserverCallback>(() => {
    listRef?.current?.scrollToItem(currPageIndexRef.current, "start")
    console.log("onResize")
  }, [listRef])

  useResizeObserver(outerListRef, {}, onResize)

  async function onFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const { files } = event.target
    if (!files || !files[0]) return

    const pdfFile = files[0]

    setFile(pdfFile)
  }

  async function onDocumentLoadSuccess(pdf: PDFDocumentProxy): Promise<void> {
    setNumPages(pdf.numPages)
    const firstPage = await pdf.getPage(1)
    const viewport = firstPage.getViewport({ scale: 1 })
    setPageHeight(viewport.height)
    setPageWidth(viewport.width)

    const outline = await pdf.getOutline()
    console.log("outline:")
    console.log(outline)

    const dbName = "PdfDatabase"
    const storeName = "pdfs"

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

  async function getCoverImage(page: PDFPageProxy): Promise<string> {
    var scale = 1.5
    var viewport = page.getViewport({ scale: scale })

    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Error generating canvas context")

    canvas.width = viewport.width
    canvas.height = viewport.height

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    }

    return page
      .render(renderContext)
      .promise.then(() => {
        const dataURL = canvas.toDataURL("image/png")
        return dataURL
      })
      .catch((error) => {
        throw error
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
  }) => (
    <div
      className={` ${index !== 0 && "border-t-[16px]"} border-t-slate-200/40`}
      style={style}
    >
      <Page
        pageNumber={index + 1}
        width={width - 16}
        onError={() => "An error occurred in the Page component"}
        onGetStructTreeError={(error) =>
          "An error occurred in the Page component"
        }
      />
    </div>
  )

  

  return (
    <div className="relative flex flex-auto flex-col items-center">
      {!pdfTest && (
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
              {true && (
                <Document
                  file={file}
                  onItemClick={({ pageIndex }) => {
                    if (listRef?.current) {
                      // listRef.current.scrollToItem(3, "start")
                      console.log("listRef.current is not null")
                    } else {
                      console.log("listRef.current is null")
                    }
                  }}
                  onLoadSuccess={onDocumentLoadSuccess}
                  options={options}
                  onError={() => "An error occurred in the Document component"}
                >
                  {numPages && (
                    <>
                      <div className="group absolute right-[16px] top-[24px] z-50 flex  min-h-24 min-w-24 flex-col">
                        <Image
                          src="/toc.svg"
                          alt="Table of Contents"
                          className="mr-[16px] self-end"
                          width={48}
                          height={48}
                        />
                        <div className=" mr-5 max-h-0 max-w-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:max-h-96 group-hover:max-w-[800px] group-hover:overflow-y-auto group-hover:bg-white group-hover:opacity-100">
                          <Outline
                            onItemClick={({ pageIndex }) => {
                              console.log("This prints first")
                              listRef.current?.scrollToItem(pageIndex, "start")
                              // set page index
                              // switch boolean to ingore changes in Items rendered callback
                            }}
                          />
                        </div>
                      </div>
                      <List
                        ref={listRef}
                        outerRef={setOuterListRef}
                        className="bg-white"
                        height={height}
                        itemCount={numPages}
                        itemSize={
                          pageHeight
                            ? pageHeight * pageScale
                            : height * pageScale
                        }
                        width={width}
                      >
                        {({ index, style }) =>
                          renderPage({ index, style, width })
                        }
                      </List>
                    </>
                  )}
                </Document>
              )}
            </div>
          )
        }}
      </AutoSizer>
    </div>
  )
}
