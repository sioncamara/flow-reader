import { FixedSizeList } from "react-window"
import { create } from "zustand"

export type CharIndexToNodeMap = {
  [key: number]: { node: Element; localIndex: number }
}

type remoteState = {
  readingPageIndex: number

  currTextPageIndex: number
  isPaused: boolean
  isPlaying: boolean
  reachedUtteranceEnd: boolean
  utterance: SpeechSynthesisUtterance | null
  rate: number
  lang: string
  voiceName: string
  combinedText: string
  charIndexToNodeMap: CharIndexToNodeMap | null
  wordSelectedOnOtherPage: boolean
  setReadingPageIndex: (readingPageIndex: number) => void
  setCurrTextPageIndex: (currTextPageIndex: number) => void
  setIsPaused: (isPaused: boolean) => void
  setIsPlaying: (isPlaying: boolean) => void
  setReachedUtteranceEnd: (reachedUtteranceEnd: boolean) => void
  setUtterance: (utterance: SpeechSynthesisUtterance | null) => void
  setRate: (rate: number) => void
  setLang: (lang: string) => void
  setVoiceName: (voiceURI: string) => void
  setCombinedText: (text: string) => void
  setCharIndexToNodeMap: (charIndexToNodeMap: CharIndexToNodeMap) => void
  listRef: FixedSizeList<any> | null
  setListRef: (ref: FixedSizeList<any> | null) => void
  setWordSelectedOnOtherPage: (wordSelectedOnOtherPage: boolean) => void
  resetStore: () => void
}

const initialState = {
  readingPageIndex: 0,
  currTextPageIndex: 0,
  isPaused: false,
  isPlaying: false,
  reachedUtteranceEnd: false,
  utterance: null,
  rate: 1.0,
  lang: "en-US",
  voiceName:
    "Microsoft AndrewMultilingual Online (Natural) - English (United States)",
  combinedText: "",
  charIndexToNodeMap: null,
  listRef: null,
  wordSelectedOnOtherPage: false,
}

export const useRemoteStore = create<remoteState>((set) => ({
  ...initialState,
  setWordSelectedOnOtherPage: (wordSelectedOnOtherPage) =>
    set({ wordSelectedOnOtherPage }),
  setReadingPageIndex: (readingPageIndex) => set({ readingPageIndex }),
  setCurrTextPageIndex: (currTextPageIndex) => set({ currTextPageIndex }),
  setIsPaused: (isPaused) => set({ isPaused }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setReachedUtteranceEnd: (reachedUtteranceEnd) => set({ reachedUtteranceEnd }),
  setUtterance: (utterance) => set({ utterance }),
  setRate: (rate) => set({ rate }),
  setLang: (lang) => set({ lang }),
  setVoiceName: (voiceURI) => set({ voiceName: voiceURI }),
  setCombinedText: (combinedText) => set({ combinedText }),
  setCharIndexToNodeMap: (charIndexToNodeMap) => set({ charIndexToNodeMap }),
  setListRef: (listRef) => set({ listRef }),
  resetStore: () => set(initialState),
}))
