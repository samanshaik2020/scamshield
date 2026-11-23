import { ChevronDown, FlaskConical, KeyRound, Settings2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { modelId, PROVIDERS, providerIds, type ProConnection, type Provider, type Usage } from "@/lib/pro";
import { proErrorText, requestPro } from "@/lib/pro-client";
import { proCopy as p } from "@/lib/pro-copy";
import type { Language } from "@/lib/types";

export function TokenUsage({ usage, language }: { usage?: Usage; language: Language }) {
  if (!usage) return null;
  const entries = [[p.input, usage.input], [p.output, usage.output], [p.total, usage.total]] as const;
  return <p className="pro-usage">{p.usage[language]} · {entries.filter(([, value]) => typeof value === "number")
    .map(([label, value]) => label[language] + " " + value).join(" · ")}</p>;
}

export function ProSettings({ language, saved, localEnabled, onSave, onDisconnect }: {
  language: Language; saved: ProConnection | null; localEnabled: boolean;
  onSave: (connection: ProConnection) => void; onDisconnect: () => void;
}) {
  const [provider, setProvider] = useState<Provider>(saved?.provider ?? "gemini");
  const [key, setKey] = useState(saved?.apiKey ?? "");
  const [model, setModel] = useState(saved?.model ?? "");
  const [acknowledged, setAcknowledged] = useState(saved?.acknowledged ?? false);
  const [exposed, setExposed] = useState(false);
  const [models, setModels] = useState<{ id: string; label?: string }[]>([]);
  const [state, setState] = useState<"idle" | "working" | "connected" | "saved" | "disconnected" | "loaded">("idle");
  const [failure, setFailure] = useState<unknown>(null);
  const [usage, setUsage] = useState<Usage>();
  const request = useRef<AbortController | null>(null);
  const detail = PROVIDERS[provider];
  const local = provider === "ollama";
  useEffect(() => () => request.current?.abort(), []);

  function resetStatus() {
    setState("idle");
    setFailure(null);
    setUsage(undefined);
  }

  function clear() {
    request.current?.abort();
    request.current = null;
    setKey("");
    setExposed(false);
    setAcknowledged(false);
    setModels([]);
    resetStatus();
    setState("disconnected");
    onDisconnect();
  }

  function credentials(action: "models" | "test" | "save"): ProConnection | null {
    const id = modelId.safeParse(model);
    let error: string | undefined;
    if (local && !localEnabled) error = "local_disabled";
    else if (!local && !key.trim()) error = "key_required";
    else if (!local && !acknowledged) error = "consent_required";
    else if ((action !== "models" && !id.success) || (!local && !/^[\x21-\x7e]{1,512}$/.test(key.trim()))) error = "invalid_request";
    if (error) {
      setFailure({ error });
      return null;
    }
    return { provider, apiKey: local ? undefined : key.trim(), acknowledged, model: id.data ?? "" };
  }

  async function act(action: "models" | "test" | "save") {
    if (request.current) return;
    setFailure(null);
    const connection = credentials(action);
    if (!connection) return;
    if (action === "save") {
      onSave(connection);
      setExposed(false);
      setState("saved");
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setState("working");
    setUsage(undefined);
    try {
      const { provider, apiKey, acknowledged, model } = connection;
      const result = await requestPro(action === "models" ? { action, provider, apiKey, acknowledged } :
        { action, provider, apiKey, acknowledged, model }, controller.signal);
      if (controller.signal.aborted) return;
      if (action === "models") {
        setModels(result.models ?? []);
        setState("loaded");
      } else {
        if (!result.connected) throw { error: "invalid_output" };
        setUsage(result.usage);
        setState("connected");
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setFailure(error);
        setState("idle");
      }
    } finally {
      if (request.current === controller) request.current = null;
    }
  }

  return <details className="surface pro-settings" id="pro-settings">
    <summary><Settings2 size={19} aria-hidden /><strong>{p.settings[language]}</strong>
      {saved && <span className="pro-setting-name">{PROVIDERS[saved.provider].name} · {saved.model}</span>}
      <ChevronDown size={17} aria-hidden />
    </summary>
    <div className="pro-setting-body">
      <div className="pro-field-grid">
        <label>{p.provider[language]}<select value={provider} disabled={state === "working"} onChange={(event) => {
          clear();
          setProvider(event.target.value as Provider);
          setModel("");
          resetStatus();
        }}>{providerIds.map((id) => <option key={id} value={id}>{PROVIDERS[id].name}</option>)}</select></label>
        {!local && <div className="pro-key-field"><label htmlFor="pro-api-key">{p.key[language]}</label><span className="pro-key-input">
          <input id="pro-api-key" type={exposed ? "text" : "password"} autoComplete="off" autoCapitalize="off" spellCheck={false}
            value={key} maxLength={512} disabled={state === "working"} onChange={(event) => {
              setKey(event.target.value);
              if (saved) onDisconnect();
              setModels([]);
              resetStatus();
            }} />
          <button type="button" className="button button-quiet" onClick={() => setExposed(!exposed)} aria-pressed={exposed}>
            {exposed ? p.hide[language] : p.show[language]}
          </button></span></div>}
        <label>{p.models[language]}<select value={models.some((entry) => entry.id === model) ? model : ""}
          onChange={(event) => { setModel(event.target.value); resetStatus(); }} disabled={state === "working" || !models.length}>
          <option value="">{p.choose[language]}</option>
          {models.map(({ id, label }) => <option value={id} key={id}>{label && label !== id ? label + " · " : ""}{id}</option>)}
        </select></label>
        <label>{p.model[language]}<input value={model} maxLength={160} disabled={state === "working"} autoComplete="off" spellCheck={false} onChange={(event) => {
          setModel(event.target.value);
          resetStatus();
        }} /></label>
      </div>
      {local ? <p className="pro-muted">{p.local[language]}{!localEnabled && " " + proErrorText({ error: "local_disabled" }, language)}</p> :
        <div className="pro-disclosure">
          <p>{p.disclosure[language]}</p><p>{p.cost[language]}</p>
          <label><input type="checkbox" checked={acknowledged} disabled={state === "working"} onChange={(event) => {
            setAcknowledged(event.target.checked);
            if (!event.target.checked && saved) onDisconnect();
            resetStatus();
          }} />{p.consent[language]}</label>
          <div className="pro-links">
            {detail.keys && <a href={detail.keys} target="_blank" rel="noreferrer"><KeyRound size={14} aria-hidden />{p.keyLink[language]}</a>}
            {detail.pricing && <a href={detail.pricing} target="_blank" rel="noreferrer">{p.pricing[language]}</a>}
          </div>
        </div>}
      <div className="pro-actions">
        <button type="button" className="button button-quiet" disabled={state === "working"} onClick={() => act("models")}>{p.load[language]}</button>
        <button type="button" className="button button-secondary" disabled={state === "working"} onClick={() => act("test")}><FlaskConical size={16} aria-hidden />{p.test[language]}</button>
        <button type="button" className="button button-primary" disabled={state === "working"} onClick={() => act("save")}>{p.save[language]}</button>
        <button type="button" className="button button-quiet" onClick={clear}>{p.clear[language]}</button>
      </div>
      <div className="pro-muted" role="status">
        {state === "working" && p.working[language]}
        {state === "connected" && p.connected[language]}
        {state === "saved" && p.saved[language]}
        {state === "disconnected" && p.disconnected[language]}
        {state === "loaded" && (models.length ? p.models[language] + " · " + models.length : p.emptyModels[language])}
      </div>
      {failure != null && <p className="pro-error" role="alert">{proErrorText(failure, language, detail.name)}</p>}
      <TokenUsage usage={usage} language={language} />
    </div>
  </details>;
}
