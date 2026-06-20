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

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 58000);

    try {
      const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url: data.url,
          onlyMainContent: true,
          waitFor: 2500,
          timeout: 50000,
          proxy: "auto",
          formats: [
            {
              type: "json",
              schema: PRODUCT_SCHEMA,
              prompt:
                "Extraia todos os produtos visíveis nesta página. Pode ser a página de um único produto ou uma lista/categoria com vários produtos. Para cada produto inclua nome, descrições, preço, URL absoluta da imagem principal, imagens adicionais, SKU, modelo e especificações técnicas quando disponíveis. NÃO inclua o link/URL da página do produto. Use sempre URLs absolutas para imagens.",
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
          error:
            res.status === 408
              ? "A página demorou demais para responder (timeout). Ela pode ter proteção contra robôs. Tente novamente em alguns segundos."
              : `Falha ao acessar a página (HTTP ${res.status}).`,
          source_url: data.url,
          products: [],
        };
      }

      const payload = await res.json();
      const status = payload?.data?.metadata?.statusCode;
      if (status && status >= 400) {
        return {
          ok: false,
          error:
            status === 404
              ? "Página não encontrada (404). Esse link não existe no site. Use o link completo da página de um produto específico (ex.: .../produto/modelo), não o de uma categoria geral."
              : `A página retornou um erro (HTTP ${status}). Verifique o link.`,
          source_url: data.url,
          products: [],
        };
      }

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
      const aborted = e?.name === "AbortError";
      console.error("[scrapeProducts] error", e);
      return {
        ok: false,
        error: aborted
          ? "A página demorou demais para responder. Tente novamente ou use um link mais específico."
          : "Erro inesperado ao fazer o scraping da página.",
        source_url: data.url,
        products: [],
      };
    } finally {
      clearTimeout(timer);
    }
  });

// ===========================================================================
// Modo assíncrono (para páginas grandes / categorias com muitos produtos).
// startScrape inicia o trabalho no Firecrawl e devolve um jobId.
// getScrapeStatus consulta o progresso até "completed". Assim cada requisição
// é curta e não estoura o tempo limite do servidor.
// ===========================================================================

export type StartScrapeResult = {
  ok: boolean;
  error?: string;
  jobId?: string;
};

export type ScrapeStatusResult = {
  ok: boolean;
  error?: string;
  status: "processing" | "completed" | "failed";
  products: ScrapedProduct[];
};

const EXTRACT_PROMPT =
  "Extraia TODOS os produtos listados nesta página, sem exceção e SEM LIMITE de quantidade. NÃO pare em 10 itens: percorra a grade/lista inteira do início ao fim e devolva todos os produtos encontrados (podem ser 20, 30, 50 ou mais). Pode ser a página de um único produto ou uma lista/categoria com vários produtos. Para cada produto inclua nome, descrições, preço, URL absoluta da imagem principal, imagens adicionais, link do produto, SKU, modelo e especificações técnicas quando disponíveis. Use sempre URLs absolutas para imagens e links.";

export const startScrape = createServerFn({ method: "POST" })
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
  .handler(async ({ data }): Promise<StartScrapeResult> => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return { ok: false, error: "Serviço de scraping não configurado." };
    }

    try {
      const res = await fetch("https://api.firecrawl.dev/v2/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          urls: [data.url],
          schema: PRODUCT_SCHEMA,
          prompt: EXTRACT_PROMPT,
          scrapeOptions: { onlyMainContent: true, waitFor: 2500, proxy: "auto" },
        }),
      });

      if (res.status === 402) {
        return {
          ok: false,
          error:
            "Créditos do serviço de scraping esgotados. Recarregue para continuar.",
        };
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[startScrape] Firecrawl error", res.status, text);
        return {
          ok: false,
          error: `Falha ao iniciar a leitura da página (HTTP ${res.status}).`,
        };
      }

      const payload = await res.json();
      const jobId = payload?.id ?? payload?.data?.id;
      if (!jobId) {
        return {
          ok: false,
          error: "Não foi possível iniciar a leitura da página.",
        };
      }
      return { ok: true, jobId: String(jobId) };
    } catch (e: any) {
      console.error("[startScrape] error", e);
      return { ok: false, error: "Erro inesperado ao iniciar o scraping." };
    }
  });

export const getScrapeStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { jobId: string }) => {
    const jobId = (data?.jobId ?? "").trim();
    if (!jobId) throw new Error("jobId obrigatório.");
    return { jobId };
  })
  .handler(async ({ data }): Promise<ScrapeStatusResult> => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        error: "Serviço de scraping não configurado.",
        status: "failed",
        products: [],
      };
    }

    try {
      const res = await fetch(
        `https://api.firecrawl.dev/v2/extract/${encodeURIComponent(data.jobId)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[getScrapeStatus] Firecrawl error", res.status, text);
        return {
          ok: false,
          error: `Falha ao consultar o progresso (HTTP ${res.status}).`,
          status: "failed",
          products: [],
        };
      }

      const payload = await res.json();
      const rawStatus = String(payload?.status ?? "").toLowerCase();

      if (rawStatus === "failed" || rawStatus === "cancelled") {
        return {
          ok: false,
          error: "A leitura da página falhou. Tente novamente.",
          status: "failed",
          products: [],
        };
      }

      if (rawStatus !== "completed") {
        return { ok: true, status: "processing", products: [] };
      }

      const json = payload?.data ?? {};
      const products = toArray(json?.products)
        .map(normalizeProduct)
        .filter((p): p is ScrapedProduct => Boolean(p));

      return { ok: true, status: "completed", products };
    } catch (e: any) {
      console.error("[getScrapeStatus] error", e);
      return {
        ok: false,
        error: "Erro inesperado ao consultar o progresso.",
        status: "failed",
        products: [],
      };
    }
  });
