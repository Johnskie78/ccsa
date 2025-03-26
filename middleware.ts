import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/login"

  // Get the token from the cookies
  const isAuthenticated = request.cookies.has("student-time-tracking-session")

  // Redirect logic
  if (isPublicPath && isAuthenticated) {
    // If user is on a public path and is authenticated, redirect to dashboard
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (!isPublicPath && !isAuthenticated) {
    // If user is not on a public path and is not authenticated, redirect to login
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Match all paths except for:
    // - api routes that handle their own auth
    // - static files (images, etc)
    // - favicon.ico
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}

