import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import { SavedProvider } from "@/hooks/use-saved";
import { NotificationsProvider } from "@/hooks/use-notifications";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.luxeit.co.zm"),
  title: {
    default: "Luxeit — Premium imports, delivered",
    template: "%s · Luxeit",
  },
  description:
    "Premium products from China, delivered across Zambia. Shop electronics, fashion, home & more on Luxeit.",
  applicationName: "Luxeit",
  openGraph: {
    type: "website",
    siteName: "Luxeit",
    title: "Luxeit — Premium imports, delivered",
    description:
      "Shop China's best — electronics, fashion, home & more — delivered across Zambia.",
    url: "https://www.luxeit.co.zm",
    locale: "en_ZM",
  },
  twitter: {
    card: "summary_large_image",
    title: "Luxeit — Premium imports, delivered",
    description:
      "Shop China's best — electronics, fashion, home & more — delivered across Zambia.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <SavedProvider>
                <NotificationsProvider>
                  {/* Phones keep the mobile chrome; tablets & desktops get the
                      sidebar + top-bar shell around the same pages. */}
                  <AppShell>{children}</AppShell>
                </NotificationsProvider>
              </SavedProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
