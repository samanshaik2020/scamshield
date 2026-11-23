import { prepareExternalText } from "./privacy";
import { proErrors } from "./pro-copy";
import type { ProConnection, ProRequest, Usage } from "./pro";
import type { Language } from "./types";

export type ProFailure = { error: string; upstreamStatus?: number };
export type ProReply = {
  models?: { id: string; label?: string }[];
  connected?: boolean;
  analysis?: unknown;
  answer?: string;
  usage?: Usage;
};

export function outboundText(connection: ProConnection, text: string) {
  if (connection.provider === "ollama") return text;
  return prepareExternalText(connection.apiKey ? text.replaceAll(connection.apiKey, "•".repeat(connection.apiKey.length)) : text);
}

export async function requestPro(body: ProRequest, cancel?: AbortSignal): Promise<ProReply> {
  const timeout = AbortSignal.timeout(59_000);
  try {
    const response = await fetch("/api/pro", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), cache: "no-store",
      signal: cancel ? AbortSignal.any([cancel, timeout]) : timeout,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) throw data?.error ? data : { error: "network" };
    return data;
  } catch (error) {
    if (timeout.aborted) throw { error: "timeout" } satisfies ProFailure;
    if (error && typeof error === "object" && "error" in error && typeof error.error === "string") throw error;
    throw { error: "network" } satisfies ProFailure;
  }
}

export function proErrorText(failure: unknown, language: Language, provider?: string) {
  const item = failure as ProFailure | null;
  const code = item?.error ?? "network";
  const localized = Object.hasOwn(proErrors, code) ? proErrors[code as keyof typeof proErrors] : proErrors.network;
  const prefix = item?.upstreamStatus ? (provider ? provider + " " : "") + "HTTP " + item.upstreamStatus + " · " : "";
  return prefix + localized[language];
}
