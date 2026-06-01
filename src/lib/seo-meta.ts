/** Client-safe SEO helpers shared between server functions and route head(). */

export const DEFAULT_SITE_URL = "https://capture-manage-connect.lovable.app";
export const DEFAULT_SITE_NAME = "NL Foto e Vídeo";
export const DEFAULT_PRODUCT_DESCRIPTION =
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

export function firstArrayUrl(v: unknown): string | null {
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
  const cleanBase = (base || DEFAULT_SITE_URL).replace(/\/+$/, "");
  const path = v.startsWith("/") ? v : `/${v}`;
  return `${cleanBase}${path}`;
}

/** Build a full set of meta + link tags for the route head() from a resolved SEO payload. */
export function buildSeoHead(seo: ResolvedSeo) {
  const meta: Array<Record<string, string>> = [
    { title: seo.title },
    { name: "description", content: seo.description },
    { property: "og:title", content: seo.title },
    { property: "og:description", content: seo.description },
    { property: "og:url", content: seo.url },
    { property: "og:type", content: seo.type },
    { property: "og:site_name", content: seo.siteName },
    { name: "twitter:card", content: seo.twitterCard },
    { name: "twitter:title", content: seo.title },
    { name: "twitter:description", content: seo.description },
  ];

  if (seo.image) {
    meta.push(
      { property: "og:image", content: seo.image },
      { property: "og:image:secure_url", content: seo.image },
      { property: "og:image:alt", content: seo.title },
      { name: "twitter:image", content: seo.image },
    );
    // Only declare explicit dimensions when they are real (> 0). Sending
    // fixed 1200x630 for square/portrait product photos makes WhatsApp and
    // Facebook drop the preview image because the declared size doesn't match
    // the actual file. Omitting them lets the crawler read the real size.
    if (seo.imageWidth > 0 && seo.imageHeight > 0) {
      meta.push(
        { property: "og:image:width", content: String(seo.imageWidth) },
        { property: "og:image:height", content: String(seo.imageHeight) },
      );
    }
  }

  return {
    meta,
    links: [{ rel: "canonical", href: seo.url }],
  };
}
