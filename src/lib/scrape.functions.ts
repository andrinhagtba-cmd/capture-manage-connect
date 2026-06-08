import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ScrapedSpec = { name: string; value: string };

export type ScrapedProduct = {
  name: string;
  short_description: string | null;
  full_description: string | null;
  price: string | null;
  main_image_url: string | null;
  gallery: string[];
  product_url: string | null;
  sku: string | null;
  model: string | null;
  specifications: ScrapedSpec[];
};

export type ScrapeResult = {
  ok: boolean;
  error?: string;
  source_url: string;
  products: ScrapedProduct[];
};

const PRODUCT_SCHEMA = {
  type: "object",
  properties: {
    products: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome do produto" },
          short_description: {
            type: "string",
            description: "Descrição curta de uma linha",
          },
          full_description: {
            type: "string",
            description: "Descrição completa do produto",
          },
          price: { type: "string", description: "Preço exibido, se houver" },
          main_image_url: {
            type: "string",
            description: "URL absoluta da imagem principal do produto",
          },
          gallery: {
            type: "array",
            items: { type: "string" },
            description: "URLs absolutas de imagens adicionais",
          },
          product_url: {
            type: "string",
            description: "URL absoluta da página do produto",
          },
          sku: { type: "string" },
          model: { type: "string" },
          specifications: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                value: { type: "string" },
              },
            },
          },
        },
        required: ["name"],
      },
    },
  },
  required: ["products"],
};

function toArray(v: unknown): any[] {
  return Array.isArray(v) ? v : [];
}

function clean(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

function normalizeProduct(raw: any): ScrapedProduct | null {
  const name = clean(raw?.name);
  if (!name) return null;
  return {
    name,
    short_description: clean(raw?.short_description),
    full_description: clean(raw?.full_description),
    price: clean(raw?.price),
    main_image_url: clean(raw?.main_image_url),
    gallery: toArray(raw?.gallery)
      .map((g) => clean(g))
      .filter((g): g is string => Boolean(g)),
    product_url: clean(raw?.product_url),
    sku: clean(raw?.sku),
    model: clean(raw?.model),
    specifications: toArray(raw?.specifications)
      .map((s) => ({ name: clean(s?.name) ?? "", value: clean(s?.value) ?? "" }))
      .filter((s) => s.name && s.value),
  };
}

export const scrapeProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { url: string }) => {
    const url = (data?.url ?? "").trim();
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error("URL inválida.");
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("A URL precisa começar com http:// ou https://");
    }
    return { url };
  })
  .handler(async ({ data }): Promise<ScrapeResult> => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        error: "Serviço de scraping não configurado.",
        source_url: data.url,
        products: [],
      };
    }

    try {
      const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url: data.url,
          onlyMainContent: true,
          formats: [
            {
              type: "json",
              schema: PRODUCT_SCHEMA,
              prompt:
                "Extraia todos os produtos visíveis nesta página. Pode ser a página de um único produto ou uma lista/categoria com vários produtos. Para cada produto inclua nome, descrições, preço, URL absoluta da imagem principal, imagens adicionais, link do produto, SKU, modelo e especificações técnicas quando disponíveis. Use sempre URLs absolutas para imagens e links.",
            },
          ],
        }),
      });

      if (res.status === 402) {
        return {
          ok: false,
          error:
            "Créditos do serviço de scraping esgotados. Recarregue para continuar.",
          source_url: data.url,
          products: [],
        };
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[scrapeProducts] Firecrawl error", res.status, text);
        return {
          ok: false,
          error: `Falha ao acessar a página (HTTP ${res.status}).`,
          source_url: data.url,
          products: [],
        };
      }

      const payload = await res.json();
      const json = payload?.data?.json ?? payload?.json ?? {};
      const products = toArray(json?.products)
        .map(normalizeProduct)
        .filter((p): p is ScrapedProduct => Boolean(p));

      if (!products.length) {
        return {
          ok: false,
          error: "Nenhum produto encontrado nesta página.",
          source_url: data.url,
          products: [],
        };
      }

      return { ok: true, source_url: data.url, products };
    } catch (e: any) {
      console.error("[scrapeProducts] error", e);
      return {
        ok: false,
        error: "Erro inesperado ao fazer o scraping da página.",
        source_url: data.url,
        products: [],
      };
    }
  });
