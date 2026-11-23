import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/pro/route";
import { proRequest, validateProAnalysis } from "../src/lib/pro";
import { processPro } from "../src/lib/server/pro-service";
import { providerError } from "../src/lib/server/pro-providers";
import { analysisFixture, messageFixture } from "./pro-fixture";

const key = "test-only-key-canary";
const signal = () => new AbortController().signal;
const base = { provider: "groq", model: "example-text-model", acknowledged: true, apiKey: key } as const;
const url = "http://localhost:3000/api/pro";
function request(value: object, origin?: string) {
  return new NextRequest(url, { method: "POST", headers: {
    "Content-Type": "application/json", host: "localhost:3000", ...(origin ? { origin } : {}),
  }, body: JSON.stringify(value) });
}

test("Pro rejects arbitrary endpoints, invalid IDs, unsupported language and excess history", () => {
  const payload = { ...base, action: "analyze", message: messageFixture, language: "en" };
  assert.equal(proRequest.safeParse(payload).success, true);
  assert.equal(proRequest.safeParse({ ...payload, endpoint: "https://example.com" }).success, false);
  assert.equal(proRequest.safeParse({ ...payload, model: "https://example.com/test" }).success, false);
  assert.equal(proRequest.safeParse({ ...payload, language: "fr" }).success, false);
  assert.equal(proRequest.safeParse({ ...payload, action: "chat", question: "Why?", history: Array(5).fill({ role: "user", text: "Hi" }) }).success, false);
});

test("exact evidence and the result schema are enforced for every dimension", () => {
  assert.ok(validateProAnalysis(analysisFixture, messageFixture));
  assert.equal(validateProAnalysis({ ...analysisFixture, riskScore: 101 }, messageFixture), null);
  assert.equal(validateProAnalysis({ ...analysisFixture, summary: undefined }, messageFixture), null);
  assert.equal(validateProAnalysis({ ...analysisFixture, redFlags: [] }, messageFixture), null);
  for (const field of ["redFlags", "psychologicalTactics", "financialWarnings", "linkWarnings"] as const) {
    const template = field === "linkWarnings" ? analysisFixture.financialWarnings[0] : analysisFixture[field][0];
    assert.equal(validateProAnalysis({ ...analysisFixture, [field]: [{ ...template, quotedEvidence: "An invented phrase" }] }, messageFixture), null);
  }
});

test("route gates consent, keys, cross-site requests, body size and hosted Ollama without contacting providers", async (t) => {
  const upstream = t.mock.method(globalThis, "fetch", async () => { throw new Error("unexpected upstream"); });
  const models = { provider: "groq", acknowledged: true, action: "models" } as const;
  assert.equal((await (await POST(request(models))).json()).error, "key_required");
  assert.equal((await (await POST(request({ ...models, acknowledged: false, apiKey: key }))).json()).error, "consent_required");
  assert.equal((await POST(request(models, "https://example.org"))).status, 403);
  assert.equal((await POST(request({ ...models, apiKey: "x".repeat(90_000) }))).status, 413);
  assert.equal((await (await POST(request({ ...models, provider: "ollama" }))).json()).error, "local_disabled");
  assert.equal(upstream.mock.callCount(), 0);
});

test("Groq connection, analysis and chat use fixed endpoints, masked input and validated JSON", async (t) => {
  let call = 0;
  t.mock.method(globalThis, "fetch", async (resource: string, init: RequestInit) => {
    const address = new URL(resource);
    assert.equal(address.host, "api.groq.com");
    assert.equal(address.search, "");
    assert.equal(new Headers(init.headers).get("authorization"), "Bearer " + key);
    assert.equal(init.redirect, "error");
    if (address.pathname === "/openai/v1/models") return Response.json({ data: [{ id: "example-text-model" }, { id: "whisper-example" }] });
    assert.equal(address.pathname, "/openai/v1/chat/completions");
    const body = JSON.parse(String(init.body));
    assert.equal(body.model, base.model);
    assert.equal(body.response_format.type, "json_object");
    assert.doesNotMatch(body.messages[1].content, /test@example.org|778899/);
    const output = [{ ready: true }, analysisFixture, { answer: "Check your bank’s official contact details." }][call++];
    return Response.json({ choices: [{ message: { content: JSON.stringify(output) }, finish_reason: "stop" }], usage: { total_tokens: 125 } });
  });
  const listed = await processPro({ action: "models", provider: base.provider, acknowledged: true, apiKey: key }, signal(), false);
  assert.deepEqual(listed.models, [{ id: "example-text-model" }]);
  assert.equal((await processPro({ ...base, action: "test" }, signal(), false)).connected, true);
  const analysis = await processPro({ ...base, action: "analyze", language: "hi", message: messageFixture }, signal(), false);
  assert.equal(analysis.analysis?.analysisMode, "pro_ai");
  assert.equal(analysis.analysis?.usage?.total, 125);
  const chat = await processPro({ ...base, action: "chat", message: messageFixture, language: "te", question: "My OTP 778899", history: [] }, signal(), false);
  assert.match(chat.answer ?? "", /official/);
  assert.equal(call, 3);
});

