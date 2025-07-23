"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAction } from "@/hooks/use-action"
import { createBoard } from "@/actions/create-board"
import { toast } from "sonner"

interface CreateBoardButtonProps {
  organizationId: string
}

export const CreateBoardButton = ({ organizationId }: CreateBoardButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const router = useRouter()

  const { execute, isLoading } = useAction(createBoard, {
    onSuccess: (data) => {
      toast.success("Board created!")
      setIsOpen(false)
      setTitle("")
      router.push(`/board/${data.id}`)
    },
    onError: (error) => {
      toast.error(error)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    execute({ title, organizationId })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="aspect-video relative h-full w-full bg-muted rounded-sm flex flex-col gap-y-1 items-center justify-center hover:opacity-75 transition cursor-pointer">
          <Plus className="h-6 w-6" />
          <p className="text-sm">Create new board</p>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create board</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Board title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter board title..."
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
