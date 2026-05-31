-- Extend products with new fields
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_image_url text,
  ADD COLUMN IF NOT EXISTS internal_notes text;

-- Related products
CREATE TABLE IF NOT EXISTS public.product_related (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  related_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  relation_type text NOT NULL DEFAULT 'related',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, related_product_id)
);

GRANT SELECT ON public.product_related TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_related TO authenticated;
GRANT ALL ON public.product_related TO service_role;

ALTER TABLE public.product_related ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view related products"
ON public.product_related FOR SELECT
USING (true);

CREATE POLICY "Staff manage related products"
ON public.product_related FOR ALL
TO authenticated
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_product_related_product ON public.product_related(product_id);
