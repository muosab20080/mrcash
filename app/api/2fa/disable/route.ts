import { NextRequest, NextResponse } from "next/server";
import { verify } from "otplib";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { userId, code } = await request.json();

    if (!userId || !code) {
      return NextResponse.json(
        { error: "userId and code are required" },
        { status: 400 }
      );
    }

    // Get user's 2FA secret from Firestore
    const userDoc = await adminDb.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    
    if (!userData?.twoFactorEnabled || !userData?.twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA is not enabled for this user" },
        { status: 400 }
      );
    }

    // Verify the TOTP code with window to allow for clock drift (±30 seconds)
    const isValid = verify({
      token: code,
      secret: userData.twoFactorSecret,
      window: 1,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Disable 2FA by removing the secret and flag
    await adminDb.collection("users").doc(userId).update({
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("2FA disable error:", error);
    return NextResponse.json(
      { error: "Failed to disable 2FA" },
      { status: 500 }
    );
  }
}
