export const LANGUAGES = ["en", "hi", "te"] as const;
export type Language = typeof LANGUAGES[number];
export type Localized = Record<Language, string>;

export const CATEGORIES = [
  "upi", "reward", "credential", "job", "investment",
  "kyc", "delivery", "impersonation", "urgency", "link",
] as const;
export type Category = typeof CATEGORIES[number];
export type Severity = "low" | "medium" | "high" | "critical";
export type InputError = "empty" | "tooLong" | "invalid";

export interface Finding {
  id: string;
  phrase: string;
  start: number;
  end: number;
  title: string;
  reason: string;
  severity: Severity;
  points: number;
  recommendation: string;
}

export interface Analysis {
  riskScore: number;
  riskLevel: Severity;
  category: Category | "none";
  summary: string;
  findings: Finding[];
  safetySteps: string[];
  suggestedResponse: string;
  disclaimer: string;
  limitedLanguage: boolean;
}

export const MAX_MESSAGE_LENGTH = 5000;
export const LANG_NAMES = { en: "English", hi: "हिन्दी", te: "తెలుగు" } as const;
export const tr = (en: string, hi: string, te: string): Localized => ({ en, hi, te });

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && LANGUAGES.some((language) => language === value);
}

export function validateMessage(value: unknown): InputError | null {
  if (typeof value !== "string") return "invalid";
  if (value.length > MAX_MESSAGE_LENGTH) return "tooLong";
  return value.trim() ? null : "empty";
}
