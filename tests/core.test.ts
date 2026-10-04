import { test } from "node:test";
import assert from "node:assert/strict";
import {
  countries,
  stats,
  blankRecord,
  initialData,
  cleanData,
  encodeShare,
  decodeShare,
  tripTotals,
  moveStop,
  newId,
} from "../lib/core";
test("195-country score excludes territories, includes the two observer states", () => {
  assert.equal(countries.filter((c) => c.counted).length, 195);
  const d = initialData();
  for (const code of ["BD", "CN", "VA", "PS", "HK", "AQ"])
    d.records[code] = { ...blankRecord(), status: "visited" };
  const s = stats(d);
  assert.equal(s.count, 4);
  assert.equal(s.continents, 3);
  assert.equal(s.percent, "2.1");
});
test("shared passport excludes all private memory data", () => {
  const d = initialData();
  d.profile = {
    name: "Test explorer",
    bio: "My world",
    avatar: "data:image/jpeg;base64,eA==",
    home: "BD",
  };
  d.records.BD = {
    ...blankRecord(),
    status: "visited",
    date: "2026-01-02",
    notes: "private note",
    places: [
      {
        id: "1",
        name: "Secret place",
        region: "Dhaka",
        city: "Dhaka",
        date: "2026-01-02",
      },
    ],
  };
  const raw = encodeShare(d),
    out = decodeShare(raw);
  assert.equal(out.records.BD.status, "visited");
  assert.equal(out.records.BD.notes, "");
  assert.equal(out.records.BD.date, "");
  assert.deepEqual(out.records.BD.places, []);
  assert.equal(out.profile.avatar, "");
  assert.equal(out.profile.home, "");
  assert.deepEqual(out.trips, []);
});
test("backup validation rejects bad versions and clamps unsafe input", () => {
  assert.throws(() => cleanData({ version: 2 }));
  assert.throws(() => decodeShare("invalid"));
  const d = initialData();
  d.records.ZZ = { ...blankRecord(), status: "visited" };
  d.profile.avatar = "javascript:alert(1)";
  d.trips = [
    {
      id: "1",
      name: "x",
      start: "",
      travelers: -4,
      budget: -100,
      transport: 100,
      notes: "",
      stops: [{ country: "BD", city: "Dhaka", days: 500, daily: NaN }],
    },
  ];
  const o = cleanData(d);
  assert.equal(o.records.ZZ, undefined);
  assert.equal(o.profile.avatar, "");
  assert.equal(o.trips[0].travelers, 1);
  assert.equal(o.trips[0].stops[0].days, 60);
  assert.equal(o.trips[0].stops[0].daily, 60);
});
test("trip budget applies traveller count once and total transport once", () => {
  const t = {
    id: "1",
    name: "Trip",
    start: "",
    notes: "",
    travelers: 2,
    budget: 1500,
    transport: 300,
    stops: [
      { country: "TH", city: "Bangkok", days: 3, daily: 50 },
      { country: "SG", city: "", days: 2, daily: 100 },
    ],
  };
  assert.deepEqual(tripTotals(t), { days: 5, stays: 700, total: 1000 });
  assert.deepEqual(moveStop(["TH", "MY", "SG"], 2, -1), ["TH", "SG", "MY"]);
  assert.deepEqual(moveStop(["TH"], 0, -1), ["TH"]);
});
test("record ids are unique and backup roundtrips preserve Unicode", () => {
  assert.notEqual(newId(), newId());
  const d = initialData();
  d.profile.name = "ফয়সাল";
  d.records.BD = { ...blankRecord(), notes: "আমার বাংলাদেশ" };
  assert.deepEqual(
    JSON.parse(JSON.stringify(cleanData(JSON.parse(JSON.stringify(d))))),
    JSON.parse(JSON.stringify(d)),
  );
});
