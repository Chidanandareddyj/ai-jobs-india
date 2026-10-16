import type { MetadataRoute } from "next"; import { facets, jobs, SITE } from "@/lib/db";
export default function sitemap(): MetadataRoute.Sitemap {
  const f = facets();
  return [{ url: SITE.url, changeFrequency: "daily", priority: 1 }, { url: `${SITE.url}/post-a-job` },
    ...[...f.levels.map(([l]) => l), "entry", ...f.stacks.map(([s]) => s)].map((x) => ({ url: `${SITE.url}/remote-ai-jobs-india/${x}`, changeFrequency: "daily" as const })),
    ...jobs.all().map((j) => ({ url: `${SITE.url}/jobs/${j.slug}`, lastModified: j.postedAt }))];
}
