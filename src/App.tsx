import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Plus,
  User as UserIcon,
  Sparkles,
  Layers,
  LogOut,
  Shield,
  Loader2,
  RefreshCw,
  Clock,
  ShieldAlert,
  Users
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { PromptCard } from './components/PromptCard';
import { PromptDetailsModal } from './components/PromptDetailsModal';
import { CreatePromptModal } from './components/CreatePromptModal';
import { LoginModal } from './components/LoginModal';
import { AdminDashboardView } from './components/AdminDashboardView';
import { ConfirmActionModal } from './components/ConfirmActionModal';
import { categoriesService, promptsService } from './services/promptService';
import type { Database } from './types/database.types';

type CategoryItem = Database['public']['Tables']['categories']['Row'];
type PromptItem = Database['public']['Tables']['prompts']['Row'];

export const App: React.FC = () => {
  const { user, profile, isAdmin, isApproved, isPending, isLoading, signOut, refreshProfile } = useAuth();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<'UGC' | 'POV' | null>(null);
  const [selectedVideoStructure, setSelectedVideoStructure] = useState<'GANCHO' | 'MOVIMENTO' | 'CTA' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'title'>('created_at');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;
  const observerTarget = useRef<HTMLDivElement | null>(null);

  // Modais e Telas
  const [currentView, setCurrentView] = useState<'library' | 'admin'>('library');
  const [activePromptDetails, setActivePromptDetails] = useState<PromptItem | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [deletePromptModal, setDeletePromptModal] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: '',
  });

  const handleDeletePrompt = async (promptId: string) => {
    try {
      await promptsService.deletePrompt(promptId);
      setPrompts((prev) => prev.filter((p) => p.id !== promptId));
      setDeletePromptModal({ isOpen: false, id: '', title: '' });
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir prompt.');
    }
  };

  // Carregar dados iniciais (Página 1 com 10 prompts)
  const loadData = async () => {
    if (!user || !isApproved) return;

    try {
      setLoading(true);
      setPage(1);
      const [fetchedCats, searchRes] = await Promise.allSettled([
        categoriesService.listCategories(),
        promptsService.searchPrompts({
          query: searchQuery || undefined,
          categoryId: selectedCategory || undefined,
          sortBy,
          sortOrder: 'desc',
          page: 1,
          pageSize: PAGE_SIZE,
        }),
      ]);

      if (fetchedCats.status === 'fulfilled') {
        // Filtrar apenas Imagens e Vídeos
        const allowedCats = fetchedCats.value.filter(
          (c) => c.slug === 'imagens' || c.slug === 'videos'
        );
        setCategories(allowedCats.length > 0 ? allowedCats : fetchedCats.value);
      }

      if (
        searchRes.status === 'fulfilled' &&
        searchRes.value &&
        searchRes.value.prompts
      ) {
        const results = searchRes.value.prompts as PromptItem[];
        setPrompts(results);
        setHasMore(results.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Erro ao buscar dados do banco:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar mais 10 prompts ao rolar para baixo (Infinite Scroll)
  const loadMorePrompts = async () => {
    if (loading || loadingMore || !hasMore || !user || !isApproved) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const res = await promptsService.searchPrompts({
        query: searchQuery || undefined,
        categoryId: selectedCategory || undefined,
        sortBy,
        sortOrder: 'desc',
        page: nextPage,
        pageSize: PAGE_SIZE,
      });

      if (res && res.prompts && res.prompts.length > 0) {
        setPrompts((prev) => {
          // Prevenir itens duplicados caso haja sobreposição
          const existingIds = new Set(prev.map((p) => p.id));
          const newItems = (res.prompts as PromptItem[]).filter((p) => !existingIds.has(p.id));
          return [...prev, ...newItems];
        });
        setPage(nextPage);
        setHasMore(res.prompts.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Erro ao carregar mais prompts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Observador de scroll para ativar o carregamento automático dos próximos 10
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMorePrompts();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading, loadingMore, page, selectedCategory, searchQuery, sortBy]);

  useEffect(() => {
    if (user?.id && isApproved) {
      loadData();
    }
  }, [user?.id, isApproved, selectedCategory, sortBy]);

  // Enquanto o Supabase restaura a sessão salva no localStorage, exibe tela de carregamento suave
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0c0d12] flex flex-col justify-center items-center">
        <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-3 animate-pulse">
          <Sparkles className="w-5 h-5" />
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
      </div>
    );
  }

  // Se o usuário não estiver logado, exibe diretamente o card centralizado limpo de login / criação de conta
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0c0d12] text-slate-100 flex flex-col justify-center items-center p-4">
        <LoginModal
          isOpen={true}
          onSuccess={() => { }}
        />
      </div>
    );
  }

  // Se o usuário estiver logado, mas aguardando aprovação
  if (isPending) {
    return (
      <div className="min-h-screen bg-[#0c0d12] text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-[#131522] border border-[#23273e] rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7 animate-pulse" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">Cadastro em Análise</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Olá, <strong className="text-purple-300">{profile?.display_name || user.email}</strong>!
              Sua conta com o e-mail <span className="font-mono text-slate-300">{user.email}</span> foi criada com sucesso, mas requer a aprovação do Administrador para acessar a biblioteca.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0e1019] border border-[#1f2233] text-xs text-slate-400 text-left space-y-1.5">
            <p className="font-medium text-slate-300">Próximos passos:</p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
              <li>O administrador avaliará seu cadastro.</li>
              <li>Assim que aprovado, o acesso completo será liberado automaticamente.</li>
            </ul>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refreshProfile()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Verificar Aprovação</span>
            </button>
            <button
              onClick={() => signOut()}
              className="py-2.5 px-4 rounded-xl border border-slate-700/80 hover:bg-white/5 text-slate-300 text-xs font-medium transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Se a conta tiver sido bloqueada pelo admin
  if (profile?.status === 'blocked') {
    return (
      <div className="min-h-screen bg-[#0c0d12] text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-[#131522] border border-rose-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">Acesso Bloqueado</h2>
            <p className="text-xs text-slate-400 mt-2">
              A conta associada ao e-mail <span className="font-mono text-slate-300">{user.email}</span> foi bloqueada pela administração e seu acesso está revogado.
            </p>
          </div>

          <button
            onClick={() => signOut()}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1c1f30] hover:bg-[#252940] text-slate-300 text-xs font-medium transition-colors"
          >
            Encerrar Sessão
          </button>
        </div>
      </div>
    );
  }

  // TELA PRINCIPAL (Para usuários APROVADOS ou ADMINS)
  const currentCategoryObj = categories.find((c) => c.id === selectedCategory);
  const isViewingVideos =
    currentCategoryObj?.slug === 'videos' ||
    currentCategoryObj?.name?.toLowerCase().includes('vídeo') ||
    currentCategoryObj?.name?.toLowerCase().includes('video');

  const filteredPrompts = prompts.filter((p) => {
    if (selectedCategory && p.category_id !== selectedCategory) return false;
    if (selectedStyle && (!p.tags || !p.tags.includes(selectedStyle))) return false;
    if (selectedVideoStructure && (!p.tags || !p.tags.includes(selectedVideoStructure))) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      p.content.toLowerCase().includes(q) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="min-h-screen bg-[#0c0d12] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* 1. Header Superior */}
      <header className="sticky top-0 z-40 bg-[#0c0d12]/90 backdrop-blur-md border-b border-[#1b1e2c] px-3 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/50 shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight leading-none">
              WellPrompts
            </h1>
            <span className="text-[9px] sm:text-[10px] text-purple-400 font-mono tracking-wide hidden xs:inline block">
              TKSHOP CURATED PROMPTS
            </span>
          </div>
        </div>

        {/* Busca Central (Desktop / Tablet) */}
        <div className="flex-1 max-w-xs md:max-w-md hidden md:flex items-center relative mx-2">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar prompts, modelos, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 rounded-xl bg-[#131520] border border-[#23273c] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button
            onClick={() => loadData()}
            className="absolute right-3 text-slate-500 hover:text-white"
            title="Recarregar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Ações Desktop / Tablet */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Botão Novo Prompt (visível de tablet em diante para admin) */}
          {isAdmin && (
            <button
              onClick={() => {
                setEditingPrompt(null);
                setIsCreateOpen(true);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Novo Prompt</span>
              <span className="md:hidden">Novo</span>
            </button>
          )}

          {/* Botão Alternar Painel Admin / Biblioteca (visível de tablet em diante para admin) */}
          {isAdmin && (
            <button
              onClick={() => setCurrentView(currentView === 'admin' ? 'library' : 'admin')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${
                currentView === 'admin'
                  ? 'bg-purple-950/60 text-purple-300 border-purple-500/50 shadow-sm shadow-purple-950/40'
                  : 'bg-[#131520] text-slate-300 border-[#23273c] hover:bg-[#1c1f30] hover:text-white'
              }`}
            >
              {currentView === 'admin' ? (
                <>
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Ver Biblioteca</span>
                  <span className="md:hidden">Biblioteca</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden md:inline">Painel Admin</span>
                  <span className="md:hidden">Admin</span>
                </>
              )}
            </button>
          )}

          {/* Avatar do Usuário */}
          <div
            title={profile?.display_name || user.email || ''}
            className="w-8 h-8 rounded-xl bg-purple-700/80 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-white shadow-md cursor-default shrink-0"
          >
            {profile?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
          </div>

          {/* Botão Sair da Conta (visível em tablet e PC) */}
          <button
            onClick={() => setShowLogoutModal(true)}
            title="Sair da conta"
            className="hidden sm:inline-flex items-center justify-center p-2 rounded-xl bg-[#131520] hover:bg-rose-950/40 border border-[#23273c] hover:border-rose-800/50 text-slate-400 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Campo de busca no mobile / tablet vertical */}
      <div className="md:hidden px-4 pt-3">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar prompts, modelos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#131520] border border-[#23273c] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={() => loadData()}
            className="absolute right-3 text-slate-500 hover:text-white"
            title="Recarregar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SE FOR VISÃO DE ADMIN, MOSTRA O DASHBOARD ADMIN */}
      {currentView === 'admin' && isAdmin ? (
        <AdminDashboardView
          onOpenCreatePrompt={() => {
            setEditingPrompt(null);
            setIsCreateOpen(true);
          }}
          onEditPrompt={(prompt) => {
            setEditingPrompt(prompt);
            setIsCreateOpen(true);
          }}
        />
      ) : (
        <>
          {/* 3. Categorias em Pílulas & Subcategoria de Estilo */}
          <div className="px-3 sm:px-6 md:px-8 pt-3 sm:pt-4 pb-2 space-y-2.5">
            {/* Linha 1: Categorias Principais */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all ${selectedCategory === null
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 border border-purple-400'
                  : 'bg-[#131520] text-slate-400 border border-[#23273c] hover:bg-[#1a1d2e]'
                  }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Todos</span>
              </button>

              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all ${isSelected
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 border border-purple-400'
                      : 'bg-[#131520] text-slate-400 border border-[#23273c] hover:bg-[#1a1d2e]'
                      }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Linha 2: Subcategorias de Estilo (UGC / POV) */}
            <div className="flex items-center gap-2 text-xs overflow-x-auto no-scrollbar pb-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                Estilo:
              </span>
              <button
                onClick={() => setSelectedStyle(null)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all ${selectedStyle === null
                  ? 'bg-[#1d2033] text-purple-300 border border-purple-700/60'
                  : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                Todos os Estilos
              </button>
              {(['UGC', 'POV'] as const).map((style) => {
                const isSelected = selectedStyle === style;
                return (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(isSelected ? null : style)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${isSelected
                      ? 'bg-cyan-600 text-white border border-cyan-400 shadow-md shadow-cyan-950/40'
                      : 'bg-[#131520] text-slate-400 border border-[#23273c] hover:text-white'
                      }`}
                  >
                    {style}
                  </button>
                );
              })}
            </div>

            {/* Linha 3: Filtro de Estrutura de Vídeo (GANCHO, MOVIMENTO, CTA) quando estiver na categoria Vídeos */}
            {isViewingVideos && (
              <div className="flex items-center gap-2 text-xs pt-0.5 overflow-x-auto no-scrollbar pb-1 animate-in fade-in duration-200">
                <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider shrink-0">
                  Etapa:
                </span>
                <button
                  onClick={() => setSelectedVideoStructure(null)}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all ${selectedVideoStructure === null
                    ? 'bg-purple-950/60 text-purple-300 border border-purple-700/60'
                    : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                  Todas as Etapas
                </button>
                {(['GANCHO', 'MOVIMENTO', 'CTA'] as const).map((structure) => {
                  const isSelected = selectedVideoStructure === structure;
                  return (
                    <button
                      key={structure}
                      onClick={() =>
                        setSelectedVideoStructure(isSelected ? null : structure)
                      }
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${isSelected
                        ? 'bg-purple-600 text-white border border-purple-400 shadow-sm shadow-purple-950/50'
                        : 'bg-[#131520] text-slate-400 border border-[#23273c] hover:text-white'
                        }`}
                    >
                      {structure}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Contador de Prompts & Ordenação */}
          <div className="px-3 sm:px-6 md:px-8 py-2.5 sm:py-3 flex items-center justify-between text-xs text-slate-400 border-b border-[#181a28]">
            <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400">
              <span className="font-bold text-slate-200">{filteredPrompts.length}</span> PROMPTS CURADOS
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <span className="hidden xs:inline">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#131520] border border-[#23273c] rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
              >
                <option value="created_at">Mais recentes</option>
                <option value="title">Alfabética</option>
              </select>
            </div>
          </div>

          {/* 5. Grade de Prompts (PromptGrid) */}
          <main className="flex-1 px-3 sm:px-6 md:px-8 py-4 sm:py-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-2" />
                <p className="text-xs">Carregando acervo de prompts...</p>
              </div>
            ) : filteredPrompts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#151724] border border-[#24283f] flex items-center justify-center text-slate-400 mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">Nenhum prompt encontrado</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Tente redefinir os filtros ou buscar por outras palavras-chave.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-medium"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3.5 md:gap-4 lg:gap-5">
                {filteredPrompts.map((prompt) => {
                  const cat = categories.find((c) => c.id === prompt.category_id);
                  return (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      categoryName={cat?.name}
                      isAdmin={isAdmin}
                      onOpenDetails={(p) => setActivePromptDetails(p)}
                      onEditPrompt={(p) => {
                        setEditingPrompt(p);
                        setIsCreateOpen(true);
                      }}
                      onDeletePrompt={(id) =>
                        setDeletePromptModal({
                          isOpen: true,
                          id,
                          title: prompt.title,
                        })
                      }
                    />
                  );
                })}
              </div>
            )}

            {/* Elemento Sentinela para o Scroll Infinito */}
            {!loading && filteredPrompts.length > 0 && (
              <div ref={observerTarget} className="w-full py-6 flex flex-col items-center justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-xs text-purple-400 bg-[#131520] border border-[#23273c] px-4 py-2 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Carregando mais prompts...</span>
                  </div>
                )}
                {!hasMore && (
                  <p className="text-[11px] text-slate-500 font-mono tracking-wide">
                    ✓ Todos os prompts foram carregados
                  </p>
                )}
              </div>
            )}
          </main>
        </>
      )}

      {/* 6. Barra Mobile com Acesso à Área Admin exclusivo para o Admin */}
      <nav className="sm:hidden sticky bottom-0 z-40 bg-[#0c0d12]/95 backdrop-blur-md border-t border-[#1b1e2c] px-6 py-2.5 flex items-center justify-between text-[11px] text-slate-400">
        <button
          onClick={() => {
            setCurrentView('library');
            setSelectedCategory(null);
            setSearchQuery('');
          }}
          className={`flex flex-col items-center gap-1 font-medium transition-colors ${currentView === 'library' ? 'text-purple-400' : 'text-slate-400 hover:text-white'
            }`}
        >
          <Layers className="w-4 h-4" />
          <span>Biblioteca</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setCurrentView(currentView === 'admin' ? 'library' : 'admin')}
            className={`flex flex-col items-center gap-1 font-medium transition-colors ${currentView === 'admin' ? 'text-purple-400' : 'text-slate-400 hover:text-white'
              }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin</span>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => {
              setEditingPrompt(null);
              setIsCreateOpen(true);
            }}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white"
          >
            <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white -mt-3 shadow-lg shadow-purple-900/60 border-2 border-[#0c0d12]">
              <Plus className="w-4 h-4" />
            </div>
            <span>Novo</span>
          </button>
        )}

        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-rose-400"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </nav>

      {/* Modais */}
      {activePromptDetails && (
        <PromptDetailsModal
          prompt={activePromptDetails}
          categoryName={
            categories.find((c) => c.id === activePromptDetails.category_id)?.name
          }
          onClose={() => setActivePromptDetails(null)}
        />
      )}

      {isCreateOpen && (
        <CreatePromptModal
          categories={categories}
          promptToEdit={editingPrompt}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingPrompt(null);
          }}
          onSuccess={() => {
            setIsCreateOpen(false);
            setEditingPrompt(null);
            loadData();
          }}
        />
      )}

      {/* Modal de Confirmação de Logout */}
      <ConfirmActionModal
        isOpen={showLogoutModal}
        title="Encerrar Sessão"
        description="Tem certeza que deseja sair da sua conta na plataforma PromptHub?"
        actionType="logout"
        confirmLabel="Sair da Conta"
        cancelLabel="Permanecer"
        onConfirm={async () => {
          setShowLogoutModal(false);
          await signOut();
        }}
        onClose={() => setShowLogoutModal(false)}
      />

      {/* Modal de Confirmação de Exclusão de Prompt na Biblioteca */}
      <ConfirmActionModal
        isOpen={deletePromptModal.isOpen}
        title="Excluir Prompt"
        description={`Tem certeza que deseja excluir o prompt "${deletePromptModal.title}"? Esta ação é definitiva e removerá o item do Supabase.`}
        actionType="delete"
        confirmLabel="Excluir Definitivamente"
        cancelLabel="Cancelar"
        onConfirm={() => handleDeletePrompt(deletePromptModal.id)}
        onClose={() => setDeletePromptModal({ isOpen: false, id: '', title: '' })}
      />
    </div>
  );
};

export default App;
