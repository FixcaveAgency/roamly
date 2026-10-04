"use client";
import { useEffect, useState } from "react";
import { Globe2 } from "lucide-react";
import { cloud } from "@/lib/cloud";
import { cleanData } from "@/lib/core";
import type { TravelData } from "@/lib/types";
import Roamly from "./Roamly";
export default function PublicPassport({ slug }: { slug: string }) {
  const [data, setData] = useState<TravelData | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (!cloud) {
      setError("Public profiles are not enabled on this website.");
      return;
    }
    cloud
      .from("public_passports")
      .select("payload")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setError("This passport is private or could not be found.");
          return;
        }
        try {
          setData(cleanData(data.payload));
        } catch {
          setError("This passport could not be opened.");
        }
      });
  }, [slug]);
  return data ? (
    <Roamly publicData={data} />
  ) : (
    <div className="public-loading">
      <Globe2 size={42} />
      <h1>{error || "Opening a world of memories…"}</h1>
      <a className="btn" href="/">
        Create your own passport
      </a>
    </div>
  );
}
