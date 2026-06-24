import { BottomNav } from "@/components/layout/bottom-nav";

export default function MobileShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-0">
      {children}
      <BottomNav />
    </div>
  );
}
