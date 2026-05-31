import { MessageCircle } from "lucide-react";
import { whatsappUrl, WHATSAPP_DISPLAY } from "@/lib/site";
import { useCompanySettings, buildWhatsappUrl } from "@/lib/site-content";
import { track } from "@/lib/analytics";

export function WhatsAppDock() {
  const { data: company } = useCompanySettings();
  const msg =
    "Olá! Vim pelo site da NL Foto e Vídeo e gostaria de mais informações.";
  const href = company?.whatsapp
    ? buildWhatsappUrl(company.whatsapp, msg)
    : whatsappUrl(msg);
  const display = company?.phone || company?.whatsapp || WHATSAPP_DISPLAY;
  const onWhatsapp = () => track("whatsapp_click", { metadata: { origin: "dock" } });
  return (
    <>
      {/* Floating button (desktop & tablet) */}
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={onWhatsapp}
        aria-label="Falar no WhatsApp"
        className="fixed bottom-6 right-6 z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 sm:flex"
      >
        <MessageCircle className="h-7 w-7" />
      </a>

      {/* Fixed bottom bar (mobile) */}
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={onWhatsapp}
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 bg-[#25D366] py-3.5 text-sm font-semibold text-white shadow-[0_-4px_16px_rgba(0,0,0,0.12)] sm:hidden"
      >
        <MessageCircle className="h-5 w-5" />
        Falar no WhatsApp · {display}
      </a>
    </>
  );
}
