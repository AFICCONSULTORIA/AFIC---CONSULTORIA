import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CommunityContext = createContext();
export const useCommunity = () => useContext(CommunityContext);

export const CommunityProvider = ({ children }) => {
  const [topics, setTopics] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userNickname, setUserNickname] = useState(null);

  const getSupabase = () => {
    if (!window.supabase) return null;
    return window.supabase.createClient(
      'https://sueyfodlqcviojivlxgv.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1ZXlmb2RscWN2aW9qaXZseGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzU4NTMsImV4cCI6MjA5MTI1MTg1M30.g40c4ko9uFKOdN2x4tvQQg-IuWx2ZB4K8_fsZpgeIDw'
    );
  };

  useEffect(() => {
    async function init() {
      const sb = getSupabase();
      if (!sb) return;

      const { data: { session } } = await sb.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        // Try to get nickname
        const { data: profile } = await sb.from('profiles').select('nickname').eq('id', session.user.id).single();
        if (profile?.nickname) setUserNickname(profile.nickname);
      }

      await fetchTopics();
      setIsLoaded(true);
    }
    init();
  }, []);

  const fetchTopics = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;

    let { data, error } = await sb
      .from('community_topics')
      .select('*, profiles:user_id(nickname)')
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback without join
      const fb = await sb.from('community_topics').select('*').order('created_at', { ascending: false });
      if (!fb.error) data = fb.data;
    }

    setTopics(data || []);
  }, []);

  const createTopic = async (title, content, category, file) => {
    const sb = getSupabase();
    if (!sb || !userId) return;

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

  const getTopicDetail = async (topicId) => {
    const sb = getSupabase();
    let { data, error } = await sb
      .from('community_topics')
      .select('*, profiles:user_id(nickname)')
      .eq('id', topicId).single();

    if (error) {
      const fb = await sb.from('community_topics').select('*').eq('id', topicId).single();
      if (!fb.error) data = fb.data;
    }
    return data;
  };

  const getComments = async (topicId) => {
    const sb = getSupabase();
    let { data, error } = await sb
      .from('community_comments')
      .select('*, profiles:user_id(nickname)')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });

    if (error) {
      const fb = await sb.from('community_comments').select('*').eq('topic_id', topicId).order('created_at', { ascending: true });
      if (!fb.error) data = fb.data;
    }
    return data || [];
  };

  const addComment = async (topicId, content) => {
    const sb = getSupabase();
    if (!userId) return false;
    const { error } = await sb.from('community_comments').insert([{ topic_id: topicId, user_id: userId, content }]);
    return !error;
  };

  const getLikes = async (topicId) => {
    const sb = getSupabase();
    const { data, count } = await sb.from('community_likes').select('*', { count: 'exact' }).eq('topic_id', topicId);
    const userLiked = (data || []).some(l => l.user_id === userId);
    return { count: count || 0, userLiked };
  };

  const toggleLike = async (topicId) => {
    const sb = getSupabase();
    if (!userId) return;
    const { data } = await sb.from('community_likes').select('id').eq('topic_id', topicId).eq('user_id', userId);
    if (data && data.length > 0) {
      await sb.from('community_likes').delete().eq('topic_id', topicId).eq('user_id', userId);
    } else {
      await sb.from('community_likes').insert([{ topic_id: topicId, user_id: userId }]);
    }
  };

  const deleteTopic = async (topicId) => {
    const sb = getSupabase();
    if (!sb) return false;
    // Cascade: remove comments and likes first
    await sb.from('community_comments').delete().eq('topic_id', topicId);
    await sb.from('community_likes').delete().eq('topic_id', topicId);
    const { error } = await sb.from('community_topics').delete().eq('id', topicId);
    if (!error) await fetchTopics();
    return !error;
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
