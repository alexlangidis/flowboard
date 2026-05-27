import { create } from 'zustand'

type UiState = {
  sidebarOpen: boolean
  activeCardModalId: string | null
  openSidebar: () => void
  closeSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setActiveCardModalId: (cardId: string) => void
  clearActiveCardModalId: () => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  activeCardModalId: null,
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setActiveCardModalId: (activeCardModalId) => set({ activeCardModalId }),
  clearActiveCardModalId: () => set({ activeCardModalId: null }),
}))
