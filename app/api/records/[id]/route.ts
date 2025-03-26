import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import TimeRecord from "@/models/TimeRecord"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { sessionOptions } from "@/lib/session"

// Get a time record by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getIronSession(cookies(), sessionOptions)

    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const record = await TimeRecord.findById(params.id)

    if (!record) {
      return NextResponse.json({ error: "Time record not found" }, { status: 404 })
    }

    return NextResponse.json({ record })
  } catch (error) {
    console.error("Get time record error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Update a time record
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

    // Ensure timestamp is a Date object
    if (data.timestamp) {
      data.timestamp = new Date(data.timestamp)
    }

    // Check if record exists
    const record = await TimeRecord.findById(params.id)

    if (!record) {
      return NextResponse.json({ error: "Time record not found" }, { status: 404 })
    }

    const updatedRecord = await TimeRecord.findByIdAndUpdate(params.id, data, { new: true, runValidators: true })

    return NextResponse.json({ record: updatedRecord })
  } catch (error) {
    console.error("Update time record error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Delete a time record
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

    await dbConnect()

    // Check if record exists
    const record = await TimeRecord.findById(params.id)

    if (!record) {
      return NextResponse.json({ error: "Time record not found" }, { status: 404 })
    }

    await TimeRecord.findByIdAndDelete(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete time record error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

