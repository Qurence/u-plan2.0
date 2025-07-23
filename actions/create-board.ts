"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { Session } from "next-auth"

const CreateBoardSchema = z.object({
  title: z.string().min(1, "Title is required").max(50),
  organizationId: z.string(),
  image: z.string().optional(),
})

type CreateBoardInput = z.infer<typeof CreateBoardSchema>

export async function createBoard(data: CreateBoardInput) {
  const session = await getServerSession(authOptions) as Session & { user: { id: string } }

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const { title, organizationId, image } = CreateBoardSchema.parse(data)

  try {
    const organization = await db.organization.findFirst({
      where: {
        id: organizationId,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    })

    if (!organization) {
      return { error: "Organization not found" }
    }

    const board = await db.board.create({
      data: {
        title,
        organizationId,
        image,
      },
    })

    revalidatePath(`/organization/${organizationId}`)
    return { data: { id: board.id } }
  } catch (error) {
    console.error("[CREATE_BOARD]", error)
    return { error: "Failed to create board" }
  }
}
