import { z } from "zod"

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be less than 50 characters"),
  description: z.string().optional(),
})

export const createBoardSchema = z.object({
  title: z.string().min(1, "Title is required").max(50, "Title must be less than 50 characters"),
  organizationId: z.string(),
  image: z.string().optional(),
})

export const createListSchema = z.object({
  title: z.string().min(1, "Title is required").max(50, "Title must be less than 50 characters"),
  boardId: z.string(),
})

export const createCardSchema = z.object({
  title: z.string().min(1, "Title is required").max(50, "Title must be less than 50 characters"),
  listId: z.string(),
  boardId: z.string(),
  description: z.string().optional(),
})

export const updateCardSchema = z.object({
  id: z.string(),
  boardId: z.string(),
  title: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
  listId: z.string().optional(),
})
