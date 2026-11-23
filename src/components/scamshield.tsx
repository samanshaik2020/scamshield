"use client";

import { CheckCircle2, Globe2, Info } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { analyzeMessage } from "@/lib/analysis";
import { validateContext, type ContextAnalysis } from "@/lib/context";
import { prepareExternalText } from "@/lib/privacy";
import { PROVIDERS, validateProAnalysis, type ProAnalysis, type ProConnection } from "@/lib/pro";
import { outboundText, proErrorText, requestPro } from "@/lib/pro-client";
import { proCopy as p } from "@/lib/pro-copy";
import { interfaceCopy } from "@/lib/copy";
import { SAMPLES } from "@/lib/samples";
import { isLanguage, MAX_MESSAGE_LENGTH, validateMessage, type Category, type InputError, type Language } from "@/lib/types";
import { Analyzer, LanguageSelect } from "./analyzer";
import { Brand, Hero } from "./hero";
import { LoadingResult, Results } from "./results";
import { ProResults } from "./pro-results";
import { ProSettings } from "./pro-settings";
import { HowItWorks, Library, Resources, Toolkit } from "./safety";

interface Run {
  id: number;
  message: string;
  context?: ContextAnalysis;
  contextLanguage?: Language;
  contextFallback: boolean;
  pro?: ProAnalysis;
  proLanguage?: Language;
  proFailure?: string;
}

const LANGUAGE_PREF = "scamshield-interface-language";

function showResult() {
  requestAnimationFrame(() => {
    document.getElementById("results")?.scrollIntoView({ block: "start" });
    document.getElementById("results-title")?.focus({ preventScroll: true });
  });
}

