import { db, getUserId, json } from "../../_lib/auth.js";
import { AGENT_OPTIONS, KINDS, clean, cleanList, hashIp, notifyAdmins } from "../../_lib/leads.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ZAMBIAN_PROVINCES = ["Central", "Copperbelt", "Eastern", "Luapula", "Lusaka", "Muchinga", "Northern", "North-Western", "Southern", "Western"];

function listOf(value, allowed) {
  return [...new Set(cleanList(value).filter((item) => allowed.includes(item)))];
}

function duplicateResponse(existing, kind) {
  if (!existing || existing.kind !== kind) return json({ error: "This form has already been submitted." }, 409);
  return json({
    lead: {
      id: String(existing.id),
      referenceId: existing.reference_id,
      type: existing.kind,
      createdAt: existing.created_at,
      status: existing.status,
    },
    duplicate: true,
  });
}

function validateAgent(b, details) {
  const email = clean(b.email, 160);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address or leave it blank.";
  details.email = email;
  details.cityTown = clean(b.cityTown, 80);
  details.province = clean(b.province, 40);
  if (details.cityTown.length < 2) return "Enter your city or town.";
  if (!ZAMBIAN_PROVINCES.includes(details.province)) return "Choose a province in Zambia.";

  for (const [key, options] of Object.entries(AGENT_OPTIONS)) {
    if (key === "vehicleTypes" || key === "sourcingRegions" || key === "services") continue;
    const value = clean(b[key], 120);
    if (!options.includes(value)) return "Complete every required professional and availability question.";
    details[key] = value;
  }

  details.professionalRole = clean(b.professionalRole, 100);
  details.otherProfessionalRole = clean(b.otherProfessionalRole, 100);
  details.experienceRange = clean(b.experienceRange, 60);
  details.vehicleTypes = listOf(b.vehicleTypes, AGENT_OPTIONS.vehicleTypes);
  details.sourcingRegions = listOf(b.sourcingRegions, AGENT_OPTIONS.sourcingRegions);
  details.services = listOf(b.services, AGENT_OPTIONS.services);
  details.otherVehicleTypes = clean(b.otherVehicleTypes, 120);
  details.companyName = clean(b.companyName, 120);
  details.operatesIndependently = b.operatesIndependently === true || details.professionalRole === "Independent vehicle agent";
  details.additionalInformation = clean(b.additionalInformation, 1000);

  if (!AGENT_OPTIONS.experienceRange.includes(details.experienceRange)) return "Choose your motor business experience.";
  if (!AGENT_OPTIONS.professionalRole.includes(details.professionalRole)) return "Choose the role that best describes you.";
  if (details.professionalRole === "Other" && !details.otherProfessionalRole) return "Tell us what your professional role is.";
  if (!details.operatesIndependently && !details.companyName) return "Enter your dealership or company name, or indicate that you operate independently.";
  if (!details.vehicleTypes.length) return "Choose at least one vehicle type you can source.";
  if (details.vehicleTypes.includes("Any make or model")) details.vehicleTypes = ["Any make or model"];
  if (details.vehicleTypes.includes("Other") && !details.otherVehicleTypes) return "Describe the other vehicle types you can source.";
  if (!details.sourcingRegions.length) return "Choose at least one vehicle sourcing location.";
  if (!details.services.length) return "Choose at least one service you can facilitate.";
  if (!AGENT_OPTIONS.monthlyVolume.includes(details.monthlyVolume)) return "Choose your monthly vehicle activity.";
  if (!AGENT_OPTIONS.auctionAccess.includes(details.auctionAccess)) return "Choose an auction access option.";
  if (!AGENT_OPTIONS.inspectionCapability.includes(details.inspectionCapability)) return "Choose an inspection option.";
  if (!AGENT_OPTIONS.availability.includes(details.availability)) return "Choose your current availability.";
  if (b.privacyConsent !== true) return "Please confirm the privacy consent before submitting your application.";

  details.privacyConsent = true;
  details.privacyNoticeVersion = "agent-registration-v1";
  details.privacyConsentAt = new Date().toISOString();
  return "";
}

