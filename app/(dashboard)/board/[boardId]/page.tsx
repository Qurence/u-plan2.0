import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { BoardNavbar } from "@/components/board/board-navbar"
import { BoardList } from "@/components/board/board-list"

interface BoardPageProps {
  params: {
    boardId: string
  }
}

export default async function BoardPage({ params }: BoardPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/sign-in")
  }

  const board = await db.board.findFirst({
    where: {
      id: params.boardId,
      organization: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    },
    include: {
      lists: {
        include: {
          cards: {
            include: {
              assignee: true,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      },
      organization: true,
    },
  })

  if (!board) {
    redirect("/organization")
  }

  return (
    <div
      className="relative min-h-screen bg-no-repeat bg-cover bg-center"
      style={{
        backgroundImage: board.image ? `url(${board.image})` : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div className="absolute inset-0 bg-black/20" />
      <BoardNavbar board={board} />
      <div className="relative pt-32">
        <BoardList boardId={board.id} lists={board.lists} />
      </div>
    </div>
  )
}
