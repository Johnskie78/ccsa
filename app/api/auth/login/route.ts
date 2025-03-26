import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { sessionOptions } from "@/lib/session"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    // Find user by username
    const user = await User.findOne({ username })

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Compare password
    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create session
    const session = await getIronSession(cookies(), sessionOptions)

    // Set session data
    session.user = {
      id: user._id.toString(),
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
    }

    await session.save()

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

