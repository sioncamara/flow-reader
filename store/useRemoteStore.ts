import { FixedSizeList } from 'react-window';
import { create } from 'zustand'

type  CharIndexToNodeMap = {
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
  voiceURI: string
  combinedText: string
  charIndexToNodeMap: CharIndexToNodeMap | null
  setReadingPageIndex: (readingPageIndex: number) => void
  setCurrTextPageIndex: (currTextPageIndex: number) => void
  setIsPaused: (isPaused: boolean) => void
  setIsPlaying: (isPlaying: boolean) => void
  setReachedUtteranceEnd: (reachedUtteranceEnd: boolean) => void
  setUtterance: (utterance: SpeechSynthesisUtterance | null) => void
  setRate: (rate: number) => void
  setLang: (lang: string) => void
  setVoiceURI: (voiceURI: string) => void
  setCombinedText: (text: string) => void
  setCharIndexToNodeMap: (charIndexToNodeMap: CharIndexToNodeMap) => void
  listRef: FixedSizeList<any> | null
  setListRef: (ref: FixedSizeList<any> | null) => void
}

export const useRemoteStore = create<remoteState>((set) => ({
  readingPageIndex: 0,
  currTextPageIndex: 0,
  isPaused: false,
  isPlaying: false,
  reachedUtteranceEnd: false,
  utterance: null,
  rate: 2.4,
  lang: 'en-US',
  voiceURI: 'Microsoft Guy Online (Natural) - English (United States)',
  combinedText: '',
  charIndexToNodeMap: null,
  listRef: null,
  setReadingPageIndex: (readingPageIndex) => set({ readingPageIndex }),
  setCurrTextPageIndex: (currTextPageIndex) => set({ currTextPageIndex }),
  setIsPaused: (isPaused) => set({ isPaused }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setReachedUtteranceEnd: (reachedUtteranceEnd) => set({ reachedUtteranceEnd }),
  setUtterance: (utterance) => set({ utterance }),
  setRate: (rate) => set({ rate }),
  setLang: (lang) => set({ lang }),
  setVoiceURI: (voiceURI) => set({ voiceURI }),
  setCombinedText: (combinedText) => set({ combinedText }),
  setCharIndexToNodeMap: (charIndexToNodeMap) => set({ charIndexToNodeMap }),
  setListRef: (listRef) => set({ listRef }),
}))