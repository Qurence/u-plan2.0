import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Sidebar } from "@/components/sidebar"
import { SocketProvider } from "@/components/providers/socket-provider"
import { ModalProvider } from "@/components/providers/modal-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import CustomSessionProvider from "@/components/providers/session-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CustomSessionProvider>
      <QueryProvider>
        <SocketProvider>
          <div className="h-full">
            <div className="flex h-full">
              <div className="w-64 h-full">
                <Sidebar />
              </div>
              <main className="flex-1 h-full overflow-y-auto">{children}</main>
            </div>
            <ModalProvider />
          </div>
        </SocketProvider>
      </QueryProvider>
    </CustomSessionProvider>
  )
}
