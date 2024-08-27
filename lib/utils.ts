import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PDFPageProxy } from "pdfjs-dist"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function processSpan(
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

function setAriaHiddenAttribute(
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

export function hideRepeateText() {
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

export function combineNestedSpans() {
  const pages = document.querySelectorAll(".react-pdf__Page")

  pages.forEach((page) => {
    const textLayer = page.querySelector(
      ".react-pdf__Page__textContent.textLayer",
    )
    if (textLayer) {
      const markedContentSpans = textLayer.querySelectorAll(".markedContent")
      markedContentSpans.forEach((markedContentSpan) => {
        const nestedSpans = Array.from(
          markedContentSpan.querySelectorAll('span[role="presentation"]'),
        )
        let parentSpan: HTMLSpanElement | null = null

        nestedSpans.forEach((span) => {
          const nextSibling = span.nextElementSibling

          if (
            nextSibling &&
            nextSibling.tagName === "SPAN" &&
            nextSibling.getAttribute("role") === "presentation"
          ) {
            if (!parentSpan) {
              parentSpan = document.createElement("span")
              parentSpan.setAttribute("role", "presentation")
              parentSpan.setAttribute("dir", "ltr")
              parentSpan.style.cssText = (span as HTMLSpanElement).style.cssText
              if (span.parentNode === markedContentSpan) {
                markedContentSpan.insertBefore(parentSpan, span)
              }
            }
            parentSpan.innerHTML += span.innerHTML + " "
            span.remove()
          } else {
            if (parentSpan) {
              parentSpan.innerHTML += span.innerHTML
              span.remove()
              parentSpan = null
            }
          }
        })
      })
    }
  })
}

export function handleHyphenatedWords() {
  const pages = document.querySelectorAll(".react-pdf__Page")

  pages.forEach((page) => {
    const textLayer = page.querySelector(
      ".react-pdf__Page__textContent.textLayer",
    )
    if (!textLayer) return

    const markedContentSpans = Array.from(
      textLayer.querySelectorAll(".markedContent"),
    )

    markedContentSpans.forEach((markedContentSpan, markedIndex) => {
      const hyphenSpan = markedContentSpan.querySelector(
        'span[role="presentation"]',
      )

      if (!hyphenSpan || hyphenSpan.innerHTML !== "-") return

      const nextMarkedContentSpan = markedContentSpans[markedIndex + 1]
      const nextSpan = nextMarkedContentSpan?.querySelector(
        'span[role="presentation"]',
      )
      if (!nextSpan) return

      const nextSpanText = nextSpan.innerHTML

      const firstSpaceIndex = nextSpanText.indexOf(" ")

      if (markedIndex > 0) {
        const prevMarkedContentSpan = markedContentSpans[markedIndex - 1]
        const prevSpan = prevMarkedContentSpan.querySelector(
          'span[role="presentation"]',
        )
        if (!prevSpan) return

        if (firstSpaceIndex !== -1) {
          // Move the second half of the hyphenated word to the previous span
          const movedText = nextSpanText.slice(0, firstSpaceIndex)
          prevSpan.innerHTML += hyphenSpan.innerHTML.slice(0, -1) + movedText
          // Update the next span to remove the moved part
          nextSpan.innerHTML = nextSpanText.slice(firstSpaceIndex)

          // Adjust the left position of the next span
          const leftCalcPattern = /left:\s*calc\(var\(--scale-factor\)\s*\*\s*(\d+(?:\.\d+)?)/
           const leftValuePattern = /left:\s*(.*?);/
          const currentStyle = nextSpan.getAttribute("style") || ""
          const leftMatch = currentStyle.match(leftCalcPattern)?.[1]
          console.log('leftMatch: ', leftMatch);
          if (leftMatch) {
            const charsRemoved = movedText.length - (movedText.endsWith('.') ? 1 : 0)
            console.log(`left: calc(var(--scale-factor) * ${leftMatch}px + ${charsRemoved}ch)`, `left: calc(var(--scale-factor) * ${leftMatch}px + ${charsRemoved}ch)`);
            
            const newStyle = currentStyle.replace(
              leftValuePattern,
              `left: calc(var(--scale-factor) * ${leftMatch}px + ${charsRemoved}ch);`,
            )
            nextSpan.setAttribute("style", newStyle)
          }
        } else {
          // If there's no space, move the entire next span content
          prevSpan.innerHTML += hyphenSpan.innerHTML.slice(0, -1) + nextSpanText
          nextSpan.remove()
        }
        markedContentSpan.remove()
      }
    })
  })
}

export function combineSpans() {
  const pages = document.querySelectorAll(".react-pdf__Page")

  pages.forEach((page) => {
    const textLayer = page.querySelector(
      ".react-pdf__Page__textContent.textLayer",
    )
    if (textLayer) {
      const spans = Array.from(
        textLayer.querySelectorAll('span[role="presentation"]'),
      )
      let parentSpan: HTMLSpanElement | null = null

      spans.forEach((span) => {
        const nextSibling = span.nextElementSibling // assumes that there should be a br between spans

        if (
          nextSibling &&
          nextSibling.tagName === "SPAN" &&
          nextSibling.getAttribute("role") === "presentation"
        ) {
          if (!parentSpan) {
            parentSpan = document.createElement("span")
            parentSpan.setAttribute("role", "presentation")
            parentSpan.setAttribute("dir", "ltr")
            parentSpan.style.cssText = (span as HTMLSpanElement).style.cssText
            textLayer.insertBefore(parentSpan, span)
          }
          parentSpan.innerHTML += span.innerHTML + " "
          span.remove()
        } else {
          if (parentSpan) {
            parentSpan.innerHTML += span.innerHTML
            span.remove()
            parentSpan = null
          }
        }
      })
    }
  })
}
