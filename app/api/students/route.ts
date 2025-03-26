import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Student from "@/models/Student"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { sessionOptions } from "@/lib/session"

// Get all students
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getIronSession(cookies(), sessionOptions)

    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const students = await Student.find({}).sort({ lastName: 1, firstName: 1 })

    return NextResponse.json({ students })
  } catch (error) {
    console.error("Get students error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Create a new student
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

    // Check if student ID already exists
    const existingStudent = await Student.findOne({ studentId: data.studentId })

    if (existingStudent) {
      return NextResponse.json({ error: "Student ID already exists" }, { status: 400 })
    }

    const student = await Student.create(data)

    return NextResponse.json({ student }, { status: 201 })
  } catch (error) {
    console.error("Create student error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

