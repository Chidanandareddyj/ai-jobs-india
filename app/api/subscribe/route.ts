import { subscribers } from "@/lib/db";
export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return Response.json({ message: "Please enter a valid email." }, { status: 400 });
  let added: boolean;
  try { added = await subscribers.add(email.trim().toLowerCase()); }
  catch (e) { console.error(e); return Response.json({ message: "Something went wrong. Please try again." }, { status: 500 }); }
  return Response.json({ message: added ? "You're subscribed. First digest lands soon." : "You're already subscribed." });
}
