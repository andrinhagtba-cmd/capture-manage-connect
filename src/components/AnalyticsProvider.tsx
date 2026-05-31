import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  setMarketingConfig,
  marketingConfigAllowed,
  getConsent,
  CONSENT_EVENT,
  type PublicMarketingConfig,
} from "@/lib/analytics";
import { CookieConsent } from "@/components/CookieConsent";

// Re-export a tiny helper that mirrors the private one in analytics.ts
declare module "@/lib/analytics" {}

const loaded = new Set<string>();

function injectScript(id: string, build: () => void) {
  if (loaded.has(id)) return;
  loaded.add(id);
  build();
}

function loadGTM(containerId: string) {
  injectScript(`gtm-${containerId}`, () => {
    const w = window as unknown as { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
    document.head.appendChild(s);
  });
}

function loadMetaPixel(pixelId: string) {
  injectScript(`meta-${pixelId}`, () => {
    /* eslint-disable */
    (function (f: any, b, e, v, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
    const w = window as unknown as { fbq?: (...a: unknown[]) => void };
    w.fbq?.("init", pixelId);
    w.fbq?.("track", "PageView");
  });
}

function ensureGtagBase() {
  injectScript("gtag-base", () => {
    const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void };
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments as unknown);
    };
    w.gtag("js", new Date());
  });
}

function loadGA4(measurementId: string) {
  ensureGtagBase();
  injectScript(`ga4-${measurementId}`, () => {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(s);
    const w = window as unknown as { gtag?: (...a: unknown[]) => void };
    w.gtag?.("config", measurementId);
  });
}

function loadGoogleAds(conversionId: string) {
  ensureGtagBase();
  injectScript(`ads-${conversionId}`, () => {
    const w = window as unknown as { gtag?: (...a: unknown[]) => void };
    // Reuse gtag.js (GA4 may already have loaded it; otherwise load it)
    if (!loaded.has(`gtagjs-${conversionId}`)) {
      loaded.add(`gtagjs-${conversionId}`);
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${conversionId}`;
      document.head.appendChild(s);
    }
    w.gtag?.("config", conversionId);
  });
}

function applyTrackers(cfg: PublicMarketingConfig) {
  // GTM loads regardless of marketing consent? No — respect consent for all.
  const allowMarketing = marketingConfigAllowed(cfg);
  if (!allowMarketing) return;
  if (cfg.gtm_enabled && cfg.gtm_container_id) loadGTM(cfg.gtm_container_id);
  if (cfg.meta_pixel_enabled && cfg.meta_pixel_id) loadMetaPixel(cfg.meta_pixel_id);
  if (cfg.ga4_enabled && cfg.ga4_measurement_id) loadGA4(cfg.ga4_measurement_id);
  if (cfg.google_ads_enabled && cfg.google_ads_conversion_id)
    loadGoogleAds(cfg.google_ads_conversion_id);
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { data: cfg } = useQuery({
    queryKey: ["public-marketing-config"],
    queryFn: async (): Promise<PublicMarketingConfig | null> => {
      const { data } = await supabase
        .from("marketing_integrations")
        .select(
          "meta_pixel_enabled, meta_pixel_id, meta_events_enabled, ga4_enabled, ga4_measurement_id, ga4_custom_events_enabled, google_ads_enabled, google_ads_conversion_id, google_ads_quote_label, google_ads_whatsapp_label, google_ads_lead_label, google_ads_remarketing_enabled, gtm_enabled, gtm_container_id, cookie_banner_enabled, cookie_banner_text, privacy_policy_url, require_analytics_consent, require_marketing_consent",
        )
        .limit(1)
        .maybeSingle();
      return (data as PublicMarketingConfig) ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    setMarketingConfig(cfg ?? null);
    if (cfg) applyTrackers(cfg);
  }, [cfg]);

  // React to consent changes (user accepts marketing later)
  useEffect(() => {
    function onChange() {
      if (cfg) applyTrackers(cfg);
    }
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, [cfg]);

  return (
    <>
      {children}
      {cfg?.cookie_banner_enabled && !getConsent().decided && (
        <CookieConsent
          text={cfg.cookie_banner_text}
          privacyUrl={cfg.privacy_policy_url}
        />
      )}
    </>
  );
}
