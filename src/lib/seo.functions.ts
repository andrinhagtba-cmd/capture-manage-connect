import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DEFAULT_SITE_URL = "https://capture-manage-connect.lovable.app";
const DEFAULT_SITE_NAME = "NL Foto e Vídeo";
const DEFAULT_DESCRIPTION =
  "Produto com procedência, garantia e atendimento especializado na NL Foto e Vídeo.";

export type ResolvedSeo = {
  title: string;
  description: string;
  image: string | null;
  imageWidth: number;
  imageHeight: number;
  url: string;
  type: string;
  siteName: string;
  twitterCard: string;
  brandName: string | null;
};

function firstArrayUrl(v: unknown): string | null {
  if (!Array.isArray(v)) return null;
  for (const item of v) {
    if (typeof item === "string" && item.trim()) return item;
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const url = (o.url ?? o.src ?? o.image_url ?? o.file_url) as
        | string
        | undefined;
      if (typeof url === "string" && url.trim()) return url;
    }
  }
  return null;
}

/** Convert a relative path to an absolute https URL using the public site URL. */
export function toAbsoluteUrl(
  value: string | null | undefined,
  base: string,
): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v.replace(/^http:\/\//i, "https://");
  const cleanBase = base.replace(/\/+$/, "");
  const path = v.startsWith("/") ? v : `/${v}`;
  return `${cleanBase}${path}`;
}

/**
 * Build the canonical SEO/OG payload for a product slug. Runs server-side so
 * the meta tags are present in the initial HTML for social crawlers.
 */
export const getProductSeo = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }): Promise<ResolvedSeo | null> => {
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

    let brand: { name: string; hero_image_url: string | null; logo_url: string | null } | null =
      null;
    if (product.brand_id) {
      const { data: b } = await supabaseAdmin
        .from("brands")
        .select("name, hero_image_url, logo_url")
        .eq("id", product.brand_id)
        .maybeSingle();
      brand = b ?? null;
    }

    const siteUrl =
      settings?.public_site_url?.trim() || DEFAULT_SITE_URL;
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
      DEFAULT_DESCRIPTION;

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
      imageWidth: 1200,
      imageHeight: 630,
      url,
      type: "product",
      siteName,
      twitterCard: settings?.default_twitter_card?.trim() || "summary_large_image",
      brandName: brand?.name ?? null,
    };
  });
