import { BriefcaseBusiness, Clock3, Fingerprint, Gift, Landmark, Link2, PackageCheck, ScanLine, Siren, TrendingUp } from "lucide-react";
import type { Category } from "@/lib/types";

export const CATEGORY_ICONS: Record<Category, typeof ScanLine> = {
  upi: ScanLine, reward: Gift, credential: Fingerprint, job: BriefcaseBusiness, investment: TrendingUp,
  kyc: Landmark, delivery: PackageCheck, impersonation: Siren, urgency: Clock3, link: Link2,
};
