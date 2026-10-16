import { notFound } from "next/navigation"; import Link from "next/link"; import type { Metadata } from "next";
import { jobs } from "@/lib/db"; import { ago, shortLoc } from "@/components/JobList";
export const dynamicParams = false;
export function generateStaticParams() { return jobs.all().map((j) => ({ slug: j.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const j = jobs.bySlug((await params).slug); if (!j) return {};
  return { title: `${j.title} at ${j.company} (Remote, India)`, description: j.description.slice(0, 155), alternates: { canonical: `/jobs/${j.slug}` } };
}
export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const j = jobs.bySlug((await params).slug); if (!j) notFound();
  const ld = { "@context": "https://schema.org", "@type": "JobPosting", title: j.title, datePosted: j.postedAt, hiringOrganization: { "@type": "Organization", name: j.company }, jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: "India" }, description: j.description.slice(0, 5000) };
  const spec: [string, React.ReactNode][] = [["Company", j.company], ["Level", <Link key="l" href={`/remote-ai-jobs-india/${j.level}`} className="underline decoration-line underline-offset-4 hover:decoration-ink">{j.level}</Link>], ["Location", shortLoc(j.location)], ["Eligibility", j.indiaReason], ["Team", j.department || "—"], ["Posted", j.postedAt ? `${new Date(j.postedAt).toISOString().slice(0, 10)} (${ago(j.postedAt)})` : "—"], ["Source", j.source]];
  return (
    <article className="mx-auto max-w-[1360px] px-5 pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <nav className="label mb-8"><Link href="/" className="hover:text-ink">Jobs</Link> / <Link href={`/?company=${encodeURIComponent(j.company)}`} className="hover:text-ink">{j.company}</Link></nav>
      <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <p className="mb-2 text-mute">{j.company}</p>
          <h1 className="max-w-[22ch] text-[34px] font-normal leading-[1.08] tracking-[-0.025em] sm:text-[42px]">{j.title}</h1>
          <div className="mt-4 flex flex-wrap gap-x-3 font-mono text-[11px] text-faint">{j.stack.map((s) => <Link key={s} href={`/remote-ai-jobs-india/${s}`} className="hover:text-ink">#{s}</Link>)}</div>
          <div className="rule mt-8 max-w-[68ch] whitespace-pre-line border-t pt-8 text-[15px] leading-[1.7] text-ink/80">{j.description}</div>
        </div>
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <dl className="rule border-t">{spec.map(([k, v]) => <div key={k} className="rule grid grid-cols-[96px_1fr] gap-3 border-b py-2.5"><dt className="label pt-0.5">{k}</dt><dd>{v}</dd></div>)}</dl>
          <a href={j.applyUrl} target="_blank" rel="noopener nofollow" className="btn btn-primary mt-5 h-10 w-full justify-center text-[13px]">Apply on {j.company} ↗</a>
          <p className="mt-2 font-mono text-[11px] text-faint">Opens the original posting.</p>
        </aside>
      </div>
    </article>
  );
}
