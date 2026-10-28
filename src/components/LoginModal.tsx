import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const isValidEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const trimmedEmail = email.trim().toLowerCase();

    if (!isValidEmail(trimmedEmail)) {
      setErrorMsg('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              display_name: displayName.trim() || trimmedEmail.split('@')[0],
            },
          },
        });

        if (error) {
          if (error.message.includes('already registered') || error.message.includes('User already registered')) {
            throw new Error('Este e-mail já está cadastrado no sistema.');
          }
          throw error;
        }

        if (data.user && data.user.identities && data.user.identities.length === 0) {
          throw new Error('Este e-mail já está em uso.');
        }

        setInfoMsg('Conta criada com sucesso! Aguarde a aprovação do Administrador.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('E-mail ou senha incorretos.');
          }
          throw error;
        }

        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-[#11131c] border border-[#23273c] rounded-3xl p-6 sm:p-7 shadow-2xl relative">
      {/* Topo / Header com Logo e Acesso */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-white tracking-tight text-base">PromptHub</span>
        </div>

        <div className="px-2.5 py-1 rounded-full bg-[#181a29] border border-[#262b42] text-[10px] text-slate-300 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>Acesso Restrito</span>
        </div>
      </div>

      {/* Ícone Central */}
      <div className="flex justify-center mb-3">
        <div className="w-12 h-12 rounded-2xl bg-[#171926] border border-[#2b304d] flex items-center justify-center shadow-lg shadow-purple-950/40">
          <Lock className="w-5 h-5 text-purple-400" />
        </div>
      </div>

      {/* Título & Subtítulo */}
      <div className="text-center mb-5">
        <h2 className="text-xl font-bold text-white tracking-tight">
          {isSignUp ? 'Criar Conta' : 'Entrar na Plataforma'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {isSignUp
            ? 'Preencha seus dados para solicitar acesso'
            : 'Digite seu e-mail e senha para continuar'}
        </p>
      </div>

      {/* Alertas de Erro / Sucesso */}
      {errorMsg && (
        <div className="mb-3.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {infoMsg && (
        <div className="mb-3.5 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-200 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-purple-400 mt-0.5" />
          <span>{infoMsg}</span>
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {isSignUp && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Nome completo</label>
            <input
              type="text"
              required
              placeholder="Seu nome"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#151726] border border-[#24283e] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">E-mail</label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 w-4 h-4 text-slate-500" />
            <input
              type="email"
              required
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#151726] border border-[#24283e] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Senha</label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 w-4 h-4 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#151726] border border-[#24283e] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>{isSignUp ? 'Solicitar Acesso' : 'Entrar'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Alternar entre Login e Cadastro */}
      <div className="mt-4 pt-3 border-t border-[#1e2235] text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setErrorMsg('');
            setInfoMsg('');
          }}
          className="text-xs text-slate-400 hover:text-purple-300 transition-colors"
        >
          {isSignUp
            ? 'Já possui cadastro? Clique aqui para entrar'
            : 'Não possui conta? Clique para solicitar acesso'}
        </button>
      </div>
    </div>
  );
};
