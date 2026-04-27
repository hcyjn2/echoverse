import { NextResponse } from "next/server";

import { writeKV } from "@/lib/0g-kv";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const walletAddress =
      typeof body.walletAddress === "string" ? body.walletAddress.trim() : "";

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: "walletAddress must be a valid EVM address." },
        { status: 400 }
      );
    }

    const key = `onboarding:${walletAddress.toLowerCase()}`;
    const tx = await writeKV(
      key,
      JSON.stringify({
        ...body,
        walletAddress,
        savedAt: new Date().toISOString(),
      })
    );

    return NextResponse.json({ key, tx });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown onboarding error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
