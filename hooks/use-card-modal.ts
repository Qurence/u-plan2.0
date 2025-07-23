"use client"

import { create } from "zustand"

interface CardModalStore {
  cardId?: string
  isOpen: boolean
  onOpen: (cardId: string) => void
  onClose: () => void
}

export const useCardModal = create<CardModalStore>((set) => ({
  cardId: undefined,
  isOpen: false,
  onOpen: (cardId: string) => set({ isOpen: true, cardId }),
  onClose: () => set({ isOpen: false, cardId: undefined }),
}))
