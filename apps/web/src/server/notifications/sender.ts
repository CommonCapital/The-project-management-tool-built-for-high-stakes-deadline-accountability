import { db } from "../db";
import { notifications, users } from "../db/schema";
import { redis } from "../redis";
import nodemailer from "nodemailer";
import { eq } from "drizzle-orm";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface NotificationPayload {
  userId: string;
  orgId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  emailOnly?: boolean;
}

export async function sendNotification(payload: NotificationPayload) {
  const { userId, orgId, type, title, body, link, emailOnly } = payload;

  // 1. Get user preferences
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return;

  // 2. In-app notification
  if (!emailOnly) {
    const id = crypto.randomUUID();
    await db.insert(notifications).values({
      id,
      userId,
      orgId,
      type,
      title,
      body,
      link,
    });

    // Publish to Redis for real-time WS delivery
    await redis.publish(`org:${orgId}:notifications`, JSON.stringify({
      userId,
      title,
      body,
      link,
    }));
  }

  // 3. Email notification (checking preferences if implemented)
  // For now, send if it's a critical tier or if user has email set
  const shouldSendEmail = type === "critical" || type === "overdue" || type === "urgent";
  
  if (shouldSendEmail && user.email) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: `APEX Alert: ${title}`,
        text: `${body}\n\nView here: ${process.env.NEXT_PUBLIC_APP_URL}${link || ""}`,
        html: `
          <div style="font-family: monospace; padding: 20px; border: 1px solid #000;">
            <h2 style="text-transform: uppercase;">APEX_NOTIFICATION</h2>
            <hr />
            <p><strong>TYPE:</strong> ${type.toUpperCase()}</p>
            <p><strong>ALERT:</strong> ${title}</p>
            <p>${body}</p>
            <br />
            <a href="${process.env.NEXT_PUBLIC_APP_URL}${link || ""}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; text-transform: uppercase;">Execute_Action</a>
          </div>
        `,
      });
    } catch (err) {
      console.error("[Email] Failed to send notification:", err);
    }
  }
}
