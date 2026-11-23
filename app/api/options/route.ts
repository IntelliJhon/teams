import { NextResponse } from "next/server";
import { n8nAdmin } from "@/lib/adminAuth";

/** Branches and marketing team names for the order form dropdowns (managed in the admin panel) */
export async function GET() {
  const { base } = n8nAdmin();
  try {
    const resp = await fetch(`${base}/teams-options`, { cache: "no-store" });
    const data = await resp.json().catch(() => ({}));
    const list = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()) : []);
    return NextResponse.json({ branches: list(data?.branches), marketing: list(data?.marketing) });
  } catch (err) {
    console.error("[Options] load failed:", err);
    return NextResponse.json({ branches: [], marketing: [] });
  }
}
