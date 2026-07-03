import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = { title: "Privacy Policy · Luxeit" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="July 2026">
      <LegalSection heading="1. Overview">
        <p>
          This policy explains what personal data Luxeit (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects when you use
          our app and website, how we use and protect it, and the choices you have. We handle personal data in line
          with the Data Protection Act, 2021 of Zambia. By using Luxeit you agree to this policy.
        </p>
      </LegalSection>

      <LegalSection heading="2. What we collect">
        <p>
          <span className="font-semibold text-slate-800 dark:text-zinc-200">Account details</span> — the email
          address or phone number you sign in with, and your name and delivery address when you add them.
        </p>
        <p>
          <span className="font-semibold text-slate-800 dark:text-zinc-200">Order &amp; activity data</span> — the
          products you order, order status and history, saved items, reviews you write, and messages you exchange
          with our support team.
        </p>
        <p>
          <span className="font-semibold text-slate-800 dark:text-zinc-200">Payment records</span> — the payment
          method type and a masked reference (for example the last digits of a card). Full card numbers and CVVs are
          handled and stored by our licensed payment providers, never by Luxeit.
        </p>
        <p>
          <span className="font-semibold text-slate-800 dark:text-zinc-200">Device &amp; security data</span> —
          browser/device type and approximate IP address for each sign-in, shown to you on the Security screen and
          used to detect suspicious activity.
        </p>
      </LegalSection>

      <LegalSection heading="3. How we use your data">
        <p>We use personal data only where we have a lawful basis to do so:</p>
        <p>
          To operate your account and sign you in; to process, deliver and update you about orders (performance of
          our contract with you); to send security alerts such as new-device sign-ins and to prevent fraud
          (legitimate interest and legal obligation); to respond to support requests; and — only if you keep the
          preference switched on — to send promotional messages (consent, withdrawable any time under Settings &gt;
          Notification preferences).
        </p>
        <p className="font-semibold text-slate-800 dark:text-zinc-200">We do not sell your personal data.</p>
      </LegalSection>

      <LegalSection heading="4. Who we share it with">
        <p>
          We share data only where needed to run the service: delivery and logistics partners (name, contact and
          address, to deliver your order); payment providers (to process payments); and technology providers who
          host our systems. These providers may only use your data to provide their service to us.
        </p>
        <p>
          We may also disclose data where the law requires it — for example to law-enforcement or regulatory
          authorities acting under legal authority — or to protect Luxeit, our customers or the public from fraud
          or harm.
        </p>
      </LegalSection>

      <LegalSection heading="5. Where your data is stored">
        <p>
          Our systems run on reputable cloud infrastructure, which may process data outside Zambia. Where data
          leaves Zambia we take steps required under the Data Protection Act, 2021 to ensure it remains protected to
          an equivalent standard.
        </p>
      </LegalSection>

      <LegalSection heading="6. How long we keep it">
        <p>
          We keep your data while your account is active. Order and payment records may be kept for longer periods
          where tax, accounting or other laws require it. When you delete your account, your profile, saved items
          and messages are permanently removed; records we must keep by law are retained only as long as required.
        </p>
      </LegalSection>

      <LegalSection heading="7. Security">
        <p>
          We protect your data with industry-standard measures: encrypted connections (HTTPS), passwordless one-time
          sign-in codes with short expiry, session controls that let you sign out of any device remotely, and access
          controls limiting who at Luxeit can view customer data. No system is 100% secure, so also keep the email or
          phone you sign in with protected.
        </p>
      </LegalSection>

      <LegalSection heading="8. Your rights">
        <p>
          Under the Data Protection Act, 2021 you have the right to access the personal data we hold about you, to
          have inaccurate data corrected, to object to certain processing, and to request deletion. You can exercise
          most of these directly in the app: edit your details under Account, control promotional messages under
          Settings &gt; Notification preferences, and permanently delete your account under Settings &gt; Danger
          zone. To request a copy of your data, contact us through in-app support and we will provide it within a
          reasonable time.
        </p>
      </LegalSection>

      <LegalSection heading="9. Children">
        <p>
          Luxeit is not directed at children. Users must be 18 or older, or use the service under a parent or
          guardian&apos;s supervision. We do not knowingly collect personal data from children.
        </p>
      </LegalSection>

      <LegalSection heading="10. Changes to this policy">
        <p>
          We may update this policy as the service evolves. The &ldquo;last updated&rdquo; date above shows the
          current version, and material changes will be notified in the app.
        </p>
      </LegalSection>

      <LegalSection heading="11. Contact">
        <p>
          Questions or requests about your data? Reach us through live support in the app (Account &gt; Help &amp;
          support).
        </p>
      </LegalSection>
    </LegalPage>
  );
}
