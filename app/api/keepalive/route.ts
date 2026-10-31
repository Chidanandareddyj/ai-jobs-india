// Pinged by the daily fetch Action. Supabase free projects pause after ~7 days with no API
// traffic (Oct 31: the project was found paused, so newsletter signups would have failed).
// A cheap HEAD count on subscribers counts as activity. Returns only ok/not-ok, never data.
export const dynamic = "force-dynamic";
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return Response.json({ ok: false, reason: "not configured" }, { status: 500 });
  const res = await fetch(`${url}/rest/v1/subscribers?select=id&limit=1`, { headers: key.startsWith("sb_") ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" }).catch(() => null);
  return Response.json({ ok: !!res && res.status < 500, status: res?.status ?? 0 }, { status: res && res.status < 500 ? 200 : 502 });
}
