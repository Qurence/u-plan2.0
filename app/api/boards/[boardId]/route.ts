import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const session = await getServerSession(authOptions) as any
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const board = await db.board.findUnique({
      where: {
        id: params.boardId,
      },
      include: {
        organization: true
      }
    })

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    // Проверяем доступ к доске через организацию
    const hasAccess = await db.organizationMember.findFirst({
      where: {
        userId: (session.user as any).id,
        organizationId: board.organizationId,
      },
    })

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json(board)
  } catch (error) {
    console.error("Error fetching board:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}