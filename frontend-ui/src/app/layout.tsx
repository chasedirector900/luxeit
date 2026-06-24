import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DesktopGate } from "@/components/layout/desktop-gate";
import { Header } from "@/components/layout/header";
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
  title: "Luxeit",
  description: "A clean dark interface system for Luxeit.",
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
      <body className="min-h-full bg-background text-foreground md:overflow-hidden">
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <SavedProvider>
                <NotificationsProvider>
                  <Header />
                  {children}
                </NotificationsProvider>
              </SavedProvider>
            </CartProvider>
          </AuthProvider>
          {/* Tablets & desktops see a "use mobile" gate instead of the app. */}
          <DesktopGate />
        </ThemeProvider>
      </body>
    </html>
  );
}
