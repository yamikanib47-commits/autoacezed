import { resolvePageSeo } from "./_lib/seo.js";
import { normalizeRoutePath } from "./_lib/seo-paths.js";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function findTags(html, tagName) {
  const source = html.toLowerCase();
  const prefix = `<${tagName.toLowerCase()}`;
  const tags = [];
  let cursor = 0;
  while (cursor < source.length) {
    const start = source.indexOf(prefix, cursor);
    if (start < 0) break;
    const boundary = source[start + prefix.length];
    if (boundary && ![" ", "\t", "\n", "\r", ">", "/"].includes(boundary)) {
      cursor = start + prefix.length;
      continue;
    }
    const end = source.indexOf(">", start);
    if (end < 0) break;
    tags.push({ start, end: end + 1, raw: html.slice(start, end + 1) });
    cursor = end + 1;
  }
  return tags;
}

function attributeValue(tag, name) {
  const source = tag.toLowerCase();
  const needle = name.toLowerCase();
  let index = source.indexOf(needle);
  while (index >= 0) {
    const before = index === 0 ? " " : source[index - 1];
    let cursor = index + needle.length;
    while (source[cursor] === " " || source[cursor] === "\t" || source[cursor] === "\n") cursor += 1;
    if ((before === " " || before === "\n" || before === "\t") && source[cursor] === "=") {
      cursor += 1;
      while (source[cursor] === " " || source[cursor] === "\t" || source[cursor] === "\n") cursor += 1;
      const quote = tag[cursor];
      if (quote === "\"" || quote === "'") {
        const end = tag.indexOf(quote, cursor + 1);
        return end < 0 ? "" : tag.slice(cursor + 1, end);
      }
      let end = cursor;
      while (end < tag.length && ![" ", ">", "\t", "\n"].includes(tag[end])) end += 1;
      return tag.slice(cursor, end);
    }
    index = source.indexOf(needle, index + needle.length);
  }
  return "";
}

function replaceTag(html, tag, replacement) {
  return `${html.slice(0, tag.start)}${replacement}${html.slice(tag.end)}`;
}

function insertBeforeHeadEnd(html, markup) {
  const index = html.toLowerCase().lastIndexOf("</head>");
  return index < 0 ? html : `${html.slice(0, index)}${markup}\n${html.slice(index)}`;
}

function setMeta(html, attribute, name, value) {
  const tag = `<meta ${attribute}="${escapeHtml(name)}" content="${escapeHtml(value)}">`;
  const existing = findTags(html, "meta").find((item) => attributeValue(item.raw, attribute) === name);
  return existing ? replaceTag(html, existing, tag) : insertBeforeHeadEnd(html, tag);
}

function removeMeta(html, attribute, name) {
  const existing = findTags(html, "meta").find((item) => attributeValue(item.raw, attribute) === name);
  return existing ? replaceTag(html, existing, "") : html;
}

function setTitle(html, value) {
  const source = html.toLowerCase();
  const start = source.indexOf("<title");
  const openEnd = start < 0 ? -1 : source.indexOf(">", start);
  const closeStart = openEnd < 0 ? -1 : source.indexOf("</title>", openEnd);
  const tag = `<title>${escapeHtml(value)}</title>`;
  if (start >= 0 && closeStart >= 0) return `${html.slice(0, start)}${tag}${html.slice(closeStart + 8)}`;
  return insertBeforeHeadEnd(html, tag);
}

function setCanonical(html, href) {
  const tag = `<link rel="canonical" href="${escapeHtml(href)}">`;
  const existing = findTags(html, "link").find((item) => attributeValue(item.raw, "rel").toLowerCase() === "canonical");
  return existing ? replaceTag(html, existing, tag) : insertBeforeHeadEnd(html, tag);
}

function setStructuredData(html, data) {
  const serialized = JSON.stringify(data).replace(/</g, String.fromCharCode(92) + "u003c");
  const tag = `<script id="autoace-structured-data" type="application/ld+json">${serialized}</script>`;
  const marker = html.indexOf('id="autoace-structured-data"');
  if (marker < 0) return insertBeforeHeadEnd(html, tag);
  const start = html.lastIndexOf("<script", marker);
  const end = html.indexOf("</script>", marker);
  return start < 0 || end < 0 ? insertBeforeHeadEnd(html, tag) : `${html.slice(0, start)}${tag}${html.slice(end + 9)}`;
}

function carName(car) {
  return [car.year || "", car.make || "", car.model || "", car.trim || ""].filter(Boolean).join(" ") || car.name || "Vehicle listing";
}

function money(value) {
  const amount = Number(value) || 0;
  return amount > 0 ? `K ${amount.toLocaleString("en-GB")}` : "Price on request";
}

function locationWithCountry(value) {
  const location = String(value || "").replace(/,\s*zambia$/i, "").trim();
  return location && !/^zambia$/i.test(location) ? `${location}, Zambia` : "Zambia";
}

