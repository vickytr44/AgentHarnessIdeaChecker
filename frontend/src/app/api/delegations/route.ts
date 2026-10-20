import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch("http://localhost:5053/api/subagents/delegations", {
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ delegations: [] }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ delegations: [] });
  }
}

export async function DELETE() {
  try {
    const res = await fetch("http://localhost:5053/api/subagents/delegations", {
      method: "DELETE",
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: "Failed to clear delegations" }, { status: 500 });
  }
}
