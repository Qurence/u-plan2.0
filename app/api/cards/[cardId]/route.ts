import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const card = await db.card.findUnique({
      where: {
        id: params.cardId,
      },
      include: {
        assignee: true,
        comments: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
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

    // Проверяем доступ к карточке через организацию
    const hasAccess = await db.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: card.list.board.organizationId,
      },
    })

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json(card)
  } catch (error) {
    console.error("Error fetching card:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, dueDate, assigneeId } = body

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

    const updatedCard = await db.card.update({
      where: { id: params.cardId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(assigneeId !== undefined && { assigneeId }),
      },
      include: {
        assignee: true,
        comments: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json(updatedCard)
  } catch (error) {
    console.error("Error updating card:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
