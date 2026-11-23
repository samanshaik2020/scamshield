import { ScamShield } from "@/components/scamshield";

export const dynamic = "force-dynamic";

export default function Page() {
  return <ScamShield aiAvailable={Boolean(process.env.OPENAI_API_KEY?.trim())}
    localEnabled={process.env.NODE_ENV === "development" && process.env.SCAMSHIELD_ENABLE_OLLAMA === "true"} />;
}
