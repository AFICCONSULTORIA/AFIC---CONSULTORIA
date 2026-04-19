import React, { useState } from 'react';

export const LandingPage = ({ onEnterSystem }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    // O login real é feito pelo app.js
    if (typeof window.handleAuthSubmit === 'function') {
      window.handleAuthSubmit(email, password, isLogin);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a2540] via-[#051845] to-[#001020] text-white">
      {/* Dedicated Login Screen */}
      {showLogin && (
        <div style={{
          position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #0a2540 0%, #051845 50%, #001020 100%)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            position: 'absolute', inset: 0, overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: '10%', left: '10%', width: '400px', height: '400px', 
              background: '#D4AF37', borderRadius: '50%', filter: 'blur(150px)', opacity: 0.15
            }} />
            <div style={{
              position: 'absolute', bottom: '20%', right: '10%', width: '300px', height: '300px', 
              background: '#1e3a5f', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.3
            }} />
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.95)', padding: '48px', borderRadius: '24px', maxWidth: '420px', width: '90%',
            color: '#051845', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{textAlign: 'center', marginBottom: '32px'}}>
              <img src="/covers/afic_banner.png" alt="AFIC" style={{height: '40px', marginBottom: '16px'}} />
              <h2 style={{fontSize: '28px', fontWeight: '800', marginBottom: '8px'}}>
                {isLogin ? 'Acesso Restrito' : 'Criar Conta'}
              </h2>
              <p style={{fontSize: '15px', color: '#64748b'}}>
                {isLogin ? 'Entre com suas credenciais' : 'Cadastre-se para continuar'}
              </p>
            </div>
            <form onSubmit={handleLogin}>
              <input type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)}
                style={{width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '16px', background: '#f8fafc'}} required />
              <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)}
                style={{width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '16px', background: '#f8fafc'}} required />
              <button type="submit" disabled={loading}
                style={{width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: '#D4AF37', color: '#051845', fontWeight: '700', fontSize: '16px', cursor: 'pointer', marginTop: '8px'}}>
                {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Cadastrar')}
              </button>
            </form>
            <p style={{textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748b'}}>
              {isLogin ? 'Não tem conta?' : 'Já tem conta?'}
              <button onClick={() => setIsLogin(!isLogin)} style={{background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', marginLeft: '8px', fontWeight: '600'}}>
                {isLogin ? 'Crie agora' : 'Entre'}
              </button>
            </p>
            <button onClick={() => setShowLogin(false)} style={{
              position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', 
              color: '#94a3b8', fontSize: '28px', cursor: 'pointer', lineHeight: 1
            }}>×</button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37] rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500 rounded-full blur-[100px]" />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-32">
          <div className="text-center">
            <img 
              src="/covers/afic_banner.png" 
              alt="AFIC Consultoria" 
              className="w-full max-w-md mx-auto mb-8"
            />
            
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              <span className="text-[#D4AF37]">Inteligência</span> Financeira
              <br />
              <span className="text-white">para Decisões</span> Ricas
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed">
              Transforme seus números em riqueza. A consultoria financeira que cria muralhas 
              anti-falência e acelera seu caminho até a liberdade financeira.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setShowLogin(true)}
                className="bg-[#D4AF37] hover:bg-[#e8cc6e] text-[#0a2540] font-bold py-4 px-10 rounded-xl text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              >
                Entrar / Cadastrar
              </button>
              <button 
                onClick={onEnterSystem}
                className="border-2 border-white/30 hover:border-white/50 text-white font-bold py-4 px-10 rounded-xl text-lg transition-all"
              >
                Conhecer Sistema →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="bg-white text-[#0a2540] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-16">
            Como <span className="text-[#D4AF37]">Transformamos</span> sua Vida
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-[#0a2540] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4">Blindagem Financeira</h3>
              <p className="text-gray-600">
                Criamos muralhas anti-falência com reserva de emergência calculada matematicamente para você dormir tranquilo.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-[#0a2540] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4">Crescimento Exponencial</h3>
              <p className="text-gray-600">
                Sistemas de investimento com juros compostos que fazem seu patrimônio crecer automatico.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-[#0a2540] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.336 2.88.944M6.12 10.824a4.002 4.002 0 010 5.352M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4">Auditoria Inteligente</h3>
              <p className="text-gray-600">
                Identificamos e eliminam custos escondidos que corroem seu orçamento todos os meses.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-6">
            Pronto para transformation<span className="text-[#D4AF37]">?</span>
          </h2>
          <p className="text-gray-300 mb-8 text-lg">
            Junte-se a comunidade de empreendedores que estão construindo riqueza real.
          </p>
          
          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu melhor e-mail"
                className="flex-1 px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 outline-none focus:border-[#D4AF37]"
                required
              />
              <button 
                type="submit"
                className="bg-[#D4AF37] hover:bg-[#e8cc6e] text-[#0a2540] font-bold py-4 px-8 rounded-xl transition-all"
              >
                Quero Participar
              </button>
            </form>
          ) : (
            <div className="bg-green-500/20 border border-green-500 text-green-300 px-8 py-4 rounded-xl">
              ✓ Obrigado! Em breve entraremos em contato.
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <img src="/covers/afic_banner.png" alt="AFIC" className="h-8" />
            <span className="text-gray-400 text-sm">© 2024 AFIC Consultoria. Todos os direitos reservados.</span>
          </div>
          <button 
            onClick={onEnterSystem}
            className="text-[#D4AF37] hover:text-white transition-colors font-medium"
          >
           贤贤贤贤贤 Acessar Sistema →
          </button>
        </div>
      </div>
    </div>
  );
};