import { supabase } from './supabaseClient';
import type { Database, MediaType } from '../types/database.types';

export type PromptRow = Database['public']['Tables']['prompts']['Row'];
export type CategoryRow = Database['public']['Tables']['categories']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

/**
 * Serviços de Autenticação e Perfis
 */
export const authService = {
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  },

  async getCurrentProfile(): Promise<ProfileRow | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const { data, error } = await (supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single() as any);

    if (error) {
      console.error('Erro ao consultar perfil:', error.message);
      return null;
    }
    return data;
  },

  async isAdmin(): Promise<boolean> {
    const profile = await this.getCurrentProfile();
    return profile?.role === 'admin';
  },

  async signOut() {
    return await supabase.auth.signOut();
  }
};

/**
 * Serviços de Categorias
 */
export const categoriesService = {
  async listCategories(): Promise<CategoryRow[]> {
    const { data, error } = await (supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true }) as any);

    if (error) throw error;
    return (data as CategoryRow[]) || [];
  },

  async createCategory(category: { name: string; slug: string; description?: string }) {
    const { data, error } = await (supabase
      .from('categories')
      .insert(category as any)
      .select()
      .single() as any);

    if (error) throw error;
    return data;
  },

  async deleteCategory(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

/**
 * Serviços de Prompts
 */
export const promptsService = {
  async searchPrompts(params: {
    query?: string;
    categoryId?: string;
    tag?: string;
    sortBy?: 'created_at' | 'title';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const offset = (page - 1) * pageSize;

    // Tentar chamada RPC de busca customizada
    const { data, error } = await (supabase.rpc('search_prompts', {
      search_query: params.query || null,
      filter_category_id: params.categoryId || null,
      filter_tag: params.tag || null,
      sort_by: params.sortBy || 'created_at',
      sort_order: params.sortOrder || 'desc',
      page_limit: pageSize,
      page_offset: offset,
    } as any) as any);

    if (!error && Array.isArray(data)) {
      const totalCount = data.length > 0 && 'total_count' in data[0] ? Number(data[0].total_count) : data.length;
      return {
        prompts: data as PromptRow[],
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
      };
    }

    // Fallback para consulta direta na tabela prompts caso a migration RPC ainda não tenha sido rodada
    let query = supabase
      .from('prompts')
      .select('*', { count: 'exact' });

    if (params.categoryId) {
      query = query.eq('category_id', params.categoryId);
    }
    if (params.query) {
      query = query.ilike('title', `%${params.query}%`);
    }

    const { data: fallbackData, count } = await (query
      .order(params.sortBy || 'created_at', { ascending: params.sortOrder === 'asc' })
      .range(offset, offset + pageSize - 1) as any);

    return {
      prompts: (fallbackData as PromptRow[]) || [],
      totalCount: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  },

  async getPromptById(id: string): Promise<PromptRow | null> {
    const { data, error } = await (supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .single() as any);

    if (error) throw error;
    return data;
  },

  async createPrompt(prompt: {
    title: string;
    slug?: string;
    description?: string;
    content: string;
    category_id?: string;
    tags?: string[];
    media_url?: string;
    media_type?: MediaType;
    is_published?: boolean;
  }) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await (supabase
      .from('prompts')
      .insert({
        ...prompt,
        created_by: user?.id || null
      } as any)
      .select()
      .single() as any);

    if (error) throw error;
    return data;
  },

  async updatePrompt(id: string, updates: Partial<Omit<PromptRow, 'id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await ((supabase
      .from('prompts') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single());

    if (error) throw error;
    return data;
  },

  async deletePrompt(id: string) {
    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

/**
 * Serviços de Supabase Storage para mídias
 */
export const storageService = {
  async uploadMedia(file: File, folder: string = 'prompts') {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('prompt-media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('prompt-media')
      .getPublicUrl(data.path);

    return {
      path: data.path,
      publicUrl
    };
  },

  async deleteMedia(path: string) {
    const { error } = await supabase.storage
      .from('prompt-media')
      .remove([path]);

    if (error) throw error;
  }
};
