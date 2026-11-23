import { NextRequest, NextResponse } from "next/server";
import { runContextualAnalysis } from "@/lib/server/contextual-analysis";
import { prepareExternalText } from "@/lib/privacy";
import { isLanguage, validateMessage } from "@/lib/types";

export const runtime = "nodejs";
const BODY_LIMIT = 32 * 1024;
const WINDOW_MS = 60_000;
const buckets = new Map<string, number>();
let windowStart = 0;
let requestCount = 0;

function claimAiSlot(client: string) {
  const now = Date.now();
  if (now - windowStart >= WINDOW_MS) {
    buckets.clear();
    requestCount = 0;
    windowStart = now;
  }
  const count = buckets.get(client) ?? 0;
  if (count >= 6 || requestCount >= 60) return false;
  buckets.set(client, count + 1);
  requestCount++;
  return true;
}

function json(value: object, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "no-store", ...(status === 429 ? { "Retry-After": "60" } : {}) },
  });
}

async function readBody(request: NextRequest): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > BODY_LIMIT) {
        await reader.cancel();
        throw new RangeError("bodyLimit");
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: NextRequest) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return json({ error: "origin" }, 403);
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") return json({ error: "contentType" }, 415);
  if (Number(request.headers.get("content-length")) > BODY_LIMIT) return json({ error: "tooLong" }, 413);
  let body: unknown;
  try {
    body = await readBody(request);
  } catch (error) {
    return error instanceof RangeError ? json({ error: "tooLong" }, 413) : json({ error: "invalid" }, 400);
  }
  if (!body || typeof body !== "object") return json({ error: "invalid" }, 400);
  const { message, language, consent } = body as Record<string, unknown>;
  const error = validateMessage(message);
  if (error || typeof message !== "string") return json({ error: error ?? "invalid" }, error === "tooLong" ? 413 : 400);
  if (!isLanguage(language) || consent !== true) return json({ error: "invalid" }, 400);
  if (!process.env.OPENAI_API_KEY?.trim()) return json({ error: "aiUnavailable" }, 503);
  // Vercel supplies this header at its edge. Self-hosted deployments should overwrite it at their proxy.
  const client = request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim().slice(0, 64) || "unknown";
  if (!claimAiSlot(client)) return json({ error: "rateLimit" }, 429);
  try {
    const context = await runContextualAnalysis(prepareExternalText(message), language);
    return context ? json({ context }) : json({ error: "aiUnavailable" }, 502);
  } catch {
    return json({ error: "aiUnavailable" }, 502);
  }
}
