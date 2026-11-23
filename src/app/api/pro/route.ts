import { NextRequest, NextResponse } from "next/server";
import { proRequest } from "@/lib/pro";
import { ProError, providerError } from "@/lib/server/pro-providers";
import { processPro } from "@/lib/server/pro-service";

export const runtime = "nodejs";
export const maxDuration = 60;
const MAX_BYTES = 80 * 1024;
const clients = new Map<string, number>();
let windowStart = 0;
let total = 0;

function reserve(client: string) {
  const now = Date.now();
  if (now - windowStart >= 60_000) {
    clients.clear();
    total = 0;
    windowStart = now;
  }
  const count = clients.get(client) ?? 0;
  if (count >= 20 || total >= 120) return false;
  clients.set(client, count + 1);
  total++;
  return true;
}

function reply(data: object, status = 200) {
  return NextResponse.json(data, { status, headers: {
    "Cache-Control": "no-store", ...(status === 429 ? { "Retry-After": "60" } : {}),
  } });
}

async function readRequest(request: NextRequest) {
  const reader = request.body?.getReader();
  if (!reader) throw new ProError("invalid_request");
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let content = "";
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_BYTES) {
        await reader.cancel();
        throw new ProError("too_large", 413);
      }
      content += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(content + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const site = request.headers.get("sec-fetch-site");
  const loopback = Boolean(host && /^(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(host));
  const sameOrigin = !origin || origin === "https://" + host || (loopback && origin === "http://" + host);
  if (site === "cross-site" || site === "same-site" || !sameOrigin) {
    return reply({ error: "origin" }, 403);
  }
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return reply({ error: "invalid_request" }, 415);
  }
  if (Number(request.headers.get("content-length")) > MAX_BYTES) return reply({ error: "too_large" }, 413);
  const parsed = await readRequest(request).then((value) => proRequest.safeParse(value), (error: unknown) =>
    error instanceof ProError ? error : new ProError("invalid_request"));
  if (parsed instanceof ProError) return reply({ error: parsed.code }, parsed.status);
  if (!parsed.success) return reply({ error: "invalid_request" }, 400);
  const client = request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim().slice(0, 64) || "anonymous";
  if (!reserve(client)) return reply({ error: "app_rate_limited" }, 429);

  const localAllowed = process.env.NODE_ENV === "development" && process.env.SCAMSHIELD_ENABLE_OLLAMA === "true" &&
    loopback && origin === "http://" + host;
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(parsed.data.provider === "ollama" ? 55_000 : 35_000)]);
  try {
    return reply(await processPro(parsed.data, signal, localAllowed));
  } catch (error) {
    const safe = providerError(error, signal, parsed.data.provider === "ollama");
    return reply({ error: safe.code, upstreamStatus: safe.upstreamStatus }, safe.status);
  }
}
