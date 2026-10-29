import { db, json } from "../../../_lib/auth.js";
import { requireAdmin } from "../../../_lib/admin.js";
import { KINDS, clean } from "../../../_lib/leads.js";

// PATCH /api/admin/leads/<id>  { status?, notes?, assignedTo? }
export async function onRequestPatch({ request, env, params }) {
  const a = await requireAdmin(request, env);
  if (a instanceof Response) return a;

  const id = parseInt(params.id, 10);
  if (!id) return json({ error: "Bad id" }, 400);
  const b = await request.json().catch(() => ({}));
  const sql = db(env);

  const [lead] = await sql`SELECT kind, status FROM leads WHERE id = ${id}`;
  if (!lead) return json({ error: "Not found" }, 404);

  const status = b.status ? clean(b.status, 60) : null;
  if (status && !KINDS[lead.kind].statuses.includes(status)) return json({ error: "Invalid status for this lead" }, 400);
  const notes = typeof b.notes === "string" ? clean(b.notes, 1000) : null;
  const assignedTo = typeof b.assignedTo === "string" ? clean(b.assignedTo, 80) : null;

  await sql`UPDATE leads SET status = COALESCE(${status}, status), notes = COALESCE(${notes}, notes),
            assigned_to = COALESCE(${assignedTo}, assigned_to), updated_at = now() WHERE id = ${id}`;
  await sql`INSERT INTO lead_events (lead_id, actor, action, from_status, to_status, note)
            VALUES (${id}, ${a.email}, ${status ? "status" : "edit"}, ${lead.status}, ${status}, ${notes})`;
  return json({ ok: true });
}
