import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Contexto isolado
const UserProfileContext = createContext();

export const UserProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [userProfile, setUserProfile] = useState('iniciante'); 

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        setProfile(data);
        if (data?.role === 'premium' || data?.role === 'admin') {
          setUserProfile('avancado');
        }
      }
    }
    load();
  }, []);

  return (
    <UserProfileContext.Provider value={{ profile, setProfile, userProfile, setUserProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => useContext(UserProfileContext);
