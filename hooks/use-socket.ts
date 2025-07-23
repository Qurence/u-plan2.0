"use client"

import { useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"

export const useSocket = () => {
  return { socket: null, isConnected: false }
}
