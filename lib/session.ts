import type { IronSessionOptions } from "iron-session"

export interface SessionData {
  user?: {
    id: string
    username: string
    name: string
    email: string
    role: string
  }
}

export const sessionOptions: IronSessionOptions = {
  password: process.env.SESSION_PASSWORD || "complex_password_at_least_32_characters_long",
  cookieName: "student-time-tracking-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
}

// This is where we specify the typings of req.session.*
declare module "iron-session" {
  interface IronSessionData extends SessionData {}
}

