import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { AddMemberForm, MembersList } from "./members-client"
import { RolesEditorDialog } from "./roles-editor"

interface MembersPageProps {
  params: {
    organizationId: string
  }
}

export default async function MembersPage({ params }: MembersPageProps) {
  const session = await getServerSession(authOptions)

  const userId = (session?.user && (session.user as any).id) ? (session.user as any).id as string : undefined
  if (!userId) {
    redirect("/sign-in")
  }

  // Проверяем, что пользователь является членом организации
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
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
  })

  if (!organization) {
    redirect("/organization")
  }

  // Проверяем, является ли пользователь админом
  const isAdmin = organization.members.some(
    (m) => m.userId === userId && m.role === "ADMIN"
  )

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Участники</h1>
          <p className="text-muted-foreground mt-1">
            Управление участниками организации {organization.name}
          </p>
        </div>
        {isAdmin && <RolesEditorDialog organizationId={params.organizationId} />}
      </div>

      {isAdmin && (
        <AddMemberForm organizationId={params.organizationId} />
      )}

      <MembersList organizationId={params.organizationId} isAdmin={isAdmin} />
    </div>
  )
}
