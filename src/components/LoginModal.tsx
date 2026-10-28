import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Sparkles,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
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
  const [copiedCli, setCopiedCli] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || email.split('@')[0],
            },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText('npx prompthub login');
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0f1017] border border-[#23273c] rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Topo / Header estilo Badge Enterprise */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-white tracking-tight">PromptHub</span>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-[#161826] border border-[#242940] text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>v2.4.0 • Enterprise</span>
          </div>
        </div>

        {/* Ícone Central com Glow */}
        <div className="flex justify-center mb-4">
          <div className="relative w-14 h-14 rounded-2xl bg-[#171926] border border-[#2b304d] flex items-center justify-center shadow-lg shadow-purple-950/50">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400">
              <Lock className="w-4 h-4" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-purple-500 border-2 border-[#0f1017]" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isSignUp ? 'Criar sua conta' : 'Bem-vindo de volta'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {isSignUp
              ? 'Cadastre-se para acessar e gerenciar a biblioteca de prompts.'
              : 'Acesse sua biblioteca de prompts de alta performance'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Nome de exibição</label>
              <input
                type="text"
                required
                placeholder="Seu nome ou apelido"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141624] border border-[#23273e] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">E-mail de acesso</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="seu.nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#141624] border border-[#23273e] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Senha de acesso</label>
              {!isSignUp && (
                <button
                  type="button"
                  className="text-[11px] text-slate-400 hover:text-purple-300 transition-colors"
                >
                  Esqueci minha senha
                </button>
              )}
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#141624] border border-[#23273e] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
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
                <span>{isSignUp ? 'Criar conta gratuita' : 'Entrar na plataforma'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Alternar entre login e cadastro */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-slate-400 hover:text-purple-300 transition-colors"
          >
            {isSignUp ? 'Já tem uma conta? Entrar' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>

        {/* Rodapé de Segurança */}
        <div className="mt-5 pt-4 border-t border-[#1e2235] flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Criptografia de ponta a ponta • Supabase Auth ready</span>
        </div>

        {/* Caixa Dev CLI */}
        <div className="mt-4 p-2.5 rounded-xl bg-[#0a0a0f] border border-[#1b1e2c] flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>npx prompthub login</span>
          </div>
          <button
            onClick={handleCopyCli}
            className="text-slate-500 hover:text-white transition-colors"
            title="Copiar comando"
          >
            {copiedCli ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-3 w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

