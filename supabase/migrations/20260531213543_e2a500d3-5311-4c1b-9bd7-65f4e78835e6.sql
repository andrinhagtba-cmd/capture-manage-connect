-- Site pages: per-page SEO + editable institutional content
CREATE TABLE public.site_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key text NOT NULL UNIQUE,
  label text NOT NULL,
  slug text,
  eyebrow text,
  heading text,
  subheading text,
  body_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  meta_title text,
  meta_description text,
  meta_image_url text,
  og_title text,
  og_description text,
  noindex boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_pages TO authenticated;
GRANT ALL ON public.site_pages TO service_role;

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view published site pages"
ON public.site_pages FOR SELECT
USING (is_published = true);

CREATE POLICY "Staff view all site pages"
ON public.site_pages FOR SELECT
TO authenticated
USING (is_staff(auth.uid()));

CREATE POLICY "Staff manage site pages"
ON public.site_pages FOR ALL
TO authenticated
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));

CREATE TRIGGER set_site_pages_updated_at
BEFORE UPDATE ON public.site_pages
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed the core pages
INSERT INTO public.site_pages (page_key, label, slug, eyebrow, heading, subheading, body_json, meta_title, meta_description, order_index) VALUES
('home', 'Home', '/', NULL, NULL, NULL, '[]'::jsonb,
  'NL Foto e Vídeo — Câmeras, Drones e Equipamentos Profissionais',
  'Equipamentos profissionais de foto e vídeo em Brasília. Canon, DJI, Sony e GoPro com atendimento especializado.', 0),
('sobre', 'Sobre', '/sobre', 'Nossa história', 'Paixão por imagem há mais de 20 anos', NULL,
  '["A NL Foto e Vídeo nasceu na tradicional Feira dos Importados de Brasília e se tornou referência para fotógrafos, videomakers e criadores de conteúdo de todo o Distrito Federal.","Trabalhamos com curadoria das principais marcas do mundo — Canon, DJI, Sony e GoPro — oferecendo equipamentos oficiais, atendimento especializado e as melhores condições do mercado.","Nossa missão é simples: entregar o equipamento certo para cada projeto, com a confiança de quem entende do assunto há mais de duas décadas."]'::jsonb,
  'Sobre — NL Foto e Vídeo',
  'Há mais de 20 anos, a NL Foto e Vídeo é referência em equipamentos profissionais de foto e vídeo na Feira dos Importados de Brasília.', 1),
('contato', 'Contato', '/contato', 'Contato', 'Fale com a gente',
  'Tire dúvidas, peça um orçamento ou agende uma visita à nossa loja na Feira dos Importados de Brasília.', '[]'::jsonb,
  'Contato — NL Foto e Vídeo',
  'Fale com a NL Foto e Vídeo em Brasília. WhatsApp, endereço na Feira dos Importados e horário de atendimento.', 2),
('catalogo', 'Catálogo', '/catalogo', NULL, NULL, NULL, '[]'::jsonb,
  'Catálogo — NL Foto e Vídeo',
  'Explore câmeras, drones, lentes e acessórios das melhores marcas com a NL Foto e Vídeo.', 3);