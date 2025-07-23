"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface OrganizationSwitcherProps {
  organizations: Array<{
    id: string
    name: string
    slug: string
    image?: string
  }>
  currentOrganization?: {
    id: string
    name: string
    slug: string
    image?: string
  }
}

export const OrganizationSwitcher = ({ organizations, currentOrganization }: OrganizationSwitcherProps) => {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSelect = (organizationId: string) => {
    if (organizationId === currentOrganization?.id) {
      setOpen(false)
      return
    }

    router.push(`/organization/${organizationId}`)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-transparent"
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={currentOrganization?.image || "/placeholder.svg"} />
              <AvatarFallback>{currentOrganization?.name?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="truncate">{currentOrganization?.name || "Select organization"}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search organizations..." />
          <CommandList>
            <CommandEmpty>No organizations found.</CommandEmpty>
            <CommandGroup>
              {organizations.map((org) => (
                <CommandItem key={org.id} value={org.name} onSelect={() => handleSelect(org.id)}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={org.image || "/placeholder.svg"} />
                      <AvatarFallback>{org.name[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{org.name}</span>
                  </div>
                  <Check
                    className={cn("ml-auto h-4 w-4", currentOrganization?.id === org.id ? "opacity-100" : "opacity-0")}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup>
              <CommandItem onSelect={() => router.push("/organization/create")}>
                <Plus className="mr-2 h-4 w-4" />
                Create organization
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
