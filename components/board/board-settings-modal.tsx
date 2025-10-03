"use client"

import React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, X, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CustomRole {
  id: string
  name: string
  color: string
}

interface BoardRole {
  id: string
  customRole: CustomRole
}

export function BoardSettingsModal({ boardId, organizationId }: { boardId: string; organizationId: string }) {
  const [open, setOpen] = React.useState(false)
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>("none")
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Получаем все роли организации
  const { data: allRoles = [] } = useQuery<CustomRole[]>({
    queryKey: ["customRoles", organizationId],
    queryFn: async () => {
      const res = await fetch(`/api/custom-roles?organizationId=${organizationId}`)
      if (!res.ok) throw new Error("Failed to fetch roles")
      return res.json()
    },
  })

  // Получаем роли, имеющие доступ к доске
  const { data: boardRoles = [], isLoading } = useQuery<BoardRole[]>({
    queryKey: ["boardRoles", boardId],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}/roles`)
      if (!res.ok) throw new Error("Failed to fetch board roles")
      return res.json()
    },
    enabled: open,
  })

  // Добавить роль
  const addRoleMutation = useMutation({
    mutationFn: async (customRoleId: string) => {
      const res = await fetch(`/api/boards/${boardId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customRoleId }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to add role")
      }
      return res.json()
    },
    onSuccess: () => {
      setSelectedRoleId("none")
      toast({ title: "Роль добавлена" })
      queryClient.invalidateQueries({ queryKey: ["boardRoles", boardId] })
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  })

  // Удалить роль
  const removeRoleMutation = useMutation({
    mutationFn: async (customRoleId: string) => {
      const res = await fetch(`/api/boards/${boardId}/roles?customRoleId=${customRoleId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to remove role")
      return res.json()
    },
    onSuccess: () => {
      toast({ title: "Роль удалена" })
      queryClient.invalidateQueries({ queryKey: ["boardRoles", boardId] })
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  })

  // Роли, которые еще не добавлены
  const availableRoles = allRoles.filter(
    (role) => !boardRoles.some((br) => br.customRole.id === role.id)
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="bg-white/0 text-white-900 hover:text-white">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Настройки доступа к доске</DialogTitle>
          <DialogDescription>
            Управляйте ролями, которые имеют доступ к этой доске. Если роли не назначены, доска доступна всем участникам организации.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Добавление роли */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Добавить роль</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Выберите роль</SelectItem>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: role.color }}
                          />
                          {role.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => selectedRoleId !== "none" && addRoleMutation.mutate(selectedRoleId)}
                  disabled={selectedRoleId === "none" || addRoleMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Список ролей с доступом */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Роли с доступом ({boardRoles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Загрузка...</div>
              ) : boardRoles.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Роли не назначены. Доска доступна всем участникам организации.
                </div>
              ) : (
                <div className="space-y-2">
                  {boardRoles.map((boardRole) => (
                    <div
                      key={boardRole.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <Badge
                        style={{
                          backgroundColor: boardRole.customRole.color,
                          color: "white",
                        }}
                      >
                        {boardRole.customRole.name}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRoleMutation.mutate(boardRole.customRole.id)}
                        disabled={removeRoleMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
