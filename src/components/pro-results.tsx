import { Bot, Clipboard, Send, ShieldAlert, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { GUIDES } from "@/lib/library";
import { PROVIDERS, type ProAnalysis, type ProConnection, type Usage } from "@/lib/pro";
import { outboundText, proErrorText, requestPro } from "@/lib/pro-client";
import { proCopy as p, proRisk } from "@/lib/pro-copy";
import { tr, type Language } from "@/lib/types";
import type { Copy } from "@/lib/copy";
import { LanguageSelect } from "./analyzer";
import { TokenUsage } from "./pro-settings";
import { EvidenceText } from "./results";
import { Resources } from "./safety";

const categories = {
  upi_fraud: GUIDES.upi.title, otp_phishing: GUIDES.credential.title, fake_job: GUIDES.job.title,
  bank_impersonation: GUIDES.kyc.title, government_impersonation: GUIDES.impersonation.title,
  investment: GUIDES.investment.title, prize: GUIDES.reward.title, delivery: GUIDES.delivery.title,
  romance: tr("Romance scam", "प्रेम संबंध का घोटाला", "ప్రేమ పేరుతో మోసం"),
  credential_theft: tr("Credential theft", "गोपनीय जानकारी की चोरी", "ఖాతా వివరాల దొంగతనం"),
  unknown: tr("Unknown", "अज्ञात", "తెలియదు"),
};
const tacticNames = {
  fear: tr("Fear", "डर", "భయం"), urgency: tr("Urgency", "जल्दबाज़ी", "తొందర"),
  authority: tr("False authority", "झूठा अधिकार", "నకిలీ అధికారం"),
  greed: tr("Financial lure", "पैसे का लालच", "డబ్బు ఆశ"),
  emotion: tr("Emotional pressure", "भावनात्मक दबाव", "భావోద్వేగ ఒత్తిడి"),
  social_engineering: tr("Social engineering", "बातों से फँसाना", "మాటలతో మోసం"),
  scarcity: tr("Scarcity", "सीमित उपलब्धता", "పరిమిత అవకాశం"),
  trust: tr("Trust exploitation", "भरोसे का दुरुपयोग", "నమ్మకాన్ని దుర్వినియోగం చేయడం"),
};
type ChatEntry = { role: "user" | "assistant"; text: string };

function ProChat({ connected, message, language, startLanguage, model, t }: {
  connected: ProConnection | null; message: string; language: Language; startLanguage: Language; model: string; t: Copy;
}) {
  const [chatLanguage, setChatLanguage] = useState(startLanguage);
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const [usage, setUsage] = useState<Usage>();
  const inFlight = useRef<AbortController | null>(null);
  const transcript = useRef<HTMLDivElement | null>(null);
  const canSend = Boolean(connected);
  useEffect(() => () => inFlight.current?.abort(), []);

  function clear() {
    inFlight.current?.abort();
    inFlight.current = null;
    setBusy(false);
    setHistory([]);
    setQuestion("");
    setFailure(null);
    setUsage(undefined);
  }

  async function send() {
    const input = question.trim();
    if (!connected || !input || inFlight.current) return;
    const controller = new AbortController();
    inFlight.current = controller;
    setBusy(true);
    setFailure(null);
    try {
      const result = await requestPro({
        ...connected, action: "chat", language: chatLanguage,
        message: outboundText(connected, message), question: outboundText(connected, input),
        history: history.slice(-4).map(({ role, text }) => ({ role, text: outboundText(connected, text) })),
      }, controller.signal);
      if (controller.signal.aborted) return;
      if (typeof result.answer !== "string" || !result.answer.trim() || result.answer.length > 1600) throw { error: "invalid_output" };
      const exchange: ChatEntry[] = [{ role: "user", text: input }, { role: "assistant", text: result.answer }];
      setHistory(history.concat(exchange).slice(-20));
      setUsage(result.usage);
      setQuestion("");
      requestAnimationFrame(() => {
        if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight;
      });
    } catch (error) {
      if (!controller.signal.aborted) setFailure(error);
    } finally {
      if (inFlight.current === controller) {
        inFlight.current = null;
        setBusy(false);
      }
    }
  }

  return <section className="surface pro-card pro-chat" aria-labelledby="pro-chat-title">
    <div className="pro-card-head">
      <h3 id="pro-chat-title"><Bot size={21} aria-hidden />{p.question[language]}</h3>
      <LanguageSelect title={t.language} language={chatLanguage} onChange={setChatLanguage} />
      <button type="button" className="button button-quiet" onClick={clear}>{p.clearChat[language]}</button>
    </div>
    <p className="pro-muted">{model} · {p.askPrivacy[language]}</p>
    {!canSend && <p className="pro-error">{p.configure[language]}</p>}
    {history.length > 0 && <div ref={transcript} className="pro-transcript" role="log" aria-label={p.question[language]} tabIndex={0}>
      {history.map(({ role, text }, index) => <div key={index} className={"pro-bubble " + role}>
        <strong>{role === "user" ? p.you[language] : "ScamShield AI Pro"}</strong><p dir="auto">{text}</p>
      </div>)}
    </div>}
    <div className="pro-actions">
      {[p.follow1, p.follow2, p.follow3].map((suggestion) =>
        <button type="button" className="button button-quiet" key={suggestion.en} disabled={!canSend || busy}
          onClick={() => setQuestion(suggestion[chatLanguage])}>{suggestion[chatLanguage]}</button>)}
    </div>
    <form className="pro-composer" onSubmit={(event) => { event.preventDefault(); void send(); }}>
      <input value={question} onChange={(event) => setQuestion(event.target.value)} disabled={!canSend || busy}
        autoComplete="off" maxLength={600} placeholder={p.placeholder[language]} aria-label={p.placeholder[language]} />
      <button className="button button-primary" type="submit" disabled={!canSend || busy || !question.trim()}><Send size={16} aria-hidden />{p.ask[language]}</button>
    </form>
    {busy && <p role="status">{p.working[language]}</p>}
    {failure != null && <p className="pro-error" role="alert">{proErrorText(failure, language, connected ? PROVIDERS[connected.provider].name : undefined)}</p>}
    <TokenUsage usage={usage} language={language} />
  </section>;
}

function Evidence({ items, title }: { items: { quotedEvidence: string; explanation: string }[]; title: string }) {
  if (!items.length) return null;
  return <article className="surface pro-card"><h3>{title}</h3>
    <ul className="pro-list">{items.map((item, index) => <li key={index}><q dir="auto">{item.quotedEvidence}</q><p>{item.explanation}</p></li>)}</ul>
  </article>;
}

export function ProResults({ result, language, analysisLanguage, chosenLanguage, onLanguage, onRerun, connection, message, t, onCopy, visible, compare }: {
  result: ProAnalysis; language: Language; analysisLanguage: Language; chosenLanguage: Language;
  onLanguage: (value: Language) => void; onRerun: () => void;
  connection: ProConnection | null; message: string; t: Copy; onCopy: (value: string) => void;
  visible: boolean;
  compare?: ReactNode;
}) {
  const matching = connection?.provider === result.provider && connection.model === result.model ? connection : null;
  const risk = {
    no_obvious_indicators: "low", potentially_suspicious: "medium",
    highly_suspicious: "critical", insufficient_information: "unknown",
  }[result.riskLevel];
  const heading = visible ? "results-title" : "pro-hidden-title";
  const spans = result.redFlags.flatMap(({ quotedEvidence }) => {
    const start = message.indexOf(quotedEvidence);
    return start < 0 ? [] : [{ start, end: start + quotedEvidence.length }];
  });
  return <section hidden={!visible} id={visible ? "results" : undefined} className="wrap content-section results-section pro-results" aria-labelledby={heading}>
    <div className="section-heading">
      <div className="icon-tile tone-teal section-icon"><ShieldAlert size={22} aria-hidden /></div>
      <div><h2 id={heading} tabIndex={-1}>{p.title[language]}</h2>
        <p>{PROVIDERS[result.provider].name} · <bdi>{result.model}</bdi> · {p.completed[language]}{!matching && " · " + p.disconnected[language]}</p></div>
    </div>
    <div className="pro-actions pro-result-language">
      {visible && compare}
      <LanguageSelect title={p.analysisLanguage[language]} language={chosenLanguage} onChange={onLanguage} />
      <button type="button" className="button button-quiet" disabled={!connection} onClick={onRerun}>{p.regenerate[language]}</button>
    </div>
    <div className={"surface risk-card risk-" + risk}>
      <div className="risk-ring" aria-hidden><div className="risk-ring-inner"><strong>{result.riskScore}</strong><small>/ 100</small></div>
        <div className="risk-gauge" style={{ "--score": result.riskScore + "%" } as React.CSSProperties} /></div>
      <div className="risk-copy">
        <div className="risk-kicker">{p.score[language]} · {result.riskScore} / 100</div>
        <h3>{proRisk[result.riskLevel][language]}</h3>
        <p>{p.limits[language]}</p>
        {result.suspectedScamTypes.length > 0 && <div className="category-tag">
          {result.suspectedScamTypes.map((category, index) => <span key={index}>{categories[category][language]}</span>)}
        </div>}
      </div>
    </div>
    <article className="surface pro-card"><h3>{p.summary[language]}</h3><p lang={analysisLanguage}>{result.summary}</p>
      <TokenUsage usage={result.usage} language={language} /></article>
    <div className="pro-results-grid">
      <div className="pro-evidence-stack">
        <article className="surface pro-card">
          <details className="pro-original"><summary>{t.original}</summary><EvidenceText message={message} spans={spans} /></details>
          <h3>{t.warningSigns}</h3>
          {result.redFlags.length ? <ul className="pro-list">{result.redFlags.map((flag, index) => <li key={index}>
            <span className={"severity-" + flag.severity}><TriangleAlert size={16} aria-hidden />{t[flag.severity]}</span>
            <q dir="auto">{flag.quotedEvidence}</q><p lang={analysisLanguage}>{flag.explanation}</p>
            <p lang={analysisLanguage}>{flag.verification}</p>
          </li>)}</ul> : <p>{t.noFindings}</p>}
        </article>
        <Evidence title={p.tactics[language]} items={result.psychologicalTactics.map((item) =>
          ({ ...item, explanation: tacticNames[item.tactic][language] + " · " + item.explanation }))} />
        <Evidence title={p.financial[language]} items={result.financialWarnings} />
        <Evidence title={p.links[language]} items={result.linkWarnings} />
      </div>
      <div className="pro-evidence-stack">
        <article className="surface pro-card"><h3>{t.safety}</h3>
          <ol className="pro-checklist">{result.recommendedActions.map((step, index) => <li key={index}>
            <label className="step-choice"><input type="checkbox" /><span lang={analysisLanguage}>{step}</span></label>
          </li>)}</ol>
          <h3>{t.reply}</h3>
          {result.safeResponse.trim() && result.riskLevel !== "highly_suspicious" ? <>
            <p className="pro-muted">{t.replyNote}</p>
            <p lang={analysisLanguage}>{result.safeResponse}</p>
            <button type="button" className="button button-quiet" onClick={() => onCopy(result.safeResponse)}><Clipboard size={16} aria-hidden />{t.copyReply}</button>
          </> : <p>{p.noReply[language]}</p>}
        </article>
        {([
          [p.impact[language], result.potentialConsequences],
          [p.verify[language], result.claimsNeedingVerification],
          [p.uncertainty[language], [result.uncertainty, result.disclaimer]],
        ] as const).filter(([, items]) => items.length > 0).map(([title, items]) =>
          <article className="surface pro-card" key={title}><h3>{title}</h3><ul className="pro-bullets" lang={analysisLanguage}>
            {items.map((item, index) => <li key={index}>{item}</li>)}
          </ul></article>)}
      </div>
    </div>
    <ProChat key={matching ? "connected" : "disconnected"} connected={matching} message={message} language={language} startLanguage={analysisLanguage} model={result.model} t={t} />
    <Resources t={t} compact />
  </section>;
}