export function ScamShield({ aiAvailable, localEnabled = false }: { aiAvailable: boolean; localEnabled?: boolean }) {
  const [language, setLanguage] = useState<Language>("en");
  const [warningLanguage, setWarningLanguage] = useState<Language | null>(null);
  const [topic, setTopic] = useState<Category | "none">("none");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<InputError | null>(null);
  const [useAi, setUseAi] = useState(false);
  const [pending, setPending] = useState(false);
  const [record, setRecord] = useState<Run | null>(null);
  const [active, setActive] = useState("overview");
  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null);
  const [mode, setMode] = useState<"basic" | "pro">("basic");
  const [view, setView] = useState<"basic" | "pro">("basic");
  const [connection, setConnection] = useState<ProConnection | null>(null);
  const [outputLanguage, setOutputLanguage] = useState<Language | null>(null);
  const toastTimeout = useRef<number>(0);
  const analyzing = useRef(false);
  const editorRevision = useRef(0);
  const cancelPro = useRef<AbortController | null>(null);
  const t = useMemo(() => interfaceCopy(language), [language]);
  const analysis = useMemo(() => record && analyzeMessage(record.message, language), [record, language]);

  useEffect(() => {
    const initialize = requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem(LANGUAGE_PREF);
        if (isLanguage(saved)) setLanguage(saved);
      } catch {
        // In private or restricted browser contexts the current language still works.
      }
    });
    const sections = [...document.querySelectorAll<HTMLElement>("#overview, #analyzer, #library, #family")];
    let frame = 0;
    function selectNav() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const top = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + 12;
        const current = sections.filter((section) => section.getBoundingClientRect().top <= top).at(-1);
        const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
        setActive(atBottom ? "family" : current?.id ?? "overview");
      });
    }
    selectNav();
    window.addEventListener("scroll", selectNav, { passive: true });
    window.addEventListener("resize", selectNav);
    return () => {
      cancelAnimationFrame(initialize);
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", selectNav);
      window.removeEventListener("resize", selectNav);
      window.clearTimeout(toastTimeout.current);
      cancelPro.current?.abort();
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  function changeLanguage(value: Language) {
    setLanguage(value);
    try { localStorage.setItem(LANGUAGE_PREF, value); } catch { /* Preference is optional. */ }
  }

  function notify(message: string, success: boolean) {
    window.clearTimeout(toastTimeout.current);
    setToast({ message, success });
    toastTimeout.current = window.setTimeout(() => setToast(null), 3600);
  }

  function edit(value: string) {
    editorRevision.current++;
    if (record) {
      setRecord(null);
      setTopic("none");
    }
    setMessage(value);
    setError(validateMessage(value) === "tooLong" ? "tooLong" : null);
  }

  async function paste() {
    const revision = ++editorRevision.current;
    const textarea = document.getElementById("message");
    textarea?.focus();
    try {
      const pasted = await navigator.clipboard.readText();
      if (revision !== editorRevision.current || analyzing.current || !pasted) return;
      edit(pasted);
      const withinLimit = pasted.length <= MAX_MESSAGE_LENGTH;
      notify(withinLimit ? t.pasted : t.tooLong, withinLimit);
    } catch {
      notify(t.pasteError, false);
    }
  }

  function clear() {
    edit("");
    document.getElementById("message")?.focus();
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      notify(t.copied, true);
    } catch {
      notify(t.copyError, false);
    }
  }

  function disconnect() {
    cancelPro.current?.abort();
    setConnection(null);
  }

  async function run(value: string, sample = false, requestedMode = mode) {
    if (analyzing.current) return;
    editorRevision.current++;
    const issue = validateMessage(value);
    setError(issue);
    if (issue) {
      document.getElementById("message")?.focus();
      return;
    }
    setMessage(value);
    setActive("analyzer");
    const base = analyzeMessage(value, language);
    const next: Run = { id: editorRevision.current, message: value, contextFallback: false };
    const wantPro = !sample && requestedMode === "pro";
    setView(wantPro ? "pro" : "basic");
    if (wantPro && !connection) {
      const settings = document.getElementById("pro-settings") as HTMLDetailsElement | null;
      if (settings) settings.open = true;
      settings?.querySelector("select")?.focus();
      notify(p.configure[language], false);
      return;
    }
    if (wantPro && connection) {
      const controller = new AbortController();
      cancelPro.current = controller;
      const selectedLanguage = outputLanguage ?? language;
      analyzing.current = true;
      setPending(true);
      showResult();
      try {
        const external = outboundText(connection, value);
        const response = await requestPro({ ...connection, action: "analyze", language: selectedLanguage, message: external }, controller.signal);
        const result = validateProAnalysis(response.analysis, external);
        if (!result) throw { error: "invalid_output" };
        const extras = response.analysis as ProAnalysis;
        next.pro = { ...result, provider: connection.provider, model: connection.model, analysisMode: "pro_ai", usage: extras.usage };
        next.proLanguage = selectedLanguage;
      } catch (failure) {
        if (controller.signal.aborted) setView("basic");
        else next.proFailure = proErrorText(failure, language, PROVIDERS[connection.provider].name);
      } finally {
        setPending(false);
        analyzing.current = false;
        cancelPro.current = null;
      }
    } else if (aiAvailable && useAi && !sample) {
      analyzing.current = true;
      setPending(true);
      showResult();
      try {
        const response = await fetch("/api/analyze", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: prepareExternalText(value), language, consent: true }),
          signal: AbortSignal.timeout(12_000),
        });
        if (!response.ok) throw new Error("AI unavailable");
        const context = validateContext((await response.json()).context, value);
        if (!context) throw new Error("AI context missing");
        next.context = context;
        next.contextLanguage = language;
      } catch {
        next.contextFallback = true;
      } finally {
        setPending(false);
        analyzing.current = false;
      }
    }
    setTopic(base.category === "none" ? next.context?.category ?? "none" : base.category);
    setRecord(next);
    showResult();
  }

  const nav = [["overview", t.home], ["analyzer", t.analyze], ["library", t.library], ["family", t.family]];
  function compareWith(next: "basic" | "pro") {
    if (next === view) return;
    setView(next);
    showResult();
  }

  const compare = record && (record.pro || record.proFailure || view === "pro") ? <div className="pro-compare">
    <ModeSwitch value={view} language={language} change={compareWith} />
  </div> : undefined;
  return <>
    <a className="skip-link" href="#main">{t.skip}</a>
    <header className="site-header">
      <div className="wrap header-inner">
        <Brand />
        <nav className="site-nav" aria-label={t.nav}>
          {nav.map(([target, label]) => <a key={target} href={"#" + target} aria-current={active === target ? "location" : undefined}
            onClick={() => setActive(target)}>{label}</a>)}
        </nav>
        <div className="header-language"><Globe2 size={16} aria-hidden /><LanguageSelect title={t.language} language={language} onChange={changeLanguage} /></div>
      </div>
    </header>
    <main id="main" tabIndex={-1}>
      <Hero t={t} language={language} pending={pending} onDemo={() => run(SAMPLES[0].message, true)} />
      <Analyzer t={t} message={message} setMessage={edit} error={error} pending={pending} aiAvailable={aiAvailable && mode === "basic"}
        useAi={mode === "basic" && useAi} setUseAi={setUseAi} run={run} paste={paste} clear={clear}
        submitLabel={mode === "pro" ? p.pro[language] : undefined}
        actions={<div className="pro-analyzer-controls">
          <ModeSwitch value={mode} language={language} disabled={pending} change={(next) => { setMode(next); setView(next); }} />
          <div hidden={mode !== "pro"}><ProSettings language={language} localEnabled={localEnabled} saved={connection}
            onSave={(value) => { disconnect(); setConnection(value); }} onDisconnect={disconnect} /></div>
        </div>}
        review={mode === "pro" && connection && message.trim() && !error ? <details className="pro-review">
          <summary>{p.review[language]}</summary>
          {connection.provider !== "ollama" && <p>{p.masking[language]}</p>}
          <pre dir="auto">{outboundText(connection, message)}</pre>
        </details> : undefined} />
      {pending ? <LoadingResult t={t} /> : record && analysis && <>
        {view === "pro" && !record.pro ? <section className="wrap content-section surface pro-card" id="results">
          <h2 id="results-title" tabIndex={-1}>{p.pro[language]}</h2>
          {record.proFailure && <p className="pro-error" role="alert">{record.proFailure}</p>}
          <div className="pro-actions">
            <button type="button" className="button button-secondary" onClick={() => compareWith("basic")}>{p.basic[language]}</button>
            <button type="button" className="button button-primary" onClick={() => { setMode("pro"); void run(record.message, false, "pro"); }}>{p.regenerate[language]}</button>
          </div>
        </section> : view === "basic" && <Results key={"basic-" + record.id} t={t} language={language} message={record.message}
          analysis={analysis} context={record.contextLanguage === language ? record.context : undefined}
          contextFallback={record.contextFallback} onCopy={copy} onFamily={setTopic} compare={compare} />}
        {record.pro && record.proLanguage && <ProResults key={"pro-" + record.id} result={record.pro} language={language} t={t}
          message={record.message} analysisLanguage={record.proLanguage} chosenLanguage={outputLanguage ?? record.proLanguage}
          onLanguage={setOutputLanguage} onRerun={() => { setMode("pro"); void run(record.message, false, "pro"); }}
          connection={connection} onCopy={copy} visible={view === "pro"} compare={compare} />}
      </>}
      <HowItWorks t={t} />
      <Library t={t} language={language} />
      <Toolkit t={t} language={language} warningLanguage={warningLanguage ?? language} category={topic}
        setCategory={setTopic} onLanguage={setWarningLanguage} onCopy={copy} />
      <Resources t={t} />
    </main>
    <footer className="site-footer"><div className="wrap footer-inner"><Brand /><p>{t.education}</p></div></footer>
    <div className="toast-host" role="status" aria-live="polite">{toast && <div className="toast">
      {toast.success ? <CheckCircle2 size={19} aria-hidden /> : <Info size={19} aria-hidden />}{toast.message}
    </div>}</div>
  </>;
}

function ModeSwitch({ value, change, language, disabled }: {
  value: "basic" | "pro"; change: (value: "basic" | "pro") => void; language: Language; disabled?: boolean;
}) {
  return <div className="pro-switch" role="group" aria-label={p.modes[language]}>
    <button type="button" className="button" aria-pressed={value === "basic"} disabled={disabled} onClick={() => change("basic")}>{p.basic[language]}</button>
    <button type="button" className="button" aria-pressed={value === "pro"} disabled={disabled} onClick={() => change("pro")}>{p.pro[language]}</button>
  </div>;
}
