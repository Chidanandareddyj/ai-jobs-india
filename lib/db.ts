// Data access layer. Swap JsonRepo for a SupabaseRepo implementing the same interface later.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { Job } from "./types";
import { LEVELS, type Level } from "./classify";

export interface JobRepo { all(): Job[]; bySlug(s: string): Job | undefined; fetchedAt(): string }
export interface SubscriberRepo { add(email: string): Promise<boolean> }

const DATA = path.join(process.cwd(), "data");
let cache: { fetchedAt: string; jobs: Job[] } | null = null;
const load = () => (cache ??= JSON.parse(readFileSync(path.join(DATA, "jobs.json"), "utf8")));

export const jobs: JobRepo = { all: () => load().jobs, bySlug: (s) => load().jobs.find((j: Job) => j.slug === s), fetchedAt: () => load().fetchedAt };

// Subscribers: Supabase when configured (required on Vercel), local JSON file otherwise (dev).
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-only: never expose to the client

const fileSubscribers: SubscriberRepo = {
  async add(email) {
    const f = path.join(DATA, "subscribers.json");
    const list: { email: string; at: string }[] = existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : [];
    if (list.some((x) => x.email === email)) return false;
    list.push({ email, at: new Date().toISOString() }); writeFileSync(f, JSON.stringify(list, null, 2)); return true;
  },
};

const supabaseSubscribers: SubscriberRepo = {
  async add(email) {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(SUPABASE_URL!, SUPABASE_KEY!, { auth: { persistSession: false } });
    const { error } = await sb.from("subscribers").insert({ email });
    if (!error) return true;
    if (error.code === "23505") return false; // unique violation: already subscribed
    throw new Error(`Supabase insert failed: ${error.message}`);
  },
};

export const subscribers: SubscriberRepo = SUPABASE_URL && SUPABASE_KEY ? supabaseSubscribers : fileSubscribers;

export const SITE = { name: "AI Jobs India", url: (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3100")).replace(/\/$/, ""), tagline: "Remote AI, agents & dev-tools engineering jobs that hire from India" };
export const isLevel = (s: string): s is Level => (LEVELS as string[]).includes(s);
export function facets() {
  const all = jobs.all(); const count = (k: (j: Job) => string[]) => { const m = new Map<string, number>(); all.forEach((j) => k(j).forEach((v) => m.set(v, (m.get(v) || 0) + 1))); return [...m].sort((a, b) => b[1] - a[1]); };
  return { levels: LEVELS.map((l) => [l, all.filter((j) => j.level === l).length] as [string, number]), stacks: count((j) => j.stack), companies: count((j) => [j.company]) };
}
export function filter(f: { level?: string; stack?: string; company?: string; q?: string; ai?: string }) {
  return jobs.all().filter((j) => {
    if (f.level === "entry") { if (!["intern", "fresher", "junior"].includes(j.level)) return false; }
    else if (f.level && j.level !== f.level) return false;
    if (f.stack && !j.stack.includes(f.stack)) return false;
    if (f.company && j.company !== f.company) return false;
    if (f.ai === "1" && !j.ai) return false;
    if (f.q && !(j.title + " " + j.company).toLowerCase().includes(f.q.toLowerCase())) return false;
    return true;
  });
}
