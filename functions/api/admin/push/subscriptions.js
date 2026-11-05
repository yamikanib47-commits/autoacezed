import { db, json } from "../../../_lib/auth.js";
import { requireAdmin } from "../../../_lib/admin.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getAdmin(request, env) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  if (!env.ONESIGNAL_APP_ID || !env.ONESIGNAL_REST_API_KEY) return json({ error: "OneSignal is not configured for this site." }, 503);
  return admin;
}

export async function onRequestPost({ request, env }) {
  const admin = await getAdmin(request, env);
  if (admin instanceof Response) return admin;
  const body = await request.json().catch(() => null);
  const subscriptionId = typeof body?.subscriptionId === "string" ? body.subscriptionId.trim() : "";
  if (!UUID_PATTERN.test(subscriptionId)) return json({ error: "Invalid push subscription." }, 400);

  try {
    const rows = await db(env)`
      INSERT INTO push_subscriptions (subscription_id, owner_type, owner_id, active)
      VALUES (${subscriptionId}, 'admin', ${admin.userId}, true)
      ON CONFLICT (subscription_id) DO UPDATE
        SET active = true, updated_at = now()
        WHERE push_subscriptions.owner_type = 'admin' AND push_subscriptions.owner_id = ${admin.userId}
      RETURNING subscription_id`;
    if (!rows.length) return json({ error: "This device is already registered to another account." }, 409);
    return json({ ok: true });
  } catch (error) {
    console.warn("AutoAce push device registration failed", error?.message || "unknown error");
    return json({ error: "Could not register this device for notifications." }, 503);
  }
}

export async function onRequestDelete({ request, env }) {
  const admin = await getAdmin(request, env);
  if (admin instanceof Response) return admin;
  const body = await request.json().catch(() => null);
  const subscriptionId = typeof body?.subscriptionId === "string" ? body.subscriptionId.trim() : "";
  if (!UUID_PATTERN.test(subscriptionId)) return json({ error: "Invalid push subscription." }, 400);

  try {
    await db(env)`UPDATE push_subscriptions SET active = false, updated_at = now() WHERE subscription_id = ${subscriptionId} AND owner_type = 'admin' AND owner_id = ${admin.userId}`;
    return json({ ok: true });
  } catch (error) {
    console.warn("AutoAce push device disable failed", error?.message || "unknown error");
    return json({ error: "Could not update this device's notification settings." }, 503);
  }
}
