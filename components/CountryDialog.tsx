"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Bookmark,
  Heart,
  MapPin,
  Globe2,
  Plus,
  Trash2,
  ExternalLink,
  CalendarDays,
} from "lucide-react";
import Modal from "./Modal";
import { newId } from "@/lib/core";
import { guides } from "@/lib/guides";
import type { Country, CountryRecord, PlaceEntry } from "@/lib/types";
export default function CountryDialog({
  country: c,
  record: r,
  onChange,
  onClose,
  onPlan,
  readOnly,
}: {
  country: Country;
  record: CountryRecord;
  onChange: (patch: Partial<CountryRecord>) => void;
  onClose: () => void;
  onPlan: (code: string) => void;
  readOnly: boolean;
}) {
  const [tab, setTab] = useState("overview"),
    [regions, setRegions] = useState<{
      states: { code: string; name: string }[];
      cities: { name: string; state: string }[];
    } | null>(null),
    [region, setRegion] = useState(""),
    [city, setCity] = useState(""),
    [place, setPlace] = useState(""),
    [placeDate, setPlaceDate] = useState(""),
    [loadError, setLoadError] = useState(false);
  const g = guides[c.code];
  useEffect(() => {
    const ac = new AbortController();
    fetch(`/data/regions/${c.code}.json`, { signal: ac.signal })
      .then((x) => {
        if (!x.ok) throw Error();
        return x.json();
      })
      .then(setRegions)
      .catch((e) => {
        if (e.name !== "AbortError") setLoadError(true);
      });
    return () => ac.abort();
  }, [c.code]);
  const cities = useMemo(
    () =>
      regions?.cities
        .filter(
          (x) =>
            (!region || x.state === region) &&
            (!city || x.name.toLowerCase().includes(city.toLowerCase())),
        )
        .slice(0, 100) || [],
    [regions, region, city],
  );
  function addPlace(
    name = place,
    cityName = city,
    regionName = regions?.states.find((s) => s.code === region)?.name || region,
  ) {
    if (!name.trim()) return;
    const item: PlaceEntry = {
      id: newId(),
      name: name.trim().slice(0, 140),
      region: regionName,
      city: cityName,
      date: placeDate,
    };
    onChange({ places: [...r.places, item], status: "visited" });
    setPlace("");
  }
  return (
    <Modal title="Destination passport" onClose={onClose} wide>
      <div className="country-hero">
        {g?.image && (
          <img
            src={g.image}
            alt={
              c.code === "JP"
                ? "Mount Fuji above Lake Kawaguchi"
                : c.code === "NO"
                  ? "Geirangerfjord in Norway"
                  : "Rice terraces in Bali"
            }
          />
        )}
        <div>
          <span className="eyebrow">
            {c.continent} / {c.subregion || "Explore"}
          </span>
          <h2>
            <span>{c.flag}</span> {c.name}
          </h2>
          <p>{g?.tag || c.official}</p>
        </div>
      </div>
      <div className="country-actions">
        <button
          disabled={readOnly}
          className={r.status === "visited" ? "btn primary" : "btn"}
          onClick={() =>
            onChange({ status: r.status === "visited" ? undefined : "visited" })
          }
        >
          <Check size={17} />
          {r.status === "visited" ? "Visited" : "Mark visited"}
        </button>
        <button
          disabled={readOnly}
          className={r.status === "wishlist" ? "btn purple" : "btn"}
          onClick={() =>
            onChange({
              status: r.status === "wishlist" ? undefined : "wishlist",
            })
          }
        >
          <Bookmark size={17} />
          {r.status === "wishlist" ? "Wishlisted" : "Wishlist"}
        </button>
        <button
          disabled={readOnly}
          className={`icon-btn ${r.favorite ? "favorited" : ""}`}
          onClick={() => onChange({ favorite: !r.favorite })}
          aria-label={r.favorite ? "Remove favorite" : "Add favorite"}
          aria-pressed={r.favorite}
        >
          <Heart size={19} fill={r.favorite ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="subtabs">
        <button
          className={tab === "overview" ? "active" : ""}
          onClick={() => setTab("overview")}
        >
          Overview
        </button>
        <button
          className={tab === "places" ? "active" : ""}
          onClick={() => setTab("places")}
        >
          Cities & places <span>{r.places.length}</span>
        </button>
        <button
          className={tab === "memories" ? "active" : ""}
          onClick={() => setTab("memories")}
        >
          My memories
        </button>
      </div>
      {tab === "overview" && (
        <div className="stack">
          <p className="lead-copy">
            {g?.intro ||
              `Discover ${c.name}, explore its regions and cities, and keep the places you love in your passport.`}
          </p>
          <div className="facts">
            <div>
              <span>Capital</span>
              <strong>{c.capital}</strong>
            </div>
            <div>
              <span>Currency</span>
              <strong>{c.currencies.join(", ") || "Not listed"}</strong>
            </div>
            <div>
              <span>Languages</span>
              <strong>{c.languages.join(", ") || "Not listed"}</strong>
            </div>
            <div>
              <span>Region</span>
              <strong>{c.subregion || c.continent}</strong>
            </div>
          </div>
          <div className="note">
            <Globe2 size={18} />
            <p>
              {c.counted
                ? "Included in the 195-country passport."
                : "Tracked as a destination, outside the 195-country score."}{" "}
              Boundaries are illustrative. Confirm entry requirements with the
              destination’s official authorities before booking.
            </p>
          </div>
          <div className="row wrap">
            <button
              className="btn primary"
              disabled={readOnly}
              onClick={() => onPlan(c.code)}
            >
              Plan a trip here
            </button>
            <a
              className="btn"
              href={`https://www.openstreetmap.org/#map=5/${c.lat}/${c.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              Open local map <ExternalLink size={15} />
            </a>
            <a
              className="text-link"
              href={`https://en.wikivoyage.org/wiki/${encodeURIComponent(c.name.replaceAll(" ", "_"))}`}
              target="_blank"
              rel="noreferrer"
            >
              Travel guide <ExternalLink size={14} />
            </a>
          </div>
          {g?.cities && (
            <div>
              <h3>Start exploring</h3>
              <div className="city-pills">
                {g.cities.map((x) => (
                  <button
                    key={x.name}
                    onClick={() => {
                      setCity(x.name);
                      setTab("places");
                    }}
                  >
                    <MapPin size={14} />
                    {x.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {tab === "places" && (
        <div className="stack">
          <div>
            <h3>From country to your favourite corner</h3>
            <p className="muted">
              Find a region and city, then save the places you visited.
            </p>
          </div>
          <div className="form-grid">
            <label>
              State / province
              <select
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  setCity("");
                }}
              >
                <option value="">All regions</option>
                {regions?.states.map((s) => (
                  <option value={s.code} key={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              City
              <input
                list={`cities-${c.code}`}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Type a city name"
                maxLength={100}
              />
              <datalist id={`cities-${c.code}`}>
                {cities.map((x, i) => (
                  <option key={`${x.state}-${i}`} value={x.name} />
                ))}
              </datalist>
            </label>
          </div>
          {loadError && (
            <p className="muted">
              Directory unavailable. You can still type your city and place.
            </p>
          )}
          {g && (
            <div className="suggested-places">
              {g.cities
                .filter(
                  (x) =>
                    !city || x.name.toLowerCase().includes(city.toLowerCase()),
                )
                .map((x) => (
                  <div key={x.name}>
                    <span className="eyebrow">{x.name}</span>
                    <div className="city-pills">
                      {x.places.map((p) => (
                        <button
                          disabled={
                            readOnly || r.places.some((i) => i.name === p)
                          }
                          key={p}
                          onClick={() => addPlace(p, x.name, x.region)}
                        >
                          {r.places.some((i) => i.name === p) ? (
                            <Check size={14} />
                          ) : (
                            <Plus size={14} />
                          )}{" "}
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
          {!readOnly && (
            <form
              className="form-grid place-form"
              onSubmit={(e) => {
                e.preventDefault();
                addPlace();
              }}
            >
              <label>
                Place / attraction
                <input
                  required
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  maxLength={140}
                  placeholder="A landmark, café, or favourite spot"
                />
              </label>
              <label>
                Date visited
                <input
                  type="date"
                  value={placeDate}
                  onChange={(e) => setPlaceDate(e.target.value)}
                />
              </label>
              <button className="btn primary" type="submit">
                <Plus size={16} />
                Save visited place
              </button>
            </form>
          )}
          <div className="place-list">
            {r.places.length === 0 ? (
              <p className="empty-inline">
                Your favourite places will live here.
              </p>
            ) : (
              r.places.map((p) => (
                <div className="place-item" key={p.id}>
                  <MapPin size={18} />
                  <div>
                    <strong>{p.name}</strong>
                    <span>
                      {[p.city, p.region, p.date].filter(Boolean).join(" · ") ||
                        c.name}
                    </span>
                  </div>
                  {!readOnly && (
                    <button
                      className="icon-btn"
                      aria-label={`Remove ${p.name}`}
                      onClick={() =>
                        onChange({
                          places: r.places.filter((x) => x.id !== p.id),
                        })
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {tab === "memories" && (
        <div className="stack">
          <label>
            <span className="row">
              <CalendarDays size={17} />
              First visit
            </span>
            <input
              disabled={readOnly}
              type="date"
              value={r.date}
              onChange={(e) =>
                onChange({
                  date: e.target.value,
                  status: e.target.value ? "visited" : r.status,
                })
              }
            />
          </label>
          <label>
            Notes
            <textarea
              disabled={readOnly}
              value={r.notes}
              maxLength={3000}
              rows={7}
              onChange={(e) => onChange({ notes: e.target.value })}
              placeholder="The tiny café. The unexpected detour. The moment you want to remember."
            />
          </label>
          <p className="muted small">
            Notes, visit dates and saved places stay out of shared passport
            links.
          </p>
        </div>
      )}
    </Modal>
  );
}
