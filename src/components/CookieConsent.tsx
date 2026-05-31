import { useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setConsent } from "@/lib/analytics";

export function CookieConsent({
  text,
  privacyUrl,
}: {
  text: string | null;
  privacyUrl: string | null;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [custom, setCustom] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  if (dismissed) return null;

  function decide(a: boolean, m: boolean) {
    setConsent({ analytics: a, marketing: m });
    setDismissed(true);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-4 shadow-xl sm:p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Cookie className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm text-foreground">
              {text ??
                "Usamos cookies para melhorar sua experiência e analisar o tráfego."}
              {privacyUrl && (
                <>
                  {" "}
                  <a
                    href={privacyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary underline"
                  >
                    Política de privacidade
                  </a>
                </>
              )}
            </p>

            {custom && (
              <div className="mt-3 space-y-2 rounded-lg border border-border bg-surface p-3 text-sm">
                <label className="flex items-center justify-between gap-3 opacity-60">
                  <span>Necessários (sempre ativos)</span>
                  <input type="checkbox" checked readOnly />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>Analytics</span>
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>Marketing</span>
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                  />
                </label>
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => decide(true, true)}>
                Aceitar todos
              </Button>
              <Button size="sm" variant="outline" onClick={() => decide(false, false)}>
                Recusar
              </Button>
              {custom ? (
                <Button size="sm" variant="secondary" onClick={() => decide(analytics, marketing)}>
                  Salvar preferências
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setCustom(true)}>
                  Personalizar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
