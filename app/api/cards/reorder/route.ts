import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const ReorderCardsSchema = z.object({
  cards: z.array(z.object({ id: z.string(), order: z.number() }))
})

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    const body = await req.json()
    const { cards } = ReorderCardsSchema.parse(body)

    // Проверяем доступ к каждой карточке (по списку)
    const cardIds = cards.map(c => c.id)
    const dbCards = await db.card.findMany({
      where: { id: { in: cardIds } },
      include: {
        list: { include: { board: { include: { organization: { include: { members: true } } } } } },
      },
    })
    const userId = (session.user as any).id
    for (const card of dbCards) {
      const isMember = card.list.board.organization.members.some((m: any) => m.userId === userId)
      if (!isMember) return new NextResponse("Forbidden", { status: 403 })
    }

    // Обновляем порядок карточек в одной транзакции
    await db.$transaction(
      cards.map(c => db.card.update({ where: { id: c.id }, data: { order: c.order } }))
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[CARDS_REORDER]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 