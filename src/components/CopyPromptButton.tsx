import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyPromptButtonProps {
  content: string;
  variant?: 'primary' | 'secondary' | 'compact' | 'full';
  className?: string;
  onCopied?: () => void;
}

export const CopyPromptButton: React.FC<CopyPromptButtonProps> = ({
  content,
  variant = 'primary',
  className = '',
  onCopied,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita abrir card/detalhes
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
      } else {
        // Fallback acessível para cópia
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      setCopied(true);
      onCopied?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar prompt:', err);
    }
  };

  if (variant === 'full') {
    return (
      <button
        onClick={handleCopy}
        type="button"
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-200 shadow-lg ${
          copied
            ? 'bg-emerald-600 text-white shadow-emerald-900/30'
            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/40'
        } ${className}`}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-200" />
            <span>Copiado com sucesso!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span>Copiar prompt completo</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleCopy}
        type="button"
        title="Copiar prompt"
        className={`p-1.5 rounded-lg border border-slate-700/60 bg-surface-card hover:bg-surface-hover text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs ${className}`}
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Copiado</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      type="button"
      className={`px-3.5 py-1.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all duration-200 ${
        copied
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          : 'bg-purple-600/90 hover:bg-purple-500 text-white shadow-md shadow-purple-900/30'
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>Copiado!</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>Copiar prompt</span>
        </>
      )}
    </button>
  );
};

