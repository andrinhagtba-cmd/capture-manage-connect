import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const AVAIL_OPTIONS = [
  "disponivel",
  "sob_consulta",
  "encomenda",
  "indisponivel",
] as const;

export type AdminBrand = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  sort_order: number;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  brand_id: string | null;
  parent_category_id: string | null;
  is_active: boolean;
  sort_order: number;
};

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  brand_id: string | null;
  category_id: string | null;
  model: string | null;
  sku: string | null;
  short_description: string | null;
  full_description: string | null;
  main_image_url: string | null;
  gallery_json: unknown;
  video_url: string | null;
  thumbnail_url: string | null;
  specifications_json: unknown;
  use_cases_json: unknown;
  tags_json: unknown;
  official_product_url: string | null;
  availability_status: string;
  internal_price: number | null;
  internal_notes: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_image_url: string | null;
  order_index: number | null;
  is_featured: boolean;
  is_active: boolean;
};

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function asArray(v: unknown): any[] {
  return Array.isArray(v) ? v : [];
}

export function useAdminBrands() {
  return useQuery({
    queryKey: ["admin-brands"],
    queryFn: async (): Promise<AdminBrand[]> => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as AdminBrand[];
    },
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: async (): Promise<AdminCategory[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as AdminCategory[];
    },
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: async (): Promise<AdminProduct[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("order_index")
        .order("name");
      if (error) throw error;
      return data as unknown as AdminProduct[];
    },
  });
}

export function useRelatedProducts(productId: string | null) {
  return useQuery({
    queryKey: ["product-related", productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_related")
        .select("*")
        .eq("product_id", productId as string)
        .order("order_index");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export async function saveProductRelations(
  productId: string,
  related: { related_product_id: string; relation_type: string }[],
) {
  await supabase.from("product_related").delete().eq("product_id", productId);
  if (related.length) {
    await supabase.from("product_related").insert(
      related.map((r, i) => ({
        product_id: productId,
        related_product_id: r.related_product_id,
        relation_type: r.relation_type || "related",
        order_index: i,
      })),
    );
  }
}

export async function uploadToMedia(file: File, folder = "produtos") {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

// Robust CSV parser that supports quoted fields with commas/newlines.
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((v) => v.trim() !== "")) rows.push(row);
  }
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (cells[i] ?? "").trim();
    });
    return obj;
  });
}

export const CSV_COLUMNS = [
  "name",
  "slug",
  "brand_slug",
  "category_slug",
  "model",
  "sku",
  "short_description",
  "full_description",
  "main_image_url",
  "gallery_urls",
  "video_url",
  "availability_status",
  "is_featured",
  "is_active",
  "tags",
  "use_cases",
  "specifications_json",
  "official_product_url",
];
