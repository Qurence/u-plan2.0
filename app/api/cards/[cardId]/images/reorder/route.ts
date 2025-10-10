import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// PATCH - изменить порядок изображений
export async function PATCH(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { cardId } = params
    const body = await request.json()
    const { imageOrders } = body // Массив { id: string, order: number }

    if (!Array.isArray(imageOrders)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    // Проверяем доступ к карточке
    const card = await db.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: {
              include: {
                organization: {
                  include: {
                    members: {
                      where: {
                        userId: userId,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    if (card.list.board.organization.members.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Обновляем порядок всех изображений
    await Promise.all(
      imageOrders.map(({ id, order }: { id: string; order: number }) =>
        db.cardImage.update({
          where: { id },
          data: { order },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reorder images error:", error)
    return NextResponse.json(
      { error: "Failed to reorder images" },
      { status: 500 }
    )
  }
}
