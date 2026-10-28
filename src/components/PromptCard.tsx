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
            className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-purple-900/60 border border-purple-500/40 text-purple-200 font-mono text-[11px] font-medium"
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
      className="group relative bg-[#13151f] hover:bg-[#171926] border border-[#23263b] hover:border-purple-500/40 rounded-2xl p-2.5 sm:p-4 transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-purple-950/20"
    >
      <div>
        {/* Cabeçalho do Card: Categorias & Ações de Admin */}
            <div className="flex items-center justify-between gap-1 sm:gap-2 mb-2 sm:mb-3">
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                {categoryName && (
                    <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-medium bg-[#1d2030] text-slate-300 border border-[#2b3049]">
                      {categoryName}
                    </span>
            )}
                    {prompt.tags && prompt.tags.length > 0 && (
              <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/50">
                {prompt.tags[0]}
              </span>
            )}
            {!prompt.is_published && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950/80 text-amber-300 border border-amber-700">
                Rascunho
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Ações de Edição / Exclusão para Administrador */}
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
                className={`w-4 h-4 ${bookmarked ? 'fill-purple-500 text-purple-500' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Mídia demonstrativa dinâmica (respeita proporção natural 9:16, 16:9, 1:1 sem corte) */}
                {prompt.media_url && !mediaError && (
                    <div className="relative w-full rounded-xl overflow-hidden mb-2.5 sm:mb-3 bg-[#0a0b10] border border-[#23263b] flex items-center justify-center">
                      {prompt.media_type === 'video' ? (
                        <video
                          src={prompt.media_url}
                          className="w-full max-h-56 sm:max-h-96 object-contain rounded-xl"
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
                          className="w-full max-h-56 sm:max-h-96 object-contain rounded-xl transition-transform duration-300"
                          loading="lazy"
                        />
                      )}
                        <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 px-1.5 sm:px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[9px] sm:text-[10px] text-slate-200 border border-white/10 flex items-center gap-1 pointer-events-none">
                          <ImageIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-400" />
                          <span>Preview</span>
                        </div>
                      </div>
        )}

                      {/* Título */}
                        <h3 className="text-xs sm:text-base font-semibold text-slate-100 group-hover:text-purple-300 transition-colors mb-1.5 sm:mb-2 line-clamp-1">
                          {prompt.title}
                        </h3>

                        {/* Descrição */}
                        {prompt.description && (
                            <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1 sm:line-clamp-2 mb-2 sm:mb-3">
                              {prompt.description}
                            </p>
        )}

                            {/* Código do Prompt */}
                                <div className="p-2 sm:p-3 rounded-xl bg-[#0b0c12] border border-[#1e202e] text-slate-300 font-mono text-[10px] sm:text-xs leading-relaxed max-h-16 sm:max-h-24 overflow-hidden relative">
                                  <div className="line-clamp-2 sm:line-clamp-3">
                                    {renderHighlightedContent(prompt.content)}
                                  </div>
                                  <div className="absolute inset-x-0 bottom-0 h-4 sm:h-6 bg-gradient-to-t from-[#0b0c12] to-transparent pointer-events-none" />
                                </div>
                              </div>

                              {/* Rodapé */}
                                  <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-[#1e2133] flex items-center justify-between gap-1 sm:gap-2">
                                    <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-400">
                                      <span className="flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400" />
                                        <span className="font-medium text-slate-300 hidden sm:inline">Curado</span>
                                      </span>
                                        <span className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] text-emerald-400">
                                          <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                          <span className="hidden sm:inline">Verificado</span>
                                        </span>
                                    </div>

                                    <CopyPromptButton
                                      content={prompt.content}
                                      variant="compact"
                                    />
                                  </div>
                                </div>
                                );
};
