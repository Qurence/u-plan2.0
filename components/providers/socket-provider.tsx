"use client"

import type React from "react"

import { createContext, useContext } from "react"
import type { Socket } from "socket.io-client"
import { useSocket } from "@/hooks/use-socket"

type SocketContextType = {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
})

export const useSocketContext = () => {
  return useContext(SocketContext)
}

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { socket, isConnected } = useSocket()

  return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>
}
