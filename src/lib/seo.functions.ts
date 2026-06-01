import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  DEFAULT_PRODUCT_DESCRIPTION,
  DEFAULT_SITE_NAME,
  DEFAULT_SITE_URL,
  firstArrayUrl,
  toAbsoluteUrl,
  type ResolvedSeo,
} from "@/lib/seo-meta";

/**
 * Build the canonical SEO/OG payload for a product slug. Runs server-side so
 * the meta tags are present in the initial HTML for social crawlers.
 */
export const getProductSeo = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }): Promise<ResolvedSeo | null> => {
   try {
    const { data: product } = await supabaseAdmin
      .from("products")
      .select(
        "id, name, slug, short_description, main_image_url, gallery_json, seo_title, seo_description, seo_image_url, og_title, og_description, og_image_url, canonical_url, use_main_image_as_og, brand_id",
      )
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();

    if (!product) return null;

    const { data: settings } = await supabaseAdmin
      .from("company_settings")
      .select(
        "public_site_url, site_name, company_name, default_og_image_url, default_product_image_url, default_brand_image_url, default_twitter_card",
      )
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let brand:
      | { name: string; hero_image_url: string | null; logo_url: string | null }
      | null = null;
    if (product.brand_id) {
      const { data: b } = await supabaseAdmin
        .from("brands")
        .select("name, hero_image_url, logo_url")
        .eq("id", product.brand_id)
        .maybeSingle();
      brand = b ?? null;
    }

    const siteUrl = settings?.public_site_url?.trim() || DEFAULT_SITE_URL;
    const siteName =
      settings?.site_name?.trim() ||
      settings?.company_name?.trim() ||
      DEFAULT_SITE_NAME;

    const title =
      product.seo_title?.trim() ||
      product.og_title?.trim() ||
      `${product.name}${brand?.name ? ` ${brand.name}` : ""} | ${siteName}`;

    const description =
      product.seo_description?.trim() ||
      product.og_description?.trim() ||
      product.short_description?.trim() ||
      DEFAULT_PRODUCT_DESCRIPTION;

    const rawImage =
      product.og_image_url?.trim() ||
      product.seo_image_url?.trim() ||
      (product.use_main_image_as_og ? product.main_image_url?.trim() : null) ||
      product.main_image_url?.trim() ||
      firstArrayUrl(product.gallery_json) ||
      brand?.hero_image_url?.trim() ||
      brand?.logo_url?.trim() ||
      settings?.default_product_image_url?.trim() ||
      settings?.default_brand_image_url?.trim() ||
      settings?.default_og_image_url?.trim() ||
      null;

    const image = toAbsoluteUrl(rawImage, siteUrl);

    const url =
      product.canonical_url?.trim() ||
      `${siteUrl.replace(/\/+$/, "")}/produto/${product.slug}`;

    return {
      title,
      description,
      image,
      imageWidth: 0,
      imageHeight: 0,
      url,
      type: "product",
      siteName,
      twitterCard:
        settings?.default_twitter_card?.trim() || "summary_large_image",
      brandName: brand?.name ?? null,
    };
   } catch (error) {
     console.error("[getProductSeo] failed, falling back to default head", error);
     return null;
   }
  });

async function loadSiteSettings() {
  const { data } = await supabaseAdmin
    .from("company_settings")
    .select(
      "public_site_url, site_name, company_name, short_description, default_og_title, default_og_description, default_og_image_url, default_brand_image_url, default_twitter_card",
    )
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

/** SEO/OG payload for a brand landing page. */
export const getBrandSeo = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }): Promise<ResolvedSeo | null> => {
   try {
    const { data: brand } = await supabaseAdmin
      .from("brands")
      .select("name, slug, description, hero_image_url, logo_url")
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!brand) return null;

    const settings = await loadSiteSettings();
    const siteUrl = settings?.public_site_url?.trim() || DEFAULT_SITE_URL;
    const siteName =
      settings?.site_name?.trim() ||
      settings?.company_name?.trim() ||
      DEFAULT_SITE_NAME;

    const title = `${brand.name} | ${siteName}`;
    const description =
      brand.description?.trim() ||
      `Linha ${brand.name} oficial na ${siteName}. Câmeras, lentes e acessórios com orçamento personalizado.`;
    const rawImage =
      brand.hero_image_url?.trim() ||
      brand.logo_url?.trim() ||
      settings?.default_brand_image_url?.trim() ||
      settings?.default_og_image_url?.trim() ||
      null;

    return {
      title,
      description,
      image: toAbsoluteUrl(rawImage, siteUrl),
      imageWidth: 1200,
      imageHeight: 630,
      url: `${siteUrl.replace(/\/+$/, "")}/marca/${brand.slug}`,
      type: "website",
      siteName,
      twitterCard:
        settings?.default_twitter_card?.trim() || "summary_large_image",
      brandName: brand.name,
    };
   } catch (error) {
     console.error("[getBrandSeo] failed, falling back to default head", error);
     return null;
   }
  });

/** SEO/OG payload for a static site page (home/sobre/contato/etc.). */
export const getSiteSeo = createServerFn({ method: "GET" })
  .inputValidator(
    (data: { path: string; title?: string; description?: string }) => data,
  )
  .handler(async ({ data }): Promise<ResolvedSeo> => {
    const settings = await loadSiteSettings();
    const siteUrl = settings?.public_site_url?.trim() || DEFAULT_SITE_URL;
    const siteName =
      settings?.site_name?.trim() ||
      settings?.company_name?.trim() ||
      DEFAULT_SITE_NAME;

    const title =
      data.title ||
      settings?.default_og_title?.trim() ||
      `${siteName} — Equipamentos profissionais de foto e vídeo`;
    const description =
      data.description ||
      settings?.default_og_description?.trim() ||
      settings?.short_description?.trim() ||
      "NL Foto e Vídeo é referência quando o assunto é Foto e Vídeo profissional.";
    const rawImage = settings?.default_og_image_url?.trim() || null;
    const cleanPath = data.path === "/" ? "" : data.path;

    return {
      title,
      description,
      image: toAbsoluteUrl(rawImage, siteUrl),
      imageWidth: 1200,
      imageHeight: 630,
      url: `${siteUrl.replace(/\/+$/, "")}${cleanPath}`,
      type: "website",
      siteName,
      twitterCard:
        settings?.default_twitter_card?.trim() || "summary_large_image",
      brandName: null,
    };
  });

