import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { sessionOptions } from "@/lib/session"

// Get all users
export async function GET(req: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getIronSession(cookies(), sessionOptions)

    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await dbConnect()

    // Don't return password field
    const users = await User.find({}).select("-password").sort({ name: 1 })

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Create a new user
export async function POST(req: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getIronSession(cookies(), sessionOptions)

    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await dbConnect()

    const data = await req.json()

    // Check if username already exists
    const existingUsername = await User.findOne({ username: data.username })

    if (existingUsername) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 })
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: data.email })

    if (existingEmail) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    const user = await User.create(data)

    // Don't return password
    const userResponse = user.toObject()
    delete userResponse.password

    return NextResponse.json({ user: userResponse }, { status: 201 })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

