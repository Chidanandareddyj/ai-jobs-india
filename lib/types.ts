import type { Level } from "./classify";
export interface Job {
  id: string; slug: string; company: string; companySlug: string; source: string; title: string; location: string;
  department?: string; url: string; applyUrl: string; postedAt?: string; description: string; descriptionHtml?: string;
  level: Level; stack: string[]; ai: boolean; indiaReason: string; fetchedAt: string;
}
