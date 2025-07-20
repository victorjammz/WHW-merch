export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      barcodes: {
        Row: {
          barcode_text: string
          barcode_type: string
          category: string | null
          created_at: string
          id: string
          image_url: string | null
          product_name: string | null
          sku: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          barcode_text: string
          barcode_type?: string
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          product_name?: string | null
          sku?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          barcode_text?: string
          barcode_type?: string
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          product_name?: string | null
          sku?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string
          id: string
          last_order_date: string | null
          location: string | null
          name: string
          notes: string | null
          phone: string | null
          postcode: string | null
          status: string
          total_orders: number
          total_spent: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          id?: string
          last_order_date?: string | null
          location?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          status?: string
          total_orders?: number
          total_spent?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          id?: string
          last_order_date?: string | null
          location?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          status?: string
          total_orders?: number
          total_spent?: number
          updated_at?: string
        }
        Relationships: []
      }
      event_inventory: {
        Row: {
          allocated_at: string
          event_id: string
          id: string
          product_variant_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          allocated_at?: string
          event_id: string
          id?: string
          product_variant_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          allocated_at?: string
          event_id?: string
          id?: string
          product_variant_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_inventory_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_inventory_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      event_orders: {
        Row: {
          client_address: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          client_postcode: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          event_date: string
          event_name: string
          id: string
          items: Json
          notes: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          client_address?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          client_postcode?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          event_date: string
          event_name: string
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          client_postcode?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          event_date?: string
          event_name?: string
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          address: string | null
          code: string
          created_at: string
          id: string
          manager_email: string | null
          manager_name: string | null
          name: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          id?: string
          manager_email?: string | null
          manager_name?: string | null
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          id?: string
          manager_email?: string | null
          manager_name?: string | null
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          barcode_text: string | null
          barcode_type: string | null
          category: string
          color: string | null
          created_at: string
          id: string
          image_url: string | null
          name: string
          price: number
          quantity: number
          size: string | null
          sku: string
          status: string
          updated_at: string
        }
        Insert: {
          barcode_text?: string | null
          barcode_type?: string | null
          category: string
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          price: number
          quantity?: number
          size?: string | null
          sku: string
          status?: string
          updated_at?: string
        }
        Update: {
          barcode_text?: string | null
          barcode_type?: string | null
          category?: string
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          quantity?: number
          size?: string | null
          sku?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      "Merch Inventory": {
        Row: {
          barcode_text: string | null
          barcode_type: string | null
          Category: string
          Colour: number | null
          Price: number | null
          "Product Name": string
          Quantity: number | null
          Size: number | null
        }
        Insert: {
          barcode_text?: string | null
          barcode_type?: string | null
          Category: string
          Colour?: number | null
          Price?: number | null
          "Product Name": string
          Quantity?: number | null
          Size?: number | null
        }
        Update: {
          barcode_text?: string | null
          barcode_type?: string | null
          Category?: string
          Colour?: number | null
          Price?: number | null
          "Product Name"?: string
          Quantity?: number | null
          Size?: number | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          name: string
          resource: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          resource: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          resource?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          barcode_text: string | null
          barcode_type: string | null
          color: string | null
          created_at: string
          id: string
          image_url: string | null
          price: number
          product_id: string
          quantity: number
          size: string | null
          sku: string | null
          status: string
          updated_at: string
        }
        Insert: {
          barcode_text?: string | null
          barcode_type?: string | null
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          price: number
          product_id: string
          quantity?: number
          size?: string | null
          sku?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          barcode_text?: string | null
          barcode_type?: string | null
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          price?: number
          product_id?: string
          quantity?: number
          size?: string | null
          sku?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          granted_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          granted_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          granted_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          address: string | null
          avatar_url: string | null
          company_name: string | null
          created_at: string
          currency: string | null
          date_format: string | null
          email_notifications: boolean | null
          id: string
          language: string | null
          low_stock_alerts: boolean | null
          order_updates: boolean | null
          password_expiry: number | null
          phone: string | null
          push_notifications: boolean | null
          session_timeout: number | null
          sidebar_collapsed: boolean | null
          sms_notifications: boolean | null
          theme: string | null
          timezone: string | null
          two_factor_auth: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          currency?: string | null
          date_format?: string | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          low_stock_alerts?: boolean | null
          order_updates?: boolean | null
          password_expiry?: number | null
          phone?: string | null
          push_notifications?: boolean | null
          session_timeout?: number | null
          sidebar_collapsed?: boolean | null
          sms_notifications?: boolean | null
          theme?: string | null
          timezone?: string | null
          two_factor_auth?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          currency?: string | null
          date_format?: string | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          low_stock_alerts?: boolean | null
          order_updates?: boolean | null
          password_expiry?: number | null
          phone?: string | null
          push_notifications?: boolean | null
          session_timeout?: number | null
          sidebar_collapsed?: boolean | null
          sms_notifications?: boolean | null
          theme?: string | null
          timezone?: string | null
          two_factor_auth?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_update_user_role: {
        Args: {
          user_id: string
          new_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      cleanup_deleted_orders: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      current_user_has_permission: {
        Args: { permission_name: string }
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      restore_order: {
        Args: { order_id: string }
        Returns: boolean
      }
      soft_delete_order: {
        Args: { order_id: string }
        Returns: boolean
      }
      user_has_permission: {
        Args: { user_id: string; permission_name: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "employee" | "manager" | "viewer"
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
      user_role: ["admin", "employee", "manager", "viewer"],
    },
  },
} as const
