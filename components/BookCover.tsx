"use client"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

const DynamicBookCover = dynamic(
  () => import("book-cover-3d").then((mod) => mod.BookCover),
  {
    ssr: false,
  },
)

type BookCoverWrapperProps = {
  image: string
  fingerprint: string
  scale: number
}

export default function BookCover({
  image,
  fingerprint,
  scale,
}: BookCoverWrapperProps) {
  const [shadowColor, setShadowColor] = useState("#aaaaaa")

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (e: MediaQueryListEvent) => {
      setShadowColor(e.matches ? "#4d4747" : "#aaaaaa")
    }
    setShadowColor(mediaQuery.matches ? "#4d4747" : "#aaaaaa")

    mediaQuery.addEventListener("change", handleChange)

    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return (
    <Link href={`/display/${fingerprint}`} passHref>
      <DynamicBookCover
        rotate={0}
        rotateHover={35}
        width={200 * scale}
        height={300 * scale}
        shadowColor={shadowColor}
      >
        <Image src={image} alt="Book Cover" width={200} height={300} />
      </DynamicBookCover>
    </Link>
  )
}
