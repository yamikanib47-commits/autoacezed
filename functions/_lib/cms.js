import { db } from "./auth.js";

const BODY_STYLES = new Set(["SUV", "Hatchback", "Saloon", "Estate", "Double Cab", "Van", "Coupe"]);
const FUEL_TYPES = new Set(["Petrol", "Diesel", "Hybrid", "Electric"]);
const GEARBOXES = new Set(["Automatic", "Manual"]);
const CONDITIONS = new Set(["Used", "Brand New"]);
const VEHICLE_STATUSES = new Set(["draft", "published", "sold"]);
const BANNER_SLOTS = new Set(["top_announcement", "fuel_banner", "hero_callout"]);
const LIFESTYLE_TAGS = new Set(["most-off-rrp", "in-stock", "city", "outdoors", "family"]);

export const cleanText = (value, max = 5000) =>
  typeof value === "string" ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ").trim().slice(0, max) : "";

export function imageUrl(value) {
  if (!value) return "";
  if (/^https:\/\//i.test(value) || value.startsWith("/assets/")) return value;
  return `/api/files/${String(value).split("/").map(encodeURIComponent).join("/")}`;
}

export function normalizeImageRef(value) {
  const text = cleanText(value, 2048);
  if (!text) return "";
  if (/^https:\/\//i.test(text)) return text;
  if (text.startsWith("/assets/") && !text.includes("..")) return text;
  if (!/^[a-zA-Z0-9._/-]+$/.test(text) || text.startsWith("/") || text.includes("..")) {
    throw new Error("Image must be an uploaded CMS image, a site asset, or an HTTPS URL.");
  }
  return text;
}

function listOfStrings(value, maxItems = 40, maxLength = 240) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems).map((item) => cleanText(item, maxLength)).filter(Boolean);
}

