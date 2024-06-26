"use client"
import React, { useEffect, useState } from "react"
import { openDB, IDBPDatabase } from "idb"
import { PdfStore } from "@/components/PdfViewer"
import BookCover from "@/components/BookCover"
import { redirect } from "next/navigation"

export default function Home() {
  const [library, setLibrary] = useState<
    { fingerprint: string; coverImage: string }[]
  >([])
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    let db: IDBPDatabase<PdfStore>
    const dbVersion = 1

    const fetchImages = async () => {
      try {
        db = await openDB<PdfStore>("PdfDatabase", dbVersion, {
          upgrade(db) {
            if (!db.objectStoreNames.contains("pdfs")) {
              db.createObjectStore("pdfs")
              console.log("created pdfs store")
            }
          },
        })
        const tx = db.transaction("pdfs", "readonly")
        const store = tx.objectStore("pdfs")

        const allImages = await store
          .getAll()
          .then((items) => items.map((item) => item.coverImage))
        const allFingerprints = await store.getAllKeys()

        if (allFingerprints.length === 0) {
          setShouldRedirect(true)
        } else {
          setLibrary(
            allFingerprints.map((fingerprint, index) => ({
              fingerprint,
              coverImage: allImages[index],
            })),
          )
        }
      } catch (error) {
        console.error("Failed to fetch images from database:", error)
        setShouldRedirect(true)
      }
    }

    fetchImages()

    return () => {
      if (db) {
        db.close()
      }
    }
  }, [])

  useEffect(() => {
    if (shouldRedirect) {
      redirect("/add-pdf")
    }
  }, [shouldRedirect])

  const xlScale = 1.5
  return (
    <div className="flex flex-wrap justify-center gap-x-10 gap-y-16">
      {library.map(({ fingerprint, coverImage }) => (
        <BookCover
          key={fingerprint}
          fingerprint={fingerprint}
          image={coverImage}
          scale={xlScale}
        />
      ))}
    </div>
  )
}
