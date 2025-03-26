import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import TimeRecord from "@/models/TimeRecord"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { sessionOptions } from "@/lib/session"

// Get all time records
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getIronSession(cookies(), sessionOptions)

    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Get query parameters
    const url = new URL(req.url)
    const date = url.searchParams.get("date")
    const studentId = url.searchParams.get("studentId")

    const query: any = {}

    if (date) {
      query.date = date
    }

    if (studentId) {
      query.studentId = studentId
    }

    const records = await TimeRecord.find(query).sort({ timestamp: -1 })

    return NextResponse.json({ records })
  } catch (error) {
    console.error("Get time records error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Create a new time record
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getIronSession(cookies(), sessionOptions)

    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const data = await req.json()

    // Ensure timestamp is a Date object
    if (data.timestamp) {
      data.timestamp = new Date(data.timestamp)
    }

    const record = await TimeRecord.create(data)

    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    console.error("Create time record error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

