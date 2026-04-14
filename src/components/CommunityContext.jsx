import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CommunityContext = createContext();
export const useCommunity = () => useContext(CommunityContext);

// Reusa o cliente já criado pelo app.js (window.aficSupabase)
// Sem criar novas instâncias — evita conflito de GoTrueClient
function getSB() {
  return window.aficSupabase || null;
}

export const CommunityProvider = ({ children }) => {
  const [topics, setTopics] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userNickname, setUserNickname] = useState(null);

  useEffect(() => {
    // app.js expõe window.aficSupabase no DOMContentLoaded
    // Aguarda até ele estar disponível (máx 3s)
    let attempts = 0;
    const wait = setInterval(async () => {
      const sb = getSB();
      attempts++;
      if (sb || attempts > 30) {
        clearInterval(wait);
        if (!sb) return;
        const { data: { session } } = await sb.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
          const { data: profile } = await sb.from('profiles').select('nickname').eq('id', session.user.id).single();
          if (profile?.nickname) setUserNickname(profile.nickname);
        }
        await fetchTopics();
        setIsLoaded(true);
      }
    }, 100);
    return () => clearInterval(wait);
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

  const createTopic = async (title, content, category, file) => {
    const sb = getSB();
    if (!sb || !userId) return false;
    let attachmentUrl = null;
    if (file) {
      const ext = file.name.split('.').pop();
      const path = `teses/${Math.random().toString(36).substring(2)}.${ext}`;
      const { error: upErr } = await sb.storage.from('community-attachments').upload(path, file);
      if (!upErr) {
        const { data: urlData } = sb.storage.from('community-attachments').getPublicUrl(path);
        attachmentUrl = urlData.publicUrl;
      }
    }
    const { error } = await sb.from('community_topics').insert([{
      user_id: userId, title, content, category, attachment_url: attachmentUrl
    }]);
    if (!error) await fetchTopics();
    return !error;
  };

  const deleteTopic = async (topicId) => {
    const sb = getSB();
    if (!sb) { console.error('deleteTopic: Supabase client not ready'); return false; }
    console.log('deleteTopic: deleting', topicId);
    const r1 = await sb.from('community_comments').delete().eq('topic_id', topicId);
    console.log('comments delete:', r1.error || 'OK');
    const r2 = await sb.from('community_likes').delete().eq('topic_id', topicId);
    console.log('likes delete:', r2.error || 'OK');
    const r3 = await sb.from('community_topics').delete().eq('id', topicId);
    console.log('topic delete:', r3.error || 'OK', 'status:', r3.status);
    if (!r3.error) {
      await fetchTopics();
      return true;
    }
    return false;
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
    const { data, error } = await sb.from('community_comments').select('*').eq('topic_id', topicId).order('created_at', { ascending: true });
    return error ? [] : (data || []);
  };

  const addComment = async (topicId, content) => {
    const sb = getSB();
    if (!sb || !userId) return false;
    const { error } = await sb.from('community_comments').insert([{ topic_id: topicId, user_id: userId, content }]);
    return !error;
  };

  const getLikes = async (topicId) => {
    const sb = getSB();
    if (!sb) return { count: 0, userLiked: false };
    const { data, count } = await sb.from('community_likes').select('*', { count: 'exact' }).eq('topic_id', topicId);
    const userLiked = (data || []).some(l => l.user_id === userId);
    return { count: count || 0, userLiked };
  };

  const toggleLike = async (topicId) => {
    const sb = getSB();
    if (!sb || !userId) return;
    const { data } = await sb.from('community_likes').select('id').eq('topic_id', topicId).eq('user_id', userId);
    if (data && data.length > 0) {
      await sb.from('community_likes').delete().eq('topic_id', topicId).eq('user_id', userId);
    } else {
      await sb.from('community_likes').insert([{ topic_id: topicId, user_id: userId }]);
    }
  };

  return (
    <CommunityContext.Provider value={{
      topics, isLoaded, userId, userNickname,
      fetchTopics, createTopic, deleteTopic, getTopicDetail,
      getComments, addComment, getLikes, toggleLike
    }}>
      {children}
    </CommunityContext.Provider>
  );
};
