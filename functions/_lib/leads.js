// Shared lead rules: kinds, first status, allowed statuses, and which fields live in `details`.
export const KINDS = {
  buy: { label: "BUY", nameKey: "customerName", first: "Pending Coordinator Review",
    statuses: ["Pending Coordinator Review", "Dispatched to Sourcing Agents", "Contacted", "Closed"],
    detail: ["make", "model", "yearRange", "budgetZMW", "urgency", "preferredFuel"] },
  sell: { label: "SELL", nameKey: "sellerName", first: "Pending Inspection",
    statuses: ["Pending Inspection", "Shared with Verified Agents", "Offer Under Review", "Closed"],
    detail: ["make", "model", "year", "mileage", "transmission", "fuelType", "condition", "askingPriceZMW", "regNumber", "photosCount"] },
  agent: { label: "AGENT", nameKey: "contactPerson", first: "Application Received",
    statuses: ["Application Received", "Credentials Under Review", "Approved Sourcing Partner", "Declined"],
    detail: ["agencyName", "operatingTowns", "specializations", "experienceYears"] },
};

export const clean = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const cleanList = (v) => (Array.isArray(v) ? v.slice(0, 20).map((x) => clean(x, 60)).filter(Boolean) : []);

export async function hashIp(request, env) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const data = new TextEncoder().encode(`${env.IP_SALT || "autoace"}:${ip}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Emails every admin when a lead arrives. Never throws: a mail failure must not lose the lead.
export async function notifyAdmins(env, lead, details) {
  try {
    const to = (env.ADMIN_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!to.length || !env.RESEND_API_KEY) return;
    const rows = Object.entries(details).map(([k, v]) => `<li>${esc(k)}: ${esc(Array.isArray(v) ? v.join(", ") : v)}</li>`).join("");
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.EMAIL_FROM || "Autoace Zambia <onboarding@resend.dev>",
        to,
        subject: `New ${lead.kind} lead ${lead.referenceId}`,
        html: `<p><b>${esc(lead.name)}</b> (${esc(lead.whatsapp)}) - ${esc(lead.location)}</p><ul>${rows}</ul><p>Open the dashboard at /admin/</p>`,
      }),
    });
  } catch { /* ignore */ }
}
