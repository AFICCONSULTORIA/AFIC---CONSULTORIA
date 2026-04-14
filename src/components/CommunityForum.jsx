import React, { useState, useEffect, useRef } from 'react';
import { useCommunity } from './CommunityContext';

const fmtDate = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Default cover images per category (served from /covers/) ──
const DEFAULT_COVERS = {
  'Discussão':         '/covers/afic_banner.png',
  'Deal Flow':         '/covers/cover_dealflow.png',
  'Tributário':        '/covers/cover_tributario.png',
  'Macro':             '/covers/cover_macro.png',
  'Tese de Investimento': '/covers/cover_tese.png',
  'Educação':          '/covers/cover_educacao.png',
};
const getCover = (topic) => topic.cover_image_url || DEFAULT_COVERS[topic.category] || '/covers/afic_banner.png';

// ──────────── Confirm Dialog ────────────
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width="20" height="20">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </div>
        <div>
          <p className="font-black text-gray-900 text-sm">Excluir Tópico</p>
          <p className="text-xs text-gray-500 mt-0.5">{message}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2 px-4 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
        <button onClick={onConfirm} className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors">Excluir</button>
      </div>
    </div>
  </div>
);

const useConfirm = () => {
  const [state, setState] = useState({ open: false, message: '', resolve: null });
  const confirm = (message) => new Promise((resolve) => setState({ open: true, message, resolve }));
  const handleConfirm = () => { state.resolve(true); setState({ open: false, message: '', resolve: null }); };
  const handleCancel  = () => { state.resolve(false); setState({ open: false, message: '', resolve: null }); };
  const Dialog = state.open ? <ConfirmDialog message={state.message} onConfirm={handleConfirm} onCancel={handleCancel} /> : null;
  return { confirm, Dialog };
};