test("Gemini SDK lists text generation models and returns a validated connection test", async (t) => {
  t.mock.method(globalThis, "fetch", async (resource: string, init: RequestInit) => {
    const address = new URL(resource);
    assert.equal(address.hostname, "generativelanguage.googleapis.com");
    assert.equal(new Headers(init.headers).get("x-goog-api-key"), key);
    assert.ok(!address.href.includes(key));
    if (!address.pathname.endsWith(":generateContent")) {
      return Response.json({ models: [
        { name: "models/gemini-fixture", supportedGenerationMethods: ["generateContent"] },
        { name: "models/embedding-fixture", supportedGenerationMethods: ["embedContent"] },
      ] });
    }
    const body = JSON.parse(String(init.body));
    assert.equal(body.generationConfig.responseMimeType, "application/json");
    assert.ok(body.generationConfig.responseJsonSchema);
    return Response.json({ candidates: [{ content: { role: "model", parts: [{ text: '{"ready":true}' }] }, finishReason: "STOP" }] });
  });
  const listed = await processPro({ action: "models", provider: "gemini", acknowledged: true, apiKey: key }, signal(), false);
  assert.equal(listed.models?.[0]?.id, "gemini-fixture");
  assert.equal(listed.models?.length, 1);
  assert.equal((await processPro({ ...base, provider: "gemini", model: "gemini-fixture", action: "test" }, signal(), false)).connected, true);
});

test("OpenAI uses the official Responses endpoint, disabled storage and strict schema", async (t) => {
  t.mock.method(globalThis, "fetch", async (resource: string, init: RequestInit) => {
    assert.equal(String(resource), "https://api.openai.com/v1/responses");
    const body = JSON.parse(String(init.body));
    assert.equal(body.store, false);
    assert.equal(body.text.format.strict, true);
    return Response.json({ id: "fixture", object: "response", status: "completed", output: [
      { type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: '{"ready":true}', annotations: [] }] },
    ] });
  });
  assert.equal((await processPro({ ...base, provider: "openai", action: "test" }, signal(), false)).connected, true);
});

test("Ollama reads locally installed models and confines inference to loopback", async (t) => {
  let generate = 0;
  t.mock.method(globalThis, "fetch", async (resource: string, init: RequestInit) => {
    const address = new URL(resource);
    assert.equal(address.origin, "http://127.0.0.1:11434");
    assert.equal(new Headers(init.headers).get("authorization"), null);
    if (address.pathname === "/api/tags") return Response.json({ models: [{ name: "example:1b" }, { name: "example:cloud" }] });
    if (address.pathname === "/api/show") return Response.json({ capabilities: ["completion"] });
    assert.equal(address.pathname, "/api/chat");
    assert.equal(JSON.parse(String(init.body)).stream, false);
    generate++;
    return Response.json({ done: true, done_reason: "stop", message: { content: '{"ready":true}' } });
  });
  const local = { provider: "ollama", acknowledged: false } as const;
  const listed = await processPro({ ...local, action: "models" }, signal(), true);
  assert.deepEqual(listed.models, [{ id: "example:1b" }]);
  assert.equal((await processPro({ ...local, model: "example:1b", action: "test" }, signal(), true)).connected, true);
  await assert.rejects(processPro({ ...local, model: "example:cloud", action: "test" }, signal(), true), /model_unavailable/);
  assert.equal(generate, 1);
});

test("provider errors and server logs never include credentials or raw upstream details", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ error: { message: key } }, { status: 401 }));
  const logs = ["log", "warn", "error", "debug", "info"] as const;
  const writers = logs.map((method) => t.mock.method(console, method, () => {}));
  const failed = await POST(request({ ...base, action: "test" }));
  assert.equal(failed.status, 401);
  assert.equal(failed.headers.get("cache-control"), "no-store");
  assert.deepEqual(await failed.json(), { error: "credentials", upstreamStatus: 401 });
  assert.ok(writers.every((writer) => writer.mock.calls.every(({ arguments: values }) => !JSON.stringify(values).includes(key))));
  assert.equal(providerError({ status: 429, code: "insufficient_quota" }, signal(), false).code, "quota");
  assert.equal(providerError({ status: 429 }, signal(), false).code, "rate_limited");
  assert.equal(providerError({ status: 404 }, signal(), false).code, "model_unavailable");
  assert.equal(providerError({ status: 503 }, signal(), false).code, "provider_unavailable");
  assert.equal(providerError(new Error("timeout"), AbortSignal.abort(), false).code, "timeout");
});
