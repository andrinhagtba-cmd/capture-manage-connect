-- Product-level SEO / sharing fields
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS og_title text,
  ADD COLUMN IF NOT EXISTS og_description text,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS use_main_image_as_og boolean NOT NULL DEFAULT true;

-- Global default SEO / sharing settings
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS public_site_url text,
  ADD COLUMN IF NOT EXISTS site_name text,
  ADD COLUMN IF NOT EXISTS default_og_title text,
  ADD COLUMN IF NOT EXISTS default_og_description text,
  ADD COLUMN IF NOT EXISTS default_og_image_url text,
  ADD COLUMN IF NOT EXISTS default_twitter_card text DEFAULT 'summary_large_image',
  ADD COLUMN IF NOT EXISTS default_brand_image_url text,
  ADD COLUMN IF NOT EXISTS default_product_image_url text;