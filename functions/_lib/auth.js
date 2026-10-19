import { verifyToken, createClerkClient } from "@clerk/backend";
import { neon } from "@neondatabase/serverless";

export const db = (env) => neon(env.DATABASE_URL);

// Returns the Clerk user id (sub) or null if the request isn't authenticated.
export async function getUserId(request, env) {
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  try {
    const claims = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY });
    return claims.sub;
  } catch {
    return null;
  }
}

export const clerk = (env) => createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// Mirrors the Clerk user into Neon on first sight and sends a welcome email via Resend.
export async function ensureUser(userId, env) {
  const sql = db(env);
  const existing = await sql`SELECT id FROM users WHERE id = ${userId}`;
  if (existing.length) return;

  const u = await clerk(env).users.getUser(userId);
  const email = u.emailAddresses[0]?.emailAddress;
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || null;
  await sql`INSERT INTO users (id, email, full_name) VALUES (${userId}, ${email}, ${name}) ON CONFLICT DO NOTHING`;

  if (email && env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.EMAIL_FROM || "Autoace Zambia <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to Autoace Zambia",
        html: `<p>Hi ${name || "there"}, welcome to Autoace Zambia!</p>`,
      }),
    });
  }
}
