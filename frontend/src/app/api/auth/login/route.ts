import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Demo user - replace with actual database lookup
const DEMO_USER = {
  id: "1",
  email: "admin@bot.com",
  password: "admin123",
  name: "Admin",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    // Validate credentials (replace with actual database check)
    if (email === DEMO_USER.email && password === DEMO_USER.password) {
      // Generate JWT token (in production, use proper JWT library)
      const token = Buffer.from(
        JSON.stringify({
          userId: DEMO_USER.id,
          email: DEMO_USER.email,
          exp: Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000,
        })
      ).toString("base64");

      // Set cookie
      const cookieStore = await cookies();
      cookieStore.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
        path: "/",
      });

      return NextResponse.json({
        success: true,
        token,
        user: {
          id: DEMO_USER.id,
          email: DEMO_USER.email,
          name: DEMO_USER.name,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid credentials" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
