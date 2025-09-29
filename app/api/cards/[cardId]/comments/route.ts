import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  req: Request,
  { params }: { params: { cardId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content } = await req.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Проверяем доступ к карточке
    const card = await db.card.findFirst({
      where: {
        id: params.cardId,
        list: {
          board: {
            organization: {
              members: {
                some: {
                  userId: userId,
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

    // Создаём комментарий
    const comment = await db.comment.create({
      data: {
        content: content.trim(),
        cardId: params.cardId,
        userId: userId,
      },
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
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error("[COMMENTS_POST]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
