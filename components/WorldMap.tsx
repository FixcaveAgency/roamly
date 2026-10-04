"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  geoNaturalEarth1,
  geoOrthographic,
  geoPath,
  geoGraticule10,
  geoDistance,
} from "d3-geo";
import { feature } from "topojson-client";
import {
  Globe2,
  Map,
  Plus,
  Minus,
  RotateCcw,
  LocateFixed,
  LoaderCircle,
} from "lucide-react";
import { countries, countryByCode } from "@/lib/core";
import type { TravelData } from "@/lib/types";
import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";
export default function WorldMap({
  data,
  onSelect,
  selected,
  filter = "all",
  compact = false,
}: {
  data: TravelData;
  onSelect: (code: string) => void;
  selected?: string;
  filter?: string;
  compact?: boolean;
}) {
  const [world, setWorld] = useState<FeatureCollection<
      Geometry,
      GeoJsonProperties
    > | null>(null),
    [error, setError] = useState(false),
    [mode, setMode] = useState<"map" | "globe">("map"),
    [zoom, setZoom] = useState(1),
    [pan, setPan] = useState([0, 0]),
    [rotation, setRotation] = useState<[number, number]>([-15, -15]),
    [hover, setHover] = useState("");
  const drag = useRef<{
    x: number;
    y: number;
    pan: number[];
    rotation: [number, number];
    moved: boolean;
  } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    let active = true;
    fetch("/data/world.json")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((t) => {
        if (active)
          setWorld(
            feature(t, t.objects.countries) as unknown as FeatureCollection<
              Geometry,
              GeoJsonProperties
            >,
          );
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const projection = useMemo(
    () =>
      mode === "map"
        ? geoNaturalEarth1().scale(177).translate([500, 286])
        : geoOrthographic()
            .scale(244)
            .translate([500, 275])
            .rotate(rotation)
            .clipAngle(90),
    [mode, rotation],
  );
  const path = useMemo(() => geoPath(projection), [projection]);
  const numeric = useMemo(
    () => Object.fromEntries(countries.map((c) => [c.numeric, c.code])),
    [],
  );
  const codeFor = (f: {
    id?: string | number;
    properties?: GeoJsonProperties;
  }) =>
    numeric[String(f.id).padStart(3, "0")] ||
    (f.properties?.name === "Kosovo" ? "XK" : "");
  const color = (code: string) => {
    const r = data.records[code];
    if (
      filter !== "all" &&
      r?.status !== filter &&
      !(filter === "favorite" && r?.favorite)
    )
      return "var(--land-muted)";
    return r?.status === "visited"
      ? "var(--accent)"
      : r?.status === "wishlist"
        ? "var(--wishlist)"
        : "var(--land)";
  };
  function reset() {
    setZoom(1);
    setPan([0, 0]);
    setRotation([-15, -15]);
  }
  function focus() {
    if (!selected) return reset();
    const c = countryByCode[selected];
    if (mode === "globe") {
      setRotation([-c.lng, -c.lat]);
      setZoom(1);
    } else {
      const p = projection([c.lng, c.lat]);
      if (p) {
        setZoom(2.2);
        setPan([(500 - p[0]) * 2.2, (275 - p[1]) * 2.2]);
      }
    }
  }
  const labels = [
    ["NORTH AMERICA", -110, 48],
    ["SOUTH AMERICA", -59, -20],
    ["EUROPE", 19, 55],
    ["AFRICA", 20, 4],
    ["ASIA", 90, 40],
    ["OCEANIA", 137, -26],
  ] as const;
  return (
    <div className={`atlas ${compact ? "compact" : ""}`}>
      {!compact && (
        <div className="map-switch" aria-label="Map projection">
          <button
            className={mode === "map" ? "active" : ""}
            onClick={() => {
              setMode("map");
              reset();
            }}
          >
            <Map size={15} />
            Map
          </button>
          <button
            className={mode === "globe" ? "active" : ""}
            onClick={() => {
              setMode("globe");
              reset();
            }}
          >
            <Globe2 size={15} />
            Globe
          </button>
        </div>
      )}
      {error ? (
        <div className="map-loading">
          Map could not load. Refresh to try again. Country search is still
          available.
        </div>
      ) : !world ? (
        <div className="map-loading">
          <LoaderCircle className="spin" /> Opening your world…
        </div>
      ) : (
        <svg
          ref={svg}
          viewBox="0 0 1000 550"
          className="world-map"
          role="group"
          aria-label="Interactive world map. Select a country or use country search."
          onPointerDown={(e) => {
            if (compact) return;
            drag.current = {
              x: e.clientX,
              y: e.clientY,
              pan: [...pan],
              rotation: [...rotation],
              moved: false,
            };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            const dx = e.clientX - d.x,
              dy = e.clientY - d.y;
            if (Math.abs(dx) + Math.abs(dy) > 5) {
              d.moved = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              const ratio = 1000 / e.currentTarget.clientWidth;
              if (mode === "globe")
                setRotation([
                  d.rotation[0] + dx * 0.35,
                  Math.max(-85, Math.min(85, d.rotation[1] - dy * 0.35)),
                ]);
              else
                setPan([
                  Math.max(-1200, Math.min(1200, d.pan[0] + dx * ratio)),
                  Math.max(-550, Math.min(550, d.pan[1] + dy * ratio)),
                ]);
            }
          }}
          onPointerUp={(e) => {
            const moved = drag.current?.moved;
            if (e.currentTarget.hasPointerCapture(e.pointerId))
              e.currentTarget.releasePointerCapture(e.pointerId);
            setTimeout(() => {
              drag.current = null;
            }, 0);
            if (moved) e.preventDefault();
          }}
          onPointerCancel={() => (drag.current = null)}
        >
          <defs>
            <radialGradient id="oceanGlow">
              <stop offset="0%" stopColor="var(--glow)" stopOpacity=".48" />
              <stop offset="100%" stopColor="var(--map-bg)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="globeOcean">
              <stop offset="0%" stopColor="var(--panel)" />
              <stop offset="100%" stopColor="var(--map-bg)" />
            </radialGradient>
          </defs>
          <rect width="1000" height="550" fill="url(#oceanGlow)" />
          <g
            transform={`translate(${500 + pan[0]},${275 + pan[1]}) scale(${zoom}) translate(-500,-275)`}
          >
            {mode === "globe" && (
              <circle
                cx="500"
                cy="275"
                r="244"
                fill="url(#globeOcean)"
                stroke="var(--border)"
              />
            )}
            <path
              d={path(geoGraticule10()) || ""}
              fill="none"
              stroke="var(--grid)"
              strokeWidth=".55"
            />
            {world.features.map((f, i) => {
              const code = codeFor(f),
                c = countryByCode[code];
              return (
                <path
                  key={`${code}-${i}`}
                  d={path(f) || ""}
                  fill={
                    code && (code === hover || code === selected)
                      ? "var(--accent-hover)"
                      : color(code)
                  }
                  stroke={
                    code && (code === hover || code === selected)
                      ? "var(--accent)"
                      : "var(--map-border)"
                  }
                  strokeWidth={code === hover ? 1 : 0.5}
                  className={c ? "country" : ""}
                  role={c ? "button" : undefined}
                  tabIndex={compact || !c ? -1 : 0}
                  aria-label={
                    c
                      ? `${c.name}${data.records[code]?.status ? ", " + data.records[code].status : ""}`
                      : undefined
                  }
                  onPointerEnter={() => setHover(code)}
                  onPointerLeave={() => setHover("")}
                  onClick={() => {
                    if (c && !drag.current?.moved) onSelect(code);
                  }}
                  onKeyDown={(e) => {
                    if (c && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onSelect(code);
                    }
                  }}
                >
                  <title>
                    {c?.name || f.properties?.name}
                    {data.records[code]?.status
                      ? ` · ${data.records[code].status}`
                      : ""}
                  </title>
                </path>
              );
            })}
            {countries
              .filter((c) => c.area < 1000)
              .map((c) => {
                if (
                  mode === "globe" &&
                  geoDistance([c.lng, c.lat], [-rotation[0], -rotation[1]]) >
                    Math.PI / 2
                )
                  return null;
                const p = projection([c.lng, c.lat]);
                if (!p) return null;
                return (
                  <circle
                    key={c.code}
                    cx={p[0]}
                    cy={p[1]}
                    r={2.4 / Math.sqrt(zoom)}
                    fill={
                      c.code === hover ? "var(--accent-hover)" : color(c.code)
                    }
                    stroke="var(--map-border)"
                    strokeWidth=".6"
                    className="country"
                    onPointerEnter={() => setHover(c.code)}
                    onPointerLeave={() => setHover("")}
                    onClick={() => {
                      if (!drag.current?.moved) onSelect(c.code);
                    }}
                  >
                    <title>{c.name}</title>
                  </circle>
                );
              })}
            {mode === "map" &&
              labels.map(([label, lng, lat]) => {
                const p = projection([lng, lat]);
                return p ? (
                  <text
                    key={label}
                    x={p[0]}
                    y={p[1]}
                    className="continent-label"
                    textAnchor="middle"
                  >
                    {label}
                  </text>
                ) : null;
              })}
          </g>
        </svg>
      )}
      {!compact && (
        <>
          <div className="map-zoom">
            <button
              title="Zoom in"
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(6, z * 1.3))}
            >
              <Plus size={17} />
            </button>
            <button
              title="Zoom out"
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(0.8, z / 1.3))}
            >
              <Minus size={17} />
            </button>
            <span />
            <button title="Reset view" aria-label="Reset view" onClick={reset}>
              <RotateCcw size={16} />
            </button>
            <button
              title="Focus selected country"
              aria-label="Focus selected country"
              onClick={focus}
            >
              <LocateFixed size={16} />
            </button>
          </div>
          <div className="map-hint">
            {hover && countryByCode[hover] ? (
              <>
                <span>{countryByCode[hover].flag}</span>{" "}
                {countryByCode[hover].name} <small>Click to explore</small>
              </>
            ) : (
              <>
                <span className="tiny-compass">⌖</span> Drag to{" "}
                {mode === "globe" ? "rotate" : "explore"} · Select a country
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
