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
      activated_models: {
        Row: {
          ai_summary: string | null
          completed: boolean | null
          created_at: string
          current_step: number | null
          id: string
          model_id: string
          progress: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          completed?: boolean | null
          created_at?: string
          current_step?: number | null
          id?: string
          model_id: string
          progress?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          completed?: boolean | null
          created_at?: string
          current_step?: number | null
          id?: string
          model_id?: string
          progress?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activated_models_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      martech_categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      model_categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      model_category_links: {
        Row: {
          category_id: string
          id: string
          model_id: string
        }
        Insert: {
          category_id: string
          id?: string
          model_id: string
        }
        Update: {
          category_id?: string
          id?: string
          model_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_category_links_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "model_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_category_links_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          access_level: string | null
          audience: string[] | null
          created_at: string
          emoji: string | null
          featured: boolean | null
          id: string
          likes_count: number | null
          long_description: string | null
          name: string
          outcomes: string[] | null
          owner_id: string | null
          short_description: string | null
          slug: string | null
          status: string | null
          steps: Json | null
          suggested_actions: string[] | null
          tags: string[] | null
          template_urls: Json | null
          time_estimate: string | null
          unlock_level: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          access_level?: string | null
          audience?: string[] | null
          created_at?: string
          emoji?: string | null
          featured?: boolean | null
          id?: string
          likes_count?: number | null
          long_description?: string | null
          name: string
          outcomes?: string[] | null
          owner_id?: string | null
          short_description?: string | null
          slug?: string | null
          status?: string | null
          steps?: Json | null
          suggested_actions?: string[] | null
          tags?: string[] | null
          template_urls?: Json | null
          time_estimate?: string | null
          unlock_level?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          access_level?: string | null
          audience?: string[] | null
          created_at?: string
          emoji?: string | null
          featured?: boolean | null
          id?: string
          likes_count?: number | null
          long_description?: string | null
          name?: string
          outcomes?: string[] | null
          owner_id?: string | null
          short_description?: string | null
          slug?: string | null
          status?: string | null
          steps?: Json | null
          suggested_actions?: string[] | null
          tags?: string[] | null
          template_urls?: Json | null
          time_estimate?: string | null
          unlock_level?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          data_maturity_level: number | null
          email: string | null
          firm_name: string | null
          firm_region: string | null
          firm_size: string | null
          firm_type: string | null
          full_name: string | null
          game_of_life_access: boolean | null
          growth_maturity_level: number | null
          growth_priorities: string[] | null
          id: string
          interest_areas: string[] | null
          international_scope: boolean | null
          is_client: boolean | null
          job_title: string | null
          location_region: string | null
          onboarding_completed: boolean | null
          practice_area: string | null
          research_contributor: boolean | null
          role_title: string | null
          seniority: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          data_maturity_level?: number | null
          email?: string | null
          firm_name?: string | null
          firm_region?: string | null
          firm_size?: string | null
          firm_type?: string | null
          full_name?: string | null
          game_of_life_access?: boolean | null
          growth_maturity_level?: number | null
          growth_priorities?: string[] | null
          id?: string
          interest_areas?: string[] | null
          international_scope?: boolean | null
          is_client?: boolean | null
          job_title?: string | null
          location_region?: string | null
          onboarding_completed?: boolean | null
          practice_area?: string | null
          research_contributor?: boolean | null
          role_title?: string | null
          seniority?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          data_maturity_level?: number | null
          email?: string | null
          firm_name?: string | null
          firm_region?: string | null
          firm_size?: string | null
          firm_type?: string | null
          full_name?: string | null
          game_of_life_access?: boolean | null
          growth_maturity_level?: number | null
          growth_priorities?: string[] | null
          id?: string
          interest_areas?: string[] | null
          international_scope?: boolean | null
          is_client?: boolean | null
          job_title?: string | null
          location_region?: string | null
          onboarding_completed?: boolean | null
          practice_area?: string | null
          research_contributor?: boolean | null
          role_title?: string | null
          seniority?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          id: string
          reaction_type: string | null
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_type?: string | null
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_type?: string | null
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      research_responses: {
        Row: {
          completed: boolean | null
          created_at: string
          id: string
          responses: Json | null
          study_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          id?: string
          responses?: Json | null
          study_id: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          id?: string
          responses?: Json | null
          study_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_responses_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "research_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      research_studies: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          emoji: string | null
          estimated_time: number | null
          id: string
          questions: Json | null
          reward_description: string | null
          slug: string | null
          status: string | null
          target_audience_tags: string[] | null
          title: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          estimated_time?: number | null
          id?: string
          questions?: Json | null
          reward_description?: string | null
          slug?: string | null
          status?: string | null
          target_audience_tags?: string[] | null
          title: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          estimated_time?: number | null
          id?: string
          questions?: Json | null
          reward_description?: string | null
          slug?: string | null
          status?: string | null
          target_audience_tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      resource_categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      resource_category_links: {
        Row: {
          category_id: string
          id: string
          resource_id: string
        }
        Insert: {
          category_id: string
          id?: string
          resource_id: string
        }
        Update: {
          category_id?: string
          id?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_category_links_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_category_links_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          access_level: string | null
          author: string | null
          created_at: string
          created_by: string | null
          description: string | null
          emoji: string | null
          estimated_time: number | null
          featured: boolean | null
          id: string
          image_url: string | null
          likes_count: number | null
          published_date: string | null
          status: string | null
          title: string
          type: string
          updated_at: string
          url: string | null
        }
        Insert: {
          access_level?: string | null
          author?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          emoji?: string | null
          estimated_time?: number | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          likes_count?: number | null
          published_date?: string | null
          status?: string | null
          title: string
          type?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          access_level?: string | null
          author?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          emoji?: string | null
          estimated_time?: number | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          likes_count?: number | null
          published_date?: string | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      topic_model_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          topic_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          topic_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_model_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "model_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_model_categories_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_models: {
        Row: {
          created_at: string | null
          id: string
          model_id: string
          topic_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          model_id: string
          topic_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          model_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_models_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_models_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_resource_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          topic_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          topic_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_resource_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_resource_categories_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_vendor_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          topic_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          topic_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_vendor_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "martech_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_vendor_categories_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          id: string
          interest_area_keywords: string[] | null
          max_data_maturity: number | null
          max_growth_maturity: number | null
          min_data_maturity: number | null
          min_growth_maturity: number | null
          name: string
          national_or_international: string[] | null
          recommended_firm_sizes: string[] | null
          recommended_firm_types: string[] | null
          recommended_roles: string[] | null
          recommended_seniority: string[] | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          interest_area_keywords?: string[] | null
          max_data_maturity?: number | null
          max_growth_maturity?: number | null
          min_data_maturity?: number | null
          min_growth_maturity?: number | null
          name: string
          national_or_international?: string[] | null
          recommended_firm_sizes?: string[] | null
          recommended_firm_types?: string[] | null
          recommended_roles?: string[] | null
          recommended_seniority?: string[] | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          interest_area_keywords?: string[] | null
          max_data_maturity?: number | null
          max_growth_maturity?: number | null
          min_data_maturity?: number | null
          min_growth_maturity?: number | null
          name?: string
          national_or_international?: string[] | null
          recommended_firm_sizes?: string[] | null
          recommended_firm_types?: string[] | null
          recommended_roles?: string[] | null
          recommended_seniority?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      user_model_access: {
        Row: {
          access_type: string
          created_at: string | null
          id: string
          model_id: string
          user_id: string
        }
        Insert: {
          access_type?: string
          created_at?: string | null
          id?: string
          model_id: string
          user_id: string
        }
        Update: {
          access_type?: string
          created_at?: string | null
          id?: string
          model_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_model_access_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      vendor_categories: {
        Row: {
          category_id: string
          id: string
          vendor_id: string
        }
        Insert: {
          category_id: string
          id?: string
          vendor_id: string
        }
        Update: {
          category_id?: string
          id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "martech_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_categories_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          created_at: string
          description: string | null
          firm_sizes: string[] | null
          id: string
          likes_count: number | null
          logo_url: string | null
          name: string
          regions: string[] | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          firm_sizes?: string[] | null
          id?: string
          likes_count?: number | null
          logo_url?: string | null
          name: string
          regions?: string[] | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          firm_sizes?: string[] | null
          id?: string
          likes_count?: number | null
          logo_url?: string | null
          name?: string
          regions?: string[] | null
          updated_at?: string
          website_url?: string | null
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
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
