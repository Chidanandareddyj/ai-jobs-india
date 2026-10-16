import JobList, { ago } from "@/components/JobList"; import Filters from "@/components/Filters"; import Newsletter from "@/components/Newsletter";
import { filter, jobs } from "@/lib/db";
export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams; const list = filter(sp); const all = jobs.all(); const cos = new Set(all.map((j) => j.company)).size;
  return (
    <div className="mx-auto grid max-w-[1360px] gap-5 px-5 pt-6 lg:gap-10 lg:pt-8 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-5 lg:space-y-8 lg:sticky lg:top-6 lg:self-start">
        <div className="space-y-4">
          <h1 className="text-[30px] font-normal leading-[1.1] tracking-[-0.02em]">Remote AI &amp; dev-tools jobs, <span className="font-serif text-[34px] text-mute">open to India.</span></h1>
          <p className="text-mute">Engineering roles at <span className="text-ink">{cos} AI and developer-tools companies</span> that are remote and explicitly hire from India, APAC or anywhere.</p>
          <p className="text-mute">Every listing is checked against its location rules. US-only and EU-only roles never make it here.</p>
        </div>
        <details className="rule border-y py-3 lg:hidden"><summary className="label flex cursor-pointer list-none justify-between"><span>Filters{sp.level || sp.stack || sp.company || sp.q ? " · active" : ""}</span><span>+</span></summary><div className="pt-4"><Filters sp={sp} /></div></details>
        <div className="hidden space-y-8 lg:block">
        <dl className="rule grid grid-cols-3 border-y py-3 font-mono">
          <div><dt className="label">Roles</dt><dd className="text-[20px]">{all.length}</dd></div>
          <div><dt className="label">Cos</dt><dd className="text-[20px]">{cos}</dd></div>
          <div><dt className="label">Updated</dt><dd className="text-[20px]">{ago(jobs.fetchedAt())}</dd></div>
        </dl>
        <Filters sp={sp} />
        <Newsletter />
        </div>
      </aside>
      <section>
        <div className="mb-3 flex items-baseline justify-between"><h2 className="text-[15px] font-medium">{sp.level === "entry" ? "Entry-level roles" : sp.level ? `${sp.level[0].toUpperCase()}${sp.level.slice(1)} roles` : "All roles"}</h2><span className="font-mono text-[11px] text-faint">{list.length} / {all.length}</span></div>
        <JobList jobs={list} />
        <div className="rule mt-10 border-t pt-6 lg:hidden"><Newsletter /></div>
      </section>
    </div>
  );
}
