import dbConnect from "../lib/mongodb"
import User from "../models/User"
import bcrypt from "bcryptjs"

async function initDb() {
  try {
    await dbConnect()

    // Check if admin user exists
    const adminExists = await User.findOne({ username: "admin" })

    if (!adminExists) {
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

      console.log("Default admin user created")
    } else {
      console.log("Admin user already exists")
    }

    console.log("Database initialization complete")
    process.exit(0)
  } catch (error) {
    console.error("Error initializing database:", error)
    process.exit(1)
  }
}

initDb()

