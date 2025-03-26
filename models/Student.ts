import mongoose, { Schema, type Document } from "mongoose"

export interface IStudent extends Document {
  studentId: string
  lastName: string
  firstName: string
  middleName: string
  yearLevel: string
  course: string
  status: "active" | "inactive"
  photoUrl: string
  createdAt: Date
  updatedAt: Date
}

const StudentSchema: Schema = new Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    middleName: {
      type: String,
      default: "",
    },
    yearLevel: {
      type: String,
      required: true,
    },
    course: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    photoUrl: {
      type: String,
      default: "/placeholder.svg?height=100&width=100",
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema)

