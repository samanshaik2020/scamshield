import type { Category } from "./types";

export const SAMPLES = [
  {
    id: "upi", category: "upi",
    message: "Congratulations! You have won ₹5,000 cashback. Scan the QR code and enter your UPI PIN to receive your reward immediately.",
  },
  {
    id: "job", category: "job",
    message: "Congratulations! You are selected for a work-from-home job earning ₹30,000 every week. Pay ₹999 registration fee today to confirm your joining.",
  },
  {
    id: "kyc", category: "kyc",
    message: "Dear customer, your bank account will be blocked in 30 minutes. Verify your KYC immediately using this link and share the OTP.",
  },
  {
    id: "normal", category: "none",
    message: "Hi, our project meeting has been moved to 3 PM tomorrow. Please check your calendar when you're free.",
  },
] as const satisfies ReadonlyArray<{ id: string; category: Category | "none"; message: string }>;
