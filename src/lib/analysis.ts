import { inspectLink } from "./links";
import { RULES, type Rule } from "./rules";
import { tr, validateMessage, type Analysis, type Category, type Finding, type Language, type Severity } from "./types";

export const RISK_LABELS = {
  low: tr("Low apparent risk", "कम स्पष्ट जोखिम", "తక్కువగా కనిపించే ప్రమాదం"),
  medium: tr("Some warning signs", "कुछ चेतावनी संकेत", "కొన్ని హెచ్చరిక సంకేతాలు"),
  high: tr("Multiple serious warning signs", "कई गंभीर चेतावनी संकेत", "అనేక తీవ్రమైన హెచ్చరిక సంకేతాలు"),
  critical: tr("Critical warning signs", "अत्यंत गंभीर चेतावनी संकेत", "అత్యంత తీవ్రమైన హెచ్చరిక సంకేతాలు"),
};

const summaries = {
  low: tr("Review the sender and context before trusting the message. A low score cannot establish authenticity.", "भरोसा करने से पहले भेजने वाले और संदर्भ को जाँचें। कम स्कोर से प्रामाणिकता साबित नहीं होती।", "నమ్మే ముందు పంపినవారిని, సందర్భాన్ని తనిఖీ చేయండి. తక్కువ స్కోరు నిజమైనదని నిర్ధారించదు."),
  medium: tr("The message contains patterns worth checking. Confirm the request independently before taking action.", "संदेश में कुछ जाँचने योग्य संकेत हैं। कदम उठाने से पहले अनुरोध की स्वतंत्र पुष्टि करें।", "సందేశంలో తనిఖీ చేయాల్సిన సంకేతాలు ఉన్నాయి. చర్యకు ముందు అభ్యర్థనను విడిగా ధ్రువీకరించండి."),
  high: tr("The message contains serious warning signs. Pause and verify the request through an official channel.", "संदेश में गंभीर संकेत हैं। रुकें और आधिकारिक माध्यम से अनुरोध की पुष्टि करें।", "ఈ సందేశంలో తీవ్రమైన సంకేతాలు ఉన్నాయి. ఆగి అధికారిక మార్గంలో అభ్యర్థనను ధ్రువీకరించండి."),
  critical: tr("The message combines strong warning signs. Avoid payments, links and requests for private information until you verify it.", "संदेश में कई प्रबल संकेत हैं। पुष्टि होने तक भुगतान, लिंक और निजी जानकारी के अनुरोध से बचें।", "బలమైన హెచ్చరిక సంకేతాలు కలిసి ఉన్నాయి. ధ్రువీకరించే వరకు చెల్లింపులు, లింక్‌లు, వ్యక్తిగత వివరాల అభ్యర్థనలను దూరంగా ఉంచండి."),
};
const noEvidence = tr(
  "No obvious indicators matched the rules. The sender and message authenticity remain unverified.",
  "नियमों से कोई स्पष्ट संकेत नहीं मिला। भेजने वाले और संदेश की प्रामाणिकता की पुष्टि नहीं हुई है।",
  "నియమాలకు సరిపోయే స్పష్టమైన సంకేతాలు లేవు. పంపినవారు, సందేశం నిజమైనవో ఇంకా ధ్రువీకరించబడలేదు.",
);
const disclaimer = tr(
  "The score is a heuristic indicator based on text patterns, not a probability of fraud. ScamShield offers educational guidance and cannot verify a sender or replace official reporting.",
  "स्कोर पाठ के पैटर्न पर आधारित संकेत है, धोखाधड़ी की संभावना नहीं। ScamShield शैक्षिक मार्गदर्शन देता है। यह भेजने वाले की पहचान की पुष्टि नहीं करता और आधिकारिक रिपोर्टिंग का विकल्प नहीं है।",
  "ఈ స్కోరు వచన నమూనాల ఆధారంగా వచ్చే సూచిక. ఇది మోస సంభావ్యత కాదు. ScamShield విద్యాపరమైన మార్గదర్శకత్వం ఇస్తుంది. పంపినవారి గుర్తింపును ధ్రువీకరించదు, అధికారిక ఫిర్యాదుకు ప్రత్యామ్నాయం కాదు.",
);
const basicSteps = [
  tr("Check the sender through a contact or official app you already trust.", "पहले से भरोसेमंद संपर्क या आधिकारिक ऐप से भेजने वाले की जाँच करें।", "మీరు ఇప్పటికే నమ్మే సంప్రదింపు లేదా అధికారిక యాప్ ద్వారా పంపినవారిని తనిఖీ చేయండి."),
  tr("If you already sent money, contact your bank and call India’s cyber fraud helpline at 1930.", "पैसे भेज चुके हैं तो बैंक से संपर्क करें और साइबर वित्तीय धोखाधड़ी हेल्पलाइन 1930 पर कॉल करें।", "డబ్బు పంపి ఉంటే బ్యాంకును సంప్రదించి భారత సైబర్ ఆర్థిక మోస హెల్ప్‌లైన్ 1930కు కాల్ చేయండి."),
];
const safeResponse = tr("I’ll check this through the official channel first.", "मैं पहले आधिकारिक माध्यम से इसकी जाँच करूँगा।", "ముందుగా అధికారిక మార్గంలో దీన్ని ధ్రువీకరిస్తాను.");

