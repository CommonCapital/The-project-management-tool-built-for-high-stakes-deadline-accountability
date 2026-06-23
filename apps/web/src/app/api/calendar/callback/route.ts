import { google } from "googleapis";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { user as users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");

  if (!code || !userId) {
    return NextResponse.redirect("/settings/calendar?error=invalid_callback");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const { tokens } = await oauth2Client.getToken(code);
  
  if (tokens.refresh_token) {
    await db.update(users)
      .set({ calendarRefreshToken: tokens.refresh_token })
      .where(eq(users.id, userId));
  }

  return NextResponse.redirect("/settings/calendar?success=connected");
}
