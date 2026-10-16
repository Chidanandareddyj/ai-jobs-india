export const metadata = { title: "Post a remote job to Indian AI engineers" };
const plans = [
  { n: "Standard", inr: "4,999", usd: "59", f: ["30-day listing", "Appears on level & skill pages", "Indexed as JobPosting for Google"] },
  { n: "Featured", inr: "9,999", usd: "119", f: ["Everything in Standard", "Pinned for 7 days", "In the Monday digest"], tag: "Most chosen" },
  { n: "Five-pack", inr: "19,999", usd: "239", f: ["5 Featured listings", "Use within 6 months", "Invoice with GST"] },
];
export default function PostJob() {
  return (
    <div className="mx-auto max-w-[1360px] px-5 pt-8">
      <p className="label mb-3">For employers</p>
      <h1 className="max-w-[20ch] text-[34px] font-normal leading-[1.1] tracking-[-0.02em] sm:text-[42px]">Hire remote engineers from India, <span className="font-serif text-mute">without the noise.</span></h1>
      <p className="mt-3 max-w-[60ch] text-mute">Reach engineers who are specifically looking for remote AI, agents and developer-tools roles. Pricing below is provisional — checkout isn&apos;t live yet.</p>
      <div className="rule mt-10 grid border-t md:grid-cols-3">
        {plans.map((p, i) => (
          <section key={p.n} className={`rule flex flex-col gap-4 border-b py-6 md:border-b-0 md:px-6 ${i ? "md:border-l" : "md:pl-0"}`}>
            <div className="flex items-baseline justify-between"><h2 className="text-[15px] font-medium">{p.n}</h2>{p.tag && <span className="font-mono text-[10.5px] uppercase tracking-wider text-amber">{p.tag}</span>}</div>
            <p className="font-mono"><span className="text-[28px] tracking-tight">₹{p.inr}</span><span className="ml-2 text-faint">/ ${p.usd}</span></p>
            <ul className="space-y-1 text-mute">{p.f.map((x) => <li key={x}>— {x}</li>)}</ul>
            <button disabled className="btn mt-auto cursor-not-allowed justify-center text-faint">Checkout coming soon</button>
          </section>
        ))}
      </div>
      <p className="rule mt-0 border-t pt-4 font-mono text-[11px] text-faint">Early access: subscribe on the home page and we&apos;ll reach out first.</p>
    </div>
  );
}
