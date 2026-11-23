# ScamShield AI competition entry

## Project description

ScamShield AI helps Indian families decide what to do when a suspicious message arrives. Paste a WhatsApp message, SMS, email or job offer to see the exact phrases behind each warning and a practical next step. The core analysis runs in the browser. Users can read explanations in English, Hindi or Telugu and share a family warning without forwarding the original text.

## 60-second demonstration

Open the homepage in English. The walkthrough uses the built-in rule engine and an ordinary browser clipboard. Leave optional AI off for this demo.

| Time | Action | Spoken script |
| --- | --- | --- |
| 0–8 s | Show the homepage. | “Imagine your father forwards a message promising five thousand rupees in cashback. He asks, ‘Should I scan this?’ Let’s check it together.” |
| 8–22 s | Click **Try Live Demo**. Expand **UPI PIN request**. | “Here are the exact words that matter. It asks him to enter his UPI PIN to receive money. That PIN authorizes a payment. Open the finding and you can see exactly how many points it contributed.” |
| 22–34 s | Click **Analyzer**, then **Normal Message**. | “Now I’ll switch to a routine meeting update. The same rules find zero warning signs. The app still asks us to verify the sender.” |
| 34–45 s | Choose **Analyzer**, then **Fake Job Offer**. | “This time the warning changes. The message promises weekly pay and asks for a registration fee. We can check the opening directly with the employer.” |
| 45–60 s | Open **Family Toolkit** from the result, choose **తెలుగు** as the warning language, and click **Copy warning**. | “I can give my family that advice in Telugu without forwarding anyone’s number or private message. All three checks happened in this browser, and I can take this warning with me.” |

## Fourth scenario for judge questions

Choose **Bank KYC Scam**. Expand the credential request and the deadline. The words “using this link” appear in the sample. The app identifies that instruction and makes no claim about a destination it has never seen. Open the official reporting resources in the results to show where a user can get help.

## Reproduce the demo scores

| Sample | Heuristic score | Evidence to inspect |
| --- | ---: | --- |
| UPI Scam | 100 / 100 | PIN request, unexpected cashback, urgency and QR instruction |
| Fake Job Offer | 78 / 100 | Upfront fee, unusually high pay and a same-day deadline |
| Bank KYC Scam | 100 / 100 | OTP request, account threat, KYC request, institutional reference and link instruction |
| Normal Message | 0 / 100 | No configured rule matched the meeting update |

These scores are outputs for the supplied wording. Edit any sample and run it again to show how the evidence changes. The score is the sum of matching rule weights, capped at 100.
