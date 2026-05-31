// Client-side analytics + marketing tracking for the public site.
// - Records first-party events into the `analytics_events` table (gated by
//   analytics consent).
// - Fires Meta Pixel / GA4 / Google Ads events (gated by marketing consent).
// Never sends raw PII (name/email/phone) to third-party pixels.

import { supabase } from "@/integrations/supabase/client";

export type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decided: boolean;
};

export type PublicMarketingConfig = {
  meta_pixel_enabled: boolean;
  meta_pixel_id: string | null;
  meta_events_enabled: boolean;
  ga4_enabled: boolean;
  ga4_measurement_id: string | null;
  ga4_custom_events_enabled: boolean;
  google_ads_enabled: boolean;
  google_ads_conversion_id: string | null;
  google_ads_quote_label: string | null;
  google_ads_whatsapp_label: string | null;
  google_ads_lead_label: string | null;
  google_ads_remarketing_enabled: boolean;
  gtm_enabled: boolean;
  gtm_container_id: string | null;
  cookie_banner_enabled: boolean;
  cookie_banner_text: string | null;
  privacy_policy_url: string | null;
  require_analytics_consent: boolean;
  require_marketing_consent: boolean;
};

const CONSENT_KEY = "nl_consent_v1";
const VISITOR_KEY = "nl_visitor_id";
const SESSION_KEY = "nl_session_id";
export const CONSENT_EVENT = "nl-consent-change";

let _config: PublicMarketingConfig | null = null;

export function setMarketingConfig(cfg: PublicMarketingConfig | null) {
  _config = cfg;
}
export function getMarketingConfig() {
  return _config;
}

// ---------------------------------------------------------------- Consent ----
export function getConsent(): ConsentState {
  if (typeof window === "undefined")
    return { necessary: true, analytics: false, marketing: false, decided: false };
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return { necessary: true, analytics: false, marketing: false, decided: false };
    const parsed = JSON.parse(raw);
    return {
      necessary: true,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
      decided: !!parsed.decided,
    };
  } catch {
    return { necessary: true, analytics: false, marketing: false, decided: false };
  }
}

export function setConsent(state: { analytics: boolean; marketing: boolean }) {
  if (typeof window === "undefined") return;
  const next: ConsentState = {
    necessary: true,
    analytics: state.analytics,
    marketing: state.marketing,
    decided: true,
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: next }));
}

function analyticsAllowed(): boolean {
  const cfg = _config;
  // If consent isn't required by config, always allow.
  if (cfg && cfg.require_analytics_consent === false) return true;
  return getConsent().analytics;
}

function marketingAllowed(): boolean {
  const cfg = _config;
  if (cfg && cfg.require_marketing_consent === false) return true;
  return getConsent().marketing;
}

// Public helper used by the script loader to decide if marketing scripts
// may be injected for a given config.
export function marketingConfigAllowed(cfg: PublicMarketingConfig): boolean {
  if (cfg.require_marketing_consent === false) return true;
  return getConsent().marketing;
}

// ----------------------------------------------------------- Identity utils --
function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getVisitorId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuid();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function detectDevice(): { device_type: string; browser: string; os: string } {
  if (typeof navigator === "undefined")
    return { device_type: "unknown", browser: "unknown", os: "unknown" };
  const ua = navigator.userAgent;
  const device_type = /Mobi|Android|iPhone|iPad|iPod/i.test(ua)
    ? /iPad|Tablet/i.test(ua)
      ? "tablet"
      : "mobile"
    : "desktop";
  let browser = "Outro";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua) && !/Edg/i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  let os = "Outro";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  return { device_type, browser, os };
}

function getUtm() {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  return {
    source: p.get("utm_source"),
    medium: p.get("utm_medium"),
    campaign: p.get("utm_campaign"),
  };
}

// --------------------------------------------------------- Event taxonomy ----
export type AnalyticsEventName =
  | "page_view"
  | "product_view"
  | "brand_view"
  | "category_view"
  | "whatsapp_click"
  | "quote_request_started"
  | "quote_request_submitted"
  | "search_performed"
  | "banner_view"
  | "banner_click"
  | "product_card_click";

