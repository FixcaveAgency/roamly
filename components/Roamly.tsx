"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Globe2,
  Compass,
  MapPin,
  Bookmark,
  Plane,
  Search,
  Share2,
  Settings,
  ChevronRight,
  Check,
  Heart,
  Trophy,
  Map,
  CalendarDays,
  Download,
  Upload,
  Cloud,
  Menu,
  X,
  ArrowUpRight,
  Plus,
  Sun,
  Moon,
  SlidersHorizontal,
  Flag,
  CheckCheck,
  Info,
  Copy,
  Camera,
  Trash2,
  Mail,
  LoaderCircle,
} from "lucide-react";
import {
  countries,
  countryByCode,
  initialData,
  blankRecord,
  cleanData,
  stats,
  CONTINENTS,
  explorerRank,
  decodeShare,
} from "@/lib/core";
import { guides, featureCodes } from "@/lib/guides";
import {
  downloadBlob,
  exportPassport,
  shareLink,
  passportCanvas,
} from "@/lib/export";
import type { Country, CountryRecord, TravelData, Trip } from "@/lib/types";
import WorldMap from "./WorldMap";
import Modal from "./Modal";
import CountryDialog from "./CountryDialog";
import Planner from "./Planner";
import CloudPanel from "./CloudPanel";
type View = "explore" | "passport" | "wishlist" | "discover" | "planner";
const STORAGE = "roamly.passport.v1";
const navItems = [
  { id: "explore", name: "My world", icon: Globe2 },
  { id: "passport", name: "My passport", icon: Map },
  { id: "wishlist", name: "Wishlist", icon: Bookmark },
  { id: "planner", name: "Trip planner", icon: Plane },
  { id: "discover", name: "Discover", icon: Compass },
] as const;
const viewTitles: Record<View, [string, string]> = {
  explore: [
    "Your world, one place at a time.",
    "Every country is a new chapter. Make this map yours.",
  ],
  passport: [
    "A passport full of stories.",
    "The places you have been. The moments you keep.",
  ],
  wishlist: [
    "Someday starts here.",
    "A little collection of places calling your name.",
  ],
  planner: [
    "Less planning. More possibility.",
    "Turn your next idea into a journey worth taking.",
  ],
  discover: [
    "There is a whole world out there.",
    "Follow your curiosity. Find somewhere new.",
  ],
};
export default function Roamly({ publicData }: { publicData?: TravelData }) {
  const [data, setData] = useState<TravelData>(publicData || initialData),
    [ready, setReady] = useState(false),
    [shared, setShared] = useState(!!publicData),
    [view, setView] = useState<View>("explore"),
    [selected, setSelected] = useState(""),
    [query, setQuery] = useState(""),
    [continent, setContinent] = useState("All continents"),
    [filter, setFilter] = useState("all"),
    [modal, setModal] = useState<
      "settings" | "share" | "profile" | "cloud" | "about" | null
    >(null),
    [mobileNav, setMobileNav] = useState(false),
    [toast, setToast] = useState(""),
    [planCode, setPlanCode] = useState(""),
    [exporting, setExporting] = useState(""),
    [sharePreview, setSharePreview] = useState(""),
    [shareURL, setShareURL] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    backupInput = useRef<HTMLInputElement>(null),
    searchRef = useRef<HTMLInputElement>(null),
    saveError = useRef(false);
  const notify = useCallback((message: string) => {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 4500);
  }, []);
  useEffect(() => {
    if (publicData) {
      setReady(true);
      return;
    }
    let local = initialData();
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) local = cleanData(JSON.parse(raw));
    } catch {
      notify(
        "Your saved passport could not be read. Restore a backup in Settings.",
      );
    }
    if (location.hash.startsWith("#passport=")) {
      try {
        setData(decodeShare(location.hash.slice(10)));
        setShared(true);
      } catch {
        setData(local);
        notify(
          "This shared passport link is invalid. Your own passport is unchanged.",
        );
      }
    } else setData(local);
    setReady(true);
  }, [notify, publicData]);
  useEffect(() => {
    document.documentElement.dataset.theme = data.theme;
    if (!ready || shared) return;
    try {
      localStorage.setItem(STORAGE, JSON.stringify(data));
      saveError.current = false;
    } catch {
      if (!saveError.current) {
        saveError.current = true;
        notify(
          "Device storage is full or unavailable. Download a backup from Settings to keep your changes.",
        );
      }
    }
  }, [data, ready, shared, notify]);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setView("explore");
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);
  const update = useCallback(
    (fn: (d: TravelData) => TravelData) => {
      if (shared) return;
      setData((d) => ({ ...fn(d), updatedAt: new Date().toISOString() }));
    },
    [shared],
  );
  const updateRecord = useCallback(
    (code: string, patch: Partial<CountryRecord>) => {
      update((d) => ({
        ...d,
        records: {
          ...d.records,
          [code]: { ...(d.records[code] || blankRecord()), ...patch },
        },
      }));
    },
    [update],
  );
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (t: unknown, opts: { signal: AbortSignal }) => void;
        };
      }
    ).modelContext;
    if (!context?.registerTool || !ready) return;
    const ac = new AbortController();
    try {
      context.registerTool(
        {
          name: "read_travel_passport",
          description:
            "Read the current visited country codes and wishlist country codes.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true },
          execute: () => ({
            visited: Object.entries(data.records)
              .filter(([, r]) => r.status === "visited")
              .map(([c]) => c),
            wishlist: Object.entries(data.records)
              .filter(([, r]) => r.status === "wishlist")
              .map(([c]) => c),
          }),
        },
        { signal: ac.signal },
      );
      context.registerTool(
        {
          name: "open_destination",
          description:
            "Open a country details panel by ISO alpha-2 code. Does not change travel records.",
          inputSchema: {
            type: "object",
            properties: { code: { type: "string" } },
            required: ["code"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true },
          execute: (input: unknown) => {
            const code = (input as { code?: unknown })?.code;
            if (typeof code !== "string" || !countryByCode[code])
              throw Error("Use a valid uppercase ISO alpha-2 country code.");
            setSelected(code);
            return { opened: code };
          },
        },
        { signal: ac.signal },
      );
    } catch {}
    return () => ac.abort();
  }, [data.records, ready]);
  const s = useMemo(() => stats(data), [data]);
  const results = useMemo(
    () =>
      countries.filter(
        (c) =>
          (!query || c.search.includes(query.toLowerCase().trim())) &&
          (continent === "All continents" || c.continent === continent),
      ),
    [query, continent],
  );
  const rank = explorerRank(s.count),
    initials =
      data.profile.name === "Your passport"
        ? "YOU"
        : data.profile.name
            .split(/\s+/)
            .map((x) => x[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
  function navigate(v: View) {
    setView(v);
    setQuery("");
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function onPlan(code: string) {
    setPlanCode(code);
    setSelected("");
    navigate("planner");
  }
  function mine() {
    if (publicData) {
      location.href = "/";
      return;
    }
    history.replaceState(null, "", location.pathname);
    setShared(false);
    try {
      setData(cleanData(JSON.parse(localStorage.getItem(STORAGE) || "null")));
    } catch {
      setData(initialData());
    }
  }
  async function exportCard(format: "png" | "jpg" | "pdf") {
    setExporting(format);
    try {
      await exportPassport(data, format);
      notify(`Your ${format.toUpperCase()} passport is ready.`);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Export failed. Try again.");
    } finally {
      setExporting("");
    }
  }
  async function openShare() {
    setModal("share");
    setShareURL(shareLink(data));
    setSharePreview("");
    try {
      const canvas = await passportCanvas(data);
      setSharePreview(canvas.toDataURL("image/jpeg", 0.8));
    } catch {
      notify("Preview could not load. Please try exporting again.");
    }
  }
  function backup() {
    downloadBlob(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      "roamly-backup.json",
    );
    notify("Backup downloaded.");
  }
  async function importBackup(file?: File) {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      notify("Please use a backup smaller than 4 MB.");
      return;
    }
    try {
      const restored = cleanData(JSON.parse(await file.text()));
      if (
        confirm(
          "Restore this backup? It will replace your current passport on this device.",
        )
      ) {
        setData(restored);
        notify("Passport restored.");
      }
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not read this backup.");
    }
    if (backupInput.current) backupInput.current.value = "";
  }
  function loadDemo() {
    if (
      Object.keys(data.records).length &&
      !confirm(
        "Replace your current passport with sample data? Download a backup first to keep it.",
      )
    )
      return;
    const sample = initialData();
    sample.profile = {
      ...sample.profile,
      name: "Alex Morgan",
      bio: "Collecting moments, not things.",
    };
    [
      "US",
      "CA",
      "MX",
      "BR",
      "GB",
      "FR",
      "IT",
      "ES",
      "NO",
      "JP",
      "TH",
      "SG",
    ].forEach(
      (c, i) =>
        (sample.records[c] = {
          ...blankRecord(),
          status: "visited",
          date: `202${3 + (i % 3)}-${String((i % 12) + 1).padStart(2, "0")}-12`,
        }),
    );
    ["ID", "CN", "AU", "CH", "GR"].forEach(
      (c) => (sample.records[c] = { ...blankRecord(), status: "wishlist" }),
    );
    sample.records.JP.favorite = true;
    setData(sample);
    setModal(null);
    notify("Sample passport loaded. Clear it in Settings to start your own.");
  }
  function CountryGrid({ list }: { list: Country[] }) {
    return (
      <div className="country-grid">
        {list.map((c) => (
          <button
            key={c.code}
            className="country-tile"
            onClick={() => setSelected(c.code)}
          >
            <span className="country-flag">{c.flag}</span>
            <span>
              <strong>{c.name}</strong>
              <small>{c.continent}</small>
            </span>
            {data.records[c.code]?.status === "visited" ? (
              <Check size={16} className="accent" />
            ) : data.records[c.code]?.status === "wishlist" ? (
              <Bookmark size={16} className="lavender" />
            ) : (
              <Plus size={16} />
            )}
          </button>
        ))}
      </div>
    );
  }
  function DiscoveryCards() {
    return (
      <div className="discovery-grid">
        {featureCodes.map((code) => {
          const c = countryByCode[code],
            g = guides[code];
          return (
            <button
              key={code}
              className={`destination-card destination-${code}`}
              onClick={() => setSelected(code)}
            >
              <img
                src={g.image}
                alt={
                  code === "JP"
                    ? "Mount Fuji from Lake Kawaguchi"
                    : code === "NO"
                      ? "Geirangerfjord, Norway"
                      : "Rice terraces in Bali, Indonesia"
                }
              />
              <span className="destination-gradient" />
              <span className="destination-label">
                <small>{g.tag}</small>
                <strong>{c.name}</strong>
              </span>
              <span className="destination-open">
                <ArrowUpRight size={18} />
              </span>
            </button>
          );
        })}
      </div>
    );
  }
  function ContinentProgress() {
    return (
      <div className="continent-progress">
        {CONTINENTS.map((name, i) => {
          const n = s.visited.filter(
              (c) => c.counted && c.continent === name,
            ).length,
            total = countries.filter(
              (c) => c.counted && c.continent === name,
            ).length,
            ant = s.visited.some((c) => c.code === "AQ");
          return (
            <div key={name}>
              <div className="row spread">
                <span>
                  <span className={`continent-dot dot-${i}`} />
                  {name}
                </span>
                <span>
                  {name === "Antarctica"
                    ? ant
                      ? "Visited"
                      : "Not yet"
                    : `${n} / ${total}`}
                </span>
              </div>
              <div className="progress-track">
                <i
                  style={{
                    width: `${name === "Antarctica" ? (ant ? 100 : 0) : total ? (n / total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            if (!publicData) {
              e.preventDefault();
              navigate("explore");
            }
          }}
        >
          <span className="brand-icon">
            <Globe2 size={25} />
          </span>
          roamly<span className="brand-period">.</span>
        </a>
        <button
          className="mobile-nav-close icon-btn"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        >
          <X />
        </button>
        <span className="nav-caption">YOUR NEXT CHAPTER</span>
        <nav aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "active" : ""}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
              {item.id === "wishlist" && s.wishlist.length > 0 ? (
                <small>{s.wishlist.length}</small>
              ) : item.id === "explore" ? (
                <span className="nav-active-dot" />
              ) : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="passport-mini">
            <div className="row">
              <span className="small-globe">
                <Globe2 size={21} />
              </span>
              <span>Your story so far</span>
            </div>
            <strong>
              {s.percent}
              <span>%</span>
            </strong>
            <div className="progress-track">
              <i style={{ width: `${s.percent}%` }} />
            </div>
            <p>
              {s.count === 0
                ? "One place. Endless possibilities."
                : `${s.count} ${s.count === 1 ? "country" : "countries"}. Countless memories.`}
            </p>
          </div>
          <button
            className="sidebar-settings"
            disabled={shared}
            onClick={() => setModal("settings")}
          >
            <Settings size={18} />
            Settings & backup
          </button>
          <button
            className="profile-nav"
            onClick={() => setModal(shared ? "share" : "profile")}
          >
            <span className="avatar">
              {data.profile.avatar ? (
                <img src={data.profile.avatar} alt="" />
              ) : (
                initials
              )}
            </span>
            <span>
              <strong>{data.profile.name}</strong>
              <small>{rank}</small>
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
        <a
          className="fixcave-credit"
          href="https://fixcave.com"
          target="_blank"
          rel="noreferrer"
        >
          Design & Developed by Fixcave Digital
        </a>
      </aside>
      {mobileNav && (
        <button
          className="nav-scrim"
          onClick={() => setMobileNav(false)}
          aria-label="Close navigation"
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="row">
            <button
              className="mobile-menu icon-btn"
              aria-label="Open navigation"
              onClick={() => setMobileNav(true)}
            >
              <Menu size={22} />
            </button>
            <span className="breadcrumb">
              <span>My workspace</span>
              <ChevronRight size={13} />
              {navItems.find((x) => x.id === view)?.name}
            </span>
          </div>
          <div className="row top-actions">
            <span className="save-state">
              <CheckCheck size={14} />
              {shared
                ? "Shared passport"
                : ready
                  ? "Saved on this device"
                  : "Opening passport"}
            </span>
            <button
              className="icon-btn"
              aria-label="Cloud account"
              onClick={() => setModal("cloud")}
              disabled={shared}
            >
              <Cloud size={19} />
            </button>
            <button className="btn small-btn" onClick={() => void openShare()}>
              <Share2 size={15} />
              <span>Share passport</span>
            </button>
          </div>
        </header>
        <main>
          {shared && (
            <div className="shared-banner">
              <span>
                You are exploring {data.profile.name}’s shared passport.
              </span>
              <button onClick={mine}>Create my passport</button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {view === "explore"
                  ? "THE WORLD IS YOURS"
                  : view === "passport"
                    ? "THE JOURNEY SO FAR"
                    : view === "wishlist"
                      ? "KEEP DREAMING"
                      : view === "planner"
                        ? "YOUR NEXT ADVENTURE"
                        : "GO A LITTLE FURTHER"}
              </div>
              <h1>{viewTitles[view][0]}</h1>
              <p>{viewTitles[view][1]}</p>
            </div>
            {view === "explore" && (
              <button className="btn" onClick={() => navigate("discover")}>
                <Plus size={16} />
                Add a destination
              </button>
            )}
          </div>
          {view === "explore" && (
            <>
              <div className="stats-row">
                <div>
                  <span className="stat-icon">
                    <Flag size={19} />
                  </span>
                  <div>
                    <span>Countries visited</span>
                    <strong>
                      {String(s.count).padStart(2, "0")}
                      <small>/ {s.denominator}</small>
                    </strong>
                  </div>
                </div>
                <div>
                  <span className="stat-icon">
                    <Globe2 size={20} />
                  </span>
                  <div>
                    <span>Continents explored</span>
                    <strong>
                      {String(s.continents).padStart(2, "0")}
                      <small>/ 7</small>
                    </strong>
                  </div>
                </div>
                <div>
                  <span className="stat-icon">
                    <Bookmark size={19} />
                  </span>
                  <div>
                    <span>On the wishlist</span>
                    <strong>
                      {String(s.wishlist.length).padStart(2, "0")}
                      <small>destinations</small>
                    </strong>
                  </div>
                </div>
                <div>
                  <span className="stat-icon">
                    <Trophy size={20} />
                  </span>
                  <div>
                    <span>Explorer level</span>
                    <strong className="rank-stat">{rank}</strong>
                  </div>
                </div>
              </div>
              <div className="explore-layout">
                <section className="panel map-panel">
                  <div className="map-toolbar">
                    <div className="search-wrap">
                      <Search size={17} />
                      <input
                        ref={searchRef}
                        aria-label="Search countries"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Find a country…"
                      />
                      <kbd>⌘ K</kbd>
                      {query && (
                        <button
                          className="icon-btn"
                          aria-label="Clear search"
                          onClick={() => setQuery("")}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <div className="filter-pills">
                      {[
                        ["all", "All"],
                        ["visited", "Visited"],
                        ["wishlist", "Wishlist"],
                      ].map(([id, label]) => (
                        <button
                          key={id}
                          className={filter === id ? "active" : ""}
                          onClick={() => setFilter(id)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {query && (
                    <div className="search-results">
                      {results.length ? (
                        results.slice(0, 9).map((c) => (
                          <button
                            key={c.code}
                            onClick={() => {
                              setSelected(c.code);
                              setQuery("");
                            }}
                          >
                            <span>{c.flag}</span>
                            <strong>{c.name}</strong>
                            <small>{c.continent}</small>
                            <ChevronRight size={15} />
                          </button>
                        ))
                      ) : (
                        <p>No country found. Try another spelling.</p>
                      )}
                    </div>
                  )}
                  <WorldMap
                    data={data}
                    onSelect={setSelected}
                    selected={selected}
                    filter={filter}
                  />
                  <div className="map-footer">
                    <div className="map-legend">
                      <span>
                        <i className="visited" />
                        Visited
                      </span>
                      <span>
                        <i className="wishlist" />
                        Wishlist
                      </span>
                      <span>
                        <i />
                        Yet to explore
                      </span>
                    </div>
                    <button
                      className="text-btn"
                      onClick={() => setModal("about")}
                    >
                      <Info size={13} />
                      Map info
                    </button>
                  </div>
                </section>
                <aside className="panel explorer-card">
                  <span className="eyebrow">YOUR TRAVEL FOOTPRINT</span>
                  <div
                    className="progress-orbit"
                    style={
                      {
                        "--progress": `${Number(s.percent) * 3.6}deg`,
                      } as React.CSSProperties
                    }
                  >
                    <Globe2 size={100} strokeWidth={0.45} />
                    <div>
                      <strong>
                        {s.percent}
                        <span>%</span>
                      </strong>
                      <small>of the world</small>
                    </div>
                  </div>
                  <div className="footprint-message">
                    <strong>
                      {s.count === 0
                        ? "A whole world of firsts."
                        : "Look how far you’ve come."}
                    </strong>
                    <p>
                      {s.count === 0
                        ? "Add the countries you have visited. Your adventure starts taking shape."
                        : `${s.denominator - s.count} more countries. A million more stories.`}
                    </p>
                  </div>
                  <div className="continent-divider" />
                  <ContinentProgress />
                </aside>
              </div>
              <section className="discovery-section">
                <div className="section-head">
                  <div>
                    <h2>A little inspiration for your next chapter</h2>
                    <p>Some places stay with you long after you leave.</p>
                  </div>
                  <button
                    className="text-link"
                    onClick={() => navigate("discover")}
                  >
                    Explore destinations <ChevronRight size={16} />
                  </button>
                </div>
                <DiscoveryCards />
              </section>
            </>
          )}
          {view === "discover" && (
            <>
              <DiscoveryCards />
              <div className="section-head destinations-heading">
                <div>
                  <h2>Find your next favourite place</h2>
                  <p>195 countries, plus territories and other destinations.</p>
                </div>
              </div>
              <div className="browse-controls">
                <div className="search-wrap">
                  <Search size={18} />
                  <input
                    aria-label="Search destinations"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Country, capital or local name…"
                  />
                </div>
                <select
                  value={continent}
                  onChange={(e) => setContinent(e.target.value)}
                  aria-label="Filter by continent"
                >
                  <option>All continents</option>
                  {CONTINENTS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <span className="muted small">
                  {results.length} destinations
                </span>
              </div>
              <CountryGrid list={results} />
              {results.length === 0 && (
                <div className="empty-state">
                  <Search />
                  <h3>No destinations found</h3>
                  <p>Try another search or continent.</p>
                </div>
              )}
            </>
          )}
          {view === "wishlist" && (
            <>
              <div className="section-head">
                <div className="subtabs compact-tabs">
                  <button
                    className={filter !== "favorite" ? "active" : ""}
                    onClick={() => setFilter("all")}
                  >
                    Want to visit <span>{s.wishlist.length}</span>
                  </button>
                  <button
                    className={filter === "favorite" ? "active" : ""}
                    onClick={() => setFilter("favorite")}
                  >
                    Favourites <span>{s.favorites.length}</span>
                  </button>
                </div>
                <button className="btn" onClick={() => navigate("discover")}>
                  <Plus size={16} />
                  Find a destination
                </button>
              </div>
              {(filter === "favorite" ? s.favorites : s.wishlist).length ? (
                <CountryGrid
                  list={filter === "favorite" ? s.favorites : s.wishlist}
                />
              ) : (
                <div className="empty-state panel">
                  <Bookmark size={35} />
                  <h2>
                    {filter === "favorite"
                      ? "Keep your favourites close."
                      : "Where do you dream of going?"}
                  </h2>
                  <p>
                    Open a country and{" "}
                    {filter === "favorite"
                      ? "tap the heart to save your favourite places."
                      : "add it to your wishlist. A great journey starts with an idea."}
                  </p>
                  <button
                    className="btn primary"
                    onClick={() => navigate("discover")}
                  >
                    Find some inspiration
                  </button>
                </div>
              )}
              <div className="wishlist-inspiration">
                <DiscoveryCards />
              </div>
            </>
          )}
          {view === "passport" && (
            <div className="passport-layout">
              <section className="panel passport-feature">
                <div className="row spread">
                  <span className="eyebrow">PERSONAL TRAVEL PASSPORT</span>
                  <Globe2 size={27} />
                </div>
                <div className="passport-identity">
                  <span className="avatar large">
                    {data.profile.avatar ? (
                      <img src={data.profile.avatar} alt="Profile" />
                    ) : (
                      initials
                    )}
                  </span>
                  <h2>{data.profile.name}</h2>
                  <p>{data.profile.bio}</p>
                  {data.profile.home && (
                    <span className="home-country">
                      {countryByCode[data.profile.home]?.flag} Based in{" "}
                      {countryByCode[data.profile.home]?.name}
                    </span>
                  )}
                </div>
                <WorldMap data={data} onSelect={setSelected} compact />
                <div className="passport-numbers">
                  <div>
                    <strong>{s.count}</strong>
                    <span>Countries</span>
                  </div>
                  <div>
                    <strong>{s.continents}</strong>
                    <span>Continents</span>
                  </div>
                  <div>
                    <strong>{s.cities}</strong>
                    <span>Cities</span>
                  </div>
                  <div>
                    <strong>{s.places}</strong>
                    <span>Places</span>
                  </div>
                </div>
                <div className="row spread passport-bottom">
                  <span className="rank-badge">
                    <Trophy size={15} />
                    {rank}
                  </span>
                  <button
                    className="btn primary"
                    onClick={() => void openShare()}
                  >
                    <Share2 size={15} />
                    Share my story
                  </button>
                </div>
              </section>
              <section className="panel milestones">
                <h3>Milestones worth remembering</h3>
                {[
                  [1, "First footsteps", "The beginning of something good."],
                  [5, "Explorer", "Five countries. A bigger perspective."],
                  [20, "Adventurer", "The world feels a little more familiar."],
                  [50, "Globetrotter", "Fifty countries, countless stories."],
                  [100, "World citizen", "One hundred chapters in your story."],
                ].map(([n, title, description]) => (
                  <div
                    className={`milestone ${s.count >= Number(n) ? "unlocked" : ""}`}
                    key={n}
                  >
                    <span>
                      <Trophy size={22} />
                    </span>
                    <div>
                      <strong>{title}</strong>
                      <p>{description}</p>
                      <small>
                        {s.count >= Number(n)
                          ? "ACHIEVED"
                          : `${Math.min(s.count, Number(n))} / ${n} COUNTRIES`}
                      </small>
                    </div>
                    {s.count >= Number(n) && <Check size={17} />}
                  </div>
                ))}
              </section>
              <section className="panel timeline-panel">
                <div className="section-head">
                  <h3>The places in your story</h3>
                  <span className="muted small">
                    {s.visited.length} destinations
                  </span>
                </div>
                {s.visited.length ? (
                  <div className="timeline">
                    {[...s.visited]
                      .sort((a, b) =>
                        (data.records[b.code]?.date || "").localeCompare(
                          data.records[a.code]?.date || "",
                        ),
                      )
                      .map((c) => (
                        <button
                          key={c.code}
                          onClick={() => setSelected(c.code)}
                        >
                          <span className="country-flag">{c.flag}</span>
                          <div>
                            <strong>{c.name}</strong>
                            <span>
                              {data.records[c.code]?.date ||
                                "Visit date not added"}
                              {data.records[c.code]?.places.length
                                ? ` · ${data.records[c.code].places.length} saved places`
                                : ""}
                            </span>
                          </div>
                          <ChevronRight size={17} />
                        </button>
                      ))}
                  </div>
                ) : (
                  <div className="empty-inline">
                    <MapPin size={30} />
                    <p>Your first destination is the start of your story.</p>
                    <button
                      className="text-link"
                      onClick={() => navigate("discover")}
                    >
                      Add a country
                    </button>
                  </div>
                )}
              </section>
            </div>
          )}
          {view === "planner" && (
            <Planner
              key={planCode || "default"}
              initialCode={planCode}
              onConsumed={() => {}}
              trips={data.trips}
              onSave={(t) =>
                update((d) => ({
                  ...d,
                  trips: [t, ...d.trips.filter((x) => x.id !== t.id)],
                }))
              }
              onDelete={(id) =>
                update((d) => ({
                  ...d,
                  trips: d.trips.filter((x) => x.id !== id),
                }))
              }
              notify={notify}
              readOnly={shared}
            />
          )}
          <footer className="page-footer">
            <span>Go places. Keep memories.</span>
            <div>
              <button onClick={() => setModal("about")}>About & credits</button>
              <span>Made for the curious.</span>
            </div>
          </footer>
        </main>
      </div>
      {selected && countryByCode[selected] && (
        <CountryDialog
          key={selected}
          country={countryByCode[selected]}
          record={data.records[selected] || blankRecord()}
          onChange={(p) => updateRecord(selected, p)}
          onClose={() => setSelected("")}
          onPlan={onPlan}
          readOnly={shared}
        />
      )}
      {modal === "cloud" && (
        <CloudPanel
          data={data}
          onLoad={setData}
          notify={notify}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "profile" && (
        <Modal
          notice={toast}
          title="Make this passport yours"
          onClose={() => setModal(null)}
        >
          <div className="stack">
            <div className="row avatar-edit">
              <span className="avatar large">
                {data.profile.avatar ? (
                  <img src={data.profile.avatar} alt="Profile" />
                ) : (
                  initials
                )}
              </span>
              <label className="btn">
                <Camera size={16} />
                Change photo
                <input
                  type="file"
                  hidden
                  accept="image/png,image/jpeg,image/webp"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 8 * 1024 * 1024) {
                      notify("Choose an image smaller than 8 MB.");
                      return;
                    }
                    const img = new Image(),
                      url = URL.createObjectURL(file);
                    img.onload = () => {
                      const canvas = document.createElement("canvas");
                      canvas.width = 192;
                      canvas.height = 192;
                      const ctx = canvas.getContext("2d");
                      if (ctx) {
                        const size = Math.min(img.width, img.height);
                        ctx.drawImage(
                          img,
                          (img.width - size) / 2,
                          (img.height - size) / 2,
                          size,
                          size,
                          0,
                          0,
                          192,
                          192,
                        );
                        update((d) => ({
                          ...d,
                          profile: {
                            ...d.profile,
                            avatar: canvas.toDataURL("image/jpeg", 0.8),
                          },
                        }));
                      }
                      URL.revokeObjectURL(url);
                    };
                    img.onerror = () => {
                      URL.revokeObjectURL(url);
                      notify("This image could not be opened.");
                    };
                    img.src = url;
                  }}
                />
              </label>
              {data.profile.avatar && (
                <button
                  className="icon-btn"
                  aria-label="Remove profile photo"
                  onClick={() =>
                    update((d) => ({
                      ...d,
                      profile: { ...d.profile, avatar: "" },
                    }))
                  }
                >
                  <Trash2 size={17} />
                </button>
              )}
            </div>
            <label>
              Your name
              <input
                value={data.profile.name}
                maxLength={50}
                onChange={(e) =>
                  update((d) => ({
                    ...d,
                    profile: { ...d.profile, name: e.target.value },
                  }))
                }
              />
            </label>
            <label>
              A little about your journey
              <textarea
                value={data.profile.bio}
                maxLength={140}
                rows={2}
                onChange={(e) =>
                  update((d) => ({
                    ...d,
                    profile: { ...d.profile, bio: e.target.value },
                  }))
                }
              />
            </label>
            <label>
              Home country
              <select
                value={data.profile.home}
                onChange={(e) =>
                  update((d) => ({
                    ...d,
                    profile: { ...d.profile, home: e.target.value },
                  }))
                }
              >
                <option value="">Prefer not to say</option>
                {countries.map((c) => (
                  <option value={c.code} key={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="btn primary"
              onClick={() => {
                setModal(null);
                notify("Passport profile saved.");
              }}
            >
              Save profile
            </button>
          </div>
        </Modal>
      )}
      {modal === "share" && (
        <Modal
          notice={toast}
          title="Your journey deserves to be shared"
          onClose={() => setModal(null)}
          wide
        >
          <div className="stack">
            {sharePreview ? (
              <img
                className="share-preview"
                src={sharePreview}
                alt="Preview of your downloadable travel passport"
              />
            ) : (
              <div className="share-preview-loading">
                <LoaderCircle className="spin" />
                Preparing your passport…
              </div>
            )}
            <div className="row wrap">
              <button
                disabled={!!exporting}
                className="btn primary"
                onClick={() => void exportCard("png")}
              >
                <Download size={16} />
                {exporting === "png" ? "Creating…" : "Download PNG"}
              </button>
              <button
                disabled={!!exporting}
                className="btn"
                onClick={() => void exportCard("jpg")}
              >
                JPG
              </button>
              <button
                disabled={!!exporting}
                className="btn"
                onClick={() => void exportCard("pdf")}
              >
                PDF
              </button>
            </div>
            <label>
              Shareable passport link
              <div className="copy-field">
                <input
                  readOnly
                  value={shareURL}
                  onFocus={(e) => e.target.select()}
                />
                <button
                  className="btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(shareURL);
                      notify("Passport link copied.");
                    } catch {
                      notify("Select the link and copy it to share.");
                    }
                  }}
                >
                  <Copy size={16} />
                  Copy
                </button>
              </div>
            </label>
            <p className="small muted">
              Anyone with this link can see this snapshot of your name, bio,
              visited countries and wishlist. Your photo, home country, notes,
              dates, places and trips are excluded. Create a new link after
              changes.
            </p>
          </div>
        </Modal>
      )}
      {modal === "settings" && (
        <Modal
          notice={toast}
          title="Make yourself at home"
          onClose={() => setModal(null)}
        >
          <div className="stack">
            <div>
              <h3>Choose your atmosphere</h3>
              <div className="theme-options">
                {(["atlas", "ocean", "paper"] as const).map((t) => (
                  <button
                    key={t}
                    className={data.theme === t ? "selected" : ""}
                    onClick={() => update((d) => ({ ...d, theme: t }))}
                  >
                    <i className={`theme-swatch ${t}`} />
                    <span>
                      {t === "atlas"
                        ? "Midnight"
                        : t === "ocean"
                          ? "Deep ocean"
                          : "Daylight"}
                    </span>
                    {data.theme === t && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>
            <hr />
            <h3>Keep a copy of your journey</h3>
            <p className="muted small">
              Guest passports live in this browser. Clearing browser data
              removes them. Download a backup before switching devices.
            </p>
            <div className="row wrap">
              <button className="btn" onClick={backup}>
                <Download size={16} />
                Download backup
              </button>
              <button
                className="btn"
                onClick={() => backupInput.current?.click()}
              >
                <Upload size={16} />
                Restore backup
              </button>
              <input
                ref={backupInput}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => void importBackup(e.target.files?.[0])}
              />
            </div>
            <button className="btn" onClick={() => setModal("cloud")}>
              <Cloud size={17} />
              Cloud account & public profile
            </button>
            <hr />
            <h3>Try it with a little inspiration</h3>
            <button className="btn" onClick={loadDemo}>
              Load sample passport
            </button>
            <p className="muted small">
              Sample data is fictional and replaces the current passport.
            </p>
            <button
              className="text-btn danger"
              onClick={() => {
                if (
                  confirm(
                    "Clear all travel records, trips and profile information on this device? This cannot be undone without a backup.",
                  )
                ) {
                  setData(initialData());
                  setModal(null);
                  notify("Passport cleared. A new journey begins.");
                }
              }}
            >
              <Trash2 size={15} />
              Clear my passport
            </button>
          </div>
        </Modal>
      )}
      {modal === "about" && (
        <Modal
          notice={toast}
          title="A world made for exploring"
          onClose={() => setModal(null)}
        >
          <div className="stack">
            <h3>Roamly, by Fixcave Digital</h3>
            <p className="muted">
              A personal space to remember where you have been and dream about
              where to go next.
            </p>
            <h3>How your score works</h3>
            <p className="muted">
              Countries visited ÷ 195. The score includes 193 UN member states,
              Palestine and Vatican City. Other destinations are tracked
              separately. Each destination belongs to one continent in the
              source dataset; Antarctica can be marked visited. Borders and
              place names are illustrative, not a political statement.
            </p>
            <h3>Your information</h3>
            <p className="muted">
              Guest data stays in your browser. Cloud backup is optional.
              Passport links include only your public travel summary. No
              analytics or advertising trackers are included.
            </p>
            <h3>Data & photo credits</h3>
            <ul className="credits">
              <li>
                <a
                  href="https://github.com/mledoze/countries"
                  target="_blank"
                  rel="noreferrer"
                >
                  Country metadata: mledoze/countries
                </a>{" "}
                · ODbL
              </li>
              <li>
                <a
                  href="https://github.com/topojson/world-atlas"
                  target="_blank"
                  rel="noreferrer"
                >
                  Map: World Atlas / Natural Earth
                </a>{" "}
                · ISC / public domain
              </li>
              <li>
                <a
                  href="https://github.com/harpreetkhalsagtbit/country-state-city"
                  target="_blank"
                  rel="noreferrer"
                >
                  Region and city directory
                </a>{" "}
                · GPL-3.0
              </li>
              <li>
                <a
                  href="https://commons.wikimedia.org/wiki/File:Mount_Fuji_from_Lake_Kawaguchi.jpg"
                  target="_blank"
                  rel="noreferrer"
                >
                  Mount Fuji: Subramaniam K V
                </a>{" "}
                ·{" "}
                <a href="https://creativecommons.org/licenses/by/3.0/">
                  CC BY 3.0
                </a>
              </li>
              <li>
                <a
                  href="https://commons.wikimedia.org/wiki/File:GeirangerFjord.jpg"
                  target="_blank"
                  rel="noreferrer"
                >
                  Geirangerfjord: Arancia
                </a>{" "}
                ·{" "}
                <a href="https://creativecommons.org/licenses/by-sa/3.0/">
                  CC BY-SA 3.0
                </a>
              </li>
              <li>
                <a
                  href="https://commons.wikimedia.org/wiki/File:Rice_terraces,_Bali.jpg"
                  target="_blank"
                  rel="noreferrer"
                >
                  Bali: © Vyacheslav Argenberg / vascoplanet.com
                </a>{" "}
                ·{" "}
                <a href="https://creativecommons.org/licenses/by/4.0/">
                  CC BY 4.0
                </a>
              </li>
            </ul>
            <p className="small muted">
              Photos are displayed with responsive cropping. Source data is a
              bundled snapshot; directory and attraction coverage varies. Verify
              travel requirements and time-sensitive information before booking.
            </p>
            <a
              className="btn"
              href="https://fixcave.com"
              target="_blank"
              rel="noreferrer"
            >
              Visit Fixcave Digital <ArrowUpRight size={15} />
            </a>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCheck size={17} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
