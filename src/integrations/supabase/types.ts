[?25l[?2004h
                                                                                                         
  >  1. jjytcbtmlumklbgckari [name: thefluffymunchkin, org: nlorkggxhnkwmwmzwkua, region: ap-southeast-1]
                                                                                                         
                                                                                                         
    ↑/k up • ↓/j down • / filter • q quit • ? more                                                       
                                                                                                         [6A [J[2K[?2004l[?25h[?1002l[?1003l[?1006lSelected project: jjytcbtmlumklbgckari
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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      approved_google_users: {
        Row: {
          created_at: string | null
          email: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          role?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          gstin: string | null
          id: number
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: number
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: number
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          discount_amount: number | null
          gst_amount: number | null
          gst_percent: number | null
          hsn: string | null
          id: number
          invoice_id: number
          product_id: number | null
          product_name: string
          quantity: number
          rate: number
          total_price: number
          unit: string | null
        }
        Insert: {
          discount_amount?: number | null
          gst_amount?: number | null
          gst_percent?: number | null
          hsn?: string | null
          id?: number
          invoice_id: number
          product_id?: number | null
          product_name: string
          quantity: number
          rate: number
          total_price: number
          unit?: string | null
        }
        Update: {
          discount_amount?: number | null
          gst_amount?: number | null
          gst_percent?: number | null
          hsn?: string | null
          id?: number
          invoice_id?: number
          product_id?: number | null
          product_name?: string
          quantity?: number
          rate?: number
          total_price?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          id: number
          invoice_id: number
          payment_date: string
          payment_method_id: string | null
          payment_method_name: string
        }
        Insert: {
          amount: number
          id?: number
          invoice_id: number
          payment_date?: string
          payment_method_id?: string | null
          payment_method_name: string
        }
        Update: {
          amount?: number
          id?: number
          invoice_id?: number
          payment_date?: string
          payment_method_id?: string | null
          payment_method_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          business_date: string | null
          created_at: string
          customer_gstin: string | null
          customer_id: number | null
          customer_name: string | null
          customer_phone: string | null
          grand_total: number
          id: number
          invoice_date: string
          invoice_number: string
          location_code: string | null
          receipt_time: string | null
          return_amount: number | null
          shift_no: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          terminal_id: string | null
          total_gst: number | null
          transaction_status: string | null
        }
        Insert: {
          business_date?: string | null
          created_at?: string
          customer_gstin?: string | null
          customer_id?: number | null
          customer_name?: string | null
          customer_phone?: string | null
          grand_total: number
          id?: number
          invoice_date: string
          invoice_number: string
          location_code?: string | null
          receipt_time?: string | null
          return_amount?: number | null
          shift_no?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          terminal_id?: string | null
          total_gst?: number | null
          transaction_status?: string | null
        }
        Update: {
          business_date?: string | null
          created_at?: string
          customer_gstin?: string | null
          customer_id?: number | null
          customer_name?: string | null
          customer_phone?: string | null
          grand_total?: number
          id?: number
          invoice_date?: string
          invoice_number?: string
          location_code?: string | null
          receipt_time?: string | null
          return_amount?: number | null
          shift_no?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          terminal_id?: string | null
          total_gst?: number | null
          transaction_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          gst_percent: number
          hsn: string | null
          id: number
          low_stock_alert: number
          name: string
          price: number
          purchase_price: number | null
          sku: string | null
          stock_quantity: number | null
          unit: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          gst_percent?: number
          hsn?: string | null
          id?: number
          low_stock_alert?: number
          name: string
          price: number
          purchase_price?: number | null
          sku?: string | null
          stock_quantity?: number | null
          unit?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          gst_percent?: number
          hsn?: string | null
          id?: number
          low_stock_alert?: number
          name?: string
          price?: number
          purchase_price?: number | null
          sku?: string | null
          stock_quantity?: number | null
          unit?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          role: string
        }
        Insert: {
          id: string
          role?: string
        }
        Update: {
          id?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      invoice_status: "draft" | "paid" | "void"
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
      invoice_status: ["draft", "paid", "void"],
    },
  },
} as const
