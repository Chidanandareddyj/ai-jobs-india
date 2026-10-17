export const metadata = { title: "Post a remote job to Indian AI engineers" };
const subject = "Featured job post — ai-jobs-india";
const body = `Hi,

I'd like to post a featured job on ai-jobs-india.

Company:
Role title:
Job link:
Remote from India (yes/no):

Thanks,
`;
const mailto = `mailto:chidanandareddyjonnala@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
const perks = ["Pinned at the top of the board for 30 days", "Included in the weekly Monday newsletter", "Appears on level & skill pages", "Indexed as JobPosting for Google"];
export default function PostJob() {
  return (
    <div className="mx-auto max-w-[1360px] px-5 pt-8">
      <p className="label mb-3">For employers</p>
      <h1 className="max-w-[20ch] text-[34px] font-normal leading-[1.1] tracking-[-0.02em] sm:text-[42px]">Hire remote engineers from India, <span className="font-serif text-mute">without the noise.</span></h1>
      <p className="mt-3 max-w-[60ch] text-mute">Reach engineers who are specifically looking for remote AI, agents and developer-tools roles. One offer, no tiers.</p>
      <div className="rule mt-10 grid border-t md:grid-cols-2">
        <section className="rule flex flex-col gap-4 border-b py-6 md:border-b-0 md:pr-6">
          <div className="flex items-baseline justify-between"><h2 className="text-[15px] font-medium">Featured post</h2><span className="font-mono text-[10.5px] uppercase tracking-wider text-amber">30 days</span></div>
          <p className="font-mono"><span className="text-[28px] tracking-tight">$49</span><span className="ml-2 text-faint">/ ≈₹4,000</span></p>
          <ul className="space-y-1 text-mute">{perks.map((x) => <li key={x}>— {x}</li>)}</ul>
          <a href={mailto} className="btn mt-auto justify-center">Email to post a job →</a>
        </section>
        <section className="rule flex flex-col gap-3 py-6 md:border-l md:px-6">
          <p className="label">Launch note</p>
          <p className="max-w-[44ch] text-[17px] leading-snug"><span className="font-serif">First post free</span> for early companies.</p>
          <p className="max-w-[48ch] text-mute">Send the company, role title, job link and confirm the role is open to people working remotely from India. We&apos;ll reply within a day.</p>
        </section>
      </div>
      <p className="rule mt-0 border-t pt-4 font-mono text-[11px] text-faint">Questions? chidanandareddyjonnala@gmail.com</p>
    </div>
  );
}
