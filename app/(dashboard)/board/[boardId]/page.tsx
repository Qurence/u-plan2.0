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

  // Кастинг session.user к any для доступа к id
  const userId = (session?.user as any)?.id

  if (!userId) {
    redirect("/sign-in")
  }

  const board = await db.board.findFirst({
    where: {
      id: params.boardId,
      organization: {
        members: {
          some: {
            userId: userId,
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
              tags: {
                include: {
                  tag: true,
                },
              },
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
      organization: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  })

  if (!board) {
    redirect("/organization")
  }

  // Проверяем, является ли пользователь админом
  const isAdmin = board.organization.members.some((m) => m.role === "ADMIN")

  return (
    <div
      className="relative min-h-screen bg-no-repeat bg-cover bg-center"
      style={{
        backgroundImage: board.image ? `url(${board.image})` : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div className="absolute inset-0 bg-black/20" />
      <BoardNavbar board={board} isAdmin={isAdmin} />
      <div className="relative pt-24">
        <BoardList boardId={board.id} lists={board.lists} />
      </div>
    </div>
  )
}
