import { ArrowUpRight, BookOpen, Check, ChevronDown, Clipboard, Globe2, HandHeart, Headset, Landmark, MessageSquareText, Search, ShieldCheck, UsersRound } from "lucide-react";
import { useState } from "react";
import type { Copy } from "@/lib/copy";
import { familyWarning, GUIDES } from "@/lib/library";
import { CATEGORIES, type Category, type Language } from "@/lib/types";
import { LanguageSelect } from "./analyzer";
import { CATEGORY_ICONS } from "./icons";

export function Resources({ t, compact = false }: { t: Copy; compact?: boolean }) {
  const links = [
    { href: "https://cybercrime.gov.in/", title: t.portal, description: t.portalDesc, Icon: Landmark },
    { href: "https://www.npci.org.in/fraud-awareness", title: t.npci, description: t.npciDesc, Icon: ShieldCheck },
    { href: "tel:1930", title: t.helpline, description: t.helplineDesc, Icon: Headset },
  ];
  return <section className={compact ? "result-resources" : "wrap resources-section content-section"} id={compact ? undefined : "resources"}>
    {compact ? <h3>{t.resources}</h3> : <><h2>{t.resources}</h2><p className="section-desc">{t.resourcesIntro}</p></>}
    <div className="resources-list">
      {links.map(({ href, title, description, Icon }) =>
        <a key={href} className="resource-card" href={href} target={href.startsWith("https:") ? "_blank" : undefined} rel="noreferrer">
          <span className="icon-tile tone-teal"><Icon size={19} aria-hidden /></span>
          <span><strong>{title}</strong>{!compact && <small>{description}</small>}</span>
          <ArrowUpRight size={17} aria-hidden />
        </a>,
      )}
    </div>
  </section>;
}

export function HowItWorks({ t }: { t: Copy }) {
  const steps = [
    [MessageSquareText, t.how1Title, t.how1Text],
    [Search, t.how2Title, t.how2Text],
    [HandHeart, t.how3Title, t.how3Text],
  ] as const;
  return <section className="wrap content-section how-section" aria-labelledby="how-title">
    <h2 id="how-title">{t.howTitle}</h2>
    <div className="how-grid">
      {steps.map(([Icon, title, description]) => <article className="surface how-card" key={title}>
        <div className="icon-tile tone-teal"><Icon size={20} aria-hidden /></div>
        <h3>{title}</h3><p>{description}</p>
      </article>)}
    </div>
  </section>;
}

export function Library({ t, language }: { t: Copy; language: Language }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const matches = CATEGORIES.filter((category) => {
    const guide = GUIDES[category];
    return [category, ...Object.values(guide.title), guide.description[language], guide.signs[language]].join(" ").toLowerCase().includes(normalized);
  });
  return <section className="wrap content-section library-section" id="library" aria-labelledby="library-title">
    <div className="section-heading">
      <div className="icon-tile tone-teal section-icon"><BookOpen size={21} aria-hidden /></div>
      <div><h2 id="library-title">{t.library}</h2><p>{t.libraryIntro}</p></div>
      <div className="search-field">
        <Search size={17} aria-hidden /><input type="search" value={query} aria-label={t.search} placeholder={t.search} onChange={(event) => setQuery(event.target.value)} />
      </div>
    </div>
    {matches.length ? <div className="library-grid">
      {matches.map((category) => {
        const guide = GUIDES[category];
        const Icon = CATEGORY_ICONS[category];
        const tone = ["teal", "blue", "violet"][CATEGORIES.indexOf(category) % 3];
        return <details className="surface guide-card" key={category}>
          <summary>
            <span className={"icon-tile tone-" + tone}><Icon size={19} aria-hidden /></span>
            <span><strong>{guide.title[language]}</strong><small>{guide.description[language]}</small></span>
            <ChevronDown size={17} aria-hidden />
          </summary>
          <dl>
            <dt>{t.signs}</dt><dd>{guide.signs[language]}</dd>
            <dt>{t.example}</dt><dd><q>{guide.example[language]}</q></dd>
            <dt>{t.avoid}</dt><dd>{guide.avoid[language]}</dd>
            <dt>{t.action}</dt><dd>{guide.action[language]}</dd>
          </dl>
        </details>;
      })}
    </div> : <div className="surface library-empty" role="status"><Search size={22} aria-hidden />{t.noMatches}</div>}
  </section>;
}

export function Toolkit({ t, language, warningLanguage, category, setCategory, onLanguage, onCopy }: {
  t: Copy; language: Language; warningLanguage: Language; category: Category | "none";
  setCategory: (value: Category | "none") => void; onLanguage: (language: Language) => void; onCopy: (text: string) => void;
}) {
  const warning = familyWarning(category, warningLanguage);
  return <section id="family" className="wrap content-section" aria-labelledby="family-title">
    <div className="surface toolkit">
      <div>
        <div className="icon-tile tone-teal toolkit-icon"><UsersRound size={25} aria-hidden /></div>
        <h2 id="family-title">{t.familyTitle}</h2>
        <p>{t.familyIntro}</p>
        <div className="toolkit-private"><Check size={17} aria-hidden />{t.familyPrivacy}</div>
      </div>
      <div className="toolkit-controls">
        <div className="toolkit-selects">
          <div><label htmlFor="warning-topic">{t.topic}</label><span className="select-wrap">
            <select id="warning-topic" value={category} onChange={(event) => {
              const value = event.target.value;
              setCategory(CATEGORIES.find((key) => key === value) ?? "none");
            }}><option value="none">{t.general}</option>
              {CATEGORIES.map((key) => <option value={key} key={key}>{GUIDES[key].title[language]}</option>)}
            </select><ChevronDown size={14} aria-hidden />
          </span></div>
          <div><label htmlFor="warning-language">{t.warningLanguage}</label><LanguageSelect id="warning-language" title={t.warningLanguage} language={warningLanguage} onChange={onLanguage} /></div>
        </div>
        <div className="warning-preview"><div><Globe2 size={15} aria-hidden />{t.preview}</div><p lang={warningLanguage}>{warning}</p></div>
        <button type="button" className="button button-primary" onClick={() => onCopy(warning)}><Clipboard size={17} aria-hidden />{t.copy}</button>
      </div>
    </div>
  </section>;
}
