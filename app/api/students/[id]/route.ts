import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Student from "@/models/Student"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { sessionOptions } from "@/lib/session"

// Get a student by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getIronSession(cookies(), sessionOptions)

    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const student = await Student.findById(params.id)

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    return NextResponse.json({ student })
  } catch (error) {
    console.error("Get student error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Update a student
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

    // Check if student exists
    const student = await Student.findById(params.id)

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Check if updating to an existing student ID
    if (data.studentId !== student.studentId) {
      const existingStudent = await Student.findOne({ studentId: data.studentId })

      if (existingStudent) {
        return NextResponse.json({ error: "Student ID already exists" }, { status: 400 })
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(params.id, data, { new: true, runValidators: true })

    return NextResponse.json({ student: updatedStudent })
  } catch (error) {
    console.error("Update student error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Delete a student
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

    // Check if student exists
    const student = await Student.findById(params.id)

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    await Student.findByIdAndDelete(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete student error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

