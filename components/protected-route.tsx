"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export default function ProtectedRoute({ children, adminOnly = true }: ProtectedRouteProps) {
  const { user, status } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") {
      // Wait for auth to initialize
      return
    }

    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (adminOnly && user?.role !== "admin") {
      router.push("/unauthorized")
      return
    }
  }, [status, user, router, adminOnly])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (status === "unauthenticated" || (adminOnly && user?.role !== "admin")) {
    return null
  }

  return <>{children}</>
}

