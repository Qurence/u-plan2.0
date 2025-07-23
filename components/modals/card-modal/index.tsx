"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, MessageSquare, User, X } from "lucide-react"
import { useCardModal } from "@/hooks/use-card-modal"

export const CardModal = () => {
  const { isOpen, onClose, cardId } = useCardModal()
  const [isEditing, setIsEditing] = useState(false)

  const { data: card, isLoading } = useQuery({
    queryKey: ["card", cardId],
    queryFn: () => fetch(`/api/cards/${cardId}`).then((res) => res.json()),
    enabled: !!cardId && isOpen,
  })

  if (!isOpen || !cardId) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl font-semibold">{card?.title || "Loading..."}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-20 bg-muted rounded animate-pulse" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Description
              </h4>
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    defaultValue={card?.description || ""}
                    placeholder="Add a description..."
                    className="min-h-[100px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm">Save</Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-sm text-muted-foreground cursor-pointer hover:bg-muted p-2 rounded-md min-h-[60px]"
                  onClick={() => setIsEditing(true)}
                >
                  {card?.description || "Add a description..."}
                </div>
              )}
            </div>

            {/* Assignee */}
            {card?.assignee && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assigned to
                </h4>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={card.assignee.image || "/placeholder.svg"} />
                    <AvatarFallback>{card.assignee.name?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{card.assignee.name}</span>
                </div>
              </div>
            )}

            {/* Due Date */}
            {card?.dueDate && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Due Date
                </h4>
                <Badge variant="outline">{new Date(card.dueDate).toLocaleDateString()}</Badge>
              </div>
            )}

            {/* Comments */}
            <div className="space-y-4">
              <h4 className="font-medium">Comments</h4>
              <div className="space-y-3">
                {card?.comments?.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user.image || "/placeholder.svg"} />
                      <AvatarFallback>{comment.user.name?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{comment.user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea placeholder="Write a comment..." />
                  <Button size="sm">Add Comment</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
