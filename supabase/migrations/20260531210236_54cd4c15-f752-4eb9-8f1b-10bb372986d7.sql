-- =========================================================
-- company_settings (singleton)
-- =========================================================
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT,
  slogan TEXT,
  short_description TEXT,
  full_description TEXT,
  history_text TEXT,
  cnpj TEXT,
  address TEXT,
  store_location TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  opening_hours TEXT,
  whatsapp TEXT,
  phone TEXT,
  email TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  tiktok_url TEXT,
  youtube_url TEXT,
  google_maps_embed TEXT,
  directions_url TEXT,
  warranty_text TEXT,
  provenance_text TEXT,
  testing_text TEXT,
  logo_url TEXT,
  logo_light_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.company_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_settings TO authenticated;
GRANT ALL ON public.company_settings TO service_role;

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view company settings"
ON public.company_settings FOR SELECT USING (true);

CREATE POLICY "Staff manage company settings"
ON public.company_settings FOR ALL TO authenticated
USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

CREATE TRIGGER set_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- footer_settings (singleton)
-- =========================================================
CREATE TABLE public.footer_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url TEXT,
  description TEXT,
  show_company_address BOOLEAN NOT NULL DEFAULT true,
  show_opening_hours BOOLEAN NOT NULL DEFAULT true,
  show_whatsapp BOOLEAN NOT NULL DEFAULT true,
  show_email BOOLEAN NOT NULL DEFAULT true,
  show_social_links BOOLEAN NOT NULL DEFAULT true,
  copyright_text TEXT,
  warranty_badge_text TEXT,
  provenance_badge_text TEXT,
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.footer_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.footer_settings TO authenticated;
GRANT ALL ON public.footer_settings TO service_role;

ALTER TABLE public.footer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view footer settings"
ON public.footer_settings FOR SELECT USING (true);

CREATE POLICY "Staff manage footer settings"
ON public.footer_settings FOR ALL TO authenticated
USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

CREATE TRIGGER set_footer_settings_updated_at
BEFORE UPDATE ON public.footer_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- footer_link_groups
-- =========================================================
CREATE TABLE public.footer_link_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.footer_link_groups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.footer_link_groups TO authenticated;
GRANT ALL ON public.footer_link_groups TO service_role;

ALTER TABLE public.footer_link_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view footer groups"
ON public.footer_link_groups FOR SELECT USING (true);

CREATE POLICY "Staff manage footer groups"
ON public.footer_link_groups FOR ALL TO authenticated
USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- =========================================================
-- footer_links
-- =========================================================
CREATE TABLE public.footer_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.footer_link_groups(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.footer_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.footer_links TO authenticated;
GRANT ALL ON public.footer_links TO service_role;

ALTER TABLE public.footer_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view footer links"
ON public.footer_links FOR SELECT USING (true);

CREATE POLICY "Staff manage footer links"
ON public.footer_links FOR ALL TO authenticated
USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- =========================================================
-- navigation_items
-- =========================================================
CREATE TABLE public.navigation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  parent_id UUID REFERENCES public.navigation_items(id) ON DELETE CASCADE,
  menu_area TEXT NOT NULL DEFAULT 'header',
  order_index INTEGER NOT NULL DEFAULT 0,
  opens_new_tab BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.navigation_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.navigation_items TO authenticated;
GRANT ALL ON public.navigation_items TO service_role;

ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view navigation items"
ON public.navigation_items FOR SELECT USING (true);

CREATE POLICY "Staff manage navigation items"
ON public.navigation_items FOR ALL TO authenticated
USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- =========================================================
-- Seed data
-- =========================================================
INSERT INTO public.company_settings (
  company_name, slogan, short_description, full_description,
  address, store_location, city, state, opening_hours,
  whatsapp, phone, email, instagram_url, google_maps_embed,
  warranty_text, provenance_text, testing_text
) VALUES (
  'NL Foto e Vídeo',
  'Referência em Foto e Vídeo profissional',
  'Com mais de 20 anos de história na Feira dos Importados de Brasília, a NL Foto e Vídeo é referência quando o assunto é Foto e Vídeo profissional.',
  'Com mais de 20 anos de história na Feira dos Importados de Brasília, a NL Foto e Vídeo é referência quando o assunto é Foto e Vídeo profissional. Revendedor autorizado de todas as linhas das marcas Canon, DJI, Sony e GoPro.',
  'Bloco D, Loja 001 - Feira dos Importados de Brasília',
  'Bloco D, Loja 001',
  'Brasília',
  'DF',
  'Terça a Domingo, das 09h às 18h',
  '556181871104',
  '(61) 8187-1104',
  'contato@nlfotoevideo.com.br',
  'https://instagram.com/nlfotoevideo',
  '',
  'Equipamentos novos, com garantia.',
  'Produtos com procedência garantida.',
  'Equipamentos testados na hora.'
);

INSERT INTO public.footer_settings (
  description, copyright_text, warranty_badge_text, provenance_badge_text
) VALUES (
  'Com mais de 20 anos de história na Feira dos Importados de Brasília, a NL Foto e Vídeo é referência quando o assunto é Foto e Vídeo profissional.',
  '© {year} NL Foto e Vídeo. Todos os direitos reservados.',
  'Garantia oficial',
  'Procedência garantida'
);

INSERT INTO public.navigation_items (label, url, menu_area, order_index) VALUES
  ('Catálogo', '/catalogo', 'header', 0),
  ('Sobre', '/sobre', 'header', 1),
  ('Contato', '/contato', 'header', 2);

INSERT INTO public.footer_link_groups (title, order_index) VALUES
  ('Navegação', 0);

INSERT INTO public.footer_links (group_id, label, url, order_index)
SELECT id, 'Catálogo', '/catalogo', 0 FROM public.footer_link_groups WHERE title = 'Navegação';
INSERT INTO public.footer_links (group_id, label, url, order_index)
SELECT id, 'Sobre nós', '/sobre', 1 FROM public.footer_link_groups WHERE title = 'Navegação';
INSERT INTO public.footer_links (group_id, label, url, order_index)
SELECT id, 'Contato', '/contato', 2 FROM public.footer_link_groups WHERE title = 'Navegação';
INSERT INTO public.footer_links (group_id, label, url, order_index)
SELECT id, 'Área administrativa', '/login', 3 FROM public.footer_link_groups WHERE title = 'Navegação';