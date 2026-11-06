import assert from "node:assert/strict";
import test from "node:test";
import { filterVehicles, parseVehicleSearchParams } from "../functions/_lib/vehicle-search.js";
import { onRequestGet, onRequestOptions } from "../functions/api/vehicles.js";

const now = Date.parse("2026-11-06T10:00:00.000Z");
const vehicles = [
  { id: "mark-x", make: "Toyota", model: "Mark X", year: 2012, priceZMW: 145000, location: "Lusaka", listedAt: "2026-11-06T09:00:00.000Z" },
  { id: "fit", make: "Honda", model: "Fit", year: 2014, priceZMW: 95000, location: "Ndola", listedAt: "2026-11-05T09:00:00.000Z" },
  { id: "premium", make: "Toyota", model: "Land Cruiser", year: 2018, priceZMW: 450000, location: "Lusaka", listedAt: "2026-11-06T08:00:00.000Z" },
  { id: "unpriced", make: "Mazda", model: "Demio", year: 2013, priceZMW: 0, location: "Kitwe", listedAt: "2026-11-06T07:00:00.000Z" },
];

test("filters by make, model, minimum year and maximum price", () => {
  const filters = parseVehicleSearchParams(new URLSearchParams("make=Toyota&model=Mark+X&minYear=2012&maxPrice=150000"));
  const result = filterVehicles(vehicles, filters, now);
  assert.deepEqual(result.map((vehicle) => vehicle.id), ["mark-x"]);
});

test("filters and sorts stock listed within the requested hours", () => {
  const filters = parseVehicleSearchParams(new URLSearchParams("newWithinHours=24"));
  const result = filterVehicles(vehicles, filters, now);
  assert.deepEqual(result.map((vehicle) => vehicle.id), ["mark-x", "premium", "unpriced"]);
});

test("filters under-budget results without treating price-on-request as zero", () => {
  const filters = parseVehicleSearchParams(new URLSearchParams("maxPrice=99999"));
  const result = filterVehicles(vehicles, filters, now);
  assert.deepEqual(result.map((vehicle) => vehicle.id), ["fit"]);
});

test("rejects invalid ranges and sort names", () => {
  assert.throws(() => parseVehicleSearchParams(new URLSearchParams("minYear=2020&maxYear=2012")), /minYear/);
  assert.throws(() => parseVehicleSearchParams(new URLSearchParams("minPrice=200000&maxPrice=100000")), /minPrice/);
  assert.throws(() => parseVehicleSearchParams(new URLSearchParams("sort=anything")), /sort/);
});

test("public API validates filters and answers CORS preflight", async () => {
  const invalid = await onRequestGet({
    request: new Request("https://autoacezambia.pages.dev/api/vehicles?minYear=2020&maxYear=2012"),
    env: {},
  });
  const preflight = onRequestOptions();
  assert.equal(invalid.status, 400);
  assert.equal(invalid.headers.get("access-control-allow-origin"), "*");
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-methods"), "GET, OPTIONS");
});
