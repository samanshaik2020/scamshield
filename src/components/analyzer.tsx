import { ArrowUpRight, ChevronDown, Clipboard, LockKeyhole, MessageSquareText, ScanLine, ShieldCheck, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import type { Copy } from "@/lib/copy";
import { SAMPLES } from "@/lib/samples";
import { LANG_NAMES, LANGUAGES, MAX_MESSAGE_LENGTH, isLanguage, type InputError, type Language } from "@/lib/types";
import { CATEGORY_ICONS } from "./icons";

export function LanguageSelect({ language, title, onChange, id }: {
  language: Language; title: string; onChange: (value: Language) => void; id?: string;
}) {
  return <span className="select-wrap">
    <select aria-label={title} id={id} value={language} onChange={(event) => {
      if (isLanguage(event.target.value)) onChange(event.target.value);
    }}>
      {LANGUAGES.map((key) => <option key={key} value={key} lang={key}>{LANG_NAMES[key]}</option>)}
    </select>
    <ChevronDown size={14} aria-hidden />
  </span>;
}

interface Props {
  t: Copy;
  message: string;
  setMessage: (value: string) => void;
  error: InputError | null;
  pending: boolean;
  aiAvailable: boolean;
  useAi: boolean;
  setUseAi: (flag: boolean) => void;
  run: (message: string, sample?: boolean) => void;
  paste: () => void;
  clear: () => void;
  actions?: ReactNode;
  review?: ReactNode;
  submitLabel?: string;
}

export function Analyzer({ t, message, setMessage, error, pending, aiAvailable, useAi, setUseAi, run, paste, clear, actions, review, submitLabel }: Props) {
  const sampleText = [
    [t.sampleUpi, t.sampleUpiDesc, "teal"],
    [t.sampleJob, t.sampleJobDesc, "violet"],
    [t.sampleKyc, t.sampleKycDesc, "warn"],
    [t.sampleNormal, t.sampleNormalDesc, "green"],
  ];
  return (
    <section id="analyzer" className="wrap analyze-section" aria-labelledby="analyze-title">
      <div className="section-heading">
        <div className="icon-tile tone-teal section-icon"><ScanLine size={22} aria-hidden /></div>
        <div><h2 id="analyze-title">{t.panelTitle}</h2><p>{t.panelIntro}</p></div>
        <span className="mode"><i />{submitLabel ?? (useAi ? t.aiMode : t.ruleMode)}</span>
      </div>
      {actions}
      <div className="analyze-grid">
        <form className="surface input-panel" onSubmit={(event) => { event.preventDefault(); run(message); }}>
          <div className="input-label"><label htmlFor="message">{t.message}</label>
            <span id="message-count" className={message.length > MAX_MESSAGE_LENGTH ? "count-over" : ""}><span className="sr-only">{t.charCount} </span>{message.length.toLocaleString("en-IN")} / 5,000</span>
          </div>
          <textarea id="message" value={message} placeholder={t.placeholder} disabled={pending}
            aria-invalid={Boolean(error)} aria-describedby={(error ? "message-error " : "") + "privacy-input message-count"}
            spellCheck={false} autoComplete="off" dir="auto" onChange={(event) => setMessage(event.target.value)} />
          {error && <p className="error" id="message-error" role="alert">{t[error]}</p>}
          {review}
          <div className="editor-actions">
            <div className="utility-actions">
              <button type="button" className="button button-quiet" onClick={paste} disabled={pending}><Clipboard size={16} aria-hidden />{t.paste}</button>
              <button type="button" className="button button-quiet" onClick={clear} disabled={pending || !message}><Trash2 size={16} aria-hidden />{t.clear}</button>
            </div>
            <button type="submit" className="button button-primary editor-submit" disabled={pending}><ScanLine size={18} aria-hidden />{pending ? t.scanning : submitLabel ?? t.run}<ArrowUpRight size={17} aria-hidden /></button>
          </div>
          {aiAvailable && <div className="ai-choice">
            <label><input type="checkbox" checked={useAi} disabled={pending} aria-describedby="ai-disclosure" onChange={(event) => setUseAi(event.target.checked)} />{t.aiConsent}</label>
            <p id="ai-disclosure">{t.aiNotice}</p>
          </div>}
          <div className="editor-privacy" id="privacy-input"><LockKeyhole size={14} aria-hidden />{t.noSecrets}</div>
        </form>
        <aside className="surface sample-panel" aria-labelledby="sample-title">
          <h3 id="sample-title">{t.sampleTitle}</h3>
          <p>{t.sampleIntro}</p>
          <div className="sample-list">
            {SAMPLES.map((sample, index) => {
              const Icon = sample.category === "none" ? MessageSquareText : CATEGORY_ICONS[sample.category];
              const [label, description, tone] = sampleText[index];
              return <button className="sample-item" key={sample.id} type="button" disabled={pending} onClick={() => run(sample.message, true)}>
                <span className={"icon-tile tone-" + tone}><Icon size={17} aria-hidden /></span>
                <span className="sample-content"><strong>{label}</strong><small>{description}</small></span>
                <ArrowUpRight className="sample-arrow" size={16} aria-hidden />
              </button>;
            })}
          </div>
        </aside>
      </div>
      <div className="privacy-band"><ShieldCheck size={21} aria-hidden /><div>
        <strong>{aiAvailable ? t.privacyAiTitle : t.privacyTitle}</strong><span>{t.privacyText}</span>
      </div></div>
    </section>
  );
}
