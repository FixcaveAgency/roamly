"use client";
import { useEffect, useState } from "react";
import { Cloud, Mail, Upload, Download, LogOut, Link2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import Modal from "./Modal";
import { cloud } from "@/lib/cloud";
import { cleanData, decodeShare, encodeShare } from "@/lib/core";
import type { TravelData } from "@/lib/types";
export default function CloudPanel({
  data,
  onLoad,
  onClose,
  notify,
}: {
  data: TravelData;
  onLoad: (d: TravelData) => void;
  onClose: () => void;
  notify: (m: string) => void;
}) {
  const [user, setUser] = useState<User | null>(null),
    [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [slug, setSlug] = useState(""),
    [published, setPublished] = useState("");
  useEffect(() => {
    if (!cloud) return;
    cloud.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: subscription } = cloud.auth.onAuthStateChange((_, s) =>
      setUser(s?.user || null),
    );
    return () => subscription.subscription.unsubscribe();
  }, []);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Something went wrong. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Your passport, everywhere" onClose={onClose}>
      <div className="stack">
        <div className="cloud-intro">
          <Cloud size={32} />
          <h3>Take your memories with you.</h3>
          <p className="muted">
            Your passport is already saved on this device. An account adds a
            private cloud backup and a public profile you can choose to publish.
          </p>
        </div>
        {!cloud ? (
          <div className="note">
            <Cloud size={19} />
            <p>
              Cloud accounts are not enabled on this website yet. Use Settings
              to download a backup and restore it on another device.
            </p>
          </div>
        ) : !user ? (
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              void action(async () => {
                const { error } = await cloud!.auth.signInWithOtp({
                  email,
                  options: { emailRedirectTo: window.location.origin },
                });
                if (error) throw error;
                setMessage("Check your email for your secure sign-in link.");
              });
            }}
          >
            <label>
              Email address
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
            <button className="btn primary" disabled={busy}>
              <Mail size={17} />
              {busy ? "Sending…" : "Email me a sign-in link"}
            </button>
            <p className="muted small">
              No password to remember. Your existing passport stays on this
              device.
            </p>
          </form>
        ) : (
          <>
            <p className="account-email">
              Signed in as <strong>{user.email}</strong>
            </p>
            <div className="sync-options">
              <button
                className="btn primary"
                disabled={busy}
                onClick={() =>
                  void action(async () => {
                    const { error } = await cloud!
                      .from("passports")
                      .upsert({
                        user_id: user.id,
                        payload: data,
                        updated_at: new Date().toISOString(),
                      });
                    if (error) throw error;
                    setMessage("Your passport is backed up in your account.");
                    notify("Cloud backup saved.");
                  })
                }
              >
                <Upload size={17} />
                Back up to cloud
              </button>
              <button
                className="btn"
                disabled={busy}
                onClick={() => {
                  if (
                    confirm(
                      "Replace this device’s passport with your cloud backup? Download a local backup first if you want to keep both.",
                    )
                  )
                    void action(async () => {
                      const { data: row, error } = await cloud!
                        .from("passports")
                        .select("payload")
                        .eq("user_id", user.id)
                        .maybeSingle();
                      if (error) throw error;
                      if (!row)
                        throw Error(
                          "No cloud backup yet. Back up this passport first.",
                        );
                      onLoad(cleanData(row.payload));
                      setMessage("Cloud passport restored to this device.");
                    });
                }}
              >
                <Download size={17} />
                Restore from cloud
              </button>
            </div>
            <p className="small muted">
              Back up after changes and restore on another device. Restoring
              replaces the local passport.
            </p>
            <hr />
            <h3>Your public travel page</h3>
            <p className="muted small">
              Publish your name, bio, visited countries and wishlist. Notes,
              dates, places and trips stay private. Your page will be accessible
              to anyone with its URL.
            </p>
            <label>
              Profile address
              <input
                pattern="[a-z0-9-]{3,30}"
                maxLength={30}
                value={slug}
                placeholder="your-name"
                onChange={(e) =>
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  )
                }
              />
            </label>
            <button
              className="btn"
              disabled={busy || slug.length < 3}
              onClick={() =>
                void action(async () => {
                  const payload = decodeShare(encodeShare(data));
                  const { error } = await cloud!
                    .from("public_passports")
                    .upsert(
                      {
                        slug,
                        owner_id: user.id,
                        payload,
                        updated_at: new Date().toISOString(),
                      },
                      { onConflict: "slug" },
                    );
                  if (error)
                    throw Error(
                      "This address may be taken, or publishing is unavailable. Try another address.",
                    );
                  setPublished(`${location.origin}/p/${slug}`);
                  setMessage("Your public page is published.");
                })
              }
            >
              <Link2 size={16} />
              Publish / update profile
            </button>
            {published && (
              <a
                className="text-link break-word"
                href={published}
                target="_blank"
                rel="noreferrer"
              >
                {published}
              </a>
            )}
            <button
              className="text-btn"
              disabled={busy}
              onClick={() => {
                if (
                  confirm(
                    "Unpublish all public profile addresses owned by your account?",
                  )
                )
                  void action(async () => {
                    const { error } = await cloud!
                      .from("public_passports")
                      .delete()
                      .eq("owner_id", user.id);
                    if (error) throw error;
                    setPublished("");
                    setMessage("Your public profiles have been unpublished.");
                  });
              }}
            >
              Unpublish my public pages
            </button>
            <button
              className="btn"
              onClick={() =>
                void action(async () => {
                  const { error } = await cloud!.auth.signOut();
                  if (error) throw error;
                  setUser(null);
                  setMessage(
                    "Signed out. Your local passport remains on this device.",
                  );
                })
              }
            >
              <LogOut size={16} />
              Sign out
            </button>
          </>
        )}
        {message && (
          <p className="form-message" role="status">
            {message}
          </p>
        )}
      </div>
    </Modal>
  );
}
