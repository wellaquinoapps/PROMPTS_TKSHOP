import React, { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  Layers,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  Ban,
  Clock,
  Shield,
  Search,
  RefreshCw,
  Loader2,
  FolderPlus,
  Eye,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { promptsService, categoriesService } from '../services/promptService';
import { ConfirmActionModal } from './ConfirmActionModal';
import type { Database, UserStatus, AppRole } from '../types/database.types';

type ProfileItem = Database['public']['Tables']['profiles']['Row'];
type PromptItem = Database['public']['Tables']['prompts']['Row'];
type CategoryItem = Database['public']['Tables']['categories']['Row'];

interface AdminDashboardViewProps {
  onOpenCreatePrompt: () => void;
  onEditPrompt: (prompt: PromptItem) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onOpenCreatePrompt,
  onEditPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'prompts' | 'categories'>('overview');
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Estados dos Modais de Confirmação
  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionType: 'delete' | 'edit';
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionType: 'delete',
    confirmLabel: 'Confirmar',
    onConfirm: () => {},
  });

  // Filtros
  const [userFilter, setUserFilter] = useState<'pending' | 'approved' | 'blocked' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [confirmDeletePromptId, setConfirmDeletePromptId] = useState<string | null>(null);

  // Form categoria / subcategoria
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catParentId, setCatParentId] = useState<string>('');
  const [catLoading, setCatLoading] = useState(false);
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<string | null>(null);

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      const [usersRes, promptsRes, catsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('prompts').select('*').order('created_at', { ascending: false }),
        categoriesService.listCategories(),
      ]);

      if (usersRes.data) setProfiles(usersRes.data as ProfileItem[]);
      if (promptsRes.data) setPrompts(promptsRes.data as PromptItem[]);
      if (catsRes) setCategories(catsRes);
    } catch (err: any) {
      console.error('Erro ao carregar dados administrativos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  // Alterar Status do Usuário
  const handleSetUserStatus = async (userId: string, newStatus: UserStatus) => {
    try {
      setActionLoading(userId);
      setMsg(null);
      const { error } = await supabase.rpc('admin_set_user_status', {
        target_user_id: userId,
        new_status: newStatus,
      } as any);

      if (error) {
        const { error: errDirect } = await ((supabase.from('profiles') as any)
          .update({ status: newStatus })
          .eq('id', userId));
        if (errDirect) throw errDirect;
      }

      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, status: newStatus } : p))
      );
      setMsg({
        type: 'success',
        text: newStatus === 'blocked' ? 'Usuário bloqueado no sistema.' : 'Status alterado com sucesso.',
      });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Erro ao alterar status.' });
    } finally {
      setActionLoading(null);
    }
  };

  // Excluir Usuário definitivamente
  const handleDeleteUser = async (userId: string) => {
    try {
      setActionLoading(userId);
      setMsg(null);
      const { error } = await supabase.rpc('admin_delete_user', {
        target_user_id: userId,
      } as any);

      if (error) {
        const { error: errDirect } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);
        if (errDirect) throw errDirect;
      }

      setProfiles((prev) => prev.filter((p) => p.id !== userId));
      setConfirmDeleteUserId(null);
      setMsg({ type: 'success', text: 'Usuário removido definitivamente do Supabase.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Erro ao excluir usuário.' });
    } finally {
      setActionLoading(null);
    }
  };

  // Excluir Prompt definitivamente
  const handleDeletePrompt = async (promptId: string) => {
    try {
      setActionLoading(promptId);
      await promptsService.deletePrompt(promptId);
      setPrompts((prev) => prev.filter((p) => p.id !== promptId));
      setConfirmDeletePromptId(null);
      setMsg({ type: 'success', text: 'Prompt excluído com sucesso do Supabase.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Erro ao excluir prompt.' });
    } finally {
      setActionLoading(null);
    }
  };

  // Salvar (Criar ou Editar) Categoria/Subcategoria
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catSlug.trim()) return;

    try {
      setCatLoading(true);
      setMsg(null);

      const payload = {
        name: catName.trim(),
        slug: catSlug.trim().toLowerCase(),
        parent_id: catParentId ? catParentId : null,
      };

      if (editingCategory) {
        const updated = await categoriesService.updateCategory(editingCategory.id, payload);
        setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? updated : c)));
        setMsg({ type: 'success', text: 'Categoria atualizada com sucesso!' });
      } else {
        const created = await categoriesService.createCategory(payload);
        setCategories((prev) => [...prev, created]);
        setMsg({ type: 'success', text: 'Categoria/Subcategoria criada com sucesso!' });
      }

      setEditingCategory(null);
      setCatName('');
      setCatSlug('');
      setCatParentId('');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Erro ao salvar categoria.' });
    } finally {
      setCatLoading(false);
    }
  };

  // Excluir Categoria/Subcategoria
  const handleDeleteCategory = async (catId: string) => {
    try {
      setActionLoading(catId);
      setMsg(null);
      await categoriesService.deleteCategory(catId);
      setCategories((prev) => prev.filter((c) => c.id !== catId && c.parent_id !== catId));
      setConfirmDeleteCatId(null);
      setMsg({ type: 'success', text: 'Categoria removida com sucesso!' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Erro ao excluir categoria.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartEditCat = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatParentId(cat.parent_id || '');
  };

  // Contadores
  const pendingCount = profiles.filter((p) => p.status === 'pending').length;
  const approvedCount = profiles.filter((p) => p.status === 'approved').length;
  const blockedCount = profiles.filter((p) => p.status === 'blocked').length;
  const publishedPromptsCount = prompts.filter((p) => p.is_published).length;
  const draftPromptsCount = prompts.filter((p) => !p.is_published).length;

  const filteredUsers = profiles.filter((p) => {
    if (userFilter !== 'all' && p.status !== userFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.display_name && p.display_name.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Topo da Área Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1b1e2c]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300">
              <Shield className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Painel de Administração
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestão completa de usuários, aprovações, biblioteca de prompts e categorias
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllAdminData}
            className="p-2 rounded-xl bg-[#141624] hover:bg-[#1c1f30] text-slate-400 hover:text-white border border-[#23273c] transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenCreatePrompt}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-900/40 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Prompt</span>
          </button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {msg && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
            msg.type === 'error'
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
          }`}
        >
          {msg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => { setActiveTab('users'); setUserFilter('pending'); }}
          className="p-4 rounded-2xl bg-[#131522] border border-[#23273e] hover:border-amber-500/50 cursor-pointer transition-all space-y-1"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Aguardando Aprovação</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
          <span className="text-[10px] text-slate-500">Solicitações de novos usuários</span>
        </div>

        <div
          onClick={() => { setActiveTab('users'); setUserFilter('approved'); }}
          className="p-4 rounded-2xl bg-[#131522] border border-[#23273e] hover:border-emerald-500/50 cursor-pointer transition-all space-y-1"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Usuários Ativos</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{approvedCount}</p>
          <span className="text-[10px] text-slate-500">Com acesso autorizado</span>
        </div>

        <div
          onClick={() => setActiveTab('prompts')}
          className="p-4 rounded-2xl bg-[#131522] border border-[#23273e] hover:border-purple-500/50 cursor-pointer transition-all space-y-1"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Prompts Publicados</span>
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-300">{publishedPromptsCount}</p>
          <span className="text-[10px] text-slate-500">{draftPromptsCount} rascunhos no banco</span>
        </div>

        <div
          onClick={() => setActiveTab('categories')}
          className="p-4 rounded-2xl bg-[#131522] border border-[#23273e] hover:border-cyan-500/50 cursor-pointer transition-all space-y-1"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Categorias Ativas</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-400">{categories.length}</p>
          <span className="text-[10px] text-slate-500">Organização dos prompts</span>
        </div>
      </div>

      {/* Abas de Navegação Interna da Área Admin */}
      <div className="flex items-center gap-2 border-b border-[#1b1e2c] pb-3 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Visão Geral', icon: Shield },
          { id: 'users', label: `Usuários (${profiles.length})`, icon: Users },
          { id: 'prompts', label: `Prompts (${prompts.length})`, icon: FileText },
          { id: 'categories', label: `Categorias (${categories.length})`, icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'bg-[#131520] text-slate-400 hover:text-white border border-[#23273c]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONTEÚDO DA ABA: USUÁRIOS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Filtros por status */}
            <div className="flex items-center gap-2">
              {(['pending', 'approved', 'blocked', 'all'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setUserFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    userFilter === s
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#141624] text-slate-400 hover:bg-[#1a1e30] border border-[#23273c]'
                  }`}
                >
                  {s === 'pending' && `Pendentes (${pendingCount})`}
                  {s === 'approved' && `Aprovados (${approvedCount})`}
                  {s === 'blocked' && `Bloqueados (${blockedCount})`}
                  {s === 'all' && `Todos (${profiles.length})`}
                </button>
              ))}
            </div>

            {/* Campo de pesquisa de usuário */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 w-3.5 h-3.5 text-slate-500 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#141624] border border-[#23273e] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 bg-[#131522] rounded-2xl border border-[#202336]">
                Nenhum usuário localizado neste filtro.
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-3.5 rounded-2xl bg-[#131522] border border-[#22263d] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-900/50 border border-purple-700/50 flex items-center justify-center font-bold text-xs text-purple-300">
                      {u.display_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">
                          {u.display_name || 'Usuário sem nome'}
                        </span>
                        {u.role === 'admin' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-900/70 text-purple-300 border border-purple-700">
                            Super Admin
                          </span>
                        )}
                        {u.status === 'blocked' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/70 text-rose-300 border border-rose-800">
                            Bloqueado
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">{u.email || u.id}</p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    {u.role !== 'admin' && (
                      <>
                        {u.status !== 'approved' && (
                          <button
                            onClick={() => handleSetUserStatus(u.id, 'approved')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Aprovar</span>
                          </button>
                        )}

                        {u.status !== 'blocked' && (
                          <button
                            onClick={() => handleSetUserStatus(u.id, 'blocked')}
                            title="Bloquear usuário (impede recriação com este e-mail)"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-600 text-amber-300 hover:text-white text-xs font-medium transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Bloquear</span>
                          </button>
                        )}

                        <button
                          onClick={() =>
                            setConfirmModalData({
                              isOpen: true,
                              title: 'Excluir Usuário',
                              description: `Tem certeza que deseja excluir o usuário "${u.display_name || u.email}"? Esta ação apagará permanentemente o usuário e seus vínculos do Supabase.`,
                              actionType: 'delete',
                              confirmLabel: 'Excluir Usuário',
                              onConfirm: () => handleDeleteUser(u.id),
                            })
                          }
                          title="Excluir definitivamente do Supabase"
                          className="p-2 rounded-xl hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: PROMPTS */}
      {activeTab === 'prompts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Todos os Prompts no Supabase</h3>
            <button
              onClick={onOpenCreatePrompt}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Prompt</span>
            </button>
          </div>

          <div className="space-y-2">
            {prompts.map((p) => {
              const cat = categories.find((c) => c.id === p.category_id);
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-[#131522] border border-[#22263d] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{p.title}</span>
                      {cat && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#1d2030] text-slate-300 border border-[#2b3049]">
                          {cat.name}
                        </span>
                      )}
                      {!p.is_published && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950/80 text-amber-300 border border-amber-700">
                          Rascunho
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{p.description || p.content}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditPrompt(p)}
                      className="p-2 rounded-xl bg-[#1a1c2d] hover:bg-[#242842] text-slate-300 hover:text-white transition-colors"
                      title="Editar prompt"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() =>
                        setConfirmModalData({
                          isOpen: true,
                          title: 'Excluir Prompt',
                          description: `Tem certeza que deseja excluir o prompt "${p.title}"? O item será removido permanentemente da biblioteca no Supabase.`,
                          actionType: 'delete',
                          confirmLabel: 'Excluir Prompt',
                          onConfirm: () => handleDeletePrompt(p.id),
                        })
                      }
                      className="p-2 rounded-xl hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Excluir do Supabase"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: CATEGORIAS E SUBCATEGORIAS */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Formulário: Criar ou Editar Categoria / Subcategoria */}
          <div className="p-5 rounded-2xl bg-[#131522] border border-[#22263d] space-y-4 h-fit">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-purple-400" />
                <span>{editingCategory ? 'Editar Categoria' : 'Nova Categoria / Subcategoria'}</span>
              </h3>
              {editingCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setCatName('');
                    setCatSlug('');
                    setCatParentId('');
                  }}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-300">Tipo de Estrutura</label>
                <select
                  value={catParentId}
                  onChange={(e) => setCatParentId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#171a2a] border border-[#252a42] text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Categoria Principal</option>
                  {categories
                    .filter((c) => !c.parent_id && (!editingCategory || c.id !== editingCategory.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        Subcategoria de: {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Nome</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: UGC, POV, Imagens, Vídeos"
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    if (!editingCategory) {
                      setCatSlug(
                        e.target.value
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/[^a-z0-9]/g, '-')
                      );
                    }
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#171a2a] border border-[#252a42] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Slug identificador</label>
                <input
                  type="text"
                  required
                  placeholder="ex: ugc ou pov"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#171a2a] border border-[#252a42] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={catLoading}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-purple-900/30"
              >
                {catLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{editingCategory ? 'Atualizar Categoria' : 'Salvar Categoria'}</span>
              </button>
            </form>
          </div>

          {/* Lista com Hierarquia (Categorias e suas Subcategorias) */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-white mb-2">Estrutura Atual de Categorias</h3>

            {categories.filter((c) => !c.parent_id).map((parent) => {
              const subcats = categories.filter((c) => c.parent_id === parent.id);
              const linkedPrompts = prompts.filter((p) => p.category_id === parent.id).length;

              return (
                <div key={parent.id} className="p-4 rounded-2xl bg-[#131522] border border-[#22263d] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{parent.name}</span>
                        <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 border border-purple-800/40 px-1.5 py-0.5 rounded">
                          slug: {parent.slug}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">{linkedPrompts} prompts vinculados</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStartEditCat(parent)}
                        className="p-1.5 rounded-lg bg-[#1a1c2d] hover:bg-[#242842] text-slate-300 hover:text-white"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() =>
                          setConfirmModalData({
                            isOpen: true,
                            title: 'Excluir Categoria Principal',
                            description: `Tem certeza que deseja excluir a categoria "${parent.name}"? As subcategorias e vínculos relacionados serão removidos.`,
                            actionType: 'delete',
                            confirmLabel: 'Excluir Categoria',
                            onConfirm: () => handleDeleteCategory(parent.id),
                          })
                        }
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400"
                        title="Excluir categoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subcategorias vinculadas */}
                  <div className="pl-4 pt-2 border-l-2 border-purple-900/40 space-y-1.5">
                    {subcats.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">Nenhuma subcategoria cadastrada para {parent.name}.</p>
                    ) : (
                      subcats.map((sub) => (
                        <div
                          key={sub.id}
                          className="p-2 rounded-xl bg-[#171a2a] border border-[#242940] flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-200">{sub.name}</span>
                            <span className="text-[10px] font-mono text-cyan-300">slug: {sub.slug}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStartEditCat(sub)}
                              className="p-1 text-slate-400 hover:text-white"
                              title="Editar subcategoria"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() =>
                                setConfirmModalData({
                                  isOpen: true,
                                  title: 'Excluir Subcategoria',
                                  description: `Tem certeza que deseja excluir a subcategoria "${sub.name}"?`,
                                  actionType: 'delete',
                                  confirmLabel: 'Excluir Subcategoria',
                                  onConfirm: () => handleDeleteCategory(sub.id),
                                })
                              }
                              className="p-1 text-slate-500 hover:text-rose-400"
                              title="Excluir subcategoria"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: VISÃO GERAL */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pendentes Recentes */}
          <div className="p-5 rounded-2xl bg-[#131522] border border-[#22263d] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Solicitações de Acesso Pendentes</span>
              </h3>
              <button
                onClick={() => { setActiveTab('users'); setUserFilter('pending'); }}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium"
              >
                Ver todas ({pendingCount})
              </button>
            </div>

            {pendingCount === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Nenhuma solicitação pendente no momento.</p>
            ) : (
              profiles
                .filter((p) => p.status === 'pending')
                .slice(0, 4)
                .map((u) => (
                  <div
                    key={u.id}
                    className="p-2.5 rounded-xl bg-[#171a2a] border border-[#242940] flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-white">{u.display_name || 'Usuário'}</p>
                      <p className="text-[11px] font-mono text-slate-400">{u.email}</p>
                    </div>
                    <button
                      onClick={() => handleSetUserStatus(u.id, 'approved')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium"
                    >
                      Aprovar
                    </button>
                  </div>
                ))
            )}
          </div>

          {/* Dicas e Instruções do Admin */}
          <div className="p-5 rounded-2xl bg-[#131522] border border-[#22263d] space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Controle de Segurança e Acesso</span>
            </h3>
            <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside leading-relaxed">
              <li>
                <strong className="text-slate-200">Aprovação Obrigatória:</strong> Somente usuários com status <span className="text-emerald-400">Aprovado</span> conseguem visualizar ou copiar prompts.
              </li>
              <li>
                <strong className="text-slate-200">Bloqueio de E-mail:</strong> Usuários com status <span className="text-rose-400">Bloqueado</span> continuam registrados no Supabase para impedir que recriem uma conta usando o mesmo e-mail.
              </li>
              <li>
                <strong className="text-slate-200">Exclusão Definitiva:</strong> Ao excluir um usuário, todos os seus dados e o vínculo em <code className="text-purple-300">auth.users</code> são apagados do banco.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Modal Reutilizável de Confirmação */}
      <ConfirmActionModal
        isOpen={confirmModalData.isOpen}
        title={confirmModalData.title}
        description={confirmModalData.description}
        actionType={confirmModalData.actionType}
        confirmLabel={confirmModalData.confirmLabel}
        loading={!!actionLoading}
        onConfirm={async () => {
          await confirmModalData.onConfirm();
          setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
        }}
        onClose={() => setConfirmModalData((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

