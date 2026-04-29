import { google } from "googleapis";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

async function getAuthenticatedClient(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user?.calendarRefreshToken) {
    throw new Error("User has not connected Google Calendar");
  }

  oauth2Client.setCredentials({
    refresh_token: user.calendarRefreshToken,
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function createCalendarEvent(userId: string, eventDetails: {
  title: string;
  description?: string;
  deadline: Date;
}) {
  const calendar = await getAuthenticatedClient(userId);

  const event = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: `APEX: ${eventDetails.title}`,
      description: eventDetails.description,
      start: {
        dateTime: eventDetails.deadline.toISOString(),
      },
      end: {
        dateTime: new Date(eventDetails.deadline.getTime() + 3600000).toISOString(), // +1 hour
      },
    },
  });

  return event.data.id;
}

export async function updateCalendarEvent(userId: string, eventId: string, eventDetails: {
  title: string;
  deadline: Date;
}) {
  const calendar = await getAuthenticatedClient(userId);

  await calendar.events.patch({
    calendarId: "primary",
    eventId,
    requestBody: {
      summary: `APEX: ${eventDetails.title}`,
      start: {
        dateTime: eventDetails.deadline.toISOString(),
      },
      end: {
        dateTime: new Date(eventDetails.deadline.getTime() + 3600000).toISOString(),
      },
    },
  });
}

export async function deleteCalendarEvent(userId: string, eventId: string) {
  const calendar = await getAuthenticatedClient(userId);

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  });
}
