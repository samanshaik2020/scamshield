import { tr, type Category, type Language, type Localized } from "./types";

export interface Guide {
  title: Localized;
  description: Localized;
  signs: Localized;
  example: Localized;
  avoid: Localized;
  action: Localized;
}

export const GUIDES: Record<Category, Guide> = {
  upi: {
    title: tr("UPI payment scams", "UPI भुगतान घोटाले", "UPI చెల్లింపు మోసాలు"),
    description: tr("A sender disguises a payment or collect request as money coming to you.", "कोई भुगतान या कलेक्ट अनुरोध को पैसे मिलने जैसा दिखाता है।", "చెల్లింపు లేదా కలెక్ట్ అభ్యర్థనను మీకు డబ్బు వస్తున్నట్లు చూపిస్తారు."),
    signs: tr("A QR code to receive money, an unexpected collect request or a request for your UPI PIN.", "पैसे पाने के लिए QR कोड, अचानक कलेक्ट अनुरोध या UPI पिन की माँग।", "డబ్బు స్వీకరించడానికి QR కోడ్, ఊహించని కలెక్ట్ అభ్యర్థన లేదా UPI పిన్ అడగడం."),
    example: tr("Enter your UPI PIN to receive the refund.", "रिफ़ंड पाने के लिए UPI पिन डालें।", "రిఫండ్ అందుకోవడానికి UPI పిన్ నమోదు చేయండి."),
    avoid: tr("Do not approve a request you did not create or expect.", "अनजान या अप्रत्याशित भुगतान अनुरोध मंज़ूर न करें।", "మీరు చేయని లేదా ఊహించని అభ్యర్థనను ఆమోదించకండి."),
    action: tr("Open your UPI app yourself and review the transaction history.", "अपना UPI ऐप खुद खोलें और लेन-देन का इतिहास देखें।", "మీ UPI యాప్‌ను స్వయంగా తెరిచి లావాదేవీల చరిత్రను చూడండి."),
  },
  reward: {
    title: tr("Cashback & lottery scams", "कैशबैक और लॉटरी घोटाले", "క్యాష్‌బ్యాక్, లాటరీ మోసాలు"),
    description: tr("An unexpected prize is used to ask for money or private information.", "अचानक इनाम का लालच देकर पैसे या निजी जानकारी माँगी जाती है।", "అనుకోని బహుమతి ఆశ చూపి డబ్బు లేదా వ్యక్తిగత వివరాలు అడుగుతారు."),
    signs: tr("You never entered the draw, a release fee is due or the offer expires immediately.", "लॉटरी में भाग नहीं लिया, इनाम के लिए शुल्क माँगा गया या प्रस्ताव तुरंत समाप्त होता है।", "మీరు డ్రాలో పాల్గొనలేదు, విడుదల రుసుము అడుగుతున్నారు లేదా ఆఫర్ వెంటనే ముగుస్తుంది."),
    example: tr("Claim your prize today. Pay a processing fee to release it.", "आज अपना इनाम लें। इसे पाने के लिए प्रोसेसिंग शुल्क दें।", "ఈరోజే బహుమతి పొందండి. విడుదలకు ప్రాసెసింగ్ రుసుము చెల్లించండి."),
    avoid: tr("Avoid paying a fee or entering a PIN to receive a prize.", "इनाम पाने के लिए शुल्क न दें और पिन न डालें।", "బహుమతి కోసం రుసుము చెల్లించకండి, పిన్ ఇవ్వకండి."),
    action: tr("Look up the promotion on the organizer’s official website.", "आयोजक की आधिकारिक वेबसाइट पर प्रचार खोजें।", "నిర్వాహకుల అధికారిక వెబ్‌సైట్‌లో ఆఫర్‌ను చూడండి."),
  },
  credential: {
    title: tr("OTP & credential theft", "OTP और लॉगिन की चोरी", "OTP, లాగిన్ వివరాల దొంగతనం"),
    description: tr("A sender asks for a code or password that can unlock your accounts.", "ऐसा कोड या पासवर्ड माँगा जाता है जिससे आपका खाता खोला जा सके।", "మీ ఖాతా తెరవడానికి ఉపయోగించే కోడ్ లేదా పాస్‌వర్డ్ అడుగుతారు."),
    signs: tr("Requests for one-time codes, passwords, CVV or screen sharing.", "एक बार के कोड, पासवर्ड, CVV या स्क्रीन शेयर की माँग।", "ఒకసారి వాడే కోడ్, పాస్‌వర్డ్, CVV లేదా స్క్రీన్ షేరింగ్ అభ్యర్థన."),
    example: tr("Share your OTP so we can cancel the request.", "अनुरोध रद्द करने के लिए अपना OTP बताएं।", "అభ్యర్థనను రద్దు చేయడానికి మీ OTP చెప్పండి."),
    avoid: tr("Keep one-time codes, passwords and card secrets private.", "एक बार के कोड, पासवर्ड और कार्ड की गोपनीय जानकारी को सुरक्षित रखें।", "ఒకసారి వాడే కోడ్, పాస్‌వర్డ్, కార్డు రహస్యాలను మీ వద్దే ఉంచండి."),
    action: tr("If you shared credentials, reset them through the official app and contact the provider.", "जानकारी साझा कर चुके हैं तो आधिकारिक ऐप से उसे बदलें और सेवा प्रदाता से संपर्क करें।", "వివరాలు ఇచ్చి ఉంటే అధికారిక యాప్‌లో మార్చి సేవా సంస్థను సంప్రదించండి."),
  },
  job: {
    title: tr("Fake job offers", "नकली नौकरी प्रस्ताव", "నకిలీ ఉద్యోగ ఆఫర్లు"),
    description: tr("A recruiter promises easy income and asks for money before you can start.", "भर्तीकर्ता आसान कमाई का वादा कर काम शुरू होने से पहले पैसे माँगता है।", "సులభంగా ఆదాయం వస్తుందని చెప్పి పని మొదలుపెట్టే ముందే డబ్బు అడుగుతారు."),
    signs: tr("An upfront fee, unusually high pay or no verifiable interview.", "अग्रिम शुल्क, असामान्य वेतन या सत्यापित इंटरव्यू का अभाव।", "ముందస్తు ఫీజు, అసాధారణ జీతం లేదా ధ్రువీకరించగల ఇంటర్వ్యూ లేకపోవడం."),
    example: tr("Pay the registration fee to secure your work-from-home job.", "घर से काम की नौकरी पक्की करने के लिए रजिस्ट्रेशन फीस दें।", "ఇంటి నుంచి చేసే ఉద్యోగాన్ని ఖాయం చేసుకోవడానికి రిజిస్ట్రేషన్ ఫీజు చెల్లించండి."),
    avoid: tr("Avoid paying to secure an interview, offer letter or starter kit.", "इंटरव्यू, ऑफ़र लेटर या किट पक्की करने के लिए भुगतान न करें।", "ఇంటర్వ్యూ, ఆఫర్ లెటర్ లేదా స్టార్టర్ కిట్ కోసం చెల్లించకండి."),
    action: tr("Check the job on the employer’s careers page and use its listed contact.", "कंपनी के करियर पेज पर नौकरी और वहाँ दिए संपर्क की जाँच करें।", "సంస్థ ఉద్యోగాల పేజీలో ఖాళీని చూసి అక్కడ ఇచ్చిన సంప్రదింపును వాడండి."),
  },
  investment: {
    title: tr("Investment fraud", "निवेश धोखाधड़ी", "పెట్టుబడి మోసాలు"),
    description: tr("An offer promises extraordinary returns and pressures you to transfer funds.", "प्रस्ताव भारी मुनाफ़े का वादा करता है और पैसे भेजने का दबाव डालता है।", "అసాధారణ లాభాల ఆశ చూపి డబ్బు పంపాలని ఒత్తిడి చేస్తారు."),
    signs: tr("Guaranteed profit, daily returns, private groups or pressure to add funds.", "गारंटीड मुनाफ़ा, रोज़ाना रिटर्न, निजी ग्रुप या और पैसा डालने का दबाव।", "హామీ లాభాలు, రోజువారీ రాబడి, ప్రైవేట్ గ్రూపులు లేదా ఎక్కువ డబ్బు వేయాలని ఒత్తిడి."),
    example: tr("Double your money in one week with guaranteed returns.", "गारंटीड रिटर्न से एक हफ़्ते में पैसा दोगुना करें।", "హామీ లాభాలతో వారంలో మీ డబ్బు రెట్టింపు చేసుకోండి."),
    avoid: tr("Avoid transfers to personal accounts promoted as official investment deposits.", "निवेश जमा बताकर बताए गए निजी खातों में पैसे न भेजें।", "అధికారిక పెట్టుబడి డిపాజిట్‌గా చూపించే వ్యక్తిగత ఖాతాలకు డబ్బు పంపకండి."),
    action: tr("Verify the firm’s registration and look up the investment independently.", "कंपनी का पंजीकरण और निवेश स्वतंत्र रूप से जाँचें।", "సంస్థ నమోదును, పెట్టుబడిని స్వతంత్రంగా పరిశీలించండి."),
  },
  kyc: {
    title: tr("Bank KYC phishing", "बैंक KYC फ़िशिंग", "బ్యాంకు KYC ఫిషింగ్"),
    description: tr("A message threatens account suspension to move you to an unofficial verification flow.", "खाता बंद करने की धमकी देकर अनधिकृत सत्यापन में ले जाया जाता है।", "ఖాతా నిలిపివేస్తామంటూ అనధికారిక ధ్రువీకరణకు మళ్లిస్తారు."),
    signs: tr("An unexpected KYC deadline, an unfamiliar link or a request to share an OTP.", "अचानक KYC समय सीमा, अनजान लिंक या OTP साझा करने की माँग।", "అనుకోని KYC గడువు, తెలియని లింక్ లేదా OTP ఇవ్వమని అడగడం."),
    example: tr("Verify your KYC immediately and share the OTP.", "तुरंत KYC जाँचें और OTP बताएं।", "వెంటనే KYC పూర్తి చేసి OTP చెప్పండి."),
    avoid: tr("Do not use an unexpected message link to sign into your bank.", "बैंक लॉगिन के लिए अनपेक्षित संदेश का लिंक इस्तेमाल न करें।", "అనుకోని సందేశ లింక్‌తో బ్యాంకులోకి లాగిన్ కావద్దు."),
    action: tr("Check your account in the official app or call the number on your bank card.", "बैंक के आधिकारिक ऐप में देखें या कार्ड पर दिए नंबर पर कॉल करें।", "అధికారిక యాప్‌లో ఖాతాను చూడండి లేదా బ్యాంకు కార్డుపై ఉన్న నంబర్‌కు కాల్ చేయండి."),
  },
  delivery: {
    title: tr("Parcel & delivery scams", "पार्सल और डिलीवरी घोटाले", "పార్సిల్, డెలివరీ మోసాలు"),
    description: tr("An unexpected delivery problem becomes an excuse for a fee or address update.", "अचानक डिलीवरी की समस्या बताकर शुल्क या पता माँगा जाता है।", "అనుకోని డెలివరీ సమస్యను సాకుగా చూపి ఫీజు లేదా చిరునామా అడుగుతారు."),
    signs: tr("A parcel you don’t recognize, a small redelivery fee or missing order details.", "अनजान पार्सल, छोटा दोबारा डिलीवरी शुल्क या ऑर्डर की जानकारी न होना।", "తెలియని పార్సిల్, చిన్న రీడెలివరీ ఫీజు లేదా ఆర్డర్ వివరాలు లేకపోవడం."),
    example: tr("Your parcel is on hold. Pay a redelivery fee today.", "आपका पार्सल रोका गया है। आज फिर से डिलीवरी का शुल्क दें।", "మీ పార్సిల్ నిలిపివేశారు. ఈరోజే మళ్లీ పంపే రుసుము చెల్లించండి."),
    avoid: tr("Avoid entering card details through a delivery message.", "डिलीवरी संदेश से कार्ड की जानकारी न दें।", "డెలివరీ సందేశం నుంచి కార్డు వివరాలు నమోదు చేయకండి."),
    action: tr("Open your original order and follow its tracking information.", "अपने मूल ऑर्डर में ट्रैकिंग की जानकारी देखें।", "మీ అసలు ఆర్డర్‌ను తెరిచి దాని ట్రాకింగ్ వివరాలను చూడండి."),
  },
  impersonation: {
    title: tr("Government or police impersonation", "सरकारी या पुलिस प्रतिरूपण", "ప్రభుత్వ లేదా పోలీసు పేరుతో మోసం"),
    description: tr("Someone borrows an official title to make a demand sound legitimate.", "कोई माँग को असली दिखाने के लिए आधिकारिक पद का नाम लेता है।", "అభ్యర్థన నిజంగా కనిపించేందుకు అధికారిక హోదా పేరును వాడతారు."),
    signs: tr("Threats of arrest, secrecy demands or a request to transfer money to a private account.", "गिरफ्तारी की धमकी, राज़ रखने की माँग या निजी खाते में भुगतान का अनुरोध।", "అరెస్టు బెదిరింపు, రహస్యంగా ఉంచమనే ఒత్తిడి లేదా వ్యక్తిగత ఖాతాకు డబ్బు అడగడం."),
    example: tr("This is a police officer. Transfer the amount to close the case.", "मैं पुलिस अधिकारी हूँ। मामला बंद करने के लिए रकम भेजें।", "నేను పోలీసు అధికారిని. కేసు ముగించడానికి డబ్బు బదిలీ చేయండి."),
    avoid: tr("Avoid paying or sharing identity documents with an unverified contact.", "अपुष्ट संपर्क को पैसे या पहचान दस्तावेज़ न दें।", "ధ్రువీకరించని సంప్రదింపుకు డబ్బు లేదా గుర్తింపు పత్రాలు ఇవ్వకండి."),
    action: tr("End the interaction and look up the agency’s public contact separately.", "बातचीत समाप्त करें और एजेंसी का सार्वजनिक संपर्क अलग से ढूँढें।", "సంభాషణ ముగించి సంస్థ అధికారిక సంప్రదింపును విడిగా వెతకండి."),
  },
  urgency: {
    title: tr("Urgency & threats", "जल्दबाज़ी और धमकियाँ", "తొందర, బెదిరింపులు"),
    description: tr("A short deadline or alarming threat makes an ordinary check feel costly.", "कम समय या डरावनी धमकी सामान्य जाँच करने से रोकती है।", "చిన్న గడువు లేదా భయపెట్టే బెదిరింపు సాధారణ తనిఖీకి సమయం ఇవ్వదు."),
    signs: tr("Countdowns, ultimatums, account closure or demands to keep the interaction secret.", "काउंटडाउन, अंतिम चेतावनी, खाता बंद करने या बात छिपाने की माँग।", "కౌంట్‌డౌన్, చివరి హెచ్చరిక, ఖాతా మూసివేత, రహస్యంగా ఉంచమనే డిమాండ్."),
    example: tr("Last chance. Respond now or your account will be blocked.", "आखिरी मौका। अभी जवाब दें या खाता ब्लॉक हो जाएगा।", "చివరి అవకాశం. ఇప్పుడే స్పందించండి లేదా ఖాతా బ్లాక్ అవుతుంది."),
    avoid: tr("Avoid making a payment or giving details because of a deadline.", "समय सीमा के दबाव में पैसे या जानकारी न दें।", "గడువు ఒత్తిడితో చెల్లింపు చేయకండి, వివరాలు ఇవ్వకండి."),
    action: tr("Pause and contact the service through a number you already trust.", "रुकें और पहले से भरोसेमंद नंबर पर सेवा से संपर्क करें।", "ఆగి, మీకు ముందే తెలిసిన నంబర్ ద్వారా సేవను సంప్రదించండి."),
  },
  link: {
    title: tr("Suspicious links & apps", "संदिग्ध लिंक और ऐप", "సందేహాస్పద లింక్‌లు, యాప్‌లు"),
    description: tr("An unfamiliar link or download can direct you to an unsafe site or app.", "अनजान लिंक या डाउनलोड आपको असुरक्षित साइट या ऐप पर ले जा सकता है।", "తెలియని లింక్ లేదా డౌన్‌లోడ్ అసురక్షిత సైట్‌కు లేదా యాప్‌కు తీసుకెళ్లవచ్చు."),
    signs: tr("Lookalike domains, shortened links, unsolicited APK files or remote-access requests.", "मिलते-जुलते डोमेन, छोटे लिंक, अचानक APK फ़ाइल या रिमोट एक्सेस की माँग।", "పోలిన డొమైన్‌లు, కుదించిన లింక్‌లు, అడగని APK ఫైళ్లు లేదా రిమోట్ యాక్సెస్."),
    example: tr("Download this APK to restore your access.", "एक्सेस वापस पाने के लिए यह APK डाउनलोड करें।", "యాక్సెస్ తిరిగి పొందడానికి ఈ APK డౌన్‌లోడ్ చేయండి."),
    avoid: tr("Avoid opening unexpected links, sideloading apps or sharing your screen.", "अनपेक्षित लिंक, बाहर से ऐप इंस्टॉल और स्क्रीन शेयर से बचें।", "అనుకోని లింక్‌లు, బయట నుంచి యాప్ ఇన్‌స్టాల్, స్క్రీన్ షేరింగ్‌ను దూరంగా ఉంచండి."),
    action: tr("Use the official app store or a website you navigate to yourself.", "आधिकारिक ऐप स्टोर या खुद खोली वेबसाइट इस्तेमाल करें।", "అధికారిక యాప్ స్టోర్ లేదా మీరు స్వయంగా తెరిచిన సైట్‌ను వాడండి."),
  },
};

