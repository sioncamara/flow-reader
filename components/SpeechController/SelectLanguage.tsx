import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useVoices } from "@/lib/hooks"
import { languageMap } from "@/lib/languages"

const SelectLanguage = ({
  lang,
  setLang,
}: {
  lang: string
  setLang: (lang: string) => void
}) => {
  const { groupedLanguages } = useVoices()

  function getDialect(langTag: string): string {
    const parts = langTag.split("-")
    return parts.length > 1 ? parts.slice(1).join("-") : ""
  }

  return (
    <Select value={lang} onValueChange={setLang}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select a language" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(groupedLanguages).map(([key, languages]) => {
          if (key === "single-dialect") {
            return (
              <SelectGroup key={key}>
                <SelectLabel>Other Languages</SelectLabel>
                {languages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {languageMap[lang.split("-")[0]].toLowerCase()}
                  </SelectItem>
                ))}
              </SelectGroup>
            )
          } else {
            return (
              <SelectGroup key={key}>
                <SelectLabel>
                  {languageMap[key]
                    ? languageMap[key].charAt(0).toUpperCase() + languageMap[key].slice(1)
                    : key.toUpperCase()}
                </SelectLabel>
                {languages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {`${languageMap[key]?.toLowerCase() || key} (${getDialect(lang)})`}
                  </SelectItem>
                ))}
              </SelectGroup>
            );
          }
        })}
      </SelectContent>
    </Select>
  )
}

export default SelectLanguage
