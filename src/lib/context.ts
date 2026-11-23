import { CATEGORIES, type Category } from "./types";

export interface ContextAnalysis {
  category: Category | "none";
  summary: string;
  findings: { phrase: string; reason: string; start: number; end: number }[];
}

const safeText = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;

export function validateContext(value: unknown, original: string): ContextAnalysis | null {
  if (!value || typeof value !== "object") return null;
  const { category, summary, findings } = value as Record<string, unknown>;
  if (category !== "none" && !CATEGORIES.some((entry) => entry === category)) return null;
  if (!safeText(summary, 700) || !Array.isArray(findings) || findings.length > 5) return null;
  const seen = new Set<string>();
  const evidence: ContextAnalysis["findings"] = [];
  for (const entry of findings) {
    if (!entry || !safeText(entry.phrase, 200) || !safeText(entry.reason, 350)) return null;
    const start = original.indexOf(entry.phrase);
    if (start < 0 || seen.has(entry.phrase)) return null;
    seen.add(entry.phrase);
    evidence.push({ phrase: entry.phrase, reason: entry.reason, start, end: start + entry.phrase.length });
  }
  if (category !== "none" && !evidence.length) return null;
  return { category: category as ContextAnalysis["category"], summary, findings: evidence };
}
