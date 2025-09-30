import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - получить всех участников организации
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

    const members = await db.organizationMember.findMany({
      where: { organizationId },
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
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error("Error fetching members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - добавить нового участника
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { email, organizationId, role, customRoleId } = body

    if (!email || !organizationId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Проверяем, что пользователь является админом организации
    const adminMember = await db.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
        role: "ADMIN",
      },
    })

    if (!adminMember) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Находим пользователя по email
    const userToAdd = await db.user.findUnique({
      where: { email },
    })

    if (!userToAdd) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Проверяем, не является ли пользователь уже участником
    const existingMember = await db.organizationMember.findFirst({
      where: {
        userId: userToAdd.id,
        organizationId,
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: "User is already a member" }, { status: 400 })
    }

    // Создаем нового участника
    const newMember = await db.organizationMember.create({
      data: {
        userId: userToAdd.id,
        organizationId,
        role: role || "MEMBER",
        customRoleId: customRoleId || null,
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

    return NextResponse.json(newMember)
  } catch (error) {
    console.error("Error adding member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
