import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { COMPANIES, Company } from "./companies";
import { classify } from "../lib/classify";
import type { Job } from "../lib/types";

const decode = (s: string) => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d)).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
const strip = (h: string) => decode(h).replace(/<style[\s\S]*?<\/style>/g, "").replace(/<(br|\/p|\/li|\/h\d)>/gi, "\n").replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").trim();
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
interface Raw { id: string; title: string; location: string; remote: boolean; desc: string; html?: string; url: string; apply: string; posted?: string; dept?: string }

// Retry transient network errors / 429 / 5xx (Oct 22: one "fetch failed" mid-pagination aborted Himalayas and dropped 17 jobs)
async function get(url: string, tries = 3): Promise<any> {
  for (let i = 1; ; i++) {
    try { const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (r.ok) return r.json();
      if (i >= tries || (r.status < 500 && r.status !== 429)) throw new Error(`${r.status}`);
    } catch (e: any) { if (i >= tries || /^4\d\d$/.test(e.message) && e.message !== "429") throw e; }
    await new Promise((res) => setTimeout(res, 2000 * i));
  }
}

async function pull(c: Company): Promise<Raw[]> {
  if (c.source === "greenhouse") {
    const d = await get(`https://boards-api.greenhouse.io/v1/boards/${c.slug}/jobs?content=true`);
    return d.jobs.map((j: any) => { const html = decode(j.content || ""); const locs = [j.location?.name, ...(j.offices || []).map((o: any) => o.name)].filter(Boolean).join(" · ");
      return { id: String(j.id), title: j.title, location: locs, remote: /remote/i.test(locs), desc: strip(html), html, url: j.absolute_url, apply: j.absolute_url, posted: j.updated_at, dept: j.departments?.[0]?.name }; });
  }
  if (c.source === "lever") {
    const d = await get(`https://api.lever.co/v0/postings/${c.slug}?mode=json`);
    return d.map((j: any) => { const locs = [...new Set([j.categories?.location, ...(j.categories?.allLocations || [])].filter(Boolean))].join(" · ");
      return { id: j.id, title: j.text, location: locs, remote: j.workplaceType === "remote", desc: [j.descriptionPlain, ...(j.lists || []).map((l: any) => l.text + "\n" + strip(l.content)), j.additionalPlain].filter(Boolean).join("\n\n"),
        html: [j.description, ...(j.lists || []).map((l: any) => `<h3>${l.text}</h3><ul>${l.content}</ul>`), j.additional].join(""), url: j.hostedUrl, apply: j.applyUrl || j.hostedUrl, posted: new Date(j.createdAt).toISOString(), dept: j.categories?.team }; });
  }
  if (c.source === "workable") {
    const d = await get(`https://apply.workable.com/api/v1/widget/accounts/${c.slug}?details=true`);
    return d.jobs.map((j: any) => { const loc = [j.telecommuting ? "Remote" : "", j.city, j.country, ...(j.locations || []).map((l: any) => l.country)].filter(Boolean).join(" · ");
      return { id: j.shortcode, title: j.title, location: loc, remote: !!j.telecommuting, desc: strip(j.description || ""), html: j.description, url: j.url, apply: j.application_url || j.url, posted: j.published_on }; });
  }
  if (c.source === "smartrecruiters") {
    const d = await get(`https://api.smartrecruiters.com/v1/companies/${c.slug}/postings?limit=100`);
    return d.content.map((j: any) => { const loc = [j.location?.remote ? "Remote" : "", j.location?.city, j.location?.country === "in" ? "India" : j.location?.country].filter(Boolean).join(" · ");
      return { id: j.id, title: j.name, location: loc, remote: !!j.location?.remote, desc: "", url: `https://jobs.smartrecruiters.com/${c.slug}/${j.id}`, apply: `https://jobs.smartrecruiters.com/${c.slug}/${j.id}`, posted: j.releasedDate, dept: j.department?.label }; });
  }
  const d = await get(`https://api.ashbyhq.com/posting-api/job-board/${c.slug}`);
  return d.jobs.filter((j: any) => j.isListed !== false).map((j: any) => { const locs = [j.location, ...(j.secondaryLocations || []).map((s: any) => s.location)].filter(Boolean).join(" · ");
    return { id: j.id, title: j.title, location: locs, remote: !!j.isRemote || j.workplaceType === "Remote", desc: j.descriptionPlain || strip(j.descriptionHtml || ""), html: j.descriptionHtml, url: j.jobUrl, apply: j.applyUrl || j.jobUrl, posted: j.publishedAt, dept: j.department }; });
}

