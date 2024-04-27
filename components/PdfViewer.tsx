"use client"

import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react"
import { useResizeObserver } from "@wojtekmaj/react-hooks"
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
import clsx from "clsx"
import Image from "next/image"

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

const resizeObserverOptions = {}

const maxWidth = 1600

type PDFFile = string | File | null

type PdfViewerProps = {
  pdfTest?: Uint8Array
}

export default function PdfViewer({ pdfTest }: PdfViewerProps) {
  const [file, setFile] = useState<PDFFile | Blob>("")
  const [numPages, setNumPages] = useState<number>()
  const [pageNumber, setPageNumber] = useState(1)
  const [pageHeight, setPageHeight] = useState<number>()
  const [pageWidth, setPageWidth] = useState<number>()
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null)
  const [containerWidth, setContainerWidth] = useState<number>()

  const [isHovered, setIsHovered] = useState(false)

  const listRef = React.createRef<FixedSizeList<any>>()

  useEffect(() => {
    if (pdfTest) {
      setFile(new Blob([pdfTest], { type: "application/pdf" }))
      listRef.current?.scrollToItem(10, "start")
    }
  }, [pdfTest])

  const onResize = useCallback<ResizeObserverCallback>((entries) => {
    const [entry] = entries

    if (entry) {
      setContainerWidth(entry.contentRect.width)
    }
  }, [])

  const options = useMemo(
    () => ({
      cMapUrl: "/cmaps/",
      standardFontDataUrl: "/standard_fonts/",
    }),
    [],
  )

  // useResizeObserver(containerRef, resizeObserverOptions, onResize)

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

  function onItemClick({ pageNumber: itemPageNumber }: { pageNumber: number }) {
    // setPageNumber(itemPageNumber)
    listRef.current?.scrollToItem(itemPageNumber - 1, "start")
  }


  const renderPage = ({
    index,
    width,
    style,
  }: {
    index: number
    width: number
    style?: CSSProperties
  }) => (
    <div
      className={` ${index !== 0 && "border-t-[16px]"} border-t-slate-200/40`}
      style={style}
    >
      <Page pageNumber={index + 1} width={width - 16} />
      {/* <div className="border-8 border-[#d9dddd]"></div> */}
    </div>
  )

  const Row = ({
    index,
    style = { border: "1px solid #d9dddd" },
  }: {
    index: number
    style?: CSSProperties
  }) => (
    <div
      className={`page-shadow mx-1 my-4 ${index % 2 ? "ListItemOdd" : "ListItemEven"}`}

      // style={style}
    >
      Row {index}
    </div>
  )

  // return (
  //   <div className="flex-auto flex-col items-center">
  //     <AutoSizer>
  //       {({ height, width }) => (
  //         <List
  //           className="List bg-slate-100/40"
  //           height={height}
  //           itemCount={1000}
  //           itemSize={10}
  //           width={width}
  //         >
  //           {Row}
  //         </List>
  //       )}
  //     </AutoSizer>
  //   </div>
  // )

  return true ? (
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
            <div
              className="Example__container__document custom-read-aloud flex-auto"
              ref={setContainerRef}
            >
              <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
                {numPages && (
                  <>
                    <div className="group absolute right-[16px] top-[24px] flex flex-col  z-50 min-h-24 min-w-24">
                      <Image
                        src="/toc.svg"
                        alt="Table of Contents"
                        className="self-end mr-[16px]"
                        width={48}
                        height={48}
                      />
                      <div className=" mr-5 max-h-0 max-w-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:max-h-96 group-hover:max-w-[800px] group-hover:overflow-y-auto group-hover:bg-white group-hover:opacity-100">
                        <Outline onItemClick={onItemClick} />
                      </div>
                    </div>
                    <List
                      ref={listRef}
                      className="bg-white"
                      height={height}
                      itemCount={numPages}
                      itemSize={
                        pageHeight ? pageHeight * pageScale : height * pageScale
                      }
                      width={width}
                    >
                      {({ index, style }) =>
                        renderPage({ index, style, width })
                      }
                    </List>
                    {listRef.current?.scrollToItem(10, "start")}
                  </>
                )}
              </Document>
            </div>
          )
        }}
      </AutoSizer>
    </div>
  ) : (
    <div className="flex flex-auto flex-col items-center">
      {!pdfTest && (
        <div className="text-white">
          <label htmlFor="file">Load from file:</label>{" "}
          <input onChange={onFileChange} type="file" />
        </div>
      )}

      <div
        className="Example__container__document custom-read-aloud"
        ref={setContainerRef}
      >
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          options={options}
        >
          {Array.from(new Array(numPages), (el, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              width={containerWidth ? containerWidth : maxWidth}
            />
          ))}
        </Document>
      </div>
    </div>
  )
}
