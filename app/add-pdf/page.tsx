"use client"
import PdfViewer from "@/components/PdfViewer"

export default function Home() {
  return (
    <div className="flex h-screen flex-col  items-center justify-center gap-3 pt-10">
      <h1 className="text-center text-2xl font-medium text-slate-500 ">
        File Uploader
      </h1>
      <p className="-mb-12 text-center text-slate-400">
        Note: Only PDF files are currently supported.
      </p>
      <PdfViewer />
    </div>
  )
}
