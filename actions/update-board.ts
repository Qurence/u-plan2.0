"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const UpdateBoardSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(50).optional(),
  description: z.string().max(255).optional(),
  image: z.string().optional(),
})

export type UpdateBoardInput = z.infer<typeof UpdateBoardSchema>

export async function updateBoard(data: UpdateBoardInput) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user && (session.user as any).id) ? (session.user as any).id as string : undefined;
  if (!userId) {
    throw new Error("Unauthorized")
  }

  const { id, ...values } = UpdateBoardSchema.parse(data)

  // Проверяем, что пользователь имеет доступ к доске через организацию
  const board = await db.board.findFirst({
    where: {
      id,
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

  const updated = await db.board.update({
    where: { id },
    data: values,
  })
  revalidatePath(`/board/${id}`)
  revalidatePath(`/organization/${board.organizationId}`)
  return updated
} 