import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppDock } from "@/components/WhatsAppDock";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      <SiteFooter />
      <WhatsAppDock />
    </div>
  );
}
