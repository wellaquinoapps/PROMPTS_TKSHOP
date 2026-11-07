import React, { useState } from 'react';
import { Bookmark, Sparkles, CheckCircle2, Image as ImageIcon, Edit3, Trash2 } from 'lucide-react';
import type { Database } from '../types/database.types';
import { CopyPromptButton } from './CopyPromptButton';

type PromptItem = Database['public']['Tables']['prompts']['Row'];

interface PromptCardProps {
  prompt: PromptItem;
  categoryName?: string;
  isAdmin?: boolean;
  onOpenDetails: (prompt: PromptItem) => void;
  onEditPrompt?: (prompt: PromptItem) => void;
  onDeletePrompt?: (promptId: string) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  categoryName,
  isAdmin = false,
  onOpenDetails,
  onEditPrompt,
  onDeletePrompt,
}) => {
  const [bookmarked, setBookmarked] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  const renderHighlightedContent = (text: string) => {
    const parts = text.split(/(\{\{[^}]+\}\}|\[[A-Z0-9_ -]+\])/g);
    return parts.slice(0, 15).map((part, index) => {
      if (/^(\{\{[^}]+\}\}|\[[A-Z0-9_ -]+\])$/.test(part)) {
        return (
          <span
            key={index}
            className="inline-block px-1 py-0.5 mx-0.5 rounded bg-purple-900/60 border border-purple-500/40 text-purple-200 font-mono text-[10px] sm:text-[11px] font-medium"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div
      onClick={() => onOpenDetails(prompt)}
      className="group relative bg-[#13151f] hover:bg-[#171926] border border-[#23263b] hover:border-purple-500/40 rounded-2xl p-2.5 sm:p-4 transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-purple-950/20 overflow-hidden"
    >
      <div className="flex flex-col flex-1 min-w-0">
        {/* Cabeçalho do Card: Categorias & Ações de Admin */}
        <div className="flex items-start justify-between gap-1 mb-2">
          {/* Tags e Categorias com wrap seguro */}
          <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
            {categoryName && (
              <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-medium bg-[#1d2030] text-slate-300 border border-[#2b3049] truncate max-w-[85px] sm:max-w-none">
                {categoryName}
              </span>
            )}
            {prompt.tags &&
              prompt.tags.slice(0, 2).map((t, idx) => (
                <span
                  key={idx}
                  className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold border truncate max-w-[70px] sm:max-w-none ${
                    t === 'UGC' || t === 'POV'
                      ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50'
                      : t === 'GANCHO' || t === 'MOVIMENTO' || t === 'CTA'
                      ? 'bg-purple-950/80 text-purple-200 border-purple-700/60'
                      : 'bg-purple-950/60 text-purple-300 border border-purple-800/50'
                  }`}
                >
                  {t}
                </span>
              ))}
            {!prompt.is_published && (
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-950/80 text-amber-300 border border-amber-700">
                Rascunho
              </span>
            )}
          </div>

          {/* Botões de Ação do Topo (Admin e Favoritos) */}
          <div className="flex items-center gap-0.5 shrink-0 ml-1">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditPrompt?.(prompt);
                  }}
                  title="Editar prompt"
                  className="p-1 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-white/5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePrompt?.(prompt.id);
                  }}
                  title="Excluir prompt do banco"
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setBookmarked(!bookmarked);
              }}
              title="Salvar nos favoritos"
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <Bookmark
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${bookmarked ? 'fill-purple-500 text-purple-500' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Mídia demonstrativa dinâmica (aspect ratio protegido) */}
        {prompt.media_url && !mediaError && (
          <div className="relative w-full rounded-xl overflow-hidden mb-2 sm:mb-2.5 bg-[#0a0b10] border border-[#23263b] flex items-center justify-center aspect-[9/12] sm:aspect-[9/13]">
            {prompt.media_type === 'video' ? (
              <video
                src={prompt.media_url}
                className="w-full h-full object-cover rounded-xl"
                muted
                loop
                playsInline
                onMouseOver={(e) => e.currentTarget.play()}
                onMouseOut={(e) => e.currentTarget.pause()}
              />
            ) : (
              <img
                src={prompt.media_url}
                alt={prompt.title}
                onError={() => setMediaError(true)}
                className="w-full h-full object-cover rounded-xl transition-transform duration-300"
                loading="lazy"
              />
            )}
            <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[9px] text-slate-200 border border-white/10 flex items-center gap-1 pointer-events-none">
              <ImageIcon className="w-2.5 h-2.5 text-purple-400" />
              <span>Preview</span>
            </div>
          </div>
        )}

        {/* Título */}
        <h3 className="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-purple-300 transition-colors mb-1 line-clamp-1">
          {prompt.title}
        </h3>

        {/* Descrição */}
        {prompt.description && (
          <p className="text-[10px] sm:text-xs text-slate-400 line-clamp-1 mb-2">
            {prompt.description}
          </p>
        )}

        {/* Código do Prompt Preview */}
        <div className="p-2 rounded-xl bg-[#0b0c12] border border-[#1e202e] text-slate-300 font-mono text-[10px] sm:text-xs leading-relaxed max-h-14 sm:max-h-16 overflow-hidden relative mb-2">
          <div className="line-clamp-2">
            {renderHighlightedContent(prompt.content)}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-[#0b0c12] to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Rodapé com botão Copiar */}
      <div className="pt-2 border-t border-[#1e2133] flex items-center justify-between gap-1 shrink-0">
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
          <span className="font-medium text-slate-300 hidden xs:inline">Curado</span>
        </div>

        <CopyPromptButton
          content={prompt.content}
          variant="compact"
        />
      </div>
    </div>
  );
};
