import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Brand = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  theme_primary_color: string | null;
  official_site_url: string | null;
  sort_order: number;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  brand_id: string | null;
  parent_category_id: string | null;
  sort_order: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  brand_id: string | null;
  category_id: string | null;
  short_description: string | null;
  full_description: string | null;
  main_image_url: string | null;
  video_url: string | null;
  gallery_json: unknown;
  specifications_json: unknown;
  use_cases_json: unknown;
  tags_json: unknown;
  model: string | null;
  sku: string | null;
  official_product_url: string | null;
  availability_status: string;
  is_featured: boolean;
  is_active: boolean;
};

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async (): Promise<Brand[]> => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as Brand[];
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useProducts(opts?: {
  brandSlug?: string;
  featured?: boolean;
}) {
  return useQuery({
    queryKey: ["products", opts?.brandSlug ?? null, opts?.featured ?? null],
    queryFn: async (): Promise<Product[]> => {
      let query = supabase
        .from("products")
        .select("*, brands!inner(slug)")
        .eq("is_active", true);
      if (opts?.featured) query = query.eq("is_featured", true);
      if (opts?.brandSlug)
        query = query.eq("brands.slug", opts.brandSlug);
      const { data, error } = await query.order("name");
      if (error) throw error;
      return data as unknown as Product[];
    },
  });
}

export function useCategoryProducts(categorySlug: string) {
  return useQuery({
    queryKey: ["category-products", categorySlug],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories!inner(slug)")
        .eq("is_active", true)
        .eq("categories.slug", categorySlug)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Product[];
    },
  });
}

export function useCategoriesProducts(categorySlugs: string[]) {
  return useQuery({
    queryKey: ["categories-products", ...categorySlugs],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories!inner(slug)")
        .eq("is_active", true)
        .in("categories.slug", categorySlugs)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Product[];
    },
  });
}

/** Fetch active products by a list of ids, preserving the given order. */
export function useProductsByIds(ids: string[]) {
  return useQuery({
    queryKey: ["products-by-ids", ...ids],
    enabled: ids.length > 0,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .in("id", ids);
      if (error) throw error;
      const rows = (data ?? []) as unknown as Product[];
      // preserve the order defined by `ids`
      return ids
        .map((id) => rows.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p));
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
  });
}
