import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization as organizationPlugin, twoFactor } from "better-auth/plugins";
import { db } from "../db";
import {
  user,
  session,
  account,
  verification,
  organization,
  member,
  invitation,
  twoFactor as twoFactorTable,
} from "../db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification, organization, member, invitation, twoFactor: twoFactorTable },
  }),
  emailAndPassword: { 
    enabled: true, 
    requireEmailVerification: false
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
    organizationPlugin({
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
