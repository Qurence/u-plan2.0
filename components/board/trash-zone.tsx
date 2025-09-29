"use client"

import { useDroppable } from "@dnd-kit/core"
import { Trash2 } from "lucide-react"

export const TrashZone = () => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'trash-zone',
    data: { type: 'trash' },
  })

  return (
    <div 
      ref={setNodeRef}
      className={`fixed bottom-12 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-200 ease-out ${
        isOver 
          ? 'bg-red-500/80 scale-110 shadow-xl shadow-red-500/40' 
          : 'bg-black/40 scale-100 shadow-lg'
      } backdrop-blur-sm rounded-3xl flex items-center justify-center border-3 ${
        isOver ? 'border-red-300/60' : 'border-white/20'
      }`}
      style={{ 
        width: '100px', 
        height: '100px',
        pointerEvents: 'auto'
      }}
    >
      <Trash2 className={`transition-all duration-200 ${
        isOver ? 'h-12 w-12 text-white stroke-[2.5]' : 'h-10 w-10 text-gray-300/80 stroke-[2]'
      }`} />
    </div>
  )
}