async function main() {
  const now = new Date().toISOString(); const jobs: Job[] = []; const stats: Record<string, { total: number; kept: number; error?: string }> = {};
  const queue = [...COMPANIES];
  await Promise.all(Array.from({ length: 8 }, async () => { for (let c; (c = queue.shift()); ) {
    try { const raws = await pull(c); let kept = 0;
      for (const r of raws) { const k = classify(r.title, r.location, r.desc, r.remote);
        if (!(k.remote && k.indiaEligible && k.engineering)) continue; kept++;
        jobs.push({ id: `${c.source}-${c.slug}-${r.id}`, slug: `${slugify(c.name)}-${slugify(r.title)}-${String(r.id).slice(0, 8)}`, company: c.name, companySlug: slugify(c.name), source: c.source,
          title: r.title, location: r.location, department: r.dept, url: r.url, applyUrl: r.apply, postedAt: r.posted, description: r.desc.slice(0, 20000), descriptionHtml: r.html?.slice(0, 40000),
          level: k.level, stack: k.stack, ai: k.ai, indiaReason: k.indiaReason, fetchedAt: now }); }
      stats[c.name] = { total: raws.length, kept }; console.log(`${c.source}/${c.slug}: ${raws.length} -> ${kept}`);
    } catch (e: any) { stats[c.name] = { total: 0, kept: 0, error: e.message }; console.log(`${c.source}/${c.slug}: ERROR ${e.message}`); } } }));
  // ---- Aggregators: no company allowlist, so require AI or dev-tools signal ----
  const DEVTOOLS = /\b(developer tools?|devtools|api|sdk|infrastructure|platform engineer|devops|sre|cloud|kubernetes|database|open[- ]source|llm|ai|machine learning|ml|agents?|data engineer)\b/i;
  // Staffing / consultancy / contract-agency blocklist
  const STAFFING_CO = /(pradeepit|cloud counselage|mimidentalclinic|mimi dental|xperteez|productiv team|clanx|talent sam|ngo consulting|beyondsoft|marktine|lemon\.io|ishir|micro1|a\.team|askable|lexoga|taskus|srijan|vertex marketing group|^ready$|twikey|levelup labs|inovex|20four7va|kdci|gofasti|metasys|five and fly|five & fly|dysrupit|staffing|recruit(ing|ment)|consult(ing|ancy|ants)|outsourc|talent (solutions|journey)|manpower|placement|\bhr (plus|solutions|services)\b|jobs for humanity|internshiphub|weekday)/i;
  const STAFFING_TEXT = /(talent[- ]as[- ]a[- ]service|nearshore (tech )?talent|(provid|suppl)\w* (top )?(latin american|latam) (tech )?talent|unpaid (internship|position|role|initially|at first)|stipend:?\s*unpaid|internship is unpaid|stipend:?\s*(none|nil|not provided|n\/a)\b|no stipend|without (a )?stipend|staffing (firm|agency|company)|consulting services|on behalf of (our|a) client|our client is|\bc2c\b|corp[- ]to[- ]corp|\bbench\b|w2 only|third[- ]party payroll|contract[- ]to[- ]hire via|we've partnered with an? [^.]{0,40}(startup|company) to find|task-based contract|help train next-generation ai|tasks? (that|for) (today's best |frontier )?ai (coding )?models|us\$[\d,]+ per task)/i;
  // Teaching jobs dressed as engineering titles (Oct 22: Playto Labs "Robotics Engineer Fresher" = online robotics classes for kids aged 8-16)
  const TEACHING_TEXT = /(conduct (live |online )?[\w& ]{0,40}classes|teach (arduino|coding|robotics|stem|kids|children|students)|students aged \d+)/i;
  // Companies whose "worldwide" aggregator posts are really region-locked (checked against their own ATS page)
  // Deeter Analytics: HN says REMOTE (WORLDWIDE) but its Ashby ML Engineer post says "fully remote, US-based" (Oct 22)
  const NOT_INDIA_CO = /^(deeter analytics)$/i;
  let blocked = 0;
  const STRICT_ENG = /\b(engineer|engineering|developer|sde|swe|programmer|(data|ml|research|applied) scientist|devops|sre|full[- ]?stack|back[- ]?end|front[- ]?end)\b/i;
  const JUNK = /\b(salesforce|cpq|sap|servicenow|rater|translator|evaluator|transcriber|tutor|annotat\w*|participant|trainer|linguist\w*|talent hub|expression of interest|volunteer|unpaid|support engineer|systems support|network engineer\w*|sales engineer|product manager|recruit\w*|future position|content developer|independent)\b/i;
  const addAgg = (source: string, company: string, r: Raw, hint?: "intern" | "entry") => {
    if (NOT_INDIA_CO.test(company.trim())) return false;
    if (STAFFING_CO.test(company) || STAFFING_TEXT.test(r.title + " " + r.desc.slice(0, 5000))) { blocked++; return false; }
    const k = classify(r.title, r.location, r.desc, r.remote, hint);
    if (!(k.remote && k.indiaEligible && k.engineering)) return false;
    if (!STRICT_ENG.test(r.title) || JUNK.test(r.title) || TEACHING_TEXT.test(r.desc.slice(0, 3000))) return false;
    if (!(k.ai || DEVTOOLS.test(r.title + " " + r.desc.slice(0, 3000)))) return false;
    if (!["intern", "fresher", "junior"].includes(k.level) && !k.ai) return false; // non-entry aggregator roles must be AI roles
    const norm = (x: string) => x.toLowerCase().replace(/\b(gmbh|inc|ltd|llc|pvt|private|limited)\b/g, "").replace(/[^a-z0-9]/g, ""); const key = norm(company) + "|" + norm(r.title);
    if (jobs.some((j) => norm(j.company) + "|" + norm(j.title) === key)) return false;
    jobs.push({ id: `${source}-${r.id}`, slug: `${slugify(company)}-${slugify(r.title)}-${String(r.id).replace(/\W/g, "").slice(-8)}`, company, companySlug: slugify(company), source, title: r.title, location: r.location,
      url: r.url, applyUrl: r.apply, postedAt: r.posted, description: r.desc.slice(0, 20000), level: k.level, stack: k.stack, ai: k.ai, indiaReason: k.indiaReason, fetchedAt: now });
    return true;
  };
  const agg = async (name: string, fn: () => Promise<number>) => { try { const n = await fn(); stats[name] = { total: n, kept: jobs.filter((j) => j.source === name.toLowerCase().split(" ")[0]).length }; console.log(`${name}: ${n} -> ${stats[name].kept}`); } catch (e: any) { stats[name] = { total: 0, kept: 0, error: e.message }; console.log(`${name}: ERROR ${e.message}`); } };
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Himalayas public API: entry-level, India-eligible remote jobs
  const addH = (j: any, sen?: string) => { const restr: string[] = j.locationRestrictions || []; const loc = "Remote · " + (restr.length ? restr.join(", ") : "Worldwide");
    return addAgg("himalayas", j.companyName, { id: j.guid.split("/").slice(-1)[0] + "-" + (j.companySlug || ""), title: j.title, location: loc, remote: true, desc: strip(j.description || ""), url: j.guid, apply: j.applicationLink, posted: new Date(j.pubDate * 1000).toISOString() },
      j.employmentType === "Intern" ? "intern" : (sen ?? (j.seniority || [])[0]) === "Entry-level" ? "entry" : undefined); };
  await agg("himalayas", async () => { let n = 0, fails = 0;
    for (const sen of ["Entry-level", "Mid-level"]) for (let page = 1; page <= (sen === "Entry-level" ? 50 : 15); page++) {
      let d: any; try { d = await get(`https://himalayas.app/jobs/api/search?country=IN&seniority=${sen}&page=${page}`); } catch (e: any) { console.log(`himalayas ${sen} p${page}: ERROR ${e.message} (skipped)`); if (++fails >= 4) throw e; continue; } if (!d.jobs?.length) break;
      for (const j of d.jobs) { n++; addH(j, sen); }
      await sleep(400); }
    // Search pages are cached snapshots of different ages, so a live job can fall between pages on any run
    // (Oct 24: 14 live roles incl. Writesonic, Synthlane vanished). Recheck last run's missing Himalayas jobs per company.
    const seen = new Set(jobs.filter((j) => j.source === "himalayas").map((j) => j.id));
    let prev: any[] = []; try { prev = JSON.parse(readFileSync("data/jobs.json", "utf8")).jobs || []; } catch {}
    // Himalayas listings stay up 60 days (expiryDate = pubDate + 60d); a 30-day cap dropped live Sun King SDE I (posted Sep 13) on Oct 25.
    const missing = prev.filter((j) => j.source === "himalayas" && !seen.has(j.id) && Date.now() - Date.parse(j.postedAt) < 60 * 864e5);
    let recovered = 0;
    for (const co of [...new Set(missing.map((j) => j.company as string))]) {
      let d: any; try { d = await get(`https://himalayas.app/jobs/api/search?country=IN&q=${encodeURIComponent(co)}`); } catch { continue; }
      for (const x of d.jobs || []) if (missing.some((m) => m.url === x.guid) && addH(x)) recovered++;
      await sleep(400); }
    console.log(`himalayas recheck: ${missing.length} missing from last run, ${recovered} still live and restored`);
    return n; });

  // Remotive public API
  await agg("remotive", async () => { let n = 0;
    for (const cat of ["software-dev", "ai-ml", "devops", "data"]) { const d = await get(`https://remotive.com/api/remote-jobs?category=${cat}`);
      for (const j of d.jobs) { n++; addAgg("remotive", j.company_name.trim(), { id: String(j.id), title: j.title, location: "Remote · " + j.candidate_required_location, remote: true, desc: strip(j.description || ""), url: j.url, apply: j.url, posted: new Date(j.publication_date + "Z").toISOString() }); } }
    return n; });

  // We Work Remotely RSS
  await agg("weworkremotely", async () => { let n = 0;
    for (const cat of ["remote-programming-jobs", "remote-full-stack-programming-jobs", "remote-back-end-programming-jobs", "remote-devops-sysadmin-jobs"]) {
      const r = await fetch(`https://weworkremotely.com/categories/${cat}.rss`, { signal: AbortSignal.timeout(30000) }); if (!r.ok) throw new Error(`${r.status}`); const xml = await r.text();
      for (const it of xml.split("<item>").slice(1)) { n++; const tag = (t: string) => (it.match(new RegExp(`<${t}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${t}>`)) || [])[1]?.trim() || "";
        const [co, ...rest] = tag("title").split(": "); const link = tag("link");
        addAgg("weworkremotely", decode(co), { id: link.split("/").pop() || link, title: decode(rest.join(": ")), location: "Remote · " + (tag("region") || ""), remote: true, desc: strip(tag("description")), url: link, apply: link, posted: new Date(tag("pubDate")).toISOString() }); } }
    return n; });

  // HN "Who is hiring?" — latest 2 threads via Algolia
  await agg("hn", async () => { let n = 0;
    const s = await get("https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&query=%22who%20is%20hiring%22&hitsPerPage=2");
    for (const st of s.hits) { const t = await get(`https://hn.algolia.com/api/v1/items/${st.objectID}`);
      for (const c of t.children || []) { if (!c.text) continue; n++; const txt = strip(c.text.replace(/<p>/gi, "\n<p>")); const first = txt.split("\n")[0];
        if (!/\bremote\b/i.test(first)) continue; const parts = first.split("|").map((x) => x.trim()); if (parts.length < 3) continue;
        const roles = parts.find((p, i) => i > 0 && /engineer|developer|scientist|intern|\bmts\b|member of technical staff|\bml\b|\bsre\b|devops/i.test(p)) || ""; if (!roles) continue;
        const locs = parts.filter((p) => p.length < 70 && /remote|onsite|hybrid|india|global|worldwide|anywhere|apac/i.test(p)).join(" · ");
        if (!/\bremote\b/i.test(locs) || !/india|global|worldwide|anywhere|apac/i.test(locs) || /onsite|hybrid/i.test(locs) && !/remote/i.test(locs)) continue;
        const head = txt.slice(0, 400); // level words often sit in the first paragraph, e.g. "One junior ML engineer"
        const titleLevel = /\binterns?\b|internship/i.test(head) ? "Intern" : /new grad|graduate/i.test(head) ? "New Grad" : /junior|entry[- ]level/i.test(head) ? "Junior" : "";
        const title = (titleLevel && !new RegExp(titleLevel, "i").test(roles) ? titleLevel + " " : "") + roles.slice(0, 90);
        addAgg("hn", parts[0].slice(0, 60), { id: String(c.id), title, location: locs, remote: true, desc: txt, url: `https://news.ycombinator.com/item?id=${c.id}`, apply: `https://news.ycombinator.com/item?id=${c.id}`, posted: c.created_at }); } }
    return n; });

  console.log(`staffing/consultancy blocklist removed: ${blocked}`);
  // Collapse duplicate postings of one role: same company + same title once a trailing "(...)" is dropped
  // (a plain title plus a "(...)" variant: Oscilar "Web SDK" vs "Web SDK (Brazil/Canada/UK/Poland/India)"), or same title + same location (Cloudflare reposts).
  // Keep the posting that names India in its location.
  { const base = (t: string) => t.toLowerCase().replace(/\s*\([^)]*\)\s*$/, "").replace(/[^a-z0-9]+/g, " ").trim();
    const groups = new Map<string, Job[]>();
    for (const j of jobs) { const k = j.companySlug + "|" + base(j.title); groups.set(k, [...(groups.get(k) || []), j]); }
    const drop = new Set<Job>();
    for (const g of groups.values()) { if (g.length < 2) continue;
      const variants = new Set(g.map((j) => j.title.trim().toLowerCase())).size > 1;
      const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (variants) { if (!g.some((j) => norm(j.title) === base(j.title))) continue; // "(Computer Vision)" vs "(Biometrics)" are different roles
        const keep = g.find((j) => /india/i.test(j.location)) || g[0]; g.forEach((j) => j !== keep && drop.add(j)); }
      else { const seen = new Set<string>(); for (const j of g) { const lk = j.location.toLowerCase(); if (seen.has(lk)) drop.add(j); else seen.add(lk); } } }
    if (drop.size) { console.log(`duplicate postings collapsed: ${drop.size}`); for (let i = jobs.length - 1; i >= 0; i--) if (drop.has(jobs[i])) jobs.splice(i, 1); } }
  jobs.sort((a, b) => (b.postedAt || "").localeCompare(a.postedAt || ""));
  mkdirSync("data", { recursive: true });
  writeFileSync("data/jobs.json", JSON.stringify({ fetchedAt: now, companiesScanned: COMPANIES.length, stats, jobs }, null, 0));
  console.log(`\nKept ${jobs.length} jobs from ${new Set(jobs.map((j) => j.company)).size} companies (scanned ${COMPANIES.length}).`);
}
main();
