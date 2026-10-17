import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import "./globals.css";
import { SITE } from "@/lib/db";
const sans = localFont({ src: [{ path: "./fonts/inter-tight-latin-400-normal.woff2", weight: "400", style: "normal" }, { path: "./fonts/inter-tight-latin-500-normal.woff2", weight: "500", style: "normal" }, { path: "./fonts/inter-tight-latin-600-normal.woff2", weight: "600", style: "normal" }], variable: "--font-inter-tight", display: "swap" });
const serif = localFont({ src: "./fonts/instrument-serif-latin-400-italic.woff2", weight: "400", style: "italic", variable: "--font-instrument", display: "swap" });
const mono = localFont({ src: [{ path: "./fonts/jetbrains-mono-latin-400-normal.woff2", weight: "400", style: "normal" }, { path: "./fonts/jetbrains-mono-latin-500-normal.woff2", weight: "500", style: "normal" }], variable: "--font-jetbrains", display: "swap" });
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url), title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: "Curated remote AI, LLM, agents and developer-tools engineering jobs open to candidates in India. Fresher and junior filters.",
  openGraph: { siteName: SITE.name, type: "website" },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}><body className="min-h-screen font-sans text-[13px] leading-relaxed antialiased">
      <header className="rule border-b"><div className="mx-auto flex h-12 max-w-[1360px] items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-medium tracking-tight">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="text-amber"><g fill="currentColor">{[0, 5, 10].flatMap((x) => [0, 5, 10].map((y) => <rect key={`${x}${y}`} x={x} y={y} width={x === 5 && y === 5 ? 4 : 2} height={x === 5 && y === 5 ? 4 : 2} />))}</g></svg>
          remote.ai<span className="text-mute">/india</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/remote-ai-jobs-india/entry" className="hidden px-2 text-mute hover:text-ink sm:block">Entry-level</Link>
          <Link href="/remote-ai-jobs-india/python" className="hidden px-2 text-mute hover:text-ink sm:block">Python</Link>
          <Link href="/remote-ai-jobs-india/llm" className="hidden px-2 text-mute hover:text-ink sm:block">LLM</Link>
          <Link href="/post-a-job" className="btn ml-2"><span className="text-mute">+</span> Post a job</Link>
        </nav>
      </div></header>
      {children}
      <footer className="rule mt-16 border-t"><div className="mx-auto flex max-w-[1360px] flex-col justify-between gap-2 px-5 py-6 font-mono text-[11px] text-faint sm:flex-row">
        <span>Sourced from public Greenhouse, Lever &amp; Ashby boards. Verify eligibility on the original posting.</span>
        <span><Link href="/sitemap.xml" className="hover:text-ink">sitemap</Link> · <Link href="/post-a-job" className="hover:text-ink">hire</Link></span>
      </div></footer>
    </body></html>
  );
}
