"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Clock, Users, BarChart, QrCode, UserCog } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function Nav() {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState("")
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  useEffect(() => {
    // Set active tab based on current path
    if (pathname === "/") {
      setActiveTab("scanner")
    } else if (pathname === "/students") {
      setActiveTab("students")
    } else if (pathname === "/records") {
      setActiveTab("records")
    } else if (pathname === "/reports") {
      setActiveTab("reports")
    } else if (pathname === "/admin") {
      setActiveTab("admin")
    }
  }, [pathname])

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="container mx-auto flex justify-center">
        <div className="flex space-x-1 p-1">
          <Link href="/" passHref>
            <Button
              variant={activeTab === "scanner" ? "default" : "ghost"}
              className="flex items-center"
              onClick={() => setActiveTab("scanner")}
            >
              <QrCode className="mr-2 h-4 w-4" />
              Scanner
            </Button>
          </Link>

          {isAdmin && (
            <>
              <Link href="/students" passHref>
                <Button
                  variant={activeTab === "students" ? "default" : "ghost"}
                  className="flex items-center"
                  onClick={() => setActiveTab("students")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Students
                </Button>
              </Link>
              <Link href="/records" passHref>
                <Button
                  variant={activeTab === "records" ? "default" : "ghost"}
                  className="flex items-center"
                  onClick={() => setActiveTab("records")}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Records
                </Button>
              </Link>
              <Link href="/reports" passHref>
                <Button
                  variant={activeTab === "reports" ? "default" : "ghost"}
                  className="flex items-center"
                  onClick={() => setActiveTab("reports")}
                >
                  <BarChart className="mr-2 h-4 w-4" />
                  Reports
                </Button>
              </Link>
              <Link href="/admin" passHref>
                <Button
                  variant={activeTab === "admin" ? "default" : "ghost"}
                  className="flex items-center"
                  onClick={() => setActiveTab("admin")}
                >
                  <UserCog className="mr-2 h-4 w-4" />
                  Admin
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

