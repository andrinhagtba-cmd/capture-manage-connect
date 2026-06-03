-- 1) Premium showcase config table
CREATE TABLE public.premium_showcase (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eyebrow text DEFAULT 'Destaque premium',
  title text DEFAULT 'Produto Premium em Destaque',
  subtitle text,
  background_image_url text,
  background_video_url text,
  cta_label text DEFAULT 'Ver detalhes',
  cta_url text,
  product_ids uuid[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.premium_showcase TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.premium_showcase TO authenticated;
GRANT ALL ON public.premium_showcase TO service_role;

ALTER TABLE public.premium_showcase ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view active premium showcase"
  ON public.premium_showcase FOR SELECT
  USING (is_active = true);

CREATE POLICY "Staff view all premium showcase"
  ON public.premium_showcase FOR SELECT
  TO authenticated
  USING (is_staff(auth.uid()));

CREATE POLICY "Staff manage premium showcase"
  ON public.premium_showcase FOR ALL
  TO authenticated
  USING (is_staff(auth.uid()))
  WITH CHECK (is_staff(auth.uid()));

CREATE TRIGGER set_premium_showcase_updated_at
  BEFORE UPDATE ON public.premium_showcase
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Insert the DJI FlyCart 100 product
INSERT INTO public.products (
  name, slug, brand_id, category_id,
  short_description, full_description,
  main_image_url, official_product_url,
  model, sku, tags_json,
  availability_status, is_featured, is_active, order_index
) VALUES (
  'DJI FlyCart 100',
  'dji-flycart-100',
  '46150cc4-b445-4924-9409-c7c94dd36ed7',
  'a101f020-5c5e-48c6-9ee4-910e90730620',
  'Drone de carga profissional com até 85 kg de capacidade, bateria dupla e sistema de guincho de última geração.',
  'O novíssimo DJI FlyCart 100 redefine a entrega profissional: até 85 kg de capacidade de carga com bateria dupla, dois sistemas de transporte (guincho de alto desempenho e cargo) e integração total com um poderoso ecossistema de desenvolvedores. O avançado Sistema de Segurança Inteligente — com LiDAR, sistema Penta-Vision e radar de ondas milimétricas — garante entregas seguras das montanhas aos oceanos, com carregamento ultrarrápido e uma solução de software completa.',
  'https://www-cdn.djiits.com/cms/uploads/9358904a6d5a4182e2bcd9a0db8be35a.png',
  'https://www.dji.com/flycart-100',
  'FC100',
  'DJI-FC100',
  '["85 kg de carga", "Bateria dupla", "Sistema de guincho", "LiDAR", "Penta-Vision", "Radar milimétrico"]'::jsonb,
  'sob_consulta',
  true,
  true,
  0
)
ON CONFLICT (slug) DO NOTHING;

-- 3) Add the premium section to the home page (after brands)
INSERT INTO public.home_sections (section_key, eyebrow, title, subtitle, is_active, order_index)
VALUES (
  'premium',
  'Destaque premium',
  'Produto Premium em Destaque',
  NULL,
  true,
  2
)
ON CONFLICT (section_key) DO NOTHING;

-- shift the other sections down so premium sits right after brands
UPDATE public.home_sections SET order_index = order_index + 1
WHERE section_key IN ('features','drones','canon','sony','gopro','featured','cta');

-- 4) Seed the premium showcase config with the FlyCart 100
INSERT INTO public.premium_showcase (eyebrow, title, subtitle, cta_label, product_ids, is_active)
SELECT
  'Destaque premium',
  'Produto Premium em Destaque',
  'Conheça o equipamento que está redefinindo o profissional. Selecionado a dedo pela nossa curadoria.',
  'Ver detalhes',
  ARRAY[p.id],
  true
FROM public.products p
WHERE p.slug = 'dji-flycart-100';