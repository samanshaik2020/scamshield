import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeMessage, RISK_LABELS } from "../src/lib/analysis";
import { validateContext } from "../src/lib/context";
import { familyWarning } from "../src/lib/library";
import { SAMPLES } from "../src/lib/samples";
import { MAX_MESSAGE_LENGTH, validateMessage } from "../src/lib/types";

test("UPI sample finds the PIN request, reward and QR instruction", () => {
  const result = analyzeMessage(SAMPLES[0].message, "en");
  assert.equal(result.category, "upi");
  assert.ok(result.riskScore >= 50);
  for (const id of ["upi-pin", "reward", "link-instruction"]) {
    assert.ok(result.findings.some((finding) => finding.id === id));
  }
});

test("job sample detects the exact upfront fee, unusual pay and urgency", () => {
  const result = analyzeMessage(SAMPLES[1].message, "en");
  assert.equal(result.category, "job");
  assert.equal(result.riskLevel, "high");
  assert.equal(result.findings.find(({ id }) => id === "upfront-fee")?.phrase, "Pay ₹999 registration fee");
  assert.ok(result.findings.some(({ id }) => id === "job-income"));
  assert.ok(result.findings.some(({ id }) => id === "urgency"));
});

test("KYC phishing detects an OTP request, a threat, impersonation and a reference to a link", () => {
  const result = analyzeMessage(SAMPLES[2].message, "en");
  assert.equal(result.category, "kyc");
  assert.equal(result.riskLevel, "critical");
  for (const id of ["secret", "urgency", "kyc", "authority", "link-instruction"]) {
    assert.ok(result.findings.some((finding) => finding.id === id));
  }
  assert.ok(!result.findings.some(({ id }) => id === "url"));
});

test("routine messages and direct safety advice have no obvious warning signs", () => {
  for (const message of [SAMPLES[3].message, "Please never share your OTP. Avoid sending it by email.", "The police officer called to schedule a meeting."]) {
    const result = analyzeMessage(message, "en");
    assert.equal(result.category, "none");
    assert.equal(result.riskScore, 0);
    assert.match(result.summary, /unverified/);
  }
});

test("empty and non-string input fail validation", () => {
  assert.equal(validateMessage(" \n\t "), "empty");
  assert.equal(validateMessage({ message: "Hello" }), "invalid");
  assert.throws(() => analyzeMessage("", "en"), { name: "RangeError", message: "empty" });
});

test("the 5,000 character cap is inclusive", () => {
  assert.equal(validateMessage("x".repeat(MAX_MESSAGE_LENGTH)), null);
  assert.throws(() => analyzeMessage("x".repeat(MAX_MESSAGE_LENGTH + 1), "en"), /tooLong/);
});

test("duplicate demands and URLs do not inflate the score", () => {
  const message = "Share your OTP at https://bit.ly/example.";
  assert.equal(analyzeMessage(message, "en").riskScore, analyzeMessage((message + "\n").repeat(18), "en").riskScore);
});

test("scores stay within bounds when independent signals accumulate", () => {
  const combined = SAMPLES.slice(0, 3).map(({ message }) => message).join(" ");
  assert.equal(analyzeMessage(combined, "en").riskScore, 100);
  assert.equal(analyzeMessage("Hello there", "en").riskScore, 0);
});

test("evidence offsets reproduce exact original quotes across locales", () => {
  for (const { message } of SAMPLES) {
    const decorated = "🛡️ " + message.toUpperCase();
    for (const language of ["en", "hi", "te"] as const) {
      for (const finding of analyzeMessage(decorated, language).findings) {
        assert.equal(decorated.slice(finding.start, finding.end), finding.phrase);
      }
    }
  }
});

test("URL heuristics run without fetching, and a shortener alone yields low apparent risk", () => {
  const fetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error("Unexpected outgoing fetch"); };
  try {
    const short = analyzeMessage("Here is our album https://bit.ly/example.", "en");
    assert.equal(short.riskLevel, "low");
    assert.equal(short.findings[0].phrase, "https://bit.ly/example");
    assert.match(short.findings[0].reason, /legitimate/);
    assert.equal(analyzeMessage("Open http://192.0.2.2/account", "en").findings[0].id, "url");
    assert.equal(analyzeMessage("Open http://[2001:db8::1].", "en").findings[0].phrase, "http://[2001:db8::1]");
    assert.equal(analyzeMessage("See https://sbi-login.example.com/access", "en").findings[0].id, "url");
    assert.equal(analyzeMessage("Go to https://www.onlinesbi.sbi or https://www.npci.org.in/fraud-awareness", "en").riskScore, 0);
  } finally {
    globalThis.fetch = fetch;
  }
});

test("Hindi and Telugu requests return native-language findings and exact quotes", () => {
  const hindi = analyzeMessage("तुरंत अपना OTP बताएं।", "hi");
  const telugu = analyzeMessage("వెంటనే మీ UPI పిన్ నమోదు చేయండి.", "te");
  assert.equal(hindi.findings[0].phrase, "OTP बताएं");
  assert.equal(telugu.findings[0].phrase, "UPI పిన్ నమోదు చేయండి");
  assert.match(hindi.findings[0].title, /\p{Script=Devanagari}/u);
  assert.match(telugu.findings[0].title, /\p{Script=Telugu}/u);
  assert.match(RISK_LABELS[telugu.riskLevel].te, /\p{Script=Telugu}/u);
  assert.equal(analyzeMessage("明天请确认这条消息是否正确。", "en").limitedLanguage, true);
});

test("family warnings take only a category and language from analysis", () => {
  const original = "Asha +91 98765 43210 has code 827193. Pay registration fee to join.";
  const result = analyzeMessage(original, "en");
  const warning = familyWarning(result.category, "en");
  assert.match(warning, /Fake job offers/);
  assert.doesNotMatch(warning, /Asha|98765|827193|Pay registration fee/);
  assert.match(familyWarning(result.category, "te"), /\p{Script=Telugu}/u);
});

test("AI context validation rejects invented evidence and invalid categories", () => {
  const original = "Verify your KYC immediately.";
  const valid = { category: "kyc", summary: "An unexpected identity check warrants caution.", findings: [{ phrase: "Verify your KYC", reason: "Look up the bank independently." }] };
  assert.equal(validateContext(valid, original)?.findings[0].start, 0);
  assert.equal(validateContext({ ...valid, category: "illegal" }, original), null);
  assert.equal(validateContext({ ...valid, findings: [] }, original), null);
  assert.equal(validateContext({ ...valid, findings: [{ ...valid.findings[0], phrase: "Share your OTP" }] }, original), null);
});
