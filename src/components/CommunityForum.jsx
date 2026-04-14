import React, { useState, useEffect, useRef } from 'react';
import { useCommunity } from './CommunityContext';

const fmtDate = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

// ──────────── Topic List (Home) ────────────
const TopicList = ({ onOpenTopic, onNewTopic }) => {
  const { topics, isLoaded, deleteTopic, userId } = useCommunity();

  if (!isLoaded) return <div className="text-center p-16 text-gray-400 font-bold animate-pulse">Sincronizando Inteligência Coletiva...</div>;

  return (
    <div className="max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Fórum AFIC</h2>
          <p className="text-sm text-gray-400 mt-1">Deal flow, debates e inteligência institucional.</p>
        </div>
        <button onClick={onNewTopic} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-sm flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Tópico
        </button>
      </div>

      {/* Topic Cards */}
      <div className="space-y-4">
        {topics.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400 font-semibold">Nenhuma publicação encontrada.</p>
            <p className="text-xs text-gray-300 mt-2">Seja o primeiro a contribuir para a comunidade.</p>
          </div>
        )}

        {topics.map(topic => {
          const author = topic.profiles?.nickname || 'Membro AFIC';
          return (
            <div
              key={topic.id}
              className="bg-white rounded-xl border border-gray-100 p-6 transition-all hover:shadow-md hover:border-gray-200 group"
            >
              <div className="flex items-start justify-between gap-4 cursor-pointer" onClick={() => onOpenTopic(topic.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{topic.category}</span>
                    {topic.attachment_url && (
                      <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full flex items-center gap-1">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        PDF
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate">{topic.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{topic.content.substring(0, 180)}{topic.content.length > 180 ? '...' : ''}</p>
                </div>
                <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500">
                    {author.substring(0, 2).toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                <span className="font-semibold text-gray-600">{author}</span>
                <span>{fmtDate(topic.created_at)}</span>
                <button
                   onClick={() => { if(window.confirm('Excluir este tópico permanentemente?')) deleteTopic(topic.id); }}
                   className="ml-auto p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                   title="Excluir tópico"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
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
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    const ok = await createTopic(title, content, category, file);
    setSubmitting(false);
    if (ok) {
      setTitle(''); setContent(''); setFile(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8" onClick={e => e.stopPropagation()}>
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
            <input className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do tópico..." required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Categoria</label>
            <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={category} onChange={e => setCategory(e.target.value)}>
              <option>Discussão</option>
              <option>Deal Flow</option>
              <option>Tributário</option>
              <option>Macro</option>
              <option>Tese de Investimento</option>
              <option>Educação</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Conteúdo</label>
            <textarea className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none resize-none" rows="5" value={content} onChange={e => setContent(e.target.value)} placeholder="Compartilhe sua análise..." required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Anexo PDF (Opcional)</label>
            <input type="file" accept=".pdf" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100" onChange={e => setFile(e.target.files[0] || null)} />
          </div>
          <button
            type="submit"
            disabled={submitting || !userNickname}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            {submitting ? 'Publicando...' : 'Publicar na Comunidade'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ──────────── Topic Detail ────────────
const TopicDetail = ({ topicId, onBack }) => {
  const { getTopicDetail, getComments, addComment, getLikes, toggleLike, deleteTopic, userId } = useCommunity();
  const [topic, setTopic] = useState(null);
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState({ count: 0, userLiked: false });
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const commentRef = useRef(null);

  useEffect(() => {
    async function load() {
      const t = await getTopicDetail(topicId);
      setTopic(t);
      const c = await getComments(topicId);
      setComments(c);
      const l = await getLikes(topicId);
      setLikes(l);
    }
    load();
  }, [topicId]);

  const handleLike = async () => {
    await toggleLike(topicId);
    const l = await getLikes(topicId);
    setLikes(l);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSending(true);
    const ok = await addComment(topicId, newComment);
    if (ok) {
      setNewComment('');
      const c = await getComments(topicId);
      setComments(c);
    }
    setSending(false);
  };

  if (!topic) return <div className="text-center p-16 text-gray-400 animate-pulse font-bold">Carregando tese...</div>;

  const author = topic.profiles?.nickname || 'Membro AFIC';

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors mb-8 group">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>
        <span className="group-hover:underline">Voltar ao Fórum</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{topic.category}</span>
          <span className="text-xs text-gray-400">{fmtDate(topic.created_at)}</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 leading-tight">{topic.title}</h1>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500">
              {author.substring(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-bold text-gray-700">{author}</span>
          </div>
          <button
            onClick={async () => { if(window.confirm('Excluir este tópico e todos os seus comentários?')) { await deleteTopic(topicId); onBack(); } }}
            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 px-4 py-2 rounded-lg"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Excluir Tópico
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{topic.content}</p>
      </div>

      {/* Attachment */}
      {topic.attachment_url && (
        <a href={topic.attachment_url} target="_blank" rel="noreferrer"
           className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm font-bold text-amber-700 hover:bg-amber-100 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Acessar Tese em PDF
        </a>
      )}

      {/* Like */}
      <div className="flex items-center gap-4 mb-10 border-b border-gray-100 pb-6">
        <button onClick={handleLike} className={`flex items-center gap-2 text-sm font-bold transition-colors ${likes.userLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}>
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

        {/* New Comment */}
        <form onSubmit={handleComment} className="mb-8">
          <textarea
            ref={commentRef}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none resize-none text-sm"
            rows="3"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Contribua para o debate..."
          />
          <div className="flex justify-end mt-2">
            <button type="submit" disabled={sending} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors">
              {sending ? 'Enviando...' : 'Publicar'}
            </button>
          </div>
        </form>

        {/* Comment List */}
        <div className="space-y-6">
          {comments.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum comentário ainda. Seja o primeiro!</p>
          )}
          {comments.map(c => {
            const cAuthor = c.profiles?.nickname || 'Membro';
            return (
              <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500">
                    {cAuthor.substring(0, 2).toUpperCase()}
                  </div>
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

// ──────────── Main Router ────────────
export const CommunityForum = () => {
  const [view, setView] = useState('list');   // 'list' | 'detail' | 'new'
  const [activeTopicId, setActiveTopicId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const openTopic = (id) => {
    setActiveTopicId(id);
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setView('list');
    setActiveTopicId(null);
  };

  return (
    <div className="pt-2">
      {view === 'list' && <TopicList onOpenTopic={openTopic} onNewTopic={() => setShowModal(true)} />}
      {view === 'detail' && activeTopicId && <TopicDetail topicId={activeTopicId} onBack={goBack} />}
      <NewTopicModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};
