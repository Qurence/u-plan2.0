"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { OrganizationSwitcher } from "@/components/organization/organization-switcher"
import { UserButton } from "@/components/auth/user-button"
import { Plus, Settings, Users, Tag, ChevronLeft, ChevronRight, LayoutDashboard } from "lucide-react"
import type { OrganizationWithMembers } from "@/types"
import { useSidebar } from "@/contexts/sidebar-context"

export const Sidebar = () => {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [organizations, setOrganizations] = useState<OrganizationWithMembers[]>([])
  const [currentOrg, setCurrentOrg] = useState<OrganizationWithMembers | null>(null)
  const [boards, setBoards] = useState<any[]>([])
  const { collapsed, setCollapsed } = useSidebar()

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch("/api/organizations")
        const data = await response.json()
        setOrganizations(data)

        // Set current org based on pathname
        const pathParts = pathname.split("/")
        
        // Если путь содержит board/[boardId]
        if (pathParts[1] === "board") {
          const boardId = pathParts[2]
          if (boardId) {
            // Получаем информацию о доске, чтобы узнать к какой организации она принадлежит
            try {
              const boardResponse = await fetch(`/api/boards/${boardId}`)
              if (boardResponse.ok) {
                const boardData = await boardResponse.json()
                const organizationId = boardData.organizationId
                
                // Находим организацию по ID из данных доски
                const current = data.find((org: OrganizationWithMembers) => org.id === organizationId)
                if (current) {
                  setCurrentOrg(current)
                  return
                }
              }
            } catch (boardError) {
              console.error("Failed to fetch board data:", boardError)
            }
          }
        }
        
        // Если это путь organization/[orgId]
        if (pathParts[1] === "organization") {
          const orgId = pathParts[2]
          if (orgId) {
            const current = data.find((org: OrganizationWithMembers) => org.id === orgId)
            if (current) {
              setCurrentOrg(current)
              return
            }
          }
        }
        
        // Если не нашли организацию по URL, сохраняем текущую или берем первую
        // Не меняем организацию если она уже установлена
        setCurrentOrg((prev) => prev || data[0] || null)
      } catch (error) {
        console.error("Failed to fetch organizations:", error)
      }
    }

    if (session) {
      fetchOrganizations()
    }
  }, [session, pathname])

  // Загружаем доски для текущей организации
  useEffect(() => {
    const fetchBoards = async () => {
      if (!currentOrg) {
        setBoards([])
        return
      }

      try {
        const response = await fetch(`/api/organizations/${currentOrg.id}/boards`)
        if (response.ok) {
          const data = await response.json()
          setBoards(data)
        }
      } catch (error) {
        console.error("Failed to fetch boards:", error)
      }
    }

    fetchBoards()
  }, [currentOrg])

  if (!session) return null

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  // Преобразуем данные для OrganizationSwitcher
  const formattedOrgs = organizations.map(org => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    image: org.image || undefined
  }))

  const formattedCurrentOrg = currentOrg ? {
    id: currentOrg.id,
    name: currentOrg.name,
    slug: currentOrg.slug,
    image: currentOrg.image || undefined
  } : undefined

  return (
    <div className={`relative flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-r transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="space-y-4 py-4 flex flex-col h-full">
        <div className="px-3 py-2 relative">
          <div className="flex items-center justify-between w-full">
            <Link href="/organization" className={`flex items-center pl-3 ${collapsed ? 'justify-center' : ''}`}>
              {collapsed ? (
                <h1 className="text-2xl font-bold">U</h1>
              ) : (
                <h1 className="text-2xl font-bold">U-Plan</h1>
              )}
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-2" 
              onClick={toggleSidebar}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
          {!collapsed && (
            <div className="space-y-1">
              <OrganizationSwitcher organizations={formattedOrgs} currentOrganization={formattedCurrentOrg} />
            </div>
          )}
        </div>
        <Separator />
        
        {/* Раздел Boards */}
        {!collapsed && currentOrg && boards.length > 0 && (
          <>
            <div className="px-3 py-2">
              <h3 className="mb-2 px-4 text-sm font-semibold tracking-tight text-muted-foreground">Boards</h3>
              <div className="space-y-1">
                {boards.map((board) => (
                  <Button
                    key={board.id}
                    variant={pathname.includes(`/board/${board.id}`) ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href={`/board/${board.id}`}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span className="truncate">{board.title}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}
        
        <div className="px-3 py-2 flex-1">
          <div className="space-y-1">
            {!collapsed && (
              <h3 className="mb-2 px-4 text-sm font-semibold tracking-tight text-muted-foreground">Workspace</h3>
            )}
            <div className="space-y-1">
              <Button
                variant={pathname === "/organization" ? "secondary" : "ghost"}
                className={`w-full ${collapsed ? 'justify-center px-0' : 'justify-start'}`}
                asChild
              >
                <Link href="/organization">
                  <Plus className={collapsed ? "h-4 w-4" : "mr-2 h-4 w-4"} />
                  {!collapsed && "Главная"}
                </Link>
              </Button>
              <Button
                variant={pathname.includes("/members") ? "secondary" : "ghost"}
                className={`w-full ${collapsed ? 'justify-center px-0' : 'justify-start'}`}
                asChild
              >
                <Link href={currentOrg ? `/organization/${currentOrg.id}/members` : "/organization"}>
                  <Users className={collapsed ? "h-4 w-4" : "mr-2 h-4 w-4"} />
                  {!collapsed && "Members"}
                </Link>
              </Button>
              <Button
                variant={pathname.includes("/tags") ? "secondary" : "ghost"}
                className={`w-full ${collapsed ? 'justify-center px-0' : 'justify-start'}`}
                asChild
              >
                <Link href={currentOrg ? `/organization/${currentOrg.id}/tags` : "/organization"}>
                  <Tag className={collapsed ? "h-4 w-4" : "mr-2 h-4 w-4"} />
                  {!collapsed && "Tags"}
                </Link>
              </Button>
              <Button
                variant={pathname.includes("/settings") ? "secondary" : "ghost"}
                className={`w-full ${collapsed ? 'justify-center px-0' : 'justify-start'}`}
                asChild
              >
                <Link href={currentOrg ? `/organization/${currentOrg.id}/settings` : "/organization"}>
                  <Settings className={collapsed ? "h-4 w-4" : "mr-2 h-4 w-4"} />
                  {!collapsed && "Settings"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <div className={`px-3 py-2 ${collapsed ? 'flex justify-center' : ''}`}>
          <UserButton showText={!collapsed} />
        </div>
      </div>
    </div>
  )
}
