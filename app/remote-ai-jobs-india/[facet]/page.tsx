import { notFound } from "next/navigation"; import type { Metadata } from "next"; import Link from "next/link";
import JobList from "@/components/JobList"; import { facets, filter, isLevel } from "@/lib/db";
export const dynamicParams = false;
export function generateStaticParams() { const f = facets(); return [...f.levels.map(([l]) => l), "entry", ...f.stacks.map(([s]) => s)].map((facet) => ({ facet })); }
const label = (f: string) => f === "entry" ? "Fresher & Junior" : f[0].toUpperCase() + f.slice(1);
export async function generateMetadata({ params }: { params: Promise<{ facet: string }> }): Promise<Metadata> {
  const f = (await params).facet; return { title: `Remote ${label(f)} AI Jobs in India`, description: `Remote ${label(f)} AI, agents and dev-tools engineering jobs open to candidates in India.`, alternates: { canonical: `/remote-ai-jobs-india/${f}` } };
}
export default async function Facet({ params }: { params: Promise<{ facet: string }> }) {
  const f = (await params).facet; const lvl = isLevel(f) || f === "entry"; const list = lvl ? filter({ level: f }) : filter({ stack: f });
  if (!list.length && !lvl) notFound();
  const fc = facets(); const chips = [["entry", 0] as [string, number], ...fc.levels, ...fc.stacks.slice(0, 14)];
  return (
    <div className="mx-auto max-w-[1360px] px-5 pt-8">
      <p className="label mb-3"><Link href="/" className="hover:text-ink">Jobs</Link> / {lvl ? "Level" : "Skill"}</p>
      <h1 className="text-[34px] font-normal leading-[1.1] tracking-[-0.02em] sm:text-[42px]">Remote {label(f)} jobs <span className="font-serif text-mute">for engineers in India.</span></h1>
      <p className="mt-3 max-w-[60ch] text-mute">{list.length} {lvl ? `${label(f).toLowerCase()}-level` : f} roles at AI and developer-tools companies, remote and open to India-based candidates.</p>
      <div className="mt-6 mb-8 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px]">{chips.map(([x]) => <Link key={x} href={`/remote-ai-jobs-india/${x}`} className={x === f ? "text-amber" : "text-faint hover:text-ink"}>{x === f ? "■" : "□"} {x}</Link>)}</div>
      <JobList jobs={list} />
    </div>
  );
}
