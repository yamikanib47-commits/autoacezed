import { db, getUserId, clerk, json } from "./auth.js";

// Returns { userId, email } for an admin, or a Response (401/403) the caller must return.
// Admins = verified Clerk emails listed in the ADMIN_EMAILS setting. Checked on every call, so removal is instant.
export async function requireAdmin(request, env) {
  const userId = await getUserId(request, env);
  if (!userId) return json({ error: "Sign in required" }, 401);

  const allowed = (env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const u = await clerk(env).users.getUser(userId);
  const primary = u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId);
  const email = primary?.emailAddress?.toLowerCase();
  if (!email || primary?.verification?.status !== "verified" || !allowed.includes(email)) {
    return json({ error: "Not allowed" }, 403);
  }
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || null;
  await db(env)`INSERT INTO users (id, email, full_name, role) VALUES (${userId}, ${email}, ${name}, 'admin')
                ON CONFLICT (id) DO UPDATE SET role = 'admin'`;
  return { userId, email };
}
