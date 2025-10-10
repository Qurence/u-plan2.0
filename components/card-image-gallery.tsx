"use client"

import React, { useState } from "react"
import Image from "next/image"
import { X, Loader2, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface CardImage {
  id: string
  fileId: string
  url: string
  thumbnailUrl?: string | null
  name: string
  size: number
  createdAt: string
}

interface CardImageGalleryProps {
  cardId: string
  images: CardImage[]
  onImageDeleted: () => void
}

export const CardImageGallery = ({ cardId, images, onImageDeleted }: CardImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<CardImage | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

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

  if (images.length === 0) {
    return null
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative aspect-square rounded-md overflow-hidden border cursor-pointer group"
            onClick={() => setSelectedImage(image)}
          >
            <Image
              src={image.thumbnailUrl || image.url}
              alt={image.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleDeleteImage(image.id, e)}
              disabled={deletingId === image.id}
              className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {deletingId === image.id ? (
                <Loader2 className="h-3 w-3 text-white animate-spin" />
              ) : (
                <X className="h-3 w-3 text-white" />
              )}
            </Button>
          </div>
        ))}
      </div>

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
