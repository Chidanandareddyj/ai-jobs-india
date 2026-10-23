export type Level = "intern" | "fresher" | "junior" | "mid" | "senior";
export const LEVELS: Level[] = ["intern", "fresher", "junior", "mid", "senior"];

const INDIA = /\b(india|bengaluru|bangalore|hyderabad|pune|mumbai|delhi|gurgaon|gurugram|noida|chennai|kolkata|ahmedabad)\b/i;
const APAC = /\b(apac|asia[- ]pacific|south asia)\b/i;
const WORLD = /\b(anywhere|worldwide|global(ly)?|any location|all locations|work from anywhere)\b/i;
const REGION_ONLY = /\b(us|usa|u\.s\.|united states|canada|north america|americas|emea|europe|eu|uk|united kingdom|germany|france|ireland|netherlands|spain|poland|latam|brazil|mexico|japan|australia|singapore|korea|israel|new york|san francisco|sf|seattle|london|toronto|berlin|paris)\b/i;
const DESC_WORLD = /(work from anywhere|anywhere in the world|fully remote,? (worldwide|globally)|hire (globally|worldwide|from anywhere)|remote[- ]first.{0,40}(worldwide|any country)|open to candidates (globally|worldwide))/i;
const DESC_US_ONLY = /(must (be|reside) (located |based )?in the (us|u\.s\.|united states)|us[- ]only|authorized to work in the (us|united states)|within the (us|united states)|us time ?zones? only|(candidates|applicants|those|people) (residing|located|based|living) in the (us|u\.s\.|united states)\b)/i;

const DESC_REGION_ONLY = /(available in the (emea|eu|europe|americas|us|north america|latam|uk) region only|(open|available) (only )?(to candidates )?(in|to) (the )?(emea|eu|europe|americas|us|north america|latam|uk)( region)? only)/i;
// WWR feeds tag big-company posts "Anywhere in the World" but put the real job location in "Headquarters:", e.g. "Remote - United States", "Portugal - Remote".
const WWR_HQ_REMOTE = /^\s*Headquarters:\s*([^\n]*)/i;
// "main location is between UTC-4 and UTC+4": India (UTC+5:30) is outside the window.
const DESC_TZ_WINDOW = /(locat\w*|based|reside\w*|liv\w*)[^.]{0,40}between\s*(?:utc|gmt)\s*([+\-−]\s*\d{1,2})(?::\d\d)?\s*(?:and|to|-|–)\s*(?:utc|gmt)\s*([+\-−]\s*\d{1,2})/i;
const DESC_SENIOR_EXP = /\b([4-9]|1\d)\+\s*(years|yrs)\s*(of\s*)?(production|professional|industry|relevant|hands-on|work|experience)/i;

export const ENG_TITLE = /\b(engineer|engineering|developer|programmer|scientist|sre|devops|ml|ai|machine learning|research(er)?|architect|sdet|full[- ]?stack|back[- ]?end|front[- ]?end|infrastructure|platform|security engineer|data engineer|forward deployed|solutions engineer|developer advocate|devrel|intern)\b/i;
const NON_ENG = /\b(recruit|sales|account executive|marketing|legal|counsel|finance|accountant|hr|people partner|office|executive assistant|designer|customer success manager|payroll|tax|accounting|gtm ai operations|paralegal|business development|director|vp|vice president|head of)\b/i;
const AI = /\b(ai|a\.i\.|llm|llms|machine learning|ml|deep learning|nlp|genai|generative|agent|agents|agentic|rag|inference|model training|pytorch|tensorflow|transformers?|computer vision|evals?|embeddings?|fine[- ]tun)/i;

const STACK: [string, RegExp][] = [
  ["python", /\bpython\b/i], ["typescript", /\btypescript\b/i], ["javascript", /\bjavascript\b|\bnode\.?js\b/i],
  ["react", /\breact\b/i], ["nextjs", /\bnext\.?js\b/i], ["go", /\b(golang|go\b(?= |,|\/))/], ["rust", /\brust\b/i],
  ["java", /\bjava\b(?!script)/i], ["kotlin", /\bkotlin\b/i], ["cpp", /c\+\+/i], ["kubernetes", /\bkubernetes|k8s\b/i],
  ["aws", /\baws\b/i], ["gcp", /\bgcp\b|google cloud/i], ["pytorch", /\bpytorch\b/i], ["llm", /\bllms?\b/i],
  ["sql", /\b(sql|postgres(ql)?|mysql)\b/i], ["ml", /machine learning|\bml\b/i], ["devops", /\bdevops|terraform|ci\/cd\b/i],
];

export interface Classified { remote: boolean; indiaEligible: boolean; indiaReason: string; level: Level; stack: string[]; ai: boolean; engineering: boolean }

