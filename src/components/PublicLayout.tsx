import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { WhatsAppDock } from "@/components/WhatsAppDock";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { track } from "@/lib/analytics";

function PageViewTracker() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    track("page_view");
  }, [path]);
  return null;
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <AnalyticsProvider>
      <PageViewTracker />
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 pb-16 sm:pb-0">{children}</main>
        <CinematicFooter />
        <WhatsAppDock />
      </div>
    </AnalyticsProvider>
  );
}
