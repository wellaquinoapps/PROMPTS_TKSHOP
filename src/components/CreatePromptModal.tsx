import React, { useState } from 'react';
import {
  X,
  Upload,
  Sparkles,
  Link as LinkIcon,
  Plus,
  Loader2,
  CheckCircle,
  FileCode2,
  Rocket
} from 'lucide-react';
import type { Database, MediaType } from '../types/database.types';
import { promptsService, storageService } from '../services/promptService';
import { ConfirmActionModal } from './ConfirmActionModal';

type CategoryItem = Database['public']['Tables']['categories']['Row'];
type PromptItem = Database['public']['Tables']['prompts']['Row'];

interface CreatePromptModalProps {
  categories: CategoryItem[];
  promptToEdit?: PromptItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreatePromptModal: React.FC<CreatePromptModalProps> = ({
  categories,
  promptToEdit,
  onClose,
  onSuccess,
}) => {
  const [showConfirmEditModal, setShowConfirmEditModal] = useState(false);
  const [title, setTitle] = useState(promptToEdit?.title || '');
  const [description, setDescription] = useState(promptToEdit?.description || '');
  const [content, setContent] = useState(promptToEdit?.content || '');
  const [categoryId, setCategoryId] = useState(promptToEdit?.category_id || categories[0]?.id || '');
  const [styleSubcategory, setStyleSubcategory] = useState<'UGC' | 'POV' | null>(
    (promptToEdit?.tags?.find((t) => t === 'UGC' || t === 'POV') as any) || null
  );
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(
    promptToEdit?.tags?.filter((t) => t !== 'UGC' && t !== 'POV') || ['Midjourney v6']
  );
  const [mediaUrl, setMediaUrl] = useState(promptToEdit?.media_url || '');
  const [mediaType, setMediaType] = useState<MediaType>(promptToEdit?.media_type || 'image');
  const [isPublished, setIsPublished] = useState(promptToEdit?.is_published ?? true);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sugestões de variáveis para inserir rapidamente
  const quickVariables = ['TEMA', 'ESTILO', 'ILUMINAÇÃO', 'ÂNGULO', 'PRODUTO'];

  const handleAddVariable = (varName: string) => {
    setContent((prev) => `${prev} {{${varName}}}`);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('Arquivo muito grande. O limite máximo é de 25MB.');
      return;
    }

    try {
      setUploading(true);
      setErrorMsg('');
      const isVid = file.type.startsWith('video');
      setMediaType(isVid ? 'video' : 'image');

      const res = await storageService.uploadMedia(file, 'prompts');
      setMediaUrl(res.publicUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao realizar upload da mídia.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (publishStatus: boolean) => {
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Título e Conteúdo do prompt são obrigatórios.');
      return;
    }

    // Se estiver editando e ainda não confirmou, abre o modal de confirmação
    if (promptToEdit && !showConfirmEditModal) {
      setShowConfirmEditModal(true);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const combinedTags = styleSubcategory ? [styleSubcategory, ...tags] : tags;

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        content: content.trim(),
        category_id: categoryId || undefined,
        tags: combinedTags,
        media_url: mediaUrl || undefined,
        media_type: mediaUrl ? mediaType : 'none',
        is_published: publishStatus,
      };

      if (promptToEdit) {
        await promptsService.updatePrompt(promptToEdit.id, payload);
      } else {
        await promptsService.createPrompt(payload);
      }

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar o prompt.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0f1017] border border-[#23273c] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Topo do Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2235] bg-[#121420]">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-bold text-white">
                {promptToEdit ? 'Editar Prompt' : 'Criar novo prompt'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isPublished ? 'Modo publicação ativa' : 'Salvo como rascunho'}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(false)}
            className="px-3 py-1.5 rounded-xl border border-slate-700/80 hover:bg-white/5 text-xs text-slate-300 font-medium transition-colors"
          >
            Salvar rascunho
          </button>
        </div>

        {/* Formulário com Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Título */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-200">
                Título do prompt <span className="text-purple-400">*</span>
              </label>
              <span className="text-slate-500 text-[11px]">{title.length}/80</span>
            </div>
            <input
              type="text"
              maxLength={80}
              placeholder="Ex: Retrato Cyberpunk Cinematográfico 8k"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#131522] border border-[#24283e] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Categorias em Pílulas */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">Categoria Principal</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white border border-purple-400 shadow-md shadow-purple-900/40'
                        : 'bg-[#131522] text-slate-300 border border-[#24283e] hover:bg-[#1a1c2d]'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subcategoria de Estilo (UGC / POV) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>Subcategoria de Estilo</span>
              <span className="text-[11px] text-slate-500 font-normal">Opcional</span>
            </label>
            <div className="flex items-center gap-2">
              {(['UGC', 'POV'] as const).map((style) => {
                const isSelected = styleSubcategory === style;
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setStyleSubcategory(isSelected ? null : style)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-cyan-600 text-white border border-cyan-400 shadow-md shadow-cyan-950/40'
                        : 'bg-[#131522] text-slate-300 border border-[#24283e] hover:bg-[#1a1c2d]'
                    }`}
                  >
                    Estilo {style}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Descrição Curta */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-200">Descrição curta</label>
              <span className="text-slate-500 text-[11px]">{description.length}/160</span>
            </div>
            <textarea
              rows={2}
              maxLength={160}
              placeholder="Resuma o objetivo e os melhores casos de uso deste comando..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#131522] border border-[#24283e] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          {/* Conteúdo do Prompt com Injeção de Variáveis */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-200">
                Conteúdo do prompt <span className="text-purple-400">*</span>
              </label>
              <span className="text-purple-400 text-[11px] flex items-center gap-1">
                <FileCode2 className="w-3.5 h-3.5" />
                Variáveis ativas
              </span>
            </div>

            {/* Pílulas de Injeção Rápida */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400">INSERIR:</span>
              {quickVariables.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleAddVariable(v)}
                  className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-700/50 hover:bg-purple-900 text-purple-300 font-mono text-[11px] transition-colors"
                >
                  + [{v}]
                </button>
              ))}
            </div>

            <textarea
              rows={5}
              placeholder="Escreva a estrutura do prompt aqui. Use variáveis entre colchetes como {{TEMA}} para preenchimento dinâmico..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 rounded-xl bg-[#0c0d14] border border-[#24283e] font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors leading-relaxed"
            />
            <p className="text-[11px] text-slate-400">
              Dica: Toque nos botões acima para injetar variáveis com substituição facilitada.
            </p>
          </div>

          {/* Prévia de resultado / Mídia */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-200">
              Prévia de resultado (Mídia) <span className="text-slate-500 font-normal">Opcional</span>
            </label>

            <div className="border border-dashed border-[#2b3049] rounded-2xl p-4 text-center bg-[#11131e] relative">
              {mediaUrl ? (
                <div className="relative rounded-xl overflow-hidden max-h-48 border border-white/10">
                  {mediaType === 'video' ? (
                    <video src={mediaUrl} controls className="w-full h-44 object-cover" />
                  ) : (
                    <img src={mediaUrl} alt="Preview" className="w-full h-44 object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => setMediaUrl('')}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-10 h-10 rounded-full bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400 mb-2">
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                  </div>
                  <label className="cursor-pointer text-xs font-medium text-purple-300 hover:text-purple-200 transition-colors">
                    <span>Toque para enviar imagem ou GIF</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, WebP ou MP4 até 25MB</p>
                </div>
              )}

              {/* Inserir URL Direta */}
              <div className="mt-3 pt-3 border-t border-[#1c1f30] flex items-center gap-2">
                <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="url"
                  placeholder="Ou cole uma URL pública da imagem..."
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Tags & Palavras-chave */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">Tags & Palavras-chave</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Adicionar tag e teclar Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#131522] border border-[#24283e] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-medium"
              >
                +
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[#191c2b] text-purple-200 border border-purple-800/40"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com Publicar */}
        <div className="p-4 sm:p-5 border-t border-[#1e2235] bg-[#121420] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700/70 hover:bg-white/5 text-xs font-medium text-slate-300 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-lg shadow-purple-900/40 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4" />
            )}
            <span>{promptToEdit ? 'Salvar Alterações' : 'Publicar prompt'}</span>
          </button>
        </div>
      </div>

      {/* Modal de Confirmação de Edição */}
      <ConfirmActionModal
        isOpen={showConfirmEditModal}
        title="Confirmar Atualização do Prompt"
        description={`Deseja realmente salvar as alterações feitas no prompt "${title}"? As informações anteriores serão atualizadas no banco de dados.`}
        actionType="edit"
        confirmLabel="Salvar Alterações"
        cancelLabel="Voltar"
        loading={submitting}
        onConfirm={async () => {
          setShowConfirmEditModal(false);
          await handleSubmit(isPublished);
        }}
        onClose={() => setShowConfirmEditModal(false)}
      />
    </div>
  );
};

