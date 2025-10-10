import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getImageKitAuthParams } from "@/lib/imagekit"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const authParams = await getImageKitAuthParams()
    
    return NextResponse.json(authParams)
  } catch (error) {
    console.error("ImageKit auth error:", error)
    return NextResponse.json(
      { error: "Failed to get auth params" },
      { status: 500 }
    )
  }
}
