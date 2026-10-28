import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Search,
  RefreshCw,
  Loader2,
  X
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import type { Database, UserStatus } from '../types/database.types';

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
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');

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

  const handleUpdateStatus = async (userId: string, newStatus: UserStatus) => {
    try {
      setActionLoading(userId);
      const { error } = await ((supabase
        .from('profiles') as any)
        .update({ status: newStatus })
        .eq('id', userId));

      if (!error) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === userId ? { ...p, status: newStatus } : p))
        );
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = profiles.filter((p) => {
    if (filter === 'pending') return p.status === 'pending';
    if (filter === 'approved') return p.status === 'approved';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0f1017] border border-[#23273c] rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Topo */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1e2235]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Gerenciar Usuários & Aprovações</h2>
              <p className="text-xs text-slate-400">Controle de acesso à biblioteca de prompts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

        {/* Filtros em Pílula */}
        <div className="flex items-center gap-2 py-3">
          {(['pending', 'approved', 'all'] as const).map((tab) => (
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
                        {userItem.display_name || 'Usuário sem nome'}
                      </p>
                      {userItem.role === 'admin' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-900/70 text-purple-300 border border-purple-700">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {userItem.email || userItem.id}
                    </p>
                  </div>
                </div>

                {/* Ações de Aprovação */}
                <div className="flex items-center gap-1.5">
                  {userItem.role === 'admin' ? (
                    <span className="text-[11px] text-purple-400 font-medium px-2 py-1">
                      Super Admin
                    </span>
                  ) : actionLoading === userItem.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  ) : userItem.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(userItem.id, 'approved')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Aprovar</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(userItem.id, 'rejected')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-medium transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Recusar</span>
                      </button>
                    </>
                  ) : userItem.status === 'approved' ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-md">
                        <CheckCircle className="w-3 h-3" />
                        <span>Aprovado</span>
                      </span>
                      <button
                        onClick={() => handleUpdateStatus(userItem.id, 'pending')}
                        className="text-[10px] text-slate-500 hover:text-slate-300 underline"
                      >
                        Revogar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] text-rose-400 font-medium bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 rounded-md">
                        <XCircle className="w-3 h-3" />
                        <span>Recusado</span>
                      </span>
                      <button
                        onClick={() => handleUpdateStatus(userItem.id, 'approved')}
                        className="text-[10px] text-purple-400 hover:text-purple-300 underline"
                      >
                        Aprovar agora
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
