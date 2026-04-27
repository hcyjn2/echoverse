import { NextResponse } from "next/server";

import { chatWith0GInference, type InferenceMessage } from "@/lib/inference-broker";

export const runtime = "nodejs";

function isValidMessage(value: unknown): value is InferenceMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const message = value as Record<string, unknown>;
  return (
    (message.role === "system" ||
      message.role === "user" ||
      message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messages?: unknown;
      model?: unknown;
    };

    if (
      !Array.isArray(body.messages) ||
      body.messages.length === 0 ||
      !body.messages.every(isValidMessage)
    ) {
      return NextResponse.json(
        { error: "Expected body.messages to be a non-empty chat message array." },
        { status: 400 }
      );
    }

    const result = await chatWith0GInference({
      messages: body.messages,
      model: typeof body.model === "string" ? body.model : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown inference error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
