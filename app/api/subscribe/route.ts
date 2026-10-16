import { subscribers } from "@/lib/db";
export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return Response.json({ message: "Please enter a valid email." }, { status: 400 });
  const added = await subscribers.add(email.trim().toLowerCase());
  return Response.json({ message: added ? "You're subscribed. First digest lands Monday." : "You're already subscribed." });
}
