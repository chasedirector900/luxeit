import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = { title: "Terms of Service · Luxeit" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="June 2026">
      <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] font-medium text-amber-700 dark:text-amber-400">
        Template terms — review with a qualified legal advisor before launch.
      </p>

      <LegalSection heading="1. About Luxeit">
        <p>
          Luxeit is a marketplace that sources products from China and delivers them across Zambia, with shipping
          included in the price. By creating an account or placing an order you agree to these terms.
        </p>
      </LegalSection>

      <LegalSection heading="2. Your account">
        <p>
          You sign in with a one-time code sent to your email or phone — keep that contact secure. You are responsible
          for activity on your account. You can review signed-in devices and sign out under Account &gt; Settings &gt; Security.
        </p>
      </LegalSection>

      <LegalSection heading="3. Orders, pricing & shipping">
        <p>
          Prices are shown in Zambian Kwacha and include shipping. Items may ship from our China or Lusaka hubs;
          estimated delivery times are shown at checkout and are not guarantees. You are charged once your order is confirmed.
        </p>
      </LegalSection>

      <LegalSection heading="4. Returns & refunds">
        <p>
          Eligible items may be returned per the return window shown on the product. Imported items may carry a
          seller warranty. Contact live support for help with an order.
        </p>
      </LegalSection>

      <LegalSection heading="5. Acceptable use">
        <p>
          Don&apos;t misuse the service, attempt to access other accounts, or use Luxeit for unlawful purposes. We may
          suspend accounts that breach these terms.
        </p>
      </LegalSection>

      <LegalSection heading="6. Changes">
        <p>We may update these terms; continued use after an update means you accept the revised terms.</p>
      </LegalSection>
    </LegalPage>
  );
}
