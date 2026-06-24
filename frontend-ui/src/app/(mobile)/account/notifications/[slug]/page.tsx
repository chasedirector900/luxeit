import { NotificationThreadView } from "@/components/notifications/notification-detail-view";

type NotificationThreadPageProps = {
  params: Promise<{ slug: string }>;
};

// Per-user, live data — resolved client-side from the inbox provider (no static params).
export default async function NotificationThreadPage({ params }: NotificationThreadPageProps) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-6 pt-5 text-slate-900 dark:bg-black dark:text-zinc-100">
      <NotificationThreadView slug={slug} />
    </main>
  );
}
