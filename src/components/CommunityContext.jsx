import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const CommunityContext = createContext();
export const useCommunity = () => useContext(CommunityContext);

// Busca sessão atualizada do Supabase — mais confiável que o state userId
async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session || null;
}

// Define as funções PRIMEIRO, antes do useEffect
const fetchAnnouncements = async (setAnnouncements) => {
  if (!supabase) return;
  const { data, error } = await supabase
    .from('community_announcements')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });
  if (!error && data) setAnnouncements(data);
};

const fetchTopics = async (setTopics) => {
  if (!supabase) return;
  
  // Tentar busca com join
  const { data, error } = await supabase
    .from('community_topics')
    .select('*, profiles:user_id (nickname)')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.warn("Topic fetch join failed, falling back to manual mapping:", error.message);
    const { data: topics } = await supabase.from('community_topics').select('*').order('created_at', { ascending: false });
    if (!topics) return;
    
    const userIds = [...new Set(topics.map(t => t.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('id, nickname').in('id', userIds);
    const map = {};
    profiles?.forEach(p => map[p.id] = p.nickname);
    
    setTopics(topics.map(t => ({ ...t, nickname: map[t.user_id] || 'Membro AFIC' })));
  } else {
    setTopics(data.map(t => ({ 
      ...t, 
      nickname: t.profiles?.nickname || 'Membro AFIC' 
    })));
  }
};

export const CommunityProvider = ({ children }) => {
  const [topics, setTopics] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userNickname, setUserNickname] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        if (!supabase) {
          setIsLoaded(true);
          return;
        }
        
        const session = await getCurrentSession();
        if (session?.user) {
          setUserId(session.user.id);
          const { data: profiles } = await supabase.from('profiles').select('nickname, role').eq('id', session.user.id).limit(1);
          const profile = profiles?.[0];
          
          if (profile?.nickname) setUserNickname(profile.nickname);
          
          if (profile?.role === 'admin' || session.user.email === 'aficconsultoria@gmail.com') {
            setIsAdmin(true);
            window.isUserAdmin = true;
          }
        }
        await fetchAnnouncements(setAnnouncements);
        await fetchTopics(setTopics);
      } catch (err) {
        console.error("Community Load Failure:", err);
      } finally {
        setIsLoaded(true);
      }
    }
    
    init();
  }, []);

  const uploadFile = async (bucket, folder, file) => {
    if (!supabase || !file) return null;
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Math.random().toString(36).substring(2)}.${ext}`;
    const { data, error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) return null;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return urlData.publicUrl;
  };

  const createTopic = async (title, content, category, pdfFile, coverFile) => {
    const session = await getCurrentSession();
    if (!supabase || !session?.user) return false;

    let attachmentUrl = null;
    if (pdfFile) {
      attachmentUrl = await uploadFile('community-attachments', 'pdfs', pdfFile);
    }

    let coverImageUrl = null;
    if (coverFile) {
      coverImageUrl = await uploadFile('community-attachments', 'covers', coverFile);
    }

    const { error } = await supabase.from('community_topics').insert([{
      user_id: session.user.id, title, content, category,
      attachment_url: attachmentUrl,
      cover_image_url: coverImageUrl,
    }]);

    if (!error) await fetchTopics(setTopics);
    return !error;
  };

  const updateTopic = async (topicId, title, content) => {
    if (!supabase) return false;
    const { data, error } = await supabase
      .from('community_topics')
      .update({ 
        title, 
        content, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', topicId)
      .select();
    
    if (error) {
      console.error("Erro ao atualizar tópico:", error);
      alert("Erro técnico ao salvar: " + error.message);
      return false;
    }

    if (!data || data.length === 0) {
      alert("⚠️ O banco de dados recusou a edição. Política RLS (Update) ausente na tabela community_topics. Execute o script SQL no Supabase para permitir edições.");
      return false;
    }

    await fetchTopics(setTopics);
    return true;
  };

  const updateTopicCover = async (topicId, coverFile) => {
    if (!supabase) return false;
    const coverImageUrl = await uploadFile('community-attachments', 'covers', coverFile);
    if (!coverImageUrl) return false;
    const { error } = await supabase.from('community_topics').update({ cover_image_url: coverImageUrl }).eq('id', topicId);
    if (!error) await fetchTopics(setTopics);
    return !error;
  };

  const deleteTopic = async (topicId) => {
    if (!supabase) return false;
    
    await supabase.from('community_comments').delete().eq('topic_id', topicId);
    await supabase.from('community_likes').delete().eq('topic_id', topicId);
    
    const { data: deleteResult, error } = await supabase
      .from('community_topics')
      .delete()
      .eq('id', topicId)
      .select();

    if (error) {
      console.error('Moderation error:', error);
      return false;
    }

    await fetchTopics(setTopics);
    return true;
  };

  const getTopicDetail = async (topicId) => {
    if (!supabase) return null;
    
    // Tentar busca com join
    const { data, error } = await supabase
      .from('community_topics')
      .select('*, profiles:user_id (nickname)')
      .eq('id', topicId)
      .maybeSingle();
    
    if (error || !data?.profiles) {
      // Fallback manual
      const { data: topic } = await supabase.from('community_topics').select('*').eq('id', topicId).maybeSingle();
      if (!topic) return null;
      
      const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', topic.user_id).maybeSingle();
      return { ...topic, nickname: profile?.nickname || 'Membro AFIC' };
    }
    
    return { ...data, nickname: data.profiles?.nickname || 'Membro AFIC' };
  };

  const getComments = async (topicId) => {
    if (!supabase) return [];
    
    // Tentar busca com join
    const { data, error } = await supabase
      .from('community_comments')
      .select('*, profiles:user_id (nickname)')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });
    
    if (error) {
      const { data: comments } = await supabase
        .from('community_comments')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true });
      if (!comments) return [];
      
      const userIds = [...new Set(comments.map(c => c.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, nickname').in('id', userIds);
      const map = {};
      profiles?.forEach(p => map[p.id] = p.nickname);
      
      return comments.map(c => ({ 
        ...c, 
        profiles: { nickname: map[c.user_id] || 'Membro AFIC' } 
      }));
    }
    
    return data.map(c => ({
      ...c,
      profiles: { nickname: c.profiles?.nickname || 'Membro AFIC' }
    }));
  };

  const addComment = async (topicId, content) => {
    const session = await getCurrentSession();
    if (!supabase || !session?.user) return false;

    const { error } = await supabase.from('community_comments').insert([{
      topic_id: topicId,
      user_id: session.user.id,
      content
    }]);

    return !error;
  };

  const updateComment = async (commentId, content) => {
    if (!supabase) return false;
    const { data, error } = await supabase
      .from('community_comments')
      .update({ 
        content, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', commentId)
      .select();
    
    if (error) {
      console.error("Erro ao atualizar comentário:", error);
      alert("Erro técnico ao salvar comentário: " + error.message);
      return false;
    }

    if (!data || data.length === 0) {
      alert("⚠️ O banco de dados recusou a edição. Política RLS (Update) ausente na tabela community_comments. Execute o script SQL no Supabase para permitir edições.");
      return false;
    }

    return true;
  };

  const getLikes = async (topicId) => {
    if (!supabase) return { count: 0, userLiked: false };
    const session = await getCurrentSession();
    const { data, count } = await supabase
      .from('community_likes')
      .select('user_id', { count: 'exact' })
      .eq('topic_id', topicId);

    const userLiked = session?.user ? data?.some(l => l.user_id === session.user.id) : false;
    return { count: count || 0, userLiked };
  };

  const toggleLike = async (topicId) => {
    const session = await getCurrentSession();
    if (!supabase || !session?.user) return;
    const uid = session.user.id;
    const { data: existingLikes } = await supabase.from('community_likes').select('*').eq('topic_id', topicId).eq('user_id', uid).limit(1);
    
    if (existingLikes?.length > 0) {
      await supabase.from('community_likes').delete().eq('topic_id', topicId).eq('user_id', uid);
    } else {
      await supabase.from('community_likes').insert([{ topic_id: topicId, user_id: uid }]);
    }
  };

  const deleteComment = async (commentId) => {
    const session = await getCurrentSession();
    if (!supabase || !session?.user) return false;
    const { error } = await supabase.from('community_comments').delete().eq('id', commentId);
    return !error;
  };

  return (
    <CommunityContext.Provider value={{
      topics, isLoaded, userId, userNickname, announcements, isAdmin, setIsAdmin,
      fetchTopics, createTopic, updateTopic, deleteTopic, updateTopicCover,
      getTopicDetail, getComments, addComment, updateComment, getLikes, toggleLike, deleteComment,
      fetchAnnouncements, 
      addAnnouncement: async (content, isPriority) => {
        const sb = getSB();
        if (!sb) return false;
        const { error } = await sb.from('community_announcements').insert([{ content, is_priority: isPriority, user_id: userId }]);
        if (error) {
          console.error("Erro ao postar aviso:", error);
          alert("Erro ao postar: " + error.message);
          return false;
        }
        await fetchAnnouncements(setAnnouncements);
        return true;
      },
      deleteAnnouncement: async (annId) => {
        const sb = getSB();
        if (!sb) return false;
        
        // Usamos .select() para confirmar se o banco realmente deletou a linha
        const { data, error } = await sb
          .from('community_announcements')
          .delete()
          .eq('id', annId)
          .select();

        if (error) {
          console.error("Erro ao deletar aviso:", error);
          alert("Erro técnico ao deletar: " + error.message);
          return false;
        }

        // Se data estiver vazio, o RLS bloqueou a exclusão silenciosamente
        if (!data || data.length === 0) {
          alert("⚠️ O banco de dados recusou a exclusão. Certifique-se de ter rodado o último comando SQL de permissões!");
          return false;
        }

        await fetchAnnouncements(setAnnouncements);
        return true;
      }
    }}>
      {children}
    </CommunityContext.Provider>
  );
};
