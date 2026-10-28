import React from 'react';
import { AlertTriangle, LogOut, Trash2, Edit3, X, Loader2 } from 'lucide-react';

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  actionType?: 'delete' | 'logout' | 'edit' | 'warning';
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  title,
  description,
  actionType = 'delete',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const getIconAndColors = () => {
    switch (actionType) {
      case 'logout':
        return {
          icon: <LogOut className="w-6 h-6 text-purple-400" />,
          bg: 'bg-purple-950/40 border-purple-800/50',
          buttonBg: 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/40',
        };
      case 'edit':
        return {
          icon: <Edit3 className="w-6 h-6 text-cyan-400" />,
          bg: 'bg-cyan-950/40 border-cyan-800/50',
          buttonBg: 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950/40',
        };
      case 'delete':
      default:
        return {
          icon: <Trash2 className="w-6 h-6 text-rose-400" />,
          bg: 'bg-rose-950/40 border-rose-800/50',
          buttonBg: 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40',
        };
    }
  };

  const { icon, bg, buttonBg } = getIconAndColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#12141f] border border-[#23273e] rounded-3xl p-6 shadow-2xl overflow-hidden space-y-4">
        {/* Fechar no topo */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ícone */}
        <div className="flex justify-center">
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-lg ${bg}`}>
            {icon}
          </div>
        </div>

        {/* Título & Descrição */}
        <div className="text-center space-y-1.5">
          <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed px-2">{description}</p>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700/80 hover:bg-white/5 text-xs font-semibold text-slate-300 transition-colors"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-1.5 ${buttonBg}`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

