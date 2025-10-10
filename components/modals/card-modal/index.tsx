"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, MessageSquare, User, X, Tag, Plus, Edit2, Trash2, Image as ImageIcon } from "lucide-react"
import { useCardModal } from "@/hooks/use-card-modal"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CardImageUpload } from "@/components/card-image-upload"
import { CardImageGallery } from "@/components/card-image-gallery"

export const CardModal = () => {
  const { isOpen, onClose, cardId } = useCardModal()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [isEditingDueDate, setIsEditingDueDate] = useState(false)
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [isEditingTag, setIsEditingTag] = useState<string | null>(null)
  
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState("#3b82f6")
  const [editingTagName, setEditingTagName] = useState("")
  const [editingTagColor, setEditingTagColor] = useState("")
  const [newComment, setNewComment] = useState("")
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [dueTime, setDueTime] = useState("12:00")

  const { data: card, isLoading } = useQuery({
    queryKey: ["card", cardId],
    queryFn: () => fetch(`/api/cards/${cardId}`).then((res) => res.json()),
    enabled: !!cardId && isOpen,
  })

  const { data: tags } = useQuery({
    queryKey: ["tags", card?.list?.board?.organizationId],
    queryFn: () => 
      fetch(`/api/tags?organizationId=${card?.list?.board?.organizationId}`).then((res) => res.json()),
    enabled: !!card?.list?.board?.organizationId,
  })

  // Мутации для обновления карточки
  const updateCardMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update card")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card", cardId] })
      toast({ title: "Карточка обновлена" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка", 
        description: error.message || "Не удалось обновить карточку",
        variant: "destructive"
      })
    },
  })

  // Мутация для создания тега
  const createTagMutation = useMutation({
    mutationFn: async (data: { name: string; color: string; organizationId: string }) => {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create tag")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", card?.list?.board?.organizationId] })
      setNewTagName("")
      setNewTagColor("#3b82f6")
      setIsCreatingTag(false)
      toast({ title: "Тег создан" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка", 
        description: error.message || "Не удалось создать тег",
        variant: "destructive"
      })
    },
  })

  // Мутация для обновления тега
  const updateTagMutation = useMutation({
    mutationFn: async ({ tagId, name, color }: { tagId: string; name: string; color: string }) => {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update tag")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", card?.list?.board?.organizationId] })
      queryClient.invalidateQueries({ queryKey: ["card", cardId] })
      setIsEditingTag(null)
      toast({ title: "Тег обновлен" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка", 
        description: error.message || "Не удалось обновить тег",
        variant: "destructive"
      })
    },
  })

  // Мутация для удаления тега
  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete tag")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", card?.list?.board?.organizationId] })
      queryClient.invalidateQueries({ queryKey: ["card", cardId] })
      toast({ title: "Тег удален" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка", 
        description: error.message || "Не удалось удалить тег",
        variant: "destructive"
      })
    },
  })

  // Мутация для добавления тега к карточке
  const addTagToCardMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const response = await fetch(`/api/cards/${cardId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add tag to card")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card", cardId] })
      toast({ title: "Тег добавлен к карточке" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка", 
        description: error.message || "Не удалось добавить тег к карточке",
        variant: "destructive"
      })
    },
  })

  // Мутация для удаления тега с карточки
  const removeTagFromCardMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const response = await fetch(`/api/cards/${cardId}/tags?tagId=${tagId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to remove tag from card")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card", cardId] })
      toast({ title: "Тег удален с карточки" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка", 
        description: error.message || "Не удалось удалить тег с карточки",
        variant: "destructive"
      })
    },
  })

  // Мутация для добавления комментария
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/cards/${cardId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add comment")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card", cardId] })
      setNewComment("")
      setIsAddingComment(false)
      toast({ title: "Комментарий добавлен" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка", 
        description: error.message || "Не удалось добавить комментарий",
        variant: "destructive"
      })
      setIsAddingComment(false)
    },
  })

  // Мутация для удаления карточки
  const deleteCardMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete card")
      }
      return response.json()
    },
    onSuccess: () => {
      toast({ title: "Карточка удалена" })
      onClose()
      // Перезагружаем страницу для обновления списка карточек
      window.location.reload()
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка", 
        description: error.message || "Не удалось удалить карточку",
        variant: "destructive"
      })
    },
  })

  // Инициализация данных при загрузке карточки
  React.useEffect(() => {
    if (card) {
      setTitle(card.title || "")
      setDescription(card.description || "")
      if (card.dueDate) {
        const date = new Date(card.dueDate)
        setDueDate(date)
        setDueTime(`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`)
      } else {
        setDueDate(undefined)
        setDueTime("12:00")
      }
    }
  }, [card])

  const handleSaveTitle = () => {
    if (title.trim()) {
      updateCardMutation.mutate({ title: title.trim() })
      setIsEditingTitle(false)
    }
  }

  const handleSaveDescription = () => {
    updateCardMutation.mutate({ description: description.trim() })
    setIsEditingDescription(false)
  }

  const handleSaveDueDate = () => {
    if (dueDate) {
      const [hours, minutes] = dueTime.split(':').map(Number)
      const dateWithTime = new Date(dueDate)
      dateWithTime.setHours(hours, minutes, 0, 0)
      updateCardMutation.mutate({ dueDate: dateWithTime.toISOString() })
    } else {
      updateCardMutation.mutate({ dueDate: null })
    }
    setIsEditingDueDate(false)
  }

  const handleCreateTag = () => {
    if (newTagName.trim() && card?.list?.board?.organizationId) {
      createTagMutation.mutate({
        name: newTagName.trim(),
        color: newTagColor,
        organizationId: card.list.board.organizationId,
      })
    }
  }

  const handleUpdateTag = (tagId: string) => {
    if (editingTagName.trim()) {
      updateTagMutation.mutate({
        tagId,
        name: editingTagName.trim(),
        color: editingTagColor,
      })
    }
  }

  const handleDeleteTag = (tagId: string) => {
    deleteTagMutation.mutate(tagId)
  }

  const handleAddTagToCard = (tagId: string) => {
    addTagToCardMutation.mutate(tagId)
  }

  const handleRemoveTagFromCard = (tagId: string) => {
    removeTagFromCardMutation.mutate(tagId)
  }

  const handleAddComment = () => {
    if (newComment.trim()) {
      setIsAddingComment(true)
      addCommentMutation.mutate(newComment.trim())
    }
  }

  const handleDeleteCard = () => {
    if (confirm("Вы уверены, что хотите удалить эту карточку?")) {
      deleteCardMutation.mutate()
    }
  }

  const startEditingTag = (tag: any) => {
    setEditingTagName(tag.name)
    setEditingTagColor(tag.color)
    setIsEditingTag(tag.id)
  }

  if (!isOpen || !cardId) return null

  const cardTags = card?.tags?.map((ct: any) => ct.tag) || []
  const availableTags = tags?.filter((tag: any) => 
    !cardTags.some((cardTag: any) => cardTag.id === tag.id)
  ) || []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" hideCloseButton>
        <DialogHeader>
          <div className="flex items-start justify-between">
            {isEditingTitle ? (
              <div className="flex-1 space-y-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-semibold"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveTitle}>
                    Сохранить
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setIsEditingTitle(false)
                      setTitle(card?.title || "")
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <DialogTitle 
                className="text-xl font-semibold cursor-pointer hover:bg-muted p-2 rounded-md"
                onClick={() => setIsEditingTitle(true)}
              >
                {card?.title || "Loading..."}
              </DialogTitle>
            )}
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDeleteCard}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-20 bg-muted rounded animate-pulse" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Теги карточки */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Теги
              </h4>
              <div className="flex flex-wrap gap-2">
                {cardTags.map((tag: any) => (
                  <div key={tag.id} className="flex items-center gap-1">
                    <Badge 
                      style={{ backgroundColor: tag.color, color: "white" }}
                      className="cursor-pointer"
                    >
                      {tag.name}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleRemoveTagFromCard(tag.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {availableTags.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-6">
                        <Plus className="h-3 w-3 mr-1" />
                        Добавить тег
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        <h4 className="font-medium">Добавить тег</h4>
                        <div className="space-y-2">
                          {availableTags.map((tag: any) => (
                            <div key={tag.id} className="flex items-center justify-between">
                              <Badge style={{ backgroundColor: tag.color, color: "white" }}>
                                {tag.name}
                              </Badge>
                              <Button
                                size="sm"
                                onClick={() => handleAddTagToCard(tag.id)}
                              >
                                Добавить
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            {/* Управление тегами вынесено на отдельную страницу */}
            {card?.list?.board?.organizationId && (
              <div>
                <a
                  href={`/organization/${card.list.board.organizationId}/tags`}
                  className="inline-flex items-center text-sm text-primary hover:underline"
                >
                  <Plus className="h-4 w-4 mr-2" /> Открыть управление тегами
                </a>
              </div>
            )}

            {/* Изображения */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Изображения
              </h4>
              <CardImageGallery
                cardId={cardId!}
                images={card?.images || []}
                onImageDeleted={() => queryClient.invalidateQueries({ queryKey: ["card", cardId] })}
              />
              <CardImageUpload
                cardId={cardId!}
                onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ["card", cardId] })}
              />
            </div>

            {/* Описание */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Описание
              </h4>
              {isEditingDescription ? (
                <div className="space-y-2">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Добавьте описание..."
                    className="min-h-[100px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveDescription}>
                      Сохранить
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setIsEditingDescription(false)
                        setDescription(card?.description || "")
                      }}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-sm text-muted-foreground cursor-pointer hover:bg-muted p-2 rounded-md min-h-[60px]"
                  onClick={() => setIsEditingDescription(true)}
                >
                  {card?.description || "Добавьте описание..."}
                </div>
              )}
            </div>

            {/* Срок выполнения */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Срок выполнения
              </h4>
              {isEditingDueDate ? (
                <div className="space-y-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : "Выберите дату"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Время:</label>
                    <Input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="w-32"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveDueDate}>
                      Сохранить
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setIsEditingDueDate(false)
                        if (card?.dueDate) {
                          const date = new Date(card.dueDate)
                          setDueDate(date)
                          setDueTime(`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`)
                        } else {
                          setDueDate(undefined)
                          setDueTime("12:00")
                        }
                      }}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="cursor-pointer hover:bg-muted p-2 rounded-md"
                  onClick={() => setIsEditingDueDate(true)}
                >
                  {card?.dueDate ? (
                    <Badge 
                      variant="outline" 
                      suppressHydrationWarning
                      className={new Date(card.dueDate) < new Date() ? 'border-red-600 text-red-600' : ''}
                    >
                      До: {format(new Date(card.dueDate), "PPP p")}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Добавьте срок выполнения...
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Исполнитель */}
            {card?.assignee && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Исполнитель
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

            {/* Комментарии */}
            <div className="space-y-4">

              {/* Добавить комментарий */}
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea 
                    placeholder="Напишите комментарий..." 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={isAddingComment}
                  />
                  <Button 
                    size="sm" 
                    onClick={handleAddComment}
                    disabled={isAddingComment || !newComment.trim()}
                  >
                    {isAddingComment ? "Добавление..." : "Добавить комментарий"}
                  </Button>
                </div>
              </div>

              <h4 className="font-medium">Комментарии</h4>
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
                        <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                          {format(new Date(comment.createdAt), "PPP")}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
