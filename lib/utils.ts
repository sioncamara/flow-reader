import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PDFPageProxy } from "pdfjs-dist"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function processSpan(
  span: Element,
  index: number,
  textCountMap: { [key: string]: number },
) {
  const text = span.textContent
  if (text) {
    const key = `${text}-${index}`
    textCountMap[key] = (textCountMap[key] || 0) + 1
  }
}

export function setAriaHiddenAttribute(
  span: Element,
  index: number,
  textCountMap: { [key: string]: number },
) {
  const text = span.textContent
  if (text) {
    const key = `${text}-${index}`
    const count = textCountMap[key]

    if (count > 1 || isNumberOnly(text)) {
      span.setAttribute("aria-hidden", "true")
    }
  }
}

function isNumberOnly(text: string | null) {
  return /^\d+$/.test(text || "")
}

export async function getCoverImage(page: PDFPageProxy): Promise<string> {
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
