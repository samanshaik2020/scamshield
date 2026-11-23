// Preserve UTF-16 offsets so evidence can still be located in the original message.
const mask = (value: string) => "•".repeat(value.length);

export function prepareExternalText(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w.-]+/gu, mask)
    .replace(/(?<!\d)(?:\+?\d[ -]?){9,18}\d(?!\d)/gu, mask)
    .replace(/((?:\bOTP|\bPIN|\bCVV|ओटीपी|पिन|ఓటీపీ|పిన్)\s*(?:(?:is|है)\s*|[:=–-]\s*)?)(\p{Nd}{3,8})(?!\p{Nd})/giu,
      (_, label: string, secret: string) => label + mask(secret))
    .replace(/\p{Nd}{3,8}(?=\s+(?:is\s+(?:your|the)\s+(?:verification code|OTP|PIN|CVV)|आपका\s+(?:ओटीपी|पिन)|మీ\s+(?:ఓటీపీ|పిన్)))/giu, mask)
    .replace(/((?:password|passcode|पासवर्ड|పాస్‌వర్డ్)\s*(?:[:=]\s*|\bis\s+))(\S+)/giu,
      (_, label: string, secret: string) => label + mask(secret));
}
