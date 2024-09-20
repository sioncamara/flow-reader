import { useEffect, useState } from "react"

function getMainLanguage(langTag: string): string {
  return langTag.split("-")[0]
}

function groupLanguages(languages: string[]): { [key: string]: string[] } {
  const groups: { [key: string]: string[] } = {}
  const singleDialectLanguages: string[] = []

  languages.forEach((lang) => {
    const mainLang = getMainLanguage(lang)
    if (!groups[mainLang]) {
      groups[mainLang] = []
    }
    groups[mainLang].push(lang)
  })

  for (const [mainLang, dialects] of Object.entries(groups)) {
    if (dialects.length === 1) {
      singleDialectLanguages.push(dialects[0])
      delete groups[mainLang]
    }
  }

  if (singleDialectLanguages.length > 0) {
    groups["single-dialect"] = singleDialectLanguages
  }

  return groups
}

export function useVoices() {
  const [languages, setLanguages] = useState<string[]>([])
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [groupedLanguages, setGroupedLanguages] = useState<{
    [key: string]: string[]
  }>({})

  function setData(voices: SpeechSynthesisVoice[]) {
    const langTags = Array.from(new Set(voices.map(({ lang }) => lang)))
    setLanguages(langTags)
    setVoices(voices)
    setGroupedLanguages(groupLanguages(langTags))
  }

  useEffect(() => {
    const synth = window.speechSynthesis
    if (!synth) return
    const voices = synth.getVoices()
    if (voices.length) setData(voices)
    else {
      const onVoicesChanged = () => setData(synth.getVoices())
      synth.addEventListener("voiceschanged", onVoicesChanged)
      return () => synth.removeEventListener("voiceschanged", onVoicesChanged)
    }
  }, [])

  return { languages, voices, groupedLanguages }
}
