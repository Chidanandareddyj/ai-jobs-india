"use client";
import { useState } from "react";
export default function Newsletter() {
  const [email, setEmail] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <form className="space-y-2" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const r = await fetch("/api/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) }); const d = await r.json(); setBusy(false); setMsg(d.message); if (r.ok) setEmail(""); }}>
      <label htmlFor="nl" className="label block">Weekly digest</label>
      <div className="flex gap-1.5">
        <input id="nl" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@domain.com" className="field" />
        <button disabled={busy} className="btn btn-primary h-[30px]">{busy ? "…" : "Subscribe"}</button>
      </div>
      <p className="font-mono text-[11px] text-faint">{msg || "One email, Mondays. New India-eligible roles only."}</p>
    </form>
  );
}
