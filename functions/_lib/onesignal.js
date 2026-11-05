import { db } from "./auth.js";

function vehicleLabel(details) {
  return [details.year, details.make, details.model].filter(Boolean).join(" ") || details.vehicleDescription || "Vehicle details pending";
}

function positiveAmount(value) {
  const amount = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) && amount > 0;
}

function priceLabel(value, basis = "") {
  if (!positiveAmount(value)) return "Budget not set";
  const amount = Number(String(value).replace(/[^\d.]/g, ""));
  const formatted = amount.toLocaleString("en-GB", { maximumFractionDigits: 0 });
  return `K${formatted}${basis === "monthly" ? " / month" : ""}`;
}

function dashboardUrl(env, lead) {
  const origin = env.PUBLIC_SITE_URL || "https://autoacezambia.pages.dev";
  const url = new URL("/admin/", origin);
  url.searchParams.set("tab", "leads");
  url.searchParams.set("kind", lead.kind);
  url.searchParams.set("q", lead.referenceId);
  return url.toString();
}

async function idempotencyUuid(seed) {
  const namespace = "9f4ca49f89cd4bd5b7254fb8f3f1e370";
  const namespaceBytes = new Uint8Array(namespace.match(/.{2}/g).map((value) => parseInt(value, 16)));
  const nameBytes = new TextEncoder().encode(seed);
  const input = new Uint8Array(namespaceBytes.length + nameBytes.length);
  input.set(namespaceBytes);
  input.set(nameBytes, namespaceBytes.length);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-1", input));
  digest[6] = (digest[6] & 15) | 80;
  digest[8] = (digest[8] & 63) | 128;
  const hex = [...digest.slice(0, 16)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export async function sendPushToSubscriptions(env, { subscriptionIds, title, body, url, idempotencyKey }) {
  if (!env.ONESIGNAL_APP_ID || !env.ONESIGNAL_REST_API_KEY) return { sent: false, reason: "not_configured" };
  const ids = [...new Set((subscriptionIds || []).filter((value) => typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value)))].slice(0, 20000);
  if (!ids.length) return { sent: false, reason: "no_subscriptions" };

  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      Authorization: `Key ${env.ONESIGNAL_REST_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_id: env.ONESIGNAL_APP_ID,
      include_subscription_ids: ids,
      target_channel: "push",
      headings: { en: title },
      contents: { en: body },
      url,
      idempotency_key: await idempotencyUuid(idempotencyKey),
    }),
  });

  if (!response.ok) {
    console.warn("AutoAce OneSignal request failed", response.status);
    return { sent: false, reason: "provider_error" };
  }

  const result = await response.json().catch(() => ({}));
  const recipients = Number(result.recipients || 0);
  return { sent: Boolean(result.id) && recipients > 0, recipients };
}

function businessEvents(lead, details) {
  const vehicle = vehicleLabel(details);
  const location = lead.location || details.cityTown || "Location not provided";
  const reference = lead.referenceId;

  if (lead.kind === "buy") {
    const budget = priceLabel(details.budgetZMW, details.budgetBasis);
    const qualified = Boolean(details.make || details.model || details.vehicleDescription)
      && positiveAmount(details.budgetZMW)
      && location !== "Location not provided"
      && Boolean(lead.whatsapp);
    const urgent = details.urgency === "As soon as possible";
    return [{
      key: "buyer-request",
      title: urgent ? "Important Buyer Enquiry" : qualified ? "Qualified Buyer Request" : "New Buyer Request",
      body: `${vehicle} · ${budget} · ${location} · ${reference}. Tap to view request.`,
    }];
  }

  if (lead.kind === "sell") {
    const asking = priceLabel(details.askingPriceZMW);
    const qualified = Boolean(details.make && details.model)
      && positiveAmount(details.askingPriceZMW)
      && location !== "Location not provided"
      && Boolean(lead.whatsapp);
    return [{
      key: "vehicle-submission",
      title: qualified ? "Qualified Vehicle Submission" : "New Vehicle Submission",
      body: `${vehicle} · Asking ${asking} · ${location} · ${reference}. Tap to view submission.`,
    }];
  }

  if (lead.kind === "agent") {
    return [{
      key: "agent-application",
      title: "New Agent Application",
      body: `Sourcing partner application · ${location} · ${reference}. Tap to review.`,
    }];
  }

  return [];
}

export async function sendBusinessNotifications(env, lead, details) {
  if (!env.ONESIGNAL_APP_ID || !env.ONESIGNAL_REST_API_KEY) return;
  try {
    const rows = await db(env)`SELECT subscription_id AS "subscriptionId" FROM push_subscriptions WHERE owner_type = 'admin' AND active = true`;
    if (!rows.length) return;
    const targetUrl = dashboardUrl(env, lead);
    const events = businessEvents(lead, details);
    await Promise.all(events.map((event) => sendPushToSubscriptions(env, {
      subscriptionIds: rows.map((row) => row.subscriptionId),
      title: event.title,
      body: event.body,
      url: targetUrl,
      idempotencyKey: `${lead.referenceId}:${event.key}`,
    })));
  } catch (error) {
    console.warn("AutoAce OneSignal notification failed", error?.message || "unknown error");
  }
}
