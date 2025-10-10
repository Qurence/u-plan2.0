import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { imagekit } from "@/lib/imagekit"

// GET - получить все изображения карточки
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

    const { cardId } = params

    const images = await db.cardImage.findMany({
      where: { cardId },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(images)
  } catch (error) {
    console.error("Get card images error:", error)
    return NextResponse.json(
      { error: "Failed to get images" },
      { status: 500 }
    )
  }
}

// POST - добавить изображение к карточке
export async function POST(
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
    const { fileId, url, thumbnailUrl, name, size } = body

    // Проверяем, существует ли карточка
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

    // Проверяем права доступа
    if (card.list.board.organization.members.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Создаем запись об изображении
    const image = await db.cardImage.create({
      data: {
        cardId,
        fileId,
        url,
        thumbnailUrl,
        name,
        size,
      },
    })

    return NextResponse.json(image)
  } catch (error) {
    console.error("Add card image error:", error)
    return NextResponse.json(
      { error: "Failed to add image" },
      { status: 500 }
    )
  }
}

// DELETE - удалить изображение
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get("imageId")

    if (!imageId) {
      return NextResponse.json({ error: "Image ID required" }, { status: 400 })
    }

    // Получаем изображение с проверкой прав
    const image = await db.cardImage.findUnique({
      where: { id: imageId },
      include: {
        card: {
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
        },
      },
    })

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    // Проверяем права доступа
    if (image.card.list.board.organization.members.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Удаляем из ImageKit
    try {
      await imagekit.deleteFile(image.fileId)
    } catch (error) {
      console.error("ImageKit delete error:", error)
      // Продолжаем даже если не удалось удалить из ImageKit
    }

    // Удаляем из БД
    await db.cardImage.delete({
      where: { id: imageId },
    })

    // Проверяем, остались ли еще изображения у этой карточки
    const remainingImages = await db.cardImage.count({
      where: { cardId: image.cardId },
    })

    // Если изображений больше нет, удаляем папку в ImageKit
    if (remainingImages === 0) {
      try {
        await imagekit.deleteFolder(`/cards/${image.cardId}`)
      } catch (error) {
        console.error("ImageKit delete folder error:", error)
        // Не критично, если папка не удалилась
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete card image error:", error)
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    )
  }
}