export type TrackPayload = {
  product_id?: string | null;
  brand_id?: string | null;
  category_id?: string | null;
  banner_id?: string | null;
  lead_id?: string | null;
  quote_request_id?: string | null;
  search_term?: string | null;
  results_count?: number | null;
  // Non-PII descriptive fields for pixels
  content_name?: string | null;
  content_category?: string | null;
  metadata?: Record<string, unknown>;
};

export function track(eventName: AnalyticsEventName, payload: TrackPayload = {}) {
  if (typeof window === "undefined") return;

  // First-party event log (analytics consent)
  if (analyticsAllowed()) {
    const { device_type, browser, os } = detectDevice();
    const utm = getUtm();
    void supabase
      .from("analytics_events")
      .insert({
        event_name: eventName,
        page_url: window.location.pathname + window.location.search,
        page_title: document.title,
        product_id: payload.product_id ?? null,
        brand_id: payload.brand_id ?? null,
        category_id: payload.category_id ?? null,
        banner_id: payload.banner_id ?? null,
        lead_id: payload.lead_id ?? null,
        quote_request_id: payload.quote_request_id ?? null,
        search_term: payload.search_term ?? null,
        results_count: payload.results_count ?? null,
        source: utm.source ?? null,
        medium: utm.medium ?? null,
        campaign: utm.campaign ?? null,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        device_type,
        browser,
        os,
        session_id: getSessionId(),
        visitor_id: getVisitorId(),
        metadata_json: (payload.metadata ?? {}) as never,
      })
      .then(({ error }) => {
        if (error) console.warn("analytics insert failed", error.message);
      });
  }

  // Third-party pixels (marketing consent)
  firePixel(eventName, payload);
}

// ------------------------------------------------------------ Pixel firing ---
function firePixel(eventName: AnalyticsEventName, payload: TrackPayload) {
  if (!marketingAllowed()) return;
  const cfg = _config;
  if (!cfg) return;
  const w = window as unknown as {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  };

  const meta = cfg.meta_pixel_enabled && cfg.meta_events_enabled && typeof w.fbq === "function";
  const ga = cfg.ga4_enabled && cfg.ga4_custom_events_enabled && typeof w.gtag === "function";
  const ads = cfg.google_ads_enabled && cfg.google_ads_conversion_id && typeof w.gtag === "function";

  const adsConv = (label?: string | null) => {
    if (ads && label) w.gtag!("event", "conversion", { send_to: `${cfg.google_ads_conversion_id}/${label}` });
  };

  switch (eventName) {
    case "page_view":
      if (meta) w.fbq!("track", "PageView");
      if (ga) w.gtag!("event", "page_view");
      break;
    case "product_view":
      if (meta)
        w.fbq!("track", "ViewContent", {
          content_name: payload.content_name,
          content_category: payload.content_category,
          content_ids: payload.product_id ? [payload.product_id] : [],
          content_type: "product",
        });
      if (ga)
        w.gtag!("event", "view_item", {
          item_id: payload.product_id,
          item_name: payload.content_name,
          item_brand: payload.content_category,
        });
      break;
    case "product_card_click":
      if (ga) w.gtag!("event", "select_item", { item_id: payload.product_id, item_name: payload.content_name });
      break;
    case "whatsapp_click":
      if (meta) w.fbq!("track", "Contact");
      if (ga) w.gtag!("event", "contact", { method: "whatsapp" });
      adsConv(cfg.google_ads_whatsapp_label);
      break;
    case "quote_request_submitted":
      if (meta) w.fbq!("track", "Lead");
      if (ga) w.gtag!("event", "generate_lead");
      adsConv(cfg.google_ads_quote_label);
      adsConv(cfg.google_ads_lead_label);
      break;
    case "search_performed":
      if (meta) w.fbq!("track", "Search", { search_string: payload.search_term });
      if (ga) w.gtag!("event", "search", { search_term: payload.search_term });
      break;
    case "banner_view":
      if (ga) w.gtag!("event", "view_promotion", { promotion_id: payload.banner_id, promotion_name: payload.content_name });
      break;
    case "banner_click":
      if (ga) w.gtag!("event", "select_promotion", { promotion_id: payload.banner_id, promotion_name: payload.content_name });
      break;
    default:
      break;
  }
}
