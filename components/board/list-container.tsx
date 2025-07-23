"use client"

import React, { useRef, useEffect, useState } from "react"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CardItem } from "./card-item"
import { MoreHorizontal, Plus } from "lucide-react"
import { useAction } from "@/hooks/use-action"
import { createCard } from "@/actions/create-card"
import type { ListWithCards } from "@/types"

interface ListContainerProps {
  list: ListWithCards
  boardId: string
  onCardCreated?: (card: any) => void
  activeCardId?: string
  hoveredListId?: string
  overCardId?: string
  isOverlay?: boolean // добавил проп
  overlayHeight?: number // высота для overlay/placeholder
}

export const ListContainer = ({ list, boardId, onCardCreated, activeCardId, hoveredListId, overCardId, isOverlay, overlayHeight }: ListContainerProps) => {
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [cardTitle, setCardTitle] = useState("")
  const localRef = useRef<HTMLDivElement>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
    data: {
      type: "list",
      list,
    },
  })

  const { execute: executeCreateCard, isLoading } = useAction(createCard, {
    onSuccess: (result) => {
      setCardTitle("")
      setIsAddingCard(false)
      if (onCardCreated) {
        if (result && typeof result === 'object' && 'data' in result) {
          onCardCreated(result.data)
        } else {
          onCardCreated(result)
        }
      }
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardTitle.trim()) return

    executeCreateCard({
      title: cardTitle,
      listId: list.id,
      boardId,
    })
  }

  if (isOverlay) {
    // Упрощённый вид для DragOverlay списка
    return (
      <div
        className="w-[272px] shrink-0 bg-muted/70 rounded-md opacity-80 border-2 border-dashed border-muted-foreground/25"
        style={overlayHeight ? { height: overlayHeight } : {}}
        ref={setNodeRef}
      >
        <div className="px-3 py-2 cursor-grab">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{list.title}</h3>
          </div>
        </div>
        <div className="px-3 pb-3 min-h-[48px]" />
      </div>
    )
  }

  if (isDragging) {
    return (
      <div
        className="w-[272px]"
        style={{
          height: overlayHeight ? overlayHeight : undefined,
          visibility: "hidden",
        }}
        ref={setNodeRef}
      />
    )
  }

  return (
    <Card ref={setNodeRef} style={style} {...attributes} className="w-[272px] shrink-0 bg-muted/50 backdrop-blur-sm">
      <CardHeader {...listeners} className="px-3 py-2 cursor-grab rounded-t-md hover:bg-muted/80 transition mb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{list.title}</h3>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-2">
        {/* Карточки списка с placeholder между ними */}
        {list.cards.map((card) => (
          <React.Fragment key={card.id}>
            {overCardId === card.id && activeCardId !== card.id && (
              <div className="bg-muted border-2 border-dashed border-muted-foreground/10 rounded-md mb-2 min-h-[48px]" />
            )}
            <CardItem card={card} isDragging={activeCardId === card.id} />
          </React.Fragment>
        ))}
        {/* Placeholder для dnd: показываем если сейчас над этим списком (в конец), только если overCardId не совпадает ни с одной карточкой */}
        {activeCardId && hoveredListId === list.id && (!overCardId || !list.cards.some(card => card.id === overCardId)) && (
          (!list.cards.length || list.cards[list.cards.length - 1]?.id !== activeCardId || !list.cards.some(card => card.id === activeCardId)) && (
            <div className="bg-muted border-2 border-dashed border-muted-foreground/10 rounded-md mb-2 min-h-[48px]" />
          )
        )}

        {isAddingCard ? (
          <form onSubmit={handleAddCard} className="space-y-2">
            <Input
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
              placeholder="Enter card title..."
              autoFocus
              disabled={isLoading}
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isLoading || !cardTitle.trim()}>
                Add
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddingCard(false)
                  setCardTitle("")
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => setIsAddingCard(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add a card
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
