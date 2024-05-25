"use client"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from 'next/link';


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
    return (
      <Link href={`/display/${fingerprint}`} passHref>
          <DynamicBookCover
            rotate={0}
            rotateHover={35}
            width={200 * scale}
            height={300 * scale}
          >
            <Image src={image} alt="Book Cover" width={200} height={300} />
          </DynamicBookCover>
      </Link>
    )
  }
