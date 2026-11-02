export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TimestampColumns = {
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          phone: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          phone?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          phone?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      customer_addresses: {
        Row: TimestampColumns & {
          id: string; user_id: string; full_name: string; phone: string; country: string;
          address_line1: string; address_line2: string; city: string; state: string; postal_code: string; is_default: boolean;
        };
        Insert: {
          id?: string; user_id: string; full_name: string; phone?: string; country: string; address_line1: string;
          address_line2?: string; city: string; state?: string; postal_code?: string; is_default?: boolean; created_at?: string; updated_at?: string;
        };
        Update: {
          full_name?: string; phone?: string; country?: string; address_line1?: string; address_line2?: string; city?: string;
          state?: string; postal_code?: string; is_default?: boolean; updated_at?: string;
        };
        Relationships: [];
      };
      shipping_zones: {
        Row: TimestampColumns & { id: string; name: string; country_codes: string[]; region_codes: string[]; active: boolean };
        Insert: { id?: string; name: string; country_codes?: string[]; region_codes?: string[]; active?: boolean; created_at?: string; updated_at?: string };
        Update: { name?: string; country_codes?: string[]; region_codes?: string[]; active?: boolean; updated_at?: string };
        Relationships: [];
      };
      shipping_methods: {
        Row: TimestampColumns & { id: string; zone_id: string; name: string; description: string; calculation_method: "flat" | "free"; base_fee_minor: number; additional_fee_minor: number; free_shipping_min_minor: number | null; estimated_min_days: number | null; estimated_max_days: number | null; currency_code: string; active: boolean };
        Insert: { id?: string; zone_id: string; name: string; description?: string; calculation_method?: "flat" | "free"; base_fee_minor?: number; additional_fee_minor?: number; free_shipping_min_minor?: number | null; estimated_min_days?: number | null; estimated_max_days?: number | null; currency_code: string; active?: boolean; created_at?: string; updated_at?: string };
        Update: { zone_id?: string; name?: string; description?: string; calculation_method?: "flat" | "free"; base_fee_minor?: number; additional_fee_minor?: number; free_shipping_min_minor?: number | null; estimated_min_days?: number | null; estimated_max_days?: number | null; currency_code?: string; active?: boolean; updated_at?: string };
        Relationships: [];
      };
      tax_rules: {
        Row: TimestampColumns & { id: string; name: string; country_code: string; region_code: string; tax_rate_basis_points: number; prices_include_tax: boolean; active: boolean };
        Insert: { id?: string; name: string; country_code: string; region_code?: string; tax_rate_basis_points?: number; prices_include_tax?: boolean; active?: boolean; created_at?: string; updated_at?: string };
        Update: { name?: string; country_code?: string; region_code?: string; tax_rate_basis_points?: number; prices_include_tax?: boolean; active?: boolean; updated_at?: string };
        Relationships: [];
      };
      checkout_currencies: {
        Row: { currency_code: string; stripe_enabled: boolean; paystack_enabled: boolean; active: boolean; is_base_currency: boolean };
        Insert: { currency_code: string; stripe_enabled?: boolean; paystack_enabled?: boolean; active?: boolean; is_base_currency?: boolean };
        Update: { stripe_enabled?: boolean; paystack_enabled?: boolean; active?: boolean; is_base_currency?: boolean };
        Relationships: [];
      };
      user_roles: {
        Row: {
          user_id: string;
          role: "customer" | "admin";
          created_at: string;
        };
        Insert: {
          user_id: string;
          role?: "customer" | "admin";
          created_at?: string;
        };
        Update: {
          role?: "customer" | "admin";
        };
        Relationships: [];
      };
      categories: {
        Row: TimestampColumns & {
          id: string;
          name: string;
          slug: string;
          description: string;
          active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string;
          active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: TimestampColumns & {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          description: string;
          status: "draft" | "published" | "archived";
          currency_code: string;
          price_minor: number;
          featured: boolean;
          is_new_arrival: boolean;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          slug: string;
          description?: string;
          status?: "draft" | "published" | "archived";
          currency_code?: string;
          price_minor: number;
          featured?: boolean;
          is_new_arrival?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          name?: string;
          slug?: string;
          description?: string;
          status?: "draft" | "published" | "archived";
          currency_code?: string;
          price_minor?: number;
          featured?: boolean;
          is_new_arrival?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          storage_path: string;
          alt_text: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          storage_path: string;
          alt_text: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          storage_path?: string;
          alt_text?: string;
          display_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: TimestampColumns & {
          id: string;
          product_id: string;
          sku: string;
          size: string;
          color_name: string;
          color_code: string;
          stock_quantity: number;
          active: boolean;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku: string;
          size: string;
          color_name: string;
          color_code: string;
          stock_quantity?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          sku?: string;
          size?: string;
          color_name?: string;
          color_code?: string;
          stock_quantity?: number;
          active?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      collections: {
        Row: TimestampColumns & {
          id: string;
          name: string;
          slug: string;
          description: string;
          active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string;
          active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      collection_products: {
        Row: {
          collection_id: string;
          product_id: string;
          display_order: number;
        };
        Insert: {
          collection_id: string;
          product_id: string;
          display_order?: number;
        };
        Update: {
          display_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collection_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string; user_id: string | null; customer_email: string; customer_name: string; phone: string;
          status: "pending" | "processing" | "paid" | "cancelled" | "failed" | "refunded";
          payment_status: "pending" | "processing" | "succeeded" | "cancelled" | "failed" | "refunded";
          currency_code: string; subtotal_minor: number; shipping_minor: number; tax_minor: number; total_minor: number;
          shipping_address: Json; provider: "stripe" | "paystack"; provider_reference: string | null; idempotency_key: string;
          created_at: string; updated_at: string; paid_at: string | null;
          fulfilment_status: string; tracking_carrier: string; tracking_number: string; tracking_url: string;
          dispatched_at: string | null; delivered_at: string | null; cancelled_at: string | null;
        };
        Insert: {
          id?: string; user_id?: string | null; customer_email: string; customer_name: string; phone?: string;
          status?: "pending" | "processing" | "paid" | "cancelled" | "failed" | "refunded";
          payment_status?: "pending" | "processing" | "succeeded" | "cancelled" | "failed" | "refunded";
          currency_code: string; subtotal_minor: number; shipping_minor?: number; tax_minor?: number; total_minor: number;
          shipping_address: Json; provider: "stripe" | "paystack"; provider_reference?: string | null; idempotency_key: string;
          created_at?: string; updated_at?: string; paid_at?: string | null;
        };
        Update: {
          status?: "pending" | "processing" | "paid" | "cancelled" | "failed" | "refunded";
          payment_status?: "pending" | "processing" | "succeeded" | "cancelled" | "failed" | "refunded";
          provider_reference?: string | null; paid_at?: string | null; updated_at?: string;
          fulfilment_status?: string; tracking_carrier?: string; tracking_number?: string; tracking_url?: string;
          dispatched_at?: string | null; delivered_at?: string | null; cancelled_at?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: { id: string; order_id: string; product_id: string | null; product_variant_id: string | null; product_name: string; product_slug: string; variant_sku: string; size: string; color_name: string; quantity: number; unit_price_minor: number; line_total_minor: number; created_at: string };
        Insert: { id?: string; order_id: string; product_id?: string | null; product_variant_id?: string | null; product_name: string; product_slug?: string; variant_sku: string; size: string; color_name: string; quantity: number; unit_price_minor: number; line_total_minor: number; created_at?: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      wishlist_items: {
        Row: { user_id: string; product_id: string; created_at: string };
        Insert: { user_id: string; product_id: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      product_reviews: {
        Row: { id: string; product_id: string; user_id: string; rating: number; title: string; body: string; status: "pending" | "approved" | "rejected" | "hidden"; verified_purchase: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; product_id: string; user_id: string; rating: number; title?: string; body: string; status?: "pending" | "approved" | "rejected" | "hidden"; verified_purchase?: boolean; created_at?: string; updated_at?: string };
        Update: { product_id?: string; user_id?: string; rating?: number; title?: string; body?: string; status?: "pending" | "approved" | "rejected" | "hidden"; verified_purchase?: boolean; updated_at?: string };
        Relationships: [];
      };
      payment_records: {
        Row: { id: string; order_id: string; provider: "stripe" | "paystack"; provider_reference: string | null; status: "pending" | "processing" | "succeeded" | "cancelled" | "failed" | "refunded"; amount_minor: number; currency_code: string; verified_at: string | null; raw_event_id: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; order_id: string; provider: "stripe" | "paystack"; provider_reference?: string | null; status?: "pending" | "processing" | "succeeded" | "cancelled" | "failed" | "refunded"; amount_minor: number; currency_code: string; verified_at?: string | null; raw_event_id?: string | null; created_at?: string; updated_at?: string };
        Update: { provider_reference?: string | null; status?: "pending" | "processing" | "succeeded" | "cancelled" | "failed" | "refunded"; verified_at?: string | null; updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      delete_my_account: { Args: Record<PropertyKey, never>; Returns: undefined };
      product_has_verified_purchase: { Args: { p_product_id: string }; Returns: boolean };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      create_checkout_order: {
        Args: { p_idempotency_key: string; p_customer_email: string; p_customer_name: string; p_phone: string; p_shipping_address: Json; p_provider: string; p_currency_code: string; p_subtotal_minor: number; p_shipping_minor: number; p_tax_minor: number; p_total_minor: number; p_items: Json };
        Returns: string;
      };
      set_checkout_provider_reference: { Args: { p_order_id: string; p_reference: string }; Returns: undefined };
      mark_payment_succeeded: { Args: { p_order_id: string; p_provider: string; p_reference: string; p_amount_minor: number; p_currency_code: string; p_event_id: string }; Returns: undefined };
      adjust_variant_stock: { Args: { p_variant_id: string; p_adjustment: number; p_reason: string; p_note: string; p_idempotency_key: string }; Returns: number };
      update_order_fulfilment: { Args: { p_order_id: string; p_status: string; p_tracking_carrier: string; p_tracking_number: string; p_tracking_url: string; p_note: string; p_idempotency_key: string | null }; Returns: undefined };
      set_checkout_shipping_snapshot: { Args: { p_order_id: string; p_method_id: string; p_method_name: string; p_method_description: string; p_estimated_delivery: string; p_tax_rule_id: string | null; p_tax_rate_basis_points: number }; Returns: undefined };
      get_checkout_tax_rule: { Args: { p_country_code: string; p_region_code?: string }; Returns: { tax_rate_basis_points: number; prices_include_tax: boolean }[] };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
