import React, { useState } from 'react';
import { Bookmark, Sparkles, CheckCircle2, Video, Code, Image as ImageIcon } from 'lucide-react';
import type { Database } from '../types/database.types';
import { CopyPromptButton } from './CopyPromptButton';

type PromptItem = Database['public']['Tables']['prompts']['Row'];

interface PromptCardProps {
  prompt: PromptItem;
  categoryName?: string;
  onOpenDetails: (prompt: PromptItem) => void;
  onSelectTag?: (tag: string) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  categoryName,
  onOpenDetails,
  onSelectTag,
}) => {
  const [bookmarked, setBookmarked] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  // Renderizar o preview de variáveis {{var}} destacadas com estilo roxo/pílula como na imagem
  const renderHighlightedContent = (text: string) => {
    // Quebra por variáveis {{...}} ou [TEMA]
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
      className="group relative bg-[#13151f] hover:bg-[#171926] border border-[#23263b] hover:border-purple-500/40 rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-purple-950/20"
    >
      <div>
        {/* Cabeçalho do Card: Categorias / Badges & Salvar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {categoryName && (
              <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#1d2030] text-slate-300 border border-[#2b3049]">
                {categoryName}
              </span>
            )}
            {/* Modelo de IA ou Badge de Modelo */}
            {prompt.tags && prompt.tags.length > 0 && (
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/50">
                {prompt.tags[0]}
              </span>
            )}
          </div>

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

        {/* Mídia demonstrativa se houver */}
        {prompt.media_url && !mediaError && (
          <div className="relative w-full h-44 rounded-xl overflow-hidden mb-3 bg-[#0c0d12] border border-[#23263b]">
            {prompt.media_type === 'video' ? (
              <video
                src={prompt.media_url}
                className="w-full h-full object-cover"
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
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            )}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] text-slate-200 border border-white/10 flex items-center gap-1">
              <ImageIcon className="w-3 h-3 text-purple-400" />
              <span>Preview</span>
            </div>
          </div>
        )}

        {/* Título */}
        <h3 className="text-base font-semibold text-slate-100 group-hover:text-purple-300 transition-colors mb-2 line-clamp-1">
          {prompt.title}
        </h3>

        {/* Descrição se houver */}
        {prompt.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-3">
            {prompt.description}
          </p>
        )}

        {/* Caixa de Código / Prompt com Variáveis destacadas */}
        <div className="p-3 rounded-xl bg-[#0b0c12] border border-[#1e202e] text-slate-300 font-mono text-xs leading-relaxed max-h-24 overflow-hidden relative">
          <div className="line-clamp-3">
            {renderHighlightedContent(prompt.content)}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#0b0c12] to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Rodapé do Card: Tags, estatísticas e Botão de Cópia */}
      <div className="mt-4 pt-3 border-t border-[#1e2133] flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-medium text-slate-300">Curado</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>Verificado</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <CopyPromptButton
            content={prompt.content}
            variant="compact"
          />
        </div>
      </div>
    </div>
  );
};

