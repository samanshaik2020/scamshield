import { ArrowRight, Fingerprint, Globe2, LockKeyhole, MapPin, Play, ScanLine, ShieldCheck, TriangleAlert } from "lucide-react";
import { useMemo } from "react";
import { analyzeMessage } from "@/lib/analysis";
import type { Copy } from "@/lib/copy";
import { SAMPLES } from "@/lib/samples";
import type { Language } from "@/lib/types";

export function Brand() {
  return <a className="brand" href="#overview">
    <span className="brand-mark"><ShieldCheck size={22} aria-hidden /></span>
    <span>ScamShield<span className="brand-ai"> AI</span></span>
  </a>;
}

export function Hero({ t, language, onDemo, pending }: { t: Copy; language: Language; onDemo: () => void; pending: boolean }) {
  const preview = useMemo(() => analyzeMessage(SAMPLES[0].message, language), [language]);
  return (
    <section className="hero wrap" id="overview" aria-labelledby="hero-title">
      <div className="hero-copy">
        <span className="eyebrow"><span className="live-dot" />{t.tagline}</span>
        <h1 id="hero-title">{t.hero1}<br /><span>{t.hero2}</span></h1>
        <p>{t.heroDesc}</p>
        <div className="hero-actions flex flex-wrap items-center gap-3">
          <a className="button button-primary" href="#analyzer"><ScanLine size={19} aria-hidden />{t.heroCta}<ArrowRight size={17} aria-hidden /></a>
          <button type="button" className="button button-secondary" disabled={pending} onClick={onDemo}><Play size={16} aria-hidden />{t.demoCta}</button>
        </div>
        <div className="hero-trust">
          <span><LockKeyhole size={15} aria-hidden />{t.private}</span>
          <span><Globe2 size={15} aria-hidden />{t.languages}</span>
          <span><MapPin size={15} aria-hidden />{t.india}</span>
        </div>
      </div>
      <div className="hero-visual" role="group" aria-label={t.sampleAnalysis}>
        <div className="radar-grid" aria-hidden />
        <div className="radar-visual" aria-hidden>
          <span className="radar-ring ring-outer" /><span className="radar-ring ring-middle" />
          <span className="radar-ring ring-inner" /><span className="radar-axis axis-x" /><span className="radar-axis axis-y" />
          <span className="radar-point point-a" /><span className="radar-point point-b" /><span className="radar-point point-c" />
          <span className="radar-core"><ShieldCheck size={76} strokeWidth={1.35} /></span>
        </div>
        <div className="visual-label"><span className="live-dot" />{t.sampleAnalysis}</div>
        <div className="float-card float-warning">
          <span className="icon-tile tone-warn"><Fingerprint size={19} aria-hidden /></span>
          <div><strong>{preview.findings[0].title}</strong><small lang="en">{preview.findings[0].phrase}</small></div>
        </div>
        <div className="float-card float-score" title={t.riskMeaning}>
          <div className="float-score-title"><TriangleAlert size={14} aria-hidden />{t.heuristic}</div>
          <div className="float-score-number">{preview.riskScore}<span>/ 100</span></div>
          <div className="float-track" aria-hidden><span style={{ width: preview.riskScore + "%" }} /></div>
        </div>
      </div>
    </section>
  );
}
