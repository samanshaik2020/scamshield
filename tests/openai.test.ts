import assert from "node:assert/strict";
import { test } from "node:test";
import { runContextualAnalysis } from "../src/lib/server/contextual-analysis";

test("OpenAI SDK requests structured, non-stored output and rejects an invented quote", async (t) => {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "offline-contract-fixture";
  t.after(() => {
    if (previous === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previous;
  });
  const original = "Please share your OTP.";
  let phrase = "share your OTP";
  t.mock.method(globalThis, "fetch", async (url: RequestInfo | URL, init: RequestInit) => {
    assert.equal(new URL(String(url)).pathname, "/v1/responses");
    const request = JSON.parse(String(init.body));
    assert.equal(request.store, false);
    assert.equal(request.text.format.strict, true);
    assert.equal(JSON.parse(request.input).message, original);
    const output = { category: "credential", summary: "Check the request independently.", findings: [{ phrase, reason: "Keep codes private." }] };
    return Response.json({
      id: "test_response", object: "response", status: "completed",
      output: [{ type: "message", role: "assistant", status: "completed", content: [
        { type: "output_text", text: JSON.stringify(output), annotations: [] },
      ] }],
    });
  });
  assert.equal((await runContextualAnalysis(original, "en"))?.findings[0].start, 7);
  phrase = "an invented quotation";
  assert.equal(await runContextualAnalysis(original, "en"), null);
});
