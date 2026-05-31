-- Media library table
CREATE TABLE public.media_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_url text NOT NULL,
  file_path text,
  file_name text NOT NULL,
  mime_type text,
  media_type text NOT NULL DEFAULT 'image',
  folder text DEFAULT 'geral',
  alt_text text,
  description text,
  width integer,
  height integer,
  size_bytes bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.media_assets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view media assets"
ON public.media_assets FOR SELECT
USING (true);

CREATE POLICY "Staff manage media assets"
ON public.media_assets FOR ALL
TO authenticated
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));

CREATE TRIGGER set_media_assets_updated_at
BEFORE UPDATE ON public.media_assets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for site media (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read media bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

CREATE POLICY "Staff upload media bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media' AND is_staff(auth.uid()));

CREATE POLICY "Staff update media bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media' AND is_staff(auth.uid()));

CREATE POLICY "Staff delete media bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND is_staff(auth.uid()));