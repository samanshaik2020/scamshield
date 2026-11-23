export const messageFixture = "Our desk says share your OTP today. Contact test@example.org.";

export const analysisFixture = {
  riskLevel: "highly_suspicious",
  riskScore: 85,
  summary: "This message requests a private code.",
  suspectedScamTypes: ["otp_phishing"],
  redFlags: [{ quotedEvidence: "share your OTP", explanation: "A one-time code should stay private.", severity: "high", verification: "Contact the organization independently." }],
  psychologicalTactics: [{ quotedEvidence: "today", tactic: "urgency", explanation: "A deadline can rush the reader." }],
  financialWarnings: [{ quotedEvidence: "share your OTP", explanation: "The code may authorize an account action." }],
  linkWarnings: [],
  potentialConsequences: ["Unauthorized account activity"],
  recommendedActions: ["Verify through the official app."],
  safeResponse: "",
  claimsNeedingVerification: ["Who sent this request?"],
  uncertainty: "The identity cannot be confirmed from this text.",
  disclaimer: "Verify through an independently obtained official number.",
};
