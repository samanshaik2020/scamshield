import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { modelId, type Provider, type Usage } from "../pro";

const OPENAI = "https://api.openai.com/v1";
const GEMINI = "https://generativelanguage.googleapis.com";
const GROQ = "https://api.groq.com/openai/v1";
const OLLAMA = "http://127.0.0.1:11434";

export class ProError extends Error {
  constructor(public readonly code: string, public readonly status = 400, public readonly upstreamStatus?: number) {
    super(code);
  }
}

export interface Generation {
  name: string;
  schema: Record<string, unknown>;
  instruction: string;
  input: string;
  maxTokens: number;
}

type ModelOption = { id: string; label?: string };
type Connection = { provider: Provider; apiKey?: string; signal: AbortSignal };

function usage(input?: number, output?: number, total?: number): Usage | undefined {
  if (input === undefined && output === undefined && total === undefined) return;
  return { input, output, total };
}

function openai(apiKey: string, timeout: number) {
  return new OpenAI({
    apiKey, baseURL: OPENAI, maxRetries: 0, timeout, logLevel: "off",
    organization: null, project: null,
    fetch: (url, init) => fetch(url, { ...init, redirect: "error" }),
  });
}

function gemini(apiKey: string) {
  return new GoogleGenAI({ apiKey, vertexai: false, httpOptions: {
    baseUrl: GEMINI, timeout: 35_000, retryOptions: { attempts: 1 },
    fetch: (url, init) => fetch(url, { ...init, redirect: "error" }),
  } });
}

