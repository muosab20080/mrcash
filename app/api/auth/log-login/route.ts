import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// Free IP geolocation API
async function getCountryFromIP(ip: string): Promise<string> {
  try {
    // Skip for localhost/private IPs
    if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
      return "Local";
    }
    
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode`);
    if (!response.ok) return "Unknown";
    
    const data = await response.json();
    return data.country || "Unknown";
  } catch {
    return "Unknown";
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Get IP from headers
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0].trim() || realIP || "Unknown";
    
    // Get user agent
    const userAgent = request.headers.get("user-agent") || "Unknown";
    
    // Get country from IP
    const country = await getCountryFromIP(ip);
    
    // Log to loginHistory collection
    await adminDb.collection("loginHistory").add({
      userId,
      ip,
      country,
      userAgent,
      timestamp: FieldValue.serverTimestamp(),
    });
    
    // Update user document with last login info
    await adminDb.collection("users").doc(userId).update({
      lastLoginIP: ip,
      lastLoginCountry: country,
      lastLoginAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, country });
  } catch (error) {
    console.error("Log login error:", error);
    return NextResponse.json(
      { error: "Failed to log login" },
      { status: 500 }
    );
  }
}
