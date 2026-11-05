import { db, json } from "../../../_lib/auth.js";
import { requireAdmin } from "../../../_lib/admin.js";

export async function onRequestGet({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  const configured = Boolean(env.ONESIGNAL_APP_ID && env.ONESIGNAL_REST_API_KEY);
  let activeCount = 0;
  if (configured) {
    try {
      const [row] = await db(env)`SELECT count(*)::int AS count FROM push_subscriptions WHERE owner_type = 'admin' AND owner_id = ${admin.userId} AND active = true`;
      activeCount = Number(row?.count || 0);
    } catch (error) {
      console.warn("AutoAce push status unavailable", error?.message || "unknown error");
      return json({ error: "Push status is unavailable. Apply the AutoAce database migration and try again." }, 503);
    }
  }

  const response = json({ configured, appId: configured ? env.ONESIGNAL_APP_ID : null, activeCount });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
