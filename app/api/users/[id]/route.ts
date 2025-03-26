import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { sessionOptions } from "@/lib/session"

// Get a user by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication and authorization
    const session = await getIronSession(cookies(), sessionOptions)

    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await dbConnect()

    const user = await User.findById(params.id).select("-password")

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Update a user
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if user exists
    const user = await User.findById(params.id)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if updating to an existing username
    if (data.username && data.username !== user.username) {
      const existingUsername = await User.findOne({ username: data.username })

      if (existingUsername) {
        return NextResponse.json({ error: "Username already exists" }, { status: 400 })
      }
    }

    // Check if updating to an existing email
    if (data.email && data.email !== user.email) {
      const existingEmail = await User.findOne({ email: data.email })

      if (existingEmail) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 })
      }
    }

    // If password is empty, remove it from the update data
    if (data.password === "") {
      delete data.password
    }

    const updatedUser = await User.findByIdAndUpdate(params.id, data, { new: true, runValidators: true }).select(
      "-password",
    )

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Delete a user
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication and authorization
    const session = await getIronSession(cookies(), sessionOptions)

    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Don't allow deleting yourself
    if (session.user.id === params.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    await dbConnect()

    // Check if user exists
    const user = await User.findById(params.id)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if this is the last admin
    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" })

      if (adminCount <= 1) {
        return NextResponse.json({ error: "Cannot delete the last admin user" }, { status: 400 })
      }
    }

    await User.findByIdAndDelete(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

