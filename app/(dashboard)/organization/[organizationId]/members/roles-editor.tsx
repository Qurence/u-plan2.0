"use client"

import React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, Plus, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface CustomRole {
  id: string
  name: string
  color: string
}

export function RolesEditorDialog({ organizationId }: { organizationId: string }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit2 className="h-4 w-4 mr-2" />
          Роли
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Управление ролями</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <RoleCreator organizationId={organizationId} />
          <RolesList organizationId={organizationId} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RoleCreator({ organizationId }: { organizationId: string }) {
  const [name, setName] = React.useState("")
  const [color, setColor] = React.useState("#3b82f6")
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/custom-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color, organizationId }),
      })
      if (!res.ok) throw new Error("Не удалось создать роль")
      return res.json()
    },
    onSuccess: () => {
      setName("")
      setColor("#3b82f6")
      toast({ title: "Роль создана" })
      queryClient.invalidateQueries({ queryKey: ["customRoles", organizationId] })
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Создать новую роль</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            placeholder="Название роли"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
          />
          <Input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-16 h-10 cursor-pointer"
          />
          <Button
            onClick={() => name.trim() && createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Создать
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function RolesList({ organizationId }: { organizationId: string }) {
  const { data: roles = [], isLoading } = useQuery<CustomRole[]>({
    queryKey: ["customRoles", organizationId],
    queryFn: async () => {
      const res = await fetch(`/api/custom-roles?organizationId=${organizationId}`)
      if (!res.ok) throw new Error("Failed to fetch roles")
      return res.json()
    },
  })

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Загрузка...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Все роли ({roles.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {roles.length === 0 && (
            <div className="text-sm text-muted-foreground">Ролей пока нет</div>
          )}
          {roles.map((role) => (
            <RoleRow key={role.id} role={role} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function RoleRow({ role }: { role: CustomRole }) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [name, setName] = React.useState(role.name)
  const [color, setColor] = React.useState(role.color)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/custom-roles/${role.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      })
      if (!res.ok) throw new Error("Не удалось обновить роль")
      return res.json()
    },
    onSuccess: () => {
      setIsEditing(false)
      toast({ title: "Роль обновлена" })
      queryClient.invalidateQueries()
    },
    onError: (e: any) => {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" })
      setName(role.name)
      setColor(role.color)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/custom-roles/${role.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Не удалось удалить роль")
      return res.json()
    },
    onSuccess: () => {
      toast({ title: "Роль удалена" })
      queryClient.invalidateQueries()
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  })

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
      {isEditing ? (
        <div className="flex gap-2 flex-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
          />
          <Input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-16 h-10 cursor-pointer"
          />
          <Button
            size="sm"
            onClick={() => name.trim() && updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            Сохранить
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsEditing(false)
              setName(role.name)
              setColor(role.color)
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Badge style={{ backgroundColor: color, color: "white" }}>
              {name}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
