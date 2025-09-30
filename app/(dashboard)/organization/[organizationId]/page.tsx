import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { BoardCard } from "@/components/board/board-card"
import { CreateBoardButton } from "@/components/board/create-board-button"
import { Separator } from "@/components/ui/separator"

interface OrganizationPageProps {
  params: {
    organizationId: string
  }
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const session = await getServerSession(authOptions)

  const userId = (session?.user && (session.user as any).id) ? (session.user as any).id as string : undefined;
  if (!userId) {
    redirect("/sign-in");
  }

  const organization = await db.organization.findFirst({
    where: {
      id: params.organizationId,
      members: {
        some: {
          userId: userId,
        },
      },
    },
    include: {
      members: {
        where: { userId },
      },
      boards: {
        include: {
          _count: {
            select: {
              lists: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  }) as any

  if (!organization) {
    redirect("/organization")
  }

  // Получаем информацию о текущем пользователе
  const currentMember = organization.members[0]
  const isAdmin = currentMember?.role === "ADMIN"

  // Получаем доски с их разрешенными ролями
  const boardsWithRoles = await Promise.all(
    organization.boards.map(async (board: any) => {
      const allowedRoles = await (db as any).boardRole.findMany({
        where: { boardId: board.id },
        include: { customRole: true },
      })
      return { ...board, allowedRoles }
    })
  )

  // Фильтруем доски на основе прав доступа
  const accessibleBoards = isAdmin
    ? boardsWithRoles // Админ видит все доски
    : boardsWithRoles.filter((board: any) => {
        // Если у доски нет ограничений по ролям - доступна всем
        if (board.allowedRoles.length === 0) {
          return true
        }
        // Проверяем, есть ли у пользователя одна из разрешенных ролей
        if (currentMember?.customRoleId) {
          return board.allowedRoles.some(
            (br: any) => br.customRoleId === currentMember.customRoleId
          )
        }
        return false
      })

  return (
    <div className="w-full mb-20">
      <div className="px-6 py-4">
        <div className="flex items-center gap-x-4">
          <div className="w-[60px] h-[60px] relative">
            <img
              src={organization.image || "/placeholder.svg?height=60&width=60"}
              alt={organization.name}
              className="rounded-md object-cover w-full h-full"
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">{organization.name}</h1>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>{accessibleBoards.length} boards</span>
            </div>
          </div>
        </div>
      </div>
      <Separator className="mb-4" />
      <div className="px-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Your boards</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <CreateBoardButton organizationId={params.organizationId} />
          {accessibleBoards.map((board) => (
            <BoardCard key={board.id} board={{ ...board, description: board.description ?? undefined, image: board.image ?? undefined }} organizationId={params.organizationId} />
          ))}
        </div>
      </div>
    </div>
  )
}
