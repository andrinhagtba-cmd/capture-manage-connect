
-- Update existing GoPro products with official camera photos
UPDATE public.products SET
  main_image_url = 'https://static.gopro.com/assets/blta2b8522e5372af40/bltf83a6ab7df7c2ec6/66a7ddf2c3ff6a30f409bfac/04-1-clp-featured-H13-1920-1280-png.png?width=1200&quality=80&auto=webp&disable=upscale',
  short_description = 'Funciona com as novas Lentes HB-Series, soluções de energia aprimoradas e montagem magnética.',
  is_featured = true
WHERE slug = 'gopro-hero13-black';

UPDATE public.products SET
  main_image_url = 'https://static.gopro.com/assets/blta2b8522e5372af40/blt370da91d3b7d0bf0/68acb984a77657acbec2ef24/02-clp-featured-max-1920-1280.png?width=1200&quality=80&auto=webp&disable=upscale',
  short_description = 'Vídeo 5,6K 360°, reenquadramento fácil e muito mais.',
  is_featured = true
WHERE slug = 'gopro-max-360';

UPDATE public.products SET
  main_image_url = 'https://static.gopro.com/assets/blta2b8522e5372af40/bltf7e22a597a252d55/66c37de777be397340ea8ded/04-3-clp-featured-H13CE-1920-1280-png.png?width=1200&quality=80&auto=webp&disable=upscale',
  short_description = 'HERO13 Black, bastão manual com bateria, microfone direcional + iluminação de LED.',
  is_featured = true
WHERE slug = 'gopro-hero13-creator';

-- Insert new GoPro camera products
INSERT INTO public.products (name, slug, brand_id, category_id, short_description, main_image_url, availability_status, is_featured, is_active)
VALUES
  ('GoPro HERO13 Black Ultra Wide Edition', 'gopro-hero13-ultra-wide',
   '8647268c-bb5f-479e-b3e0-60f844204e77', '0880e4dd-5a7e-4811-b54e-b04d29c707b2',
   'Capturas em ponto de vista mais amplas e altas, com campo de visão de 177° em 4K60.',
   'https://static.gopro.com/assets/blta2b8522e5372af40/bltc73f5704a431667e/680fc15ec98d9b28bf3c7288/04-1-clp-featured-H13-ultra-wide-1920-375.png?width=1200&quality=80&auto=webp&disable=upscale',
   'sob_consulta', true, true),

  ('GoPro HERO12 Black', 'gopro-hero12-black',
   '8647268c-bb5f-479e-b3e0-60f844204e77', '0880e4dd-5a7e-4811-b54e-b04d29c707b2',
   'Design icônico para vídeos imersivos com qualidade profissional.',
   'https://static.gopro.com/assets/blta2b8522e5372af40/blt1bdd59b9495922c0/68af01567ff58402be189b08/04-clp-featured-h12-1920-1280.png?width=1200&quality=80&auto=webp&disable=upscale',
   'sob_consulta', false, true),

  ('GoPro LIT HERO', 'gopro-lit-hero',
   '8647268c-bb5f-479e-b3e0-60f844204e77', '0880e4dd-5a7e-4811-b54e-b04d29c707b2',
   'Compacta, com vídeo 4K + câmera lenta e luz integrada.',
   'https://static.gopro.com/assets/blta2b8522e5372af40/bltc446d920def24077/68acb99098564f7d74b48584/01-clp-featured-lit-hero-1920-1280.png?width=1200&quality=80&auto=webp&disable=upscale',
   'sob_consulta', false, true),

  ('GoPro HERO', 'gopro-hero',
   '8647268c-bb5f-479e-b3e0-60f844204e77', '0880e4dd-5a7e-4811-b54e-b04d29c707b2',
   'Pesando apenas 86 gramas, a HERO é a câmera 4K mais compacta da GoPro.',
   'https://static.gopro.com/assets/blta2b8522e5372af40/bltedc5b430b9074d62/68acb99025b61b5634159494/02-clp-featured-hero-1920-1280.png?width=1200&quality=80&auto=webp&disable=upscale',
   'sob_consulta', false, true),

  ('GoPro MAX2', 'gopro-max2',
   '8647268c-bb5f-479e-b3e0-60f844204e77', 'b87bfca2-0909-4865-8f7b-bbbb31bde3c3',
   'Vídeo em True 8K 360, lentes de vidro substituíveis + novas ferramentas de reenquadramento.',
   'https://static.gopro.com/assets/blta2b8522e5372af40/bltaeae537654e9222c/68acb984d7406209f316e33b/01-clp-featured-max2-1920-1280.png?width=1200&quality=80&auto=webp&disable=upscale',
   'sob_consulta', true, true),

  ('GoPro MISSION 1', 'gopro-mission-1',
   '8647268c-bb5f-479e-b3e0-60f844204e77', 'bbb71355-f9df-4d78-a013-af638370a6ce',
   'Câmera cinematográfica compacta com lente GoPro fixa de 14 mm para criadores profissionais.',
   'https://static.gopro.com/assets/blta2b8522e5372af40/bltdddaeef7772964b1/69ea2dda8ed95aa621264d55/01-clp-mission1---md-lg-xl.png?width=1200&quality=80&auto=webp&disable=upscale',
   'sob_consulta', true, true),

  ('GoPro MISSION 1 PRO', 'gopro-mission-1-pro',
   '8647268c-bb5f-479e-b3e0-60f844204e77', 'bbb71355-f9df-4d78-a013-af638370a6ce',
   'Recursos avançados com lente GoPro fixa de 14 mm para captura de nível profissional.',
   'https://static.gopro.com/assets/blta2b8522e5372af40/blt46ca51b217cf036c/69ea2a5f7425f22b1b76867c/02-clp-mission1-pro---md-lg-xl.png?width=1200&quality=80&auto=webp&disable=upscale',
   'sob_consulta', false, true),

  ('GoPro MISSION 1 PRO ILS', 'gopro-mission-1-pro-ils',
   '8647268c-bb5f-479e-b3e0-60f844204e77', 'bbb71355-f9df-4d78-a013-af638370a6ce',
   'Versão especializada compatível com lentes intercambiáveis Micro Four Thirds (MFT).',
   'https://static.gopro.com/assets/blta2b8522e5372af40/blt87a4a3ddc0e8950f/69ea2fbe9621a9d0152140bb/03-clp-mission1-pro-ils---md-lg-xl.png?width=1200&quality=80&auto=webp&disable=upscale',
   'sob_consulta', false, true);
