import { type NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { sessionOptions } from "@/lib/session"

export async function POST(req: NextRequest) {
  try {
    const session = await getIronSession(cookies(), sessionOptions)

    // Destroy session
    session.destroy()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

