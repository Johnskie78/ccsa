import dbConnect from "../lib/mongodb"
import User from "../models/User"
import bcrypt from "bcryptjs"

async function createAdmin() {
  try {
    console.log("Connecting to database...")
    await dbConnect()
    console.log("Connected to database")

    // Check if admin user exists
    const adminExists = await User.findOne({ username: "admin" })

    if (adminExists) {
      console.log("Admin user already exists. Resetting password...")

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

      console.log("Admin password reset to 'admin123'")
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

      console.log("Default admin user created with username 'admin' and password 'admin123'")
    }

    console.log("Operation completed successfully")
    process.exit(0)
  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  }
}

createAdmin()

