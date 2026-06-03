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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      car_submissions: {
        Row: {
          asking_price: number
          condition: string
          created_at: string
          description: string | null
          email: string
          fuel_type: string
          id: string
          images: string[] | null
          is_hybrid: boolean | null
          make: string
          mileage: number | null
          model: string
          name: string
          phone: string | null
          status: string
          transmission: string
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          asking_price: number
          condition?: string
          created_at?: string
          description?: string | null
          email: string
          fuel_type: string
          id?: string
          images?: string[] | null
          is_hybrid?: boolean | null
          make: string
          mileage?: number | null
          model: string
          name: string
          phone?: string | null
          status?: string
          transmission?: string
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          asking_price?: number
          condition?: string
          created_at?: string
          description?: string | null
          email?: string
          fuel_type?: string
          id?: string
          images?: string[] | null
          is_hybrid?: boolean | null
          make?: string
          mileage?: number | null
          model?: string
          name?: string
          phone?: string | null
          status?: string
          transmission?: string
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      cars: {
        Row: {
          condition: string
          created_at: string
          description: string
          engine: string
          exterior_color: string
          features: string[] | null
          fuel_type: string
          id: string
          image_url: string
          images: string[] | null
          interior_color: string
          is_featured: boolean | null
          is_hybrid: boolean | null
          make: string
          mileage: number | null
          model: string
          price: number
          transmission: string
          updated_at: string
          videos: string[] | null
          vin: string
          year: number
        }
        Insert: {
          condition: string
          created_at?: string
          description: string
          engine: string
          exterior_color: string
          features?: string[] | null
          fuel_type: string
          id?: string
          image_url: string
          images?: string[] | null
          interior_color: string
          is_featured?: boolean | null
          is_hybrid?: boolean | null
          make: string
          mileage?: number | null
          model: string
          price: number
          transmission: string
          updated_at?: string
          videos?: string[] | null
          vin: string
          year: number
        }
        Update: {
          condition?: string
          created_at?: string
          description?: string
          engine?: string
          exterior_color?: string
          features?: string[] | null
          fuel_type?: string
          id?: string
          image_url?: string
          images?: string[] | null
          interior_color?: string
          is_featured?: boolean | null
          is_hybrid?: boolean | null
          make?: string
          mileage?: number | null
          model?: string
          price?: number
          transmission?: string
          updated_at?: string
          videos?: string[] | null
          vin?: string
          year?: number
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inquiry_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_by_admin: boolean
          read_by_user: boolean
          sender_id: string
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_by_admin?: boolean
          read_by_user?: boolean
          sender_id: string
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_by_admin?: boolean
          read_by_user?: boolean
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "inquiry_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_threads: {
        Row: {
          car_id: string
          created_at: string
          id: string
          last_message_at: string
          user_id: string
        }
        Insert: {
          car_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          user_id: string
        }
        Update: {
          car_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_threads_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          amount_cents: number
          car_id: string
          created_at: string
          currency: string
          deposit_pct: number
          id: string
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          thread_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          car_id: string
          created_at?: string
          currency?: string
          deposit_pct: number
          id?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          thread_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          car_id?: string
          created_at?: string
          currency?: string
          deposit_pct?: number
          id?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          thread_id?: string
          updated_at?: string
          user_id?: string
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
      mark_inquiry_thread_read: {
        Args: { _thread_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "customer"
      booking_status_enum: "pending" | "confirmed" | "cancelled" | "completed"
      user_role_enum: "student" | "instructor" | "admin"
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
      app_role: ["admin", "staff", "customer"],
      booking_status_enum: ["pending", "confirmed", "cancelled", "completed"],
      user_role_enum: ["student", "instructor", "admin"],
    },
  },
} as const
