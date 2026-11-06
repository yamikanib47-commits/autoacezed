import { db } from "./auth.js";
import { imageUrl, publicCmsContent, publicCmsVehicles } from "./cms.js";
import { normalizeRoutePath, seoIdForPath } from "./seo-paths.js";

const PAGE_META = {
  "/": {
    title: "Autoace Zambia | Buy and sell cars in Zambia",
    description: "Browse cars for sale across Zambia, compare vehicle details and locations, or submit a car for sale.",
  },
  "/buyacar": {
    title: "Cars for sale in Zambia | Autoace Zambia",
    description: "Find cars for sale in Zambia by make, model, price, fuel type and location.",
  },
  "/sellacar": {
    title: "Sell your car in Zambia | Autoace Zambia",
    description: "Submit your car for sale in Zambia with its location, price, photographs and key specifications.",
  },
  "/showroom": {
    title: "Car showroom | Autoace Zambia",
    description: "Browse published cars for sale in Zambia, with prices, locations, photographs and vehicle details.",
  },
  "/agent": {
    title: "Vehicle sourcing agents in Zambia | Autoace Zambia",
    description: "Apply to join Autoace Zambia’s vehicle sourcing network. Tell us about your experience, coverage and services; applications are reviewed by our team.",
  },
  "/privacy": {
    title: "Privacy notice for agent applications | Autoace Zambia",
    description: "How Autoace Zambia handles information submitted through its agent registration form.",
  },
};