function noScriptMarkup(seo) {
  if (seo.path === "/agent") {
    return `<noscript><main class="seo-fallback"><h1>Join Autoace Zambia’s vehicle sourcing network</h1><p>Tell us about your vehicle-business experience, location and services. The Autoace team reviews applications; submitting a form does not automatically approve an applicant.</p><p><a href="/privacy">Read the agent application privacy notice</a></p></main></noscript>`;
  }
  if (seo.path === "/privacy") {
    return `<noscript><main class="seo-fallback"><h1>Privacy notice for agent applications</h1><p>This notice is a working draft and is not final. Autoace must complete its contact, retention and service-provider details before public rollout.</p><p><a href="/agent">Return to agent registration</a></p></main></noscript>`;
  }

  if (seo.car) {
    const car = seo.car;
    const facts = [
      car.condition,
      locationWithCountry(car.location),
      Number(car.mileageKm) > 0 ? `${Number(car.mileageKm).toLocaleString("en-GB")} km` : "",
      car.fuelType,
      car.gearbox,
    ].filter(Boolean).map(escapeHtml).join(" · ");
    const image = seo.imageUrl ? `<img src="${escapeHtml(seo.imageUrl)}" alt="${escapeHtml(seo.imageAlt || carName(car))}" loading="lazy">` : "";
    return `<noscript><main class="seo-fallback"><article><h1>${escapeHtml(carName(car))}</h1><p>${facts}</p><p>${escapeHtml(money(car.priceZMW))}</p>${image}<p>${escapeHtml(car.fullDescription || seo.description)}</p><p><a href="/showroom">Browse all cars</a></p></article></main></noscript>`;
  }
  if (seo.vehicles?.length) {
    const items = seo.vehicles.slice(0, 100).map((car) => {
      const url = `/deal/${encodeURIComponent(car.id || car.slug)}`;
      const name = carName(car);
      const location = locationWithCountry(car.location);
      return `<li><a href="${escapeHtml(url)}">${escapeHtml(name)}</a> — ${escapeHtml(money(car.priceZMW))}; ${escapeHtml(location)}</li>`;
    }).join("");
    return `<noscript><main class="seo-fallback"><section><h1>Cars for sale in Zambia</h1><ul>${items}</ul></section></main></noscript>`;
  }
  return "";
}

function addCrawlableFallback(html, seo) {
  if (html.toLowerCase().includes("<noscript")) return html;
  const root = findTags(html, "div").find((item) => attributeValue(item.raw, "id") === "root");
  if (!root) return html;
  const close = html.toLowerCase().indexOf("</div>", root.end);
  if (close < 0) return html;
  const fallback = noScriptMarkup(seo);
  return fallback ? `${html.slice(0, close + 6)}${fallback}${html.slice(close + 6)}` : html;
}

function injectSeo(html, seo) {
  let result = setTitle(html, seo.title);
  result = setMeta(result, "name", "description", seo.description);
  result = setMeta(result, "name", "robots", seo.robots || "index,follow");
  result = setMeta(result, "property", "og:title", seo.title);
  result = setMeta(result, "property", "og:description", seo.description);
  result = setMeta(result, "property", "og:type", "website");
  result = setMeta(result, "property", "og:url", seo.canonicalUrl);
  result = setMeta(result, "property", "og:site_name", seo.siteName || "Autoace Zambia");
  result = setMeta(result, "property", "og:locale", "en_ZM");
  result = setMeta(result, "name", "twitter:card", seo.imageUrl ? "summary_large_image" : "summary");
  result = setMeta(result, "name", "twitter:title", seo.title);
  result = setMeta(result, "name", "twitter:description", seo.description);
  result = setCanonical(result, seo.canonicalUrl);
  if (seo.imageUrl) {
    result = setMeta(result, "property", "og:image", seo.imageUrl);
    result = setMeta(result, "property", "og:image:alt", seo.imageAlt || seo.title);
    result = setMeta(result, "name", "twitter:image", seo.imageUrl);
  } else {
    result = removeMeta(result, "property", "og:image");
    result = removeMeta(result, "property", "og:image:alt");
    result = removeMeta(result, "name", "twitter:image");
  }
  result = setStructuredData(result, seo.structuredData);
  return addCrawlableFallback(result, seo);
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== "GET") return context.next();
  const url = new URL(request.url);
  const path = normalizeRoutePath(url.pathname);
  if (!path || !(["/", "/buyacar", "/sellacar", "/showroom"].includes(path) || path.startsWith("/deal/"))) return context.next();

  let seo = null;
  try {
    seo = await resolvePageSeo(env, path, url.origin);
  } catch {}

  const response = await context.next();
  if (!seo || !response.headers.get("content-type")?.toLowerCase().includes("text/html")) return response;
  const html = injectSeo(await response.text(), seo);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  headers.delete("last-modified");
  const status = seo.status && seo.status !== 200 ? seo.status : seo.notFound ? 404 : response.status;
  headers.set("cache-control", status === 200 ? "public, max-age=0, s-maxage=60, stale-while-revalidate=300" : "no-store");
  return new Response(html, { status, statusText: response.statusText, headers });
}
