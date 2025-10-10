import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { imagekit } from "@/lib/imagekit"

export async function GET(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) {
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
        images: {
          orderBy: {
            order: "asc",
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
        userId: userId,
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
    const userId = (session?.user as any)?.id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, dueDate, assigneeId, showCover } = body

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
        userId: userId,
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
        ...(showCover !== undefined && { showCover }),
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
        images: {
          orderBy: {
            order: "asc",
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
        userId: userId,
        organizationId: card.list.board.organizationId,
      },
    })

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Получаем все изображения карточки для удаления из ImageKit
    const images = await db.cardImage.findMany({
      where: { cardId: params.cardId },
    })

    // Удаляем карточку (каскадно удалятся и записи об изображениях)
    await db.card.delete({
      where: { id: params.cardId },
    })

    // Удаляем файлы и папку из ImageKit
    if (images.length > 0 && imagekit) {
      try {
        // Удаляем все файлы
        for (const image of images) {
          try {
            await imagekit.deleteFile(image.fileId)
          } catch (error) {
            console.error(`Failed to delete file ${image.fileId}:`, error)
          }
        }
        
        // Удаляем папку карточки
        await imagekit.deleteFolder(`/cards/${params.cardId}`)
      } catch (error) {
        console.error("ImageKit cleanup error:", error)
        // Не критично, если не удалось очистить ImageKit
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting card:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
