"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Card } from "@prisma/client"
import { Card as UICard } from "@/components/ui/card"
import { useCardModal } from "@/hooks/use-card-modal"

interface CardItemProps {
  card: Card
  isDragging?: boolean
}

export const CardItem = ({ card, isDragging }: CardItemProps) => {
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
        <h4 className="text-sm font-medium">{card.title}</h4>
        {card.description && <p className="text-xs text-muted-foreground line-clamp-2">{card.description}</p>}
        {card.dueDate && (
          <div className="text-xs text-orange-600 dark:text-orange-400">
            Due: {new Date(card.dueDate).toLocaleDateString()}
          </div>
        )}
      </div>
    </UICard>
  )
}
