import mongoose, { Schema, type Document } from "mongoose"

export interface ITimeRecord extends Document {
  studentId: string
  timestamp: Date
  type: "in" | "out"
  date: string
  createdAt: Date
  updatedAt: Date
}

const TimeRecordSchema: Schema = new Schema(
  {
    studentId: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ["in", "out"],
      required: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

// Create compound index for studentId and date
TimeRecordSchema.index({ studentId: 1, date: 1 })

export default mongoose.models.TimeRecord || mongoose.model<ITimeRecord>("TimeRecord", TimeRecordSchema)

