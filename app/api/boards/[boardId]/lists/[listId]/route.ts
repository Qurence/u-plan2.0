import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { imagekit } from "@/lib/imagekit"

export async function DELETE(
  req: NextRequest,
  { params }: { params: { boardId: string; listId: string } }
) {
  try {
    const session = await getServerSession(authOptions) as any

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Проверяем доступ к доске
    const board = await db.board.findFirst({
      where: {
        id: params.boardId,
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
      return new NextResponse("Board not found", { status: 404 })
    }

    // Проверяем, что список принадлежит этой доске
    const list = await db.list.findFirst({
      where: {
        id: params.listId,
        boardId: params.boardId,
      },
      include: {
        cards: {
          include: {
            images: true,
          },
        },
      },
    })

    if (!list) {
      return new NextResponse("List not found", { status: 404 })
    }

    // Удаляем все изображения из ImageKit для всех карточек в списке
    if (list.cards.length > 0 && imagekit) {
      for (const card of list.cards) {
        if (card.images.length > 0) {
          try {
            // Удаляем все файлы карточки
            for (const image of card.images) {
              try {
                await imagekit.deleteFile(image.fileId)
              } catch (error) {
                console.error(`Failed to delete file ${image.fileId}:`, error)
              }
            }
            
            // Удаляем папку карточки
            await imagekit.deleteFolder(`/cards/${card.id}`)
          } catch (error) {
            console.error(`ImageKit cleanup error for card ${card.id}:`, error)
          }
        }
      }
    }

    // Удаляем список (каскадно удалятся все карточки и связанные данные)
    await db.list.delete({
      where: { id: params.listId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[LIST_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