function numberValue(value, label, { required = false, min = 0, max = 1_000_000_000 } = {}) {
  if (value === null || value === undefined || value === "") {
    if (required) throw new Error(`${label} is required.`);
    return null;
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw new Error(`${label} is invalid.`);
  return number;
}

function slugify(value) {
  return cleanText(value, 180).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
}

function vehicleInput(input) {
  const make = cleanText(input.make, 80);
  const model = cleanText(input.model, 100);
  if (!make || !model) throw new Error("Make and model are required.");
  const year = numberValue(input.year, "Year", { required: true, min: 1900, max: 2100 });
  const trim = cleanText(input.trim, 140);
  const slug = slugify(input.slug || `${year}-${make}-${model}-${trim}`);
  if (!slug) throw new Error("A valid URL slug is required.");
  const bodyStyle = cleanText(input.bodyStyle, 40);
  const fuelType = cleanText(input.fuelType, 40);
  const gearbox = cleanText(input.gearbox, 40);
  const condition = cleanText(input.condition, 40);
  if (!BODY_STYLES.has(bodyStyle)) throw new Error("Choose a valid body style.");
  if (!FUEL_TYPES.has(fuelType)) throw new Error("Choose a valid fuel type.");
  if (!GEARBOXES.has(gearbox)) throw new Error("Choose a valid gearbox.");
  if (!CONDITIONS.has(condition)) throw new Error("Choose a valid condition.");
  const status = VEHICLE_STATUSES.has(input.status) ? input.status : "draft";
  const images = listOfStrings(input.images, 12, 2048).map(normalizeImageRef);
  const features = listOfStrings(input.features, 40, 240);
  const lifestyleTags = listOfStrings(input.lifestyleTags, 20, 60).filter((tag) => LIFESTYLE_TAGS.has(tag));
  const tags = [...new Set([
    ...lifestyleTags,
    ...(input.isTopRated ? ["top-rated"] : []),
    ...(input.isAd ? ["advert"] : []),
  ])];
  const detailedSpecs = Array.isArray(input.detailedSpecs)
    ? input.detailedSpecs.slice(0, 20).map((group) => ({
        category: cleanText(group?.category, 120),
        items: Array.isArray(group?.items) ? group.items.slice(0, 30).map((item) => ({
          label: cleanText(item?.label, 120),
          value: cleanText(item?.value, 240),
        })).filter((item) => item.label || item.value) : [],
      })).filter((group) => group.category || group.items.length)
    : [];
  const specs = {
    detailedSpecs,
    displayName: cleanText(input.name, 200),
    bhp: numberValue(input.bhp, "Power", { min: 0, max: 10000 }),
    ownersCount: numberValue(input.ownersCount, "Owner count", { min: 0, max: 50 }),
    insuranceGroup: cleanText(input.insuranceGroup, 60),
    warrantyText: cleanText(input.warrantyText, 1000),
    dealerPhone: cleanText(input.dealerPhone, 60),
    dealerReviewsCount: numberValue(input.dealerReviewsCount, "Dealer review count", { min: 0, max: 1_000_000 }),
    dealerRating: numberValue(input.dealerRating, "Dealer rating", { min: 0, max: 5 }),
    dealerAddress: cleanText(input.dealerAddress, 300),
    fullDescription: cleanText(input.fullDescription, 6000),
    dealId: cleanText(input.dealId, 120),
  };
  return {
    slug,
    make,
    model,
    trim,
    bodyStyle,
    fuelType,
    gearbox,
    engineSize: cleanText(input.engineSize, 60),
    year,
    mileageKm: numberValue(input.mileageKm, "Mileage", { min: 0, max: 2_000_000 }),
    priceZMW: numberValue(input.priceZMW, "Price", { required: true, min: 0, max: 1_000_000_000 }),
    monthlyZMW: numberValue(input.monthlyZMW, "Monthly price", { min: 0, max: 100_000_000 }),
    condition,
    location: cleanText(input.location, 120),
    dealer: cleanText(input.dealer, 160),
    dealerPhone: specs.dealerPhone,
    dealerAddress: specs.dealerAddress,
    features,
    tags,
    images,
    specs,
    description: specs.fullDescription,
    status,
    sortOrder: numberValue(input.sortOrder, "Sort order", { min: -1_000_000, max: 1_000_000 }) ?? 0,
  };
}

async function dealerIdFor(sql, vehicle) {
  if (!vehicle.dealer) return null;
  const [existing] = await sql`SELECT id FROM dealers WHERE lower(name) = lower(${vehicle.dealer}) ORDER BY id LIMIT 1`;
  if (existing) {
    await sql`UPDATE dealers SET phone = COALESCE(NULLIF(${vehicle.dealerPhone}, ''), phone), address = COALESCE(NULLIF(${vehicle.dealerAddress}, ''), address), town = COALESCE(NULLIF(${vehicle.location}, ''), town) WHERE id = ${existing.id}`;
    return existing.id;
  }
  const [created] = await sql`INSERT INTO dealers (name, phone, address, town, status) VALUES (${vehicle.dealer}, ${vehicle.dealerPhone || null}, ${vehicle.dealerAddress || null}, ${vehicle.location || null}, 'active') RETURNING id`;
  return created.id;
}

async function saveImages(sql, vehicleId, images) {
  await sql`DELETE FROM vehicle_images WHERE vehicle_id = ${vehicleId}`;
  for (const [index, key] of images.entries()) {
    await sql`INSERT INTO vehicle_images (vehicle_id, r2_key, sort_order) VALUES (${vehicleId}, ${key}, ${index})`;
  }
}

export async function saveVehicle(env, input, existingSlug = null) {
  const vehicle = vehicleInput(input);
  const sql = db(env);
  const dealerId = await dealerIdFor(sql, vehicle);
  let row;
  if (existingSlug) {
    [row] = await sql`
      UPDATE vehicles SET slug = ${vehicle.slug}, dealer_id = ${dealerId}, make = ${vehicle.make}, model = ${vehicle.model},
        trim = ${vehicle.trim || null}, body_style = ${vehicle.bodyStyle}, fuel_type = ${vehicle.fuelType}, gearbox = ${vehicle.gearbox},
        engine_size = ${vehicle.engineSize || null}, year = ${vehicle.year}, mileage_km = ${vehicle.mileageKm}, price_zmw = ${vehicle.priceZMW},
        monthly_zmw = ${vehicle.monthlyZMW}, condition = ${vehicle.condition}, location = ${vehicle.location || null}, features = ${vehicle.features},
        tags = ${vehicle.tags}, description = ${vehicle.description || null}, specs = ${JSON.stringify(vehicle.specs)}::jsonb,
        status = ${vehicle.status}, sort_order = ${vehicle.sortOrder}, updated_at = now()
      WHERE slug = ${existingSlug} RETURNING id, slug`;
    if (!row) return null;
  } else {
    [row] = await sql`
      INSERT INTO vehicles (slug, dealer_id, make, model, trim, body_style, fuel_type, gearbox, engine_size, year, mileage_km,
        price_zmw, monthly_zmw, condition, location, features, tags, description, specs, status, sort_order)
      VALUES (${vehicle.slug}, ${dealerId}, ${vehicle.make}, ${vehicle.model}, ${vehicle.trim || null}, ${vehicle.bodyStyle}, ${vehicle.fuelType},
        ${vehicle.gearbox}, ${vehicle.engineSize || null}, ${vehicle.year}, ${vehicle.mileageKm}, ${vehicle.priceZMW}, ${vehicle.monthlyZMW},
        ${vehicle.condition}, ${vehicle.location || null}, ${vehicle.features}, ${vehicle.tags}, ${vehicle.description || null},
        ${JSON.stringify(vehicle.specs)}::jsonb, ${vehicle.status}, ${vehicle.sortOrder}) RETURNING id, slug`;
  }
  await saveImages(sql, row.id, vehicle.images);
  return row;
}

export async function listVehicles(env, { publicOnly = false, q = "", status = "" } = {}) {
  const sql = db(env);
  const like = q ? `%${q}%` : null;
  const selectedStatus = status || null;
  return sql`
    SELECT v.slug, v.make, v.model, v.trim, v.body_style, v.fuel_type, v.gearbox, v.engine_size, v.year, v.mileage_km,
      v.price_zmw, v.monthly_zmw, v.condition, v.location, v.features, v.tags, v.description, v.specs, v.status, v.sort_order,
      d.name AS dealer, d.phone AS dealer_phone, d.address AS dealer_address,
      COALESCE((SELECT json_agg(vi.r2_key ORDER BY vi.sort_order) FROM vehicle_images vi WHERE vi.vehicle_id = v.id), '[]'::json) AS image_keys
    FROM vehicles v LEFT JOIN dealers d ON d.id = v.dealer_id
    WHERE (${publicOnly}::boolean = false OR v.status = 'published')
      AND (${selectedStatus}::text IS NULL OR v.status = ${selectedStatus})
      AND (${like}::text IS NULL OR v.make ILIKE ${like} OR v.model ILIKE ${like} OR v.slug ILIKE ${like} OR v.location ILIKE ${like})
    ORDER BY v.sort_order ASC, v.created_at DESC`;
}

export function mapVehicle(row, { admin = false } = {}) {
  const specs = row.specs && typeof row.specs === "object" ? row.specs : {};
  const imageKeys = Array.isArray(row.image_keys) ? row.image_keys : [];
  const tags = Array.isArray(row.tags) ? row.tags : [];
  const result = {
    id: row.slug,
    slug: row.slug,
    name: specs.displayName || [row.make, row.model].filter(Boolean).join(" "),
    make: row.make,
    model: row.model,
    trim: row.trim || "",
    bodyStyle: row.body_style,
    fuelType: row.fuel_type,
    gearbox: row.gearbox,
    engineSize: row.engine_size || "",
    year: Number(row.year) || 0,
    mileageKm: Number(row.mileage_km) || 0,
    priceZMW: Number(row.price_zmw) || 0,
    monthlyZMW: Number(row.monthly_zmw) || 0,
    condition: row.condition || "Used",
    location: row.location || "",
    dealer: row.dealer || "",
    isTopRated: tags.includes("top-rated"),
    isAd: tags.includes("advert"),
    images: imageKeys.map(imageUrl),
    features: Array.isArray(row.features) ? row.features : [],
    lifestyleTags: tags.filter((tag) => LIFESTYLE_TAGS.has(tag)),
    bhp: specs.bhp ?? undefined,
    ownersCount: specs.ownersCount ?? undefined,
    insuranceGroup: specs.insuranceGroup || undefined,
    warrantyText: specs.warrantyText || undefined,
    dealerPhone: specs.dealerPhone || row.dealer_phone || undefined,
    dealerReviewsCount: specs.dealerReviewsCount ?? undefined,
    dealerRating: specs.dealerRating ?? undefined,
    dealerAddress: specs.dealerAddress || row.dealer_address || undefined,
    fullDescription: specs.fullDescription || row.description || undefined,
    dealId: specs.dealId || undefined,
    detailedSpecs: Array.isArray(specs.detailedSpecs) ? specs.detailedSpecs : [],
  };
  if (admin) {
    result.imageKeys = imageKeys;
    result.status = row.status;
    result.sortOrder = Number(row.sort_order) || 0;
  }
  return result;
}

export function validateBanner(input) {
  const slot = cleanText(input.slot, 40);
  if (!BANNER_SLOTS.has(slot)) throw new Error("Choose a valid banner slot.");
  const title = cleanText(input.title, 220);
  if (!title) throw new Error("Banner title is required.");
  const linkUrl = cleanText(input.linkUrl, 1000);
  const isSitePath = linkUrl.startsWith("/") && !linkUrl.startsWith("//");
  const isAnchor = /^#[a-z0-9][a-z0-9_-]*$/i.test(linkUrl);
  if (linkUrl && !isSitePath && !isAnchor && !/^https:\/\//i.test(linkUrl)) throw new Error("Link must be a site path, page anchor, or HTTPS URL.");
  const startsAt = input.startsAt ? new Date(input.startsAt) : null;
  const endsAt = input.endsAt ? new Date(input.endsAt) : null;
  if (startsAt && Number.isNaN(startsAt.getTime())) throw new Error("Start date is invalid.");
  if (endsAt && Number.isNaN(endsAt.getTime())) throw new Error("End date is invalid.");
  if (startsAt && endsAt && endsAt <= startsAt) throw new Error("End date must be after the start date.");
  return {
    slot,
    title,
    body: cleanText(input.body, 2500),
    imageKey: normalizeImageRef(input.imageKey),
    linkUrl,
    active: Boolean(input.active),
    sortOrder: numberValue(input.sortOrder, "Sort order", { min: -1_000_000, max: 1_000_000 }) ?? 0,
    startsAt: startsAt ? startsAt.toISOString() : null,
    endsAt: endsAt ? endsAt.toISOString() : null,
  };
}

export function validateDeal(input) {
  const title = cleanText(input.title, 200);
  if (!title) throw new Error("Deal title is required.");
  return {
    title,
    imageKey: normalizeImageRef(input.imageKey),
    tag: cleanText(input.tag, 80),
    budgetQuery: cleanText(input.budgetQuery, 160),
    active: Boolean(input.active),
    sortOrder: numberValue(input.sortOrder, "Sort order", { min: -1_000_000, max: 1_000_000 }) ?? 0,
  };
}

export function mapBanner(row) {
  return {
    id: String(row.id), slot: row.slot, title: row.title || "", body: row.body || "",
    imageKey: row.image_key || "", imageUrl: imageUrl(row.image_key), linkUrl: row.link_url || "",
    active: Boolean(row.active), sortOrder: Number(row.sort_order) || 0,
    startsAt: row.starts_at || null, endsAt: row.ends_at || null,
  };
}

export function mapDeal(row) {
  return {
    id: String(row.id), title: row.title, imageKey: row.image_key || "", imageUrl: imageUrl(row.image_key),
    tag: row.tag || "", budgetQuery: row.budget_query || "", active: Boolean(row.active),
    sortOrder: Number(row.sort_order) || 0,
  };
}

export async function listBanners(env) {
  return db(env)`SELECT id, slot, title, body, image_key, link_url, active, sort_order, starts_at, ends_at FROM banners ORDER BY sort_order, id`;
}

export async function listDeals(env) {
  return db(env)`SELECT id, title, image_key, tag, budget_query, active, sort_order FROM deals ORDER BY sort_order, id`;
}

export async function saveBanner(env, input, id = null) {
  const banner = validateBanner(input);
  const sql = db(env);
  if (id) {
    const [row] = await sql`UPDATE banners SET slot = ${banner.slot}, title = ${banner.title}, body = ${banner.body || null}, image_key = ${banner.imageKey || null},
      link_url = ${banner.linkUrl || null}, active = ${banner.active}, sort_order = ${banner.sortOrder}, starts_at = ${banner.startsAt}, ends_at = ${banner.endsAt}, updated_at = now()
      WHERE id = ${Number(id)} RETURNING id, slot, title, body, image_key, link_url, active, sort_order, starts_at, ends_at`;
    return row || null;
  }
  const [row] = await sql`INSERT INTO banners (slot, title, body, image_key, link_url, active, sort_order, starts_at, ends_at)
    VALUES (${banner.slot}, ${banner.title}, ${banner.body || null}, ${banner.imageKey || null}, ${banner.linkUrl || null}, ${banner.active}, ${banner.sortOrder}, ${banner.startsAt}, ${banner.endsAt})
    RETURNING id, slot, title, body, image_key, link_url, active, sort_order, starts_at, ends_at`;
  return row;
}

export async function saveDeal(env, input, id = null) {
  const deal = validateDeal(input);
  const sql = db(env);
  if (id) {
    const [row] = await sql`UPDATE deals SET title = ${deal.title}, image_key = ${deal.imageKey || null}, tag = ${deal.tag || null},
      budget_query = ${deal.budgetQuery || null}, active = ${deal.active}, sort_order = ${deal.sortOrder}
      WHERE id = ${Number(id)} RETURNING id, title, image_key, tag, budget_query, active, sort_order`;
    return row || null;
  }
  const [row] = await sql`INSERT INTO deals (title, image_key, tag, budget_query, active, sort_order)
    VALUES (${deal.title}, ${deal.imageKey || null}, ${deal.tag || null}, ${deal.budgetQuery || null}, ${deal.active}, ${deal.sortOrder})
    RETURNING id, title, image_key, tag, budget_query, active, sort_order`;
  return row;
}

export function parseId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function markCmsManaged(env, collection, slot = "") {
  let key;
  if (collection === "banners") {
    if (!BANNER_SLOTS.has(slot)) return;
    key = `cms_banner_${slot}_managed`;
  } else if (["vehicles", "deals", "articles", "faqs"].includes(collection)) {
    key = `cms_${collection}_managed`;
  } else {
    return;
  }
  await db(env)`INSERT INTO settings (key, value) VALUES (${key}, '1') ON CONFLICT (key) DO UPDATE SET value = '1', updated_at = now()`;
}

const ARTICLE_KINDS = new Set(["review", "news", "video"]);
const ARTICLE_STATUSES = new Set(["draft", "published"]);

export const cleanCmsText = cleanText;

function articleInput(input) {
  const kind = cleanText(input.kind, 24);
  if (!ARTICLE_KINDS.has(kind)) throw new Error("Choose a valid article type.");
  const title = cleanText(input.title, 220);
  if (!title) throw new Error("Article title is required.");
  const status = ARTICLE_STATUSES.has(input.status) ? input.status : "draft";
  const videoUrl = cleanText(input.videoUrl, 1000);
  if (videoUrl && !/^https:\/\//i.test(videoUrl)) throw new Error("Video URL must use HTTPS.");
  const publishedAtValue = input.publishedAt ? new Date(input.publishedAt) : null;
  if (publishedAtValue && Number.isNaN(publishedAtValue.getTime())) throw new Error("Publish date is invalid.");
  return {
    kind,
    title,
    summary: cleanText(input.summary, 700),
    body: cleanText(input.body, 12000),
    imageKey: normalizeImageRef(input.imageKey),
    meta: cleanText(input.meta, 500),
    videoUrl,
    status,
    sortOrder: numberValue(input.sortOrder, "Sort order", { min: -1_000_000, max: 1_000_000 }) ?? 0,
    publishedAt: status === "published" ? (publishedAtValue?.toISOString() || new Date().toISOString()) : null,
  };
}

function faqInput(input) {
  const question = cleanText(input.question, 500);
  const answer = cleanText(input.answer, 6000);
  if (!question || !answer) throw new Error("Question and answer are required.");
  return {
    question,
    answer,
    active: Boolean(input.active),
    sortOrder: numberValue(input.sortOrder, "Sort order", { min: -1_000_000, max: 1_000_000 }) ?? 0,
  };
}

export function normalizeCmsCollectionItem(collection, input) {
  try {
    if (collection === "vehicles") return { value: vehicleInput(input) };
    if (collection === "banners") return { value: validateBanner(input) };
    if (collection === "deals") return { value: validateDeal(input) };
    if (collection === "articles") return { value: articleInput(input) };
    if (collection === "faqs") return { value: faqInput(input) };
    return { error: "Unknown CMS collection." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid CMS item." };
  }
}

function mapArticle(row) {
  return {
    id: String(row.id),
    kind: row.kind,
    title: row.title,
    summary: row.summary || "",
    body: row.body || "",
    imageKey: row.image_key || "",
    imageUrl: imageUrl(row.image_key),
    meta: row.meta || "",
    videoUrl: row.video_url || "",
    status: row.status,
    sortOrder: Number(row.sort_order) || 0,
    publishedAt: row.published_at || null,
  };
}

function mapFaq(row) {
  return {
    id: String(row.id),
    question: row.question,
    answer: row.answer,
    active: Boolean(row.active),
    sortOrder: Number(row.sort_order) || 0,
  };
}

export async function loadCmsCollection(env, collection, { query = "", status = "" } = {}) {
  const sql = db(env);
  const like = query ? `%${query}%` : null;
  if (collection === "vehicles") {
    return (await listVehicles(env, { q: query, status })).map((row) => mapVehicle(row, { admin: true }));
  }
  if (collection === "banners") {
    const rows = await listBanners(env);
    return rows.filter((row) => (!like || `${row.title || ""} ${row.slot}`.toLowerCase().includes(query.toLowerCase())) &&
      (!status || (status === "active" ? row.active : status === "inactive" ? !row.active : true))).map(mapBanner);
  }
  if (collection === "deals") {
    const rows = await listDeals(env);
    return rows.filter((row) => (!like || `${row.title || ""} ${row.tag || ""}`.toLowerCase().includes(query.toLowerCase())) &&
      (!status || (status === "active" ? row.active : status === "inactive" ? !row.active : true))).map(mapDeal);
  }
  if (collection === "articles") {
    const rows = await sql`SELECT id, kind, title, summary, body, image_key, meta, video_url, status, sort_order, published_at
      FROM articles WHERE (${like}::text IS NULL OR title ILIKE ${like} OR summary ILIKE ${like})
      AND (${status || null}::text IS NULL OR status = ${status || null}) ORDER BY sort_order, created_at DESC`;
    return rows.map(mapArticle);
  }
  if (collection === "faqs") {
    const rows = await sql`SELECT id, question, answer, active, sort_order FROM faqs
      WHERE (${like}::text IS NULL OR question ILIKE ${like} OR answer ILIKE ${like})
      AND (${status === "active" ? true : status === "inactive" ? false : null}::boolean IS NULL OR active = ${status === "active"})
      ORDER BY sort_order, id`;
    return rows.map(mapFaq);
  }
  return [];
}

async function saveArticle(env, input, id = null) {
  const article = articleInput(input);
  const sql = db(env);
  if (id) {
    const parsedId = parseId(id);
    if (!parsedId) return null;
    const [row] = await sql`UPDATE articles SET kind = ${article.kind}, title = ${article.title}, summary = ${article.summary || null},
      body = ${article.body || null}, image_key = ${article.imageKey || null}, meta = ${article.meta || null}, video_url = ${article.videoUrl || null},
      status = ${article.status}, sort_order = ${article.sortOrder}, published_at = ${article.publishedAt}
      WHERE id = ${parsedId} RETURNING id, kind, title, summary, body, image_key, meta, video_url, status, sort_order, published_at`;
    return row ? mapArticle(row) : null;
  }
  const [row] = await sql`INSERT INTO articles (kind, title, summary, body, image_key, meta, video_url, status, sort_order, published_at)
    VALUES (${article.kind}, ${article.title}, ${article.summary || null}, ${article.body || null}, ${article.imageKey || null},
      ${article.meta || null}, ${article.videoUrl || null}, ${article.status}, ${article.sortOrder}, ${article.publishedAt})
    RETURNING id, kind, title, summary, body, image_key, meta, video_url, status, sort_order, published_at`;
  return mapArticle(row);
}

async function saveFaq(env, input, id = null) {
  const faq = faqInput(input);
  const sql = db(env);
  if (id) {
    const parsedId = parseId(id);
    if (!parsedId) return null;
    const [row] = await sql`UPDATE faqs SET question = ${faq.question}, answer = ${faq.answer}, active = ${faq.active}, sort_order = ${faq.sortOrder}
      WHERE id = ${parsedId} RETURNING id, question, answer, active, sort_order`;
    return row ? mapFaq(row) : null;
  }
  const [row] = await sql`INSERT INTO faqs (question, answer, active, sort_order)
    VALUES (${faq.question}, ${faq.answer}, ${faq.active}, ${faq.sortOrder}) RETURNING id, question, answer, active, sort_order`;
  return mapFaq(row);
}

export async function saveCmsCollectionItem(env, collection, input, id = null, { markManaged = true } = {}) {
  let item = null;
  if (collection === "vehicles") {
    const existingSlug = id ? cleanText(id, 120) : null;
    item = await saveVehicle(env, input, existingSlug);
  } else if (collection === "banners") {
    const parsedId = id ? parseId(id) : null;
    if (id && !parsedId) return null;
    let targetId = parsedId;
    if (!targetId) {
      const [existing] = await db(env)`SELECT id FROM banners WHERE slot = ${input.slot} ORDER BY id LIMIT 1`;
      targetId = existing?.id || null;
    }
    const row = await saveBanner(env, input, targetId);
    item = row ? mapBanner(row) : null;
  } else if (collection === "deals") {
    const parsedId = id ? parseId(id) : null;
    if (id && !parsedId) return null;
    const row = await saveDeal(env, input, parsedId);
    item = row ? mapDeal(row) : null;
  } else if (collection === "articles") {
    item = await saveArticle(env, input, id);
  } else if (collection === "faqs") {
    item = await saveFaq(env, input, id);
  }
  const shouldManage = collection === "vehicles" ? input.status === "published"
    : collection === "banners" || collection === "deals" ? Boolean(input.active)
    : collection === "articles" ? input.status === "published"
    : collection === "faqs" ? Boolean(input.active)
    : false;
  if (item && markManaged && shouldManage) await markCmsManaged(env, collection, input.slot);
  return item;
}

export async function deleteCmsCollectionItem(env, collection, id) {
  const sql = db(env);
  if (collection === "vehicles") {
    const slug = cleanText(id, 120);
    if (!slug) return false;
    const [existing] = await sql`SELECT status FROM vehicles WHERE slug = ${slug}`;
    if (!existing) return false;
    const rows = await sql`DELETE FROM vehicles WHERE slug = ${slug} RETURNING slug`;
    if (rows.length && existing.status === "published") await markCmsManaged(env, collection);
    return rows.length > 0;
  }
  const parsedId = parseId(id);
  if (!parsedId) return false;
  if (collection === "banners") {
    const [existing] = await sql`SELECT slot, active FROM banners WHERE id = ${parsedId}`;
    if (!existing) return false;
    const rows = await sql`DELETE FROM banners WHERE id = ${parsedId} RETURNING id`;
    if (rows.length && existing.active) await markCmsManaged(env, collection, existing.slot);
    return rows.length > 0;
  }
  if (collection === "deals") {
    const [existing] = await sql`SELECT active FROM deals WHERE id = ${parsedId}`;
    if (!existing) return false;
    const rows = await sql`DELETE FROM deals WHERE id = ${parsedId} RETURNING id`;
    if (rows.length && existing.active) await markCmsManaged(env, collection);
    return rows.length > 0;
  }
  if (collection === "articles") {
    const [existing] = await sql`SELECT status FROM articles WHERE id = ${parsedId}`;
    if (!existing) return false;
    const rows = await sql`DELETE FROM articles WHERE id = ${parsedId} RETURNING id`;
    if (rows.length && existing.status === "published") await markCmsManaged(env, collection);
    return rows.length > 0;
  }
  if (collection === "faqs") {
    const [existing] = await sql`SELECT active FROM faqs WHERE id = ${parsedId}`;
    if (!existing) return false;
    const rows = await sql`DELETE FROM faqs WHERE id = ${parsedId} RETURNING id`;
    if (rows.length && existing.active) await markCmsManaged(env, collection);
    return rows.length > 0;
  }
  return false;
}

export async function publicCmsVehicles(env) {
  const sql = db(env);
  const [marker] = await sql`SELECT value FROM settings WHERE key = 'cms_vehicles_managed'`;
  const rows = await listVehicles(env, { publicOnly: true });
  return { configured: marker?.value === "1", vehicles: rows.map((row) => mapVehicle(row)) };
}

export async function publicCmsContent(env) {
  const sql = db(env);
  const managedRows = await sql`SELECT key FROM settings WHERE key IN (
    'cms_deals_managed', 'cms_articles_managed', 'cms_faqs_managed',
    'cms_banner_top_announcement_managed', 'cms_banner_fuel_banner_managed', 'cms_banner_hero_callout_managed'
  ) AND value = '1'`;
  const managed = new Set(managedRows.map((row) => row.key));
  const [bannerRows, dealRows, articleRows, faqRows] = await Promise.all([
    listBanners(env),
    listDeals(env),
    sql`SELECT id, kind, title, summary, body, image_key, meta, video_url, status, sort_order, published_at
      FROM articles ORDER BY sort_order, published_at DESC NULLS LAST`,
    sql`SELECT id, question, answer, active, sort_order FROM faqs ORDER BY sort_order, id`,
  ]);
  const now = Date.now();
  const managedSlots = ["top_announcement", "fuel_banner", "hero_callout"]
    .filter((slot) => managed.has(`cms_banner_${slot}_managed`));
  const activeBanners = bannerRows.filter((row) => managedSlots.includes(row.slot) && row.active &&
    (!row.starts_at || new Date(row.starts_at).getTime() <= now) && (!row.ends_at || new Date(row.ends_at).getTime() > now)).map(mapBanner);
  const publishedArticles = articleRows.filter((row) => row.status === "published" && (!row.published_at || new Date(row.published_at).getTime() <= now));
  const activeDeals = dealRows.filter((row) => row.active);
  const activeFaqs = faqRows.filter((row) => row.active);
  return {
    configured: {
      banners: managedSlots.length > 0,
      bannerSlots: managedSlots,
      deals: managed.has("cms_deals_managed"),
      articles: managed.has("cms_articles_managed"),
      faqs: managed.has("cms_faqs_managed"),
    },
    banners: activeBanners,
    deals: managed.has("cms_deals_managed") ? activeDeals.map(mapDeal) : [],
    articles: managed.has("cms_articles_managed") ? publishedArticles.map(mapArticle) : [],
    faqs: managed.has("cms_faqs_managed") ? activeFaqs.map(mapFaq) : [],
  };
}
