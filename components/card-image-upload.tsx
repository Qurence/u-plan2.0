"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface CardImageUploadProps {
  cardId: string
  onUploadSuccess: () => void
}

export const CardImageUpload = ({ cardId, onUploadSuccess }: CardImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Проверка типа файла
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите изображение",
        variant: "destructive",
      })
      return
    }

    // Проверка размера (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Ошибка",
        description: "Размер файла не должен превышать 10MB",
        variant: "destructive",
      })
      return
    }

    // Показываем превью
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Загружаем файл
    uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)

    try {
      // Получаем токен аутентификации ImageKit
      const authResponse = await fetch("/api/imagekit-auth")
      if (!authResponse.ok) {
        throw new Error("Failed to get auth token")
      }
      const authData = await authResponse.json()

      // Создаем FormData для загрузки
      const formData = new FormData()
      formData.append("file", file)
      formData.append("fileName", file.name)
      formData.append("publicKey", process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "")
      formData.append("signature", authData.signature)
      formData.append("expire", authData.expire)
      formData.append("token", authData.token)
      formData.append("folder", `/cards/${cardId}`)

      // Загружаем в ImageKit
      const uploadResponse = await fetch(
        "https://upload.imagekit.io/api/v1/files/upload",
        {
          method: "POST",
          body: formData,
        }
      )

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload to ImageKit")
      }

      const uploadData = await uploadResponse.json()

      // Сохраняем информацию об изображении в БД
      const saveResponse = await fetch(`/api/cards/${cardId}/images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: uploadData.fileId,
          url: uploadData.url,
          thumbnailUrl: uploadData.thumbnailUrl,
          name: uploadData.name,
          size: uploadData.size,
        }),
      })

      if (!saveResponse.ok) {
        throw new Error("Failed to save image")
      }

      toast({
        title: "Успех",
        description: "Изображение загружено",
      })

      setPreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      onUploadSuccess()
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить изображение",
        variant: "destructive",
      })
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancelPreview = () => {
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
      
      {previewUrl && (
        <div className="relative w-full h-40 rounded-md overflow-hidden border">
          <Image
            src={previewUrl}
            alt="Preview"
            fill
            className="object-cover"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
          {!isUploading && (
            <button
              onClick={handleCancelPreview}
              className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          )}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Загрузка...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Загрузить изображение
          </>
        )}
      </Button>
    </div>
  )
}
