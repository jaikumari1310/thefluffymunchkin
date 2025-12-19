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
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          gstin: string | null
          id: string
          name: string
          phone: string | null
          state_code: string | null
          state_name: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          name: string
          phone?: string | null
          state_code?: string | null
          state_name?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          name?: string
          phone?: string | null
          state_code?: string | null
          state_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          business_date: string | null
          created_at: string
          customer_address: string | null
          customer_gstin: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_state_code: string | null
          customer_state_name: string | null
          due_amount: number
          grand_total: number
          id: string
          invoice_date: string
          invoice_number: string
          items: Json
          location_code: string | null
          original_invoice_id: string | null
          paid_amount: number
          payment_mode: string | null
          receipt_time: string | null
          return_amount: number | null
          shift_no: string | null
          status: string | null
          subtotal: number
          terminal_id: string | null
          total_cgst: number
          total_gst: number
          total_igst: number
          total_sgst: number
          transaction_status: string | null
          updated_at: string
        }
        Insert: {
          business_date?: string | null
          created_at?: string
          customer_address?: string | null
          customer_gstin?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_state_code?: string | null
          customer_state_name?: string | null
          due_amount?: number
          grand_total?: number
          id?: string
          invoice_date?: string
          invoice_number: string
          items?: Json
          location_code?: string | null
          original_invoice_id?: string | null
          paid_amount?: number
          payment_mode?: string | null
          receipt_time?: string | null
          return_amount?: number | null
          shift_no?: string | null
          status?: string | null
          subtotal?: number
          terminal_id?: string | null
          total_cgst?: number
          total_gst?: number
          total_igst?: number
          total_sgst?: number
          transaction_status?: string | null
          updated_at?: string
        }
        Update: {
          business_date?: string | null
          created_at?: string
          customer_address?: string | null
          customer_gstin?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_state_code?: string | null
          customer_state_name?: string | null
          due_amount?: number
          grand_total?: number
          id?: string
          invoice_date?: string
          invoice_number?: string
          items?: Json
          location_code?: string | null
          original_invoice_id?: string | null
          paid_amount?: number
          payment_mode?: string | null
          receipt_time?: string | null
          return_amount?: number | null
          shift_no?: string | null
          status?: string | null
          subtotal?: number
          terminal_id?: string | null
          total_cgst?: number
          total_gst?: number
          total_igst?: number
          total_sgst?: number
          transaction_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_original_invoice_id_fkey"
            columns: ["original_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_mode: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_mode?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          gst_percent: number
          hsn_code: string | null
          id: string
          name: string
          price: number
          stock: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          gst_percent?: number
          hsn_code?: string | null
          id?: string
          name: string
          price?: number
          stock?: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          gst_percent?: number
          hsn_code?: string | null
          id?: string
          name?: string
          price?: number
          stock?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          bank_account: string | null
          bank_ifsc: string | null
          bank_name: string | null
          created_at: string
          current_shift: string | null
          id: string
          invoice_prefix: string | null
          location_code: string | null
          next_invoice_number: number | null
          shop_address: string | null
          shop_email: string | null
          shop_gstin: string | null
          shop_name: string | null
          shop_phone: string | null
          shop_state_name: string | null
          state_code: string | null
          terminal_id: string | null
          terms_conditions: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          bank_account?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          created_at?: string
          current_shift?: string | null
          id?: string
          invoice_prefix?: string | null
          location_code?: string | null
          next_invoice_number?: number | null
          shop_address?: string | null
          shop_email?: string | null
          shop_gstin?: string | null
          shop_name?: string | null
          shop_phone?: string | null
          shop_state_name?: string | null
          state_code?: string | null
          terminal_id?: string | null
          terms_conditions?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          bank_account?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          created_at?: string
          current_shift?: string | null
          id?: string
          invoice_prefix?: string | null
          location_code?: string | null
          next_invoice_number?: number | null
          shop_address?: string | null
          shop_email?: string | null
          shop_gstin?: string | null
          shop_name?: string | null
          shop_phone?: string | null
          shop_state_name?: string | null
          state_code?: string | null
          terminal_id?: string | null
          terms_conditions?: string | null
          updated_at?: string
          upi_id?: string | null
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
