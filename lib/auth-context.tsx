"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type UserRole = "admin" | "user" | null
export type AuthStatus = "loading" | "authenticated" | "unauthenticated"

export interface User {
  id: string
  username: string
  name: string
  email: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  status: AuthStatus
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  getAdminUsers: () => Promise<User[]>
  addAdminUser: (user: {
    username: string
    password: string
    name: string
    email: string
    role: UserRole
  }) => Promise<User>
  updateAdminUser: (
    id: string,
    user: { username?: string; password?: string; name?: string; email?: string; role?: UserRole },
  ) => Promise<User>
  deleteAdminUser: (id: string) => Promise<boolean>
  getCurrentUser: () => User | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>("loading")

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const response = await fetch("/api/auth/user")
        const data = await response.json()

        if (data.user) {
          setUser(data.user)
          setStatus("authenticated")
        } else {
          setStatus("unauthenticated")
        }
      } catch (error) {
        console.error("Error checking user session:", error)
        setStatus("unauthenticated")
      }
    }

    checkUser()
  }, [])

  const getAdminUsers = async (): Promise<User[]> => {
    try {
      const response = await fetch("/api/users")
      const data = await response.json()

      if (response.ok) {
        return data.users || []
      } else {
        throw new Error(data.error || "Failed to get admin users")
      }
    } catch (error) {
      console.error("Error getting admin users:", error)
      return []
    }
  }

  const addAdminUser = async (newUser: {
    username: string
    password: string
    name: string
    email: string
    role: UserRole
  }): Promise<User> => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      })

      const data = await response.json()

      if (response.ok) {
        return data.user
      } else {
        throw new Error(data.error || "Failed to add admin user")
      }
    } catch (error) {
      console.error("Error adding admin user:", error)
      throw error
    }
  }

  const updateAdminUser = async (
    id: string,
    updatedUser: { username?: string; password?: string; name?: string; email?: string; role?: UserRole },
  ): Promise<User> => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedUser),
      })

      const data = await response.json()

      if (response.ok) {
        // Update current user if it's the same user
        if (user?.id === id) {
          setUser({
            ...user,
            ...data.user,
          })
        }

        return data.user
      } else {
        throw new Error(data.error || "Failed to update admin user")
      }
    } catch (error) {
      console.error("Error updating admin user:", error)
      throw error
    }
  }

  const deleteAdminUser = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        return true
      } else {
        throw new Error(data.error || "Failed to delete admin user")
      }
    } catch (error) {
      console.error("Error deleting admin user:", error)
      throw error
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok && data.user) {
        setUser(data.user)
        setStatus("authenticated")
        return true
      }

      return false
    } catch (error) {
      console.error("Error during login:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      })

      setUser(null)
      setStatus("unauthenticated")
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  const getCurrentUser = (): User | null => {
    return user
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        logout,
        getAdminUsers,
        addAdminUser,
        updateAdminUser,
        deleteAdminUser,
        getCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