interface Match { rule: Rule; phrase: string; start: number }

function findPhrase(message: string, rule: Rule): Match | undefined {
  let earliest: Match | undefined;
  for (const pattern of rule.patterns) {
    for (const match of message.matchAll(new RegExp(pattern.source, pattern.flags + "g"))) {
      // Exclude direct safety advice such as "Never share your OTP."
      const before = message.slice(Math.max(0, match.index - 100), match.index);
      const directAdvice = /(?:\bnever|\bdon['’]t|\bdo not|\bdid not|\bavoid|\bno need to)\s+(?:(?:ever|click|you)\s+)?$/iu;
      const indirectAdvice = /\b(?:never|will not|won['’]t|do not)\s+ask\s+(?:you|anyone)\s+to\s+$/iu;
      const linkedAdvice = /\b(?:never|do not|don['’]t)\s+(?:share|send|enter|provide)\s+(?:(?:your|the)\s+)?(?:OTP|PIN|password|credentials)\s+(?:or|and)\s+$/iu;
      if (directAdvice.test(before) || indirectAdvice.test(before) || linkedAdvice.test(before)) continue;
      const after = message.slice(match.index + match[0].length, match.index + match[0].length + 18);
      if (/^\s*(?:मत करें|न करें|వద్దు|చేయవద్దు)/u.test(after)) continue;
      if (!earliest || match.index < earliest.start) earliest = { rule, phrase: match[0], start: match.index };
      break;
    }
  }
  return earliest;
}

function categoryFor(matches: Match[]): Category | "none" {
  const ids = new Set(matches.map(({ rule }) => rule.id));
  if (ids.has("upi-pin")) return "upi";
  if (ids.has("kyc") && (ids.has("secret") || ids.has("authority"))) return "kyc";
  if (ids.has("upfront-fee")) return "job";
  if (ids.has("delivery") && (ids.has("payment") || ids.has("url"))) return "delivery";
  if (ids.has("authority") && !ids.has("kyc")) return "impersonation";
  // A request to send money alone does not identify a payment network.
  return matches.find(({ rule }) => rule.id !== "payment")?.rule.category ?? "none";
}

export function analyzeMessage(message: string, language: Language): Analysis {
  const error = validateMessage(message);
  if (error) throw new RangeError(error);

  const detected = RULES.flatMap((rule) => {
    const match = findPhrase(message, rule);
    return match ? [match] : [];
  });
  const independent = new Set(detected.filter(({ rule }) => !rule.needs).map(({ rule }) => rule.id));
  const matches = detected.filter(({ rule }) => !rule.needs || rule.needs.some((id) => independent.has(id)));
  const link = inspectLink(message);
  if (link) {
    // A concrete URL and an instruction to click it are one source of link evidence.
    const genericLink = matches.findIndex(({ rule, phrase }) => rule.id === "link-instruction" && !/QR/iu.test(phrase));
    if (genericLink !== -1) matches.splice(genericLink, 1);
    matches.push(link);
  }
  matches.sort((a, b) => b.rule.weight - a.rule.weight || a.start - b.start);
  const riskScore = Math.min(100, matches.reduce((score, { rule }) => score + rule.weight, 0));
  const riskLevel: Severity = riskScore >= 90 ? "critical" : riskScore >= 50 ? "high" : riskScore >= 20 ? "medium" : "low";
  const findings: Finding[] = matches.map(({ rule, phrase, start }) => ({
    id: rule.id, phrase, start, end: start + phrase.length, title: rule.title[language],
    reason: rule.reason[language], severity: rule.severity, points: rule.weight, recommendation: rule.recommendation[language],
  }));
  const otherScript = /\p{Letter}/gu;
  const letters = message.match(otherScript) ?? [];
  const supportedLetters = letters.filter((character) => /[\p{Script=Latin}\p{Script=Devanagari}\p{Script=Telugu}]/u.test(character));
  return {
    riskScore, riskLevel, category: categoryFor(matches), findings,
    summary: findings.length ? summaries[riskLevel][language] : noEvidence[language],
    safetySteps: [...new Set([
      ...findings.slice(0, 3).map(({ recommendation }) => recommendation),
      basicSteps[0][language],
      ...(riskScore >= 20 ? [basicSteps[1][language]] : []),
    ])],
    suggestedResponse: safeResponse[language], disclaimer: disclaimer[language],
    limitedLanguage: letters.length === 0 || supportedLetters.length / letters.length < 0.65,
  };
}
