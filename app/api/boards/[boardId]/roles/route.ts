import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - получить роли, имеющие доступ к доске
export async function GET(
  req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Получаем доску и проверяем доступ
    const board = await db.board.findUnique({
      where: { id: params.boardId },
      include: {
        organization: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    }) as any

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    if (board.organization.members.length === 0) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 })
    }

    // Получаем роли доски
    const boardRoles = await (db as any).boardRole.findMany({
      where: { boardId: params.boardId },
      include: { customRole: true },
    })

    return NextResponse.json(boardRoles)
  } catch (error) {
    console.error("Error fetching board roles:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - добавить роль к доске
export async function POST(
  req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { customRoleId } = body

    if (!customRoleId) {
      return NextResponse.json({ error: "Missing customRoleId" }, { status: 400 })
    }

    // Получаем доску и проверяем права админа
    const board = await db.board.findUnique({
      where: { id: params.boardId },
      include: {
        organization: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    }) as any

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    const member = board.organization.members[0]
    if (!member || member.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Проверяем, что роль принадлежит той же организации
    const customRole = await (db as any).customRole.findFirst({
      where: {
        id: customRoleId,
        organizationId: board.organizationId,
      },
    })

    if (!customRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Создаем связь
    const boardRole = await (db as any).boardRole.create({
      data: {
        boardId: params.boardId,
        customRoleId,
      },
      include: {
        customRole: true,
      },
    })

    return NextResponse.json(boardRole)
  } catch (error: any) {
    console.error("Error adding board role:", error)
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Role already added" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - удалить роль с доски
export async function DELETE(
  req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const customRoleId = searchParams.get("customRoleId")

    if (!customRoleId) {
      return NextResponse.json({ error: "Missing customRoleId" }, { status: 400 })
    }

    // Получаем доску и проверяем права админа
    const board = await db.board.findUnique({
      where: { id: params.boardId },
      include: {
        organization: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    }) as any

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    const member = board.organization.members[0]
    if (!member || member.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Удаляем связь
    await (db as any).boardRole.deleteMany({
      where: {
        boardId: params.boardId,
        customRoleId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing board role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
