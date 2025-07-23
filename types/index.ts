import type { User, Organization, Board, List, Card, Comment, Activity, OrganizationMember } from "@prisma/client"
import type { NextApiResponse } from "next"
import type { Socket } from "socket.io"
import type { Server as NetServer } from "net"
import type { Server as ServerIO } from "socket.io"

export type ListWithCards = List & {
  cards: Card[]
}

export type BoardWithLists = Board & {
  lists: ListWithCards[]
}

export type CardWithDetails = Card & {
  assignee?: User
  comments: (Comment & {
    user: User
  })[]
}

export type OrganizationWithMembers = Organization & {
  members: (OrganizationMember & {
    user: User
  })[]
  _count: {
    boards: number
  }
}

export type ActivityWithDetails = Activity & {
  user: User
  board?: Board
  card?: Card
}

export interface NextApiResponseServerIO extends NextApiResponse {
  socket: Socket & {
    server: NetServer & {
      io: ServerIO
    }
  }
}
