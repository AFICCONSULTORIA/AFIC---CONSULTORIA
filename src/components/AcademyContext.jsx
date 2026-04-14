import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AcademyContext = createContext();

export const useAcademy = () => useContext(AcademyContext);

export const AcademyProvider = ({ children }) => {
  const [courseModules, setCourseModules] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    async function init() {
      if (!supabase) return;

      // Identify existing logged in user
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        
        // Regra Master de Admin: E-mail oficial ou Role no perfil
        if (session.user.email === 'aficconsultoria@gmail.com') {
          setIsAdmin(true);
        } else {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .limit(1);
          const profile = profileData?.[0];
            
          if (profile?.role === 'admin') {
            setIsAdmin(true);
          }
        }
      } else {
        setUserId('00000000-0000-0000-0000-000000000000');
      }

      // Fetch Modules & Lessons
      const { data: modulesData, error } = await supabase
        .from('academy_modules')
        .select('*, academy_lessons(*)')
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Academy Context Error:", error);
      }

      if (!error && modulesData) {
        const formattedModules = modulesData.map(mod => ({
          id: mod.id,
          title: mod.title,
          isLocked: mod.locked_by_default,
          lessons: (mod.academy_lessons || []).sort((a,b) => new Date(a.created_at) - new Date(b.created_at)).map(l => ({
            id: l.id,
            title: l.title,
            duration: l.duration,
            videoUrl: l.video_url,
            pdfUrl: l.pdf_url,
            isLive: l.is_live
          })),
          quiz: null
        }));
        setCourseModules(formattedModules);
      }
      setIsLoaded(true);
    }
    
    init();
  }, []);

  // ─── PROGRESS SYNCING ───
  const markLessonAsCompleted = async (lessonId) => {
    if (!supabase || !userId) return;

    const { error } = await supabase
      .from('academy_user_progress')
      .upsert({ user_id: userId, lesson_id: lessonId, is_completed: true }, { onConflict: 'user_id,lesson_id' });
    
    if(error) console.error("Falha ao salvar progresso", error);
  };

  const saveLessonFeedback = async (lessonId, rating, note) => {
    if (!supabase || !userId) return;

    const payload = { user_id: userId, lesson_id: lessonId };
    if(rating !== undefined) payload.rating = rating;
    if(note !== undefined) payload.smart_note = note;

    await supabase
      .from('academy_user_progress')
      .upsert(payload, { onConflict: 'user_id,lesson_id' });
  };

  const getLessonUserProgress = async (lessonId) => {
    if (!supabase || !userId) return null;
    const { data: progressData } = await supabase
      .from('academy_user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .limit(1);
    
    return progressData?.[0] || null;
  };

  const getAllProgress = async () => {
    if (!supabase || !userId) return [];
    const { data } = await supabase
      .from('academy_user_progress')
      .select('lesson_id, is_completed')
      .eq('user_id', userId)
      .eq('is_completed', true);
    return data || [];
  };

  // ─── ADMIN ACTIONS (CRUD MODULOS) ───
  const addModule = async (title) => {
    
    const { data: modData, error } = await supabase
      .from('academy_modules')
      .insert([{ title, locked_by_default: courseModules.length > 0 }])
      .select()
      .limit(1);
    const data = modData?.[0];

    if(!error && data) {
       // Optimistic UI
       setCourseModules(prev => [...prev, {
        id: data.id,
        title: data.title,
        isLocked: data.locked_by_default,
        lessons: [],
        quiz: null
      }]);
    } else { alert("Erro ao criar módulo na nuvem"); }
  };

  const addLesson = async (moduleId, lessonData) => {
    const supabase = getSupabase();
    const payload = {
        module_id: moduleId,
        title: lessonData.title,
        duration: lessonData.duration,
        video_url: lessonData.videoUrl,
        pdf_url: lessonData.pdfUrl,
        is_live: lessonData.isLive || false
    };

    const { data: lessonData, error } = await supabase
      .from('academy_lessons')
      .insert([payload])
      .select()
      .limit(1);
    const data = lessonData?.[0];

    if(!error && data) {
       const mappedLesson = {
          id: data.id,
          title: data.title,
          duration: data.duration,
          videoUrl: data.video_url,
          pdfUrl: data.pdf_url,
          isLive: data.is_live
       };
       setCourseModules(prev => prev.map(mod => mod.id === moduleId ? { ...mod, lessons: [...mod.lessons, mappedLesson] } : mod));
    } else { alert("Erro ao inserir aula: " + error?.message); }
  };

  const deleteLesson = async (moduleId, lessonId) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('academy_lessons').delete().eq('id', lessonId);
    
    if(!error) {
       setCourseModules(prev => prev.map(mod => mod.id === moduleId ? { ...mod, lessons: mod.lessons.filter(l => l.id !== lessonId) } : mod));
    }
  };

  const editLesson = async (moduleId, lessonId, updatedData) => {
    const supabase = getSupabase();
    const payload = {};
    if(updatedData.title) payload.title = updatedData.title;
    if(updatedData.duration) payload.duration = updatedData.duration;
    if(updatedData.videoUrl) payload.video_url = updatedData.videoUrl;
    if(updatedData.pdfUrl) payload.pdf_url = updatedData.pdfUrl;
    if(updatedData.isLive !== undefined) payload.is_live = updatedData.isLive;

    const { error } = await supabase.from('academy_lessons').update(payload).eq('id', lessonId);
    
    if(!error) {
       setCourseModules(prev => prev.map(mod => {
         if (mod.id === moduleId) {
           return {
             ...mod,
             lessons: mod.lessons.map(l => l.id === lessonId ? { ...l, ...updatedData } : l)
           };
         }
         return mod;
       }));
    }
  };

  return (
    <AcademyContext.Provider value={{
      courseModules,
      isLoaded,
      isAdmin,
      setIsAdmin,
      addModule,
      addLesson,
      deleteLesson,
      editLesson,
      markLessonAsCompleted,
      saveLessonFeedback,
      getLessonUserProgress,
      getAllProgress
    }}>
      {children}
    </AcademyContext.Provider>
  );
};
