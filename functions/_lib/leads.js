// Shared lead rules: kinds, first status, allowed statuses, and which fields live in `details`.
import { sendBusinessNotifications } from "./onesignal.js";

export const KINDS = {
  buy: { label: "BUY", nameKey: "customerName", first: "Pending Coordinator Review",
    statuses: ["Pending Coordinator Review", "Dispatched to Sourcing Agents", "Contacted", "Closed"],
    detail: ["make", "model", "vehicleDescription", "yearRange", "budgetZMW", "urgency", "preferredFuel", "preferredTransmission", "preferredBodyStyle", "preferredColour", "buyingIntent", "budgetBasis"] },
  sell: { label: "SELL", nameKey: "sellerName", first: "Pending Inspection",
    statuses: ["Pending Inspection", "Shared with Verified Agents", "Offer Under Review", "Closed"],
    detail: ["make", "model", "year", "mileage", "transmission", "fuelType", "condition", "askingPriceZMW", "regNumber", "photosCount"] },
  agent: { label: "AGENT", nameKey: "fullName", first: "PENDING",
    statuses: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"],
    detail: ["email", "cityTown", "province", "experienceRange", "professionalRole", "otherProfessionalRole", "companyName", "operatesIndependently", "vehicleTypes", "otherVehicleTypes", "sourcingRegions", "services", "monthlyVolume", "auctionAccess", "inspectionCapability", "availability", "additionalInformation", "privacyConsent", "privacyNoticeVersion", "privacyConsentAt"] }
};

export const AGENT_OPTIONS = {
  experienceRange: ["Less than 1 year", "1–2 years", "3–5 years", "5–10 years", "10+ years"],
  professionalRole: ["Independent vehicle agent", "Dealership employee", "Dealership owner", "Vehicle importer", "Car broker", "Other"],
  vehicleTypes: ["Any make or model", "Japanese vehicles", "European vehicles", "Luxury vehicles", "Commercial vehicles", "Other"],
  sourcingRegions: ["Within my city", "Across Zambia", "Japan", "South Africa", "Singapore", "Other international markets"],
  services: ["Finding vehicles for buyers", "Connecting buyers with dealerships", "Vehicle inspections", "Import coordination", "Vehicle delivery", "Selling vehicles on behalf of clients"],
  monthlyVolume: ["1–2", "3–5", "6–10", "10+", "Varies"],
  auctionAccess: ["Yes", "No", "Through a partner"],
  inspectionCapability: ["Yes", "No", "Through a partner"],
  availability: ["Yes, currently available", "Yes, but depending on availability", "Not currently available"],
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

async function emailAdmins(env, lead, details) {
  const to = (env.ADMIN_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!to.length || !env.RESEND_API_KEY) return;
  const rows = Object.entries(details).map(([k, v]) => `<li>${esc(k)}: ${esc(Array.isArray(v) ? v.join(", ") : v)}</li>`).join("");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.EMAIL_FROM || "Autoace Zambia <onboarding@resend.dev>",
      to,
      subject: `New ${lead.kind} lead ${lead.referenceId}`,
      html: `<p><b>${esc(lead.name)}</b> (${esc(lead.whatsapp)}) - ${esc(lead.location)}</p><ul>${rows}</ul><p>Open the dashboard at /admin/</p>`,
    }),
  });
  if (!response.ok) console.warn("AutoAce lead email notification failed", response.status);
}

export async function notifyAdmins(env, lead, details) {
  const results = await Promise.allSettled([
    emailAdmins(env, lead, details),
    sendBusinessNotifications(env, lead, details),
  ]);
  for (const result of results) {
    if (result.status === "rejected") console.warn("AutoAce admin notification failed", result.reason?.message || "unknown error");
  }
}
