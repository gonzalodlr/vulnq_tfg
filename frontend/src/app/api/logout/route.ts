/** @format */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const response = NextResponse.json({ message: "Logged out successfully" });

  // Borrar cookie en el lado del cliente (el navegador)
  response.cookies.set("session_token", "", {
    httpOnly: true,
    secure: true,
    path: "/",
    expires: new Date(0), // Fuerza expiración en el pasado
    sameSite: "lax",
  });

  return response;
}
