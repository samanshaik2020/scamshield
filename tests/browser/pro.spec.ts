import { expect, test, type Page } from "@playwright/test";
import { analysisFixture, messageFixture } from "../pro-fixture";

const key = "fixture-byok-browser-only";

async function openSettings(page: Page) {
  await page.goto("/");
  await page.locator("#analyzer").getByRole("button", { name: "Pro AI Analysis", exact: true }).click();
  await page.locator("#pro-settings summary").click();
  return page.locator("#pro-settings");
}

test("settings require a key and consent, can test and clear, and provider switching forgets saved keys", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/pro", async (route) => {
    calls++;
    const body = route.request().postDataJSON();
    expect(body.apiKey).toBe(key);
    expect(body.acknowledged).toBe(true);
    if (body.action === "models") {
      await route.fulfill({ json: { models: [{ id: "gemini-fixture" }] } });
    } else if (calls === 2) {
      await route.fulfill({ status: 401, json: { error: "credentials", upstreamStatus: 401 } });
    } else {
      await route.fulfill({ json: { connected: true } });
    }
  });
  const settings = await openSettings(page);
  const keyField = settings.getByLabel("API key", { exact: true });
  await settings.getByRole("button", { name: "Load models" }).click();
  await expect(settings.getByRole("alert")).toContainText("Enter your provider API key");
  await keyField.fill(key);
  await settings.getByRole("button", { name: "Load models" }).click();
  await expect(settings.getByRole("alert")).toContainText("Acknowledge");
  expect(calls).toBe(0);
  await settings.getByRole("checkbox").check();
  await settings.getByRole("button", { name: "Show", exact: true }).click();
  await expect(keyField).toHaveAttribute("type", "text");
  await settings.getByRole("button", { name: "Hide", exact: true }).click();
  await settings.getByRole("button", { name: "Load models" }).click();
  await settings.getByLabel("Available models").selectOption("gemini-fixture");
  await settings.getByRole("button", { name: "Test Connection" }).click();
  await expect(settings.getByRole("alert")).toContainText("HTTP 401");
  await settings.getByRole("button", { name: "Test Connection" }).click();
  await expect(settings.getByRole("status")).toContainText("Connection test passed");
  await settings.getByRole("button", { name: "Save for Current Session" }).click();
  await expect(settings.getByRole("status")).toContainText("Saved in memory");
  expect(await page.evaluate(() => JSON.stringify([localStorage, sessionStorage, document.cookie]))).not.toContain(key);
  await settings.getByRole("button", { name: "Clear API Key / Disconnect" }).click();
  await expect(keyField).toHaveValue("");
  await keyField.fill(key);
  await settings.getByLabel("AI provider").selectOption("openai");
  await expect(keyField).toHaveValue("");
  await keyField.fill(key);
  await page.reload();
  await page.locator("#analyzer").getByRole("button", { name: "Pro AI Analysis", exact: true }).click();
  await page.locator("#pro-settings summary").click();
  await expect(keyField).toHaveValue("");
  expect(calls).toBe(3);
});

test("Pro analysis compares with Basic, supports multilingual follow-up, and preserves the message on error", async ({ page }) => {
  let analyses = 0;
  await page.route("**/api/pro", async (route) => {
    const body = route.request().postDataJSON();
    expect(body.provider).toBe("groq");
    expect(body.apiKey).toBe(key);
    expect(body.message).not.toContain("test@example.org");
    if (body.action === "chat") {
      expect(body.language).toBe("hi");
      expect(body.question).toContain("भेजने वाले");
      await route.fulfill({ json: { answer: "बैंक के आधिकारिक ऐप से पुष्टि करें।", usage: { total: 70 } } });
    } else if (++analyses === 1) {
      await route.fulfill({ json: { analysis: { ...analysisFixture, usage: { total: 215 } } } });
    } else {
      expect(body.language).toBe("te");
      await route.fulfill({ status: 429, json: { error: "quota", upstreamStatus: 429 } });
    }
  });
  const settings = await openSettings(page);
  await settings.getByLabel("AI provider").selectOption("groq");
  await settings.getByLabel("API key", { exact: true }).fill(key);
  await settings.getByLabel("Model ID", { exact: true }).fill("fixture-model");
  await settings.getByRole("checkbox").check();
  await settings.getByRole("button", { name: "Save for Current Session" }).click();
  await page.locator("#message").fill(messageFixture);
  await page.getByText("Review text sent to the provider").click();
  await expect(page.locator(".pro-review pre")).toContainText("•");
  await page.locator(".editor-submit").click();
  await expect(page.getByRole("heading", { name: "ScamShield AI Pro Analysis" })).toBeVisible();
  await expect(page.locator("#results")).toContainText("Total 215");
  const viewport = page.viewportSize();
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  if (viewport) await page.setViewportSize(viewport);
  await page.locator("#results").getByText("Original message", { exact: true }).click();
  await expect(page.locator("#results mark")).toHaveText("share your OTP");
  await page.locator(".pro-compare").getByRole("button", { name: "Basic Analysis" }).click();
  await expect(page.locator("#results").getByRole("heading", { name: "Analysis results" })).toBeVisible();
  await page.locator(".pro-compare").getByRole("button", { name: "Pro AI Analysis" }).click();
  const chat = page.locator(".pro-chat");
  await chat.getByRole("combobox").selectOption("hi");
  await chat.getByRole("button", { name: "भेजने वाले की पुष्टि कैसे करूँ?" }).click();
  await chat.getByRole("button", { name: "Send question" }).click();
  await expect(chat.getByRole("log")).toContainText("बैंक के आधिकारिक ऐप से पुष्टि करें।");
  await page.locator("#results").getByLabel("Analysis language").selectOption("te");
  await page.locator("#results").getByRole("button", { name: "Re-run Pro analysis" }).click();
  await expect(page.locator("#results").getByRole("alert")).toContainText("HTTP 429");
  await page.locator("#results").getByRole("button", { name: "Basic Analysis" }).click();
  await expect(page.locator("#message")).toHaveValue(messageFixture);
  await expect(page.locator("#results")).toHaveCount(1);
  await expect(page.locator("#results").getByRole("heading", { name: "Analysis results" })).toBeVisible();
});
