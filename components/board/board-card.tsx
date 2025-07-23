"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { deleteBoard } from "@/actions/delete-board"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateBoard } from "@/actions/update-board"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

interface BoardCardProps {
  board: {
    id: string
    title: string
    description?: string
    image?: string
    _count: {
      lists: number
    }
  }
  organizationId: string
}

export const BoardCard = ({ board, organizationId }: BoardCardProps) => {
  const router = useRouter()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [title, setTitle] = useState(board.title)
  const [description, setDescription] = useState(board.description || "")
  const [image, setImage] = useState(board.image || "")
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await deleteBoard(board.id)
      toast.success("Board deleted!")
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete board")
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await updateBoard({ id: board.id, title, description, image })
      toast.success("Board updated!")
      setIsEditOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || "Failed to update board")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
      <Link href={`/board/${board.id}`}>
        <CardHeader className="p-4">
          {board.image && (
            <div className="aspect-video relative rounded-md overflow-hidden mb-2">
              <img src={board.image || "/placeholder.svg"} alt={board.title} className="object-cover w-full h-full" />
            </div>
          )}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">{board.title}</h3>
              {board.description && <p className="text-sm text-muted-foreground line-clamp-2">{board.description}</p>}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditOpen(true)}>Edit board</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={handleDelete}>Delete board</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
      </Link>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{board._count.lists} lists</span>
          </div>
          <Badge variant="secondary">Active</Badge>
        </div>
      </CardContent>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit board</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={description} onChange={e => setDescription(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input id="image" value={image} onChange={e => setImage(e.target.value)} disabled={isLoading} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={isLoading}>Cancel</Button>
              <Button type="submit" disabled={isLoading || !title.trim()}>{isLoading ? "Saving..." : "Save"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
