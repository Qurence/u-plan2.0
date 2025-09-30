"use client"

import type { Board, Organization } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Star } from "lucide-react"
import Link from "next/link"
import { BoardSettingsModal } from "./board-settings-modal"
import { useSidebar } from "@/contexts/sidebar-context"

interface BoardNavbarProps {
  board: Board & {
    organization: Organization
  }
  isAdmin?: boolean
}

export const BoardNavbar = ({ board, isAdmin = false }: BoardNavbarProps) => {
  const { collapsed } = useSidebar()
  
  return (
    <div 
      className="h-14 z-40 bg-black/50 fixed top-2 right-2 flex items-center px-6 gap-x-4 text-white transition-all duration-300"
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
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 flex-shrink-0">
          <Star className="h-4 w-4" />
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
