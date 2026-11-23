import type { Rule } from "./rules";
import { tr } from "./types";

const shorteners = new Set(["bit.ly", "tinyurl.com", "t.co", "cutt.ly", "rebrand.ly", "is.gd", "ow.ly", "shorturl.at"]);
const brands: Record<string, string[]> = {
  sbi: ["sbi.co.in", "onlinesbi.sbi", "sbi.bank.in", "onlinesbi.com"],
  hdfc: ["hdfcbank.com", "hdfc.bank.in", "hdfc.com"],
  icici: ["icicibank.com", "icici.bank.in"],
  phonepe: ["phonepe.com"],
  paytm: ["paytm.com", "paytmbank.com"],
  npci: ["npci.org.in"],
  indiapost: ["indiapost.gov.in"],
};
const belongsTo = (host: string, root: string) => host === root || host.endsWith("." + root);
const linkRule = {
  id: "url", category: "link", severity: "medium", patterns: [],
  recommendation: tr("Avoid opening the submitted link. Find the official service independently.", "दिए हुए लिंक को न खोलें। आधिकारिक सेवा खुद खोजें।", "పంపిన లింక్‌ను తెరవకండి. అధికారిక సేవను స్వయంగా కనుగొనండి."),
} as const satisfies Omit<Rule, "weight" | "title" | "reason">;

const formats = {
  shortener: {
    weight: 16,
    title: tr("Shortened URL", "छोटा किया गया URL", "కుదించిన URL"),
    reason: tr("This shortener hides the final destination. It can also be used for legitimate links.", "छोटे लिंक से असली गंतव्य छिप जाता है। वैध लिंक में भी इसका उपयोग होता है।", "కుదించిన లింక్ తుది గమ్యాన్ని దాచుతుంది. చెల్లుబాటు అయ్యే లింక్‌లు కూడా ఇలా ఉండవచ్చు."),
  },
  address: {
    weight: 25,
    title: tr("IP address or unusual URL format", "IP पता या असामान्य URL", "IP చిరునామా లేదా అసాధారణ URL"),
    reason: tr("This URL uses an IP address or unfamiliar formatting that can obscure who operates it.", "URL में IP पता या ऐसा प्रारूप है जिससे संचालक पहचानना मुश्किल हो सकता है।", "ఈ URL‌లో IP చిరునామా లేదా అసాధారణ నిర్మాణం ఉంది. దాన్ని ఎవరు నడుపుతున్నారో స్పష్టంగా తెలియకపోవచ్చు."),
  },
  brand: {
    weight: 30,
    title: tr("Brand-like URL", "ब्रांड जैसा URL", "బ్రాండ్‌ను పోలిన URL"),
    reason: tr("The host contains a familiar brand name outside the recognized domains in this tool’s list.", "होस्ट में परिचित ब्रांड है, लेकिन वह इस टूल की ज्ञात डोमेन सूची में नहीं है।", "హోస్ట్‌లో పరిచయమైన బ్రాండ్ ఉంది. అది ఈ సాధనంలో ఉన్న గుర్తింపు పొందిన డొమైన్‌లలో లేదు."),
  },
};

export function inspectLink(message: string): { rule: Rule; phrase: string; start: number } | undefined {
  let strongest: { rule: Rule; phrase: string; start: number } | undefined;
  // URL parsing is string-only. No network lookups or click targets are created.
  const candidates = message.matchAll(/(?:https?:\/\/[^\s<>"']+|\bwww\.[^\s<>"']+|\b(?:bit\.ly|tinyurl\.com|t\.co|cutt\.ly|rebrand\.ly|is\.gd|ow\.ly|shorturl\.at)\/[^\s<>"']+|\b(?:[\w-]+\.)+(?:com|in|net|org|xyz|top|site|click|online|bank)(?=$|[\/?#:\s.,;!<>"'])(?:[\/?#][^\s<>"']*)?)/giu);
  for (const match of candidates) {
    const candidate = match[0].replace(/[.,!?;)}]+$/u, "");
    const phrase = candidate.includes("[") ? candidate : candidate.replace(/\]+$/u, "");
    const before = message[match.index - 1];
    if (before === "@") continue;
    let format: keyof typeof formats;
    try {
      const url = new URL(/^https?:\/\//iu.test(phrase) ? phrase : "https://" + phrase);
      const host = url.hostname.replace(/\.$/u, "").toLowerCase();
      if (url.username || url.password || /^\d+(?:\.\d+){3}$/u.test(host) || host.startsWith("[") ||
        /(?:^|\.)xn--/u.test(host) || host.split(".").length > 5) {
        format = "address";
      } else if (shorteners.has(host.replace(/^www\./u, ""))) {
        format = "shortener";
      } else if (Object.entries(brands).some(([brand, roots]) =>
        host.includes(brand) && !roots.some((root) => belongsTo(host, root)))) {
        format = "brand";
      } else {
        continue;
      }
    } catch {
      if (!/^https?:\/\/[^\s]*[./@][^\s]*/iu.test(phrase)) continue;
      format = "address";
    }
    const rule = { ...linkRule, ...formats[format] };
    if (!strongest || rule.weight > strongest.rule.weight) strongest = { rule, phrase, start: match.index };
  }
  return strongest;
}
