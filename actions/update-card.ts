"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const UpdateCardSchema = z.object({
  id: z.string(),
  boardId: z.string(),
  title: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
})

type UpdateCardInput = z.infer<typeof UpdateCardSchema>

export async function updateCard(data: UpdateCardInput) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const { id, boardId, ...values } = UpdateCardSchema.parse(data)

  try {
    const board = await db.board.findFirst({
      where: {
        id: boardId,
        organization: {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
    })

    if (!board) {
      throw new Error("Board not found")
    }

    const card = await db.card.update({
      where: { id },
      data: values,
    })

    await db.activity.create({
      data: {
        type: "CARD_UPDATED",
        userId: session.user.id,
        boardId,
        cardId: card.id,
        data: {
          cardTitle: card.title,
        },
      },
    })

    revalidatePath(`/board/${boardId}`)
    return card
  } catch (error) {
    console.error("[UPDATE_CARD]", error)
    throw new Error("Failed to update card")
  }
}
