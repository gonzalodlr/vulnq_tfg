/** @format */

import { NextResponse, NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { config as appConfig } from "@/config/config";
import { parse } from "cookie";

export async function middleware(request: NextRequest) {
  // Note: sessionStorage is not accessible on the server side (middleware runs on the server).
  // You cannot access sessionStorage here. Use cookies or headers for authentication in middleware.
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = parse(cookieHeader);
  const token = cookies.session_token;
  //console.log("Token from cookies:", token);
  let isAuthenticated = false;
  if (token) {
    try {
      // Verify token and check expiration
      //jwt.verify(token, appConfig.jwtSecret);
      isAuthenticated = true;
    } catch (err) {
      console.error("JWT verification failed:", err);
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated) {
    if (request.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "Unauthorized by frontend" },
        { status: 401 }
      );
    }
    // Redirect to the login page if not authenticated
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Continue with the request
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*"], // Protected routes
};
