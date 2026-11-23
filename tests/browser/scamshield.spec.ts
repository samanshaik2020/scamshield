import { expect, test } from "@playwright/test";
import { SAMPLES } from "../../src/lib/samples";
import { analyzeMessage } from "../../src/lib/analysis";

test("all four sample buttons match manually analyzing their text", async ({ page }) => {
  await page.goto("/");
  for (const [index, sample] of SAMPLES.entries()) {
    const computed = analyzeMessage(sample.message, "en");
    await page.locator(".sample-item").nth(index).click();
    const results = page.locator("#results");
    await expect(results.locator(".risk-ring-inner strong")).toHaveText(String(computed.riskScore));
    await expect(results.locator(".finding")).toHaveCount(computed.findings.length);
    const quotes = computed.findings.map(f => f.phrase);
    await expect(results.locator(".finding q")).toHaveText(quotes);
    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await page.locator("#message").fill(sample.message);
    await page.getByRole("button", { name: "Analyze Message", exact: true }).click();
    await expect(results.locator(".risk-ring-inner strong")).toHaveText(String(computed.riskScore));
    await expect(results.locator(".finding q")).toHaveText(quotes);
  }
});

test("editing clears stale results and checklists restart for the next message", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try Live Demo" }).click();
  const first = page.locator(".step-choice input").first();
  await first.check();
  await expect(first).toBeChecked();
  await page.locator("#message").fill("Changed text");
  await expect(page.locator("#results")).toHaveCount(0);
  await expect(page.locator("#warning-topic")).toHaveValue("none");
  await page.locator(".sample-item").first().click();
  await expect(first).not.toBeChecked();
});

test("the toolkit link reopens the analysis topic after independent toolkit use", async ({ page }) => {
  await page.goto("/");
  await page.locator(".sample-item").first().click();
  await page.locator("#warning-topic").selectOption("job");
  await page.locator("#results").getByRole("link", { name: "Open Family Toolkit" }).click();
  await expect(page.locator("#warning-topic")).toHaveValue("upi");
});

test("unsupported text shows a coverage limitation instead of a reassuring score", async ({ page }) => {
  await page.goto("/");
  await page.locator("#message").fill("明天请确认这条消息是否正确。");
  await page.getByRole("button", {name:"Analyze Message",exact:true}).click();
  await expect(page.locator(".risk-copy h3")).toHaveText("Insufficient text coverage");
  await expect(page.locator(".risk-ring-inner strong")).toHaveText("—");
});

test("live demo opens real results with highlighted evidence and expandable reasons", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try Live Demo" }).click();
  const results = page.locator("#results");
  await expect(results.getByRole("heading", { name: "Analysis results" })).toBeFocused();
  await expect(results.getByText("Rule-based analysis", { exact: true })).toBeVisible();
  await expect(results.locator("mark").filter({ hasText: "enter your UPI PIN" })).toBeVisible();
  await results.locator("summary").filter({ hasText: "UPI PIN request" }).click();
  await expect(results.getByText("A UPI PIN authorizes an outgoing payment.", { exact: false })).toBeVisible();
  await expect(results.getByRole("link", { name: "Financial cyber fraud helpline" })).toHaveAttribute("href", "tel:1930");
});

test("samples, empty validation, long input and clear all work", async ({ page }) => {
  await page.goto("/");
  const run = page.getByRole("button", { name: "Analyze Message", exact: true });
  const message = page.getByRole("textbox", { name: "Suspicious message" });
  await run.click();
  await expect(page.getByRole("alert").filter({ hasText: "Paste a message or choose a sample" })).toBeVisible();
  await message.fill("x".repeat(5001));
  await expect(page.getByRole("alert").filter({ hasText: "Shorten the message" })).toBeVisible();
  for (const [name, sample] of [["Fake Job Offer", SAMPLES[1]], ["Bank KYC Scam", SAMPLES[2]], ["Normal Message", SAMPLES[3]]] as const) {
    await page.getByRole("button", { name: new RegExp(name) }).click();
    await expect(message).toHaveValue(sample.message);
    await expect(page.locator("#results")).toContainText(sample.message);
  }
  await expect(page.getByRole("heading", { name: "Low apparent risk" })).toBeVisible();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(message).toHaveValue("");
  await expect(page.locator("#results")).toHaveCount(0);
});

