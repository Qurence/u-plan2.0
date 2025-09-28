import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("organizationId")

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 })
    }

    // Проверяем доступ к организации
    const hasAccess = await db.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
      },
    })

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const tags = await db.tag.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(tags)
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, color, organizationId } = body

    if (!name || !color || !organizationId) {
      return NextResponse.json(
        { error: "Name, color, and organizationId are required" },
        { status: 400 }
      )
    }

    // Проверяем доступ к организации
    const hasAccess = await db.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
      },
    })

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const tag = await db.tag.create({
      data: {
        name,
        color,
        organizationId,
      },
    })

    return NextResponse.json(tag)
  } catch (error) {
    console.error("Error creating tag:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
