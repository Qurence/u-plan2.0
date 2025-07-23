"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { FcGoogle } from "react-icons/fc"
import { ReactNode } from "react"

interface SignInButtonProps {
  children?: ReactNode
  className?: string
}

export const SignInButton = ({ children, className }: SignInButtonProps) => {
  const handleSignIn = () => {
    signIn("google", {
      callbackUrl: "/organization",
    })
  }

  return (
    <Button onClick={handleSignIn} variant="outline" size="lg" className={className || "w-full bg-transparent"}>
      <FcGoogle className="mr-2 h-5 w-5" />
      {children ? children : "Continue with Google"}
    </Button>
  )
}
