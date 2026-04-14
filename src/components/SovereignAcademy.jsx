import React, { useState, useEffect } from 'react';

import { useAcademy } from './AcademyContext';
import { AcademyAdmin } from './AcademyAdmin';

// Subcomponente de Certificado
const CertificateModal = ({ onClose, progress }) => {
  if (progress < 100) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white max-w-4xl w-full rounded-lg shadow-2xl relative overflow-hidden" id="print-certificate">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black font-bold text-xl no-print">×</button>
        <div className="border-[12px] border-[#cda434] p-12 text-center bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
          <h1 className="text-[#0a2540] text-5xl font-serif font-bold mb-4 tracking-widest uppercase">Certificado de Conclusão</h1>
          <p className="text-gray-600 text-lg uppercase tracking-wide mb-8">A AFIC CONSULTORIA atesta e certifica que</p>
          <div className="border-b-2 border-gray-400 pb-2 mb-8 mx-auto w-3/4">
             <h2 className="text-4xl font-bold text-gray-800">[ NOME DO TITULAR ]</h2>
          </div>
          <p className="text-gray-600 text-lg mb-12 px-12">
            Completou com êxito todos os módulos institucionais e masterclasses da trilha de Inteligência Financeira e Allocation (Academia AFIC).
          </p>
          
          <div className="flex justify-between items-center px-16 mt-16">
            <div className="text-center">
              <div className="border-b border-gray-800 w-48 mb-2 mx-auto"></div>
              <p className="text-sm font-bold text-gray-800 uppercase">Gestão AFIC</p>
            </div>
            <div className="w-32 h-32 rounded-full border-4 border-[#cda434] bg-[#0a2540] flex items-center justify-center text-[#cda434] font-bold text-xl font-serif transform -rotate-12 shadow-xl">
              AFIC<br/>SELO
            </div>
            <div className="text-center">
              <div className="border-b border-gray-800 w-48 mb-2 mx-auto"></div>
              <p className="text-sm font-bold text-gray-800 uppercase">Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-100 p-4 text-center border-t border-gray-200 no-print">
          <button onClick={() => window.print()} className="bg-[#0a2540] text-white px-8 py-3 rounded font-bold shadow-lg hover:bg-blue-900 transition-colors uppercase tracking-wide">🖨️ Imprimir ou Salvar em PDF</button>
        </div>
      </div>
    </div>
  );
};

