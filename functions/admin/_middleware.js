function createClerkScript(publishableKey) {
  if (typeof publishableKey !== "string" || !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(publishableKey)) return null;
  const encodedFrontendApi = publishableKey.split("_").slice(2).join("_");
  const base64 = encodedFrontendApi.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
  let frontendApi;
  try {
    frontendApi = atob(padded).replace(/\$$/, "");
  } catch {
    return null;
  }
  if (!/^[a-z0-9.-]+$/i.test(frontendApi)) return null;
  return `<script async crossorigin="anonymous" data-clerk-publishable-key="${publishableKey}" src="https://${frontendApi}/npm/@clerk/clerk-js@5/dist/clerk.browser.js" onload="initialize()" onerror="setMessage('Authentication service failed to load. Check your connection.', true)"></script>`;
}

function clerkConfigScript(env, requestUrl) {
  const publishableKey = env.VITE_CLERK_PUBLISHABLE_KEY;
  const secretKey = env.CLERK_SECRET_KEY;
  const hostname = new URL(requestUrl).hostname;
  const isProduction = env.CF_PAGES_BRANCH === "main" || hostname === "autoacezambia.pages.dev";
  if (isProduction && (!String(publishableKey || "").startsWith("pk_live_") || !String(secretKey || "").startsWith("sk_live_"))) {
    return "<script>setMessage('Production sign-in requires live Clerk keys in Cloudflare Pages.', true)</script>";
  }
  return createClerkScript(publishableKey) || "<script>setMessage('Clerk sign-in is not configured for this deployment.', true)</script>";
}

export async function onRequest({ env, next, request }) {
  const response = await next();
  if (!response.headers.get("content-type")?.includes("text/html")) return response;
  const html = await response.text();
  const marker = "<!-- AUTOACE_CLERK_SCRIPT -->";
  if (!html.includes(marker)) return response;
  const script = clerkConfigScript(env, request.url);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  headers.set("cache-control", "no-store");
  return new Response(html.replace(marker, script), { status: response.status, statusText: response.statusText, headers });
}