const generalWarning = tr(
  "Please pause before paying, opening links or sharing codes. If you receive an unexpected request, check it through a contact or app you already trust.",
  "भुगतान, लिंक खोलने या कोड बताने से पहले रुकें। अचानक अनुरोध मिले तो पहले से भरोसेमंद संपर्क या ऐप से जाँचें।",
  "చెల్లించే ముందు, లింక్ తెరిచే ముందు లేదా కోడ్ ఇచ్చే ముందు ఆగండి. అనుకోని అభ్యర్థన వస్తే మీకు ముందే తెలిసిన సంప్రదింపు లేదా యాప్‌లో తనిఖీ చేయండి.",
);
const intro = tr("Family safety reminder", "परिवार के लिए सुरक्षा संदेश", "కుటుంబ భద్రతా సూచన");
const familyOpening: Partial<Record<Category, Localized>> = {
  upi: tr("You can receive UPI payments without entering a PIN.", "UPI से पैसे पाने के लिए पिन नहीं डालना पड़ता।", "UPI చెల్లింపులు అందుకోవడానికి పిన్ ఇవ్వాల్సిన అవసరం లేదు."),
  job: tr("Be careful if someone asks you to pay before joining a new job.", "नौकरी शुरू होने से पहले कोई पैसे माँगे तो सावधान रहें।", "కొత్త ఉద్యోగంలో చేరే ముందు ఎవరైనా డబ్బు అడిగితే జాగ్రత్త."),
  kyc: tr("An unexpected KYC message could be trying to get into your bank account.", "अचानक आया KYC संदेश आपके बैंक खाते तक पहुँचने की कोशिश हो सकता है।", "అనుకోని KYC సందేశం మీ బ్యాంకు ఖాతాలోకి ప్రవేశించే ప్రయత్నం కావచ్చు."),
};

// Only trusted category identifiers and authored text enter shareable output.
export function familyWarning(category: Category | "none", language: Language) {
  if (category === "none") return intro[language] + "\n\n" + generalWarning[language];
  const guide = GUIDES[category];
  const opening = familyOpening[category]?.[language] ?? guide.description[language];
  return intro[language] + " · " + guide.title[language] + "\n\n" + opening + " " + guide.avoid[language] + " " + guide.action[language];
}
