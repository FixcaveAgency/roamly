import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { countries, stats, explorerRank, encodeShare } from "./core";
import type { TravelData } from "./types";
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
export async function passportCanvas(data: TravelData) {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1440;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw Error("Your browser could not create the image.");
  const s = stats(data);
  ctx.fillStyle = "#0b1118";
  ctx.fillRect(0, 0, 1440, 1080);
  ctx.fillStyle = "#c4f368";
  ctx.font = "700 36px Manrope";
  ctx.fillText("roamly", 70, 83);
  ctx.fillStyle = "#8a97a3";
  ctx.textAlign = "right";
  ctx.font = '500 19px "DM Sans"';
  ctx.fillText("A WORLD OF MEMORIES", 1370, 80);
  ctx.textAlign = "left";
  ctx.fillStyle = "#f2f6fa";
  ctx.font = "700 52px Manrope";
  ctx.fillText(data.profile.name.slice(0, 35), 70, 175, 1250);
  ctx.font = '400 22px "DM Sans"';
  ctx.fillStyle = "#8a97a3";
  ctx.fillText(data.profile.bio.slice(0, 100), 70, 220, 1260);
  const response = await fetch("/data/world.json");
  if (!response.ok) throw Error("Map data could not load.");
  const t = await response.json();
  const world = feature(
    t,
    t.objects.countries,
  ) as unknown as GeoJSON.FeatureCollection;
  const projection = geoNaturalEarth1().scale(215).translate([720, 515]),
    path = geoPath(projection, ctx);
  const ids = Object.fromEntries(countries.map((c) => [c.numeric, c.code]));
  for (const f of world.features) {
    const code = ids[String(f.id).padStart(3, "0")],
      r = data.records[code];
    ctx.beginPath();
    path(f);
    ctx.fillStyle =
      r?.status === "visited"
        ? "#c4f368"
        : r?.status === "wishlist"
          ? "#b196e8"
          : "#29363d";
    ctx.fill();
    ctx.strokeStyle = "#0b1118";
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }
  const items = [
    [`${s.count}`, `COUNTRIES OF ${s.denominator}`],
    [`${s.continents}`, "CONTINENTS"],
    [`${s.percent}%`, "OF THE WORLD"],
    [`${s.wishlist.length}`, "ON MY WISHLIST"],
  ];
  items.forEach(([n, label], i) => {
    const x = 80 + i * 345;
    ctx.fillStyle = "#f3f7fa";
    ctx.font = "700 57px Manrope";
    ctx.fillText(n, x, 915);
    ctx.fillStyle = "#8a97a3";
    ctx.font = '500 17px "DM Sans"';
    ctx.fillText(label, x, 950);
  });
  ctx.fillStyle = "#233039";
  ctx.fillRect(70, 992, 1300, 1);
  ctx.fillStyle = "#c4f368";
  ctx.font = '600 18px "DM Sans"';
  ctx.fillText(explorerRank(s.count).toUpperCase(), 70, 1038);
  ctx.fillStyle = "#8a97a3";
  ctx.textAlign = "right";
  ctx.fillText("Your world, one place at a time.", 1370, 1038);
  return canvas;
}
export async function exportPassport(
  data: TravelData,
  format: "png" | "jpg" | "pdf",
) {
  const canvas = await passportCanvas(data);
  if (format === "pdf") {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [1440, 1080],
    });
    doc.addImage(
      canvas.toDataURL("image/jpeg", 0.95),
      "JPEG",
      0,
      0,
      1440,
      1080,
    );
    downloadBlob(doc.output("blob"), "roamly-passport.pdf");
  } else {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(
        resolve,
        format === "jpg" ? "image/jpeg" : "image/png",
        0.95,
      ),
    );
    if (!blob) throw Error("Export failed. Try again.");
    downloadBlob(blob, `roamly-passport.${format}`);
  }
}
export function shareLink(data: TravelData) {
  return `${window.location.origin}${window.location.pathname}#passport=${encodeShare(data)}`;
}
