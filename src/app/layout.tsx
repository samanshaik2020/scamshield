import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScamShield AI | Think Before You Trust",
  description: "Analyze suspicious messages, understand the warning signs, and protect yourself from digital fraud. Built for India, private by default.",
  applicationName: "ScamShield AI",
  formatDetection: { telephone: false, email: false, address: false, date: false, url: false },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
