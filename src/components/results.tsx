import { ArrowRight, ChevronDown, CircleCheck, Clipboard, Info, ShieldAlert, TriangleAlert, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { RISK_LABELS } from "@/lib/analysis";
import type { ContextAnalysis } from "@/lib/context";
import type { Copy } from "@/lib/copy";
import { familyWarning, GUIDES } from "@/lib/library";
import type { Analysis, Category, Language } from "@/lib/types";
import { Resources } from "./safety";

export function EvidenceText({ message, spans }: { message: string; spans: { start: number; end: number }[] }) {
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const merged: typeof sorted = [];
  for (const span of sorted) {
    const last = merged.at(-1);
    if (last && span.start < last.end) last.end = Math.max(last.end, span.end);
    else merged.push({ ...span });
  }
  let offset = 0;
  const parts: ReactNode[] = [];
  for (const { start, end } of merged) {
    parts.push(message.slice(offset, start), <mark key={start}>{message.slice(start, end)}</mark>);
    offset = end;
  }
  parts.push(message.slice(offset));
  return <blockquote className="evidence-text" dir="auto">{parts}</blockquote>;
}

export function LoadingResult({ t }: { t: Copy }) {
  return <section className="wrap content-section" id="results" aria-busy="true" aria-label={t.scanning}>
    <div className="surface loading-card"><p role="status"><ShieldAlert size={20} aria-hidden />{t.scanning}</p>
      <div className="skeleton" /><div className="skeleton" /><div className="skeleton" />
    </div>
  </section>;
}

export function Results({ analysis, context, message, language, t, contextFallback, onCopy, onFamily, compare }: {
  analysis: Analysis; context?: ContextAnalysis; message: string; language: Language; t: Copy;
  contextFallback: boolean; onCopy: (text: string) => void;
  onFamily: (category: Category | "none") => void;
  compare?: ReactNode;
}) {
  const category = analysis.category === "none" ? context?.category ?? "none" : analysis.category;
  const guide = category !== "none" ? GUIDES[category] : null;
  const warning = familyWarning(category, language);
  const unassessed = analysis.limitedLanguage && !analysis.findings.length;
  const riskTitle = analysis.riskLevel === "high" && analysis.findings.length === 1
    ? t.singleHigh : RISK_LABELS[analysis.riskLevel][language];
  return <section id="results" className="wrap content-section results-section" aria-labelledby="results-title">
    <div className="section-heading">
      <div className="icon-tile tone-teal section-icon"><ShieldAlert size={22} aria-hidden /></div>
      <div><h2 id="results-title" tabIndex={-1}>{t.result}</h2></div>
      <span className="mode"><i />{context ? t.aiMode : t.ruleMode}</span>
    </div>
    {compare}
    {contextFallback && <div className="result-note" role="status"><Info size={17} aria-hidden />{t.aiFallback}</div>}
    <div className={"surface risk-card risk-" + (unassessed ? "unknown" : analysis.riskLevel)}>
      <div className="risk-ring" aria-hidden>
        <div className="risk-ring-inner"><strong>{unassessed ? "—" : analysis.riskScore}</strong>{!unassessed && <small>/ 100</small>}</div>
        <div className="risk-gauge" key={analysis.riskScore} style={{ "--score": analysis.riskScore + "%" } as React.CSSProperties} />
      </div>
      <div className="risk-copy">
        <div className="risk-kicker">{t.heuristic}{!unassessed && " · " + analysis.riskScore + " / 100"}</div>
        <h3>{unassessed ? t.insufficient : riskTitle}</h3>
        <p>{unassessed ? t.limitation : analysis.summary}</p>
        <p className="risk-meaning">{t.riskMeaning}</p>
        <div className="category-tag"><strong>{t.possibleType}</strong><span>{guide?.title[language] ?? t.noCategory}</span></div>
      </div>
    </div>
    {analysis.limitedLanguage && !unassessed && <div className="result-note"><Info size={17} aria-hidden />{t.limitation}</div>}
    <div className="result-grid">
      <article className="surface evidence-card">
        <h3>{t.original}</h3>
        <EvidenceText message={message} spans={[...analysis.findings, ...(context?.findings ?? [])]} />
        <h3>{t.warningSigns} <span className="finding-count">{analysis.findings.length}</span></h3>
        {analysis.findings.length ? <div className="findings">
          {analysis.findings.map((finding) => <details key={finding.id} className="finding">
            <summary>
              <TriangleAlert size={17} className={"severity-" + finding.severity} aria-hidden />
              <span><strong>{finding.title}</strong><small><q>{finding.phrase}</q></small></span>
              <span className={"severity-pill severity-" + finding.severity}>{t[finding.severity]}</span>
              <ChevronDown size={16} aria-hidden />
            </summary>
            <div className="finding-body"><p>{finding.reason}</p><p>{finding.recommendation}</p><small>+{finding.points} {t.signalPoints}</small></div>
          </details>)}
        </div> : <p className="no-findings"><CircleCheck size={18} aria-hidden />{t.noFindings}</p>}
        {context && <div className="ai-context">
          <h3>{t.aiHeading}</h3><p>{context.summary}</p>
          <ul>{context.findings.map((finding) => <li key={finding.phrase}><q>{finding.phrase}</q> · {finding.reason}</li>)}</ul>
          <p>{t.aiCaution}</p>
        </div>}
      </article>
      <div className="result-side">
        <article className="surface result-safety">
          <h3>{t.safety}</h3>
          <ul>{[...new Set([...analysis.safetySteps, ...(context && guide ? [guide.action[language]] : [])])].map((step, index) =>
            <li key={index}><label className="step-choice"><input type="checkbox" /><span>{step}</span></label></li>)}</ul>
          <div className="safe-reply">
            <h4>{t.reply}</h4><p>{t.replyNote}</p><blockquote>{analysis.suggestedResponse}</blockquote>
            <button type="button" onClick={() => onCopy(analysis.suggestedResponse)} className="button button-quiet"><Clipboard size={15} aria-hidden />{t.copyReply}</button>
          </div>
        </article>
        <article className="surface result-family">
          <h3><UsersRound size={19} aria-hidden />{t.familyWarning}</h3><p>{warning}</p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="button button-secondary" onClick={() => onCopy(warning)}><Clipboard size={16} aria-hidden />{t.copy}</button>
            <a className="button button-quiet" href="#family" onClick={() => onFamily(category)}>{t.familyAction}<ArrowRight size={16} aria-hidden /></a>
          </div>
        </article>
      </div>
    </div>
    <Resources t={t} compact />
    <div className="result-note"><Info size={18} aria-hidden />{analysis.disclaimer}</div>
  </section>;
}
