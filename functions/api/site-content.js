import { json } from "../_lib/auth.js";
import { publicCmsContent } from "../_lib/cms.js";

export async function onRequestGet({ env }) {
  try {
    const response = json(await publicCmsContent(env));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Public CMS content unavailable", error);
    const response = json({ error: "Site content is temporarily unavailable." }, 503);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
