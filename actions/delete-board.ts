"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function deleteBoard(boardId: string) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user && (session.user as any).id) ? (session.user as any).id as string : undefined;
  if (!userId) {
    throw new Error("Unauthorized")
  }

  // Проверяем, что пользователь имеет доступ к доске через организацию
  const board = await db.board.findFirst({
    where: {
      id: boardId,
      organization: {
        members: {
          some: { userId },
        },
      },
    },
  })

  if (!board) {
    throw new Error("Board not found or access denied")
  }

  await db.board.delete({ where: { id: boardId } })
  revalidatePath(`/organization/${board.organizationId}`)
  return { success: true }
} 