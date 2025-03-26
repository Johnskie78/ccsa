import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    await dbConnect()

    // Check if admin user exists
    const adminExists = await User.findOne({ username: "admin" })

    if (adminExists) {
      // Reset the admin password
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash("admin123", salt)

      await User.findOneAndUpdate(
        { username: "admin" },
        {
          $set: {
            password: hashedPassword,
          },
        },
      )

      return NextResponse.json({
        success: true,
        message: "Admin password reset to 'admin123'",
      })
    } else {
      // Create default admin user
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash("admin123", salt)

      await User.create({
        username: "admin",
        password: hashedPassword,
        name: "System Administrator",
        email: "admin@example.com",
        role: "admin",
      })

      return NextResponse.json({
        success: true,
        message: "Default admin user created with username 'admin' and password 'admin123'",
      })
    }
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create/reset admin user",
      },
      { status: 500 },
    )
  }
}

