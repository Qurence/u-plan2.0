"use client"

import React, { useState } from "react"
import Image from "next/image"
import { X, Loader2, ZoomIn, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface CardImage {
  id: string
  fileId: string
  url: string
  thumbnailUrl?: string | null
  name: string
  size: number
  order: number
  createdAt: string
}

interface CardImageGalleryProps {
  cardId: string
  images: CardImage[]
  onImageDeleted: () => void
  onImagesReordered?: () => void
}

interface SortableImageProps {
  image: CardImage
  onDelete: (id: string, e: React.MouseEvent) => void
  onClick: () => void
  isDeleting: boolean
}

const SortableImage = ({ image, onDelete, onClick, isDeleting }: SortableImageProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-square rounded-md overflow-hidden border cursor-pointer group"
    >
      <div onClick={onClick} className="w-full h-full">
        <Image
          src={image.thumbnailUrl || image.url}
          alt={image.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 p-1 bg-black/50 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-white" />
      </div>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => onDelete(image.id, e)}
        disabled={isDeleting}
        className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {isDeleting ? (
          <Loader2 className="h-3 w-3 text-white animate-spin" />
        ) : (
          <X className="h-3 w-3 text-white" />
        )}
      </Button>
    </div>
  )
}

export const CardImageGallery = ({ cardId, images, onImageDeleted, onImagesReordered }: CardImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<CardImage | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [localImages, setLocalImages] = useState<CardImage[]>(() => 
    [...images].sort((a, b) => a.order - b.order)
  )
  const [isDragging, setIsDragging] = useState(false)
  const justReorderedRef = React.useRef(false)
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Обновляем локальные изображения только если не перетаскиваем и не только что переупорядочили
  React.useEffect(() => {
    if (!isDragging && !justReorderedRef.current) {
      const sortedImages = [...images].sort((a, b) => a.order - b.order)
      setLocalImages(sortedImages)
    }
    
    // Сбрасываем флаг после обновления
    if (justReorderedRef.current) {
      justReorderedRef.current = false
    }
  }, [images, isDragging])

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      setIsDragging(false)
      return
    }

    const oldIndex = localImages.findIndex((img) => img.id === active.id)
    const newIndex = localImages.findIndex((img) => img.id === over.id)

    const newImages = arrayMove(localImages, oldIndex, newIndex)
    setLocalImages(newImages)

    // Обновляем порядок на сервере
    try {
      const imageOrders = newImages.map((img, index) => ({
        id: img.id,
        order: index,
      }))

      const response = await fetch(`/api/cards/${cardId}/images/reorder`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageOrders }),
      })

      if (!response.ok) {
        throw new Error("Failed to reorder images")
      }

      // Устанавливаем флаг что мы только что переупорядочили
      // Это предотвратит перезапись localImages в useEffect
      justReorderedRef.current = true
      
      // Сбрасываем флаг перетаскивания
      setIsDragging(false)
    } catch (error) {
      console.error("Reorder error:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось изменить порядок изображений",
        variant: "destructive",
      })
      // Возвращаем старый порядок при ошибке
      setLocalImages(images)
      setIsDragging(false)
    }
  }

  const handleDeleteImage = async (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm("Вы уверены, что хотите удалить это изображение?")) {
      return
    }

    setDeletingId(imageId)

    try {
      const response = await fetch(`/api/cards/${cardId}/images?imageId=${imageId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete image")
      }

      toast({
        title: "Успех",
        description: "Изображение удалено",
      })

      onImageDeleted()
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить изображение",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (localImages.length === 0) {
    return null
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localImages.map((img) => img.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {localImages.map((image) => (
              <SortableImage
                key={image.id}
                image={image}
                onDelete={handleDeleteImage}
                onClick={() => setSelectedImage(image)}
                isDeleting={deletingId === image.id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Модальное окно для просмотра изображения */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative w-full h-[60vh]">
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">{selectedImage.name}</p>
                  <p>{(selectedImage.size / 1024).toFixed(2)} KB</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    handleDeleteImage(selectedImage.id, e)
                    setSelectedImage(null)
                  }}
                  disabled={deletingId === selectedImage.id}
                >
                  {deletingId === selectedImage.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Удаление...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Удалить
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
