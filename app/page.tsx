import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, CheckCircle, Users, Zap } from "lucide-react"
import { db } from "@/lib/db"
import { SignInButton } from "@/components/auth/sign-in-button"
import Spline from '@splinetool/react-spline/next'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  const userId = (session?.user as { id?: string })?.id
  // if (userId) {
  //   redirect("/organization")
  // }

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Spline Background - Full Page */}
      <div className="fixed inset-0 w-full h-full z-0">
        <Spline
          scene="./scene.splinecode"
        />
      </div>

      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b relative z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <Link className="flex items-center justify-center" href="/">
          <span className="text-2xl font-bold">U-Plan</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/sign-in">
            <Button variant="outline">Sign In</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="w-full h-screen relative z-10">
        <div className="container px-4 md:px-6 h-full flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Organize Your Work with <span className="text-blue-600 dark:text-blue-400">U-Plan</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                A powerful project management tool inspired by Trello. Create boards, manage tasks, and collaborate with
                your team in real-time.
              </p>
            </div>
            <div className="space-x-4">
              <SignInButton className="bg-blue-600 hover:bg-blue-700 text-white w-auto px-8 py-6 text-lg">
                Get Started
              </SignInButton>
            </div>
          </div>
        </div>
      </section>

      {/* Spacer sections for scrolling */}
      <section className="w-full h-screen relative z-10"></section>
      <section className="w-full h-screen relative z-10"></section>
      <section className="w-full h-screen relative z-10"></section>

      {/* Features Section */}
      {/* <section className="w-full py-12 md:py-24 lg:py-32 relative z-10 bg-white dark:bg-gray-950">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
            <Card>
              <CardHeader>
                <CheckCircle className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Easy Task Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create cards, organize them in lists, and move them across different stages of your workflow with
                  intuitive drag-and-drop.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Team Collaboration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Invite team members, assign tasks, add comments, and work together seamlessly on your projects.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Real-time Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  See changes instantly as your team updates tasks, adds comments, or moves cards across the board.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section> */}

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t relative z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 U-Plan. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
