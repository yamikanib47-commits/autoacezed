import { db, getUserId, json } from "../../_lib/auth.js";
import { KINDS, clean, cleanList, hashIp, notifyAdmins } from "../../_lib/leads.js";

// POST /api/leads/buy | /sell | /agent  ->  { lead }  (same shape the front end already expects)
export async function onRequestPost({ request, env, params, waitUntil }) {
  const cfg = KINDS[params.kind];
  if (!cfg) return json({ error: "Unknown request type" }, 404);

  const b = await request.json().catch(() => null);
  if (!b || typeof b !== "object") return json({ error: "Invalid request" }, 400);

  const name = clean(b[cfg.nameKey], 80);
  const whatsapp = clean(b.whatsappNumber, 30).replace(/[^\d+]/g, "");
  if (name.length < 2) return json({ error: "Please enter your name" }, 400);
  if (whatsapp.length < 9 || whatsapp.length > 15) return json({ error: "Please enter a valid WhatsApp number" }, 400);

  const details = {};
  for (const k of cfg.detail) {
    const v = b[k];
    if (Array.isArray(v)) details[k] = cleanList(v);
    else if (typeof v === "number") details[k] = v;
    else if (clean(v, 300)) details[k] = clean(v, 300);
  }
  const location = clean(b.location, 80) || null;
  const notes = clean(b.notes, 1000) || null;

  const sql = db(env);
  const ipHash = await hashIp(request, env);
  const [rate] = await sql`
    SELECT count(*) FILTER (WHERE ip_hash = ${ipHash})::int AS by_ip,
           count(*) FILTER (WHERE whatsapp = ${whatsapp})::int AS by_phone
    FROM leads WHERE created_at > now() - interval '1 hour'`;
  if (rate.by_ip >= 15 || rate.by_phone >= 5) return json({ error: "Too many requests. Please try again later." }, 429);

  const userId = await getUserId(request, env);
  let row, referenceId;
  for (let i = 0; i < 6 && !row; i++) {
    referenceId = `AZ-${cfg.label}-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      [row] = await sql`
        INSERT INTO leads (reference_id, kind, status, name, whatsapp, location, notes, details, user_id, ip_hash)
        VALUES (${referenceId}, ${params.kind}, ${cfg.first}, ${name}, ${whatsapp}, ${location}, ${notes}, ${JSON.stringify(details)}::jsonb, ${userId}, ${ipHash})
        RETURNING id, created_at`;
    } catch (e) {
      if (e?.code !== "23505") return json({ error: "Could not save your request. Please try again." }, 500);
    }
  }
  if (!row) return json({ error: "Could not save your request. Please try again." }, 500);

  const lead = { ...details, [cfg.nameKey]: name, whatsappNumber: whatsapp, location: location ?? "", notes: notes ?? undefined,
    id: String(row.id), referenceId, type: params.kind, createdAt: row.created_at, status: cfg.first };
  waitUntil?.(notifyAdmins(env, { kind: params.kind, referenceId, name, whatsapp, location }, details));
  return json({ lead }, 201);
}
