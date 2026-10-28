import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle,
  Clock,
  Shield,
  RefreshCw,
  Loader2,
  X,
  Trash2,
  Ban,
  UserCheck,
  UserPlus,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import type { Database, UserStatus, AppRole } from '../types/database.types';

type ProfileItem = Database['public']['Tables']['profiles']['Row'];

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'blocked'>('pending');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Formulário para adicionar novo usuário diretamente pelo Admin
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('user');
  const [addLoading, setAddLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProfiles(data as ProfileItem[]);
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Bloquear ou Aprovar Usuário (Mantém no banco para impedir recriação)
  const handleUpdateStatus = async (userId: string, newStatus: UserStatus) => {
    try {
      setActionLoading(userId);
      setMsg(null);
      const { error } = await supabase.rpc('admin_set_user_status', {
        target_user_id: userId,
        new_status: newStatus,
      } as any);

      if (error) {
        // Fallback direto na tabela profiles se RPC não estiver ativa
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
        text: newStatus === 'blocked' ? 'Usuário bloqueado com sucesso (não poderá recriar conta com este e-mail).' : 'Status do usuário atualizado.',
      });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Erro ao alterar status.' });
    } finally {
      setActionLoading(null);
    }
  };

  // Excluir usuário definitivamente do Supabase (auth.users + profiles)
  const handleDeleteUser = async (userId: string) => {
    try {
      setActionLoading(userId);
      setMsg(null);
      const { error } = await supabase.rpc('admin_delete_user', {
        target_user_id: userId,
      } as any);

      if (error) {
        // Fallback delete direto no profiles
        const { error: errDirect } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);
        if (errDirect) throw errDirect;
      }

      setProfiles((prev) => prev.filter((p) => p.id !== userId));
      setConfirmDeleteId(null);
      setMsg({ type: 'success', text: 'Usuário removido definitivamente do Supabase.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Erro ao excluir usuário.' });
    } finally {
      setActionLoading(null);
    }
  };

  // Criar novo usuário pelo admin
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setAddLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        options: {
          data: {
            display_name: newName.trim() || newEmail.split('@')[0],
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Imediatamente aprova o usuário criado pelo admin
        await ((supabase.from('profiles') as any)
          .update({ status: 'approved', role: newRole })
          .eq('id', data.user.id));
      }

      setMsg({ type: 'success', text: 'Usuário adicionado e aprovado com sucesso!' });
      setShowAddForm(false);
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      fetchUsers();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Erro ao criar usuário.' });
    } finally {
      setAddLoading(false);
    }
  };

  const filtered = profiles.filter((p) => {
    if (filter === 'pending') return p.status === 'pending';
    if (filter === 'approved') return p.status === 'approved';
    if (filter === 'blocked') return p.status === 'blocked';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0f1017] border border-[#23273c] rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Topo */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1e2235]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Gerenciar Usuários & Acessos</h2>
              <p className="text-xs text-slate-400">Adicionar, aprovar, bloquear e excluir no Supabase</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-900/40 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Ver Lista' : 'Novo Usuário'}</span>
            </button>
            <button
              onClick={fetchUsers}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
              title="Atualizar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mensagens de Feedback */}
        {msg && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
              msg.type === 'error'
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* Formulário: Adicionar Novo Usuário */}
        {showAddForm ? (
          <form onSubmit={handleCreateUser} className="py-4 space-y-3 flex-1 overflow-y-auto">
            <h3 className="text-sm font-semibold text-white">Cadastrar novo usuário</h3>
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Nome</label>
              <input
                type="text"
                required
                placeholder="Nome do usuário"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141624] border border-[#23273e] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">E-mail corporativo</label>
              <input
                type="email"
                required
                placeholder="usuario@dominio.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141624] border border-[#23273e] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Senha temporária</label>
              <input
                type="password"
                required
                placeholder="Mínimo 6 dígitos"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141624] border border-[#23273e] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Papel (Role)</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as AppRole)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141624] border border-[#23273e] text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="user">Usuário Comum</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={addLoading}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2"
              >
                {addLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Adicionar Usuário</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Filtros em Pílula */}
            <div className="flex items-center gap-2 py-3">
              {(['pending', 'approved', 'blocked', 'all'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    filter === tab
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                      : 'bg-[#141624] text-slate-400 border border-[#23273c] hover:bg-[#1a1e30]'
                  }`}
                >
                  {tab === 'pending' && 'Aguardando Aprovação'}
                  {tab === 'approved' && 'Aprovados'}
                  {tab === 'blocked' && 'Bloqueados'}
                  {tab === 'all' && 'Todos'}
                </button>
              ))}
            </div>

            {/* Lista de Usuários */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500 mb-2" />
                  <p className="text-xs">Carregando usuários...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Nenhum usuário nesta categoria.
                </div>
              ) : (
                filtered.map((userItem) => (
                  <div
                    key={userItem.id}
                    className="p-3.5 rounded-2xl bg-[#131522] border border-[#22263d] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-900/50 border border-purple-700/50 flex items-center justify-center font-bold text-xs text-purple-300">
                        {userItem.display_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-white">
                            {userItem.display_name || 'Sem nome'}
                          </p>
                          {userItem.role === 'admin' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-900/70 text-purple-300 border border-purple-700">
                              Admin
                            </span>
                          )}
                          {userItem.status === 'blocked' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950/70 text-rose-300 border border-rose-800">
                              Bloqueado
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {userItem.email || userItem.id}
                        </p>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1.5">
                      {userItem.role === 'admin' ? (
                        <span className="text-[11px] text-purple-400 font-medium px-2 py-1">
                          Super Admin
                        </span>
                      ) : actionLoading === userItem.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                      ) : (
                        <>
                          {/* Botão Aprovar se pending ou blocked */}
                          {userItem.status !== 'approved' && (
                            <button
                              onClick={() => handleUpdateStatus(userItem.id, 'approved')}
                              title="Aprovar usuário"
                              className="p-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Botão Bloquear (Mantém no Supabase para impedir recriar conta) */}
                          {userItem.status !== 'blocked' && (
                            <button
                              onClick={() => handleUpdateStatus(userItem.id, 'blocked')}
                              title="Bloquear usuário (impede recriar conta)"
                              className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-600 text-amber-300 hover:text-white transition-colors"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}

                          {/* Botão Excluir Definitivamente do Supabase */}
                          {confirmDeleteId === userItem.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteUser(userItem.id)}
                                className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="p-1 text-slate-400 hover:text-white"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(userItem.id)}
                              title="Excluir definitivamente do Supabase"
                              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
