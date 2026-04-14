import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CommunityContext = createContext();
export const useCommunity = () => useContext(CommunityContext);

function getSB() {
  return window.aficSupabase || null;
}

// Busca sessão atualizada do Supabase — mais confiável que o state userId
async function getCurrentSession() {
  const sb = getSB();
  if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
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
    let attempts = 0;
    const wait = setInterval(async () => {
      const sb = getSB();
      attempts++;
      if (sb || attempts > 30) {
        clearInterval(wait);
        if (!sb) return;
        const session = await getCurrentSession();
        if (session?.user) {
          setUserId(session.user.id);
          const { data: profile, error: pErr } = await sb.from('profiles').select('nickname, role').eq('id', session.user.id).single();
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
    }, 100);
    return () => clearInterval(wait);
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    const sb = getSB();
    if (!sb) return;
    const { data, error } = await sb
      .from('community_announcements')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (!error && data) setAnnouncements(data);
  }, []);

  const fetchTopics = useCallback(async () => {
    const sb = getSB();
    if (!sb) return;
    const { data, error } = await sb
      .from('community_topics')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setTopics(data);
  }, []);

  // Upload a file to storage, returns public URL or null
  const uploadFile = async (bucket, folder, file) => {
    const sb = getSB();
    if (!sb || !file) return null;
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Math.random().toString(36).substring(2)}.${ext}`;
    const { error } = await sb.storage.from(bucket).upload(path, file);
    if (error) return null;
    const { data } = sb.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const createTopic = async (title, content, category, pdfFile, coverFile) => {
    const sb = getSB();
    const session = await getCurrentSession();
    if (!sb || !session?.user) return false;

    const uid = session.user.id;

    const [attachmentUrl, coverImageUrl] = await Promise.all([
      uploadFile('community-attachments', 'teses', pdfFile),
      uploadFile('community-attachments', 'covers', coverFile),
    ]);

    const { error } = await sb.from('community_topics').insert([{
      user_id: uid, title, content, category,
      attachment_url: attachmentUrl,
      cover_image_url: coverImageUrl,
    }]);

    if (!error) await fetchTopics();
    return !error;
  };

  const updateTopicCover = async (topicId, coverFile) => {
    const sb = getSB();
    if (!sb) return false;
    const coverImageUrl = await uploadFile('community-attachments', 'covers', coverFile);
    if (!coverImageUrl) return false;
    const { error } = await sb.from('community_topics').update({ cover_image_url: coverImageUrl }).eq('id', topicId);
    if (!error) await fetchTopics();
    return !error;
  };

  const deleteTopic = async (topicId) => {
    const sb = getSB();
    if (!sb) return false;
    await sb.from('community_comments').delete().eq('topic_id', topicId);
    await sb.from('community_likes').delete().eq('topic_id', topicId);
    const { error } = await sb.from('community_topics').delete().eq('id', topicId);
    if (!error) await fetchTopics();
    return !error;
  };

  const getTopicDetail = async (topicId) => {
    const sb = getSB();
    if (!sb) return null;
    const { data, error } = await sb.from('community_topics').select('*').eq('id', topicId).single();
    return error ? null : data;
  };

  const getComments = async (topicId) => {
    const sb = getSB();
    if (!sb) return [];
    const { data, error } = await sb
      .from('community_comments')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });
    return error ? [] : (data || []);
  };

  const addComment = async (topicId, content) => {
    const sb = getSB();
    const session = await getCurrentSession();
    if (!sb || !session?.user) {
      console.error('addComment: usuário não autenticado');
      return false;
    }

    const uid = session.user.id;

    // Busca nickname atualizado
    const { data: profile } = await sb
      .from('profiles')
      .select('nickname')
      .eq('id', uid)
      .single();

    const nickname = profile?.nickname || null;

    const { error } = await sb.from('community_comments').insert([{
      topic_id: topicId,
      user_id: uid,
      content,
      nickname,
    }]);

    if (error) {
      console.error('addComment error:', error.message, error.details);
      return false;
    }
    return true;
  };

  const getLikes = async (topicId) => {
    const sb = getSB();
    if (!sb) return { count: 0, userLiked: false };

    const session = await getCurrentSession();
    const uid = session?.user?.id || null;

    const { data, count } = await sb
      .from('community_likes')
      .select('*', { count: 'exact' })
      .eq('topic_id', topicId);

    const userLiked = uid ? (data || []).some(l => l.user_id === uid) : false;
    return { count: count || 0, userLiked };
  };

  const toggleLike = async (topicId) => {
    const sb = getSB();
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
        const { error } = await sb.from('community_announcements').delete().eq('id', annId);
        if (error) {
          console.error("Erro ao deletar aviso:", error);
          alert("Erro ao deletar: " + error.message);
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
