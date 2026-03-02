import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Decode token (in production, verify JWT properly)
    try {
      const decoded = JSON.parse(Buffer.from(token, "base64").toString());

      // Check if token is expired
      if (decoded.exp < Date.now()) {
        return NextResponse.json(
          { success: false, error: "Token expired" },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.email.split("@")[0],
        },
        token,
      });
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { success: false, error: "Auth check failed" },
      { status: 500 }
    );
  }
}
