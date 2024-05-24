"use client"
import { useParams } from 'next/navigation';
import { useEffect, useState } from "react"
import { openDB } from "idb"
import PdfViewer from "@/components/PdfViewer"
import type { PdfStore } from "@/components/PdfViewer"

const PdfPage = () => {
  const { fingerprint } = useParams()
  const [pdf, setPdf] = useState<Uint8Array | null>(null)

  useEffect(() => {
    const fetchPdf = async () => {
      if (typeof fingerprint === "string") {
        const dbName = "PdfDatabase"
        const storeName = "pdfs"
        try {
          const db = await openDB<PdfStore>(dbName)
          const pdfData = await db.get(storeName, fingerprint)
          if (pdfData && pdfData.pdfFile) {
            const arrayBuffer = await pdfData.pdfFile.arrayBuffer()
            const pdfArray = new Uint8Array(arrayBuffer)
            setPdf(pdfArray)
          } else {
            console.error("PDF or PDF file is undefined")
          }
        } catch (error) {
          console.error(error)
        }
      }
    }

    fetchPdf()
  }, [fingerprint])

  return <>{pdf ? <PdfViewer pdfTest={pdf} fingerprint={fingerprint as string} /> : <p>Loading PDF...</p>}</>
}

export default PdfPage
