"use client";
import { useState } from "react";
import AIPlanner from "./AIPlanner";
import {
  Plus,
  MapPin,
  Trash2,
  ChevronUp,
  ChevronDown,
  CalendarDays,
  Wallet,
  Download,
  Compass,
  Route,
  Bookmark,
} from "lucide-react";
import {
  countries,
  countryByCode,
  tripTotals,
  moveStop,
  newId,
} from "@/lib/core";
import { guides } from "@/lib/guides";
import { downloadBlob } from "@/lib/export";
import type { Trip } from "@/lib/types";
const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
export function freshTrip(code = "JP"): Trip {
  return {
    id: newId(),
    name: "My next adventure",
    start: "",
    travelers: 1,
    budget: 1500,
    transport: 0,
    stops: [{ country: code, city: "", days: 4, daily: 75 }],
    notes: "",
  };
}
export default function Planner({
  trips,
  onSave,
  onDelete,
  initialCode,
  onConsumed,
  notify,
  readOnly,
}: {
  trips: Trip[];
  onSave: (t: Trip) => void;
  onDelete: (id: string) => void;
  initialCode: string;
  onConsumed: () => void;
  notify: (m: string) => void;
  readOnly: boolean;
}) {
  const [draft, setDraft] = useState<Trip>(() =>
      freshTrip(initialCode || "JP"),
    ),
    [showDays, setShowDays] = useState(false),
    [addedCountry, setAddedCountry] = useState("TH");
  const total = tripTotals(draft);
  const dirty =
    JSON.stringify(trips.find((t) => t.id === draft.id)) !==
    JSON.stringify(draft);
  function patch(p: Partial<Trip>) {
    setDraft((d) => ({ ...d, ...p }));
    setShowDays(false);
  }
  function stop(index: number, p: Partial<Trip["stops"][number]>) {
    patch({
      stops: draft.stops.map((s, i) => (i === index ? { ...s, ...p } : s)),
    });
  }
  const days = draft.stops.flatMap((s) =>
    Array.from({ length: s.days }, (_, i) => {
      const g = guides[s.country];
      const city =
        g?.cities.find((c) => c.name.toLowerCase() === s.city.toLowerCase()) ||
        g?.cities[i % g.cities.length];
      return {
        country: countryByCode[s.country],
        city: s.city || city?.name || countryByCode[s.country].capital,
        activity:
          i === 0
            ? "Arrive, settle in, and explore your neighbourhood."
            : city
              ? `Explore ${city.places[(i - 1) % city.places.length]}. Leave time for a local meal and a slower afternoon.`
              : "Explore a neighbourhood, visit a local landmark, and leave room for the unexpected.",
      };
    }),
  );
  function openTrip(t: Trip) {
    if (
      dirty &&
      draft.stops.length &&
      !confirm(
        "Open this trip? Unsaved changes to the current draft will be lost.",
      )
    )
      return;
    setDraft(t);
    setShowDays(false);
  }
  function download() {
    const text = [
      draft.name,
      `Start: ${draft.start || "Flexible"} | ${draft.travelers} traveler(s) | ${total.days} days`,
      `Estimated total: ${money(total.total)} (planning estimate, not a live quote)`,
      ...draft.stops.map(
        (s) =>
          `${countryByCode[s.country].name}${s.city ? " / " + s.city : ""}: ${s.days} days, ${money(s.daily)} per person per day`,
      ),
      "",
      ...days.map(
        (d, i) => `Day ${i + 1}: ${d.city}, ${d.country.name}\n${d.activity}`,
      ),
      "",
      draft.notes,
    ].join("\n");
    downloadBlob(new Blob([text], { type: "text/plain" }), "roamly-trip.txt");
  }
  return (
    <div className="planner-layout">
      <section className="panel planner-editor">
        <div className="section-head">
          <div>
            <span className="eyebrow">MAKE ROOM FOR ADVENTURE</span>
            <h2>Where to next?</h2>
          </div>
          <Route size={25} className="accent" />
        </div>
        <p className="muted">
          Build a route, set your budget, and give each day a little direction.
        </p>
        <div className="form-grid">
          <label className="full">
            Trip name
            <input
              value={draft.name}
              maxLength={80}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </label>
          <label>
            Departure
            <input
              type="date"
              value={draft.start}
              onChange={(e) => patch({ start: e.target.value })}
            />
          </label>
          <label>
            Travellers
            <input
              type="number"
              min="1"
              max="20"
              value={draft.travelers}
              onChange={(e) =>
                patch({
                  travelers: Math.min(20, Math.max(1, Number(e.target.value))),
                })
              }
            />
          </label>
        </div>
        <div className="route-title">
          <h3>Your route</h3>
          <span>
            {total.days} days · {draft.stops.length} stops
          </span>
        </div>
        <div className="stops">
          {draft.stops.map((s, i) => (
            <div className="stop" key={i}>
              <span className="stop-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="stop-body">
                <div className="row spread">
                  <strong>
                    {countryByCode[s.country].flag}{" "}
                    {countryByCode[s.country].name}
                  </strong>
                  <div className="row">
                    <button
                      className="icon-btn"
                      disabled={i === 0}
                      aria-label={`Move stop ${i + 1} up`}
                      onClick={() =>
                        patch({ stops: moveStop(draft.stops, i, -1) })
                      }
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      className="icon-btn"
                      disabled={i === draft.stops.length - 1}
                      aria-label={`Move stop ${i + 1} down`}
                      onClick={() =>
                        patch({ stops: moveStop(draft.stops, i, 1) })
                      }
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      className="icon-btn"
                      aria-label={`Remove stop ${i + 1}`}
                      onClick={() =>
                        patch({ stops: draft.stops.filter((_, n) => n !== i) })
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="stop-fields">
                  <label>
                    City
                    <input
                      value={s.city}
                      list={`stop-city-${i}`}
                      placeholder="Any city"
                      onChange={(e) =>
                        stop(i, { city: e.target.value.slice(0, 100) })
                      }
                    />
                    <datalist id={`stop-city-${i}`}>
                      {guides[s.country]?.cities.map((c) => (
                        <option key={c.name} value={c.name} />
                      ))}
                    </datalist>
                  </label>
                  <label>
                    Days
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={s.days}
                      onChange={(e) =>
                        stop(i, {
                          days: Math.round(
                            Math.min(60, Math.max(1, Number(e.target.value))),
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    Daily / person (USD)
                    <input
                      type="number"
                      min="0"
                      max="100000"
                      value={s.daily}
                      onChange={(e) =>
                        stop(i, {
                          daily: Math.min(
                            100000,
                            Math.max(0, Number(e.target.value)),
                          ),
                        })
                      }
                    />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="add-stop">
          <select
            aria-label="Country to add to route"
            value={addedCountry}
            onChange={(e) => setAddedCountry(e.target.value)}
          >
            {countries.map((c) => (
              <option value={c.code} key={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
          <button
            className="btn"
            disabled={draft.stops.length >= 25}
            onClick={() =>
              patch({
                stops: [
                  ...draft.stops,
                  { country: addedCountry, city: "", days: 3, daily: 60 },
                ],
              })
            }
          >
            <Plus size={16} />
            Add stop
          </button>
        </div>
        <div className="form-grid">
          <label>
            Total budget (USD)
            <input
              type="number"
              min="0"
              value={draft.budget}
              onChange={(e) =>
                patch({
                  budget: Math.min(
                    10000000,
                    Math.max(0, Number(e.target.value)),
                  ),
                })
              }
            />
          </label>
          <label>
            Flights & other transport (USD)
            <input
              type="number"
              min="0"
              value={draft.transport}
              onChange={(e) =>
                patch({
                  transport: Math.min(
                    10000000,
                    Math.max(0, Number(e.target.value)),
                  ),
                })
              }
            />
          </label>
          <label className="full">
            Notes
            <textarea
              rows={3}
              value={draft.notes}
              maxLength={3000}
              placeholder="Bookings to make, things to pack, places not to miss…"
              onChange={(e) => patch({ notes: e.target.value })}
            />
          </label>
        </div>
        <div className="row wrap">
          <button
            className="btn primary"
            disabled={!draft.stops.length || readOnly || !draft.name.trim()}
            onClick={() => {
              onSave(draft);
              onConsumed();
              notify("Trip saved to your passport.");
            }}
          >
            <Bookmark size={16} />
            {trips.some((t) => t.id === draft.id)
              ? "Save changes"
              : "Save trip"}
          </button>
          <button
            className="btn"
            disabled={!draft.stops.length}
            onClick={() => setShowDays((s) => !s)}
          >
            <CalendarDays size={16} />
            {showDays ? "Hide day plan" : "Build day plan"}
          </button>
        </div>
        {showDays && (
          <div className="itinerary">
            <div className="row spread">
              <h3>A starting point for every day</h3>
              <button
                className="icon-btn"
                aria-label="Download trip plan"
                onClick={download}
              >
                <Download size={18} />
              </button>
            </div>
            <p className="muted small">
              An editable planning outline. Check opening hours, distances,
              weather and availability before travelling.
            </p>
            {days.map((d, i) => (
              <div className="day" key={i}>
                <span>DAY {String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h4>
                    {d.city} <small>{d.country.flag}</small>
                  </h4>
                  <p>{d.activity}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <AIPlanner
          trip={draft}
          onAdd={(text) => {
            patch({ notes: text });
            notify("AI ideas added to your draft. Save the trip to keep them.");
          }}
        />
      </section>
      <aside className="planner-side">
        <section className="panel budget-card">
          <Wallet size={23} className="accent" />
          <h3>Room in the budget?</h3>
          <div className="budget-total">
            {money(total.total)}
            <span>estimated trip total</span>
          </div>
          <div className="budget-line">
            <span>Daily spend × {draft.travelers} travellers</span>
            <strong>{money(total.stays)}</strong>
          </div>
          <div className="budget-line">
            <span>Flights & transport</span>
            <strong>{money(draft.transport)}</strong>
          </div>
          <div className="budget-line">
            <span>Your budget</span>
            <strong>{money(draft.budget)}</strong>
          </div>
          <div
            className={`budget-remaining ${total.total > draft.budget ? "over" : ""}`}
          >
            {money(Math.abs(draft.budget - total.total))}{" "}
            {total.total > draft.budget ? "over budget" : "left to explore"}
          </div>
          <p className="small muted">
            You set all prices. These are planning estimates, not live fares or
            hotel quotes.
          </p>
        </section>
        <section className="panel saved-trips">
          <div className="row spread">
            <h3>Saved adventures</h3>
            <button
              className="icon-btn"
              aria-label="Create new trip"
              onClick={() => {
                if (
                  !dirty ||
                  confirm("Start a new trip? Unsaved changes will be lost.")
                ) {
                  setDraft(freshTrip());
                  setShowDays(false);
                }
              }}
            >
              <Plus size={18} />
            </button>
          </div>
          {trips.length ? (
            trips.map((t) => (
              <div className="saved-trip" key={t.id}>
                <button onClick={() => openTrip(t)}>
                  <strong>{t.name}</strong>
                  <span>
                    {tripTotals(t).days} days ·{" "}
                    {t.stops
                      .map((s) => countryByCode[s.country]?.flag)
                      .join(" ")}
                  </span>
                </button>
                <button
                  className="icon-btn"
                  aria-label={`Delete ${t.name}`}
                  onClick={() => {
                    if (confirm(`Delete “${t.name}”?`)) onDelete(t.id);
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          ) : (
            <div className="empty-inline">
              <Compass size={28} />
              <p>Your next great trip starts here.</p>
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
