import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// PATCH - обновить участника (роль)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { role, customRoleId } = body

    // Получаем участника
    const memberToUpdate = await db.organizationMember.findUnique({
      where: { id: params.memberId },
    })

    if (!memberToUpdate) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Проверяем, что пользователь является админом организации
    const adminMember = await db.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: memberToUpdate.organizationId,
        role: "ADMIN",
      },
    })

    if (!adminMember) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Обновляем участника
    const updatedMember = await db.organizationMember.update({
      where: { id: params.memberId },
      data: {
        role: role !== undefined ? role : memberToUpdate.role,
        customRoleId: customRoleId !== undefined ? customRoleId : memberToUpdate.customRoleId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        customRole: true,
      },
    })

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error("Error updating member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - удалить участника
export async function DELETE(
  req: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Получаем участника
    const memberToDelete = await db.organizationMember.findUnique({
      where: { id: params.memberId },
    })

    if (!memberToDelete) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Проверяем, что пользователь является админом организации
    const adminMember = await db.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: memberToDelete.organizationId,
        role: "ADMIN",
      },
    })

    if (!adminMember) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Проверяем, что это не последний админ
    const adminCount = await db.organizationMember.count({
      where: {
        organizationId: memberToDelete.organizationId,
        role: "ADMIN",
      },
    })

    if (memberToDelete.role === "ADMIN" && adminCount <= 1) {
      return NextResponse.json({ error: "Cannot remove the last admin" }, { status: 400 })
    }

    await db.organizationMember.delete({
      where: { id: params.memberId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
