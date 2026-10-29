import { db, json } from "../../_lib/auth.js";
import { requireAdmin } from "../../_lib/admin.js";

// GET /api/admin/leads?kind=&status=&q=&limit=&offset=
export async function onRequestGet({ request, env }) {
  const a = await requireAdmin(request, env);
  if (a instanceof Response) return a;

  const u = new URL(request.url);
  const kind = u.searchParams.get("kind") || null;
  const status = u.searchParams.get("status") || null;
  const q = (u.searchParams.get("q") || "").trim();
  const like = q ? `%${q}%` : null;
  const limit = Math.min(Math.max(parseInt(u.searchParams.get("limit") || "50", 10) || 50, 1), 100);
  const offset = Math.max(parseInt(u.searchParams.get("offset") || "0", 10) || 0, 0);

  const rows = await db(env)`
    SELECT id, reference_id AS "referenceId", kind, status, name, whatsapp, location, notes, details,
           assigned_to AS "assignedTo", created_at AS "createdAt", COUNT(*) OVER()::int AS total
    FROM leads
    WHERE (${kind}::text IS NULL OR kind = ${kind})
      AND (${status}::text IS NULL OR status = ${status})
      AND (${like}::text IS NULL OR name ILIKE ${like} OR whatsapp ILIKE ${like} OR reference_id ILIKE ${like} OR details::text ILIKE ${like})
    ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
  return json({ leads: rows, total: rows[0]?.total ?? 0 });
}
