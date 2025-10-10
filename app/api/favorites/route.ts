import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - получить все избранные доски пользователя
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const favorites = await db.favoriteBoard.findMany({
      where: {
        userId: userId,
      },
      include: {
        board: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(favorites)
  } catch (error) {
    console.error("Get favorites error:", error)
    return NextResponse.json(
      { error: "Failed to get favorites" },
      { status: 500 }
    )
  }
}
