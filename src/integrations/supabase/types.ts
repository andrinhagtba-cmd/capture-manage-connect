export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          banner_id: string | null
          brand_id: string | null
          browser: string | null
          campaign: string | null
          category_id: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          lead_id: string | null
          medium: string | null
          metadata_json: Json
          os: string | null
          page_title: string | null
          page_url: string | null
          product_id: string | null
          quote_request_id: string | null
          referrer: string | null
          results_count: number | null
          search_term: string | null
          session_id: string | null
          source: string | null
          state: string | null
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          banner_id?: string | null
          brand_id?: string | null
          browser?: string | null
          campaign?: string | null
          category_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name: string
          id?: string
          lead_id?: string | null
          medium?: string | null
          metadata_json?: Json
          os?: string | null
          page_title?: string | null
          page_url?: string | null
          product_id?: string | null
          quote_request_id?: string | null
          referrer?: string | null
          results_count?: number | null
          search_term?: string | null
          session_id?: string | null
          source?: string | null
          state?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          banner_id?: string | null
          brand_id?: string | null
          browser?: string | null
          campaign?: string | null
          category_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          lead_id?: string | null
          medium?: string | null
          metadata_json?: Json
          os?: string | null
          page_title?: string | null
          page_url?: string | null
          product_id?: string | null
          quote_request_id?: string | null
          referrer?: string | null
          results_count?: number | null
          search_term?: string | null
          session_id?: string | null
          source?: string | null
          state?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          brand_id: string | null
          button_label: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          position: number
          subtitle: string | null
          title: string | null
        }
        Insert: {
          brand_id?: string | null
          button_label?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          position?: number
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          brand_id?: string | null
          button_label?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          position?: number
          subtitle?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banners_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_page_settings: {
        Row: {
          brand_slug: string
          created_at: string
          id: string
          intro_eyebrow: string | null
          intro_text: string | null
          intro_title: string | null
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          primary_button_label: string | null
          primary_button_url: string | null
          secondary_button_label: string | null
          secondary_button_url: string | null
          show_categories: boolean
          show_products: boolean
          updated_at: string
        }
        Insert: {
          brand_slug: string
          created_at?: string
          id?: string
          intro_eyebrow?: string | null
          intro_text?: string | null
          intro_title?: string | null
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          primary_button_label?: string | null
          primary_button_url?: string | null
          secondary_button_label?: string | null
          secondary_button_url?: string | null
          show_categories?: boolean
          show_products?: boolean
          updated_at?: string
        }
        Update: {
          brand_slug?: string
          created_at?: string
          id?: string
          intro_eyebrow?: string | null
          intro_text?: string | null
          intro_title?: string | null
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          primary_button_label?: string | null
          primary_button_url?: string | null
          secondary_button_label?: string | null
          secondary_button_url?: string | null
          show_categories?: boolean
          show_products?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          description: string | null
          hero_image_url: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          official_site_url: string | null
          slug: string
          sort_order: number
          theme_primary_color: string | null
          theme_secondary_color: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          hero_image_url?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          official_site_url?: string | null
          slug: string
          sort_order?: number
          theme_primary_color?: string | null
          theme_secondary_color?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          hero_image_url?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          official_site_url?: string | null
          slug?: string
          sort_order?: number
          theme_primary_color?: string | null
          theme_secondary_color?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          brand_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          parent_category_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          parent_category_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          parent_category_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string | null
          city: string | null
          cnpj: string | null
          company_name: string | null
          default_brand_image_url: string | null
          default_og_description: string | null
          default_og_image_url: string | null
          default_og_title: string | null
          default_product_image_url: string | null
          default_twitter_card: string | null
          directions_url: string | null
          email: string | null
          facebook_url: string | null
          favicon_url: string | null
          full_description: string | null
          google_maps_embed: string | null
          history_text: string | null
          id: string
          instagram_url: string | null
          logo_dark_url: string | null
          logo_light_url: string | null
          logo_url: string | null
          opening_hours: string | null
          phone: string | null
          provenance_text: string | null
          public_site_url: string | null
          short_description: string | null
          site_name: string | null
          slogan: string | null
          state: string | null
          store_location: string | null
          testing_text: string | null
          tiktok_url: string | null
          updated_at: string
          warranty_text: string | null
          whatsapp: string | null
          youtube_url: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          default_brand_image_url?: string | null
          default_og_description?: string | null
          default_og_image_url?: string | null
          default_og_title?: string | null
          default_product_image_url?: string | null
          default_twitter_card?: string | null
          directions_url?: string | null
          email?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          full_description?: string | null
          google_maps_embed?: string | null
          history_text?: string | null
          id?: string
          instagram_url?: string | null
          logo_dark_url?: string | null
          logo_light_url?: string | null
          logo_url?: string | null
          opening_hours?: string | null
          phone?: string | null
          provenance_text?: string | null
          public_site_url?: string | null
          short_description?: string | null
          site_name?: string | null
          slogan?: string | null
          state?: string | null
          store_location?: string | null
          testing_text?: string | null
          tiktok_url?: string | null
          updated_at?: string
          warranty_text?: string | null
          whatsapp?: string | null
          youtube_url?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          default_brand_image_url?: string | null
          default_og_description?: string | null
          default_og_image_url?: string | null
          default_og_title?: string | null
          default_product_image_url?: string | null
          default_twitter_card?: string | null
          directions_url?: string | null
          email?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          full_description?: string | null
          google_maps_embed?: string | null
          history_text?: string | null
          id?: string
          instagram_url?: string | null
          logo_dark_url?: string | null
          logo_light_url?: string | null
          logo_url?: string | null
          opening_hours?: string | null
          phone?: string | null
          provenance_text?: string | null
          public_site_url?: string | null
          short_description?: string | null
          site_name?: string | null
          slogan?: string | null
          state?: string | null
          store_location?: string | null
          testing_text?: string | null
          tiktok_url?: string | null
          updated_at?: string
          warranty_text?: string | null
          whatsapp?: string | null
          youtube_url?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      footer_link_groups: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          order_index: number
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          title?: string
        }
        Relationships: []
      }
      footer_links: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          is_active: boolean
          label: string
          order_index: number
          url: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          is_active?: boolean
          label: string
          order_index?: number
          url: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          is_active?: boolean
          label?: string
          order_index?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "footer_links_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "footer_link_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      footer_settings: {
        Row: {
          copyright_text: string | null
          description: string | null
          id: string
          logo_url: string | null
          provenance_badge_text: string | null
          settings_json: Json
          show_company_address: boolean
          show_email: boolean
          show_opening_hours: boolean
          show_social_links: boolean
          show_whatsapp: boolean
          updated_at: string
          warranty_badge_text: string | null
        }
        Insert: {
          copyright_text?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          provenance_badge_text?: string | null
          settings_json?: Json
          show_company_address?: boolean
          show_email?: boolean
          show_opening_hours?: boolean
          show_social_links?: boolean
          show_whatsapp?: boolean
          updated_at?: string
          warranty_badge_text?: string | null
        }
        Update: {
          copyright_text?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          provenance_badge_text?: string | null
          settings_json?: Json
          show_company_address?: boolean
          show_email?: boolean
          show_opening_hours?: boolean
          show_social_links?: boolean
          show_whatsapp?: boolean
          updated_at?: string
          warranty_badge_text?: string | null
        }
        Relationships: []
      }
      hero_banners: {
        Row: {
          badge_text: string | null
          brand_id: string | null
          created_at: string
          desktop_image_url: string | null
          ends_at: string | null
          eyebrow: string | null
          highlight: string | null
          id: string
          is_active: boolean
          location: string
          media_type: string
          mobile_image_url: string | null
          order_index: number
          overlay_opacity: number
          primary_button_label: string | null
          primary_button_url: string | null
          secondary_button_label: string | null
          secondary_button_url: string | null
          starts_at: string | null
          subtitle: string | null
          title: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          badge_text?: string | null
          brand_id?: string | null
          created_at?: string
          desktop_image_url?: string | null
          ends_at?: string | null
          eyebrow?: string | null
          highlight?: string | null
          id?: string
          is_active?: boolean
          location?: string
          media_type?: string
          mobile_image_url?: string | null
          order_index?: number
          overlay_opacity?: number
          primary_button_label?: string | null
          primary_button_url?: string | null
          secondary_button_label?: string | null
          secondary_button_url?: string | null
          starts_at?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          badge_text?: string | null
          brand_id?: string | null
          created_at?: string
          desktop_image_url?: string | null
          ends_at?: string | null
          eyebrow?: string | null
          highlight?: string | null
          id?: string
          is_active?: boolean
          location?: string
          media_type?: string
          mobile_image_url?: string | null
          order_index?: number
          overlay_opacity?: number
          primary_button_label?: string | null
          primary_button_url?: string | null
          secondary_button_label?: string | null
          secondary_button_url?: string | null
          starts_at?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      home_sections: {
        Row: {
          created_at: string
          eyebrow: string | null
          id: string
          is_active: boolean
          order_index: number
          section_key: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          eyebrow?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          section_key: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          eyebrow?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          section_key?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      import_batches: {
        Row: {
          created_at: string
          failed_rows: number
          file_url: string | null
          id: string
          imported_rows: number
          report_json: Json
          source_name: string | null
          status: string
          total_rows: number
        }
        Insert: {
          created_at?: string
          failed_rows?: number
          file_url?: string | null
          id?: string
          imported_rows?: number
          report_json?: Json
          source_name?: string | null
          status?: string
          total_rows?: number
        }
        Update: {
          created_at?: string
          failed_rows?: number
          file_url?: string | null
          id?: string
          imported_rows?: number
          report_json?: Json
          source_name?: string | null
          status?: string
          total_rows?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          interest_brand: string | null
          interest_category: string | null
          message: string | null
          name: string
          phone: string | null
          source: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          interest_brand?: string | null
          interest_category?: string | null
          message?: string | null
          name: string
          phone?: string | null
          source?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          interest_brand?: string | null
          interest_category?: string | null
          message?: string | null
          name?: string
          phone?: string | null
          source?: string | null
          status?: string
        }
        Relationships: []
      }
      marketing_event_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_name: string
          id: string
          payload_json: Json
          provider: string
          response_json: Json
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_name: string
          id?: string
          payload_json?: Json
          provider: string
          response_json?: Json
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_name?: string
          id?: string
          payload_json?: Json
          provider?: string
          response_json?: Json
          status?: string
        }
        Relationships: []
      }
      marketing_integrations: {
        Row: {
          cookie_banner_enabled: boolean
          cookie_banner_text: string | null
          ga4_custom_events_enabled: boolean
          ga4_enabled: boolean
          ga4_measurement_id: string | null
          google_ads_conversion_id: string | null
          google_ads_enabled: boolean
          google_ads_lead_label: string | null
          google_ads_quote_label: string | null
          google_ads_remarketing_enabled: boolean
          google_ads_whatsapp_label: string | null
          gtm_container_id: string | null
          gtm_enabled: boolean
          id: string
          meta_capi_enabled: boolean
          meta_events_enabled: boolean
          meta_pixel_enabled: boolean
          meta_pixel_id: string | null
          meta_test_event_code: string | null
          privacy_policy_url: string | null
          require_analytics_consent: boolean
          require_marketing_consent: boolean
          updated_at: string
        }
        Insert: {
          cookie_banner_enabled?: boolean
          cookie_banner_text?: string | null
          ga4_custom_events_enabled?: boolean
          ga4_enabled?: boolean
          ga4_measurement_id?: string | null
          google_ads_conversion_id?: string | null
          google_ads_enabled?: boolean
          google_ads_lead_label?: string | null
          google_ads_quote_label?: string | null
          google_ads_remarketing_enabled?: boolean
          google_ads_whatsapp_label?: string | null
          gtm_container_id?: string | null
          gtm_enabled?: boolean
          id?: string
          meta_capi_enabled?: boolean
          meta_events_enabled?: boolean
          meta_pixel_enabled?: boolean
          meta_pixel_id?: string | null
          meta_test_event_code?: string | null
          privacy_policy_url?: string | null
          require_analytics_consent?: boolean
          require_marketing_consent?: boolean
          updated_at?: string
        }
        Update: {
          cookie_banner_enabled?: boolean
          cookie_banner_text?: string | null
          ga4_custom_events_enabled?: boolean
          ga4_enabled?: boolean
          ga4_measurement_id?: string | null
          google_ads_conversion_id?: string | null
          google_ads_enabled?: boolean
          google_ads_lead_label?: string | null
          google_ads_quote_label?: string | null
          google_ads_remarketing_enabled?: boolean
          google_ads_whatsapp_label?: string | null
          gtm_container_id?: string | null
          gtm_enabled?: boolean
          id?: string
          meta_capi_enabled?: boolean
          meta_events_enabled?: boolean
          meta_pixel_enabled?: boolean
          meta_pixel_id?: string | null
          meta_test_event_code?: string | null
          privacy_policy_url?: string | null
          require_analytics_consent?: boolean
          require_marketing_consent?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      marketing_secrets: {
        Row: {
          ga4_api_secret: string | null
          id: string
          meta_capi_access_token: string | null
          updated_at: string
        }
        Insert: {
          ga4_api_secret?: string | null
          id?: string
          meta_capi_access_token?: string | null
          updated_at?: string
        }
        Update: {
          ga4_api_secret?: string | null
          id?: string
          meta_capi_access_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          alt_text: string | null
          created_at: string
          description: string | null
          file_name: string
          file_path: string | null
          file_url: string
          folder: string | null
          height: number | null
          id: string
          media_type: string
          mime_type: string | null
          size_bytes: number | null
          updated_at: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_path?: string | null
          file_url: string
          folder?: string | null
          height?: number | null
          id?: string
          media_type?: string
          mime_type?: string | null
          size_bytes?: number | null
          updated_at?: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string | null
          file_url?: string
          folder?: string | null
          height?: number | null
          id?: string
          media_type?: string
          mime_type?: string | null
          size_bytes?: number | null
          updated_at?: string
          width?: number | null
        }
        Relationships: []
      }
      navigation_items: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          menu_area: string
          opens_new_tab: boolean
          order_index: number
          parent_id: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          menu_area?: string
          opens_new_tab?: boolean
          order_index?: number
          parent_id?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          menu_area?: string
          opens_new_tab?: boolean
          order_index?: number
          parent_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigation_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "navigation_items"
            referencedColumns: ["id"]
          },
        ]
      }
      product_related: {
        Row: {
          created_at: string
          id: string
          order_index: number
          product_id: string
          related_product_id: string
          relation_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number
          product_id: string
          related_product_id: string
          relation_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          product_id?: string
          related_product_id?: string
          relation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_related_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_related_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          availability_status: Database["public"]["Enums"]["availability_status"]
          brand_id: string | null
          canonical_url: string | null
          category_id: string | null
          created_at: string
          full_description: string | null
          gallery_json: Json
          id: string
          internal_cost: number | null
          internal_notes: string | null
          internal_price: number | null
          is_active: boolean
          is_featured: boolean
          main_image_url: string | null
          model: string | null
          name: string
          official_product_url: string | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          order_index: number
          public_price_visible: boolean
          seo_description: string | null
          seo_image_url: string | null
          seo_title: string | null
          short_description: string | null
          sku: string | null
          slug: string
          specifications_json: Json
          tags_json: Json
          thumbnail_url: string | null
          updated_at: string
          use_cases_json: Json
          use_main_image_as_og: boolean
          video_url: string | null
        }
        Insert: {
          availability_status?: Database["public"]["Enums"]["availability_status"]
          brand_id?: string | null
          canonical_url?: string | null
          category_id?: string | null
          created_at?: string
          full_description?: string | null
          gallery_json?: Json
          id?: string
          internal_cost?: number | null
          internal_notes?: string | null
          internal_price?: number | null
          is_active?: boolean
          is_featured?: boolean
          main_image_url?: string | null
          model?: string | null
          name: string
          official_product_url?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          order_index?: number
          public_price_visible?: boolean
          seo_description?: string | null
          seo_image_url?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug: string
          specifications_json?: Json
          tags_json?: Json
          thumbnail_url?: string | null
          updated_at?: string
          use_cases_json?: Json
          use_main_image_as_og?: boolean
          video_url?: string | null
        }
        Update: {
          availability_status?: Database["public"]["Enums"]["availability_status"]
          brand_id?: string | null
          canonical_url?: string | null
          category_id?: string | null
          created_at?: string
          full_description?: string | null
          gallery_json?: Json
          id?: string
          internal_cost?: number | null
          internal_notes?: string | null
          internal_price?: number | null
          is_active?: boolean
          is_featured?: boolean
          main_image_url?: string | null
          model?: string | null
          name?: string
          official_product_url?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          order_index?: number
          public_price_visible?: boolean
          seo_description?: string | null
          seo_image_url?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          specifications_json?: Json
          tags_json?: Json
          thumbnail_url?: string | null
          updated_at?: string
          use_cases_json?: Json
          use_main_image_as_og?: boolean
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          assigned_to: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          message: string | null
          preferred_contact_method: string | null
          product_id: string | null
          status: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          message?: string | null
          preferred_contact_method?: string | null
          product_id?: string | null
          status?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          message?: string | null
          preferred_contact_method?: string | null
          product_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_pages: {
        Row: {
          body_json: Json
          created_at: string
          eyebrow: string | null
          heading: string | null
          id: string
          is_published: boolean
          label: string
          meta_description: string | null
          meta_image_url: string | null
          meta_title: string | null
          noindex: boolean
          og_description: string | null
          og_title: string | null
          order_index: number
          page_key: string
          slug: string | null
          subheading: string | null
          updated_at: string
        }
        Insert: {
          body_json?: Json
          created_at?: string
          eyebrow?: string | null
          heading?: string | null
          id?: string
          is_published?: boolean
          label: string
          meta_description?: string | null
          meta_image_url?: string | null
          meta_title?: string | null
          noindex?: boolean
          og_description?: string | null
          og_title?: string | null
          order_index?: number
          page_key: string
          slug?: string | null
          subheading?: string | null
          updated_at?: string
        }
        Update: {
          body_json?: Json
          created_at?: string
          eyebrow?: string | null
          heading?: string | null
          id?: string
          is_published?: boolean
          label?: string
          meta_description?: string | null
          meta_image_url?: string | null
          meta_title?: string | null
          noindex?: boolean
          og_description?: string | null
          og_title?: string | null
          order_index?: number
          page_key?: string
          slug?: string | null
          subheading?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          about_text: string | null
          address: string | null
          company_name: string | null
          id: string
          instagram: string | null
          map_embed_url: string | null
          opening_hours: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          about_text?: string | null
          address?: string | null
          company_name?: string | null
          id?: string
          instagram?: string | null
          map_embed_url?: string | null
          opening_hours?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          about_text?: string | null
          address?: string | null
          company_name?: string | null
          id?: string
          instagram?: string | null
          map_embed_url?: string | null
          opening_hours?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor" | "vendedor"
      availability_status:
        | "disponivel"
        | "sob_consulta"
        | "encomenda"
        | "indisponivel"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "vendedor"],
      availability_status: [
        "disponivel",
        "sob_consulta",
        "encomenda",
        "indisponivel",
      ],
    },
  },
} as const
