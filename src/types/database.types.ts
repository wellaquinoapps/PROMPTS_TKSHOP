export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = 'user' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'blocked';
export type MediaType = 'none' | 'image' | 'gif' | 'video';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          role: AppRole;
          status: UserStatus;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          role?: AppRole;
          status?: UserStatus;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          role?: AppRole;
          status?: UserStatus;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      prompts: {
        Row: {
          id: string;
          title: string;
          slug: string | null;
          description: string | null;
          content: string;
          category_id: string | null;
          tags: string[];
          media_url: string | null;
          media_type: MediaType;
          is_published: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug?: string | null;
          description?: string | null;
          content: string;
          category_id?: string | null;
          tags?: string[];
          media_url?: string | null;
          media_type?: MediaType;
          is_published?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string | null;
          description?: string | null;
          content?: string;
          category_id?: string | null;
          tags?: string[];
          media_url?: string | null;
          media_type?: MediaType;
          is_published?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_approved: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      admin_delete_user: {
        Args: {
          target_user_id: string;
        };
        Returns: void;
      };
      admin_set_user_status: {
        Args: {
          target_user_id: string;
          new_status: UserStatus;
        };
        Returns: void;
      };
      search_prompts: {
        Args: {
          search_query?: string | null;
          filter_category_id?: string | null;
          filter_tag?: string | null;
          sort_by?: 'created_at' | 'title';
          sort_order?: 'asc' | 'desc';
          page_limit?: number;
          page_offset?: number;
        };
        Returns: {
          id: string;
          title: string;
          slug: string | null;
          description: string | null;
          content: string;
          category_id: string | null;
          tags: string[];
          media_url: string | null;
          media_type: MediaType;
          is_published: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          total_count: number;
        }[];
      };
    };
    Enums: {
      app_role: AppRole;
      user_status: UserStatus;
      media_type_enum: MediaType;
    };
  };
}
