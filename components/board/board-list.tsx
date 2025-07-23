"use client"

import { useState } from "react"
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable"
import { ListContainer } from "./list-container"
import { CardItem } from "./card-item"
import { useSocketContext } from "@/components/providers/socket-provider"
import type { ListWithCards } from "@/types"
import type { Card } from "@prisma/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import React, { useRef } from "react"

interface BoardListProps {
  boardId: string
  lists: ListWithCards[]
}

export const BoardList = ({ boardId, lists: initialLists }: BoardListProps) => {
  const [lists, setLists] = useState(initialLists)
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [activeList, setActiveList] = useState<ListWithCards | null>(null)
  const [activeListHeight, setActiveListHeight] = useState<number | undefined>(undefined)
  const [hoveredListId, setHoveredListId] = useState<string | null>(null)
  const [overCardId, setOverCardId] = useState<string | null>(null)
  const { socket } = useSocketContext()
  const listRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // --- Для отката состояния при неудачном dnd ---
  const [prevLists, setPrevLists] = useState<ListWithCards[] | null>(null)

  // --- Новое состояние для создания списка ---
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState("")
  const [isCreatingList, setIsCreatingList] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event

    if (active.data.current?.type === "card") {
      setActiveCard(active.data.current.card)
      setPrevLists(lists)
    }
    if (active.data.current?.type === "list") {
      setActiveList(active.data.current.list)
      setPrevLists(lists)
      // вычисляем высоту колонки
      const node = listRefs.current[active.id as string]
      if (node) setActiveListHeight(node.offsetHeight)
      else setActiveListHeight(undefined)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over, active } = event
    if (active.data.current?.type === "card") {
      if (over?.data.current?.type === "list") {
        setHoveredListId(over.id as string)
        setOverCardId(null)
      } else if (over?.data.current?.type === "card") {
        // Найти список, в котором эта карточка
        const parentListId = lists.find(list => list.cards.some(card => card.id === over.id))?.id;
        setHoveredListId(parentListId || null);
        setOverCardId(over.id as string)
      } else {
        setHoveredListId(null)
        setOverCardId(null)
      }
    } else {
      setHoveredListId(null)
      setOverCardId(null)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null)
    setHoveredListId(null)
    setOverCardId(null)
    setActiveList(null)
    setActiveListHeight(undefined)

    const { active, over } = event
    const cardId = active.data.current?.type === "card" ? (active.id as string) : undefined;
    const overId = over?.id as string | undefined;

    if (!over && prevLists) {
      setLists(prevLists)
      setPrevLists(null)
      return
    }
    setPrevLists(null)

    if (active.data.current?.type === "card") {
      const cardId = active.id as string
      const overId = over?.id as string

      // Найти список, где сейчас карточка
      const activeListIndex = lists.findIndex((list) => list.cards.find((card) => card.id === cardId))
      const overListIndex = lists.findIndex((list) => list.cards.find((card) => card.id === overId))

      // Если перемещение внутри одного списка
      if (activeListIndex !== -1 && activeListIndex === overListIndex && overId && cardId !== overId) {
        const list = lists[activeListIndex]
        const oldIndex = list.cards.findIndex((card) => card.id === cardId)
        const newIndex = list.cards.findIndex((card) => card.id === overId)
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newCards = arrayMove(list.cards, oldIndex, newIndex)
          setLists((prev) => prev.map((l, idx) => (idx === activeListIndex ? { ...l, cards: newCards } : l)))
          // Сохраняем порядок на сервере
          try {
            await fetch("/api/cards/reorder", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cards: newCards.map((c, i) => ({ id: c.id, order: i + 1 })) }),
            })
          } catch (error) {
            console.error("Failed to reorder cards:", error)
          }
        }
        return
      }

      // Если dragged карточку перетаскивают в конец того же списка
      if (
        hoveredListId &&
        activeListIndex !== -1 &&
        lists[activeListIndex].id === hoveredListId &&
        lists[activeListIndex].cards[lists[activeListIndex].cards.length - 1]?.id !== cardId
      ) {
        const list = lists[activeListIndex];
        const oldIndex = list.cards.findIndex((card) => card.id === cardId);
        if (oldIndex !== -1) {
          const newCards = arrayMove(list.cards, oldIndex, list.cards.length - 1);
          setLists((prev) =>
            prev.map((l, idx) => (idx === activeListIndex ? { ...l, cards: newCards } : l))
          );
          // Сохраняем порядок на сервере
          try {
            await fetch("/api/cards/reorder", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cards: newCards.map((c, i) => ({ id: c.id, order: i + 1 })) }),
            });
          } catch (error) {
            console.error("Failed to reorder cards:", error);
          }
        }
        return;
      }

      // --- Перемещение между списками в середину ---
      if (
        overCardId &&
        hoveredListId &&
        activeListIndex !== -1 &&
        lists[activeListIndex].id !== hoveredListId
      ) {
        const fromList = lists[activeListIndex];
        const toListIndex = lists.findIndex(list => list.id === hoveredListId);
        if (toListIndex !== -1) {
          const toList = lists[toListIndex];
          const card = fromList.cards.find(card => card.id === cardId)!;
          const newFromCards = fromList.cards.filter(card => card.id !== cardId);
          // СНАЧАЛА обновляем локальное состояние мгновенно
          let newToCards = toList.cards.filter(c => c.id !== cardId);
          const overIdx = newToCards.findIndex(card => card.id === overCardId);
          if (overIdx === -1) {
            newToCards = [{ ...card, listId: toList.id }, ...newToCards];
          } else {
            newToCards = [
              ...newToCards.slice(0, overIdx),
              { ...card, listId: toList.id },
              ...newToCards.slice(overIdx)
            ];
          }
          setLists(prev =>
            prev.map((l, idx) => {
              if (idx === activeListIndex) return { ...l, cards: newFromCards };
              if (idx === toListIndex) return { ...l, cards: newToCards };
              return l;
            })
          );
          // Затем делаем move и reorder на сервере (асинхронно)
          try {
            await fetch(`/api/cards/${cardId}/move`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ listId: toList.id }),
            });
          } catch (error) {
            console.error("Failed to move card:", error);
          }
          try {
            await fetch("/api/cards/reorder", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cards: newToCards.map((c, i) => ({ id: c.id, order: i + 1 })) }),
            });
          } catch (error) {
            console.error("Failed to reorder cards:", error);
          }
        }
        return;
      }
      // --- Аналогично для dnd в конец ---
      if (
        hoveredListId &&
        activeListIndex !== -1 &&
        lists[activeListIndex].id !== hoveredListId
      ) {
        const fromList = lists[activeListIndex];
        const toListIndex = lists.findIndex(list => list.id === hoveredListId);
        if (toListIndex !== -1) {
          const toList = lists[toListIndex];
          const card = fromList.cards.find(card => card.id === cardId)!;
          const newFromCards = fromList.cards.filter(card => card.id !== cardId);
          const newToCards = [...toList.cards, { ...card, listId: toList.id }];
          setLists(prev =>
            prev.map((l, idx) => {
              if (idx === activeListIndex) return { ...l, cards: newFromCards };
              if (idx === toListIndex) return { ...l, cards: newToCards };
              return l;
            })
          );
          // Сначала меняем listId на сервере
          try {
            await fetch(`/api/cards/${cardId}/move`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ listId: toList.id }),
            });
          } catch (error) {
            console.error("Failed to move card:", error);
          }
          // Затем сохраняем порядок
          try {
            await fetch("/api/cards/reorder", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cards: newToCards.map((c, i) => ({ id: c.id, order: i + 1 })) }),
            });
          } catch (error) {
            console.error("Failed to reorder cards:", error);
          }
        }
        return;
      }

      // Серверное обновление (move) больше не нужен, порядок и список обновляются через reorder
    }
    if (active.data.current?.type === "list") {
      const oldIndex = lists.findIndex(l => l.id === active.id)
      const newIndex = over ? lists.findIndex(l => l.id === over.id) : -1
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newLists = arrayMove(lists, oldIndex, newIndex)
        setLists(newLists)
        // Сохраняем порядок списков на сервере
        try {
          await fetch(`/api/boards/${boardId}/lists`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lists: newLists.map((l: ListWithCards, i) => ({ id: l.id, order: i + 1 })) }),
          })
        } catch (e) {
          // Можно добавить обработку ошибки, если нужно
        }
      }
      setPrevLists(null)
      return
    }
  }

  // --- Функция создания списка ---
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListTitle.trim()) return
    setIsCreatingList(true)
    try {
      const res = await fetch(`/api/boards/${boardId}/lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newListTitle }),
      })
      if (!res.ok) throw new Error("Ошибка при создании списка")
      const list = await res.json()
      setLists((prev) => [...prev, { ...list, cards: [] }])
      setNewListTitle("")
      setIsAddingList(false)
      toast.success("Список создан!")
    } catch (err: any) {
      toast.error(err?.message || "Ошибка при создании списка")
    } finally {
      setIsCreatingList(false)
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 pl-4 items-start">
        <SortableContext items={lists.map((list) => list.id)} strategy={horizontalListSortingStrategy}>
          {lists.map((list) => (
            <div
              key={list.id}
              ref={el => { listRefs.current[list.id] = el; return undefined; }}
              style={{ display: "flex" }}
            >
              <ListContainer
                list={list}
                boardId={boardId}
                activeCardId={activeCard?.id}
                hoveredListId={hoveredListId || undefined}
                overCardId={overCardId || undefined}
                onCardCreated={(card) => {
                  setLists(prev => prev.map(l => l.id === list.id ? { ...l, cards: [...l.cards, card] } : l))
                }}
                isOverlay={false}
                overlayHeight={undefined}
              />
            </div>
          ))}
        </SortableContext>
        {/* --- UI для создания нового списка --- */}
        <div className="w-[272px] shrink-0">
          {isAddingList ? (
            <form onSubmit={handleCreateList} className="bg-muted/50 backdrop-blur-sm rounded-md p-4 flex flex-col gap-2">
              <Input
                value={newListTitle}
                onChange={e => setNewListTitle(e.target.value)}
                placeholder="Название списка"
                autoFocus
                disabled={isCreatingList}
              />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => { setIsAddingList(false); setNewListTitle("") }} disabled={isCreatingList}>Отмена</Button>
                <Button type="submit" size="sm" disabled={isCreatingList || !newListTitle.trim()}>{isCreatingList ? "Создание..." : "Создать"}</Button>
              </div>
            </form>
          ) : (
            <Button variant="ghost" className="w-full min-h-[56px] justify-start text-muted-foreground bg-muted/50 hover:text-foreground hover:bg-muted/70" onClick={() => setIsAddingList(true)}>
              <span className="mr-2">+</span> Новый список
            </Button>
          )}
        </div>
      </div>
      <DragOverlay>
        {activeCard && <CardItem card={activeCard} />}
        {activeList && <ListContainer list={activeList} boardId={boardId} isOverlay={true} hoveredListId={hoveredListId || undefined} overlayHeight={activeListHeight} />}
      </DragOverlay>
    </DndContext>
  )
}
