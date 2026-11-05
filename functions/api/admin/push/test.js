import { db, json } from "../../../_lib/auth.js";
import { requireAdmin } from "../../../_lib/admin.js";
import { sendPushToSubscriptions } from "../../../_lib/onesignal.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function onRequestPost({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  if (!env.ONESIGNAL_APP_ID || !env.ONESIGNAL_REST_API_KEY) return json({ error: "OneSignal is not configured for this site." }, 503);

  try {
    const body = await request.json().catch(() => null);
    const subscriptionId = typeof body?.subscriptionId === "string" ? body.subscriptionId.trim() : "";
    if (!UUID_PATTERN.test(subscriptionId)) return json({ error: "Choose an enabled browser first." }, 400);
    const rows = await db(env)`SELECT subscription_id FROM push_subscriptions WHERE subscription_id = ${subscriptionId} AND owner_type = 'admin' AND owner_id = ${admin.userId} AND active = true`;
    if (!rows.length) return json({ error: "This browser is not enabled for notifications." }, 409);
    const url = new URL("/admin/", env.PUBLIC_SITE_URL || "https://autoacezambia.pages.dev").toString();
    const result = await sendPushToSubscriptions(env, {
      subscriptionIds: [subscriptionId],
      title: "AutoAce push test",
      body: "This browser is ready to receive business alerts.",
      url,
      idempotencyKey: crypto.randomUUID(),
    });
    if (!result.sent) return json({ error: "OneSignal could not send the test notification." }, 502);
    return json({ ok: true, recipients: result.recipients });
  } catch (error) {
    console.warn("AutoAce push test failed", error?.message || "unknown error");
    return json({ error: "Could not send a test notification." }, 502);
  }
}
