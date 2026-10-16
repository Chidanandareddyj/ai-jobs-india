import Link from "next/link";
import type { Job } from "@/lib/types";
export function ago(d?: string) { if (!d) return "—"; const days = Math.floor((Date.now() - +new Date(d)) / 864e5); return days <= 0 ? "today" : days < 30 ? `${days}d` : `${Math.floor(days / 30)}mo`; }
export const shortLoc = (l: string) => [...new Set(l.split(/\s*[·;]\s*/))].slice(0, 2).join(" · ");
const entry = (l: string) => ["intern", "fresher", "junior"].includes(l);
export default function JobList({ jobs }: { jobs: Job[] }) {
  if (!jobs.length) return <p className="rule border-t py-16 text-mute">Nothing matches these filters. <Link href="/" className="text-ink underline underline-offset-4">Clear them</Link>.</p>;
  return (
    <ol className="rule border-t">
      <li className="label hidden grid-cols-[40px_1fr_220px_150px_44px] gap-4 py-2 md:grid" aria-hidden><span>#</span><span>Role</span><span>Location</span><span>Level / stack</span><span className="text-right">Age</span></li>
      {jobs.map((j, i) => (
        <li key={j.id} className="rule border-t">
          <Link href={`/jobs/${j.slug}`} className="group grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-3 md:grid-cols-[40px_1fr_220px_150px_44px] md:items-baseline">
            <span className="hidden font-mono text-[11px] text-faint md:block">{String(i + 1).padStart(3, "0")}</span>
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-medium text-ink/90 group-hover:text-ink">{j.title}<span className="ml-1.5 inline-block -translate-x-1 text-amber opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">→</span></span>
              <span className="text-mute">{j.company}{j.ai && <span className="ml-2 font-mono text-[10.5px] text-faint">AI</span>}</span>
            </span>
            <span className="order-last col-span-2 truncate text-faint md:order-none md:col-span-1 md:text-mute">{shortLoc(j.location)}</span>
            <span className="hidden truncate font-mono text-[11px] md:block"><span className={entry(j.level) ? "text-amber" : "text-ink/70"}>{j.level}</span><span className="text-faint"> {j.stack.slice(0, 2).join(" ")}</span></span>
            <span className="text-right font-mono text-[11px] text-faint"><span className={`md:hidden ${entry(j.level) ? "text-amber" : ""}`}>{j.level} · </span>{ago(j.postedAt)}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
