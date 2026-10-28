import React, { useState, useEffect } from 'react';
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
import { categoriesService, promptsService } from './services/promptService';
import type { Database } from './types/database.types';

type CategoryItem = Database['public']['Tables']['categories']['Row'];
type PromptItem = Database['public']['Tables']['prompts']['Row'];

export const App: React.FC = () => {
  const { user, profile, isAdmin, isApproved, isPending, signOut, refreshProfile } = useAuth();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<'UGC' | 'POV' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'title'>('created_at');
  const [loading, setLoading] = useState(false);

  // Modais e Telas
  const [currentView, setCurrentView] = useState<'library' | 'admin'>('library');
  const [activePromptDetails, setActivePromptDetails] = useState<PromptItem | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleDeletePrompt = async (promptId: string) => {
    try {
      await promptsService.deletePrompt(promptId);
      setPrompts((prev) => prev.filter((p) => p.id !== promptId));
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir prompt.');
    }
  };

  // Carregar dados reais apenas se autenticado e aprovado
  const loadData = async () => {
    if (!user || !isApproved) return;

    try {
      setLoading(true);
      const [fetchedCats, searchRes] = await Promise.allSettled([
        categoriesService.listCategories(),
        promptsService.searchPrompts({
          query: searchQuery || undefined,
          categoryId: selectedCategory || undefined,
          sortBy,
          sortOrder: 'desc',
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
        setPrompts(searchRes.value.prompts as PromptItem[]);
      }
    } catch (err) {
      console.error('Erro ao buscar dados do banco:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isApproved) {
      loadData();
    }
  }, [user, isApproved, selectedCategory, sortBy]);

  // Se o usuário não estiver logado, exibe diretamente o card centralizado limpo de login / criação de conta
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0c0d12] text-slate-100 flex flex-col justify-center items-center p-4">
        <LoginModal
          isOpen={true}
          onSuccess={() => {}}
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
  const filteredPrompts = prompts.filter((p) => {
    if (selectedCategory && p.category_id !== selectedCategory) return false;
    if (selectedStyle && (!p.tags || !p.tags.includes(selectedStyle))) return false;
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
      <header className="sticky top-0 z-40 bg-[#0c0d12]/90 backdrop-blur-md border-b border-[#1b1e2c] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/50">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-none">
              PromptHub
            </h1>
            <span className="text-[10px] text-purple-400 font-mono tracking-wide">
              TKSHOP CURATED PROMPTS
            </span>
          </div>
        </div>

        {/* Busca Central (Desktop) */}
        <div className="flex-1 max-w-md hidden sm:flex items-center relative">
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

        {/* Avatar do Usuário */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-700/80 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-white shadow-md">
            {profile?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      {/* 2. Campo de busca no mobile */}
      <div className="sm:hidden px-4 pt-3">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar prompts, modelos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#131520] border border-[#23273c] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
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
          <div className="px-4 sm:px-8 pt-4 pb-2 space-y-2.5">
            {/* Linha 1: Categorias Principais */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === null
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
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                      isSelected
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
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Estilo:
              </span>
              <button
                onClick={() => setSelectedStyle(null)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedStyle === null
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
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-cyan-600 text-white border border-cyan-400 shadow-md shadow-cyan-950/40'
                        : 'bg-[#131520] text-slate-400 border border-[#23273c] hover:text-white'
                    }`}
                  >
                    {style}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Contador de Prompts & Ordenação */}
          <div className="px-4 sm:px-8 py-3 flex items-center justify-between text-xs text-slate-400 border-b border-[#181a28]">
            <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
              <span className="font-bold text-slate-200">{filteredPrompts.length}</span> PROMPTS CURADOS
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <span>Ordenar:</span>
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
          <main className="flex-1 px-4 sm:px-8 py-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
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
                      onDeletePrompt={(id) => handleDeletePrompt(id)}
                    />
                  );
                })}
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
          className={`flex flex-col items-center gap-1 font-medium transition-colors ${
            currentView === 'library' ? 'text-purple-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Biblioteca</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setCurrentView(currentView === 'admin' ? 'library' : 'admin')}
            className={`flex flex-col items-center gap-1 font-medium transition-colors ${
              currentView === 'admin' ? 'text-purple-400' : 'text-slate-400 hover:text-white'
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
          onClick={() => signOut()}
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
    </div>
  );
};

export default App;
