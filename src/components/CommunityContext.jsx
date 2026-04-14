import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const CommunityContext = createContext();
export const useCommunity = () => useContext(CommunityContext);

function getSB() {
  return window.aficSupabase || null;
// Busca sessão atualizada do Supabase — mais confiável que o state userId
async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session || null;
}

export const CommunityProvider = ({ children }) => {
  const [topics, setTopics] = useState([]);
  const [announcements, setAnnouncements] = useState([]); // [NOVO]
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userNickname, setUserNickname] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // [NOVO]

  useEffect(() => {
    async function init() {
      if (!supabase) return;

      const session = await getCurrentSession();
      if (session?.user) {
        setUserId(session.user.id);
        const { data: profile, error: pErr } = await supabase.from('profiles').select('nickname, role').eq('id', session.user.id).maybeSingle();
        console.log("DEBUG: Perfil Carregado ->", profile, "Email ->", session.user.email);
        
        if (profile?.nickname) setUserNickname(profile.nickname);
        
        // Regra de Ouro: Admin por role no banco OU por e-mail fixo corporativo
        if (profile?.role === 'admin' || session.user.email === 'aficconsultoria@gmail.com') {
          setIsAdmin(true);
        }
      }
      await fetchAnnouncements();
      await fetchTopics();
      setIsLoaded(true);
    }
    
    init();
  }, [fetchAnnouncements, fetchTopics]);

  const fetchAnnouncements = useCallback(async () => {
    const { data, error } = await supabase
      .from('community_announcements')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (!error && data) setAnnouncements(data);
  }, []);

  const fetchTopics = useCallback(async () => {
    const { data, error } = await supabase
      .from('community_topics')
      .select('*, profiles(nickname)')
      .order('created_at', { ascending: false });
    if (!error) setTopics(data || []);
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

    if (!error) await fetchTopics();
    return !error;
  };

  const updateTopicCover = async (topicId, coverFile) => {
    if (!supabase) return false;
    const coverImageUrl = await uploadFile('community-attachments', 'covers', coverFile);
    if (!coverImageUrl) return false;
    const { error } = await supabase.from('community_topics').update({ cover_image_url: coverImageUrl }).eq('id', topicId);
    if (!error) await fetchTopics();
    return !error;
  };

  const deleteTopic = async (topicId) => {
    if (!supabase) return false;
    
    await supabase.from('community_comments').delete().eq('topic_id', topicId);
    await supabase.from('community_likes').delete().eq('topic_id', topicId);
    
    const { data, error } = await supabase
      .from('community_topics')
      .delete()
      .eq('id', topicId)
      .select();

    if (error) {
      console.error('Moderation error:', error);
      alert("Erro ao moderar tópico: " + error.message);
      return false;
    }

    if (!data || data.length === 0) {
      alert("⚠️ Moderação recusada pelo banco. Verifique as permissões de acesso!");
      return false;
    }

    await fetchTopics();
    return true;
  };

  const getTopicDetail = async (topicId) => {
    if (!supabase) return null;
    const { data, error } = await supabase.from('community_topics').select('*').eq('id', topicId).maybeSingle();
    return error ? null : data;
  };

  const getComments = async (topicId) => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('community_comments')
      .select('*, profiles(nickname)')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });
    return error ? [] : data;
  };

  const addComment = async (topicId, content) => {
    const session = await getCurrentSession();
    if (!supabase || !session?.user) {
      console.error('addComment: usuário não autenticado');
      return false;
    }

    const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', session.user.id).maybeSingle();
    const nickname = profile?.nickname || 'Membro AFIC';

    const { error } = await supabase.from('community_comments').insert([{
      topic_id: topicId,
      user_id: session.user.id,
      content,
      user_nickname: nickname
    }]);

    return !error;
  };

  const getLikes = async (topicId) => {
    if (!supabase) return { count: 0, userLiked: false };

    const session = await getCurrentSession();

    const { data, count, error } = await supabase
      .from('community_likes')
      .select('user_id', { count: 'exact' })
      .eq('topic_id', topicId);

    const userLiked = session?.user ? data?.some(l => l.user_id === session.user.id) : false;

    return { count: count || 0, userLiked };
  };

  const toggleLike = async (topicId) => {
    const getSB = () => supabase;
    const session = await getCurrentSession();
    if (!sb || !session?.user) {
      console.error('toggleLike: usuário não autenticado');
      return;
    }

    const uid = session.user.id;

    const { data, error: selError } = await sb
      .from('community_likes')
      .select('id')
      .eq('topic_id', topicId)
      .eq('user_id', uid);

    if (selError) {
      console.error('toggleLike select error:', selError.message);
      return;
    }

    if (data && data.length > 0) {
      const { error } = await sb
        .from('community_likes')
        .delete()
        .eq('topic_id', topicId)
        .eq('user_id', uid);
      if (error) console.error('toggleLike delete error:', error.message);
    } else {
      const { error } = await sb
        .from('community_likes')
        .insert([{ topic_id: topicId, user_id: uid }]);
      if (error) console.error('toggleLike insert error:', error.message);
    }
  };

  return (
    <CommunityContext.Provider value={{
      topics, isLoaded, userId, userNickname, announcements, isAdmin, setIsAdmin,
      fetchTopics, createTopic, deleteTopic, updateTopicCover,
      getTopicDetail, getComments, addComment, getLikes, toggleLike,
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
        await fetchAnnouncements();
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

        await fetchAnnouncements();
        return true;
      }
    }}>
      {children}
    </CommunityContext.Provider>
  );
};
