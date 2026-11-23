import { tr, type Category, type Localized, type Severity } from "./types";

export interface Rule {
  id: string;
  category: Category;
  weight: number;
  severity: Severity;
  patterns: RegExp[];
  title: Localized;
  reason: Localized;
  recommendation: Localized;
  needs?: string[];
}

export const RULES: Rule[] = [
  {
    id: "upi-pin", category: "upi", weight: 54, severity: "critical",
    patterns: [
      /\b(?:enter|share|confirm|provide|submit|type)\s+(?:(?:your|the)\s+)?(?:UPI\s+PIN|UPI\s+passcode)\b(?:\s+to\s+(?:receive|claim))?/iu,
      /UPI\s*पिन\s*(?:डालें|दर्ज करें|बताएं|शेयर करें)|(?:यूपीआई|यूपीआइ)\s*पिन\s*(?:डालें|बताएं)/iu,
      /(?:UPI|యూపీఐ)\s*(?:PIN|పిన్)\s*(?:నమోదు చేయండి|చెప్పండి|పంచుకోండి|ఎంటర్ చేయండి)/iu,
    ],
    title: tr("UPI PIN request", "UPI पिन की माँग", "UPI పిన్ అడగడం"),
    reason: tr("A UPI PIN authorizes an outgoing payment. You can receive money without entering or sharing it.", "UPI पिन से पैसे भेजने की अनुमति मिलती है। पैसे पाने के लिए इसे डालने या बताने की ज़रूरत नहीं होती।", "UPI పిన్‌తో బయటకు వెళ్లే చెల్లింపును ఆమోదిస్తారు. డబ్బు అందుకోవడానికి పిన్ ఇవ్వాల్సిన అవసరం లేదు."),
    recommendation: tr("Decline the request and verify in your own UPI app.", "अनुरोध अस्वीकार करें और अपने UPI ऐप में जाँचें।", "అభ్యర్థనను తిరస్కరించి మీ UPI యాప్‌లో తనిఖీ చేయండి."),
  },
  {
    id: "secret", category: "credential", weight: 46, severity: "critical",
    patterns: [
      /\b(?:share|send|provide|confirm|enter|tell\s+(?:us|me)|submit|reply\s+with)\s+(?:(?:your|the|a|your\s+banking)\s+)?(?:OTP|one[- ]time (?:password|code)|(?:banking\s+)?password|banking credentials|CVV|verification code)\b/iu,
      /(?:OTP|ओटीपी|पासवर्ड|सीवीवी)\s*(?:बताएँ|बताएं|भेजें|शेयर करें|साझा करें|दर्ज करें)/iu,
      /(?:OTP|ఓటీపీ|పాస్‌వర్డ్|సీవీవీ)\s*(?:చెప్పండి|పంపండి|నమోదు చేయండి|షేర్ చేయండి|పంచుకోండి)/iu,
    ],
    title: tr("Credential request", "गोपनीय जानकारी की माँग", "రహస్య వివరాలు అడగడం"),
    reason: tr("A one-time code or password could let someone sign in or authorize a transaction.", "एक बार का कोड या पासवर्ड किसी और को लॉग इन करने या लेन-देन मंज़ूर करने दे सकता है।", "ఒకసారి వాడే కోడ్ లేదా పాస్‌వర్డ్ వల్ల మరొకరు లాగిన్ కావచ్చు లేదా లావాదేవీని ఆమోదించవచ్చు."),
    recommendation: tr("Keep OTPs, PINs and passwords to yourself.", "OTP, पिन और पासवर्ड किसी को न दें।", "OTP, పిన్, పాస్‌వర్డ్‌లను ఎవరికీ ఇవ్వకండి."),
  },
  {
    id: "upfront-fee", category: "job", weight: 36, severity: "high",
    patterns: [
      /\b(?:pay|send|transfer|deposit)\s+(?:(?:an?|the)\s+)?(?:₹\s*[\d,.]+\s*)?(?:upfront\s+)?(?:registration|onboarding|training|joining|interview|application)\s+fee\b/iu,
      /\bpayment\s+(?:is\s+)?required\s+before\s+(?:joining|the interview)\b/iu,
      /(?:रजिस्ट्रेशन|पंजीकरण|जॉइनिंग)\s*(?:का\s*)?(?:शुल्क|फीस)\s*(?:भरें|दें|जमा करें)/iu,
      /(?:రిజిస్ట్రేషన్|చేరిక)\s*(?:ఫీజు|రుసుము)\s*చెల్లించండి/iu,
    ],
    title: tr("Upfront fee", "अग्रिम शुल्क", "ముందస్తు రుసుము"),
    reason: tr("Charging a fee to secure an interview or a job is a common recruitment fraud pattern.", "इंटरव्यू या नौकरी पक्की करने के लिए शुल्क माँगना भर्ती घोटाले का आम तरीका है।", "ఇంటర్వ్యూ లేదా ఉద్యోగాన్ని ఖాయం చేస్తామని రుసుము అడగడం నియామక మోసంలో సాధారణం."),
    recommendation: tr("Check the vacancy on the employer’s official careers page before paying anything.", "भुगतान करने से पहले कंपनी की आधिकारिक वेबसाइट पर पद की जाँच करें।", "డబ్బు చెల్లించే ముందు సంస్థ అధికారిక ఉద్యోగాల పేజీలో ఖాళీని తనిఖీ చేయండి."),
  },
  {
    id: "payment", category: "upi", weight: 23, severity: "medium",
    patterns: [
      /\b(?:send\s+(?:(?:the|us|me|your)\s+)?money|transfer\s+(?:the\s+)?amount|pay\s+(?:(?:the|a)\s+)?(?:processing charges|verification fee|release fee|security deposit))\b/iu,
      /(?:पैसे|रकम)\s*(?:भेजें|ट्रांसफर करें)|प्रोसेसिंग\s*(?:शुल्क|फीस)\s*दें/iu,
      /డబ్బు\s*(?:పంపండి|బదిలీ చేయండి)|ప్రాసెసింగ్\s*ఫీజు\s*చెల్లించండి/iu,
    ],
    title: tr("Payment request", "भुगतान का अनुरोध", "చెల్లింపు అభ్యర్థన"),
    reason: tr("An unexpected request to send money deserves a separate check.", "अचानक पैसे भेजने का अनुरोध मिले तो अलग से पुष्टि करें।", "అనుకోకుండా డబ్బు పంపమంటే విడిగా ధ్రువీకరించండి."),
    recommendation: tr("Confirm the recipient and reason using a contact you already trust.", "पहले से भरोसेमंद संपर्क से प्राप्तकर्ता और वजह की पुष्टि करें।", "మీకు ముందే తెలిసిన సంప్రదింపు ద్వారా గ్రహీతను, కారణాన్ని ధ్రువీకరించండి."),
  },
  {
    id: "kyc", category: "kyc", weight: 23, severity: "medium",
    patterns: [
      /\b(?:verify|update|complete|re[- ]?activate)\s+(?:(?:your|the|bank)\s+)?KYC\b/iu,
      /(?:KYC|केवाईसी)\s*(?:अपडेट करें|पूरी करें|सत्यापित करें|करवाएं)/iu,
      /(?:KYC|కేవైసీ)\s*(?:అప్‌డేట్ చేయండి|పూర్తి చేయండి|ధృవీకరించండి)/iu,
    ],
    title: tr("KYC verification request", "KYC सत्यापन का अनुरोध", "KYC ధ్రువీకరణ అభ్యర్థన"),
    reason: tr("Identity-check requests can be used to move customers away from their bank’s official channels.", "पहचान की जाँच के बहाने आपको बैंक के आधिकारिक माध्यम से दूर ले जाया जा सकता है।", "గుర్తింపు తనిఖీ పేరిట బ్యాంకు అధికారిక మార్గాల నుంచి మిమ్మల్ని మళ్లించవచ్చు."),
    recommendation: tr("Open the bank’s official app yourself to check your KYC status.", "KYC की स्थिति देखने के लिए बैंक का आधिकारिक ऐप स्वयं खोलें।", "KYC స్థితిని మీరే బ్యాంకు అధికారిక యాప్‌లో చూడండి."),
  },
  {
    id: "job-income", category: "job", weight: 27, severity: "high",
    patterns: [
      /\b(?:earn(?:ing)?|make)\s+(?:up to\s+)?₹\s*[\d,.]+\s+(?:every\s+(?:day|week)|daily|weekly|per\s+(?:day|week))\b/iu,
      /\b(?:guaranteed income|no experience and guaranteed pay|earn from home with no work)\b/iu,
      /(?:घर बैठे|रोज़ाना|हर दिन)\s*(?:₹\s*[\d,.]+\s*)?(?:कमाएँ|कमाएं|गारंटीड कमाई)/iu,
      /(?:రోజుకు|వారానికి)\s*₹\s*[\d,.]+\s*(?:సంపాదించండి|ఆదాయం)/iu,
    ],
    title: tr("Unusually high pay promise", "असामान्य कमाई का दावा", "అసాధారణ ఆదాయ వాగ్దానం"),
    reason: tr("Large earnings promised before a genuine interview or role description can be a recruitment lure.", "असली इंटरव्यू या काम का विवरण देने से पहले भारी कमाई का दावा फँसाने का तरीका हो सकता है।", "నిజమైన ఇంటర్వ్యూ లేదా పని వివరాలు లేకుండానే భారీ ఆదాయం చెబితే అది ఎర కావచ్చు."),
    recommendation: tr("Verify the employer, interview process and written terms independently.", "नियोक्ता, इंटरव्यू प्रक्रिया और लिखित शर्तों की स्वतंत्र जाँच करें।", "యజమాని, ఇంటర్వ్యూ విధానం, రాతపూర్వక నిబంధనలను విడిగా తనిఖీ చేయండి."),
  },
  {
    id: "investment", category: "investment", weight: 41, severity: "high",
    patterns: [
      /\b(?:guaranteed\s+(?:\d+%\s+)?returns?|double\s+your\s+money|risk[- ]free\s+(?:profit|investment)|guaranteed profit)\b/iu,
      /(?:गारंटीड रिटर्न|पैसा दोगुना|जोखिम रहित मुनाफ़ा)/iu,
      /(?:హామీ లాభాలు|మీ డబ్బు రెట్టింపు|ప్రమాదం లేని లాభం)/iu,
    ],
    title: tr("Guaranteed-return claim", "गारंटीड रिटर्न का दावा", "హామీ లాభాల దావా"),
    reason: tr("Promises of fast or risk-free returns can mask an investment scam.", "तेज़ या बिना जोखिम के मुनाफ़े का वादा निवेश घोटाला छिपा सकता है।", "త్వరగా లేదా నష్టభయం లేకుండా రాబడి వస్తుందనే మాట పెట్టుబడి మోసాన్ని దాచవచ్చు."),
    recommendation: tr("Verify the firm’s registration and confirm the offer through independent sources.", "कंपनी का पंजीकरण और प्रस्ताव स्वतंत्र स्रोतों से जाँचें।", "సంస్థ నమోదు, ఆఫర్‌ను స్వతంత్ర వనరుల ద్వారా ధ్రువీకరించండి."),
  },
  {
    id: "reward", category: "reward", weight: 22, severity: "medium",
    patterns: [
      /\b(?:(?:congratulations[!,]?\s+)?you\s+(?:have\s+)?won\s+₹?\s*[\d,.]+\s*(?:cashback|lottery|prize)?|congratulations[!,]?\s+you\s+(?:have\s+)?won|claim\s+your\s+(?:prize|reward|cashback)|guaranteed cashback|free reward|you won the lottery)\b/iu,
      /(?:लॉटरी जीत गए|इनाम का दावा करें|कैशबैक जीत लिया|गारंटीड कैशबैक)/iu,
      /(?:లాటరీ గెలిచారు|బహుమతి పొందండి|క్యాష్‌బ్యాక్ గెలుచుకున్నారు)/iu,
    ],
    title: tr("Unexpected reward", "अचानक इनाम", "అనుకోని బహుమతి"),
    reason: tr("A surprise reward can lower your guard before a payment or credential request.", "अचानक इनाम मिलने की बात भुगतान या गोपनीय जानकारी माँगने से पहले आपका भरोसा जीत सकती है।", "అనుకోని బహుమతి ఆశ చూపి తర్వాత డబ్బు లేదా రహస్య వివరాలు అడగవచ్చు."),
    recommendation: tr("Check any promotion directly with the company through its official app or site.", "प्रचार की पुष्टि कंपनी के आधिकारिक ऐप या वेबसाइट से करें।", "ఆఫర్‌ను సంస్థ అధికారిక యాప్ లేదా వెబ్‌సైట్‌లో ధ్రువీకరించండి."),
  },
  {
    id: "app-install", category: "link", weight: 36, severity: "high",
    patterns: [
      /\b(?:install|download|sideload)\s+(?:(?:the|this|an?)\s+)?(?:[a-z\d_-]+\.)?APK\b|\b(?:install|download)\s+(?:AnyDesk|TeamViewer|a remote access app)\b/iu,
      /(?:APK|एपीके)\s*(?:इंस्टॉल करें|डाउनलोड करें)|रिमोट एक्सेस ऐप\s*इंस्टॉल करें/iu,
      /(?:APK|ఏపీకే)\s*(?:ఇన్‌స్టాల్ చేయండి|డౌన్‌లోడ్ చేయండి)/iu,
    ],
    title: tr("App installation request", "ऐप इंस्टॉल करने की माँग", "యాప్ ఇన్‌స్టాల్ చేయమనే అభ్యర్థన"),
    reason: tr("An unsolicited APK or remote access tool could give a stranger access to your device.", "अचानक भेजा गया APK या रिमोट एक्सेस ऐप किसी अनजान व्यक्ति को आपके फ़ोन की पहुँच दे सकता है।", "అడగకుండా పంపిన APK లేదా రిమోట్ యాప్ మీ పరికరాన్ని అపరిచితులకు అందుబాటులోకి తేవచ్చు."),
    recommendation: tr("Do not install an app or share your screen at a sender’s request.", "भेजने वाले के कहने पर ऐप इंस्टॉल या स्क्रीन शेयर न करें।", "పంపినవారి మాటకు యాప్ ఇన్‌స్టాల్ చేయకండి, స్క్రీన్ పంచుకోకండి."),
  },
  {
    id: "delivery", category: "delivery", weight: 24, severity: "medium",
    patterns: [
      /\b(?:parcel|package|shipment|delivery)\b[^.!?\n]{0,42}\b(?:held|on hold|failed|suspended|redelivery fee|customs fee|update your address)\b/iu,
      /(?:पार्सल|डिलीवरी)\s*(?:रोक दी गई|अटक गया|शुल्क भरें)/iu,
      /(?:పార్సిల్|డెలివరీ)\s*(?:నిలిపివేశారు|రుసుము చెల్లించండి)/iu,
    ],
    title: tr("Parcel or delivery claim", "पार्सल या डिलीवरी का दावा", "పార్సిల్ లేదా డెలివరీ దావా"),
    reason: tr("An unexpected delivery failure or fee can be a pretext to collect payment or personal details.", "अचानक डिलीवरी रुकने या शुल्क का संदेश भुगतान या निजी जानकारी लेने का बहाना हो सकता है।", "హఠాత్తుగా డెలివరీ విఫలమైందని లేదా ఫీజు కావాలని చెప్పడం డబ్బు, వ్యక్తిగత వివరాలు అడిగే సాకు కావచ్చు."),
    recommendation: tr("Check tracking through the retailer or courier you used.", "सामान विक्रेता या इस्तेमाल किए गए कूरियर से ट्रैक करें।", "మీరు వాడిన విక్రేత లేదా కొరియర్ వద్ద ట్రాకింగ్ తనిఖీ చేయండి."),
  },
  {
    id: "urgency", category: "urgency", weight: 15, severity: "medium",
    patterns: [
      /\b(?:act immediately|last chance|respond now|within \d+\s*(?:minutes?|hours?)|(?:account|card)\s+will be\s+(?:blocked|suspended|closed)|today to confirm|arrest warrant|digital arrest|immediately)\b/iu,
      /(?:तुरंत|आखिरी मौका|अंतिम मौका|खाता बंद हो जाएगा|खाता ब्लॉक|डिजिटल गिरफ्तारी)/iu,
      /(?:వెంటనే|చివరి అవకాశం|ఖాతా బ్లాక్|డిజిటల్ అరెస్ట్)/iu,
    ],
    title: tr("Urgency or threat", "जल्दबाज़ी या धमकी", "తొందర లేదా బెదిరింపు"),
    reason: tr("A deadline or threat can pressure you to act before checking the facts.", "समय सीमा या धमकी आपको तथ्य जाँचने से पहले कदम उठाने पर मजबूर कर सकती है।", "గడువు లేదా బెదిరింపు నిజాలు తెలుసుకునేలోపే చర్య తీసుకోమని ఒత్తిడి చేయవచ్చు."),
    recommendation: tr("Pause and verify through a trusted channel before acting.", "रुकें और कोई कदम उठाने से पहले भरोसेमंद माध्यम से जाँचें।", "ఆగి, చర్య తీసుకునే ముందు విశ్వసనీయ మార్గంలో ధ్రువీకరించండి."),
  },
  {
    id: "authority", category: "impersonation", weight: 13, severity: "medium",
    needs: ["payment", "upi-pin", "secret", "kyc", "app-install", "delivery"],
    patterns: [
      /\b(?:bank account|bank officer|bank support|RBI|police(?: officer)?|government official|customs officer|CBI|courier (?:service|support)|delivery agent)\b/iu,
      /(?:बैंक खाता|बैंक अधिकारी|पुलिस|सरकारी अधिकारी|कस्टम अधिकारी)/iu,
      /(?:బ్యాంకు ఖాతా|బ్యాంక్ అధికారి|పోలీసు|ప్రభుత్వ అధికారి|కస్టమ్స్ అధికారి)/iu,
    ],
    title: tr("Possible impersonation", "संभावित प्रतिरूपण", "ఇతరుల పేరుతో మోసం కావచ్చు"),
    reason: tr("The message invokes a trusted institution alongside a suspicious request. The sender’s identity is unverified.", "संदिग्ध अनुरोध में किसी भरोसेमंद संस्था का नाम लिया गया है। भेजने वाले की पहचान की पुष्टि नहीं है।", "సందేహాస్పద అభ్యర్థనతో పాటు విశ్వసనీయ సంస్థ పేరును వాడారు. పంపినవారి గుర్తింపు ధ్రువీకరించబడలేదు."),
    recommendation: tr("Contact the institution using details you find independently.", "संस्था से ऐसे नंबर या माध्यम पर संपर्क करें जो आपने खुद खोजा हो।", "మీరు స్వయంగా కనుగొన్న వివరాలతో సంస్థను సంప్రదించండి."),
  },
  {
    id: "link-instruction", category: "link", weight: 9, severity: "low",
    needs: ["kyc", "secret", "upi-pin", "reward", "payment", "delivery"],
    patterns: [
      /\b(?:(?:using|follow|use|click|tap|open)\s+(?:(?:on\s+)?(?:this|the|here)\s+)?link|click here|scan\s+(?:the|this)\s+QR code)\b/iu,
      /(?:इस लिंक पर क्लिक करें|QR कोड स्कैन करें)/iu,
      /(?:ఈ లింక్‌పై క్లిక్ చేయండి|QR కోడ్ స్కాన్ చేయండి)/iu,
    ],
    title: tr("Link or QR instruction", "लिंक या QR का निर्देश", "లింక్ లేదా QR సూచన"),
    reason: tr("A message link or QR code can take you to an unverified destination. The destination has not been checked.", "संदेश का लिंक या QR आपको अपुष्ट जगह ले जा सकता है। गंतव्य की जाँच नहीं हुई है।", "సందేశంలోని లింక్ లేదా QR మిమ్మల్ని ధ్రువీకరించని చిరునామాకు తీసుకెళ్లవచ్చు. గమ్యాన్ని పరిశీలించలేదు."),
    recommendation: tr("Open the official app or type the address you already know.", "आधिकारिक ऐप खोलें या पहले से ज्ञात पता टाइप करें।", "అధికారిక యాప్ తెరవండి లేదా మీకు ముందే తెలిసిన చిరునామాను టైప్ చేయండి."),
  },
];
