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
import { AdminUsersModal } from './components/AdminUsersModal';
import { categoriesService, promptsService } from './services/promptService';
import type { Database } from './types/database.types';

type CategoryItem = Database['public']['Tables']['categories']['Row'];
type PromptItem = Database['public']['Tables']['prompts']['Row'];

export const App: React.FC = () => {
  const { user, profile, isAdmin, isApproved, isPending, signOut, refreshProfile } = useAuth();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'title'>('created_at');
  const [loading, setLoading] = useState(false);

  // Modais
  const [activePromptDetails, setActivePromptDetails] = useState<PromptItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminUsersOpen, setIsAdminUsersOpen] = useState(false);

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
        setCategories(fetchedCats.value);
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

  // Se a conta tiver sido rejeitada pelo admin
  if (profile?.status === 'rejected') {
    return (
      <div className="min-h-screen bg-[#0c0d12] text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-[#131522] border border-rose-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">Acesso Não Aprovado</h2>
            <p className="text-xs text-slate-400 mt-2">
              A solicitação de acesso para a conta <span className="font-mono text-slate-300">{user.email}</span> foi recusada pela administração da plataforma.
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

        {/* Busca Central */}
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

        {/* Ações da Direita */}
        <div className="flex items-center gap-2.5">
          {/* Painel de Gestão de Usuários (Exclusivo Admin) */}
          {isAdmin && (
            <button
              onClick={() => setIsAdminUsersOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#181a29] hover:bg-[#20243b] text-purple-300 border border-purple-800/50 font-medium text-xs transition-colors"
              title="Gerenciar cadastros e aprovações"
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">Aprovações</span>
            </button>
          )}

          {/* Botão Novo Prompt (Admin) */}
          {isAdmin && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-md shadow-purple-900/40 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Prompt</span>
            </button>
          )}

          {/* Perfil & Logout */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-[#141624] border border-[#23273c] flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-700 flex items-center justify-center text-xs font-bold text-white">
                {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-semibold text-white leading-tight">
                  {profile?.display_name || user.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-purple-400 capitalize flex items-center gap-1">
                  {isAdmin && <Shield className="w-2.5 h-2.5 text-purple-400" />}
                  <span>{profile?.role || 'Usuário'}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              title="Sair"
              className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
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

      {/* 3. Categorias em Pílulas */}
      <div className="px-4 sm:px-8 pt-4 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
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
                  onOpenDetails={(p) => setActivePromptDetails(p)}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* 6. Barra Mobile */}
      <nav className="sm:hidden sticky bottom-0 z-40 bg-[#0c0d12]/95 backdrop-blur-md border-t border-[#1b1e2c] px-6 py-2.5 flex items-center justify-between text-[11px] text-slate-400">
        <button
          onClick={() => {
            setSelectedCategory(null);
            setSearchQuery('');
          }}
          className="flex flex-col items-center gap-1 text-purple-400 font-medium"
        >
          <Layers className="w-4 h-4" />
          <span>Biblioteca</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setIsCreateOpen(true)}
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
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            loadData();
          }}
        />
      )}

      <AdminUsersModal
        isOpen={isAdminUsersOpen}
        onClose={() => setIsAdminUsersOpen(false)}
      />
    </div>
  );
};

export default App;
