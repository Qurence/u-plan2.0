import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tagId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, color } = body

    if (!name || !color) {
      return NextResponse.json(
        { error: "Name and color are required" },
        { status: 400 }
      )
    }

    // Получаем тег и проверяем доступ
    const tag = await db.tag.findUnique({
      where: { id: params.tagId },
      include: {
        organization: {
          include: {
            members: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    })

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    if (tag.organization.members.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const updatedTag = await db.tag.update({
      where: { id: params.tagId },
      data: {
        name,
        color,
      },
    })

    return NextResponse.json(updatedTag)
  } catch (error) {
    console.error("Error updating tag:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tagId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Получаем тег и проверяем доступ
    const tag = await db.tag.findUnique({
      where: { id: params.tagId },
      include: {
        organization: {
          include: {
            members: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    })

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    if (tag.organization.members.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Удаляем тег (связи с карточками удалятся автоматически из-за onDelete: Cascade)
    await db.tag.delete({
      where: { id: params.tagId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting tag:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
