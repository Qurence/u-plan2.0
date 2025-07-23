import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const MoveCardSchema = z.object({
  listId: z.string(),
  order: z.number().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { cardId: string } }) {
  try {
    const session = await getServerSession(authOptions) as any
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    const body = await req.json()
    const { listId, order } = MoveCardSchema.parse(body)

    // Получаем карточку и проверяем доступ
    const card = await db.card.findUnique({
      where: { id: params.cardId },
      include: {
        list: { include: { board: { include: { organization: { include: { members: true } } } } } },
      },
    })
    if (!card) return new NextResponse("Card not found", { status: 404 })
    const userId = (session.user as any).id
    const isMember = card.list.board.organization.members.some((m: any) => m.userId === userId)
    if (!isMember) return new NextResponse("Forbidden", { status: 403 })

    // Если не передан order, ставим в конец списка
    let newOrder = order
    if (typeof newOrder !== "number") {
      const last = await db.card.findFirst({
        where: { listId },
        orderBy: { order: "desc" },
      })
      newOrder = last ? last.order + 1 : 1
    }

    const updated = await db.card.update({
      where: { id: params.cardId },
      data: { listId, order: newOrder },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("[CARD_MOVE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 