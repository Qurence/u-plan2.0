"use client"

import React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, Plus } from "lucide-react"

export function TagCreator({ organizationId }: { organizationId: string }) {
  const [name, setName] = React.useState("")
  const [color, setColor] = React.useState("#3b82f6")
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color, organizationId }),
      })
      if (!res.ok) throw new Error("Не удалось создать тег")
      return res.json()
    },
    onSuccess: () => {
      setName("")
      setColor("#3b82f6")
      toast({ title: "Тег создан" })
      queryClient.invalidateQueries()
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  })

  return (
    <div className="flex gap-2">
      <Input placeholder="Название тега" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
      <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10" />
      <Button onClick={() => name.trim() && createMutation.mutate()}>
        <Plus className="h-4 w-4 mr-2" /> Создать
      </Button>
    </div>
  )
}

export function TagRow({ id, name, color }: { id: string; name: string; color: string }) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [n, setN] = React.useState(name)
  const [c, setC] = React.useState(color)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tags/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n.trim(), color: c }),
      })
      if (!res.ok) throw new Error("Не удалось обновить тег")
      return res.json()
    },
    onSuccess: () => {
      setIsEditing(false)
      toast({ title: "Тег обновлен" })
      queryClient.invalidateQueries()
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tags/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Не удалось удалить тег")
      return res.json()
    },
    onSuccess: () => {
      toast({ title: "Тег удален" })
      queryClient.invalidateQueries()
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  })

  return (
    <div className="flex items-center justify-between p-2 border rounded">
      {isEditing ? (
        <div className="flex gap-2 flex-1">
          <Input value={n} onChange={(e) => setN(e.target.value)} className="flex-1" />
          <Input type="color" value={c} onChange={(e) => setC(e.target.value)} className="w-12 h-10" />
          <Button size="sm" onClick={() => n.trim() && updateMutation.mutate()}>Сохранить</Button>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Отмена</Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Badge style={{ backgroundColor: color, color: "white" }}>{name}</Badge>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}><Edit2 className="h-3 w-3" /></Button>
            <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate()}><Trash2 className="h-3 w-3" /></Button>
          </div>
        </>
      )}
    </div>
  )
}


