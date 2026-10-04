import LZString from "lz-string";
import countryData from "./countries.json";
import type { Country, CountryRecord, TravelData, Trip } from "./types";
export const countries = countryData as Country[];
export const countryByCode = Object.fromEntries(
  countries.map((c) => [c.code, c]),
);
export const CONTINENTS = [
  "Asia",
  "Europe",
  "Africa",
  "North America",
  "South America",
  "Oceania",
  "Antarctica",
];
export const blankRecord = (): CountryRecord => ({
  favorite: false,
  date: "",
  notes: "",
  places: [],
});
export const initialData = (): TravelData => ({
  version: 1,
  profile: {
    name: "Your passport",
    bio: "Always somewhere new.",
    home: "",
    avatar: "",
  },
  records: {},
  trips: [],
  theme: "atlas",
  updatedAt: new Date().toISOString(),
});
const str = (v: unknown, n = 500) =>
  typeof v === "string" ? v.slice(0, n) : "";
const num = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.min(max, Math.max(min, v))
    : fallback;
export function cleanData(value: unknown): TravelData {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Choose a valid Roamly backup.");
  const v = value as Record<string, unknown>;
  if (v.version !== 1 || !v.profile || !v.records || !Array.isArray(v.trips))
    throw new Error("This is not a supported Roamly backup.");
  const out = initialData();
  const p = v.profile as Record<string, unknown>;
  out.profile = {
    name: str(p.name, 50) || "Your passport",
    bio: str(p.bio, 140),
    home: countryByCode[str(p.home, 2)] ? str(p.home, 2) : "",
    avatar:
      typeof p.avatar === "string" &&
      /^data:image\/(png|jpeg|webp);base64,/.test(p.avatar) &&
      p.avatar.length < 300000
        ? p.avatar
        : "",
  };
  if (v.theme === "ocean" || v.theme === "paper") out.theme = v.theme;
  for (const [code, value] of Object.entries(v.records as object)) {
    if (!countryByCode[code] || !value || typeof value !== "object") continue;
    const r = value as Record<string, unknown>;
    out.records[code] = {
      favorite: r.favorite === true,
      status:
        r.status === "visited" || r.status === "wishlist"
          ? r.status
          : undefined,
      date: /^\d{4}-\d{2}-\d{2}$/.test(str(r.date, 10)) ? str(r.date, 10) : "",
      notes: str(r.notes, 3000),
      places: Array.isArray(r.places)
        ? r.places
            .slice(0, 1000)
            .filter((x) => x && typeof x === "object")
            .map((x, i) => ({
              id: str(x.id, 80) || `${code}-${i}`,
              name: str(x.name, 140),
              region: str(x.region, 100),
              city: str(x.city, 100),
              date: str(x.date, 10),
            }))
        : [],
    };
  }
  out.trips = v.trips
    .slice(0, 100)
    .filter((t) => t && typeof t === "object")
    .map((t, i) => ({
      id: str(t.id, 80) || `trip-${i}`,
      name: str(t.name, 80) || "New adventure",
      start: str(t.start, 10),
      travelers: Math.round(num(t.travelers, 1, 20, 1)),
      budget: num(t.budget, 0, 10000000, 1000),
      transport: num(t.transport, 0, 10000000, 0),
      notes: str(t.notes, 3000),
      stops: Array.isArray(t.stops)
        ? t.stops
            .slice(0, 25)
            .filter((s: { country: string }) => s && countryByCode[s.country])
            .map((s: Record<string, unknown>) => ({
              country: str(s.country, 2),
              city: str(s.city, 100),
              days: Math.round(num(s.days, 1, 60, 3)),
              daily: num(s.daily, 0, 100000, 60),
            }))
        : [],
    }));
  out.updatedAt = str(v.updatedAt, 40) || new Date().toISOString();
  return out;
}
export function stats(data: TravelData) {
  const visited = countries.filter(
    (c) => data.records[c.code]?.status === "visited",
  );
  const counted = visited.filter((c) => c.counted);
  const denominator = countries.filter((c) => c.counted).length;
  return {
    visited,
    count: counted.length,
    denominator,
    percent: ((counted.length / denominator) * 100).toFixed(1),
    continents: new Set(visited.map((c) => c.continent)).size,
    wishlist: countries.filter(
      (c) => data.records[c.code]?.status === "wishlist",
    ),
    favorites: countries.filter((c) => data.records[c.code]?.favorite),
    places: visited.reduce(
      (sum, c) => sum + (data.records[c.code]?.places.length || 0),
      0,
    ),
    cities: new Set(
      visited.flatMap((c) =>
        (data.records[c.code]?.places || [])
          .filter((p) => p.city)
          .map((p) => `${c.code}-${p.city}`),
      ),
    ).size,
  };
}
export function explorerRank(n: number) {
  return n >= 100
    ? "World citizen"
    : n >= 50
      ? "Globetrotter"
      : n >= 20
        ? "Adventurer"
        : n >= 5
          ? "Explorer"
          : "First footsteps";
}
export function tripTotals(trip: Trip) {
  const days = trip.stops.reduce((s, t) => s + t.days, 0);
  const stays = trip.stops.reduce(
    (s, t) => s + t.days * t.daily * trip.travelers,
    0,
  );
  return { days, stays, total: stays + trip.transport };
}
export function encodeShare(data: TravelData) {
  const records = Object.fromEntries(
    Object.entries(data.records)
      .filter(([, r]) => r.status || r.favorite)
      .map(([c, r]) => [
        c,
        {
          status: r.status,
          favorite: r.favorite,
          date: "",
          notes: "",
          places: [],
        },
      ]),
  );
  return LZString.compressToEncodedURIComponent(
    JSON.stringify({
      ...initialData(),
      profile: { ...data.profile, avatar: "", home: "" },
      records,
    }),
  );
}
export function decodeShare(value: string) {
  if (value.length > 16000)
    throw new Error("This shared passport is too large.");
  const raw = LZString.decompressFromEncodedURIComponent(value);
  if (!raw || raw.length > 500000)
    throw new Error("This passport link is invalid.");
  return cleanData(JSON.parse(raw));
}
export function moveStop<T>(items: T[], index: number, direction: number) {
  const next = [...items],
    target = index + direction;
  if (target < 0 || target >= items.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
// Record identifiers are not secrets. getRandomValues also works on local HTTP previews.
export function newId() {
  if (typeof globalThis.crypto?.randomUUID === "function")
    return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues)
    globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