export const SovereignAcademy = () => {
  const { courseModules, isLoaded, markLessonAsCompleted, saveLessonFeedback, getLessonUserProgress, getAllProgress } = useAcademy();
  const [isAdminMode, setIsAdminMode] = useState(false);

  const [activeModuleId, setActiveModuleId] = useState(1);
  const [activeLessonId, setActiveLessonId] = useState(null);
  
  // Real Data states
  const [smartNotes, setSmartNotes] = useState("");
  const [lessonRating, setLessonRating] = useState(0);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  
  // Q&A State
  const [fakeCommunityComments, setFakeCommunityComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const [showCertificate, setShowCertificate] = useState(false);

  // Calcula Progresso Total
  let totalLessons = 0;
  courseModules?.forEach(m => { totalLessons += m.lessons.length });
  const progressPercentage = totalLessons === 0 ? 0 : Math.round((completedLessonIds.length / totalLessons) * 100);

  // Fallback initial lesson selection
  useEffect(() => {
    if (isLoaded && courseModules.length > 0 && !activeLessonId) {
      setActiveModuleId(courseModules[0].id);
      if (courseModules[0].lessons.length > 0) {
         setActiveLessonId(courseModules[0].lessons[0].id);
      }
    }
  }, [isLoaded, courseModules]);

  // Carrega Progresso Geral
  useEffect(() => {
     async function loadGlobalProgress() {
        const completed = await getAllProgress();
        setCompletedLessonIds(completed.map(c => c.lesson_id));
     }
     if(isLoaded) loadGlobalProgress();
  }, [isLoaded]);

  // Carrega Dados da Aula Específica quando o usuário clica
  useEffect(() => {
    async function loadSpecificLessonData() {
       if (!activeLessonId) return;
       const data = await getLessonUserProgress(activeLessonId);
       if (data) {
         setSmartNotes(data.smart_note || "");
         setLessonRating(data.rating || 0);
       } else {
         setSmartNotes("");
         setLessonRating(0);
       }
       setFakeCommunityComments([]); // Clear dummy comments per lesson
    }
    loadSpecificLessonData();
  }, [activeLessonId]);


  const activeModuleData = courseModules?.find(m => m.id === activeModuleId);
  const activeLessonData = activeModuleData?.lessons?.find(l => l.id === activeLessonId);

  const handleLessonClick = (mod, lesson) => {
    // Retiramos o "unlockedState" engessado pelo Quiz e deixamos mais fluido
    setActiveModuleId(mod.id);
    setActiveLessonId(lesson.id);
  };

  const handleRateLesson = async (ratingValue) => {
    if(activeLessonData) {
      setLessonRating(ratingValue);
      await saveLessonFeedback(activeLessonData.id, ratingValue, undefined);
    }
  };

  const handleSaveNotes = async () => {
    if(activeLessonData) {
       await saveLessonFeedback(activeLessonData.id, undefined, smartNotes);
       alert("Anotações salvas em nuvem na AFIC com sucesso!");
    }
  };

  const handleMarkAsDone = async () => {
    if(activeLessonData) {
       await markLessonAsCompleted(activeLessonData.id);
       if(!completedLessonIds.includes(activeLessonData.id)) {
          setCompletedLessonIds(prev => [...prev, activeLessonData.id]);
       }
    }
  };

  const handleAddComment = () => {
    if(!newComment) return;
    setFakeCommunityComments(prev => [...prev, newComment]);
    setNewComment("");
  };

  const renderVideoPlayer = (url) => {
    if (!url) return <div className="text-gray-400 font-medium text-center p-8">Link do vídeo não disponível.<br/>Adicione no Painel AFIC.</div>;
    
    // YouTube
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      let videoId = '';
      if (url.includes('youtube.com/watch')) {
        videoId = new URLSearchParams(url.split('?')[1]).get('v');
      } else {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      }
      return (
        <iframe 
          className="w-full h-full object-cover" 
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`} 
          title="YouTube video player" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        ></iframe>
      );
    }
    
    // Vimeo
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1].split(/[?/#]/)[0];
      return (
        <iframe 
          className="w-full h-full object-cover" 
          src={`https://player.vimeo.com/video/${videoId}`} 
          frameBorder="0" 
          allow="autoplay; fullscreen; picture-in-picture" 
          allowFullScreen
        ></iframe>
      );
    }

    // Default HTML5 Video (.mp4)
    return (
      <video 
        src={url} 
        controls 
        className="w-full h-full object-cover"
        controlsList="nodownload"
      />
    );
  };

  if (!isLoaded) return <div className="p-12 text-center font-bold text-gray-500">Conectando aos servidores da AFIC...</div>;

  if (isAdminMode) {
    return <AcademyAdmin onExit={() => setIsAdminMode(false)} />;
  }

  const isCurrentLessonCompleted = activeLessonId && completedLessonIds.includes(activeLessonId);

  return (
    <div className="w-full max-w-7xl mx-auto pb-20">
      
      {/* ─── GAMIFICATION SYSTEM ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="flex-1 w-full relative">
            <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
               <span>Seu Progresso de Formação</span>
               <span className={progressPercentage === 100 ? "text-[#cda434]" : ""}>{progressPercentage}% Concluído</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                 className="bg-gradient-to-r from-[#0a2540] to-[#cda434] h-3 rounded-full transition-all duration-1000 ease-out" 
                 style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
         </div>
         {progressPercentage === 100 && (
           <button 
             onClick={() => setShowCertificate(true)}
             className="shrink-0 bg-[#cda434] hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center gap-2 transform transition-transform hover:scale-105"
           >
             🎓 Emitir Certificado
           </button>
         )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ===== LADO ESQUERDO: VIDEO PLAYER & MATERIAIS ===== */}
        <div className="flex-1 flex flex-col gap-6">
          
          <div className="bg-[#0f1419] rounded-xl overflow-hidden shadow-xl border border-[rgba(255,255,255,0.05)] aspect-video relative flex items-center justify-center group">
              {activeLessonData ? (
                 <>
                   {activeLessonData.isLive && (
                      <div className="absolute top-4 left-4 z-10 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded animate-pulse shadow-lg flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-white opacity-90 inline-block"></span> AO VIVO
                      </div>
                   )}
                   {renderVideoPlayer(activeLessonData.videoUrl)}
                 </>
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
                  <div className="flex items-center gap-4">
                    <p className="text-gray-500 text-sm">Escola AFIC • Módulo {activeModuleData?.title || ''} • Duração: {activeLessonData.duration}</p>
                    <div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                      <span className="text-xs font-bold text-gray-600 mr-1">Avaliação:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star} 
                          onClick={() => handleRateLesson(star)}
                          className={`text-lg transition-colors hover:scale-110 ${star <= lessonRating ? 'text-[#cda434]' : 'text-gray-300'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAdminMode(true)}
                  className="text-xs bg-gray-100 text-gray-500 hover:text-black font-semibold py-1 px-3 rounded shadow-sm border border-gray-200"
                >
                  ⚙️ Estúdio Gestor AFIC
                </button>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                <button 
                   onClick={handleMarkAsDone}
                   disabled={isCurrentLessonCompleted}
                   className={`flex-1 md:flex-none inline-flex justify-center items-center gap-2 px-6 py-3 text-sm font-bold rounded-lg transition-all ${isCurrentLessonCompleted ? 'bg-emerald-100 text-emerald-700 cursor-default opacity-80' : 'bg-green-600 text-white hover:bg-green-700 shadow-md transform hover:-translate-y-0.5'}`}
                >
                   {isCurrentLessonCompleted ? '✅ Aula Concluída' : 'Marcar Aula como Concluída'}
                </button>

                {activeLessonData.pdfUrl && activeLessonData.pdfUrl.length > 5 && (
                  <a 
                    href={activeLessonData.pdfUrl} 
                    className="flex-1 md:flex-none inline-flex justify-center items-center gap-2 px-5 py-3 text-sm font-semibold rounded-lg text-[#0a2540] bg-[#eef1f6] hover:bg-[#e1e6f0] transition-colors cursor-pointer"
                    target="_blank" rel="noreferrer"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Baixar Material de Apoio (.pdf)
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Ferramentas do Aluno (Notes / Q&A) */}
          {activeLessonData && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
               
               <div className="bg-yellow-50/50 border border-yellow-200 rounded-xl p-5 shadow-sm">
                 <div className="flex items-center gap-2 mb-3">
                   <span className="text-xl">📝</span>
                   <h4 className="font-bold text-gray-800 text-sm">Anotações Inteligentes</h4>
                 </div>
                 <textarea 
                    className="w-full h-32 p-3 text-sm bg-transparent border-none focus:ring-0 resize-none text-gray-700 placeholder-gray-400" 
                    placeholder="Quais insights principais você teve agora? As anotações salvam automaticamente na AFIC Cloud."
                    value={smartNotes}
                    onChange={e => setSmartNotes(e.target.value)}
                 ></textarea>
                 <button onClick={handleSaveNotes} className="w-full mt-2 bg-yellow-200/50 hover:bg-yellow-300/50 text-yellow-800 font-bold py-2 rounded-lg text-xs transition-colors">
                   Sincronizar Cofre
                 </button>
               </div>

               <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex flex-col">
                 <div className="flex items-center gap-2 mb-3">
                   <span className="text-xl">💬</span>
                   <h4 className="font-bold text-gray-800 text-sm">Quadro de Discussões (Q&A)</h4>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto max-h-32 mb-3 space-y-3">
                   {fakeCommunityComments.map((comment, i) => (
                     <div key={i} className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 border border-gray-100">
                       <strong>Você: </strong> {comment}
                     </div>
                   ))}
                   {fakeCommunityComments.length === 0 && (
                     <p className="text-xs text-center text-gray-400 py-4">Seja o primeiro a levantar uma questão sobre este material.</p>
                   )}
                 </div>

                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newComment} 
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Sua dúvida ou constatação..." 
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                    <button onClick={handleAddComment} className="bg-[#0a2540] text-white px-4 py-2 rounded-lg font-bold text-sm">Enviar</button>
                 </div>
               </div>

             </div>
          )}
        </div>

        {/* ===== LADO DIREITO: TRILHA (MODULES SIDEBAR) ===== */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          <h3 className="text-lg font-bold text-gray-900 px-1">Trilha de Inteligência {progressPercentage}%</h3>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {courseModules?.map((mod, index) => {
              const isActiveModule = activeModuleId === mod.id;

              return (
                <div key={mod.id} className="border-b border-gray-100 last:border-0">
                  <div className={`p-4 flex items-center gap-3 transition-colors ${isActiveModule ? 'bg-blue-50/50' : 'bg-white hover:bg-gray-50'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#0a2540] text-white text-xs font-bold`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-gray-900">{mod.title}</h4>
                      <p className="text-xs text-gray-500">{mod.lessons.length} Aulas</p>
                    </div>
                  </div>

                  <div className="pb-3 px-4">
                    {mod.lessons.map(lesson => {
                      const isCurrentLesson = activeLessonId === lesson.id;
                      const isCompleted = completedLessonIds.includes(lesson.id);
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonClick(mod, lesson)}
                          className={`w-full flex justify-between items-center p-3 mt-1 rounded-lg text-left text-sm transition-colors ${isCurrentLesson ? 'bg-blue-600 text-white font-medium shadow-md' : (isCompleted ? 'bg-emerald-50 text-emerald-900 border border-emerald-100 hover:bg-emerald-100' : 'text-gray-600 hover:bg-gray-100')}`}
                        >
                          <div className="flex items-center gap-3 truncate pr-2">
                             <span className="shrink-0">{isCurrentLesson ? '▶️' : (isCompleted ? '✅' : '📄')}</span>
                             <span className="truncate max-w-[200px]">{lesson.title}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            {lesson.isLive && !isCurrentLesson && (
                               <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            )}
                            <span className={`text-xs ${isCurrentLesson ? 'text-blue-200' : 'text-gray-400'}`}>{lesson.duration}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showCertificate && <CertificateModal onClose={() => setShowCertificate(false)} progress={progressPercentage} />}

      {/* Print styles exclusively for the certificate */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #print-certificate, #print-certificate * { visibility: visible; }
          #print-certificate { position: absolute; left: 0; top: 0; width: 100%; height: 100vh; padding: 0 !important; margin: 0 !important; }
          .no-print { display: none !important; }
        }
      `}} />
    </div>
  );
};
