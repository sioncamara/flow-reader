import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import Image from "next/image"
import SelectLanguage from "./SelectLanguage"

type SelectVoiceProps = {
  voices: SpeechSynthesisVoice[]
  voiceName?: string
  selectedVoice: SpeechSynthesisVoice | undefined
  handleVoiceChange: (voiceName: string) => void
  lang: string
  setLang: (newLang: string) => void
}

const formatVoiceName = (
  voice: SpeechSynthesisVoice,
  isPremium: boolean,
): string => {
  const nameParts = voice.name.split(" ")

  if (isPremium) {
    if (nameParts.length > 1) {
      let name = nameParts[1]
      const isMultilingual = name.includes("Multilingual")
      name = name.replace("Multilingual", "").trim()
      return `${name}${isMultilingual ? " (Multilingual)" : ""}`
    }
    return voice.name
  } else {
    if (nameParts.length === 1) {
      return nameParts[0]
    } else if (nameParts[1].startsWith("(")) {
      return nameParts[0]
    } else {
      return `${nameParts[0]} ${nameParts[1]}`
    }
  }
}

const SelectVoice = ({
  voices,
  voiceName,
  selectedVoice,
  handleVoiceChange,
  lang,
  setLang,
}: SelectVoiceProps) => {
  const sortedVoices = voices.sort((a, b) => {
    const aIsMicrosoft = a.name.toLowerCase().startsWith("microsoft")
    const bIsMicrosoft = b.name.toLowerCase().startsWith("microsoft")
    if (aIsMicrosoft && !bIsMicrosoft) return -1
    if (!aIsMicrosoft && bIsMicrosoft) return 1
    return a.name.localeCompare(b.name)
  })

  if (!selectedVoice && typeof window !== "undefined") {
    const defaultVoice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.default)
    console.log("defaultVoice", defaultVoice)
    selectedVoice = defaultVoice
  }

  const isPremiumSelected =
    selectedVoice?.name.toLowerCase().startsWith("microsoft") ?? false

  const formattedSelectedName = selectedVoice
    ? formatVoiceName(selectedVoice, isPremiumSelected).replace(
        " (Multilingual)",
        "",
      )
    : ""

  return (
    <>
      <Select value={voiceName} onValueChange={handleVoiceChange}>
        <div className="flex flex-col items-center ">
          <SelectTrigger
            useDefaultTrigger={false}
            className="max-w-fit focus:outline-none"
          >
            {selectedVoice && (
              <div
                className={`-mt-1 rounded-full  ${isPremiumSelected ? "outline outline-2 outline-offset-2 outline-amber-500 hover:outline-amber-600" : "outline outline-2 outline-offset-2 outline-sky-500 hover:outline-sky-600"}`}
              >
                <Image
                  alt="Selected Voice Avatar"
                  className="overflow-hidden rounded-full"
                  height={26}
                  src={
                    isPremiumSelected
                      ? "/AI-voice.png"
                      : "/placeholder-user.jpg"
                  }
                  style={{
                    aspectRatio: "24/24",
                    objectFit: "cover",
                  }}
                  width={26}
                />
              </div>
            )}
          </SelectTrigger>
          <span className=" absolute -bottom-0.5 text-xs">
            {formattedSelectedName}
          </span>
        </div>
        <SelectContent className="-ml-24">
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white pb-2 dark:border-slate-700 dark:bg-slate-800">
            <SelectLanguage lang={lang} setLang={setLang} />
          </div>
          {sortedVoices.map((voice) => {
            const isPremium = voice.name.toLowerCase().startsWith("microsoft")
            const formattedName = formatVoiceName(voice, isPremium)
            return (
              <SelectItem
                key={`${voice.voiceURI}-${voice.lang}-${voice.default}`}
                value={voice.name}
              >
                <div className="flex items-center gap-3 p-1">
                  <div
                    className={`rounded-full  ${isPremium ? "outline outline-2 outline-offset-2 outline-amber-500" : "border-2 border-blue-500"}`}
                  >
                    <Image
                      alt="Voice Avatar"
                      className="overflow-hidden rounded-full"
                      height={24}
                      src={
                        isPremium ? "/AI-voice.png" : "/placeholder-user.jpg"
                      }
                      style={{
                        aspectRatio: "24/24",
                        objectFit: "cover",
                      }}
                      width={24}
                    />
                  </div>
                  <span>{formattedName}</span>
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </>
  )
}

export default SelectVoice
