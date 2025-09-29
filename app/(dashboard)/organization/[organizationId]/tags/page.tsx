import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TagCreator, TagRow } from "./tags-client"

export default async function OrganizationTagsPage({ params }: { params: { organizationId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/sign-in")
  }

  const org = await db.organization.findFirst({
    where: {
      id: params.organizationId,
      members: { some: { userId: session.user.id } },
    },
    include: { tags: { orderBy: { createdAt: "desc" } } },
  })

  if (!org) redirect("/organization")

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tags</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Создать новый тег</CardTitle>
        </CardHeader>
        <CardContent>
          <TagCreator organizationId={org.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Все теги</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {org.tags.length === 0 && <div className="text-sm text-muted-foreground">Тегов пока нет</div>}
            {org.tags.map((tag) => (
              <TagRow key={tag.id} id={tag.id} name={tag.name} color={tag.color} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

