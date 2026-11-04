export const SEO_PAGE_OPTIONS = [
  { id: "home", path: "/", label: "Home page" },
  { id: "buyacar", path: "/buyacar", label: "Buy a car" },
  { id: "sellacar", path: "/sellacar", label: "Sell a car" },
  { id: "showroom", path: "/showroom", label: "Showroom" },
];

const PAGE_BY_ID = new Map(SEO_PAGE_OPTIONS.map((page) => [page.id, page]));
const PAGE_BY_PATH = new Map(SEO_PAGE_OPTIONS.map((page) => [page.path, page]));

export function normalizeRoutePath(value) {
  let path = String(value || "/").split("?")[0].trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return null;
  }
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("..") || path.length > 240) return null;
  path = path !== "/" ? path.replace(/\/+$/, "") : path;
  return path || "/";
}

export function seoIdForPath(value) {
  const path = normalizeRoutePath(value);
  return path ? PAGE_BY_PATH.get(path)?.id || null : null;
}

export function seoPathForId(value) {
  return PAGE_BY_ID.get(String(value || ""))?.path || null;
}
