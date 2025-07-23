import type { Server as NetServer } from "http"
import type { NextApiRequest } from "next"
import { Server as ServerIO } from "socket.io"
import type { NextApiResponseServerIO } from "@/types"

export const config = {
  api: {
    bodyParser: false,
  },
}

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const path = "/api/socket/io"
    const httpServer: NetServer = res.socket.server as any
    const io = new ServerIO(httpServer, {
      path: path,
      addTrailingSlash: false,
    })

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id)

      // Присоединение к комнате доски
      socket.on("join-board", (boardId: string) => {
        socket.join(`board:${boardId}`)
        console.log(`User ${socket.id} joined board:${boardId}`)
      })

      // Покидание комнаты доски
      socket.on("leave-board", (boardId: string) => {
        socket.leave(`board:${boardId}`)
        console.log(`User ${socket.id} left board:${boardId}`)
      })

      // Обновление карточки
      socket.on("card-updated", (data) => {
        socket.to(`board:${data.boardId}`).emit("card-updated", data)
      })

      // Перемещение карточки
      socket.on("card-moved", (data) => {
        socket.to(`board:${data.boardId}`).emit("card-moved", data)
      })

      // Новый комментарий
      socket.on("comment-added", (data) => {
        socket.to(`board:${data.boardId}`).emit("comment-added", data)
      })

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id)
      })
    })

    res.socket.server.io = io
  }

  res.end()
}

export default ioHandler
