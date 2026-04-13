import React, { createContext, useContext, useState, useEffect } from 'react';

// === DADOS INICIAIS (FALLBACK/MOCK) ===
const INITIAL_COURSE_MODULES = [
  {
    id: 1,
    title: "Módulo 1: Fundamentos Institucionais",
    isLocked: false,
    lessons: [
      { id: 101, title: "A Lógica Seca do Patrimônio", duration: "12:45", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", pdfUrl: "#" },
      { id: 102, title: "Protecionismo contra Inflação", duration: "18:20", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", pdfUrl: "#" },
    ],
    quiz: {
      questions: [
        { q: "Qual o principal vilão do patrimônio a longo prazo?", options: ["Juros Compostos", "Inflação Invisível", "Taxas de Corretagem"], correct: 1 },
        { q: "O conceito de 'Risco de Cauda' (Tail Risk) se refere a:", options: ["Flutuação diária da bolsa", "Eventos extremos e altamente improváveis", "Risco de trocar de banco"], correct: 1 }
      ]
    }
  },
  {
    id: 2,
    title: "Módulo 2: Otimização Tática",
    isLocked: true,
    lessons: [
      { id: 201, title: "Hedging e Opções Simples", duration: "25:10", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", pdfUrl: "#" },
    ],
    quiz: null
  }
];

const AcademyContext = createContext();

export const useAcademy = () => useContext(AcademyContext);

export const AcademyProvider = ({ children }) => {
  const [courseModules, setCourseModules] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('afic_academy_data');
    if (saved) {
      setCourseModules(JSON.parse(saved));
    } else {
      setCourseModules(INITIAL_COURSE_MODULES);
      localStorage.setItem('afic_academy_data', JSON.stringify(INITIAL_COURSE_MODULES));
    }
    setIsLoaded(true);
  }, []);

  // Sync to LocalStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('afic_academy_data', JSON.stringify(courseModules));
    }
  }, [courseModules, isLoaded]);

  // Admin Actions
  const addModule = (title) => {
    const newId = courseModules.length > 0 ? Math.max(...courseModules.map(m => m.id)) + 1 : 1;
    setCourseModules(prev => [...prev, {
      id: newId,
      title: title,
      isLocked: newId > 1, // First module usually unlocked, others locked initially
      lessons: [],
      quiz: null
    }]);
  };

  const addLesson = (moduleId, lessonData) => {
    setCourseModules(prev => prev.map(mod => {
      if (mod.id === moduleId) {
        const newLessonId = mod.lessons.length > 0 ? Math.max(...mod.lessons.map(l => l.id)) + 1 : Number(moduleId + '01');
        return {
          ...mod,
          lessons: [...mod.lessons, { id: newLessonId, ...lessonData }]
        };
      }
      return mod;
    }));
  };

  const deleteLesson = (moduleId, lessonId) => {
    setCourseModules(prev => prev.map(mod => {
      if (mod.id === moduleId) {
        return { ...mod, lessons: mod.lessons.filter(l => l.id !== lessonId) };
      }
      return mod;
    }));
  };

  return (
    <AcademyContext.Provider value={{
      courseModules,
      addModule,
      addLesson,
      deleteLesson
    }}>
      {children}
    </AcademyContext.Provider>
  );
};
