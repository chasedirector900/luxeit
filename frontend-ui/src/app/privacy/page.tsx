import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = { title: "Privacy Policy · Luxeit" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="June 2026">
      <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] font-medium text-amber-700 dark:text-amber-400">
        Template policy — review with a qualified legal advisor before launch.
      </p>

      <LegalSection heading="What we collect">
        <p>
          Your contact (email or phone) used to sign in, your name and delivery address when you add them, your orders
          and messages, and basic device info (browser, approximate IP) shown on the Security screen.
        </p>
      </LegalSection>

      <LegalSection heading="How we use it">
        <p>
          To sign you in, process and deliver orders, send order and account notifications, provide support, and keep
          your account secure (e.g. new-device alerts). We don&apos;t sell your personal data.
        </p>
      </LegalSection>

      <LegalSection heading="Payments">
        <p>
          Card details are handled by our payment provider and tokenised — Luxeit never stores your full card number
          or CVV.
        </p>
      </LegalSection>

      <LegalSection heading="Your choices">
        <p>
          You control promotional messages under Settings &gt; Notifications, can export your data at any time, and can
          permanently delete your account under Settings &gt; Danger zone.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>Questions about your data? Reach us through live support in the app.</p>
      </LegalSection>
    </LegalPage>
  );
}