test("language preferences survive reload while the message does not", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Bank KYC Scam/ }).click();
  const select = page.locator(".header-language select");
  await select.selectOption("hi");
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await expect(page.locator("#results")).toContainText("गोपनीय जानकारी की माँग");
  await expect(page.locator("#results")).toContainText("share the OTP");
  await page.reload();
  await expect(select).toHaveValue("hi");
  await expect(page.locator("#message")).toHaveValue("");
  await select.selectOption("te");
  await expect(page.locator("html")).toHaveAttribute("lang", "te");
  await expect(page.getByRole("button", { name: "సందేశం తనిఖీ చేయండి" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => window.innerWidth),
  );
});

test("library search and family copy use localized, privacy-safe text", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByRole("searchbox", { name: "Search scam types…" }).fill("investment");
  const library = page.locator("#library");
  await expect(library.locator("details")).toHaveCount(1);
  await library.locator("summary").click();
  await expect(library.getByText("Guaranteed profit, daily returns", { exact: false })).toBeVisible();
  const message = page.locator("#message");
  await message.fill("Asha, contact 9876543210. Pay registration fee to join.");
  await page.getByRole("button", { name: "Analyze Message", exact: true }).click();
  const toolkit = page.locator("#family");
  await expect(toolkit.getByLabel("Warning topic")).toHaveValue("job");
  await toolkit.getByLabel("Warning language").selectOption("te");
  await toolkit.getByRole("button", { name: "Copy warning" }).click();
  await expect(page.getByRole("status")).toContainText("Copied to clipboard");
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain("కుటుంబ భద్రతా సూచన");
  expect(clip).not.toMatch(/Asha|9876543210/);
});

test("rule-based analysis does not call the backend or render submitted markup or URLs as links", async ({ page }) => {
  let outbound = 0;
  await page.route(/\/api\/analyze|bit\.ly/, async (route) => { outbound++; await route.abort(); });
  await page.goto("/");
  await page.locator("#message").fill("<img src='bad' onerror='alert(1)'> Share your OTP at https://bit.ly/test.");
  await page.getByRole("button", { name: "Analyze Message", exact: true }).click();
  const original = page.locator(".evidence-text");
  await expect(original).toContainText("<img src='bad' onerror='alert(1)'>");
  await expect(original.locator("a, img")).toHaveCount(0);
  expect(outbound).toBe(0);
});

test("paste button reads the clipboard, and the message can be analyzed manually", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.bringToFront();
  await page.evaluate((message) => navigator.clipboard.writeText(message), SAMPLES[1].message);
  await page.getByRole("button", { name: "Paste text" }).click();
  await expect(page.locator("#message")).toHaveValue(SAMPLES[1].message);
  await page.getByRole("button", { name: "Analyze Message", exact: true }).click();
  await expect(page.locator("#results")).toContainText("Upfront fee");
});

test("API enforces consent, size, and key availability", async ({ request }) => {
  const body = { message: SAMPLES[0].message, language: "en", consent: true };
  const withoutConsent = await request.post("/api/analyze", { data: { ...body, consent: false } });
  expect(withoutConsent.status()).toBe(400);
  const veryLong = await request.post("/api/analyze", { data: { ...body, message: "x".repeat(5001) } });
  expect(veryLong.status()).toBe(413);
  const unavailable = await request.post("/api/analyze", { data: body });
  expect(unavailable.status()).toBe(503);
  expect(unavailable.headers()["cache-control"]).toBe("no-store");
});
