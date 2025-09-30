import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// PATCH - обновить кастомную роль
export async function PATCH(
  req: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, color } = body

    if (!name || !color) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Получаем роль и проверяем права
    const role = await db.customRole.findUnique({
      where: { id: params.roleId },
      include: { organization: true },
    })

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Проверяем, что пользователь является админом организации
    const member = await db.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: role.organizationId,
        role: "ADMIN",
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const updatedRole = await db.customRole.update({
      where: { id: params.roleId },
      data: {
        name: name.trim(),
        color,
      },
    })

    return NextResponse.json(updatedRole)
  } catch (error) {
    console.error("Error updating custom role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - удалить кастомную роль
export async function DELETE(
  req: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Получаем роль и проверяем права
    const role = await db.customRole.findUnique({
      where: { id: params.roleId },
      include: { organization: true },
    })

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Проверяем, что пользователь является админом организации
    const member = await db.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: role.organizationId,
        role: "ADMIN",
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    await db.customRole.delete({
      where: { id: params.roleId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting custom role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
