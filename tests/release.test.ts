import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeMessage } from "../src/lib/analysis";
import { prepareExternalText } from "../src/lib/privacy";
import { SAMPLES } from "../src/lib/samples";

test("all four sample scores reconcile with the displayed point contributions", () => {
  for (const { message } of SAMPLES) {
    const { riskScore, findings } = analyzeMessage(message, "en");
    assert.equal(riskScore, Math.min(100, findings.reduce((sum, finding) => sum + finding.points, 0)));
  }
});

test("generic payment language cannot establish the payment network", () => {
  const result = analyzeMessage("Please send money.", "en");
  assert.ok(result.findings.some(({ id }) => id === "payment"));
  assert.equal(result.category, "none");
});

test("indirect warnings about credentials are distinguished from an actual demand", () => {
  assert.equal(analyzeMessage("Our bank will never ask you to share your OTP.", "en").riskScore, 0);
  assert.equal(analyzeMessage("Never share your OTP or enter your password.", "en").riskScore, 0);
  const mixed = analyzeMessage("Never share your OTP. But send the OTP to me.", "en");
  assert.equal(mixed.findings[0].phrase, "send the OTP");
});

test("external text masks common identifiers and preserves original evidence offsets", () => {
  const message = "Call +91 98765 43210, email name@example.org or pay person@upi. Password: Example123 OTP 493028. Please share your OTP.";
  const external = prepareExternalText(message);
  assert.doesNotMatch(external, /98765|example\.org|person@upi|Example123|493028/);
  assert.equal(external.length, message.length);
  assert.equal(external.indexOf("share your OTP"), message.indexOf("share your OTP"));
  assert.equal(prepareExternalText(external), external);
  assert.equal(prepareExternalText(SAMPLES[0].message), SAMPLES[0].message);
  assert.doesNotMatch(prepareExternalText("734861 is your OTP."), /734861/);
});

test("digit-only input cannot establish language coverage", () => {
  assert.equal(analyzeMessage("12345", "en").limitedLanguage, true);
});
