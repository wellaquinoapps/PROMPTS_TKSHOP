import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  Heart,
  Share2,
  Sparkles,
  Sliders,
  Terminal,
  RotateCcw,
  Tag,
  Folder,
  Layers,
  ChevronDown
} from 'lucide-react';
import type { Database } from '../types/database.types';
import { CopyPromptButton } from './CopyPromptButton';

type PromptItem = Database['public']['Tables']['prompts']['Row'];

interface PromptDetailsModalProps {
  prompt: PromptItem | null;
  categoryName?: string;
  onClose: () => void;
}

export const PromptDetailsModal: React.FC<PromptDetailsModalProps> = ({
  prompt,
  categoryName,
  onClose,
}) => {
  if (!prompt) return null;

  // Extrair dinamicamente variáveis nos formatos {{nome}} ou [NOME]
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [liked, setLiked] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);

  useEffect(() => {
    const detected: Record<string, string> = {};
    const matches = prompt.content.match(/(\{\{[^}]+\}\}|\[[A-Z0-9_ -]+\])/g);
    if (matches) {
      matches.forEach((m) => {
        const cleanName = m.replace(/[\{\}\[\]]/g, '').trim();
        if (!detected[cleanName]) {
          detected[cleanName] = '';
        }
      });
    }
    setVariables(detected);
  }, [prompt.content]);

  // Gerar conteúdo com as variáveis substituídas em tempo real
  const getProcessedContent = () => {
    let result = prompt.content;
    Object.entries(variables).forEach(([key, val]) => {
      if (val.trim() !== '') {
        const regex1 = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        const regex2 = new RegExp(`\\[${key}\\]`, 'g');
        result = result.replace(regex1, val).replace(regex2, val);
      }
    });
    return result;
  };

  const handleResetVariables = () => {
    const reset: Record<string, string> = {};
    Object.keys(variables).forEach((k) => (reset[k] = ''));
    setVariables(reset);
  };

  const handleCopyRaw = async () => {
    await navigator.clipboard.writeText(prompt.content);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const processedContent = getProcessedContent();
  const hasVariables = Object.keys(variables).length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0f1017] border border-[#23273c] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Topo / Barra de Navegação */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#1e2235] bg-[#121420]/80 sticky top-0 z-10 backdrop-blur-md">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <h2 className="text-sm font-semibold text-slate-200">Detalhes do Prompt</h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLiked(!liked)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: prompt.title, text: prompt.content });
                }
              }}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Mídia em Destaque Dinâmica (respeita proporção natural 9:16, 16:9, etc) */}
          {prompt.media_url && (
            <div className="relative w-full rounded-2xl overflow-hidden bg-[#08090e] border border-[#23273c] flex items-center justify-center">
              {prompt.media_type === 'video' ? (
                <video
                  src={prompt.media_url}
                  controls
                  className="w-full max-h-[500px] object-contain rounded-2xl"
                />
              ) : (
                <img
                  src={prompt.media_url}
                  alt={prompt.title}
                  className="w-full max-h-[500px] object-contain rounded-2xl"
                />
              )}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md text-xs text-slate-300 border border-white/10 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>{categoryName || 'Mídia'}</span>
                {prompt.tags[0] && <span>• {prompt.tags[0]}</span>}
              </div>
            </div>
          )}

          {/* Título & Metadados */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
              {prompt.title}
            </h1>
            <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] text-white font-bold">
                  TK
                </div>
                <span>Curadoria TKShop</span>
              </span>
              <span>•</span>
              <span>Atualizado recentemente</span>
              <span>•</span>
              <span className="text-purple-300 font-medium">Pronto para uso</span>
            </div>
          </div>

          {/* Tags */}
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {prompt.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#161826] text-slate-400 border border-[#252a42]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Terminal / Caixa de Conteúdo do Prompt com Janela estilo Mac */}
          <div className="rounded-2xl border border-[#262940] bg-[#0c0d13] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#141624] border-b border-[#212439]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono text-slate-400 ml-2">prompt.txt</span>
              </div>

              <button
                onClick={handleCopyRaw}
                className="flex items-center gap-1 text-[11px] text-purple-300 hover:text-purple-200 transition-colors"
              >
                {copiedRaw ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado puro!</span>
                  </>
                ) : (
                  <>
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Copiar puro</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 font-mono text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
              {processedContent}
            </div>
          </div>

          {/* Painel: Personalizar Variáveis (caso possua {{var}} ou [VAR]) */}
          {hasVariables && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#141624] border border-[#24283f] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>Personalizar Variáveis</span>
                </div>
                <button
                  onClick={handleResetVariables}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Redefinir</span>
                </button>
              </div>

              <div className="space-y-3">
                {Object.keys(variables).map((varKey) => (
                  <div key={varKey} className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase font-semibold text-purple-300 flex items-center justify-between">
                      <span>[{varKey}]</span>
                      <span className="text-[10px] text-slate-400 font-normal">Substituição dinâmica</span>
                    </label>
                    <input
                      type="text"
                      placeholder={`Ex: Insira o valor para ${varKey}...`}
                      value={variables[varKey]}
                      onChange={(e) =>
                        setVariables((prev) => ({
                          ...prev,
                          [varKey]: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0c0d14] border border-[#262a42] text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dicas de Otimização e Parâmetros */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Dicas de Otimização
            </h4>
            <div className="p-3.5 rounded-xl bg-[#131521] border border-[#21253a] text-xs text-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Compatível com Midjourney v6, ChatGPT-4o e Claude 3.5 Sonnet</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra Fixa Inferior com Ação de Copiar */}
        <div className="p-4 sm:p-5 border-t border-[#1e2235] bg-[#121420] flex items-center gap-3">
          <CopyPromptButton
            content={processedContent}
            variant="full"
          />
        </div>
      </div>
    </div>
  );
};

