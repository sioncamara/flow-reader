import { create } from 'zustand'

interface PdfViewerState {
  readingPageIndex: number
  charIndexToNodeMap: { [key: number]: { node: Element; localIndex: number } } | null
  currentWordIndex: number
  setReadingPageIndex: (index: number) => void
  setCharIndexToNodeMap: (map: { [key: number]: { node: Element; localIndex: number } } | null) => void
  setCurrentWordIndex: (index: number) => void
}

export const usePdfStore = create<PdfViewerState>((set) => ({
  readingPageIndex: 0,
  charIndexToNodeMap: null,
  currentWordIndex: 0,
  setReadingPageIndex: (index) => set({ readingPageIndex: index }),
  setCharIndexToNodeMap: (map) => set({ charIndexToNodeMap: map }),
  setCurrentWordIndex: (index) => set({ currentWordIndex: index }),
}))