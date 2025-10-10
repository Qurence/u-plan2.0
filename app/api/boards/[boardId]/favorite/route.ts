import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// POST - добавить доску в избранное
export async function POST(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { boardId } = params

    // Проверяем доступ к доске
    const board = await db.board.findUnique({
      where: { id: boardId },
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
    })

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    if (board.organization.members.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Добавляем в избранное (или игнорируем если уже есть)
    const favorite = await db.favoriteBoard.upsert({
      where: {
        userId_boardId: {
          userId: userId,
          boardId: boardId,
        },
      },
      create: {
        userId: userId,
        boardId: boardId,
      },
      update: {},
    })

    return NextResponse.json(favorite)
  } catch (error) {
    console.error("Add to favorites error:", error)
    return NextResponse.json(
      { error: "Failed to add to favorites" },
      { status: 500 }
    )
  }
}

// DELETE - удалить доску из избранного
export async function DELETE(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { boardId } = params

    // Удаляем из избранного
    await db.favoriteBoard.deleteMany({
      where: {
        userId: userId,
        boardId: boardId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Remove from favorites error:", error)
    return NextResponse.json(
      { error: "Failed to remove from favorites" },
      { status: 500 }
    )
  }
}

// GET - проверить, в избранном ли доска
export async function GET(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { boardId } = params

    const favorite = await db.favoriteBoard.findUnique({
      where: {
        userId_boardId: {
          userId: userId,
          boardId: boardId,
        },
      },
    })

    return NextResponse.json({ isFavorite: !!favorite })
  } catch (error) {
    console.error("Check favorite error:", error)
    return NextResponse.json(
      { error: "Failed to check favorite status" },
      { status: 500 }
    )
  }
}
