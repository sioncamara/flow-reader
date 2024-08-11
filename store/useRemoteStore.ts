import { create } from 'zustand'

type RemoteState = {
  remoteState: boolean
  toggleRemoteState: () => void
}

export const useRemoteStore = create<RemoteState>()((set) => ({
  remoteState: false,
  toggleRemoteState: () =>
    set((state) => ({ remoteState: !state.remoteState })),
}))