import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  COMPANY_NAME,
  COMPANY_TAGLINE,
  WHATSAPP_NUMBER,
  WHATSAPP_DISPLAY,
  INSTAGRAM_URL,
  ADDRESS,
} from "@/lib/site";

export type CompanySettings = {
  id: string;
  company_name: string | null;
  slogan: string | null;
  short_description: string | null;
  full_description: string | null;
  history_text: string | null;
  cnpj: string | null;
  address: string | null;
  store_location: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  opening_hours: string | null;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  google_maps_embed: string | null;
  directions_url: string | null;
  warranty_text: string | null;
  provenance_text: string | null;
  testing_text: string | null;
  logo_url: string | null;
  logo_light_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  public_site_url: string | null;
  site_name: string | null;
  default_og_title: string | null;
  default_og_description: string | null;
  default_og_image_url: string | null;
  default_brand_image_url: string | null;
  default_product_image_url: string | null;
  default_twitter_card: string | null;
  updated_at: string;
};

export type FooterSettings = {
  id: string;
  logo_url: string | null;
  description: string | null;
  show_company_address: boolean;
  show_opening_hours: boolean;
  show_whatsapp: boolean;
  show_email: boolean;
  show_social_links: boolean;
  copyright_text: string | null;
  warranty_badge_text: string | null;
  provenance_badge_text: string | null;
  settings_json: Record<string, unknown>;
  updated_at: string;
};

export type FooterLinkGroup = {
  id: string;
  title: string;
  order_index: number;
  is_active: boolean;
};

export type FooterLink = {
  id: string;
  group_id: string | null;
  label: string;
  url: string;
  order_index: number;
  is_active: boolean;
};

export type NavigationItem = {
  id: string;
  label: string;
  url: string;
  parent_id: string | null;
  menu_area: string;
  order_index: number;
  opens_new_tab: boolean;
  is_active: boolean;
};

/** Fallback used when DB has no row yet, so the site never looks empty. */
export const COMPANY_FALLBACK = {
  company_name: COMPANY_NAME,
  short_description: COMPANY_TAGLINE,
  address: ADDRESS,
  opening_hours: "Terça a Domingo, das 09h às 18h",
  whatsapp: WHATSAPP_NUMBER,
  phone: WHATSAPP_DISPLAY,
  instagram_url: INSTAGRAM_URL,
};

export function useCompanySettings() {
  return useQuery({
    queryKey: ["company_settings"],
    queryFn: async (): Promise<CompanySettings | null> => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as CompanySettings | null;
    },
  });
}