async function providerJson<T>(url: string, signal: AbortSignal, apiKey?: string, body?: object): Promise<T> {
  const response = await fetch(url, {
    method: body ? "POST" : "GET", redirect: "error", cache: "no-store", signal,
    headers: {
      ...(apiKey ? { Authorization: "Bearer " + apiKey } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    // Read only allowlisted error codes. Never return the upstream message, which can contain keys or submitted text.
    const detail = await response.json().catch(() => null);
    throw providerError({ status: response.status, code: detail?.error?.code }, signal, url.startsWith(OLLAMA));
  }
  return response.json();
}

const unsuitable = /(?:embed|whisper|transcrib|moderation|speech|realtime|image|audio|orpheus|prompt-guard|safeguard|compound|computer-use|deep-research|search-preview)/i;
const localModel = (id: string) => !/(?:^|[-:/])cloud(?:$|[-:/])/i.test(id);

export async function listModels({ provider, apiKey, signal }: Connection): Promise<ModelOption[]> {
  let entries: ModelOption[];
  switch (provider) {
    case "gemini": {
      const pager = await gemini(apiKey!).models.list({ config: { pageSize: 100, abortSignal: signal } });
      entries = [];
      for await (const model of pager) {
        if (model.name && model.supportedActions?.includes("generateContent")) {
          entries.push({ id: model.name.replace(/^models\//, ""), label: model.displayName });
        }
        if (entries.length >= 100) break;
      }
      break;
    }
    case "openai": {
      const list = await openai(apiKey!, 35_000).models.list({ signal });
      entries = list.data.map(({ id }) => ({ id })).filter(({ id }) => /^(?:gpt-|o[1-9]|ft:)/i.test(id));
      break;
    }
    case "groq": {
      const list = await providerJson<{ data: { id: string; active?: boolean }[] }>(GROQ + "/models", signal, apiKey);
      entries = list.data.filter((entry) => entry.active !== false).map(({ id }) => ({ id }));
      break;
    }
    case "ollama": {
      const list = await providerJson<{ models: { name: string }[] }>(OLLAMA + "/api/tags", signal);
      entries = list.models.map(({ name }) => ({ id: name })).filter(({ id }) => localModel(id));
      break;
    }
  }
  return entries.filter(({ id }) => modelId.safeParse(id).success && !unsuitable.test(id))
    .sort((a, b) => a.id.localeCompare(b.id)).slice(0, 100);
}

export async function generate({ provider, apiKey, signal }: Connection, model: string, task: Generation) {
  if (unsuitable.test(model)) throw new ProError("model_unavailable", 422);
  const messages = [
    { role: "system", content: task.instruction },
    { role: "user", content: task.input },
  ];
  switch (provider) {
    case "gemini": {
      // Use a model name only. SDK resource paths never come from a browser-provided URL.
      if (!/^gemini-[\w.-]+$/i.test(model)) throw new ProError("model_unavailable", 422);
      const data = await gemini(apiKey!).models.generateContent({
        model, contents: task.input, config: {
          abortSignal: signal, systemInstruction: task.instruction, responseMimeType: "application/json",
          responseJsonSchema: task.schema, maxOutputTokens: task.maxTokens,
        },
      });
      if (!data.text || data.candidates?.[0]?.finishReason !== "STOP") throw new ProError("invalid_output", 502);
      return { text: data.text, usage: usage(data.usageMetadata?.promptTokenCount, data.usageMetadata?.candidatesTokenCount, data.usageMetadata?.totalTokenCount) };
    }
    case "openai": {
      const data = await openai(apiKey!, 35_000).responses.create({
        model, input: task.input, instructions: task.instruction, store: false, max_output_tokens: task.maxTokens,
        text: { format: { type: "json_schema", name: task.name, schema: task.schema, strict: true } },
      }, { signal });
      if (data.status !== "completed" || !data.output_text) throw new ProError("invalid_output", 502);
      return { text: data.output_text, usage: usage(data.usage?.input_tokens, data.usage?.output_tokens, data.usage?.total_tokens) };
    }
    case "groq": {
      // JSON mode covers more chat models than Groq's strict schema mode. All responses are validated locally.
      messages[0].content += "\nReturn one JSON object matching this schema: " + JSON.stringify(task.schema);
      const data = await providerJson<{
        choices: { message?: { content?: string }; finish_reason?: string }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      }>(GROQ + "/chat/completions", signal, apiKey, {
        model, messages, response_format: { type: "json_object" }, max_completion_tokens: task.maxTokens,
      });
      const choice = data.choices[0];
      if (!choice?.message?.content || choice.finish_reason !== "stop") throw new ProError("invalid_output", 502);
      return { text: choice.message.content, usage: usage(data.usage?.prompt_tokens, data.usage?.completion_tokens, data.usage?.total_tokens) };
    }
    case "ollama": {
      if (!localModel(model)) throw new ProError("model_unavailable", 422);
      const details = await providerJson<{ remote_host?: string; remote_model?: string }>(OLLAMA + "/api/show", signal, undefined, { model });
      if (details.remote_host || details.remote_model) throw new ProError("model_unavailable", 422);
      const data = await providerJson<{
        message?: { content?: string }; done?: boolean; done_reason?: string; prompt_eval_count?: number; eval_count?: number;
      }>(OLLAMA + "/api/chat", signal, undefined, {
        model, stream: false, format: task.schema, messages, options: { num_predict: task.maxTokens },
      });
      if (!data.done || data.done_reason === "length" || !data.message?.content) throw new ProError("invalid_output", 502);
      return { text: data.message.content, usage: usage(data.prompt_eval_count, data.eval_count) };
    }
  }
}

export function providerError(error: unknown, signal: AbortSignal, local: boolean): ProError {
  if (error instanceof ProError) return error;
  const info = error as { status?: unknown; code?: unknown; name?: unknown; message?: unknown } | null;
  const status = typeof info?.status === "number" && info.status >= 400 && info.status <= 599 ? info.status : undefined;
  // Some SDKs wrap the provider error. Use its text for classification only.
  const detail = [info?.code, info?.message].filter((value) => typeof value === "string").join(" ").slice(0, 2000);
  if (signal.aborted || info?.name === "APIConnectionTimeoutError" || status === 408 || status === 504) return new ProError("timeout", 504, status);
  if (/API_KEY_INVALID|invalid_api_key|invalid api key/i.test(detail) || status === 401 || status === 403) return new ProError("credentials", 401, status);
  if (status === 402 || /insufficient_quota|billing_hard_limit|exhausted.*quota|exceeded.*current quota/i.test(detail)) return new ProError("quota", 429, status);
  if (status === 429) return new ProError("rate_limited", 429, status);
  if (status === 400 || status === 404 || status === 422) return new ProError("model_unavailable", 422, status);
  if (!status) return new ProError(local ? "ollama_unreachable" : "network", 502);
  return new ProError("provider_unavailable", 502, status);
}
