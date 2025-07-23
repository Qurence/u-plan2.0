import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const createOrganizationSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const organizations = await db.organization.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            boards: true,
          },
        },
      },
    })

    return NextResponse.json(organizations)
  } catch (error) {
    console.error("[ORGANIZATIONS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { name, description } = createOrganizationSchema.parse(body)

    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")

    const organization = await db.organization.create({
      data: {
        name,
        description,
        slug,
        creatorId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "ADMIN",
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    })

    return NextResponse.json(organization)
  } catch (error) {
    console.error("[ORGANIZATIONS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
