import React, { useState } from 'react';
import { useAcademy } from './AcademyContext';
import { supabase } from '../lib/supabase';

export const AcademyAdmin = ({ onExit }) => {
  const { courseModules, addModule, addLesson, deleteLesson, editLesson, deleteModule, editModule } = useAcademy();
  
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState("");
  const [deleteModuleConfirm, setDeleteModuleConfirm] = useState(null);
  // { type: 'add', moduleId: ID } OU { type: 'edit', moduleId: ID, lesson: { ...dados } }
  const [modalState, setModalState] = useState(null);
  
  // Lesson Form state
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDuration, setLessonDuration] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonPdfUrl, setLessonPdfUrl] = useState("");
  const [lessonIsLive, setLessonIsLive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!supabase) {
      alert("Supabase SDK não detectado.");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `academy_pdf_${Date.now()}.${fileExt}`;
      const filePath = `academy/${fileName}`;

      const { data, error } = await supabase.storage
        .from('community-attachments')
        .upload(filePath, file);

      if (error) {
        console.error("Erro no upload:", error);
        alert("Erro no upload ao conectar no Storage: " + error.message);
      } else {
        const { data: urlData } = supabase.storage
          .from('community-attachments')
          .getPublicUrl(filePath);
        
        setLessonPdfUrl(urlData.publicUrl);
        alert("PDF enviado com sucesso! O formulário foi preenchido automaticamente.");
      }
    } catch (err) {
       alert("Erro crítico ao enviar arquivo: " + err.message);
    }
    setIsUploading(false);
  };

  const handleCreateModule = (e) => {
    e.preventDefault();
    if (newModuleTitle.trim() === "") return;
    addModule(newModuleTitle);
    setNewModuleTitle("");
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!lessonTitle) return;

    if (modalState.type === 'add') {
      await addLesson(modalState.moduleId, {
        title: lessonTitle,
        duration: lessonDuration,
        videoUrl: lessonVideoUrl,
        pdfUrl: lessonPdfUrl,
        isLive: lessonIsLive
      });
    } else if (modalState.type === 'edit') {
      await editLesson(modalState.moduleId, modalState.lesson.id, {
        title: lessonTitle,
        duration: lessonDuration,
        videoUrl: lessonVideoUrl,
        pdfUrl: lessonPdfUrl,
        isLive: lessonIsLive
      });
    }

    closeModal();
  };

  const openAddLesson = (moduleId) => {
    setLessonTitle("");
    setLessonDuration("");
    setLessonVideoUrl("");
    setLessonPdfUrl("");
    setLessonIsLive(false);
    setModalState({ type: 'add', moduleId });
  };

  const openEditLesson = (moduleId, lesson) => {
    setLessonTitle(lesson.title);
    setLessonDuration(lesson.duration);
    setLessonVideoUrl(lesson.videoUrl);
    setLessonPdfUrl(lesson.pdfUrl || "");
    setLessonIsLive(lesson.isLive || false);
    setModalState({ type: 'edit', moduleId, lesson });
  };

  const closeModal = () => {
    setModalState(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-20 fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Estúdio AFIC</h2>
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
                  {editingModuleId === mod.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input 
                        type="text" 
                        value={editingModuleTitle}
                        onChange={(e) => setEditingModuleTitle(e.target.value)}
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-lg font-bold"
                        autoFocus
                      />
                      <button 
                        onClick={() => { editModule(mod.id, editingModuleTitle); setEditingModuleId(null); }}
                        className="text-green-600 font-bold text-sm"
                      >
                        Salvar
                      </button>
                      <button 
                        onClick={() => setEditingModuleId(null)}
                        className="text-gray-500 font-bold text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-bold text-gray-900 text-lg">{mod.title}</h4>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => { setEditingModuleId(mod.id); setEditingModuleTitle(mod.title); }}
                          className="text-gray-500 hover:text-gray-700 font-bold text-sm"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => setDeleteModuleConfirm(mod)}
                          className="text-red-500 hover:text-red-700 font-bold text-sm"
                        >
                          Remover
                        </button>
                        <button 
                          onClick={() => openAddLesson(mod.id)}
                          className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold hover:bg-blue-200"
                        >
                          + Nova Aula
                        </button>
                      </div>
                    </>
                  )}
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
                              <div className="flex gap-3 justify-end">
                                <button 
                                  onClick={() => openEditLesson(mod.id, lesson)}
                                  className="text-gray-500 hover:text-gray-800 font-bold text-sm"
                                >
                                  Editar
                                </button>
                                <button 
                                  onClick={() => deleteLesson(mod.id, lesson.id)}
                                  className="text-red-500 hover:text-red-700 font-bold text-sm"
                                >
                                  Remover
                                </button>
                              </div>
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

      {/* Modal Nova/Editar Aula */}
      {modalState && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">{modalState.type === 'add' ? 'Adicionar Nova Aula' : 'Editar Aula'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-800 text-xl">&times;</button>
            </div>
            <form onSubmit={handleSaveLesson} className="p-5 space-y-4">
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
                <div className="flex gap-2 items-center">
                  <input type="url" value={lessonPdfUrl} onChange={e=>setLessonPdfUrl(e.target.value)} className="w-full border border-gray-300 rounded p-2" placeholder="Link do Google Drive ou envie um arquivo 👉"/>
                  <label className={`shrink-0 bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded font-bold cursor-pointer hover:bg-gray-200 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {isUploading ? 'Enviando...' : '📁 Upload PDF'}
                    <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={isUploading}/>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-4 bg-red-50 p-3 rounded border border-red-100">
                <input type="checkbox" id="check-islive" checked={lessonIsLive} onChange={e=>setLessonIsLive(e.target.checked)} className="w-5 h-5 text-red-600 rounded focus:ring-red-500 border-gray-300 cursor-pointer"/>
                <label htmlFor="check-islive" className="text-sm font-bold text-red-900 cursor-pointer select-none">🚨 Marcar como Evento/Live (Aparecerá com selo pulsante)</label>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-[#0a2540] text-white p-3 rounded font-bold hover:bg-blue-900">Salvar Aula</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Módulo */}
      {deleteModuleConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-6 text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="font-bold text-xl text-gray-900 mb-2">Excluir Módulo?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Tem certeza que deseja excluir <strong>"{deleteModuleConfirm.title}"</strong> e todas as suas {deleteModuleConfirm.lessons.length} aulas?
              </p>
              <p className="text-red-500 text-xs mb-4">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteModuleConfirm(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => { deleteModule(deleteModuleConfirm.id); setDeleteModuleConfirm(null); }}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold hover:bg-red-600"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
