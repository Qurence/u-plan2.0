"use client"

import React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Trash2, Shield, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Member {
  id: string
  role: "ADMIN" | "MEMBER"
  customRoleId: string | null
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  customRole: {
    id: string
    name: string
    color: string
  } | null
}

interface CustomRole {
  id: string
  name: string
  color: string
}

export function AddMemberForm({ organizationId }: { organizationId: string }) {
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<"ADMIN" | "MEMBER">("MEMBER")
  const [customRoleId, setCustomRoleId] = React.useState<string>("none")
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: customRoles = [] } = useQuery<CustomRole[]>({
    queryKey: ["customRoles", organizationId],
    queryFn: async () => {
      const res = await fetch(`/api/custom-roles?organizationId=${organizationId}`)
      if (!res.ok) throw new Error("Failed to fetch roles")
      return res.json()
    },
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/organization-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          organizationId,
          role,
          customRoleId: customRoleId === "none" ? null : customRoleId,
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to add member")
      }
      return res.json()
    },
    onSuccess: () => {
      setEmail("")
      setRole("MEMBER")
      setCustomRoleId("none")
      toast({ title: "Участник добавлен" })
      queryClient.invalidateQueries({ queryKey: ["members", organizationId] })
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Добавить участника</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Email пользователя"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex gap-2">
            <Select value={role} onValueChange={(v) => setRole(v as "ADMIN" | "MEMBER")}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={customRoleId} onValueChange={setCustomRoleId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Кастомная роль (опционально)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без кастомной роли</SelectItem>
                {customRoles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: r.color }}
                      />
                      {r.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => email.trim() && addMutation.mutate()}
            disabled={addMutation.isPending}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Добавить
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function MembersList({ organizationId, isAdmin }: { organizationId: string; isAdmin: boolean }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ["members", organizationId],
    queryFn: async () => {
      const res = await fetch(`/api/organization-members?organizationId=${organizationId}`)
      if (!res.ok) throw new Error("Failed to fetch members")
      return res.json()
    },
  })

  const { data: customRoles = [] } = useQuery<CustomRole[]>({
    queryKey: ["customRoles", organizationId],
    queryFn: async () => {
      const res = await fetch(`/api/custom-roles?organizationId=${organizationId}`)
      if (!res.ok) throw new Error("Failed to fetch roles")
      return res.json()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ memberId, role, customRoleId }: { memberId: string; role?: string; customRoleId?: string | null }) => {
      const res = await fetch(`/api/organization-members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, customRoleId }),
      })
      if (!res.ok) throw new Error("Failed to update member")
      return res.json()
    },
    onSuccess: () => {
      toast({ title: "Участник обновлен" })
      queryClient.invalidateQueries({ queryKey: ["members", organizationId] })
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`/api/organization-members/${memberId}`, { method: "DELETE" })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete member")
      }
      return res.json()
    },
    onSuccess: () => {
      toast({ title: "Участник удален" })
      queryClient.invalidateQueries({ queryKey: ["members", organizationId] })
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  })

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Загрузка...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Участники организации ({members.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <Avatar>
                  <AvatarImage src={member.user.image || undefined} />
                  <AvatarFallback>
                    {member.user.name?.[0]?.toUpperCase() || member.user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">{member.user.name || "Без имени"}</div>
                  <div className="text-sm text-muted-foreground">{member.user.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <>
                    <Select
                      value={member.role}
                      onValueChange={(v) =>
                        updateMutation.mutate({ memberId: member.id, role: v })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            Member
                          </div>
                        </SelectItem>
                        <SelectItem value="ADMIN">
                          <div className="flex items-center gap-2">
                            <Shield className="h-3 w-3" />
                            Admin
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={member.customRoleId || "none"}
                      onValueChange={(v) =>
                        updateMutation.mutate({ memberId: member.id, customRoleId: v === "none" ? null : v })
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Роль" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Без роли</SelectItem>
                        {customRoles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: r.color }}
                              />
                              {r.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(member.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>
                      {member.role === "ADMIN" ? (
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Admin
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Member
                        </div>
                      )}
                    </Badge>
                    {member.customRole && (
                      <Badge style={{ backgroundColor: member.customRole.color, color: "white" }}>
                        {member.customRole.name}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
