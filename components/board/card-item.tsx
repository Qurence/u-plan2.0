"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Card } from "@prisma/client"
import { Card as UICard } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCardModal } from "@/hooks/use-card-modal"

interface CardItemProps {
  card: Card & {
    tags?: Array<{
      tag: {
        id: string
        name: string
        color: string
      }
    }>
  }
  isDragging?: boolean
}

export const CardItem = ({ card, isDragging }: CardItemProps) => {
  const [tagsExpanded, setTagsExpanded] = useState(false)
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: dndIsDragging, isOver } = useSortable({
    id: card.id,
    data: {
      type: "card",
      card,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const cardModal = useCardModal()

  const handleTagClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setTagsExpanded(!tagsExpanded)
  }

  return (
    <UICard
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab hover:shadow-md transition-shadow p-3 bg-white dark:bg-gray-800 ${isDragging ? 'opacity-50' : ''}`}
      onClick={() => cardModal.onOpen(card.id)}
    >
      <div className="space-y-2">
        {/* Теги - в самом верху */}
        {card.tags && card.tags.length > 0 && (
          <div 
            className="flex flex-wrap gap-1 cursor-pointer"
            onClick={handleTagClick}
          >
            {tagsExpanded ? (
              // Развёрнутый вид с названиями
              card.tags.map((cardTag) => (
                <Badge
                  key={cardTag.tag.id}
                  style={{ backgroundColor: cardTag.tag.color, color: "white" }}
                  className="text-xs px-2 py-0.5"
                >
                  {cardTag.tag.name}
                </Badge>
              ))
            ) : (
              // Компактный вид - узкие полоски без текста
              card.tags.map((cardTag) => (
                <div
                  key={cardTag.tag.id}
                  style={{ backgroundColor: cardTag.tag.color }}
                  className="h-2 w-8 rounded-full"
                  title={cardTag.tag.name}
                />
              ))
            )}
          </div>
        )}
        
        <h4 className="text-sm font-medium">{card.title}</h4>
        
        {card.dueDate && (
          <div 
            className={`text-xs ${new Date(card.dueDate) < new Date() ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-muted-foreground'}`}
            suppressHydrationWarning
          >
            До: {new Date(card.dueDate).toLocaleDateString()}
          </div>
        )}
      </div>
    </UICard>
  )
}
