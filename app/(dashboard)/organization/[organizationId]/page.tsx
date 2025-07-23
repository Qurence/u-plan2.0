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
  })

  if (!organization) {
    redirect("/organization")
  }

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
              <span>{organization.boards.length} boards</span>
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
          {organization.boards.map((board) => (
            <BoardCard key={board.id} board={{ ...board, description: board.description ?? undefined, image: board.image ?? undefined }} organizationId={params.organizationId} />
          ))}
        </div>
      </div>
    </div>
  )
}
