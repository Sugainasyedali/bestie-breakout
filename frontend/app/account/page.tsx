"use client";

import { useEffect, useState } from "react";
import { createAuthClient } from "@neon/auth/next";
import { Gamepad2, Star, Trophy, Flag, Users, Settings2, UserRound, LogOut, Map, Sparkles, Check, LockKeyhole, Clock3, Upload, LoaderCircle, CircleAlert } from "lucide-react";
import { useLiveProgress } from "../live-progress";
import { catalog } from "../../../shared/catalog";
import "./profile.css";

const pretty = (value: string) => value.replaceAll("-", " ").replaceAll("_", " ");
const toggles = [
  ["music_enabled", "Background music", "Set the mood for your next adventure."],
  ["sound_enabled", "Sound effects", "Hear jumps, signals and shared victories."],
  ["reduced_motion", "Reduced motion", "Keep animations and camera movement gentle."],
  ["public_leaderboard", "Public leaderboard", "Let other players see your name and scores."],
];
export default function Account() {
  const [data, setData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [signedOut, setSignedOut] = useState(false);
  const [notice, setNotice] = useState({ text: "", error: false });
  const [busy, setBusy] = useState("");

  async function load() {
    try {
      const r = await fetch("/api/player"); const b = await r.json();
      if (!r.ok) { setSignedOut(r.status === 401); throw Error(b.error || "Unable to load your profile."); }
      setData(b); setLoadError(""); setSignedOut(false);
      // Live progress updates must never replace unsaved form edits.
      setProfile((draft: any) => draft ?? b.profile);
      setSettings((draft: any) => draft ?? b.settings);
    } catch (err) { setLoadError(err instanceof Error ? err.message : "Unable to load your profile."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  useLiveProgress(load);
  async function request(path: string, body?: unknown, method = "PATCH") {
    const r = await fetch(path, { method, ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) });
    const b = await r.json(); if (!r.ok) throw Error(b.error || "Could not save. Please try again."); return b;
  }
  async function perform(name: string, task: () => Promise<void>, message: string) {
    if (busy) return;
    setBusy(name); setNotice({ text: "", error: false });
    try { await task(); setNotice({ text: message, error: false }); }
    catch (err) { setNotice({ text: err instanceof Error ? err.message : "Please try again.", error: true }); }
    finally { setBusy(""); }
  }
  async function save(section: "profile" | "settings") {
    await perform(section, async () => {
      await request("/api/player/" + section, section === "profile" ? profile : settings);
      await load();
    }, section === "profile" ? "Player card saved. Looking good!" : "Your preferences are saved.");
  }
  async function upload(file: File) {
    await perform("avatar", async () => {
      const u = await request("/api/storage/avatar/upload-url", { type: file.type, size: file.size }, "POST");
      const form = new FormData(); Object.entries(u.fields).forEach(([k, v]) => form.append(k, String(v))); form.append("file", file);
      if (!(await fetch(u.url, { method: "POST", body: form })).ok) throw Error("Upload failed. Please try another image.");
      await request("/api/storage/avatar/complete", { key: u.key }, "POST"); await load();
    }, "Your avatar is updated.");
  }
  const stats = data?.stats ?? {};
  const unlocked = data?.badges.filter((b: any) => b.unlocked_at).length ?? 0;
  const completed = Number(stats.levels_completed ?? 0);
  const name = data?.profile.display_name || "Bestie";

  return <main className="profile-page">
    <nav className="profile-nav" aria-label="Main navigation"><a className="profile-brand" href="/"><Gamepad2 /> Bestie Breakout<span>.</span></a><div><a href="/map"><Map size={17} />World map</a><a href="/?play=1" className="profile-play"><Gamepad2 size={18} />Let’s play</a></div></nav>
    {!data ? <section className="profile-state" aria-live="polite">{loading ? <><LoaderCircle className="profile-spin" size={32} /><h1>Finding your adventure…</h1><p>Your player card is on its way.</p></> : <><UserRound size={36} /><h1>{signedOut ? "Your adventure lives here." : "We couldn’t load your profile."}</h1><p>{signedOut ? "Sign in to see your progress, achievements and favorite gear." : loadError}</p>{signedOut ? <a className="profile-play" href="/sign-in">Sign in</a> : <button onClick={() => { setLoading(true); void load(); }}>Try again</button>}</>}</section> : <div className="profile-shell">
      <header className="profile-hero">
        <div className="profile-banner"><span><Sparkles size={16} /> YOUR ADVENTURE HQ</span><span>Two brains. One mission.</span></div>
        <div className="profile-identity"><div className="profile-avatar">{data.profile.avatar ? <img src={data.profile.avatar} alt={`${name}'s avatar`} /> : <span>{name.slice(0, 1).toUpperCase()}</span>}</div><div className="profile-name"><p>HEY, BESTIE</p><h1>{name}</h1><span>@{data.profile.username}</span>{data.profile.bio && <p className="profile-bio">{data.profile.bio}</p>}</div><button onClick={() => setTab("profile")}><UserRound size={17} />Edit player card</button></div>
        <div className="profile-stats">{[[Star, stats.total_stars ?? 0, "Stars collected"], [Flag, `${completed} / ${catalog.length}`, "Levels cleared"], [Trophy, unlocked, "Badges unlocked"], [Sparkles, Number(stats.total_xp ?? 0).toLocaleString(), "Total XP"]].map(([Icon, value, label]: any) => <div key={label}><Icon size={22} /><strong>{value}</strong><span>{label}</span></div>)}</div>
      </header>
      <div className="profile-body"><aside className="profile-sidebar"><nav aria-label="Profile sections">{[["overview", "My adventure", Gamepad2], ["profile", "Player card", UserRound], ["settings", "Preferences", Settings2]].map(([id, label, Icon]: any) => <button key={id} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}><Icon size={19} />{label}</button>)}</nav><a href="/leaderboard"><Trophy size={18} /> Leaderboard</a><button disabled={!!busy} onClick={() => void perform("signout", async () => { const result = await createAuthClient().signOut(); if (result.error) throw Error(result.error.message); location.assign("/"); }, "Signed out.")}><LogOut size={18} />Sign out</button><div className="profile-tip"><Users size={25} /><strong>Better with your bestie.</strong><p>One shared victory beats a hundred solo ones.</p><a href="/?play=1">Start a co-op session</a></div></aside>
      <div className="profile-content">
        {notice.text && <div className={"profile-notice " + (notice.error ? "is-error" : "")} role={notice.error ? "alert" : "status"}>{notice.error ? <CircleAlert size={20} /> : <Check size={20} />}{notice.text}</div>}
        {loadError && <div className="profile-notice is-error" role="status">Progress refresh failed. Your current view is still available. <button onClick={() => void load()}>Retry</button></div>}
        {tab === "overview" && <>
          <section className="profile-card profile-journey"><div><span className="profile-eyebrow">NEXT STOP: A SHARED VICTORY</span><h2>Your adventure is unfolding.</h2><p>{completed === catalog.length ? "Every level cleared. Ready to chase more stars?" : `${catalog.length - completed} levels left to conquer together.`}</p><progress value={completed} max={catalog.length} aria-label="Campaign completion" /><a className="profile-play" href="/map"><Map size={18} />Explore the world map</a></div><img src="/art/m1.svg" alt="" width="200" height="160" /></section>
          <section className="profile-card"><div className="profile-heading"><div><h2>The trophy shelf</h2><p>Little reminders of big teamwork.</p></div><span className="profile-chip">{unlocked} / {data.badges.length} earned</span></div><div className="profile-badges">{data.badges.map((b: any) => <article key={b.id} className={b.unlocked_at ? "earned" : ""}><div className="profile-badge-icon">{b.unlocked_at ? <Trophy size={23} /> : <LockKeyhole size={22} />}</div><h3>{b.name}</h3><p>{b.description}</p><small>{b.unlocked_at ? "Unlocked" : "Keep adventuring"}</small></article>)}</div></section>
          <section className="profile-card"><div className="profile-heading"><div><h2>A little extra personality</h2><p>Equip a reward and make it yours.</p></div><Sparkles size={23} /></div>{data.inventory.length ? <div className="profile-gear">{data.inventory.map((item: any) => <button key={item.cosmetic_id} disabled={!!busy || item.is_equipped} aria-pressed={item.is_equipped} onClick={() => void perform("equip", async () => { await request("/api/player/equip", { cosmetic: item.cosmetic_id }, "POST"); await load(); }, "New look equipped!")}><Sparkles size={23} /><strong>{pretty(item.cosmetic_id)}</strong><span>{item.is_equipped ? <><Check size={14} /> Equipped</> : "Equip"}</span></button>)}</div> : <p className="profile-empty">Your wardrobe is waiting. Earn achievements to unlock your first cosmetic.</p>}</section>
          <div className="profile-columns"><section className="profile-card"><h2>Recent adventures</h2>{data.history.length ? <ul className="profile-history">{data.history.map((h: any, i: number) => <li key={`${h.session_id}-${i}`}><div className={"profile-result " + (h.outcome === "win" ? "won" : "")}><Flag size={18} /></div><div><strong>{catalog[h.level_id - 1]?.title ?? `Level ${h.level_id}`}</strong><small>{h.outcome === "win" ? "Cleared together" : h.outcome === "abandoned" ? "Session ended" : "Another try awaits"}</small></div><span aria-label={`${h.stars_earned ?? 0} stars`} className="profile-stars">{[1, 2, 3].map(n => <Star key={n} size={13} fill={n <= (h.stars_earned ?? 0) ? "currentColor" : "none"} />)}</span></li>)}</ul> : <p className="profile-empty">Your story starts with one level. Grab a bestie and jump in.</p>}</section><section className="profile-card"><h2>Your adventure crew</h2><p>Besties you’ve played with.</p>{data.friends.length ? <ul className="profile-friends">{data.friends.map((friend: any, i: number) => <li key={i}><span>{friend.display_name.slice(0, 1).toUpperCase()}</span><strong>{friend.display_name}</strong></li>)}</ul> : <p className="profile-empty">Play with a signed-in friend to see them here.</p>}<div className="profile-time"><Clock3 size={17} />{Math.round(Number(stats.total_playtime_seconds ?? 0) / 60)} minutes adventuring</div></section></div>
        </>}
        {tab === "profile" && <section className="profile-card"><div className="profile-heading"><div><h2>Make yourself at home.</h2><p>Your player card, your personality.</p></div><UserRound size={25} /></div><div className="profile-avatar-edit"><div className="profile-avatar small">{data.profile.avatar ? <img src={data.profile.avatar} alt="Current avatar" /> : name.slice(0, 1).toUpperCase()}</div><div><label className="profile-upload"><Upload size={17} />{busy === "avatar" ? "Uploading…" : "Upload avatar"}<input disabled={!!busy} type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }} /></label><small>PNG, JPG or WebP</small></div>{data.profile.avatar && <button disabled={!!busy} className="profile-text-button" onClick={() => void perform("avatar", async () => { await request("/api/storage/avatar", undefined, "DELETE"); await load(); }, "Avatar removed.")}>Remove</button>}</div><form onSubmit={e => { e.preventDefault(); void save("profile"); }}><fieldset disabled={!!busy}><div className="profile-form-grid"><label>Display name<input required maxLength={40} autoComplete="nickname" value={profile.display_name} onChange={e => setProfile({ ...profile, display_name: e.target.value })} /></label><label>Username<input required minLength={3} maxLength={24} pattern="[a-z0-9_]{3,24}" value={profile.username} onChange={e => setProfile({ ...profile, username: e.target.value })} /><small>3–24 lowercase letters, numbers or underscores.</small></label></div><label>About you<textarea maxLength={280} rows={3} placeholder="Puzzle solver? Chaos coordinator? Tell your besties." value={profile.bio ?? ""} onChange={e => setProfile({ ...profile, bio: e.target.value })} /><small>{(profile.bio ?? "").length} / 280 characters</small></label><div className="profile-form-grid"><label>Your character<select value={profile.character_id} onChange={e => setProfile({ ...profile, character_id: e.target.value })}><option>Bunny</option><option>Sprout</option></select></label><label>Character color<input className="profile-color" type="color" value={profile.character_color} onChange={e => setProfile({ ...profile, character_color: e.target.value })} /></label></div><button className="profile-play" disabled={!!busy}>{busy === "profile" ? "Saving…" : "Save player card"}</button></fieldset></form></section>}
        {tab === "settings" && <><section className="profile-card"><h2>Your game, your way.</h2><p>Fine-tune your next adventure.</p><form onSubmit={e => { e.preventDefault(); void save("settings"); }}><fieldset disabled={!!busy}>{toggles.map(([key, title, hint]) => <label className="profile-toggle" key={key}><span><strong>{title}</strong><small>{hint}</small></span><input type="checkbox" role="switch" checked={settings[key]} onChange={e => setSettings({ ...settings, [key]: e.target.checked })} /></label>)}<div className="profile-form-grid">{["music_volume", "sound_volume"].map(key => <label key={key} className="profile-volume">{key === "music_volume" ? "Music volume" : "Effects volume"}<output>{Math.round(settings[key] * 100)}%</output><input type="range" min="0" max="1" step=".05" value={settings[key]} onChange={e => setSettings({ ...settings, [key]: Number(e.target.value) })} /></label>)}</div><label>Preferred controls<select value={settings.preferred_controls} onChange={e => setSettings({ ...settings, preferred_controls: e.target.value })}><option value="auto">Automatic</option><option value="keyboard">Keyboard</option><option value="touch">Touch controls</option></select></label><button className="profile-play" disabled={!!busy}>{busy === "settings" ? "Saving…" : "Save preferences"}</button></fieldset></form></section><section className="profile-card profile-danger"><details><summary>Delete account</summary><p>This permanently deletes your account and saved progress. This cannot be undone.</p><form onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); if (!confirm("Permanently delete your account and progress?")) return; void perform("delete", async () => { const b = await request("/api/player", { confirm: f.get("confirm"), password: f.get("password") }, "DELETE"); if (!b.ok) throw Error(b.message || "Deletion could not be completed."); location.assign("/"); }, "Account deleted."); }}><fieldset disabled={!!busy}><label>Type DELETE to confirm<input name="confirm" required pattern="DELETE" autoComplete="off" /></label><label>Current password<input name="password" type="password" required autoComplete="current-password" /></label><button disabled={!!busy}>Delete my account</button></fieldset></form></details></section></>}
      </div></div>
    </div>}
    <footer className="profile-footer">Made for shared victories. Bestie Breakout.</footer>
  </main>;
}
