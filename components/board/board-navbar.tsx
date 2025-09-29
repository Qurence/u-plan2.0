"use client"

import type { Board, Organization } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Star } from "lucide-react"
import Link from "next/link"

interface BoardNavbarProps {
  board: Board & {
    organization: Organization
  }
}

export const BoardNavbar = ({ board }: BoardNavbarProps) => {
  return (
    <div className="w-full h-14 z-40 bg-black/50 fixed top-2 flex items-center px-6 gap-x-4 text-white">
      <Link href={`/organization/${board.organizationId}`}>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </Link>
      <div className="flex items-center gap-x-2">
        <h1 className="text-lg font-semibold">{board.title}</h1>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
          <Star className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
