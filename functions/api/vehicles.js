import { json } from "../_lib/auth.js";
import { publicCmsVehicles } from "../_lib/cms.js";
import { filterVehicles, parseVehicleSearchParams } from "../_lib/vehicle-search.js";

function publicResponse(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Accept, Content-Type");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function onRequestOptions() {
  return publicResponse(new Response(null, { status: 204 }));
}

function siteOrigin(env) {
  try {
    return new URL(env.PUBLIC_SITE_URL || "https://autoacezambia.pages.dev").origin;
  } catch {
    return "https://autoacezambia.pages.dev";
  }
}

export async function onRequestGet({ request, env }) {
  let filters;
  try {
    filters = parseVehicleSearchParams(new URL(request.url).searchParams);
  } catch (error) {
    return publicResponse(json({ error: error instanceof Error ? error.message : "Invalid vehicle search filters." }, 400));
  }

  try {
    const catalogue = await publicCmsVehicles(env);
    const origin = siteOrigin(env);
    const vehicles = filterVehicles(catalogue.vehicles, filters).map((vehicle) => ({
      ...vehicle,
      price: vehicle.priceZMW > 0 ? vehicle.priceZMW : null,
      currency: "ZMW",
      priceOnRequest: vehicle.priceZMW <= 0,
      image: vehicle.images[0] || null,
      url: `${origin}/deal/${encodeURIComponent(vehicle.slug)}`,
    }));
    return publicResponse(json({ configured: catalogue.configured, count: vehicles.length, vehicles }));
  } catch (error) {
    console.error("Public CMS vehicles unavailable", error);
    return publicResponse(json({ error: "Vehicle listings are temporarily unavailable." }, 503));
  }
}
