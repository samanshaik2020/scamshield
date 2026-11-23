import { z } from "zod";
import { LANGUAGES, MAX_MESSAGE_LENGTH } from "./types";

export const PROVIDERS = {
  gemini: { name: "Google Gemini", keys: "https://aistudio.google.com/apikey", pricing: "https://ai.google.dev/gemini-api/docs/pricing" },
  groq: { name: "Groq", keys: "https://console.groq.com/keys", pricing: "https://groq.com/pricing/" },
  openai: { name: "OpenAI", keys: "https://platform.openai.com/api-keys", pricing: "https://openai.com/api/pricing/" },
  ollama: { name: "Local Ollama", keys: null, pricing: null },
} as const;

export const providerIds = ["gemini", "groq", "openai", "ollama"] as const;
export type Provider = typeof providerIds[number];

export const modelId = z.string().trim().min(1).max(160)
  .regex(/^[a-z0-9][a-z0-9._:/-]*$/i)
  .refine((id) => !id.includes("..") && !id.includes("//") && !id.endsWith("/"));
const key = z.string().trim().max(512).regex(/^[\x21-\x7e]*$/).optional();
const connection = { provider: z.enum(providerIds), apiKey: key, acknowledged: z.boolean() };
const message = z.string().min(1).max(MAX_MESSAGE_LENGTH).refine((value) => value.trim().length > 0);
export const proRequest = z.discriminatedUnion("action", [
  z.strictObject({ ...connection, action: z.literal("models") }),
  z.strictObject({ ...connection, action: z.literal("test"), model: modelId }),
  z.strictObject({ ...connection, action: z.literal("analyze"), model: modelId, message, language: z.enum(LANGUAGES) }),
  z.strictObject({ ...connection, action: z.literal("chat"), model: modelId, message, language: z.enum(LANGUAGES),
    question: z.string().trim().min(1).max(600),
    history: z.array(z.strictObject({ role: z.enum(["user", "assistant"]), text: z.string().min(1).max(1600) })).max(4),
  }),
]);
export type ProRequest = z.input<typeof proRequest>;
export type ProConnection = { provider: Provider; apiKey?: string; acknowledged: boolean; model: string };

export const riskLevels = ["no_obvious_indicators", "potentially_suspicious", "highly_suspicious", "insufficient_information"] as const;
export const scamTypes = ["upi_fraud", "otp_phishing", "fake_job", "bank_impersonation", "government_impersonation",
  "investment", "prize", "delivery", "romance", "credential_theft", "unknown"] as const;
export const tacticTypes = ["fear", "urgency", "authority", "greed", "emotion", "social_engineering", "scarcity", "trust"] as const;
const evidence = z.object({ quotedEvidence: z.string(), explanation: z.string() });
export const analysisShape = z.object({
  riskLevel: z.enum(riskLevels),
  riskScore: z.number().int(),
  summary: z.string(),
  suspectedScamTypes: z.array(z.enum(scamTypes)),
  redFlags: z.array(evidence.extend({ severity: z.enum(["low", "medium", "high"]), verification: z.string() })),
  psychologicalTactics: z.array(evidence.extend({ tactic: z.enum(tacticTypes) })),
  financialWarnings: z.array(evidence),
  linkWarnings: z.array(evidence),
  potentialConsequences: z.array(z.string()),
  recommendedActions: z.array(z.string()),
  safeResponse: z.string(),
  claimsNeedingVerification: z.array(z.string()),
  uncertainty: z.string(),
  disclaimer: z.string(),
});
export const answerShape = z.object({ answer: z.string() });
export const probeShape = z.object({ ready: z.boolean() });
export type Usage = { input?: number; output?: number; total?: number };
export type ProAnalysis = z.infer<typeof analysisShape> & {
  analysisMode: "pro_ai"; provider: Provider; model: string; usage?: Usage;
};

export function validateProAnalysis(input: unknown, original: string) {
  const parsed = analysisShape.safeParse(input);
  if (!parsed.success) return null;
  const result = parsed.data;
  if (result.riskScore < 0 || result.riskScore > 100) return null;
  if (!result.recommendedActions.length || result.recommendedActions.length > 8) return null;
  if (result.riskLevel === "highly_suspicious" && !result.redFlags.length) return null;
  for (const value of Object.values(result)) {
    if (Array.isArray(value) && value.length > 8) return null;
    if (typeof value === "string" && value.length > 1600) return null;
  }
  const quotes = [...result.redFlags, ...result.psychologicalTactics, ...result.financialWarnings, ...result.linkWarnings];
  if (quotes.some(({ quotedEvidence, explanation }) => !quotedEvidence.trim() || quotedEvidence.length > 480 ||
    quotedEvidence.includes("•") || !original.includes(quotedEvidence) || !explanation.trim() || explanation.length > 1000)) return null;
  const prose = [result.summary, result.uncertainty, result.disclaimer, ...result.recommendedActions,
    ...result.potentialConsequences, ...result.claimsNeedingVerification, ...result.redFlags.map((flag) => flag.verification)];
  if (prose.some((value) => !value.trim() || value.length > 1600)) return null;
  return result;
}