export function classify(title: string, location: string, desc: string, remoteFlag: boolean, seniorityHint?: "intern" | "entry"): Classified {
  const loc = location || "";
  const remote = remoteFlag || /\bremote\b/i.test(loc) || /\b(fully|100%) remote\b/i.test(title);
  let indiaEligible = false, indiaReason = "no India/APAC/worldwide signal";
  if (INDIA.test(loc)) { indiaEligible = true; indiaReason = "location lists India"; }
  else if (APAC.test(loc)) { indiaEligible = true; indiaReason = "location lists APAC/Asia"; }
  else if (WORLD.test(loc)) { indiaEligible = true; indiaReason = "location says worldwide/anywhere"; }
  else if (loc.replace(/remote|[\s,·|()\-\/]|anywhere|fully|100%/gi, "") === "" && DESC_WORLD.test(desc) && !DESC_US_ONLY.test(desc)) { indiaEligible = true; indiaReason = "description says work from anywhere"; }
  if (indiaEligible && DESC_US_ONLY.test(desc) && !INDIA.test(loc)) { indiaEligible = false; indiaReason = "description restricts to US"; }

  const hq = desc.match(WWR_HQ_REMOTE)?.[1] ?? "";
  if (indiaEligible && /remote/i.test(hq) && hq.replace(/remote|[\s,·|()\-\/]/gi, "") !== "" && !/\b(india|apac|asia|anywhere|worldwide|global|world)\b/i.test(hq)) { indiaEligible = false; indiaReason = "listing says remote in another country"; }
  const tz = desc.match(DESC_TZ_WINDOW);
  if (indiaEligible && tz && !INDIA.test(loc)) { const n = (v: string) => parseInt(v.replace(/[\s−]/g, (c) => (c === "−" ? "-" : "")), 10); const lo = Math.min(n(tz[2]), n(tz[3])), hi = Math.max(n(tz[2]), n(tz[3])); if (5.5 < lo || 5.5 > hi) { indiaEligible = false; indiaReason = "time-zone window excludes India"; } }
  if (indiaEligible && DESC_REGION_ONLY.test(desc)) { indiaEligible = false; indiaReason = "description restricts region"; }
  if (indiaEligible && /\b(amer|americas|emea|us|usa|u\.s\.|north america|europe|eu|latam|uk)\b/i.test(title) && !/\b(apac|asia|india|global)\b/i.test(title)) { indiaEligible = false; indiaReason = "title restricts region"; }
  if (indiaEligible && !INDIA.test(loc + " " + title) && /\b(singapore|australia|japan|korea|china|indonesia|philippines|vietnam|new zealand|sweden|germany|brazil|canada|mexico)\b/i.test(title)) { indiaEligible = false; indiaReason = "title names another country"; }
  // Country codes in titles, e.g. Supabase "Customer Solution Architect (AU, NZ, SG)" (Oct 23)
  if (indiaEligible && !INDIA.test(loc + " " + title) && /\b(AU|AUS|ANZ|NZ|SG|JP|KR|HK)\b/.test(title)) { indiaEligible = false; indiaReason = "title names another country"; }
  // "APAC" roles pinned to a non-India APAC city, e.g. Fivetran "Remote, Australia, APAC · AUS - Sydney" (Oct 23)
  if (indiaEligible && indiaReason === "location lists APAC/Asia" && /\b(australia|aus|sydney|melbourne|new zealand|auckland|japan|tokyo|singapore|korea|seoul|hong kong)\b/i.test(loc)) { indiaEligible = false; indiaReason = "APAC role based in another country"; }
  // Language-locked roles, e.g. Supabase "Database Support Engineer (Japanese Speaking)": "Must be a fluent bilingual Japanese/English speaker" (Oct 23)
  const LANG = "(japanese|korean|mandarin|cantonese|german|french|spanish|portuguese|italian|dutch|arabic|turkish)";
  if (indiaEligible && (new RegExp(`\\b${LANG}[- ]speak(ing|er)\\b`, "i").test(title) || new RegExp(`(must|required|requires)[^.]{0,30}(fluent|native|bilingual)[^.]{0,30}\\b${LANG}\\b`, "i").test(desc.slice(0, 6000)))) { indiaEligible = false; indiaReason = "requires a non-English language"; }
  const t = title.toLowerCase();
  let level: Level = "mid";
  if (/\bintern(ship)?s?\b|\bco-?op\b|apprentice|trainee/.test(t)) level = "intern";
  else if (/new[- ]grad|graduate|fresher|entry[- ]level|\bentry\b|university|campus|early[- ]career|accelerator program|talent program|class of 202/.test(t)) level = "fresher";
  else if (/\b(junior|jr\.?|associate)\b|\b(engineer|developer|sde|swe)[ -]?(i|1)\b(?![i\d])|\bl1\b|\b(sde|swe)[ -]?1\b/.test(t)) level = "junior";
  else if (/\b(senior|sr\.?|staff|principal|lead|manager|head|director|architect|distinguished|vp)\b|\b(engineer|developer)[ -]?(iii|iv|3|4)\b/.test(t)) level = "senior";
  else if (/\b(0|1)\s*(-|–|to)\s*(1|2)\+?\s*years?\b/i.test(desc) || /\b(no (prior )?experience required|recent graduates?|new graduates?|freshers? (are )?welcome)\b/i.test(desc)) level = "junior";
  else if (seniorityHint === "entry") level = "junior";
  else if (seniorityHint === "intern") level = "intern";
  if (level !== "mid" && level !== "senior" && DESC_SENIOR_EXP.test(desc)) level = "mid"; // e.g. "intern" titles asking for 4+ years

  const hay = title + " " + desc.slice(0, 6000);
  const stack = STACK.filter(([, r]) => r.test(hay)).map(([k]) => k);
  const ai = AI.test(title) || (desc.match(new RegExp(AI.source, "gi"))?.length ?? 0) >= 3;
  const engineering = ENG_TITLE.test(title) && !NON_ENG.test(title);
  return { remote, indiaEligible, indiaReason, level, stack, ai, engineering };
}
