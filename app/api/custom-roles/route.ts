import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - получить все кастомные роли организации
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get("organizationId")

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 })
    }

    // Проверяем, что пользователь является членом организации
    const member = await db.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 })
    }

    const roles = await db.customRole.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(roles)
  } catch (error) {
    console.error("Error fetching custom roles:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - создать новую кастомную роль
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, color, organizationId } = body

    if (!name || !color || !organizationId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Проверяем, что пользователь является админом организации
    const member = await db.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
        role: "ADMIN",
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const role = await db.customRole.create({
      data: {
        name: name.trim(),
        color,
        organizationId,
      },
    })

    return NextResponse.json(role)
  } catch (error) {
    console.error("Error creating custom role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
