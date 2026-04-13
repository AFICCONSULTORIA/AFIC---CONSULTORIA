import React, { useState } from 'react';
import { useAcademy } from './AcademyContext';

export const AcademyAdmin = ({ onExit }) => {
  const { courseModules, addModule, addLesson, deleteLesson } = useAcademy();
  
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [addingLessonToMod, setAddingLessonToMod] = useState(null);
  
  // Lesson Form state
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDuration, setLessonDuration] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonPdfUrl, setLessonPdfUrl] = useState("");

  const handleCreateModule = (e) => {
    e.preventDefault();
    if (newModuleTitle.trim() === "") return;
    addModule(newModuleTitle);
    setNewModuleTitle("");
  };

  const handleCreateLesson = (e) => {
    e.preventDefault();
    if (!lessonTitle) return;

    addLesson(addingLessonToMod, {
      title: lessonTitle,
      duration: lessonDuration || "00:00",
      videoUrl: lessonVideoUrl,
      pdfUrl: lessonPdfUrl || "#"
    });

    setAddingLessonToMod(null);
    setLessonTitle("");
    setLessonDuration("");
    setLessonVideoUrl("");
    setLessonPdfUrl("");
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-20 fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Sovereign Studio</h2>
          <p className="text-gray-500">Painel de Administração da Academia</p>
        </div>
        <button 
          onClick={onExit}
          className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-200"
        >
          Sair do Modo Admin
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LADO ESQUERDO - CRIAR CONTEÚDO */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-lg mb-4">Adicionar Novo Módulo</h3>
            <form onSubmit={handleCreateModule} className="space-y-3">
              <input 
                type="text" 
                placeholder="Ex: Módulo 4: Criptoativos" 
                className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={newModuleTitle}
                onChange={e => setNewModuleTitle(e.target.value)}
              />
              <button type="submit" className="w-full bg-[#0a2540] text-white p-3 rounded-md font-bold hover:bg-blue-900">
                Criar Módulo
              </button>
            </form>
          </div>
        </div>

        {/* LADO DIREITO - ESTRUTURA ATUAL */}
        <div className="lg:col-span-2">
          <h3 className="font-bold text-xl mb-4">Estrutura Curricular Atual</h3>
          
          <div className="space-y-6">
            {courseModules.map(mod => (
              <div key={mod.id} className="bg-white border text-left border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                  <h4 className="font-bold text-gray-900 text-lg">{mod.title}</h4>
                  <button 
                    onClick={() => setAddingLessonToMod(mod.id)}
                    className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold hover:bg-blue-200"
                  >
                    + Nova Aula
                  </button>
                </div>

                <div className="p-0">
                  {mod.lessons.length === 0 ? (
                    <div className="p-4 text-gray-400 text-sm italic">Nenhuma aula cadastrada.</div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <tbody>
                        {mod.lessons.map(lesson => (
                          <tr key={lesson.id} className="border-b last:border-0 border-gray-100 hover:bg-gray-50">
                            <td className="p-3">
                              <span className="font-medium text-gray-800 text-sm">{lesson.title}</span>
                              <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">{lesson.videoUrl}</div>
                            </td>
                            <td className="p-3 text-xs text-gray-500">{lesson.duration}</td>
                            <td className="p-3 text-right">
                              <button 
                                onClick={() => deleteLesson(mod.id, lesson.id)}
                                className="text-red-500 hover:text-red-700 font-bold text-sm"
                              >
                                Remover
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {mod.quiz && (
                    <div className="p-3 bg-[#fbf9f4] border-t border-gray-200 flex items-center justify-between">
                       <span className="text-sm font-bold text-[#a07c22]">🏆 Quiz de Certificação Ativo</span>
                       <span className="text-xs text-gray-500">{mod.quiz.questions.length} Questões</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Nova Aula */}
      {addingLessonToMod && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">Adicionar Nova Aula</h3>
              <button onClick={() => setAddingLessonToMod(null)} className="text-gray-400 hover:text-gray-800 text-xl">&times;</button>
            </div>
            <form onSubmit={handleCreateLesson} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Título da Aula</label>
                <input type="text" required value={lessonTitle} onChange={e=>setLessonTitle(e.target.value)} className="w-full border border-gray-300 rounded p-2" placeholder="Ex: Macroeconomia Básica"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Duração Estimada</label>
                <input type="text" value={lessonDuration} onChange={e=>setLessonDuration(e.target.value)} className="w-full border border-gray-300 rounded p-2" placeholder="Ex: 35:20"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">URL do Vídeo</label>
                <input type="url" required value={lessonVideoUrl} onChange={e=>setLessonVideoUrl(e.target.value)} className="w-full border border-gray-300 rounded p-2" placeholder="https://vimeo.com/..."/>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">URL do Material de Apoio (PDF)</label>
                <input type="url" value={lessonPdfUrl} onChange={e=>setLessonPdfUrl(e.target.value)} className="w-full border border-gray-300 rounded p-2" placeholder="Link do Google Drive (Opcional)"/>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-[#0a2540] text-white p-3 rounded font-bold hover:bg-blue-900">Salvar Aula</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
