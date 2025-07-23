"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const CreateCardSchema = z.object({
  title: z.string().min(1, "Title is required").max(50),
  listId: z.string(),
  boardId: z.string(),
})

type CreateCardInput = z.infer<typeof CreateCardSchema>

export async function createCard(data: CreateCardInput) {
  const session = await getServerSession(authOptions) as any

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const { title, listId, boardId } = CreateCardSchema.parse(data)

  try {
    // Проверяем доступ к доске
    const board = await db.board.findFirst({
      where: {
        id: boardId,
        organization: {
          members: {
            some: {
              userId: (session.user as any).id,
            },
          },
        },
      },
    })

    if (!board) {
      return { error: "Board not found" }
    }

    // Получаем последний порядок в списке
    const lastCard = await db.card.findFirst({
      where: { listId },
      orderBy: { order: "desc" },
    })

    const card = await db.card.create({
      data: {
        title,
        listId,
        order: lastCard ? lastCard.order + 1 : 1,
      },
    })

    // Создаем активность
    await db.activity.create({
      data: {
        type: "CARD_CREATED",
        userId: (session.user as any).id,
        boardId,
        cardId: card.id,
        data: {
          cardTitle: title,
          listTitle: "List Title", // Можно получить из базы
        },
      },
    })

    revalidatePath(`/board/${boardId}`)
    return { data: card }
  } catch (error) {
    console.error("[CREATE_CARD]", error)
    return { error: "Failed to create card" }
  }
}
