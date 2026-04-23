import React, { useState } from 'react';

export const LandingPage = () => {
  const openAuth = () => {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
    }
  };

  const openAnalisePerfil = () => {
    const page = document.getElementById('page-analise-perfil');
    if (page) {
      page.classList.remove('page-hidden');
      page.style.display = 'flex';
      window.location.hash = 'analise-perfil';
    }
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] dark:bg-[#0f0f1d] text-[#051845] dark:text-[#f1f5f9] font-sans selection:bg-[#D4AF37] selection:text-[#051845]">
      {/* ─── HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-[1000] bg-[#001240]/95 backdrop-blur-md shadow-lg py-3">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-10 h-10 bg-[#D4AF37] flex items-center justify-center">
              <span className="text-[#001240] font-bold text-xl">A</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-xl leading-none tracking-tight text-white">AFIC</span>
              <span className="text-[9px] font-bold text-[#D4AF37] tracking-[0.3em] uppercase leading-none mt-1">Consultoria</span>
            </div>
          </div>

          {/* Desktop Navigation Bar */}
          <nav className="hidden lg:flex items-center gap-1">
            <div className="flex items-center bg-white/10 rounded-full p-1">
              <button onClick={() => scrollToSection('hero')} className="px-4 py-2 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all">
                Início
              </button>
              <button onClick={() => scrollToSection('features')} className="px-4 py-2 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all">
                Funcionalidades
              </button>
              <button onClick={() => scrollToSection('academy')} className="px-4 py-2 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all">
                Academia
              </button>
              <button onClick={() => scrollToSection('numbers')} className="px-4 py-2 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all">
                Resultados
              </button>
              <button onClick={() => scrollToSection('pricing')} className="px-4 py-2 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all">
                Planos
              </button>
            </div>
          </nav>

          <div className="flex items-center gap-3">
            <button onClick={openAnalisePerfil} className="border border-white/30 text-white px-4 py-2.5 font-bold hover:bg-white/10 transition-all text-sm">
              Análise de Perfil
            </button>
            <button onClick={openAuth} className="bg-[#D4AF37] text-[#001240] px-5 py-2.5 font-bold hover:shadow-lg hover:translate-y-[-2px] transition-all active:translate-y-0 text-sm">
              Acessar Sistema
            </button>
            <button className="lg:hidden text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section id="hero" className="relative min-h-[85vh] flex items-center overflow-hidden bg-[#faf8ff]">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-[#eef0ff] to-transparent opacity-50 -z-10"></div>
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center w-full">
            <div className="col-span-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
              </span>
              Educação Financeira de Acesso Real
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-8 tracking-tight text-[#051845]">
              Aprenda a Investir de Verdade e <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#D4AF37] to-[#B8860B]">Fuja das Armadilhas.</span>
            </h1>
            <p className="text-lg md:text-xl text-[#4a5068] mb-10 leading-relaxed max-w-xl">
              Saia da estaca zero e comece a construir seu patrimônio com as ferramentas que realmente funcionam. Um sistema simples, acessível e direto ao ponto para você nunca mais perder dinheiro com promessas vazias.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={openAuth} className="bg-[#051845] text-white px-10 py-4 text-base font-bold shadow-xl hover:shadow-[0_20px_40px_rgba(5,24,69,0.2)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                Iniciar Minha Jornada
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
              <button onClick={() => scrollToSection('features')} className="bg-white text-[#051845] border border-[#e5e5e5] px-10 py-4 text-base font-bold hover:bg-gray-50 transition-all flex items-center justify-center">
                Ver Como Funciona
              </button>
            </div>
            </div>
            
            {/* Right side - Image/Video placeholder */}
            <div className="lg:block col-span-1">
              <div className="relative z-10 p-4 bg-white shadow-2xl border-2 border-[#D4AF37]">
                <div className="aspect-video bg-gradient-to-br from-[#051845] to-[#0a2460] overflow-hidden flex items-center justify-center">
                  <img 
                    src="./covers/afic_banner.png" 
                    alt="AFIC Consultoria" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {/* Background decoration */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-[#D4AF37]/10 -z-10 rotate-12 mt-8 ml-4"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] border border-[#051845]/10 -z-10 -rotate-6 mt-8 ml-4"></div>
            </div>
        </div>
        
        {/* Floating elements for visual interest */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-[#051845]/5 rounded-full blur-2xl -z-10"></div>
      </section>

      {/* ─── ASSESSMENT CTA ─── */}
      <section className="bg-[#051845] py-20 text-white overflow-hidden relative">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-display font-extrabold mb-6">Você Está Protegido ou Apenas com Sorte?</h2>
          <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto">Faça um diagnóstico rápido e gratuito da sua saúde financeira e descubra se você está no caminho certo ou caindo em armadilhas invisíveis.</p>
          <button 
            onClick={openAnalisePerfil}
            className="inline-block bg-[#D4AF37] hover:bg-[#c9a227] text-[#051845] font-display font-bold text-xl px-12 py-5 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer"
          >
            Fazer Análise de Perfil
          </button>
        </div>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </section>

      {/* ─── PARA QUEM É A AFIC ─── */}
      <section className="py-24 bg-white dark:bg-[#001240]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-[#D4AF37] uppercase tracking-[0.3em] mb-4">Para quem é a AFIC?</h2>
            <h3 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight">Chega de Perder Dinheiro por Falta de Conhecimento.</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-8 bg-[#faf8ff] dark:bg-[#1a1a2e] border border-[#ebedff] dark:border-[#252545] hover:border-[#D4AF37]/30 transition-all">
              <div className="w-12 h-12 bg-[#051845] flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
              <h4 className="text-xl font-display font-bold mb-3">Iniciantes do Zero</h4>
              <p className="text-[#4a5068] dark:text-[#94a3b8]">Para quem nunca investiu e quer um passo a passo seguro, sem linguagem técnica complicada.</p>
            </div>
            <div className="p-8 bg-[#faf8ff] dark:bg-[#1a1a2e] border border-[#ebedff] dark:border-[#252545] hover:border-[#D4AF37]/30 transition-all">
              <div className="w-12 h-12 bg-[#051845] flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <h4 className="text-xl font-display font-bold mb-3">Cansados de Armadilhas</h4>
              <p className="text-[#4a5068] dark:text-[#94a3b8]">Para quem já percebeu que "dicas quentes" não funcionam e quer a matemática real da riqueza.</p>
            </div>
            <div className="p-8 bg-[#faf8ff] dark:bg-[#1a1a2e] border border-[#ebedff] dark:border-[#252545] hover:border-[#D4AF37]/30 transition-all">
              <div className="w-12 h-12 bg-[#051845] flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
              </div>
              <h4 className="text-xl font-display font-bold mb-3">Buscadores de Liberdade</h4>
              <p className="text-[#4a5068] dark:text-[#94a3b8]">Para quem quer que o dinheiro trabalhe para si, pagando um preço justo por educação de qualidade.</p>
            </div>
            <div className="p-8 bg-[#faf8ff] dark:bg-[#1a1a2e] border border-[#ebedff] dark:border-[#252545] hover:border-[#D4AF37]/30 transition-all">
              <div className="w-12 h-12 bg-[#051845] flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              </div>
              <h4 className="text-xl font-display font-bold mb-3">Mentes Práticas</h4>
              <p className="text-[#4a5068] dark:text-[#94a3b8]">Para quem quer ferramentas que simplificam a vida, sem precisar ser um expert em economia.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── VANTAGENS AFIC ─── */}
      <section className="py-24 bg-[#051845] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-[#D4AF37] uppercase tracking-[0.3em] mb-4">Vantagens AFIC</h2>
            <h3 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight">Por que escolher a AFIC?</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              </div>
              <h4 className="text-xl font-display font-bold mb-3">Método Anti-Armadilha</h4>
              <p className="text-white/70">Aprenda a identificar o que é investimento real e o que é pura enganação financeira.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              </div>
              <h4 className="text-xl font-display font-bold mb-3">Ferramentas Simples</h4>
              <p className="text-white/70">Calculadoras e dashboards que facilitam sua vida, acessíveis na palma da mão.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <h4 className="text-xl font-display font-bold mb-3">Comunidade que se Ajuda</h4>
              <p className="text-white/70">Um grupo de pessoas que, como você, decidiu tomar as rédeas do próprio dinheiro.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <h4 className="text-xl font-display font-bold mb-3">Custo-Benefício Real</h4>
              <p className="text-white/70">Educação de alto nível por um valor que cabe no seu dia a dia.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              </div>
              <h4 className="text-xl font-display font-bold mb-3">Aulas Direto ao Ponto</h4>
              <p className="text-white/70">Nada de enrolação. Você aprende o que precisa para começar a investir com segurança hoje mesmo.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              </div>
              <h4 className="text-xl font-display font-bold mb-3">Sua Proteção em 1º Lugar</h4>
              <p className="text-white/70">Foco total em proteger o que você já conquistou enquanto busca o crescimento.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES SECTION ─── */}
      <section id="features" className="py-24 md:py-32 bg-white dark:bg-[#001240]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-sm font-bold text-[#D4AF37] uppercase tracking-[0.3em] mb-4">Módulos Exclusivos</h2>
            <h3 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight">O Arsenal do Investidor Consciente.</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-[#faf8ff] dark:bg-[#1a1a2e] border border-transparent hover:border-[#D4AF37]/30 transition-all group">
              <div className="w-14 h-14 bg-[#051845] dark:bg-[#252545] flex items-center justify-center mb-6 group-hover:bg-[#D4AF37] transition-colors duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#D4AF37] group-hover:text-[#051845]"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              </div>
              <h4 className="text-xl font-display font-bold mb-4">Seu Painel de Controle</h4>
              <p className="text-[#4a5068] dark:text-[#94a3b8] leading-relaxed">
                Visualize seu dinheiro crescendo e entenda exatamente para onde cada real está indo, sem complicação.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-[#faf8ff] dark:bg-[#1a1a2e] border border-transparent hover:border-[#D4AF37]/30 transition-all group">
              <div className="w-14 h-14 bg-[#051845] dark:bg-[#252545] flex items-center justify-center mb-6 group-hover:bg-[#D4AF37] transition-colors duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#D4AF37] group-hover:text-[#051845]"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
              </div>
              <h4 className="text-xl font-display font-bold mb-4">Escola de Investimento Real</h4>
              <p className="text-[#4a5068] dark:text-[#94a3b8] leading-relaxed">
                Masterclasses que te ensinam tudo: de como abrir conta na corretora a como montar sua primeira carteira.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-[#faf8ff] dark:bg-[#1a1a2e] border border-transparent hover:border-[#D4AF37]/30 transition-all group">
              <div className="w-14 h-14 bg-[#051845] dark:bg-[#252545] flex items-center justify-center mb-6 group-hover:bg-[#D4AF37] transition-colors duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#D4AF37] group-hover:text-[#051845]"><rect x="2" y="2" width="20" height="8"></rect><rect x="2" y="14" width="20" height="8"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
              </div>
              <h4 className="text-xl font-display font-bold mb-4">Calculadoras da Liberdade</h4>
              <p className="text-[#4a5068] dark:text-[#94a3b8] leading-relaxed">
                Use a matemática a seu favor para projetar seu futuro e sair das dívidas de uma vez por todas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ACADEMY PREVIEW (Image/Mockup logic) ─── */}
      <section id="academy" className="py-24 bg-[#faf8ff] dark:bg-[#0f0f1d] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-sm font-bold text-[#D4AF37] uppercase tracking-[0.3em] mb-4">Conhecimento é Soberania</h2>
            <h3 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight mb-8">Conhecimento que te Protege e Liberta.</h3>
            <ul className="space-y-6 mb-10">
              <li className="flex items-start gap-4">
                <div className="mt-1 w-5 h-5 bg-[#D4AF37] rounded-full flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#051845" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div>
                  <span className="font-bold text-lg">Investindo do Zero</span>
                  <p className="text-[#4a5068] dark:text-[#94a3b8]">O mapa completo para dar o seu primeiro passo no mercado financeiro com total confiança.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 w-5 h-5 bg-[#D4AF37] rounded-full flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#051845" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div>
                  <span className="font-bold text-lg">Escudo Anti-Ficção</span>
                  <p className="text-[#4a5068] dark:text-[#94a3b8]">Como identificar falsas promessas e gurus financeiros antes de colocar seu dinheiro em risco.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 w-5 h-5 bg-[#D4AF37] rounded-full flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#051845" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div>
                  <span className="font-bold text-lg">A Matemática da Riqueza</span>
                  <p className="text-[#4a5068] dark:text-[#94a3b8]">Aprenda o poder real dos juros compostos de um jeito simples e aplicável à sua realidade.</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="flex-1 relative">
            <div className="relative z-10 p-4 bg-white dark:bg-[#0f0f1d] shadow-2xl border border-[#ebedff] dark:border-[#252545]">
               <div className="aspect-video bg-gradient-to-br from-[#051845] to-[#0a2460] overflow-hidden flex items-center justify-center text-[#D4AF37]">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
               </div>
               <div className="p-6">
                 <div className="w-1/4 h-2 bg-[#D4AF37] mb-4"></div>
                 <div className="w-full h-4 bg-gray-100 dark:bg-white/5 mb-3"></div>
                 <div className="w-2/3 h-4 bg-gray-100 dark:bg-white/5"></div>
               </div>
            </div>
            {/* Background decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-[#D4AF37]/10 -z-10 rotate-12"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] border border-[#051845]/10 -z-10 -rotate-6"></div>
          </div>
        </div>
      </section>

      {/* ─── PRICING CTA ─── */}
      <section id="pricing" className="py-24 bg-white dark:bg-[#001240]">
        <div className="max-w-4xl mx-auto px-6 text-center">
            <h3 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight mb-8">Comece Sua Mudança de Vida com um Valor que Cabe no Bolso</h3>
            <p className="text-[#4a5068] dark:text-[#94a3b8] mb-12 text-lg">Você não precisa de fortunas para começar a investir, mas precisa do conhecimento certo para não ser passado para trás.</p>
            
            <div className="bg-[#051845] p-12 relative overflow-hidden text-left md:flex items-center justify-between gap-8">
               <div className="relative z-10">
                 <div className="text-[#D4AF37] font-bold text-sm uppercase tracking-widest mb-2">O Método AFIC</div>
                 <h4 className="text-3xl font-display font-extrabold text-white mb-4">Acesso à Academia AFIC</h4>
                 <p className="text-white/70 text-sm mb-6 max-w-sm">Tudo o que você precisa para aprender a investir de verdade, do zero, por um valor extremamente acessível.</p>
               </div>
               <div className="relative z-10 mt-8 md:mt-0">
                 <button onClick={openAnalisePerfil} className="w-full md:w-auto bg-[#D4AF37] text-[#051845] px-10 py-5 font-bold hover:bg-[#e8cc6e] transition-all shadow-xl">
                   Quero Aprender a Investir do Zero
                 </button>
                 <p className="text-white/40 text-[10px] text-center mt-3 uppercase tracking-tighter">Vagas limitadas para novos membros</p>
               </div>
               {/* Pattern */}
               <div className="absolute top-0 right-0 w-64 h-full bg-white/5 -skew-x-[30deg]"></div>
            </div>
            
            <p className="mt-8 text-sm text-[#4a5068] dark:text-[#94a3b8]">Pare de cair em armadilhas financeiras. <button onClick={openAnalisePerfil} className="text-[#D4AF37] font-bold underline">Comece sua análise gratuita</button> agora.</p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-20 bg-[#faf8ff] dark:bg-[#1a1a2e] border-t border-[#ebedff] dark:border-[#252545]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between gap-12 mb-16">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-[#051845] dark:bg-[#D4AF37] flex items-center justify-center">
                  <span className="text-[#D4AF37] dark:text-[#051845] font-bold text-base">A</span>
                </div>
                <span className="font-display font-extrabold text-lg leading-none tracking-tight">AFIC</span>
              </div>
              <p className="text-sm text-[#4a5068] dark:text-[#94a3b8] leading-relaxed mb-6">
                A AFIC Consultoria é a força de Mato Grosso construindo riqueza e inteligência financeira institucional no Centro-Oeste brasileiro.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-8 h-8 rounded-full bg-[#ebedff] dark:bg-[#252545] flex items-center justify-center hover:bg-[#D4AF37] transition-colors"><svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.58c-1.14 0-2.06-.92-2.06-2.06 0-1.14.92-2.06 2.06-2.06 1.14 0 2.06.92 2.06 2.06 0 1.14-.92 2.06-2.06 2.06zM20.45 20.45h-3.56v-5.6c0-1.34-.03-3.06-1.87-3.06-1.87 0-2.15 1.46-2.15 2.96v5.7h-3.56V9h3.42v1.56h.05c.48-.91 1.65-1.86 3.4-1.86 3.63 0 4.3 2.39 4.3 5.5v6.25z"/></svg></a>
                <a href="#" className="w-8 h-8 rounded-full bg-[#ebedff] dark:bg-[#252545] flex items-center justify-center hover:bg-[#D4AF37] transition-colors"><svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 1.69.073 7.053.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 1.703 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-1.704 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-1.696-6.762-6.979-6.979C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 flex-1 md:justify-items-end">
              <div>
                <h5 className="font-bold text-sm mb-6">Plataforma</h5>
                <ul className="space-y-4 text-xs text-[#4a5068] dark:text-[#94a3b8] font-medium">
                  <li><button onClick={() => scrollToSection('features')} className="hover:text-[#D4AF37] transition-all">Dashboards</button></li>
                  <li><button onClick={() => scrollToSection('features')} className="hover:text-[#D4AF37] transition-all">Toolkit</button></li>
                  <li><button onClick={() => scrollToSection('academy')} className="hover:text-[#D4AF37] transition-all">Academia</button></li>
                  <li><button onClick={() => scrollToSection('features')} className="hover:text-[#D4AF37] transition-all">Comunidade</button></li>
                </ul>
              </div>
              <div>
                <h5 className="font-bold text-sm mb-6">Empresa</h5>
                <ul className="space-y-4 text-xs text-[#4a5068] dark:text-[#94a3b8] font-medium">
                  <li><a href="#" className="hover:text-[#D4AF37] transition-all">Sobre Nós</a></li>
                  <li><a href="#" className="hover:text-[#D4AF37] transition-all">Consultoria Sênior</a></li>
                  <li><a href="#" className="hover:text-[#D4AF37] transition-all">Termos de Uso</a></li>
                </ul>
              </div>
              <div>
                <h5 className="font-bold text-sm mb-6">Suporte</h5>
                <ul className="space-y-4 text-xs text-[#4a5068] dark:text-[#94a3b8] font-medium">
                  <li><a href="#" className="hover:text-[#D4AF37] transition-all">Central de Ajuda</a></li>
                  <li><a href="#" className="hover:text-[#D4AF37] transition-all">Fale com Consultor</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-[#ebedff] dark:border-[#252545] flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="text-[10px] text-[#8b90a0] uppercase tracking-widest font-bold">
               © 2026 AFIC Consultoria. Todos os direitos reservados.
             </div>
             <div className="flex gap-6 text-[10px] text-[#8b90a0] font-bold uppercase tracking-widest">
               <a href="#" className="hover:text-[#D4AF37]">Privacidade</a>
               <a href="#" className="hover:text-[#D4AF37]">Segurança</a>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};