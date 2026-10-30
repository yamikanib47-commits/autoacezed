import { json } from "../_lib/auth.js";
import { publicCmsVehicles } from "../_lib/cms.js";

export async function onRequestGet({ env }) {
  try {
    const response = json(await publicCmsVehicles(env));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Public CMS vehicles unavailable", error);
    const response = json({ error: "Vehicle listings are temporarily unavailable." }, 503);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