function plain(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function clip(value, max = 300) {
  const text = plain(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function absoluteImage(value, origin) {
  const ref = String(value || "").trim();
  if (!ref) return "";
  const path = /^https:\/\//i.test(ref) || ref.startsWith("/assets/") || ref.startsWith("/api/files/")
    ? ref
    : imageUrl(ref);
  try {
    const url = new URL(path, origin);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function carTitle(car) {
  return [car.year || "", car.make || "", car.model || "", car.trim || ""].filter(Boolean).join(" ").trim();
}

function money(value) {
  const amount = Number(value) || 0;
  return amount > 0 ? `K ${amount.toLocaleString("en-GB")}` : "Price on request";
}

function locationLabel(value) {
  return plain(value).replace(/,\s*zambia$/i, "").trim() || "Zambia";
}

function carDescription(car) {
  const name = carTitle(car) || car.name || "Vehicle";
  const location = locationLabel(car.location);
  const place = location === "Zambia" ? "in Zambia" : `in ${location}, Zambia`;
  const facts = [
    Number(car.mileageKm) > 0 ? `${Number(car.mileageKm).toLocaleString("en-GB")} km` : "",
    plain(car.fuelType),
    plain(car.gearbox),
  ].filter(Boolean).join(" · ");
  const details = plain(car.fullDescription);
  return clip(`${name} for sale ${place}. ${money(car.priceZMW)}${facts ? ` · ${facts}` : ""}.${details ? ` ${details}` : ""} View the listing and enquire on Autoace Zambia.`, 320);
}

function pageLabel(path) {
  return PAGE_META[path]?.title || "Autoace Zambia";
}

function carUrl(car, origin) {
  return `${origin}/deal/${encodeURIComponent(car.id || car.slug)}`;
}

async function readSeoOverride(env, path) {
  const id = seoIdForPath(path);
  if (!id || !env?.DATABASE_URL) return null;
  const [row] = await db(env)`SELECT value FROM settings WHERE key = ${`cms_seo_page_${id}`}`;
  if (!row?.value) return null;
  try {
    const page = JSON.parse(row.value);
    if (!page || page.path !== path || !page.active) return null;
    return page;
  } catch {
    return null;
  }
}

function buildGraph({ origin, path, title, description, image, car, vehicles, faqs }) {
  const canonicalUrl = `${origin}${path}`;
  const organizationId = `${origin}/#organization`;
  const websiteId = `${origin}/#website`;
  const graph = [
    {
      "@type": "AutoDealer",
      "@id": organizationId,
      name: "Autoace Zambia",
      url: origin,
      areaServed: { "@type": "Country", name: "Zambia" },
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: "Autoace Zambia",
      url: origin,
      inLanguage: "en-ZM",
      publisher: { "@id": organizationId },
      potentialAction: {
        "@type": "SearchAction",
        target: `${origin}/buyacar?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: title,
      description,
      inLanguage: "en-ZM",
      isPartOf: { "@id": websiteId },
      ...(image ? { primaryImageOfPage: { "@type": "ImageObject", url: image } } : {}),
    },
  ];

  if (car) {
    const name = carTitle(car) || car.name || title;
    const photos = (car.images || []).map((src) => absoluteImage(src, origin)).filter(Boolean);
    const vehicle = {
      "@type": "Vehicle",
      "@id": `${canonicalUrl}#vehicle`,
      name,
      url: canonicalUrl,
      description,
      brand: car.make ? { "@type": "Brand", name: car.make } : undefined,
      model: car.model || undefined,
      vehicleModelDate: Number(car.year) > 0 ? String(car.year) : undefined,
      vehicleConfiguration: car.trim || undefined,
      bodyType: car.bodyStyle || undefined,
      fuelType: car.fuelType || undefined,
      vehicleTransmission: car.gearbox || undefined,
      itemCondition: car.condition === "Brand New" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
      image: photos.length ? photos : undefined,
      mileageFromOdometer: Number(car.mileageKm) > 0 ? {
        "@type": "QuantitativeValue",
        value: Number(car.mileageKm),
        unitCode: "KMT",
        unitText: "km",
      } : undefined,
    };
    if (Number(car.priceZMW) > 0) {
      vehicle.offers = {
        "@type": "Offer",
        url: canonicalUrl,
        price: Number(car.priceZMW),
        priceCurrency: "ZMW",
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: car.dealer || "Autoace Zambia" },
        ...(car.location ? { availableAtOrFrom: { "@type": "Place", name: car.location } } : {}),
      };
    }
    graph.push(vehicle);
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: origin },
        { "@type": "ListItem", position: 2, name: "Showroom", item: `${origin}/showroom` },
        { "@type": "ListItem", position: 3, name, item: canonicalUrl },
      ],
    });
  } else if (["/", "/buyacar", "/showroom"].includes(path) && vehicles.length) {
    graph.push({
      "@type": "ItemList",
      name: "Cars for sale in Zambia",
      numberOfItems: vehicles.length,
      itemListElement: vehicles.slice(0, 100).map((item, index) => {
        const itemUrl = carUrl(item, origin);
        const imageUrl = absoluteImage(item.images?.[0], origin);
        const vehicle = {
          "@type": "Vehicle",
          name: carTitle(item) || item.name || "Vehicle listing",
          url: itemUrl,
          description: carDescription(item),
          ...(item.make ? { brand: { "@type": "Brand", name: item.make } } : {}),
          ...(item.model ? { model: item.model } : {}),
          ...(Number(item.year) > 0 ? { vehicleModelDate: String(item.year) } : {}),
          ...(imageUrl ? { image: imageUrl } : {}),
        };
        if (Number(item.priceZMW) > 0) {
          vehicle.offers = {
            "@type": "Offer",
            url: itemUrl,
            price: Number(item.priceZMW),
            priceCurrency: "ZMW",
            availability: "https://schema.org/InStock",
            ...(item.location ? { availableAtOrFrom: { "@type": "Place", name: item.location } } : {}),
          };
        }
        return { "@type": "ListItem", position: index + 1, item: vehicle };
      }),
    });
  }

  if (!car && path === "/" && faqs.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: plain(faq.question),
        acceptedAnswer: { "@type": "Answer", text: plain(faq.answer) },
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

export async function resolvePageSeo(env, rawPath, origin) {
  const path = normalizeRoutePath(rawPath);
  if (!path) return null;
  const dealMatch = path.match(/^\/deal\/([a-z0-9][a-z0-9-]{0,119})$/i);
  const isStaticPage = Object.hasOwn(PAGE_META, path);
  if (!isStaticPage && !dealMatch) return null;

  let override = null;
  let inventory = [];
  let inventoryAvailable = false;
  let content = { banners: [], deals: [], faqs: [] };
  if (isStaticPage && env?.DATABASE_URL) {
    try {
      override = await readSeoOverride(env, path);
    } catch {}
  }
  if (env?.DATABASE_URL && (dealMatch || ["/", "/buyacar", "/showroom", "/agent"].includes(path))) {
    try {
      const result = await publicCmsVehicles(env);
      inventory = result.vehicles || [];
      inventoryAvailable = true;
    } catch {}
  }
  if (["/", "/agent"].includes(path) && env?.DATABASE_URL) {
    try {
      content = await publicCmsContent(env);
    } catch {}
  }

  let car = null;
  if (dealMatch && inventoryAvailable) {
    const slug = decodeURIComponent(dealMatch[1]);
    car = inventory.find((item) => item.id === slug || item.slug === slug) || null;
  }
  const notFound = Boolean(dealMatch && inventoryAvailable && !car);
  const unavailable = Boolean(dealMatch && !inventoryAvailable);
  const defaultPage = PAGE_META[path] || {
    title: "Vehicle listing | Autoace Zambia",
    description: "View vehicle photographs, specifications, price and location on Autoace Zambia.",
  };
  const title = car
    ? `${carTitle(car) || car.name || "Vehicle listing"} in ${locationLabel(car.location)} | Autoace Zambia`
    : unavailable ? "Vehicle listing temporarily unavailable | Autoace Zambia"
      : notFound ? "Vehicle listing unavailable | Autoace Zambia" : override?.title || defaultPage.title;
  const description = car ? carDescription(car) : unavailable
    ? "Vehicle details are temporarily unavailable. Please retry or browse current cars for sale in Zambia."
    : notFound ? "This vehicle listing is no longer available. Browse current cars for sale in Zambia."
      : override?.description || defaultPage.description;
  const canonicalUrl = `${origin}${path}`;
  let imageRef = car?.images?.[0] || override?.imageKey || "";
  let imageAlt = car ? carTitle(car) || car.name : override?.imageAlt || title;
  if (!imageRef && ["/", "/agent"].includes(path)) {
    const hero = (content.banners || []).find((banner) => banner.slot === "hero_callout");
    const candidate = hero?.imageUrl || hero?.imageKey || "";
    if (!/\.(mp4|webm)(?:$|[?#])/i.test(candidate)) imageRef = candidate;
  }
  if (!imageRef && ["/", "/buyacar", "/showroom", "/agent"].includes(path)) {
    const previewVehicle = inventory.find((item) => item.images?.[0]);
    if (previewVehicle) {
      imageRef = previewVehicle.images[0];
      if (!car && !override?.imageAlt) imageAlt = carTitle(previewVehicle) || previewVehicle.name || title;
    }
  }
  const image = absoluteImage(imageRef, origin);
  const structuredData = buildGraph({
    origin,
    path,
    title,
    description,
    image,
    car,
    vehicles: inventory,
    faqs: content.faqs || [],
  });
  return {
    path,
    title,
    description,
    canonicalUrl,
    imageUrl: image,
    imageAlt: plain(imageAlt),
    structuredData,
    car,
    vehicles: inventory,
    isVehiclePage: Boolean(dealMatch),
    notFound,
    status: unavailable ? 503 : notFound ? 404 : 200,
    robots: path === "/privacy" || notFound || unavailable ? "noindex,follow" : "index,follow",
    siteName: "Autoace Zambia",
  };
}

function cleanLine(value) {
  return plain(value).replace(/[\[\]<>]/g, "").replace(/\|/g, "·");
}

export async function buildLlmsText(env, origin) {
  let vehicles = [];
  let content = { deals: [] };
  if (env?.DATABASE_URL) {
    const results = await Promise.allSettled([publicCmsVehicles(env), publicCmsContent(env)]);
    if (results[0].status === "fulfilled") vehicles = results[0].value.vehicles || [];
    if (results[1].status === "fulfilled") content = results[1].value;
  }
  const lines = [
    "# Autoace Zambia",
    "> Public car listings and vehicle requests for Zambia. Listing details, prices and locations are supplied by the publisher; check each listing before acting.",
    "",
    "## Main pages",
    `- [Home](${origin}/): Published vehicle listings and current site updates.`,
    `- [Buy a car](${origin}/buyacar): Search cars by make, model, price, fuel type and location.`,
    `- [Showroom](${origin}/showroom): Browse published cars for sale.`,
    `- [Sell a car](${origin}/sellacar): Submit a vehicle for review.`,
    `- [Join the agent network](${origin}/agent): Apply to support vehicle sourcing; applications are reviewed by the Autoace team.`,
    `- [Privacy notice](${origin}/privacy): Working draft; review before relying on it as final policy.`,

    "",
    "## Published vehicles",
  ];
  if (!vehicles.length) lines.push("No published vehicle listings are currently available.");
  for (const car of vehicles) {
    const name = cleanLine(carTitle(car) || car.name || "Vehicle listing");
    const location = cleanLine(car.location || "Zambia");
    const price = money(car.priceZMW);
    const facts = [
      car.condition ? `Condition: ${cleanLine(car.condition)}` : "",
      car.fuelType ? `Fuel: ${cleanLine(car.fuelType)}` : "",
      car.gearbox ? `Transmission: ${cleanLine(car.gearbox)}` : "",
      Number(car.mileageKm) > 0 ? `Mileage: ${Number(car.mileageKm).toLocaleString("en-GB")} km` : "",
    ].filter(Boolean).join("; ");
    lines.push(`- [${name}](${carUrl(car, origin)}) — ${price}; location: ${location}, Zambia${facts ? `; ${facts}` : ""}.`);
    const previewImage = absoluteImage(car.images?.[0], origin);
    if (previewImage) lines.push(`  Preview image: ${previewImage}`);
    if (car.fullDescription) lines.push(`  Description: ${cleanLine(clip(car.fullDescription, 500))}`);
  }
  lines.push("", "## Current deal filters");
  const deals = content.deals || [];
  if (!deals.length) lines.push("No active deal filters are currently published.");
  for (const deal of deals) {
    const title = cleanLine(deal.title || "Current deal");
    const query = deal.budgetQuery ? `?q=${encodeURIComponent(deal.budgetQuery)}` : "";
    lines.push(`- [${title}](${origin}/buyacar${query})${deal.tag ? ` — ${cleanLine(deal.tag)}` : ""}`);
  }
  lines.push(
    "",
    "## Machine-readable sources",
    `- [Published vehicle feed](${origin}/api/vehicles)`,
    `- [Published site content](${origin}/api/site-content)`,
    `- [XML sitemap](${origin}/sitemap.xml)`,
    "",
  );
  return lines.join("\n");
}

export async function buildSitemapXml(env, origin) {
  let vehicles = [];
  if (env?.DATABASE_URL) {
    try {
      vehicles = (await publicCmsVehicles(env)).vehicles || [];
    } catch {}
  }
  const urls = new Set(["/", "/buyacar", "/sellacar", "/showroom", "/agent"]);
  for (const car of vehicles) urls.add(`/deal/${encodeURIComponent(car.id || car.slug)}`);
  const escapeXml = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
  const entries = [...urls].map((path) => `  <url><loc>${escapeXml(`${origin}${path}`)}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}