export function useFooterSettings() {
  return useQuery({
    queryKey: ["footer_settings"],
    queryFn: async (): Promise<FooterSettings | null> => {
      const { data, error } = await supabase
        .from("footer_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as FooterSettings | null;
    },
  });
}

export function useFooterGroups() {
  return useQuery({
    queryKey: ["footer_link_groups"],
    queryFn: async (): Promise<FooterLinkGroup[]> => {
      const { data, error } = await supabase
        .from("footer_link_groups")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return data as FooterLinkGroup[];
    },
  });
}

export function useFooterLinks() {
  return useQuery({
    queryKey: ["footer_links"],
    queryFn: async (): Promise<FooterLink[]> => {
      const { data, error } = await supabase
        .from("footer_links")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return data as FooterLink[];
    },
  });
}

export function useNavigationItems(area = "header") {
  return useQuery({
    queryKey: ["navigation_items", area],
    queryFn: async (): Promise<NavigationItem[]> => {
      const { data, error } = await supabase
        .from("navigation_items")
        .select("*")
        .eq("menu_area", area)
        .order("order_index");
      if (error) throw error;
      return data as NavigationItem[];
    },
  });
}

/** Build a wa.me URL from a phone string that may contain formatting. */
export function buildWhatsappUrl(phone: string | null | undefined, message?: string) {
  const number = (phone || WHATSAPP_NUMBER).replace(/\D/g, "");
  const base = `https://wa.me/${number}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

/** Derive an "@handle" from a social URL (instagram/tiktok/etc.). */
export function handleFromUrl(url: string | null | undefined): string {
  if (!url) return "";
  try {
    const path = new URL(url).pathname.replace(/\/+$/, "");
    const seg = path.split("/").filter(Boolean).pop() ?? "";
    const clean = seg.replace(/^@/, "");
    return clean ? `@${clean}` : "";
  } catch {
    const seg = url.replace(/\/+$/, "").split("/").filter(Boolean).pop() ?? "";
    const clean = seg.replace(/^@/, "");
    return clean ? `@${clean}` : "";
  }
}

/** Format a digits-only phone (BR) into a readable display string. */
function formatPhoneDisplay(raw: string): string {
  const d = raw.replace(/\D/g, "").replace(/^55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length === 9) return `${d.slice(0, 5)}-${d.slice(5)}`;
  if (d.length === 8) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return raw;
}

export type ResolvedCompany = {
  name: string;
  tagline: string;
  shortDescription: string;
  fullDescription: string;
  historyText: string;
  cnpj: string;
  address: string;
  storeLocation: string;
  city: string;
  state: string;
  zipCode: string;
  openingHours: string;
  email: string;
  whatsappNumber: string; // digits only
  whatsappDisplay: string; // human readable
  phone: string;
  instagramUrl: string;
  instagramHandle: string;
  facebookUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  googleMapsEmbed: string;
  directionsUrl: string;
  warrantyText: string;
  provenanceText: string;
  testingText: string;
  logoUrl: string | null;
  /** Build a WhatsApp deep link for this company. */
  whatsappLink: (message?: string) => string;
  /** True when backed by a real DB row. */
  loaded: boolean;
  raw: CompanySettings | null;
};

/**
 * Single source of truth for institutional data across the public site.
 * Merges the `company_settings` row with safe fallbacks so the UI never
 * looks empty, and exposes derived helpers (display phone, social handle,
 * WhatsApp link). Always prefer this over hardcoded constants.
 */
export function useCompany(): ResolvedCompany {
  const { data, isLoading } = useCompanySettings();
  const c = data ?? null;

  const whatsappNumber = (c?.whatsapp || COMPANY_FALLBACK.whatsapp).replace(/\D/g, "");
  const whatsappDisplay =
    c?.phone?.trim() ||
    (c?.whatsapp ? formatPhoneDisplay(c.whatsapp) : "") ||
    COMPANY_FALLBACK.phone;
  const instagramUrl = c?.instagram_url || COMPANY_FALLBACK.instagram_url;

  return {
    name: c?.company_name || COMPANY_FALLBACK.company_name,
    tagline: c?.short_description || COMPANY_FALLBACK.short_description,
    shortDescription: c?.short_description || COMPANY_FALLBACK.short_description,
    fullDescription: c?.full_description || "",
    historyText: c?.history_text || "",
    cnpj: c?.cnpj || "",
    address: c?.address || COMPANY_FALLBACK.address,
    storeLocation: c?.store_location || "",
    city: c?.city || "",
    state: c?.state || "",
    zipCode: c?.zip_code || "",
    openingHours: c?.opening_hours || COMPANY_FALLBACK.opening_hours,
    email: c?.email || "",
    whatsappNumber,
    whatsappDisplay,
    phone: c?.phone || "",
    instagramUrl,
    instagramHandle: handleFromUrl(instagramUrl) || "@nlfotoevideo",
    facebookUrl: c?.facebook_url || "",
    tiktokUrl: c?.tiktok_url || "",
    youtubeUrl: c?.youtube_url || "",
    googleMapsEmbed: c?.google_maps_embed || "",
    directionsUrl: c?.directions_url || "",
    warrantyText: c?.warranty_text || "",
    provenanceText: c?.provenance_text || "",
    testingText: c?.testing_text || "",
    logoUrl: c?.logo_url || null,
    whatsappLink: (message?: string) => buildWhatsappUrl(whatsappNumber, message),
    loaded: !isLoading && !!c,
    raw: c,
  };
}


export type MediaAsset = {
  id: string;
  file_url: string;
  file_path: string | null;
  file_name: string;
  mime_type: string | null;
  media_type: string;
  folder: string | null;
  alt_text: string | null;
  description: string | null;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  created_at: string;
  updated_at: string;
};

export function useMediaAssets(folder?: string) {
  return useQuery({
    queryKey: ["media_assets", folder ?? "all"],
    queryFn: async (): Promise<MediaAsset[]> => {
      let q = supabase
        .from("media_assets")
        .select("*")
        .order("created_at", { ascending: false });
      if (folder && folder !== "all") q = q.eq("folder", folder);
      const { data, error } = await q;
      if (error) throw error;
      return data as MediaAsset[];
    },
  });
}

export type HeroBanner = {
  id: string;
  location: string;
  brand_id: string | null;
  eyebrow: string | null;
  title: string | null;
  highlight: string | null;
  subtitle: string | null;
  badge_text: string | null;
  media_type: string;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  video_url: string | null;
  overlay_opacity: number;
  primary_button_label: string | null;
  primary_button_url: string | null;
  secondary_button_label: string | null;
  secondary_button_url: string | null;
  order_index: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type HomeSection = {
  id: string;
  section_key: string;
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
};

/** All hero banners (staff view for admin management). */
export function useHeroBanners(location?: string) {
  return useQuery({
    queryKey: ["hero_banners", location ?? "all"],
    queryFn: async (): Promise<HeroBanner[]> => {
      let q = supabase.from("hero_banners").select("*").order("order_index");
      if (location) q = q.eq("location", location);
      const { data, error } = await q;
      if (error) throw error;
      return data as HeroBanner[];
    },
  });
}

/** First active hero for a given location (public-facing). */
export function useActiveHero(location = "home") {
  return useQuery({
    queryKey: ["hero_banners", "active", location],
    queryFn: async (): Promise<HeroBanner | null> => {
      const { data, error } = await supabase
        .from("hero_banners")
        .select("*")
        .eq("location", location)
        .eq("is_active", true)
        .order("order_index")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as HeroBanner | null;
    },
  });
}

export function useHomeSections() {
  return useQuery({
    queryKey: ["home_sections"],
    queryFn: async (): Promise<HomeSection[]> => {
      const { data, error } = await supabase
        .from("home_sections")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return data as HomeSection[];
    },
  });
}

export type BrandPageSettings = {
  id: string;
  brand_slug: string;
  intro_eyebrow: string | null;
  intro_title: string | null;
  intro_text: string | null;
  primary_button_label: string | null;
  primary_button_url: string | null;
  secondary_button_label: string | null;
  secondary_button_url: string | null;
  show_categories: boolean;
  show_products: boolean;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

/** All brand page settings (for admin management). */
export function useBrandPageSettingsList() {
  return useQuery({
    queryKey: ["brand_page_settings"],
    queryFn: async (): Promise<BrandPageSettings[]> => {
      const { data, error } = await supabase
        .from("brand_page_settings")
        .select("*")
        .order("brand_slug");
      if (error) throw error;
      return data as BrandPageSettings[];
    },
  });
}

/** Single brand page settings by slug (public-facing). */
export function useBrandPageSettings(slug: string) {
  return useQuery({
    queryKey: ["brand_page_settings", slug],
    queryFn: async (): Promise<BrandPageSettings | null> => {
      const { data, error } = await supabase
        .from("brand_page_settings")
        .select("*")
        .eq("brand_slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as BrandPageSettings | null;
    },
  });
}

export type SitePage = {
  id: string;
  page_key: string;
  label: string;
  slug: string | null;
  eyebrow: string | null;
  heading: string | null;
  subheading: string | null;
  body_json: string[];
  meta_title: string | null;
  meta_description: string | null;
  meta_image_url: string | null;
  og_title: string | null;
  og_description: string | null;
  noindex: boolean;
  is_published: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
};

/** All site pages (for admin management). */
export function useSitePages() {
  return useQuery({
    queryKey: ["site_pages"],
    queryFn: async (): Promise<SitePage[]> => {
      const { data, error } = await supabase
        .from("site_pages")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return (data ?? []) as SitePage[];
    },
  });
}

/** Single site page by key (public-facing). */
export function useSitePage(pageKey: string) {
  return useQuery({
    queryKey: ["site_pages", pageKey],
    queryFn: async (): Promise<SitePage | null> => {
      const { data, error } = await supabase
        .from("site_pages")
        .select("*")
        .eq("page_key", pageKey)
        .maybeSingle();
      if (error) throw error;
      return data as SitePage | null;
    },
  });
}
