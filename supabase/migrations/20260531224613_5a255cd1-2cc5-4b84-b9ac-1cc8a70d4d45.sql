-- Remove the security-definer view (flagged by linter)
DROP VIEW IF EXISTS public.public_marketing_config;

-- Move sensitive secrets into a separate staff-only table
CREATE TABLE public.marketing_secrets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meta_capi_access_token text,
  ga4_api_secret text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_secrets TO authenticated;
GRANT ALL ON public.marketing_secrets TO service_role;

ALTER TABLE public.marketing_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage marketing secrets"
ON public.marketing_secrets
FOR ALL
TO authenticated
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));

CREATE TRIGGER set_marketing_secrets_updated_at
BEFORE UPDATE ON public.marketing_secrets
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Migrate existing secret values, then drop the secret columns from the public table
INSERT INTO public.marketing_secrets (meta_capi_access_token, ga4_api_secret)
SELECT meta_capi_access_token, ga4_api_secret FROM public.marketing_integrations LIMIT 1;

ALTER TABLE public.marketing_integrations
  DROP COLUMN meta_capi_access_token,
  DROP COLUMN ga4_api_secret;

-- The remaining marketing_integrations columns are not secret (pixel IDs are
-- embedded in client scripts anyway), so allow public read for script loading.
GRANT SELECT ON public.marketing_integrations TO anon;

CREATE POLICY "Public read marketing config"
ON public.marketing_integrations
FOR SELECT
USING (true);