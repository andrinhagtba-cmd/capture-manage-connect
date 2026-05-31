CREATE TABLE public.brand_page_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_slug TEXT NOT NULL UNIQUE,
  intro_eyebrow TEXT,
  intro_title TEXT,
  intro_text TEXT,
  primary_button_label TEXT,
  primary_button_url TEXT,
  secondary_button_label TEXT,
  secondary_button_url TEXT,
  show_categories BOOLEAN NOT NULL DEFAULT true,
  show_products BOOLEAN NOT NULL DEFAULT true,
  meta_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.brand_page_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_page_settings TO authenticated;
GRANT ALL ON public.brand_page_settings TO service_role;

ALTER TABLE public.brand_page_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view published brand pages"
ON public.brand_page_settings FOR SELECT
USING (is_published = true);

CREATE POLICY "Staff view all brand pages"
ON public.brand_page_settings FOR SELECT TO authenticated
USING (is_staff(auth.uid()));

CREATE POLICY "Staff manage brand pages"
ON public.brand_page_settings FOR ALL TO authenticated
USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

CREATE TRIGGER set_brand_page_settings_updated_at
BEFORE UPDATE ON public.brand_page_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.brand_page_settings (brand_slug, secondary_button_label) VALUES
  ('canon', 'Site oficial'),
  ('dji', 'Site oficial'),
  ('sony', 'Site oficial'),
  ('gopro', 'Site oficial');