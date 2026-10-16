import Link from "next/link";
import { facets } from "@/lib/db";
export default function Filters({ sp }: { sp: Record<string, string | undefined> }) {
  const f = facets(); const entryN = f.levels.filter(([l]) => ["intern", "fresher", "junior"].includes(l)).reduce((a, [, n]) => a + n, 0);
  const href = (level?: string) => { const p = new URLSearchParams(Object.entries({ ...sp, level }).filter(([, v]) => v) as [string, string][]); const s = p.toString(); return s ? `/?${s}` : "/"; };
  const row = (key: string | undefined, name: string, n: number) => {
    const on = (sp.level || undefined) === key;
    return <li key={name}><Link href={href(key)} className={`flex justify-between py-1 ${on ? "text-ink" : "text-mute hover:text-ink"}`}><span>{on ? "■ " : "□ "}{name}</span><span className="font-mono text-[11px] text-faint">{n}</span></Link></li>;
  };
  return (
    <div className="space-y-6">
      <div><p className="label mb-1.5">Level</p><ul>{row(undefined, "All levels", f.levels.reduce((a, [, n]) => a + n, 0))}{row("entry", "Entry (intern–junior)", entryN)}{f.levels.map(([l, n]) => row(l, l[0].toUpperCase() + l.slice(1), n))}</ul></div>
      <form method="get" action="/" className="space-y-3">
        {sp.level && <input type="hidden" name="level" value={sp.level} />}
        <div><label className="label mb-1.5 block" htmlFor="q">Search</label><input id="q" name="q" defaultValue={sp.q} placeholder="Title or company" className="field" /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label mb-1.5 block" htmlFor="stack">Stack</label><select id="stack" name="stack" defaultValue={sp.stack || ""} className="field"><option value="">Any</option>{f.stacks.map(([s, n]) => <option key={s} value={s}>{s} · {n}</option>)}</select></div>
          <div><label className="label mb-1.5 block" htmlFor="company">Company</label><select id="company" name="company" defaultValue={sp.company || ""} className="field"><option value="">Any</option>{f.companies.map(([c, n]) => <option key={c} value={c}>{c} · {n}</option>)}</select></div>
        </div>
        <label className="flex items-center gap-2 text-mute"><input type="checkbox" name="ai" value="1" defaultChecked={sp.ai === "1"} className="accent-amber" /> AI / ML roles only</label>
        <div className="flex gap-1.5"><button className="btn btn-primary">Apply filters</button><Link href="/" className="btn text-mute">Reset</Link></div>
      </form>
    </div>
  );
}
