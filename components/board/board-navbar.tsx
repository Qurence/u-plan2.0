"use client"

import { useState, useEffect } from "react"
import type { Board, Organization } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Star } from "lucide-react"
import Link from "next/link"
import { BoardSettingsModal } from "./board-settings-modal"
import { useSidebar } from "@/contexts/sidebar-context"
import { useToast } from "@/hooks/use-toast"

interface BoardNavbarProps {
  board: Board & {
    organization: Organization
  }
  isAdmin?: boolean
}

export const BoardNavbar = ({ board, isAdmin = false }: BoardNavbarProps) => {
  const { collapsed } = useSidebar()
  const { toast } = useToast()
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Проверяем, в избранном ли доска
    const checkFavorite = async () => {
      try {
        const response = await fetch(`/api/boards/${board.id}/favorite`)
        if (response.ok) {
          const data = await response.json()
          setIsFavorite(data.isFavorite)
        }
      } catch (error) {
        console.error("Failed to check favorite status:", error)
      }
    }

    checkFavorite()
  }, [board.id])

  const toggleFavorite = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/boards/${board.id}/favorite`, {
        method: isFavorite ? "DELETE" : "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to toggle favorite")
      }

      setIsFavorite(!isFavorite)
      toast({
        title: isFavorite ? "Удалено из избранного" : "Добавлено в избранное",
      })
    } catch (error) {
      console.error("Toggle favorite error:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить избранное",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div 
      className="h-14 z-40 bg-black/50 fixed top-2 right-2 rounded-lg flex items-center px-6 gap-x-4 text-white transition-all duration-300"
      style={{ left: collapsed ? '72px' : '264px' }}
    >
      <Link href={`/organization/${board.organizationId}`}>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </Link>
      <div className="flex items-center gap-x-2 flex-1 min-w-0">
        <h1 className="text-lg font-semibold truncate">{board.title}</h1>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:bg-white/20 flex-shrink-0"
          onClick={toggleFavorite}
          disabled={isLoading}
        >
          <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
        </Button>
      </div>
      {isAdmin && (
        <div className="flex-shrink-0">
          <BoardSettingsModal boardId={board.id} organizationId={board.organizationId} />
        </div>
      )}
    </div>
  )
}
