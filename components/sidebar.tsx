"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { OrganizationSwitcher } from "@/components/organization/organization-switcher"
import { UserButton } from "@/components/auth/user-button"
import { Plus, Settings, Users } from "lucide-react"
import type { OrganizationWithMembers } from "@/types"

export const Sidebar = () => {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [organizations, setOrganizations] = useState<OrganizationWithMembers[]>([])
  const [currentOrg, setCurrentOrg] = useState<OrganizationWithMembers | null>(null)

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch("/api/organizations")
        const data = await response.json()
        setOrganizations(data)

        // Set current org based on pathname
        const orgId = pathname.split("/")[2]
        const current = data.find((org: OrganizationWithMembers) => org.id === orgId)
        setCurrentOrg(current || data[0] || null)
      } catch (error) {
        console.error("Failed to fetch organizations:", error)
      }
    }

    if (session) {
      fetchOrganizations()
    }
  }, [session, pathname])

  if (!session) return null

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-r">
      <div className="px-3 py-2">
        <Link href="/organization" className="flex items-center pl-3 mb-14">
          <h1 className="text-2xl font-bold">U-Plan</h1>
        </Link>
        <div className="space-y-1">
          <OrganizationSwitcher organizations={organizations} currentOrganization={currentOrg} />
        </div>
      </div>
      <Separator />
      <div className="px-3 py-2 flex-1">
        <div className="space-y-1">
          <h3 className="mb-2 px-4 text-lg font-semibold tracking-tight">Workspace</h3>
          <div className="space-y-1">
            <Button
              variant={pathname.includes("/boards") ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link href={currentOrg ? `/organization/${currentOrg.id}` : "/organization"}>
                <Plus className="mr-2 h-4 w-4" />
                Boards
              </Link>
            </Button>
            <Button
              variant={pathname.includes("/members") ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link href={currentOrg ? `/organization/${currentOrg.id}/members` : "/organization"}>
                <Users className="mr-2 h-4 w-4" />
                Members
              </Link>
            </Button>
            <Button
              variant={pathname.includes("/settings") ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link href={currentOrg ? `/organization/${currentOrg.id}/settings` : "/organization"}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="px-3 py-2">
        <UserButton />
      </div>
    </div>
  )
}
