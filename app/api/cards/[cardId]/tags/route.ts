import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { tagId } = body

    if (!tagId) {
      return NextResponse.json({ error: "Tag ID is required" }, { status: 400 })
    }

    // Проверяем доступ к карточке
    const card = await db.card.findUnique({
      where: { id: params.cardId },
      include: {
        list: {
          include: {
            board: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    })

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    const hasAccess = await db.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: card.list.board.organizationId,
      },
    })

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Проверяем, что тег принадлежит той же организации
    const tag = await db.tag.findFirst({
      where: {
        id: tagId,
        organizationId: card.list.board.organizationId,
      },
    })

    if (!tag) {
      return NextResponse.json({ error: "Tag not found or access denied" }, { status: 404 })
    }

    // Добавляем тег к карточке
    const cardTag = await db.cardTag.create({
      data: {
        cardId: params.cardId,
        tagId,
      },
      include: {
        tag: true,
      },
    })

    return NextResponse.json(cardTag)
  } catch (error) {
    console.error("Error adding tag to card:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get("tagId")

    if (!tagId) {
      return NextResponse.json({ error: "Tag ID is required" }, { status: 400 })
    }

    // Проверяем доступ к карточке
    const card = await db.card.findUnique({
      where: { id: params.cardId },
      include: {
        list: {
          include: {
            board: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    })

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    const hasAccess = await db.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: card.list.board.organizationId,
      },
    })

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Удаляем тег с карточки
    await db.cardTag.deleteMany({
      where: {
        cardId: params.cardId,
        tagId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing tag from card:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
