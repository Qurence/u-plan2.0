import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const createListSchema = z.object({
  title: z.string().min(1).max(50),
})

export async function POST(req: NextRequest, { params }: { params: { boardId: string } }) {
  try {
    const session = await getServerSession(authOptions) as any

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { title } = createListSchema.parse(body)

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

    // Получаем последний порядок
    const lastList = await db.list.findFirst({
      where: { boardId: params.boardId },
      orderBy: { order: "desc" },
    })

    const list = await db.list.create({
      data: {
        title,
        boardId: params.boardId,
        order: lastList ? lastList.order + 1 : 1,
      },
    })

    return NextResponse.json(list)
  } catch (error) {
    console.error("[LISTS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { boardId: string } }) {
  try {
    const session = await getServerSession(authOptions) as any
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    // Ожидаем: { lists: [{ id: string, order: number }] }
    const { lists } = body

    if (!Array.isArray(lists)) {
      return new NextResponse("Invalid data", { status: 400 })
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

    // Обновляем порядок списков
    const updatePromises = lists.map((l: { id: string, order: number }) =>
      db.list.update({
        where: { id: l.id },
        data: { order: l.order },
      })
    )
    await Promise.all(updatePromises)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[LISTS_REORDER]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
