-- =========================================================
-- ANALYTICS EVENTS (source of truth for all dashboard metrics)
-- =========================================================
CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name text NOT NULL,
  page_url text,
  page_title text,
  product_id uuid,
  brand_id uuid,
  category_id uuid,
  banner_id uuid,
  lead_id uuid,
  quote_request_id uuid,
  search_term text,
  results_count integer,
  source text,
  medium text,
  campaign text,
  referrer text,
  user_agent text,
  device_type text,
  browser text,
  os text,
  country text,
  state text,
  city text,
  session_id text,
  visitor_id text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX idx_analytics_events_event_name ON public.analytics_events (event_name);
CREATE INDEX idx_analytics_events_product ON public.analytics_events (product_id);
CREATE INDEX idx_analytics_events_brand ON public.analytics_events (brand_id);
CREATE INDEX idx_analytics_events_visitor ON public.analytics_events (visitor_id);

GRANT SELECT, INSERT ON public.analytics_events TO anon;
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone (anonymous visitors) can record an event
CREATE POLICY "Anyone can record analytics events"
ON public.analytics_events
FOR INSERT
WITH CHECK (true);

-- Only staff can read analytics
CREATE POLICY "Staff view analytics events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (is_staff(auth.uid()));

-- =========================================================
-- MARKETING INTEGRATIONS (single config row; holds secrets)
-- =========================================================
CREATE TABLE public.marketing_integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meta_pixel_enabled boolean NOT NULL DEFAULT false,
  meta_pixel_id text,
  meta_capi_enabled boolean NOT NULL DEFAULT false,
  meta_capi_access_token text,
  meta_test_event_code text,
  meta_events_enabled boolean NOT NULL DEFAULT true,
  ga4_enabled boolean NOT NULL DEFAULT false,
  ga4_measurement_id text,
  ga4_api_secret text,
  ga4_custom_events_enabled boolean NOT NULL DEFAULT true,
  google_ads_enabled boolean NOT NULL DEFAULT false,
  google_ads_conversion_id text,
  google_ads_quote_label text,
  google_ads_whatsapp_label text,
  google_ads_lead_label text,
  google_ads_remarketing_enabled boolean NOT NULL DEFAULT false,
  gtm_enabled boolean NOT NULL DEFAULT false,
  gtm_container_id text,
  cookie_banner_enabled boolean NOT NULL DEFAULT true,
  cookie_banner_text text DEFAULT 'Usamos cookies para melhorar sua experiência, analisar o tráfego e personalizar conteúdo. Você pode aceitar todos ou gerenciar suas preferências.',
  privacy_policy_url text,
  require_analytics_consent boolean NOT NULL DEFAULT true,
  require_marketing_consent boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_integrations TO authenticated;
GRANT ALL ON public.marketing_integrations TO service_role;

ALTER TABLE public.marketing_integrations ENABLE ROW LEVEL SECURITY;

-- Only staff can read/manage the full config (it contains secrets)
CREATE POLICY "Staff manage marketing integrations"
ON public.marketing_integrations
FOR ALL
TO authenticated
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));

CREATE TRIGGER set_marketing_integrations_updated_at
BEFORE UPDATE ON public.marketing_integrations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Public-safe view: exposes ONLY non-sensitive fields needed to load
-- client-side pixels. Secrets (CAPI token, GA4 API secret) are excluded.
CREATE VIEW public.public_marketing_config
WITH (security_invoker = false) AS
SELECT
  meta_pixel_enabled,
  meta_pixel_id,
  meta_events_enabled,
  ga4_enabled,
  ga4_measurement_id,
  ga4_custom_events_enabled,
  google_ads_enabled,
  google_ads_conversion_id,
  google_ads_quote_label,
  google_ads_whatsapp_label,
  google_ads_lead_label,
  google_ads_remarketing_enabled,
  gtm_enabled,
  gtm_container_id,
  cookie_banner_enabled,
  cookie_banner_text,
  privacy_policy_url,
  require_analytics_consent,
  require_marketing_consent
FROM public.marketing_integrations
LIMIT 1;

GRANT SELECT ON public.public_marketing_config TO anon;
GRANT SELECT ON public.public_marketing_config TO authenticated;

-- =========================================================
-- MARKETING EVENT LOGS (server/test event audit)
-- =========================================================
CREATE TABLE public.marketing_event_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name text NOT NULL,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_event_logs_created_at ON public.marketing_event_logs (created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_event_logs TO authenticated;
GRANT ALL ON public.marketing_event_logs TO service_role;

ALTER TABLE public.marketing_event_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage marketing event logs"
ON public.marketing_event_logs
FOR ALL
TO authenticated
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));

-- Seed the single marketing config row
INSERT INTO public.marketing_integrations (id) VALUES (gen_random_uuid());