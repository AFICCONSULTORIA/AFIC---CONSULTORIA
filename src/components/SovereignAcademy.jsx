import React, { useState } from 'react';

// === MOCK DATA ===
const COURSE_MODULES = [
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
      { id: 202, title: "Alavancagem Positiva", duration: "19:05", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", pdfUrl: "#" },
    ],
    quiz: {
      questions: [
        { q: "Hedge significa:", options: ["Aumentar o risco", "Proteger a carteira contra variações adversas", "Vender descoberto"], correct: 1 }
      ]
    }
  },
  {
    id: 3,
    title: "Módulo 3: Arquitetura Offshore",
    isLocked: true,
    lessons: [
      { id: 301, title: "Estruturação de PIC (Cayman)", duration: "42:00", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", pdfUrl: "#" }
    ],
    quiz: null
  }
];

// === COMPONENT ===
export const SovereignAcademy = () => {
  const [unlockedState, setUnlockedState] = useState([1]); // Array de IDs de módulos liberados
  const [activeModuleId, setActiveModuleId] = useState(1);
  const [activeLessonId, setActiveLessonId] = useState(101);
  
  // Quiz states
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [currentQuizModule, setCurrentQuizModule] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null); // 'pass', 'fail', null

  const activeModuleData = COURSE_MODULES.find(m => m.id === activeModuleId);
  const activeLessonData = activeModuleData?.lessons.find(l => l.id === activeLessonId);

  const handleLessonClick = (mod, lesson) => {
    if (unlockedState.includes(mod.id)) {
      setActiveModuleId(mod.id);
      setActiveLessonId(lesson.id);
    }
  };

  const openQuiz = (mod) => {
    setCurrentQuizModule(mod);
    setQuizAnswers({});
    setQuizResult(null);
    setIsQuizOpen(true);
  };

  const submitQuiz = () => {
    if (!currentQuizModule) return;
    let correctCount = 0;
    currentQuizModule.quiz.questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) correctCount++;
    });

    // Precisa acertar tudo pra passar neste exemplo exigente
    if (correctCount === currentQuizModule.quiz.questions.length) {
      setQuizResult('pass');
      // Unlock next module
      const nextModId = currentQuizModule.id + 1;
      if (!unlockedState.includes(nextModId)) {
        setUnlockedState(prev => [...prev, nextModId]);
      }
    } else {
      setQuizResult('fail');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto pb-20">
      
      {/* ===== LADO ESQUERDO: VIDEO PLAYER & MATERIAIS ===== */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Video Player Box */}
        <div className="bg-[#0f1419] rounded-xl overflow-hidden shadow-xl border border-[rgba(255,255,255,0.05)] aspect-video relative flex items-center justify-center">
            {activeLessonData ? (
               <video 
                  src={activeLessonData.videoUrl} 
                  controls 
                  className="w-full h-full object-cover"
                  controlsList="nodownload"
               />
            ) : (
                <div className="text-gray-400 font-medium">Selecione uma aula para começar.</div>
            )}
        </div>

        {/* Video Details & Actions */}
        {activeLessonData && (
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{activeLessonData.title}</h2>
                <p className="text-gray-500 text-sm">Escola Sovereign • Módulo {activeModuleId} • Duração: {activeLessonData.duration}</p>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-4">
              <a 
                href={activeLessonData.pdfUrl} 
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-lg text-[#0a2540] bg-[#eef1f6] hover:bg-[#e1e6f0] transition-colors"
                download
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Baixar Material de Apoio (.pdf)
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ===== LADO DIREITO: TRILHA (MODULES SIDEBAR) ===== */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        <h3 className="text-lg font-bold text-gray-900 px-1">Trilha de Inteligência</h3>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {COURSE_MODULES.map((mod, index) => {
            const isUnlocked = unlockedState.includes(mod.id);
            const isFinished = unlockedState.includes(mod.id + 1); // Simples logica: se o próx tá aberto, este terminou
            const isActiveModule = activeModuleId === mod.id;

            return (
              <div key={mod.id} className="border-b border-gray-100 last:border-0">
                {/* Module Header */}
                <div 
                  className={`p-4 flex items-center gap-3 transition-colors ${isUnlocked ? (isActiveModule ? 'bg-blue-50/50' : 'bg-white hover:bg-gray-50') : 'bg-gray-50 opacity-60'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isFinished ? 'bg-emerald-100 text-emerald-600' : (isUnlocked ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400')}`}>
                    {isFinished ? '✅' : (isUnlocked ? index + 1 : '🔒')}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold text-sm ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>{mod.title}</h4>
                    <p className="text-xs text-gray-500">{mod.lessons.length} Aulas</p>
                  </div>
                </div>

                {/* Lessons List (only if module is unlocked) */}
                {isUnlocked && (
                  <div className="pb-3 px-4">
                    {mod.lessons.map(lesson => {
                      const isCurrentLesson = activeLessonId === lesson.id;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonClick(mod, lesson)}
                          className={`w-full flex items-center gap-3 p-3 mt-1 rounded-lg text-left text-sm transition-colors ${isCurrentLesson ? 'bg-blue-600 text-white font-medium shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                          <span className="shrink-0">{isCurrentLesson ? '▶️' : '📄'}</span>
                          <span className="flex-1 truncate">{lesson.title}</span>
                          <span className={`text-xs ${isCurrentLesson ? 'text-blue-100' : 'text-gray-400'}`}>{lesson.duration}</span>
                        </button>
                      );
                    })}

                    {/* Quiz Button if module has quiz */}
                    {mod.quiz && !isFinished && (
                      <button 
                        onClick={() => openQuiz(mod)}
                        className="w-full mt-3 p-3 rounded-lg border-2 border-dashed border-[#cda434] text-[#a07c22] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#fbf9f4] transition-colors"
                      >
                         🏆 Fazer Prova para Liberar O Próximo
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== QUIZ MODAL ===== */}
      {isQuizOpen && currentQuizModule && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}>
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-fade-in-up">
            
            <div className="bg-[#0a2540] p-6 text-center border-b-[4px] border-[#cda434]">
                <h3 className="text-xl font-bold text-white">Certificação do Módulo</h3>
                <p className="text-blue-100 text-sm mt-1">{currentQuizModule.title}</p>
            </div>

            <div className="p-8">
              {quizResult === 'pass' ? (
                <div className="text-center py-6">
                  <div className="text-6xl mb-4">🎉</div>
                  <h4 className="text-2xl font-bold text-emerald-600 mb-2">Módulo Desbloqueado!</h4>
                  <p className="text-gray-600">Sua aprovação técnica foi confirmada. A próxima trilha foi destravada com sucesso na sua conta.</p>
                  <button onClick={() => setIsQuizOpen(false)} className="mt-8 bg-[#0a2540] text-white px-8 py-3 rounded-lg font-bold w-full hover:bg-blue-900 transition-colors">Voltar aos Estudos</button>
                </div>
              ) : quizResult === 'fail' ? (
                <div className="text-center py-6">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h4 className="text-xl font-bold text-red-600 mb-2">Pontuação Insuficiente</h4>
                  <p className="text-gray-600">Recomendamos revisar as aulas, pois o embasamento desta etapa é fundamental para evitar falhas críticas no próximo módulo.</p>
                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <button onClick={() => setIsQuizOpen(false)} className="bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">Sair</button>
                    <button onClick={() => setQuizResult(null)} className="bg-[#cda434] text-white px-4 py-3 rounded-lg font-bold hover:bg-[#b08b2c] transition-colors">Tentar Novamente</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {currentQuizModule.quiz.questions.map((q, idx) => (
                    <div key={idx} className="space-y-3">
                      <p className="font-bold text-gray-900 text-[15px]">{idx + 1}. {q.q}</p>
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => (
                          <label key={optIdx} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 peer-checked:border-blue-500">
                            <input 
                              type="radio" 
                              name={`question-${idx}`} 
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" 
                              checked={quizAnswers[idx] === optIdx}
                              onChange={() => setQuizAnswers(prev => ({ ...prev, [idx]: optIdx }))}
                            />
                            <span className="text-gray-700 text-sm">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={submitQuiz}
                    disabled={Object.keys(quizAnswers).length < currentQuizModule.quiz.questions.length}
                    className="w-full bg-[#0a2540] text-white font-bold px-6 py-4 rounded-xl mt-6 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-900 transition-colors"
                  >
                    Enviar Respostas para Avaliação
                  </button>
                </div>
              )}
            </div>
            
            {quizResult === null && (
              <button 
                onClick={() => setIsQuizOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
