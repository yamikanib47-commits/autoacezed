const SORTS = new Set(["recommended", "newest", "price-asc", "price-desc"]);
const MAX_NEW_WITHIN_HOURS = 24 * 365;

function textParam(params, key, maxLength = 100) {
  const value = params.get(key)?.trim() || "";
  if (value.length > maxLength) throw new Error(`${key} must be ${maxLength} characters or fewer.`);
  return value;
}

function integerParam(params, key, { min, max }) {
  const raw = params.get(key);
  if (raw === null || raw.trim() === "") return null;
  if (!/^\d+$/.test(raw.trim())) throw new Error(`${key} must be a whole number.`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${key} must be between ${min.toLocaleString()} and ${max.toLocaleString()}.`);
  }
  return value;
}

export function parseVehicleSearchParams(params) {
  const minYear = integerParam(params, "minYear", { min: 1886, max: 2100 });
  const maxYear = integerParam(params, "maxYear", { min: 1886, max: 2100 });
  const minPrice = integerParam(params, "minPrice", { min: 0, max: 1_000_000_000 });
  const maxPrice = integerParam(params, "maxPrice", { min: 0, max: 1_000_000_000 });
  const newWithinHours = integerParam(params, "newWithinHours", { min: 1, max: MAX_NEW_WITHIN_HOURS });
  const requestedSort = textParam(params, "sort", 24);
  const sort = requestedSort || (newWithinHours ? "newest" : "recommended");

  if (minYear !== null && maxYear !== null && minYear > maxYear) throw new Error("minYear cannot be greater than maxYear.");
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) throw new Error("minPrice cannot be greater than maxPrice.");
  if (!SORTS.has(sort)) throw new Error("sort must be recommended, newest, price-asc or price-desc.");

  return {
    make: textParam(params, "make", 80),
    model: textParam(params, "model", 100),
    location: textParam(params, "location", 100),
    q: textParam(params, "q", 160),
    minYear,
    maxYear,
    minPrice,
    maxPrice,
    newWithinHours,
    sort,
  };
}

function matchesText(value, query) {
  return !query || String(value || "").toLocaleLowerCase().includes(query.toLocaleLowerCase());
}

export function filterVehicles(vehicles, filters, now = Date.now()) {
  const cutoff = filters.newWithinHours === null ? null : now - filters.newWithinHours * 60 * 60 * 1000;
  const results = vehicles.filter((vehicle) => {
    if (!matchesText(vehicle.make, filters.make)) return false;
    if (!matchesText(vehicle.model, filters.model)) return false;
    if (!matchesText(vehicle.location, filters.location)) return false;
    if (filters.q && !matchesText([vehicle.name, vehicle.make, vehicle.model, vehicle.trim, vehicle.location].join(" "), filters.q)) return false;

    const year = Number(vehicle.year);
    if (filters.minYear !== null && (!Number.isFinite(year) || year < filters.minYear)) return false;
    if (filters.maxYear !== null && (!Number.isFinite(year) || year > filters.maxYear)) return false;

    const price = Number(vehicle.priceZMW ?? vehicle.price);
    if ((filters.minPrice !== null || filters.maxPrice !== null) && (!Number.isFinite(price) || price <= 0)) return false;
    if (filters.minPrice !== null && price < filters.minPrice) return false;
    if (filters.maxPrice !== null && price > filters.maxPrice) return false;

    if (cutoff !== null) {
      const listedAt = Date.parse(vehicle.listedAt || "");
      if (!Number.isFinite(listedAt) || listedAt < cutoff || listedAt > now) return false;
    }
    return true;
  });

  if (filters.sort === "newest") {
    results.sort((a, b) => Date.parse(b.listedAt || "") - Date.parse(a.listedAt || ""));
  } else if (filters.sort === "price-asc" || filters.sort === "price-desc") {
    const direction = filters.sort === "price-asc" ? 1 : -1;
    results.sort((a, b) => {
      const aPrice = Number(a.priceZMW ?? a.price);
      const bPrice = Number(b.priceZMW ?? b.price);
      const aKnown = Number.isFinite(aPrice) && aPrice > 0;
      const bKnown = Number.isFinite(bPrice) && bPrice > 0;
      if (aKnown !== bKnown) return aKnown ? -1 : 1;
      return (aPrice - bPrice) * direction;
    });
  }

  return results;
}
