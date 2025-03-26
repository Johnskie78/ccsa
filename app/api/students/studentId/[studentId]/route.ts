import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Student from "@/models/Student"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { sessionOptions } from "@/lib/session"

// Get a student by student ID
export async function GET(req: NextRequest, { params }: { params: { studentId: string } }) {
  try {
    // Check authentication
    const session = await getIronSession(cookies(), sessionOptions)

    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const student = await Student.findOne({ studentId: params.studentId })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    return NextResponse.json({ student })
  } catch (error) {
    console.error("Get student by student ID error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

