"use client";

import { useState } from "react";
import { createAuthClient } from "@neon/auth/next";
import { Gamepad2, Eye, EyeOff, LockKeyhole, Mail, UserRound, Sparkles, CheckCircle2, CircleAlert, LoaderCircle, Users, Flag, Trophy } from "lucide-react";
import "./auth.css";

const client = createAuthClient();
const copy = {
  "sign-in": { tag: "YOUR NEXT ADVENTURE AWAITS", title: "Hey, welcome back!", intro: "Your bestie is waiting. Pick up where you left off.", action: "Let’s play", icon: Gamepad2 },
  "sign-up": { tag: "SAVE YOUR SPOT", title: "Every bestie starts here.", intro: "Create your account and make every adventure count.", action: "Create my account", icon: Sparkles },
  "forgot-password": { tag: "WE’VE GOT YOUR BACK", title: "Lost your password?", intro: "Enter your email and we’ll send you a link to get back in.", action: "Send reset link", icon: Mail },
  "reset-password": { tag: "A FRESH START", title: "New password. Same bestie.", intro: "Choose a new password to keep your adventure safe.", action: "Save new password", icon: LockKeyhole },
};

export function AuthForm({ mode }: { mode: keyof typeof copy }) {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const content = copy[mode];
  const Icon = content.icon;
  const newPassword = mode === "sign-up" || mode === "reset-password";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setMessage(""); setSuccess(false);
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") || "").trim();
    const password = String(f.get("password") || "");
    try {
      if (newPassword && password !== f.get("confirm")) throw Error("Your passwords don’t match. Please check both fields.");
      const result = mode === "sign-in" ? await client.signIn.email({ email, password, rememberMe: true })
        : mode === "sign-up" ? await client.signUp.email({ email, password, name: String(f.get("name")).trim(), callbackURL: "/account" })
        : mode === "forgot-password" ? await client.requestPasswordReset({ email, redirectTo: location.origin + "/reset-password" })
        : await client.resetPassword({ newPassword: password, token: new URLSearchParams(location.search).get("token") || "" });
      if (result.error) throw Error(result.error.message || "Something went wrong. Please try again.");
      if (mode === "sign-in") { location.assign("/account"); return; }
      setSuccess(true);
      setMessage(mode === "sign-up" ? "Account created! Check your email for verification, then sign in."
        : mode === "forgot-password" ? "If an account exists for this email, a reset link is on its way. Check your inbox."
        : "Your password is updated. You’re ready to sign in!");
    } catch (err) { setMessage(err instanceof Error ? err.message : "Please try again."); }
    finally { setBusy(false); }
  }

  return <main className="auth-page">
    <nav className="auth-nav" aria-label="Main navigation">
      <a className="auth-brand" href="/"><span><Gamepad2 size={24} /></span>Bestie Breakout<span className="auth-brand-dot">.</span></a>
      <a className="auth-home" href="/">Back to the game</a>
    </nav>
    <div className="auth-shell">
      <aside className="auth-story" aria-label="Your cooperative adventure">
        <span className="auth-sticker"><Users size={16} /> BETTER TOGETHER</span>
        <h2>Two brains.<br />One <span>epic adventure.</span></h2>
        <p>A little chaos. A lot of teamwork.<br />All that’s missing is you and your bestie.</p>
        <div className="auth-art"><img src="/art/hero.svg" alt="Two besties jumping between floating islands to reach a golden key" width="760" height="420" /></div>
        <div className="auth-perks"><span><Flag size={19} /><strong>60 levels</strong> of shared victories</span><span><Trophy size={19} /><strong>Your progress</strong> saved for next time</span></div>
        <span className="auth-story-foot">A co-op adventure made for your favorite duo.</span>
      </aside>
      <section className="auth-form-panel" aria-labelledby="auth-title">
        <div className="auth-form-inner">
          <div className="auth-mode-icon"><Icon size={25} /></div>
          <p className="auth-eyebrow">{content.tag}</p>
          <h1 id="auth-title">{content.title}</h1>
          <p className="auth-intro">{content.intro}</p>
          {(mode === "sign-in" || mode === "sign-up") && <nav className="auth-tabs" aria-label="Account options"><a href="/sign-in" aria-current={mode === "sign-in" ? "page" : undefined}>Sign in</a><a href="/sign-up" aria-current={mode === "sign-up" ? "page" : undefined}>Create account</a></nav>}
          <form onSubmit={submit} aria-busy={busy}>
            <fieldset disabled={busy}>
              {mode === "sign-up" && <div className="auth-field"><label htmlFor="auth-name">Display name</label><div className="auth-input"><UserRound size={18} aria-hidden="true" /><input id="auth-name" name="name" required maxLength={40} autoComplete="nickname" placeholder="What should your bestie call you?" /></div></div>}
              {mode !== "reset-password" && <div className="auth-field"><label htmlFor="auth-email">Email address</label><div className="auth-input"><Mail size={18} aria-hidden="true" /><input id="auth-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" autoCapitalize="none" spellCheck={false} /></div></div>}
              {mode !== "forgot-password" && <div className="auth-field"><div className="auth-label-row"><label htmlFor="auth-password">{newPassword ? "New password" : "Password"}</label>{mode === "sign-in" && <a href="/forgot-password">Forgot password?</a>}</div><div className="auth-input"><LockKeyhole size={18} aria-hidden="true" /><input id="auth-password" name="password" type={visible ? "text" : "password"} minLength={8} required autoComplete={newPassword ? "new-password" : "current-password"} placeholder={newPassword ? "At least 8 characters" : "Enter your password"} aria-describedby={newPassword ? "auth-password-hint" : undefined} /><button className="auth-reveal" type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible}>{visible ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>{newPassword && <small id="auth-password-hint">Use at least 8 characters.</small>}</div>}
              {newPassword && <div className="auth-field"><label htmlFor="auth-confirm">Confirm password</label><div className="auth-input"><LockKeyhole size={18} aria-hidden="true" /><input id="auth-confirm" name="confirm" type={visible ? "text" : "password"} required minLength={8} autoComplete="new-password" placeholder="One more time" /></div></div>}
              {message && <div className={"auth-feedback " + (success ? "auth-success" : "auth-error")} role={success ? "status" : "alert"}>{success ? <CheckCircle2 size={19} /> : <CircleAlert size={19} />}<span>{message}</span></div>}
              <button className="auth-submit" type="submit" disabled={busy}>{busy ? <><LoaderCircle className="auth-spinner" size={19} />Working…</> : content.action}</button>
            </fieldset>
          </form>
          {(mode === "forgot-password" || mode === "reset-password" || success) && <p className="auth-switch"><a href="/sign-in">Back to sign in</a></p>}
          <div className="auth-guest"><span>Just here to play?</span><a href="/?play=1">Continue as a guest</a><small>Sign in to save progress across visits.</small></div>
        </div>
      </section>
    </div>
    <footer className="auth-footer"><Gamepad2 size={16} /> Two brains. One mission. Countless “we did it!” moments.</footer>
  </main>;
}
