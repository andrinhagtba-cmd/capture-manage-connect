-- ============ HERO BANNERS ============
CREATE TABLE public.hero_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location TEXT NOT NULL DEFAULT 'home',
  brand_id UUID,
  eyebrow TEXT,
  title TEXT,
  highlight TEXT,
  subtitle TEXT,
  badge_text TEXT,
  media_type TEXT NOT NULL DEFAULT 'image',
  desktop_image_url TEXT,
  mobile_image_url TEXT,
  video_url TEXT,
  overlay_opacity NUMERIC NOT NULL DEFAULT 0.7,
  primary_button_label TEXT,
  primary_button_url TEXT,
  secondary_button_label TEXT,
  secondary_button_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.hero_banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hero_banners TO authenticated;
GRANT ALL ON public.hero_banners TO service_role;

ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view active hero banners"
ON public.hero_banners FOR SELECT
USING (is_active = true);

CREATE POLICY "Staff view all hero banners"
ON public.hero_banners FOR SELECT TO authenticated
USING (is_staff(auth.uid()));

CREATE POLICY "Staff manage hero banners"
ON public.hero_banners FOR ALL TO authenticated
USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

CREATE TRIGGER set_hero_banners_updated_at
BEFORE UPDATE ON public.hero_banners
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ HOME SECTIONS ============
CREATE TABLE public.home_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  eyebrow TEXT,
  title TEXT,
  subtitle TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.home_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_sections TO authenticated;
GRANT ALL ON public.home_sections TO service_role;

ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view active home sections"
ON public.home_sections FOR SELECT
USING (is_active = true);

CREATE POLICY "Staff view all home sections"
ON public.home_sections FOR SELECT TO authenticated
USING (is_staff(auth.uid()));

CREATE POLICY "Staff manage home sections"
ON public.home_sections FOR ALL TO authenticated
USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

CREATE TRIGGER set_home_sections_updated_at
BEFORE UPDATE ON public.home_sections
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SEED HERO ============
INSERT INTO public.hero_banners
  (location, eyebrow, title, highlight, subtitle, badge_text, media_type,
   primary_button_label, primary_button_url, secondary_button_label, secondary_button_url, order_index, is_active)
VALUES
  ('home',
   'NL Foto e Vídeo · Brasília-DF',
   'Equipamentos profissionais de',
   'foto e vídeo',
   'Curadoria oficial das marcas Canon, DJI, Sony e GoPro. Conte com mais de 20 anos de expertise para escolher o equipamento certo.',
   'Revendedor autorizado de todas as linhas das marcas',
   'image',
   'Ver catálogo', '/catalogo',
   'Solicitar orçamento', '',
   0, true);

-- ============ SEED HOME SECTIONS ============
INSERT INTO public.home_sections (section_key, eyebrow, title, subtitle, order_index, is_active) VALUES
  ('brands', NULL, 'Marcas', NULL, 1, true),
  ('features', NULL, 'Por que comprar conosco', NULL, 2, true),
  ('drones', NULL, 'Drones', NULL, 3, true),
  ('canon', NULL, 'Canon', NULL, 4, true),
  ('sony', NULL, 'Sony', NULL, 5, true),
  ('gopro', NULL, 'GoPro', NULL, 6, true),
  ('featured', 'Seleção da casa', 'Produtos em destaque', NULL, 7, true),
  ('cta', 'Atendimento personalizado', 'Não encontrou o que procura?', 'Nossa equipe monta um orçamento personalizado para o seu projeto, com as melhores condições e equipamentos das principais marcas do mundo.', 8, true);