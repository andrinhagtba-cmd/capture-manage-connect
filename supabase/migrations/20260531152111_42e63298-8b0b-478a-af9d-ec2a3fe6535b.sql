-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'vendedor');
CREATE TYPE public.availability_status AS ENUM ('disponivel', 'sob_consulta', 'encomenda', 'indisponivel');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles selectable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','editor','vendedor'))
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + bootstrap first user as admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count int;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);

  SELECT count(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- BRANDS
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  logo_url text,
  hero_image_url text,
  theme_primary_color text,
  theme_secondary_color text,
  official_site_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT SELECT ON public.brands TO anon;
GRANT ALL ON public.brands TO service_role;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active brands" ON public.brands FOR SELECT USING (is_active = true);
CREATE POLICY "Staff view all brands" ON public.brands FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff manage brands" ON public.brands FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  parent_category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  description text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT ON public.categories TO anon;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Staff view all categories" ON public.categories FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff manage categories" ON public.categories FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  short_description text,
  full_description text,
  specifications_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  main_image_url text,
  gallery_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  official_product_url text,
  sku text,
  model text,
  tags_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  use_cases_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  availability_status availability_status NOT NULL DEFAULT 'sob_consulta',
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  internal_cost numeric,
  internal_price numeric,
  public_price_visible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Staff view all products" ON public.products FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff manage products" ON public.products FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- BANNERS
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  subtitle text,
  image_url text,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  link_url text,
  button_label text,
  position int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT SELECT ON public.banners TO anon;
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active banners" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Staff view all banners" ON public.banners FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff manage banners" ON public.banners FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- QUOTE REQUESTS
CREATE TABLE public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  message text,
  preferred_contact_method text DEFAULT 'whatsapp',
  status text NOT NULL DEFAULT 'novo',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.quote_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_requests TO authenticated;
GRANT ALL ON public.quote_requests TO service_role;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submits quote" ON public.quote_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff view quotes" ON public.quote_requests FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff manage quotes" ON public.quote_requests FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete quotes" ON public.quote_requests FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- LEADS
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  source text,
  interest_brand text,
  interest_category text,
  message text,
  status text NOT NULL DEFAULT 'novo',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submits lead" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff view leads" ON public.leads FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff manage leads" ON public.leads FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete leads" ON public.leads FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- IMPORT BATCHES
CREATE TABLE public.import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text,
  file_url text,
  status text NOT NULL DEFAULT 'concluido',
  total_rows int NOT NULL DEFAULT 0,
  imported_rows int NOT NULL DEFAULT 0,
  failed_rows int NOT NULL DEFAULT 0,
  report_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.import_batches TO authenticated;
GRANT ALL ON public.import_batches TO service_role;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view imports" ON public.import_batches FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff manage imports" ON public.import_batches FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- STORE SETTINGS
CREATE TABLE public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text,
  about_text text,
  address text,
  opening_hours text,
  whatsapp text,
  instagram text,
  map_embed_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_settings TO authenticated;
GRANT SELECT ON public.store_settings TO anon;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view store settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Staff manage store settings" ON public.store_settings FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER store_settings_updated_at BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SEED ============
INSERT INTO public.store_settings (company_name, about_text, address, opening_hours, whatsapp, instagram, map_embed_url)
VALUES (
  'NL Foto e Vídeo',
  'Com mais de 20 anos de história na Feira dos Importados de Brasília, a NL Foto e Vídeo é referência quando o assunto é Foto e Vídeo profissional.',
  'Bloco D, Loja 001 - Feira dos Importados de Brasília',
  'Terça a Domingo, das 09h às 18h',
  '+556181871104',
  '',
  'https://www.google.com/maps?q=Feira+dos+Importados+de+Brasília&output=embed'
);

INSERT INTO public.brands (name, slug, description, theme_primary_color, theme_secondary_color, official_site_url, sort_order) VALUES
('Canon', 'canon', 'Câmeras, lentes e sistemas de imagem com qualidade técnica de referência mundial.', '#C40000', '#111111', 'https://www.canon.com.br', 1),
('DJI', 'dji', 'Drones, estabilizadores e ferramentas de criação aérea e cinematográfica.', '#111111', '#E5252A', 'https://www.dji.com', 2),
('Sony', 'sony', 'Linha Alpha e sistemas profissionais para foto, vídeo e áudio de alto nível.', '#000000', '#005BBB', 'https://www.sony.com.br', 3),
('GoPro', 'gopro', 'Câmeras de ação e 360 para aventura, esporte e criação de conteúdo.', '#00AEEF', '#111111', 'https://gopro.com', 4);

-- Canon categories
INSERT INTO public.categories (name, slug, brand_id, sort_order)
SELECT v.name, v.slug, b.id, v.ord FROM public.brands b,
(VALUES
 ('Câmeras Mirrorless','canon-mirrorless',1),
 ('Câmeras DSLR','canon-dslr',2),
 ('Cinema & Broadcast','canon-cinema',3),
 ('Câmeras PowerShot','canon-powershot',4),
 ('Lentes RF e RF-S','canon-lentes-rf',5),
 ('Lentes EF e EF-S','canon-lentes-ef',6),
 ('Flashes Speedlite','canon-speedlite',7),
 ('Baterias, carregadores e grips','canon-baterias',8),
 ('Bolsas e mochilas','canon-bolsas',9),
 ('Impressoras e multifuncionais','canon-impressoras',10),
 ('Suprimentos e papéis','canon-suprimentos',11),
 ('Scanners e projetores','canon-scanners',12)
) AS v(name,slug,ord) WHERE b.slug='canon';

-- DJI categories
INSERT INTO public.categories (name, slug, brand_id, sort_order)
SELECT v.name, v.slug, b.id, v.ord FROM public.brands b,
(VALUES
 ('Drones','dji-drones',1),
 ('Estabilizadores','dji-estabilizadores',2),
 ('Transmissores','dji-transmissores',3),
 ('Câmeras e microfones','dji-cameras',4),
 ('Acessórios','dji-acessorios',5),
 ('Energia','dji-energia',6),
 ('Baterias','dji-baterias',7),
 ('Combos','dji-combos',8),
 ('Produtos para criadores','dji-criadores',9),
 ('Produtos profissionais','dji-profissional',10)
) AS v(name,slug,ord) WHERE b.slug='dji';

-- Sony categories
INSERT INTO public.categories (name, slug, brand_id, sort_order)
SELECT v.name, v.slug, b.id, v.ord FROM public.brands b,
(VALUES
 ('Câmeras de lentes intercambiáveis','sony-intercambiaveis',1),
 ('Câmeras full-frame','sony-fullframe',2),
 ('Câmeras APS-C','sony-apsc',3),
 ('Lentes','sony-lentes',4),
 ('Câmeras para vlog','sony-vlog',5),
 ('Acessórios para câmera','sony-acessorios',6),
 ('Áudio para criadores','sony-audio',7),
 ('Equipamentos profissionais','sony-profissional',8)
) AS v(name,slug,ord) WHERE b.slug='sony';

-- GoPro categories
INSERT INTO public.categories (name, slug, brand_id, sort_order)
SELECT v.name, v.slug, b.id, v.ord FROM public.brands b,
(VALUES
 ('Câmeras de ação','gopro-acao',1),
 ('Câmeras 360','gopro-360',2),
 ('Acessórios','gopro-acessorios',3),
 ('Suportes','gopro-suportes',4),
 ('Baterias','gopro-baterias',5),
 ('Mods','gopro-mods',6),
 ('Cases','gopro-cases',7),
 ('Produtos para aventura','gopro-aventura',8),
 ('Produtos para criadores','gopro-criadores',9)
) AS v(name,slug,ord) WHERE b.slug='gopro';

-- DEMO PRODUCTS
INSERT INTO public.products (name, slug, brand_id, category_id, short_description, full_description, specifications_json, official_product_url, model, tags_json, use_cases_json, availability_status, is_featured)
SELECT p.name, p.slug, b.id, c.id, p.short_desc, p.full_desc, p.specs::jsonb, p.url, p.model, p.tags::jsonb, p.uses::jsonb, p.avail::availability_status, p.feat
FROM (VALUES
 ('Canon EOS R6 Mark II','canon-eos-r6-mark-ii','canon','canon-mirrorless','Mirrorless full-frame versátil para foto e vídeo profissional.','Câmera mirrorless full-frame de 24,2 MP com vídeo 4K 60p, estabilização integrada e foco automático inteligente para fotografia e vídeo de alto desempenho.','[{"label":"Sensor","value":"Full-frame 24,2 MP"},{"label":"Vídeo","value":"4K 60p"},{"label":"Estabilização","value":"IBIS até 8 stops"}]','https://www.canon.com.br','EOS R6 Mark II','["mirrorless","full-frame","video"]','["Produção audiovisual","Profissional"]','disponivel',true),
 ('Canon RF 24-70mm f/2.8L IS USM','canon-rf-24-70-f28','canon','canon-lentes-rf','Zoom padrão profissional de abertura constante f/2.8.','Lente zoom padrão RF de abertura constante f/2.8 com estabilização óptica, ideal para retratos, eventos e vídeo.','[{"label":"Distância focal","value":"24-70mm"},{"label":"Abertura","value":"f/2.8 constante"},{"label":"Montagem","value":"Canon RF"}]','https://www.canon.com.br','RF 24-70mm','["lente","rf","zoom"]','["Profissional","Eventos"]','disponivel',true),
 ('Canon EOS R50','canon-eos-r50','canon','canon-mirrorless','Mirrorless compacta para criadores iniciantes.','Câmera mirrorless APS-C compacta e leve com vídeo 4K e foco automático com detecção de sujeito, perfeita para começar na criação de conteúdo.','[{"label":"Sensor","value":"APS-C 24,2 MP"},{"label":"Vídeo","value":"4K 30p"},{"label":"Peso","value":"375 g"}]','https://www.canon.com.br','EOS R50','["mirrorless","aps-c","vlog"]','["Iniciante","Vlog"]','sob_consulta',false),
 ('DJI Mavic 3 Pro','dji-mavic-3-pro','dji','dji-drones','Drone com sistema de câmera tripla Hasselblad.','Drone profissional com câmera Hasselblad de 4/3, teleobjetivas e até 43 minutos de voo para produções aéreas cinematográficas.','[{"label":"Sensor","value":"4/3 CMOS Hasselblad"},{"label":"Vídeo","value":"5.1K 50fps"},{"label":"Autonomia","value":"43 min"}]','https://www.dji.com','Mavic 3 Pro','["drone","aereo","cinema"]','["Produção audiovisual","Profissional"]','disponivel',true),
 ('DJI RS 4 Pro','dji-rs-4-pro','dji','dji-estabilizadores','Estabilizador gimbal para câmeras profissionais.','Gimbal de 3 eixos com alta capacidade de carga, transmissão de imagem integrada e foco automatizado para fluxos de trabalho de cinema.','[{"label":"Eixos","value":"3"},{"label":"Carga","value":"4,5 kg"},{"label":"Autonomia","value":"13 h"}]','https://www.dji.com','RS 4 Pro','["gimbal","estabilizador"]','["Produção audiovisual","Profissional"]','disponivel',true),
 ('DJI Mini 4 Pro','dji-mini-4-pro','dji','dji-drones','Drone ultracompacto abaixo de 249g com 4K HDR.','Drone leve e portátil com detecção omnidirecional de obstáculos e vídeo 4K HDR, ideal para viagens e criadores.','[{"label":"Peso","value":"< 249 g"},{"label":"Vídeo","value":"4K 60fps HDR"},{"label":"Autonomia","value":"34 min"}]','https://www.dji.com','Mini 4 Pro','["drone","viagem","compacto"]','["Viagem","Iniciante"]','disponivel',false),
 ('Sony Alpha A7 IV','sony-alpha-a7-iv','sony','sony-fullframe','Full-frame híbrida de referência para foto e vídeo.','Câmera full-frame de 33 MP com vídeo 4K 60p, foco automático em tempo real e ergonomia profissional para fluxos híbridos.','[{"label":"Sensor","value":"Full-frame 33 MP"},{"label":"Vídeo","value":"4K 60p"},{"label":"AF","value":"Real-time Tracking"}]','https://www.sony.com.br','ILCE-7M4','["alpha","full-frame","hibrida"]','["Profissional","Produção audiovisual"]','disponivel',true),
 ('Sony Alpha ZV-E1','sony-zv-e1','sony','sony-vlog','Câmera full-frame compacta dedicada a criadores.','Câmera de vlog full-frame com recursos de IA para enquadramento automático, vídeo 4K e áudio inteligente.','[{"label":"Sensor","value":"Full-frame 12 MP"},{"label":"Vídeo","value":"4K 120p"},{"label":"Recursos","value":"Auto Framing IA"}]','https://www.sony.com.br','ZV-E1','["alpha","vlog","creator"]','["Vlog","Produção audiovisual"]','sob_consulta',true),
 ('Sony FE 70-200mm f/2.8 GM II','sony-fe-70-200-gm2','sony','sony-lentes','Teleobjetiva G Master de alto desempenho.','Lente teleobjetiva G Master de abertura constante f/2.8, leve e rápida, para esportes, retratos e eventos.','[{"label":"Distância focal","value":"70-200mm"},{"label":"Abertura","value":"f/2.8 constante"},{"label":"Montagem","value":"Sony E"}]','https://www.sony.com.br','SEL70200GM2','["lente","g-master","tele"]','["Profissional","Eventos"]','encomenda',false),
 ('GoPro HERO13 Black','gopro-hero13-black','gopro','gopro-acao','Câmera de ação carro-chefe à prova d''água.','Câmera de ação com vídeo 5.3K, estabilização HyperSmooth, suporte a lentes intercambiáveis e à prova d''água.','[{"label":"Vídeo","value":"5.3K 60fps"},{"label":"Estabilização","value":"HyperSmooth 6.0"},{"label":"Resistência","value":"À prova d''água 10m"}]','https://gopro.com','HERO13 Black','["acao","aventura","4k"]','["Esporte","Aventura","Água"]','disponivel',true),
 ('GoPro MAX 360','gopro-max-360','gopro','gopro-360','Câmera 360 e tradicional em um só corpo.','Câmera 360 com captura imersiva, modo HERO tradicional e estabilização Max HyperSmooth para conteúdo criativo.','[{"label":"Vídeo 360","value":"5.6K"},{"label":"Modos","value":"360 + HERO"},{"label":"Áudio","value":"6 microfones"}]','https://gopro.com','MAX','["360","aventura","creator"]','["Vlog","Aventura"]','sob_consulta',false),
 ('GoPro HERO13 Creator Edition','gopro-hero13-creator','gopro','gopro-criadores','Kit completo de criação com bateria, alça e luz.','Edição para criadores com Volta (empunhadura/bateria), Media Mod e Light Mod para produção de conteúdo profissional em movimento.','[{"label":"Vídeo","value":"5.3K 60fps"},{"label":"Inclui","value":"Volta + Media Mod + Light Mod"},{"label":"Áudio","value":"Microfone direcional"}]','https://gopro.com','HERO13 Creator','["acao","creator","kit"]','["Vlog","Produção audiovisual"]','encomenda',false)
) AS p(name,slug,brand_slug,cat_slug,short_desc,full_desc,specs,url,model,tags,uses,avail,feat)
JOIN public.brands b ON b.slug = p.brand_slug
JOIN public.categories c ON c.slug = p.cat_slug;