// ──────────── Topic List ────────────
const TopicList = ({ onOpenTopic, onNewTopic }) => {
  const { topics, isLoaded, deleteTopic } = useCommunity();
  const { confirm, Dialog } = useConfirm();
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  const CATEGORIES = ['Todos', 'Discussão', 'Deal Flow', 'Tributário', 'Macro', 'Tese de Investimento', 'Educação'];

  const filtered = topics.filter(t => {
    const matchCat = activeCategory === 'Todos' || t.category === activeCategory;
    const q = search.toLowerCase();
    return matchCat && (!q || t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q));
  });

  const countFor = (cat) => cat === 'Todos' ? topics.length : topics.filter(t => t.category === cat).length;

  const handleDelete = async (topicId) => {
    const ok = await confirm('Esta ação removerá o tópico, comentários e curtidas permanentemente.');
    if (!ok) return;
    setDeletingId(topicId);
    await deleteTopic(topicId);
    setDeletingId(null);
  };

  if (!isLoaded) return <div className="text-center p-16 text-gray-400 font-bold animate-pulse">Sincronizando Inteligência Coletiva...</div>;

  return (
    <div className="max-w-5xl mx-auto w-full">
      {Dialog}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Fórum AFIC</h2>
          <p className="text-sm text-gray-400 mt-1">Deal flow, debates e inteligência institucional.</p>
        </div>
        <button onClick={onNewTopic} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-sm flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Tópico
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tópicos por título ou conteúdo..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat;
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'}`}>
              {cat}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>{countFor(cat)}</span>
            </button>
          );
        })}
      </div>

      {(search || activeCategory !== 'Todos') && (
        <p className="text-xs text-gray-400 mb-4">
          {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
          {search && <span> para "<span className="font-semibold text-gray-600">{search}</span>"</span>}
          {activeCategory !== 'Todos' && <span> em <span className="font-semibold text-blue-600">{activeCategory}</span></span>}
        </p>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {filtered.length === 0 && (
          <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400 font-semibold">Nenhuma publicação encontrada.</p>
            <p className="text-xs text-gray-300 mt-2">{search ? `Sem resultados para "${search}"` : 'Seja o primeiro a contribuir.'}</p>
          </div>
        )}

        {filtered.map(topic => {
          const author = topic.nickname || 'Membro AFIC';
          const isDeleting = deletingId === topic.id;
          const cover = getCover(topic);
          return (
            <div key={topic.id} className={`bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 group ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}>
              {/* Cover Image */}
              <div className="relative h-40 overflow-hidden cursor-pointer" onClick={() => onOpenTopic(topic.id)}>
                <img src={cover} alt={topic.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={e => { e.target.src = '/covers/cover_discussao.png'; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <span className="absolute top-3 left-3 text-xs font-bold text-white bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  {topic.category}
                </span>
                {topic.attachment_url && (
                  <span className="absolute top-3 right-3 text-xs font-bold text-amber-300 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    PDF
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-5 cursor-pointer" onClick={() => onOpenTopic(topic.id)}>
                <h3 className="text-base font-black text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">{topic.title}</h3>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{topic.content.substring(0, 140)}{topic.content.length > 140 ? '...' : ''}</p>
              </div>

              {/* Footer */}
              <div className="px-5 pb-4 flex items-center gap-3 text-xs text-gray-400">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500 shrink-0">
                  {author.substring(0, 2).toUpperCase()}
                </div>
                <span className="font-semibold text-gray-600 truncate">{author}</span>
                <span className="ml-auto shrink-0">{fmtDate(topic.created_at)}</span>
                <button type="button" disabled={isDeleting} onClick={() => handleDelete(topic.id)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0" title="Excluir tópico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ──────────── New Topic Modal ────────────
const NewTopicModal = ({ isOpen, onClose }) => {
  const { createTopic, userNickname } = useCommunity();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Discussão');
  const [pdfFile, setPdfFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCoverChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setCoverFile(f);
    setCoverPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    const ok = await createTopic(title, content, category, pdfFile, coverFile);
    setSubmitting(false);
    if (ok) { setTitle(''); setContent(''); setPdfFile(null); setCoverFile(null); setCoverPreview(null); onClose(); }
  };

  const defaultCover = DEFAULT_COVERS[category] || DEFAULT_COVERS['Discussão'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Cover preview strip */}
        <div className="relative h-32 overflow-hidden">
          <img src={coverPreview || defaultCover} alt="capa" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <label className="absolute bottom-3 right-3 cursor-pointer bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-white/30 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Alterar capa
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </label>
          <div className="absolute bottom-3 left-3 text-white text-xs font-bold opacity-70">Prévia da capa</div>
        </div>

        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-gray-900">Nova Publicação</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none">&times;</button>
          </div>

          {!userNickname && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-semibold">
              ⚠️ Defina um apelido na aba "Minha Conta" antes de publicar.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Título</label>
              <input className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do tópico..." required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Categoria</label>
              <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={category} onChange={e => setCategory(e.target.value)}>
                <option>Discussão</option><option>Deal Flow</option><option>Tributário</option>
                <option>Macro</option><option>Tese de Investimento</option><option>Educação</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Conteúdo</label>
              <textarea className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none resize-none" rows="4" value={content} onChange={e => setContent(e.target.value)} placeholder="Compartilhe sua análise..." required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Anexo PDF (Opcional)</label>
              <input type="file" accept=".pdf" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100" onChange={e => setPdfFile(e.target.files[0] || null)} />
            </div>
            <button type="submit" disabled={submitting || !userNickname}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-colors">
              {submitting ? 'Publicando...' : 'Publicar na Comunidade'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ──────────── Topic Detail ────────────
const TopicDetail = ({ topicId, onBack }) => {
  const { getTopicDetail, getComments, addComment, getLikes, toggleLike, deleteTopic, updateTopicCover, userId } = useCommunity();
  const [topic, setTopic] = useState(null);
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState({ count: 0, userLiked: false });
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const { confirm, Dialog } = useConfirm();

  useEffect(() => {
    async function load() {
      const t = await getTopicDetail(topicId);
      setTopic(t);
      const [c, l] = await Promise.all([getComments(topicId), getLikes(topicId)]);
      setComments(c);
      setLikes(l);
    }
    load();
  }, [topicId]);

  const handleLike = async () => {
    await toggleLike(topicId);
    setLikes(await getLikes(topicId));
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSending(true);
    const ok = await addComment(topicId, newComment);
    if (ok) { setNewComment(''); setComments(await getComments(topicId)); }
    setSending(false);
  };

  const handleDelete = async () => {
    const ok = await confirm('Esta ação removerá o tópico, comentários e curtidas permanentemente.');
    if (!ok) return;
    setDeleting(true);
    await deleteTopic(topicId);
    onBack();
  };

  const handleCoverChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setUploadingCover(true);
    const ok = await updateTopicCover(topicId, f);
    if (ok) setTopic(await getTopicDetail(topicId));
    setUploadingCover(false);
  };

  if (!topic) return <div className="text-center p-16 text-gray-400 animate-pulse font-bold">Carregando tese...</div>;

  const author = topic.nickname || 'Membro AFIC';
  const cover = getCover(topic);
  const isOwner = topic.user_id === userId;

  return (
    <div className="max-w-4xl mx-auto w-full">
      {Dialog}

      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors mb-6 group">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>
        <span className="group-hover:underline">Voltar ao Fórum</span>
      </button>

      {/* Cover Hero */}
      <div className="relative h-56 rounded-2xl overflow-hidden mb-8 shadow-lg">
        <img src={cover} alt={topic.title} className="w-full h-full object-cover" onError={e => { e.target.src = '/covers/cover_discussao.png'; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Overlay info */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <span className="text-xs font-bold text-white/80 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-3 inline-block">{topic.category}</span>
          <h1 className="text-2xl font-black text-white leading-tight drop-shadow">{topic.title}</h1>
        </div>

        {/* Change cover button — only for owner */}
        {isOwner && (
          <label className="absolute top-4 right-4 cursor-pointer bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-black/60 transition-colors">
            {uploadingCover
              ? <svg className="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            }
            {uploadingCover ? 'Salvando...' : 'Alterar capa'}
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} disabled={uploadingCover} />
          </label>
        )}
      </div>

      {/* Author + delete row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500">
            {author.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="text-sm font-bold text-gray-700 block">{author}</span>
            <span className="text-xs text-gray-400">{fmtDate(topic.created_at)}</span>
          </div>
        </div>
        <button type="button" disabled={deleting} onClick={handleDelete}
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          {deleting ? 'Excluindo...' : 'Excluir Tópico'}
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{topic.content}</p>
      </div>

      {/* PDF Attachment */}
      {topic.attachment_url && (
        <a href={topic.attachment_url} target="_blank" rel="noreferrer"
           className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm font-bold text-amber-700 hover:bg-amber-100 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Acessar Tese em PDF
        </a>
      )}

      {/* Like bar */}
      <div className="flex items-center gap-4 mb-10 border-b border-gray-100 pb-6">
        <button type="button" onClick={handleLike} className={`flex items-center gap-2 text-sm font-bold transition-colors ${likes.userLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}>
          <svg viewBox="0 0 24 24" fill={likes.userLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {likes.count} {likes.count === 1 ? 'curtida' : 'curtidas'}
        </button>
        <span className="text-xs text-gray-300">|</span>
        <span className="text-sm text-gray-400">{comments.length} {comments.length === 1 ? 'comentário' : 'comentários'}</span>
      </div>

      {/* Comments */}
      <div className="mb-10">
        <h3 className="text-lg font-black text-gray-900 mb-6">Discussão Institucional</h3>
        <form onSubmit={handleComment} className="mb-8">
          <textarea className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none resize-none text-sm" rows="3"
            value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Contribua para o debate..." />
          <div className="flex justify-end mt-2">
            <button type="submit" disabled={sending} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors">
              {sending ? 'Enviando...' : 'Publicar'}
            </button>
          </div>
        </form>
        <div className="space-y-6">
          {comments.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhum comentário ainda. Seja o primeiro!</p>}
          {comments.map(c => {
            const cAuthor = c.nickname || 'Membro';
            return (
              <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500">{cAuthor.substring(0, 2).toUpperCase()}</div>
                  <span className="text-sm font-bold text-gray-700">{cAuthor}</span>
                  <span className="text-xs text-gray-400">{fmtDate(c.created_at)}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{c.content}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ──────────── Router ────────────
export const CommunityForum = () => {
  const [view, setView] = useState('list');
  const [activeTopicId, setActiveTopicId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const openTopic = (id) => { setActiveTopicId(id); setView('detail'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goBack = () => { setView('list'); setActiveTopicId(null); };

  return (
    <div className="pt-2">
      {view === 'list' && <TopicList onOpenTopic={openTopic} onNewTopic={() => setShowModal(true)} />}
      {view === 'detail' && activeTopicId && <TopicDetail topicId={activeTopicId} onBack={goBack} />}
      <NewTopicModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};