export async function onRequestPost(context) {
  const { request, env, params } = context;
  const cfg = KINDS[params.kind];
  if (!cfg) return json({ error: "Unknown request type" }, 404);

  const b = await request.json().catch(() => null);
  if (!b || typeof b !== "object" || Array.isArray(b)) return json({ error: "Invalid request" }, 400);

  const name = clean(b[cfg.nameKey], 80);
  const whatsapp = clean(b.whatsappNumber, 30).replace(/[^\d+]/g, "");
  if (name.length < 2) return json({ error: "Please enter your full name" }, 400);
  if (!/^\+?\d{9,15}$/.test(whatsapp)) return json({ error: "Please enter a valid WhatsApp number" }, 400);

  const details = {};
  for (const key of cfg.detail) {
    const value = b[key];
    if (Array.isArray(value)) details[key] = cleanList(value);
    else if (typeof value === "boolean") details[key] = value;
    else if (typeof value === "number" && Number.isFinite(value)) details[key] = value;
    else if (clean(value, 300)) details[key] = clean(value, 300);
  }

  if (params.kind === "agent") {
    const validationError = validateAgent(b, details);
    if (validationError) return json({ error: validationError }, 400);
  }

  const location = params.kind === "agent"
    ? `${details.cityTown}, ${details.province}`.slice(0, 100)
    : clean(b.location, 100) || null;
  const notes = clean(b.notes, 1000) || null;
  const submissionKey = clean(b.submissionKey, 36);
  if (params.kind === "agent" && !UUID_PATTERN.test(submissionKey)) return json({ error: "Please refresh the form and try again." }, 400);
  if (submissionKey && !UUID_PATTERN.test(submissionKey)) return json({ error: "Invalid submission. Please refresh the form and try again." }, 400);

  const sql = db(env);
  if (submissionKey) {
    const [existing] = await sql`SELECT id, reference_id, kind, status, created_at FROM leads WHERE submission_key = ${submissionKey}`;
    if (existing) return duplicateResponse(existing, params.kind);
  }

  const ipHash = await hashIp(request, env);
  const [rate] = await sql`
    SELECT count(*) FILTER (WHERE ip_hash = ${ipHash})::int AS by_ip,
           count(*) FILTER (WHERE whatsapp = ${whatsapp})::int AS by_phone
    FROM leads WHERE created_at > now() - interval '1 hour'`;
  if (rate.by_ip >= 15 || rate.by_phone >= 5) return json({ error: "Too many requests. Please try again later." }, 429);

  const userId = await getUserId(request, env);
  let row;
  let referenceId;
  for (let attempt = 0; attempt < 6 && !row; attempt++) {
    referenceId = params.kind === "agent"
      ? `AZ-AGENT-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`
      : `AZ-${cfg.label}-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      [row] = await sql`
        INSERT INTO leads (reference_id, kind, status, name, whatsapp, location, notes, details, user_id, ip_hash, submission_key)
        VALUES (${referenceId}, ${params.kind}, ${cfg.first}, ${name}, ${whatsapp}, ${location}, ${notes}, ${JSON.stringify(details)}::jsonb, ${userId}, ${ipHash}, ${submissionKey || null})
        ON CONFLICT (submission_key) DO NOTHING
        RETURNING id, created_at`;
      if (!row && submissionKey) {
        const [existing] = await sql`SELECT id, reference_id, kind, status, created_at FROM leads WHERE submission_key = ${submissionKey}`;
        return duplicateResponse(existing, params.kind);
      }
    } catch (error) {
      if (error?.code !== "23505") return json({ error: "Could not save your request. Please try again." }, 500);
    }
  }
  if (!row) return json({ error: "Could not save your request. Please try again." }, 500);

  const lead = {
    ...details,
    [cfg.nameKey]: name,
    whatsappNumber: whatsapp,
    location: location ?? "",
    notes: notes ?? undefined,
    id: String(row.id),
    referenceId,
    type: params.kind,
    createdAt: row.created_at,
    status: cfg.first,
  };
  const notificationTask = notifyAdmins(env, { kind: params.kind, referenceId, name, whatsapp, location }, details);
  if (typeof context.waitUntil === "function") context.waitUntil(notificationTask);
  else await notificationTask;
  return json({ lead }, 201);
}
