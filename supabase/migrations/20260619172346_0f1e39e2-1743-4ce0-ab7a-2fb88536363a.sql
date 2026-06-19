ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS card_image_url TEXT NULL;
GRANT SELECT, INSERT, UPDATE ON public.brands TO authenticated;
GRANT ALL ON public.brands TO service_role;