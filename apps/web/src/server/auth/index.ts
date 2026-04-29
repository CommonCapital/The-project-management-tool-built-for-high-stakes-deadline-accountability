import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, twoFactor } from "better-auth/plugins";
import { db } from "../db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: "users",
      session: "sessions",
      account: "accounts",
      verification: "verifications",
    }
  }),
  emailAndPassword: { 
    enabled: true, 
    requireEmailVerification: true 
  },
  // Register custom fields so they are included in the session/user type
  user: {
    additionalFields: {
      calendarRefreshToken: {
        type: "string",
        required: false,
      },
      role: {
        type: "string",
        required: false,
      },
      orgId: {
        type: "string",
        required: false,
      }
    }
  },
  plugins: [
    organization({ 
      allowUserToCreateOrganization: false 
    }),
    twoFactor({ 
      issuer: "APEX" 
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,       // refresh daily
  },
});
