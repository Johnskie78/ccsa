import { type NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { sessionOptions } from "@/lib/session"

export async function GET(req: NextRequest) {
  try {
    const session = await getIronSession(cookies(), sessionOptions)

    if (session.user) {
      return NextResponse.json({ user: session.user })
    } else {
      return NextResponse.json({ user: null })
    }
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

