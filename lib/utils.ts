import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PDFPageProxy } from "pdfjs-dist"
import arrayWords from "an-array-of-english-words"
import { mostCommon10kEnWords } from "./commonEnWords"

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
      // span.setAttribute("aria-hidden", "true")
      span.remove()
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
          const leftCalcPattern =
            /left:\s*calc\(var\(--scale-factor\)\s*\*\s*(\d+(?:\.\d+)?)/
          const leftValuePattern = /left:\s*(.*?);/
          const currentStyle = nextSpan.getAttribute("style") || ""
          const leftMatch = currentStyle.match(leftCalcPattern)?.[1]
          console.log("leftMatch: ", leftMatch)
          if (leftMatch) {
            const charsRemoved =
              movedText.length - (movedText.endsWith(".") ? 1 : 0)
            console.log(
              `left: calc(var(--scale-factor) * ${leftMatch}px + ${charsRemoved}ch)`,
              `left: calc(var(--scale-factor) * ${leftMatch}px + ${charsRemoved}ch)`,
            )

            const pixelsToMove = charsRemoved * 5.2 // 5.2 is an estimate of px per char. Could cause problems in certain books.

            const newLeftValue = parseFloat(leftMatch) + pixelsToMove

            const newStyle = currentStyle.replace(
              leftValuePattern,
              `left: calc(var(--scale-factor) * ${newLeftValue.toFixed(2)}px);`,
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

const endsWithLetter = (word: string): boolean => {
  const endsWithLetterRegex = /[a-zA-Z]$/
  return endsWithLetterRegex.test(word)
}

const startsWithLetter = (word: string): boolean => {
  const startsWithLetterRegex = /^[a-zA-Z]/
  return startsWithLetterRegex.test(word)
}

const isCapitalized = (word: string): boolean => {
  const isCapitalizedRegex = /^[A-Z]/
  return isCapitalizedRegex.test(word)
}

const englishWords = new Set(arrayWords)

const englishLetters = new Set(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
)

const englishLettersMinusAandI = new Set(
  Array.from(englishLetters).filter(
    (letter) => !["a", "A", "i", "I"].includes(letter),
  ),
)

function propSuffix(str: string) {
  str = str.toLowerCase()
  let probability = 0

  // Length-based probability
  if (str.length >= 1 && str.length <= 5) probability += 0.3
  else if (str.length > 5 && str.length <= 7) probability += 0.2
  else if (str.length > 7 && str.length <= 13) probability += 0.1
  else return 0

  // Vowel check (including position)
  const vowels = str.match(/[aeiou]/g) || []
  probability += Math.min(vowels.length * 0.1, 0.3)
  if (
    vowels.length > 0 &&
    str.length - str.lastIndexOf(vowels[vowels.length - 1]) <= 2
  ) {
    probability += 0.1 // Bonus for vowel near the end
  }

  // Common suffix endings (positional patterns)
  const commonEndings = [
    "ly",
    "al",
    "ic",
    "ive",
    "ous",
    "ful",
    "less",
    "able",
    "ible",
  ]
  if (commonEndings.some((ending) => str.endsWith(ending))) probability += 0.2

  // Common starting patterns
  const commonStarts = ["un", "re", "in", "im", "il", "ir"]
  if (commonStarts.some((start) => str.startsWith(start))) probability += 0.1

  // Frequent suffixes (weighted higher)
  const frequentSuffixes = [
    "ing",
    "ed",
    "ion",
    "tion",
    "ation",
    "al",
    "ive",
    "ous",
    "ity",
  ]
  if (frequentSuffixes.includes(str)) probability += 0.3

  // Negative patterns (unlikely in suffixes)
  const negativePatternsRegex = /[jkqvwxz]|[aeiou]{3}|[^aeiou]{4}/
  if (negativePatternsRegex.test(str)) probability -= 0.2

  // Part of speech hints
  if (str.endsWith("ly")) probability += 0.1 // Likely adverb
  if (str.endsWith("ness") || str.endsWith("ity")) probability += 0.1 // Likely noun
  if (str.endsWith("ive") || str.endsWith("ous")) probability += 0.1 // Likely adjective

  return Math.max(0, Math.min(probability, 1)) // Ensure probability is between 0 and 1
}

// don't think recursion is needed with initial timeout, but my mac is fast, so keeping for redudency for now
export function combineSplitWords(
  pageNumber: number,
  initializeTextIfInitialPage: (textLayer: Element | null) => void,
  maxAttempts: number = 5,
): void {
  function attemptCombineWords(attempt: number): void {
    if (attempt > maxAttempts) {
      console.log(`Max attempts reached for page ${pageNumber}`)
      return
    }

    const page = document.querySelector(
      `.react-pdf__Page[data-page-number="${pageNumber}"]`,
    )
    if (!page) {
      console.log(`Page ${pageNumber} not found`)
      return
    }

    const textLayer = page.querySelector(
      ".react-pdf__Page__textContent.textLayer",
    )

    const spans = Array.from(
      textLayer?.querySelectorAll('span[role="presentation"]') || [],
    )

    if (spans.length === 0) {
      console.log(
        `No spans found on page ${pageNumber}, attempt ${attempt}. Retrying...`,
      )
      setTimeout(() => attemptCombineWords(attempt + 1), 500)
      return
    }

    for (let i = 0; i < spans.length - 1; i++) {
      const currentSpan = spans[i] as HTMLSpanElement
      const nextSpan = spans[i + 1] as HTMLSpanElement

      const rawCurrentWord = currentSpan.textContent || ""
      const currentWordOriginalCase = (() => {
        const match = rawCurrentWord?.match(/\S+$/) // Match the last group of non-whitespace characters
        return match ? match[0] : ""
      })()
      const currentWord = currentWordOriginalCase.toLowerCase()
      const currentWordNoPunctuation = currentWord.replace(
        /^[^a-zA-Z]+|[^a-zA-Z]+$/g,
        "",
      ) // Remove non-alphabetic characters at the start or end

      const rawNextWord = nextSpan.textContent || ""
      const nextWordOriginalCase = (() => {
        const containsAlphanumericRegex = /\S*[a-zA-Z0-9]\S*/ // accounts for rare edge cases such as ", n"
        const match = rawNextWord?.match(containsAlphanumericRegex)
        return match ? match[0] : ""
      })()
      const nextWord = nextWordOriginalCase.toLowerCase()
      const nextWordNoPunctuation = nextWord.replace(
        /^[^a-zA-Z]+|[^a-zA-Z]+$/g,
        "",
      )
      const combinedWordNoPunctuation =
        currentWordNoPunctuation + nextWordNoPunctuation

      const nextStartsWithLetter = startsWithLetter(nextWord)
      const currentEndsWithLetter = endsWithLetter(currentWord)
      const noPuncBetweenWords = currentEndsWithLetter && nextStartsWithLetter

      const hasCurrentNotNextHasCombined = (() => {
        return (
          englishWords.has(currentWordNoPunctuation) &&
          !englishWords.has(nextWordNoPunctuation) &&
          !isCapitalized(nextWordOriginalCase) &&
          (englishWords.has(currentWord + nextWordNoPunctuation) ||
            mostCommon10kEnWords.has(currentWord + nextWordNoPunctuation))
        )
      })()

      const notFirstWordSecondMightBeCombinedIs = (() => {
        return (
          noPuncBetweenWords &&
          (!englishWords.has(currentWordNoPunctuation) ||
            englishLettersMinusAandI.has(currentWord)) &&
          (!englishWords.has(nextWordNoPunctuation) ||
            !rawNextWord.includes(" ") ||
            mostCommon10kEnWords.has(currentWord + nextWordNoPunctuation)) &&
          englishWords.has(combinedWordNoPunctuation)
        )
      })()

      const threeMakesAWord = (() => {
        if (i + 2 > spans.length - 1) return false
        const secondCouldBeMiddle =
          !rawNextWord.includes(" ") &&
          startsWithLetter(rawNextWord) &&
          endsWithLetter(rawNextWord)
        if (!secondCouldBeMiddle) return false
        const rawThirdWord = spans[i + 2].textContent || ""
        const thirdWordOriginalCase = (() => {
          const match = rawThirdWord?.match(/^\S+/) // Match the first group of non-whitespace characters
          return match ? match[0] : ""
        })()
        const thirdWord = thirdWordOriginalCase.toLowerCase()
        const thirdWordNoPunctuation = thirdWord.replace(
          /^[^a-zA-Z]+|[^a-zA-Z]+$/g,
          "",
        )

        const noPuncBetweenSegments =
          currentEndsWithLetter && startsWithLetter(thirdWord)

        return (
          noPuncBetweenSegments &&
          englishWords.has(
            currentWordNoPunctuation + rawNextWord + thirdWordNoPunctuation,
          )
        )
      })()

      const nextIsLikelySuffix =
        noPuncBetweenWords &&
        englishWords.has(currentWordNoPunctuation) &&
        englishWords.has(nextWordNoPunctuation) &&
        !mostCommon10kEnWords.has(nextWordNoPunctuation) &&
        propSuffix(nextWordNoPunctuation) > 0.6 &&
        englishWords.has(combinedWordNoPunctuation)

      const combinedIsLikelyCommon = (() => {
        const bothAreWords =
          englishWords.has(currentWordNoPunctuation) &&
          englishWords.has(nextWordNoPunctuation)

        const atMostOneIsCommon =
          !mostCommon10kEnWords.has(currentWordNoPunctuation) ||
          !mostCommon10kEnWords.has(nextWordNoPunctuation)

        return (
          noPuncBetweenWords &&
          bothAreWords &&
          atMostOneIsCommon &&
          mostCommon10kEnWords.has(combinedWordNoPunctuation)
        )
      })()

      if (currentWord !== "" && nextWord !== "") {
        if (threeMakesAWord) {
          const thirdSpan = spans[i + 2] as HTMLSpanElement
          const combinedText =
            currentSpan.textContent! +
            nextSpan.textContent +
            thirdSpan.textContent
          currentSpan.textContent = combinedText
          nextSpan.remove()
          thirdSpan.remove()

          const lastWordOfCombined =
            combinedText.trim().split(/\s+/).pop()?.toLowerCase() || ""

          const needToCheckWord =
            endsWithLetter(lastWordOfCombined) &&
            !isCapitalized(lastWordOfCombined)

          if (needToCheckWord) {
            spans[i + 2] = spans[i]

            i += 1
          } else i += 2
        } else if (
          notFirstWordSecondMightBeCombinedIs ||
          hasCurrentNotNextHasCombined ||
          nextIsLikelySuffix ||
          combinedIsLikelyCommon
        ) {
          currentSpan.textContent! += nextSpan.textContent
          nextSpan.remove()
          i++
        }
      }
    }

    initializeTextIfInitialPage(textLayer)
  }

  attemptCombineWords(1)
}
