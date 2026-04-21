/* ═══════════════════════════════════════════════════════════════
   AFIC CONSULTORIA — Application Logic
   ═══════════════════════════════════════════════════════════════ */

// Função de inicialização chamada após DOM estar pronto
window.initApp = function() {
  console.log("AFIC App Initializing...");
  
  try {
    // ─── SUPABASE INITIALIZATION ───
    const supabase = window.aficSupabase;
    window.supabaseApp = supabase; // Tornar disponível globalmente
    let currentUser = null;
    let currentUserProfile = null;

    // ─── STRIPE INITIALIZATION ───
    const stripePublicKey = 'pk_test_51TJ2vhCBYPTHESLfqo7K3PBveOrIIJoWM0teVOdvbCJSgbQP6Ywxu98VIKNCexj0a4mMNOe9fKn3bkZRIaVpKp9500bP3nQGMc';
    let stripe = null;
    if (typeof Stripe !== 'undefined') {
      stripe = Stripe(stripePublicKey);
      console.log("Stripe initialized");
    }

    // ─── AUTHENTICATION HANDLERS ───
    console.log("AFIC Auth Bridge Initializing...");
    const authModal = document.getElementById('auth-modal');
    const authForm = document.getElementById('auth-form');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const authConfirmPassword = document.getElementById('auth-confirm-password');
    const groupConfirmPassword = document.getElementById('group-confirm-password');
    const authErrorMsg = document.getElementById('auth-error-msg');
    
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const btnAuthSubmit = document.getElementById('btn-auth-submit');
    const authToggleLink = document.getElementById('auth-toggle-link');
    const authToggleText = document.getElementById('auth-toggle-text');

    let authMode = 'login'; 

    if (authToggleLink) {
        authToggleLink.onclick = (e) => {
            e.preventDefault();
            authMode = authMode === 'login' ? 'signup' : 'login';
            console.log("Switching to " + authMode);
            
            if (authMode === 'signup') {
                authTitle.textContent = "Criar Conta AFIC";
                btnAuthSubmit.textContent = "Cadastrar Agora";
                authToggleText.textContent = "Já possui uma conta?";
                authToggleLink.textContent = "Entre aqui";
                groupConfirmPassword.style.display = 'block';
                authConfirmPassword.setAttribute('required', 'required');
            } else {
                authTitle.textContent = "Acesso Restrito";
                btnAuthSubmit.textContent = "Entrar";
                authToggleText.textContent = "Ainda não tem conta?";
                authToggleLink.textContent = "Crie agora";
                groupConfirmPassword.style.display = 'none';
                authConfirmPassword.removeAttribute('required');
            }
            authErrorMsg.style.display = 'none';
        };
    }

    const pageMap = {
        'home': 'page-home',
        'dashboard': 'page-dashboard',
        'tools': 'page-tools',
        'education': 'page-education',
        'community': 'page-community',
        'account': 'page-account',
        'plans': 'page-plans',
        'admin-assessment': 'page-admin-assessment',
        'admin-dashboard': 'page-admin-dashboard',
        'assessment': 'page-assessment'
    };

    const profileTypeSelect = document.getElementById('profile-type-select');
    const profileTypeMsg = document.getElementById('profile-type-msg');

    window.switchPage = function(pageName) {
        try {
            const pages = document.querySelectorAll('.page-content');
            pages.forEach(p => p.classList.add('page-hidden'));
            const targetId = pageMap[pageName];
            if (targetId) {
                const targetPage = document.getElementById(targetId);
                if (targetPage) {
                    targetPage.classList.remove('page-hidden');
                    targetPage.style.animation = 'none';
                    targetPage.offsetHeight;
                    targetPage.style.animation = '';
                }
            }
            console.log('Switched to page:', pageName);
            
            // Gerenciar visibilidade do sidebar baseado na página
            if (pageName === 'home') {
                document.body.classList.add('landing-mode');
            } else {
                document.body.classList.remove('landing-mode');
            }

            if (pageName === 'account') {
                loadProfileType();
            }
            
            if (pageName === 'admin-assessment') {
                loadAssessmentResponses();
            }
            
            if (pageName === 'admin-dashboard') {
                loadKanban();
            }
        } catch(err) {
            console.error('switchPage error:', err);
        }
    }

    async function checkAuthSession() {
        console.log("Checking session...");
        try {
            if (typeof switchPage === 'function') {
                switchPage('dashboard');
            }
            
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                currentUser = session.user;
                if (authModal) authModal.classList.add('hidden');
                console.log("User logged in: " + currentUser.email);
                await loadSupabaseData();
                checkAdminLink();
                if (profileTypeSelect) loadProfileType();
                document.body.classList.remove('landing-mode');
                switchPage('dashboard');
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                const dashLink = document.querySelector('.nav-link[data-page="dashboard"]');
                if (dashLink) dashLink.classList.add('active');
            } else {
                // Modo Landing Page para usuários não autenticados
                document.body.classList.add('landing-mode');
                switchPage('home');
                if (authModal) authModal.classList.add('hidden');
            }
        } catch (e) {
            console.error("Auth check failed:", e);
        }
    }

    if (authForm) {
        authForm.onsubmit = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Attempting " + authMode + " for " + authEmail.value);
            
            authErrorMsg.style.display = 'none';
            btnAuthSubmit.disabled = true;
            btnAuthSubmit.textContent = authMode === 'login' ? 'Entrando...' : 'Cadastrando...';

            const email = authEmail.value;
            const password = authPassword.value;

            try {
                if (authMode === 'login') {
                    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                    console.log("Login success.");
                    currentUser = { email };
                    checkAdminLink();
                    checkAuthSession();
                } else {
                    const confirm = authConfirmPassword.value;
                    if (password !== confirm) throw new Error("As senhas não coincidem.");

                    const { error } = await supabase.auth.signUp({ email, password });
                    if (error) throw error;
                    
                    authErrorMsg.style.color = '#388e3c';
                    authErrorMsg.textContent = "Conta criada! ✅ Verifique seu e-mail para validar.";
                    authErrorMsg.style.display = 'block';
                    console.log("Signup success request.");
                }
            } catch (err) {
                console.error("Auth action error:", err);
                let msg = err.message;
                if (msg.includes("Email not confirmed")) msg = "⚠️ Confirme seu e-mail antes de entrar.";
                authErrorMsg.textContent = msg;
                authErrorMsg.style.display = 'block';
                authErrorMsg.style.color = '#ff4d4f';
            } finally {
                btnAuthSubmit.disabled = false;
                btnAuthSubmit.textContent = authMode === 'login' ? 'Entrar' : 'Cadastrar Agora';
            }
        };
    }

    checkAuthSession();

    // ─── LOGOUT HANDLER ───
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async (e) => {
            e.preventDefault();
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Erro ao sair:', error.message);
            } else {
                currentUser = null;
                // Força o reload para calar vídeos, resetar states do React e limpar DOM.
                window.location.reload();
            }
        });
    }

    // ─── AFIC CONCIERGE (SUPPORT) ───
    const supportToggle = document.getElementById('support-toggle');
    const supportWidget = document.getElementById('support-widget');
    const closeSupport = document.getElementById('close-support');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');

    function addChatMessage(text, side) {
        if (!chatHistory) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${side === 'user' ? 'user-message' : 'bot-message'}`;
        msgDiv.textContent = text;
        chatHistory.appendChild(msgDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function getBotResponse(query) {
        const q = query.toLowerCase();
        
        if (q.includes('agendar') || q.includes('consultoria') || q.includes('falar')) {
            return "Com certeza. Podemos agendar um call de alocação estratégica diretamente com nosso consultor sênior. Gostaria de receber o link do calendário ou prefere que entremos em contato via WhatsApp?";
        }
        if (q.includes('plano') || q.includes('premium') || q.includes('elite') || q.includes('preço')) {
            return "Atualmente oferecemos dois tiers institucionais: o Private (R$ 490/mês) para gestão autônoma assistida, e o Elite (R$ 1.850/mês) com mentoria individual 1:1 e revisão trimestral de portfólio. Você pode ver mais detalhes na aba 'Minha Conta'.";
        }
        if (q.includes('seguro') || q.includes('dados') || q.includes('supabase')) {
            return "A AFIC utiliza criptografia de nível bancário e infraestrutura Supabase para garantir que seus dados patrimoniais estejam protegidos e sob sua total soberania.";
        }
        if (q.includes('ferramenta') || q.includes('calculadora') || q.includes('juros') || q.includes('simular')) {
            return "Nossas calculadoras de Projeção Institucional e Bola de Neve Patrimonial estão disponíveis na aba 'Ferramentas'. Elas utilizam modelos de capitalização composta para prever o seu ponto de ignição financeira.";
        }
        if (q.includes('oi') || q.includes('olá') || q.includes('bom dia') || q.includes('boa tarde')) {
            return "Olá! Sou o Concierge Digital da AFIC. Como posso auxiliar na arquitetura do seu patrimônio hoje?";
        }

        return "Entendo sua dúvida. Como esta é uma questão técnica, gostaria de ser transferido para um consultor humano ou prefere que eu procure informações mais detalhadas na nossa base de conhecimento institucional?";
    }

    if (supportToggle && supportWidget) {
        supportToggle.addEventListener('click', () => {
            supportWidget.classList.toggle('hidden');
            if (!supportWidget.classList.contains('hidden')) {
                chatInput.focus();
            }
        });

        if (closeSupport) {
            closeSupport.addEventListener('click', () => {
                supportWidget.classList.add('hidden');
            });
        }

        if (chatForm) {
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const msg = chatInput.value.trim();
                if (!msg) return;

                addChatMessage(msg, 'user');
                chatInput.value = '';

                setTimeout(() => {
                    const response = getBotResponse(msg);
                    addChatMessage(response, 'bot');
                }, 700);
            });
        }

        // Quick Actions
        document.querySelectorAll('.quick-action-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const query = tag.getAttribute('data-query');
                addChatMessage(query, 'user');
                setTimeout(() => {
                    const response = getBotResponse(query);
                    addChatMessage(response, 'bot');
                }, 700);
            });
        });
    }

    // ─── COUNTER ANIMATION ───
    function animateCounter(element, target, duration = 1500) {
        const start = 0;
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * eased);
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = target;
            }
        }
        
        requestAnimationFrame(update);
    }

    function animateFormattedCounter(element, targetStr, duration = 1800) {
        const cleanTarget = parseInt(targetStr.replace(/\./g, ''), 10);
        const startTime = performance.now();
        
        function formatBR(num) {
            return num.toLocaleString('pt-BR');
        }
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(cleanTarget * eased);
            
            element.textContent = formatBR(current);
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = formatBR(cleanTarget);
            }
        }
        
        requestAnimationFrame(update);
    }

    // Trigger counters
    const scoreEl = document.getElementById('score-value');
    const aumEl = document.getElementById('aum-value');
    
    if (scoreEl) {
        setTimeout(() => animateCounter(scoreEl, 842, 1500), 600);
    }
    
    if (aumEl) {
        setTimeout(() => animateFormattedCounter(aumEl, '2.847.320', 2000), 800);
    }

// ═══════════════════════════════════════════════════════════
    // NAVIGATION — Page Switching
    // ═══════════════════════════════════════════════════════════
    function checkAdminLink() {
        const assessmentLink = document.querySelector('.nav-link[data-page="admin-assessment"]');
        const dashboardLink = document.querySelector('.nav-link[data-page="admin-dashboard"]');
        const isAdminEmail = currentUser?.email === 'aficconsultoria@gmail.com';
        const isAdmin = window.isUserAdmin || isAdminEmail;
        
        if (assessmentLink) {
            assessmentLink.style.display = isAdmin ? '' : 'none';
        }
        if (dashboardLink) {
            dashboardLink.style.display = isAdmin ? '' : 'none';
        }
    }
    
    function setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const pages = document.querySelectorAll('.page-content');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                const page = link.getAttribute('data-page');
                switchPage(page);
            });
        });
    }
    
    // Setup navigation
    setupNavigation();

    // ─── PERIOD BUTTONS (AUM Chart) ───
    const periodBtns = document.querySelectorAll('.period-btn');
    
    periodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            periodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const bars = document.querySelectorAll('#aum-chart .chart-bar');
            bars.forEach((bar) => {
                const randomHeight = 30 + Math.random() * 60;
                bar.style.height = `${randomHeight}%`;
            });
        });
    });

    // ─── NOTIFICATION BUTTON ───
    const notifBtn = document.getElementById('notification-btn');
    if (notifBtn) {
        notifBtn.addEventListener('click', () => {
            const dot = notifBtn.querySelector('.notification-dot');
            if (dot) {
                dot.style.display = dot.style.display === 'none' ? 'block' : 'none';
            }
        });
    }

    // ─── CHART BAR TOOLTIPS ───
    const chartBarGroups = document.querySelectorAll('#aum-chart .chart-bar-group');
    const monthValues = {
        'Mai': '2.210.400', 'Jun': '2.318.200', 'Jul': '2.290.100',
        'Ago': '2.425.800', 'Set': '2.398.500', 'Out': '2.502.300',
        'Nov': '2.478.000', 'Dez': '2.612.700', 'Jan': '2.580.400',
        'Fev': '2.689.100', 'Mar': '2.762.800', 'Abr': '2.847.320'
    };

    chartBarGroups.forEach(group => {
        const month = group.getAttribute('data-month');
        const bar = group.querySelector('.chart-bar');
        
        group.addEventListener('mouseenter', () => {
            if (bar && monthValues[month]) {
                bar.setAttribute('title', `R$ ${monthValues[month]},00`);
            }
        });
    });

    // ─── PREMIUM CTA ───
    const upgradeBtn = document.getElementById('upgrade-btn');
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => {
            // Un-highlight nav items
            navLinks.forEach(l => l.classList.remove('active'));
            const accountLink = document.getElementById('nav-account');
            if (accountLink) accountLink.classList.add('active');
            
            // Navigate to plans page
            switchPage('plans');
        });
    }

    // ─── INTERSECTION OBSERVER FOR SCROLL ANIMATIONS ───
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const pulseItems = document.querySelectorAll('.pulse-item');
    pulseItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(10px)';
        item.style.transition = `all 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.08}s`;
        observer.observe(item);
    });

    const historyRows = document.querySelectorAll('.history-table tbody tr');
    historyRows.forEach((row, index) => {
        row.style.opacity = '0';
        row.style.transform = 'translateY(8px)';
        row.style.transition = `all 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${0.4 + index * 0.06}s`;
        observer.observe(row);
    });


    // ═══════════════════════════════════════════════════════════
    // COMPOUND INTEREST CALCULATOR
    // ═══════════════════════════════════════════════════════════

    function parseBRNumber(str) {
        if (typeof str === 'number') return str;
        return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
    }

    function formatBR(num) {
        return Math.round(num).toLocaleString('pt-BR');
    }

    function calculateCompound() {
        const initialEl = document.getElementById('input-initial');
        const monthlyEl = document.getElementById('input-monthly');
        const yearsEl = document.getElementById('input-years');
        const rateEl = document.getElementById('input-rate');

        if (!initialEl || !monthlyEl || !yearsEl || !rateEl) return;

        const P = parseBRNumber(initialEl.value);
        const M = parseBRNumber(monthlyEl.value);
        const years = parseInt(yearsEl.value, 10) || 10;
        const annualRate = parseFloat(rateEl.value) || 12;
        const monthlyRate = annualRate / 100 / 12;
        const totalMonths = years * 12;

        const yearData = [];
        let currentBalance = P;
        let crossoverYear = null;
        let crossoverMonth = null;

        for (let year = 1; year <= years; year++) {
            const monthsThisYear = 12;
            for (let m = 0; m < monthsThisYear; m++) {
                const interestEarnedThisMonth = currentBalance * monthlyRate;
                
                // Bola de neve (Ignition Rule): The moment passive interest > active contribution
                if (!crossoverYear && M > 0 && interestEarnedThisMonth >= M) {
                    crossoverYear = year;
                    crossoverMonth = m + 1;
                }

                currentBalance = currentBalance + interestEarnedThisMonth + M;
            }
            const totalInvested = P + M * 12 * year;
            const totalInterest = currentBalance - totalInvested;

            yearData.push({
                year,
                invested: totalInvested,
                interest: Math.max(0, totalInterest),
                balance: currentBalance
            });
        }

        const finalData = yearData[yearData.length - 1];

        // Update result blocks
        const valInvested = document.getElementById('val-invested');
        const valInterest = document.getElementById('val-interest');
        const valCrossover = document.getElementById('val-crossover-text');
        const valCrossoverSub = document.getElementById('val-crossover-sub');

        if (valInvested) valInvested.textContent = formatBR(finalData.invested);
        if (valInterest) valInterest.textContent = formatBR(finalData.interest);

        if (valCrossover) {
            if (M === 0) {
                valCrossover.textContent = "Renda Passiva Ativa";
                valCrossoverSub.textContent = "Sem novos aportes, seu patrimônio cresce sozinho.";
                valCrossover.style.color = 'var(--gold-rich)';
            } else if (crossoverYear !== null) {
                valCrossover.textContent = `No Ano ${crossoverYear}`;
                valCrossoverSub.textContent = `No mês ${crossoverMonth}, o juro mensal supera R$ ${formatBR(M)}`;
                valCrossover.style.color = '#388e3c'; // Green
            } else {
                valCrossover.textContent = "Aumente o Aporte";
                valCrossoverSub.textContent = "Nesta métrica, levará mais do que " + years + " anos para estourar o efeito bola de neve.";
                valCrossover.style.color = '#ff4d4f'; // Red warning
            }
        }

        // Build projection chart
        buildProjectionChart(yearData);

        // Build breakdown table
        buildBreakdownTable(yearData);
    }

    function buildProjectionChart(yearData) {
        const chartContainer = document.getElementById('projection-chart');
        const axisContainer = document.getElementById('projection-axis');
        if (!chartContainer || !axisContainer) return;

        chartContainer.innerHTML = '';
        axisContainer.innerHTML = '';

        const maxBalance = Math.max(...yearData.map(d => d.balance));
        const chartHeight = chartContainer.clientHeight || 260;

        yearData.forEach((data, index) => {
            const group = document.createElement('div');
            group.className = 'proj-bar-group';

            const stack = document.createElement('div');
            stack.className = 'proj-bar-stack';

            const totalPx = (data.balance / maxBalance) * (chartHeight - 10);
            const interestPx = (data.interest / data.balance) * totalPx;
            const principalPx = totalPx - interestPx;

            const interestBar = document.createElement('div');
            interestBar.className = 'proj-bar-interest';
            interestBar.style.height = '0px';
            interestBar.title = `Juros: R$ ${formatBR(data.interest)}`;

            const principalBar = document.createElement('div');
            principalBar.className = 'proj-bar-principal';
            principalBar.style.height = '0px';
            principalBar.title = `Investido: R$ ${formatBR(data.invested)}`;

            stack.appendChild(interestBar);
            stack.appendChild(principalBar);
            group.appendChild(stack);
            chartContainer.appendChild(group);

            // Animate bars in with stagger
            setTimeout(() => {
                interestBar.style.height = `${Math.max(interestPx, 0)}px`;
                principalBar.style.height = `${Math.max(principalPx, 2)}px`;
            }, 100 + index * 60);

            // Year label
            const label = document.createElement('div');
            label.className = 'proj-year-label';
            label.textContent = `Ano ${data.year}`;
            axisContainer.appendChild(label);
        });
    }

    function buildBreakdownTable(yearData) {
        const tbody = document.getElementById('breakdown-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        yearData.forEach((data, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${data.year}º</td>
                <td>R$ ${formatBR(data.invested)}</td>
                <td class="interest-cell">R$ ${formatBR(data.interest)}</td>
                <td>R$ ${formatBR(data.balance)}</td>
            `;
            
            // Stagger animation
            row.style.opacity = '0';
            row.style.transform = 'translateY(8px)';
            row.style.transition = `all 0.3s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.04}s`;
            
            tbody.appendChild(row);

            // Trigger animation
            setTimeout(() => {
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, 50);
        });
    }

    // Calculate button
    const btnCalc = document.getElementById('btn-calculate');
    if (btnCalc) {
        btnCalc.addEventListener('click', () => {
            btnCalc.style.transform = 'scale(0.97)';
            setTimeout(() => {
                btnCalc.style.transform = 'scale(1)';
            }, 150);
            calculateCompound();
        });
    }

    // Auto-format currency inputs
    const currencyInputs = document.querySelectorAll('#input-initial, #input-monthly');
    currencyInputs.forEach(input => {
        input.addEventListener('blur', function() {
            const val = parseBRNumber(this.value);
            if (!isNaN(val) && val > 0) {
                this.value = formatBR(val);
            }
        });
    });

    // ═══════════════════════════════════════════════════════════
    // TOOLS SUB-NAVIGATION
    // ═══════════════════════════════════════════════════════════
    const toolTabs = document.querySelectorAll('.tool-tab');
    const toolViews = document.querySelectorAll('.tool-view');

    toolTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            toolTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const targetTool = tab.getAttribute('data-tool');
            toolViews.forEach(v => v.classList.add('tool-hidden'));
            
            const viewTarget = document.getElementById(`tool-${targetTool}`);
            if (viewTarget) {
                viewTarget.classList.remove('tool-hidden');
            }
        });
    });

    // ═══════════════════════════════════════════════════════════
    // CREDIT CARD DATA (Supabase Sync)
    // ═══════════════════════════════════════════════════════════
    let ccData = [];

    async function saveCCData(desc, totalVal, installments, startMonthStr) {
        if (!currentUser) return;
        const { error } = await supabase.from('credit_cards').insert([{
            user_id: currentUser.id,
            description: desc,
            total_val: totalVal,
            installments: installments,
            start_month_str: startMonthStr
        }]);
        if (error) console.error("Error saving CC:", error);
        await reloadCCData();
    }

    async function reloadCCData() {
        if (!currentUser) return;
        const { data, error } = await supabase.from('credit_cards').select('*');
        if (!error && data) {
            ccData = data.map(row => ({
                db_id: row.id,
                desc: row.description,
                totalVal: parseFloat(row.total_val),
                installments: row.installments,
                startMonthStr: row.start_month_str
            }));
            if (typeof renderCCManager === 'function') renderCCManager();
            if (typeof renderBudgetManager === 'function') renderBudgetManager();
        }
    }

    async function deleteCCData(dbId) {
        const { error } = await supabase.from('credit_cards').delete().eq('id', dbId);
        if (!error) await reloadCCData();
    }

    // ═══════════════════════════════════════════════════════════
    // BUDGET TRACKER DYNAMIC (Supabase Sync)
    // ═══════════════════════════════════════════════════
    let budgetData = {};
    let currentBudgetMonth = new Date(); // Date object
    // Configurações personalizadas do orçamento (padrão 50/30/20)
    let budgetFixedLimit = 50;
    let budgetVarLimit = 30;
    let budgetSaveLimit = 20;

    function getMonthKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    function formatMonthDisplay(date) {
        const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    async function loadBudgetSettings() {
        if (!currentUser) return;
        const { data, error } = await supabase.from('budget_settings').select('*').eq('user_id', currentUser.id).limit(1);
        if (!error && data && data.length > 0) {
            budgetFixedLimit = data[0].fixed_limit_pct || 50;
            budgetVarLimit = data[0].var_limit_pct || 30;
            budgetSaveLimit = data[0].save_limit_pct || 20;
            
            // Atualizar campos no formulário
            document.getElementById('budget-fixed-pct').value = budgetFixedLimit;
            document.getElementById('budget-var-pct').value = budgetVarLimit;
            document.getElementById('budget-save-pct').value = budgetSaveLimit;
            updateBudgetTotalPct();
        }
    }

    function updateBudgetTotalPct() {
        const fixedPct = parseInt(document.getElementById('budget-fixed-pct')?.value || 0);
        const varPct = parseInt(document.getElementById('budget-var-pct')?.value || 0);
        const savePct = parseInt(document.getElementById('budget-save-pct')?.value || 0);
        const total = fixedPct + varPct + savePct;
        const totalEl = document.getElementById('budget-total-pct');
        const msgEl = document.getElementById('budget-total-msg');
        if (totalEl) totalEl.textContent = total;
        if (msgEl) {
            if (total === 100) {
                msgEl.textContent = '✓ Configuração válida';
                msgEl.style.color = 'var(--gold-rich)';
            } else {
                msgEl.textContent = '⚠ Total deve ser 100%';
                msgEl.style.color = '#ff4d4f';
            }
        }
    }

    async function saveBudgetDataTx(monthKey, desc, value, type, method) {
        if (!currentUser) {
            alert("É necessário fazer login para salvar!");
            return;
        }
        console.log("Saving budget tx:", { monthKey, desc, value, type, method, userId: currentUser.id });
        const { error } = await supabase.from('budget_transactions').insert([{
            user_id: currentUser.id,
            month_key: monthKey,
            description: desc,
            value: value,
            type: type,
            method: method
        }]);
        if (error) {
            console.error("Error saving TX:", error);
            alert("Erro ao salvar: " + error.message);
        }
        await reloadBudgetData();
    }

    async function reloadBudgetData() {
        if (!currentUser) return;
        console.log("Loading budget data for user:", currentUser.id);
        const { data, error } = await supabase.from('budget_transactions').select('*').eq('user_id', currentUser.id);
        if (!error && data) {
            console.log("Budget data loaded:", data.length, "transactions");
            budgetData = {};
            data.forEach(row => {
                if (!budgetData[row.month_key]) budgetData[row.month_key] = [];
                budgetData[row.month_key].push({
                    db_id: row.id,
                    desc: row.description,
                    value: parseFloat(row.value),
                    type: row.type,
                    method: row.method
                });
            });
            if (typeof renderBudgetManager === 'function') renderBudgetManager();
        }
    }

    async function deleteBudgetDataTx(dbId) {
        const { error } = await supabase.from('budget_transactions').delete().eq('id', dbId).eq('user_id', currentUser.id);
        if (!error) await reloadBudgetData();
    }

    // Global Load Function
    async function loadSupabaseData() {
        await reloadCCData();
        await reloadBudgetData();
        await loadBudgetSettings();
        await loadUserProfile();
        await loadCommunityThreads();
        initializeRealtime();
        
        // Update all header user info elements after loading data
        updateAllHeaderUserInfo();
    }
    
function updateAllHeaderUserInfo() {
        const profileLabels = { conservador: '🛡️ Conservador', equilibrado: '⚖️ Equilibrado', arrojado: '🚀 Arrojado' };
        
        document.querySelectorAll('.header-user-name').forEach(el => {
            if (el && currentUserProfile?.nickname) el.textContent = currentUserProfile.nickname;
        });
        document.querySelectorAll('.header-user-initials').forEach(el => {
            if (el && currentUserProfile?.nickname) el.textContent = currentUserProfile.nickname.substring(0, 2).toUpperCase();
        });
        document.querySelectorAll('.header-user-profile').forEach(el => {
            if (el && currentUserProfile?.profile_type) el.textContent = profileLabels[currentUserProfile.profile_type] || 'Perfil';
        });
        
        console.log('Setting up header click handlers, elements found:', document.querySelectorAll('.header-user-info').length);
        
        setTimeout(() => {
            document.querySelectorAll('.header-user-info').forEach(el => {
                el.style.cursor = 'pointer';
                el.onclick = function() {
                    console.log('Clicked going to account');
                    switchPage('account');
                };
            });
        }, 100);
    }
    
    function initializeRealtime() {
        if (window.communitySubscribed) return;
        
        console.log("Initializing AFIC Realtime Channels...");
        
        supabase
            .channel('public:community_topics')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'community_topics' 
            }, (payload) => {
                console.log("New topic detected via Realtime:", payload.new.title);
                loadCommunityThreads();
            })
            .subscribe((status) => {
                console.log("Realtime status:", status);
                if (status === 'SUBSCRIPTION_ERROR') {
                    console.error("Realtime failed. Ensure Replication is enabled in Supabase.");
                }
            });

        supabase
            .channel('public:community_comments')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_comments' }, (payload) => {
                const activeTopicId = document.getElementById('detail-topic-title').getAttribute('data-id');
                if (activeTopicId === payload.new.topic_id) {
                    loadComments(activeTopicId);
                }
            })
            .subscribe();

        supabase
            .channel('public:community_likes')
            .on('postgres_changes', { event: 'ALL', schema: 'public', table: 'community_likes' }, (payload) => {
                const activeTopicId = document.getElementById('detail-topic-title').getAttribute('data-id');
                if (activeTopicId === (payload.new?.topic_id || payload.old?.topic_id)) {
                    loadLikes(activeTopicId);
                }
            })
            .subscribe();
            
        window.communitySubscribed = true;
    }

    function renderBudgetManager() {
        const monthKey = getMonthKey(currentBudgetMonth);
        const txListEl = document.getElementById('tx-list');
        const displayEl = document.getElementById('current-month-display');
        
        if(!displayEl || !txListEl) return;
        displayEl.textContent = formatMonthDisplay(currentBudgetMonth);

        const txs = budgetData[monthKey] || [];
        
        let totalIncome = 0;
        let totalFixed = 0;
        let totalVar = 0;

        txListEl.innerHTML = '';

        if(txs.length === 0) {
            txListEl.innerHTML = '<li style="padding: 16px; color: var(--text-muted); text-align: center; font-size: 13px;">Nenhum lançamento neste mês.</li>';
        }

        txs.forEach((tx, idx) => {
            if(tx.type === 'income') totalIncome += tx.value;
            if(tx.type === 'fixed') totalFixed += tx.value;
            if(tx.type === 'variable') totalVar += tx.value;

            let typeLabel = "Receita";
            if(tx.type === 'fixed') typeLabel = "Fixo";
            if(tx.type === 'variable') typeLabel = "Variável";

            let methodLabel = "";
            if (tx.method === 'pix') methodLabel = " • PIX";
            if (tx.method === 'debit') methodLabel = " • Débito";
            if (tx.method === 'credit') methodLabel = " • Crédito";
            if (tx.method === 'boleto') methodLabel = " • Boleto";

            const li = document.createElement('li');
            li.className = `tx-item ${tx.type}`;
            li.innerHTML = `
                <div class="tx-info">
                    <span class="tx-desc">${tx.desc}</span>
                    <span class="tx-type-label">${typeLabel}${methodLabel}</span>
                </div>
                <div class="tx-right">
                    <span class="tx-val">${tx.type === 'income' ? '+' : '-'} R$ ${formatBR(tx.value)}</span>
                    <button class="btn-delete" data-idx="${tx.db_id}">×</button>
                </div>
            `;
            txListEl.appendChild(li);
        });

        // INJECT ACTIVE CREDIT CARD INSTALLMENTS INTO BUDGET
        if (typeof getCCMetricsForMonth === 'function') {
            const ccMetrics = getCCMetricsForMonth(currentBudgetMonth);
            ccMetrics.activeInstallments.forEach(inst => {
                totalVar += inst.instValue; // They act as variable debt
                
                const li = document.createElement('li');
                li.className = `tx-item variable`;
                li.style.borderLeftColor = '#d32f2f'; // Give it a red tint to distinguish
                li.innerHTML = `
                    <div class="tx-info">
                        <span class="tx-desc">Fatura Cartão: ${inst.desc}</span>
                        <span class="tx-type-label">Cartão de Crédito (${inst.instNumber}/${inst.totalIns})</span>
                    </div>
                    <div class="tx-right">
                        <span class="tx-val">- R$ ${formatBR(inst.instValue)}</span>
                        <button class="btn-delete" disabled style="opacity:0.2" title="Gerenciado na aba Cartões">×</button>
                    </div>
                `;
                txListEl.appendChild(li);
            });
        }

        // Add Delete Listeners
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const dbId = btn.getAttribute('data-idx');
                if (dbId && !btn.hasAttribute('disabled')) {
                    await deleteBudgetDataTx(dbId);
                }
            });
        });

        // Analytics
        const totalExp = totalFixed + totalVar;
        const netValue = totalIncome - totalExp;
        
        let savPct = 0;
        let fixPct = 0;
        let varPct = 0;

        if (totalIncome > 0) {
            savPct = Math.round((netValue / totalIncome) * 100);
            fixPct = Math.round((totalFixed / totalIncome) * 100);
            varPct = Math.round((totalVar / totalIncome) * 100);
        }

        const netValEl = document.getElementById('budget-net-val');
        const netPctEl = document.getElementById('budget-net-pct');
        const pctFixedEl = document.getElementById('pct-fixed-actual');
        const barFixedEl = document.getElementById('bar-fixed-actual');
        const pctVarEl = document.getElementById('pct-var-actual');
        const barVarEl = document.getElementById('bar-var-actual');

        if (netValEl) netValEl.textContent = formatBR(netValue);
        if (netPctEl) netPctEl.textContent = `${savPct > 0 ? savPct : 0}% da Renda Poupada`;
        
        if (pctFixedEl) pctFixedEl.textContent = `${fixPct}%`;
        if (barFixedEl) barFixedEl.style.width = `${fixPct > 100 ? 100 : fixPct}%`;
        
        if (pctVarEl) pctVarEl.textContent = `${varPct}%`;
        if (barVarEl) barVarEl.style.width = `${varPct > 100 ? 100 : varPct}%`;

        // Warning Colors - usando config personalizados
        if (barFixedEl) barFixedEl.style.backgroundColor = fixPct > budgetFixedLimit ? '#ff4d4f' : 'var(--navy-deep)';
        if (barVarEl) barVarEl.style.backgroundColor = varPct > budgetVarLimit ? '#ff4d4f' : 'var(--navy-medium)';

        const insightEl = document.getElementById('budget-tracker-insight');
        if (insightEl) {
            if (totalIncome === 0) {
                insightEl.innerHTML = "Adicione sua renda e despesas para iniciar a análise institucional.";
                insightEl.style.borderLeftColor = "var(--gold-dry)";
            } else if (fixPct > budgetFixedLimit || varPct > budgetVarLimit) {
                insightEl.innerHTML = `<b>Alerta:</b> Você estourou os limites do ${budgetFixedLimit}/${budgetVarLimit}/${budgetSaveLimit}. Reveja suas despesas marcadas em vermelho para proteger sua capacidade de aporte.`;
                insightEl.style.borderLeftColor = "#ff4d4f";
            } else {
                insightEl.innerHTML = "<b>Excelente!</b> Custos sob controle. Você preservou uma alta capacidade poupança mensal. Direcione este lucro para seus investimentos institucionais.";
                insightEl.style.borderLeftColor = "var(--gold-rich)";
            }
        }
    }

    const txForm = document.getElementById('transaction-form');
    if (txForm) {
        txForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const desc = document.getElementById('tx-desc').value.trim();
            const valStr = document.getElementById('tx-val').value;
            const type = document.getElementById('tx-type').value;
            const methodEl = document.getElementById('tx-method');
            const method = methodEl ? methodEl.value : 'pix';
            
            const value = parseBRNumber(valStr);
            if (!desc || value <= 0) return;

            const monthKey = getMonthKey(currentBudgetMonth);
            await saveBudgetDataTx(monthKey, desc, value, type, method);
            
            txForm.reset();
        });

        const prevBtn = document.getElementById('prev-month');
        const nextBtn = document.getElementById('next-month');
        
        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => {
                currentBudgetMonth.setMonth(currentBudgetMonth.getMonth() - 1);
                renderBudgetManager();
            });
            nextBtn.addEventListener('click', () => {
                currentBudgetMonth.setMonth(currentBudgetMonth.getMonth() + 1);
                renderBudgetManager();
            });
        }

        renderBudgetManager();
    }

    // ═══════════════════════════════════════════════════════════
    // CREDIT CARDS TRACKER (ccData + saveCCData declared above)
    // ═══════════════════════════════════════════════════════════

    function getCCMetricsForMonth(monthDate) {
        let currentBillTotal = 0;
        let futureDebtTotal = 0;
        const activeInstallments = [];

        const refYear = monthDate.getFullYear();
        const refM  = monthDate.getMonth();
        const refAbs = refYear * 12 + refM;

        ccData.forEach(cc => {
            const [yStr, mStr] = cc.startMonthStr.split('-');
            const startYear = parseInt(yStr);
            const startM = parseInt(mStr) - 1;
            const startAbs = startYear * 12 + startM;

            const instValue = cc.totalVal / cc.installments;
            const instNumber = (refAbs - startAbs) + 1;

            if (instNumber > 0 && instNumber <= cc.installments) {
                currentBillTotal += instValue;
                activeInstallments.push({ desc: cc.desc, instValue, instNumber, totalIns: cc.installments });
            }

            if (instNumber <= cc.installments) {
                let remainingInst = cc.installments - (instNumber > 0 ? instNumber : 0);
                if(instNumber <= 0) remainingInst = cc.installments;
                futureDebtTotal += (remainingInst * instValue);
            }
        });

        return { currentBillTotal, futureDebtTotal, activeInstallments };
    }

    function renderCCManager() {
        const metrics = getCCMetricsForMonth(currentBudgetMonth);
        const displayEl = document.getElementById('cc-current-month-display');
        const listEl = document.getElementById('cc-list');

        if(displayEl) displayEl.textContent = formatMonthDisplay(currentBudgetMonth);

        if(listEl) {
            listEl.innerHTML = '';
            if (ccData.length === 0) {
                listEl.innerHTML = '<li style="padding: 16px; color: var(--text-muted); text-align: center; font-size: 13px;">Nenhum cartão cadastrado.</li>';
            }

            ccData.forEach((cc, idx) => {
                const [yStr, mStr] = cc.startMonthStr.split('-');
                const startAbs = parseInt(yStr) * 12 + (parseInt(mStr) - 1);
                const refAbs = currentBudgetMonth.getFullYear() * 12 + currentBudgetMonth.getMonth();
                const instNumber = (refAbs - startAbs) + 1;
                
                let statusBadge = '';
                if (instNumber > cc.installments) {
                    statusBadge = '<span style="color: #388e3c; font-weight:700;">Quitado</span>';
                } else if (instNumber <= 0) {
                    statusBadge = '<span style="color: var(--gold-rich);">Futuro</span>';
                } else {
                    statusBadge = `<span style="color: #d32f2f;">${instNumber} / ${cc.installments} Pagas</span>`;
                }

                const instValue = cc.totalVal / cc.installments;

                const li = document.createElement('li');
                li.className = 'tx-item';
                li.style.borderLeftColor = instNumber > cc.installments ? '#388e3c' : '#d32f2f';
                li.innerHTML = `
                    <div class="tx-info">
                        <span class="tx-desc">${cc.desc}</span>
                        <span class="tx-type-label">Início: ${mStr}/${yStr} • ${statusBadge}</span>
                    </div>
                    <div class="tx-right">
                        <span class="tx-val" style="color: var(--text-primary);">- R$ ${formatBR(instValue)}/mês</span>
                        <button class="btn-delete" data-cc-idx="${cc.db_id}">×</button>
                    </div>
                `;
                listEl.appendChild(li);
            });

            document.querySelectorAll('button[data-cc-idx]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const dbId = btn.getAttribute('data-cc-idx');
                    if (dbId) {
                        await deleteCCData(dbId);
                    }
                });
            });
        }

        const billEl = document.getElementById('cc-current-bill-val');
        if(billEl) billEl.textContent = formatBR(metrics.currentBillTotal);
        
        const debtEl = document.getElementById('cc-future-debt');
        if(debtEl) debtEl.textContent = formatBR(metrics.futureDebtTotal);
    }

    const ccForm = document.getElementById('cc-form');
    if (ccForm) {
        ccForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const desc = document.getElementById('cc-desc').value.trim();
            const valStr = document.getElementById('cc-val').value;
            const installments = parseInt(document.getElementById('cc-installments').value);
            const startMonthStr = document.getElementById('cc-start-month').value;
            
            const totalVal = parseBRNumber(valStr);
            if (!desc || totalVal <= 0 || !installments || !startMonthStr) return;

            await saveCCData(desc, totalVal, installments, startMonthStr);
            ccForm.reset();
        });

        const ccPrevBtn = document.getElementById('cc-prev-month');
        const ccNextBtn = document.getElementById('cc-next-month');
        
        if (ccPrevBtn && ccNextBtn) {
            ccPrevBtn.addEventListener('click', () => {
                currentBudgetMonth.setMonth(currentBudgetMonth.getMonth() - 1);
                renderCCManager();
                renderBudgetManager();
            });
            ccNextBtn.addEventListener('click', () => {
                currentBudgetMonth.setMonth(currentBudgetMonth.getMonth() + 1);
                renderCCManager();
                renderBudgetManager();
            });
        }
        
        // Initial render
        renderCCManager();
    }

    // ═══════════════════════════════════════════════════════════
    // EMERGENCY FUND CALCULATOR
    // ═══════════════════════════════════════════════════════════
    function calculateEmergency() {
        const costInput = document.getElementById('em-cost');
        const monthsInput = document.getElementById('em-months');
        const currentInput = document.getElementById('em-current');
        const applyInput = document.getElementById('em-apply');

        if (!costInput || !monthsInput || !currentInput || !applyInput) return;

        const cost = parseBRNumber(costInput.value);
        const months = parseInt(monthsInput.value) || 6;
        const current = parseBRNumber(currentInput.value);
        const apply = parseBRNumber(applyInput.value) || 1; // avoid / 0

        const target = cost * months;
        let p = (current / target) * 100;
        if (p > 100) p = 100;
        if (p < 0) p = 0;

        const remaining = target - current;
        let timeMonths = 0;
        
        if (remaining > 0) {
            timeMonths = Math.ceil(remaining / apply);
        }

        // Update visuals
        document.getElementById('em-target-val').textContent = formatBR(target);
        document.getElementById('em-pct').textContent = `${Math.round(p)}%`;
        document.getElementById('em-fill').style.width = `${Math.round(p)}%`;

        const insightEl = document.getElementById('em-insight');
        if (remaining <= 0) {
            insightEl.innerHTML = "Parabéns. Seu escudo financeiro está 100% blindado para o alvo de <strong>" + months + " meses</strong>. O capital adicional deve ir integralmente para investimentos.";
            insightEl.style.borderLeftColor = "var(--gold-rich)";
        } else {
            insightEl.innerHTML = `Faltam R$ ${formatBR(remaining)}. Mantendo aportes de R$ ${formatBR(apply)}, sua reserva blindada estará pronta em <strong>${timeMonths} meses</strong>.`;
            insightEl.style.borderLeftColor = "var(--navy-medium)";
        }
    }

    const btnEmergency = document.getElementById('btn-calc-emergency');
    if (btnEmergency) {
        btnEmergency.addEventListener('click', calculateEmergency);
        // Default init
        setTimeout(calculateEmergency, 500);
    }

    // ═══════════════════════════════════════════════════════════
    // GLOBAL INTERACTIVITY — ALL REMAINING BUTTONS & LINKS
    // ═══════════════════════════════════════════════════════════

    // ─── Reusable Toast Notification ───
    function showToast(message, duration = 3000) {
        let container = document.getElementById('afic-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'afic-toast-container';
            container.style.cssText = 'position:fixed;top:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:12px;pointer-events:none;';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.style.cssText = `
            background: var(--navy-deep, #051845); color: #fff; padding: 16px 24px;
            font-family: Inter, sans-serif; font-size: 14px; font-weight: 500;
            box-shadow: 0 8px 32px rgba(0,0,0,0.25); pointer-events: auto;
            transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.22,1,0.36,1);
            border-left: 3px solid var(--gold-rich, #D4AF37); max-width: 380px;
        `;
        toast.textContent = message;
        container.appendChild(toast);
        requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    

    // ─── 2. USER PROFILE CLICK → Account Page ───
    const userProfile = document.getElementById('user-profile');
    if (userProfile) {
        userProfile.style.cursor = 'pointer';
        userProfile.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            document.getElementById('nav-account')?.classList.add('active');
            switchPage('plans');
        });
    }

    // ─── 3. QUICK ACTIONS (Dashboard) ───
    const btnSchedule = document.getElementById('btn-schedule');
    if (btnSchedule) {
        btnSchedule.addEventListener('click', () => {
            showToast('📅 Funcionalidade de Agendamento será ativada com a integração do Calendly. Em breve!');
        });
    }

    const btnSimulate = document.getElementById('btn-simulate');
    if (btnSimulate) {
        btnSimulate.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            document.getElementById('nav-tools')?.classList.add('active');
            switchPage('tools');
            // Auto-activate Bola de Neve (compound) tab
            toolTabs.forEach(t => t.classList.remove('active'));
            toolViews.forEach(v => v.classList.add('tool-hidden'));
            const tab = document.querySelector('.tool-tab[data-tool="compound"]');
            const view = document.getElementById('tool-compound');
            if (tab) tab.classList.add('active');
            if (view) view.classList.remove('tool-hidden');
            setTimeout(() => calculateCompound(), 150);
        });
    }

    // ─── 4. EDUCATION PAGE ───
    // "Continuar Módulo" button
    const btnContinue = document.querySelector('.btn-continue');
    if (btnContinue) {
        btnContinue.addEventListener('click', () => {
            showToast('🎓 Módulo 4: Alocação Tática de Ativos será liberado com a integração de vídeo. Em breve!');
        });
    }

    // "Ver Acervo Completo" link
    const viewAllLink = document.querySelector('.view-all');
    if (viewAllLink) {
        viewAllLink.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('📚 O acervo completo estará disponível na versão final da Academia AFIC.');
        });
    }

    // Education Course Cards — clickable
    document.querySelectorAll('.edu-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            const title = card.querySelector('.edu-card-title')?.textContent || 'Módulo';
            if (card.classList.contains('locked')) {
                showToast('🔒 "' + title + '" requer Nível Elite. Eleve seu acesso na aba Minha Conta.');
            } else {
                showToast('▶ Abrindo: "' + title + '". O player de conteúdo será integrado em breve.');
            }
        });
    });

    // Masterclass "Assistir" buttons
    document.querySelectorAll('.mc-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const title = btn.closest('.mc-item')?.querySelector('.mc-title')?.textContent || 'Masterclass';
            showToast('▶ Reproduzindo: "' + title + '". Player de vídeo em breve.');
        });
    });

    // Masterclass play icons
    document.querySelectorAll('.mc-play-btn').forEach(btn => {
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', () => {
            const title = btn.closest('.mc-item')?.querySelector('.mc-title')?.textContent || 'Masterclass';
            showToast('▶ Reproduzindo: "' + title + '".');
        });
    });

    // ─── 5. COMMUNITY PAGE ───
    const modalNewTopic = document.getElementById('modal-new-topic');
    const btnOpenNewTopic = document.getElementById('btn-open-new-topic');
    const btnCloseNewTopic = document.getElementById('btn-close-topic');
    const formNewTopic = document.getElementById('form-new-topic');

    // Profile Management
    async function loadUserProfile() {
        if (!currentUser) return;
        let { data, error } = await supabase
            .from('profiles')
            .select('nickname, profile_type')
            .eq('id', currentUser.id)
            .maybeSingle();
        
        if (!data && !error) {
            await supabase.from('profiles').insert({ id: currentUser.id });
            ({ data } = await supabase
                .from('profiles')
                .select('nickname, profile_type')
                .eq('id', currentUser.id)
                .maybeSingle());
        }
        
        if (!error && data) {
            currentUserProfile = data;
            const nicknameInput = document.getElementById('user-nickname');
            if (nicknameInput) nicknameInput.value = data.nickname || '';
            
            // Update avatar initials with first 2 letters of nickname
            const initialsEl = document.getElementById('avatar-initials');
            if (initialsEl && data.nickname) {
                const initials = data.nickname.substring(0, 2).toUpperCase();
                initialsEl.textContent = initials;
            }
            
            // Preencher todos os campos do perfil
            if (document.getElementById('user-email')) document.getElementById('user-email').value = data.email_public || '';
            if (document.getElementById('user-about')) document.getElementById('user-about').value = data.about || '';
            if (document.getElementById('user-linkedin')) document.getElementById('user-linkedin').value = data.linkedin || '';
            if (document.getElementById('user-instagram')) document.getElementById('user-instagram').value = data.instagram || '';
            
            // Atualizar preview
            updateProfilePreview(data);
            
            // Atualizar foto de perfil se existir
            if (data.avatar_url) {
                const img = document.getElementById('avatar-img');
                const preview = document.getElementById('avatar-preview');
                const initials = document.getElementById('avatar-initials');
                if (img && preview && initials) {
                    img.src = data.avatar_url;
                    img.style.display = 'block';
                    initials.style.display = 'none';
                }
            }
            
            // Update UI with nickname if needed
            const userDisplay = document.querySelector('.user-name');
            if (userDisplay && data.nickname) userDisplay.textContent = data.nickname;
            
            // Update header user info in ALL pages
            const profileLabels = { conservador: '🛡️ Conservador', equilibrado: '⚖️ Equilibrado', arrojado: '🚀 Arrojado' };
            
            document.querySelectorAll('.header-user-name').forEach(el => {
                if (el) el.textContent = data.nickname || 'Usuário';
            });
            document.querySelectorAll('.header-user-initials').forEach(el => {
                if (el) el.textContent = data.nickname ? data.nickname.substring(0, 2).toUpperCase() : 'CA';
            });
document.querySelectorAll('.header-user-profile').forEach(el => {
if (el) el.textContent = data.profile_type ? profileLabels[data.profile_type] || 'Perfil' : 'Perfil';
            });
        }
    }
    
    function updateProfilePreview(data) {
        const previewNickname = document.getElementById('preview-nickname');
        const previewAbout = document.getElementById('preview-about');
        const previewSocial = document.getElementById('preview-social');
        const previewLinkedin = document.getElementById('preview-linkedin');
        const previewInitials = document.getElementById('preview-initials');
        
        if (previewNickname) previewNickname.textContent = data.nickname || 'Seu Nickname';
        if (previewAbout) previewAbout.textContent = data.about || 'Sua biografia aparecerá aqui...';
        
        if (previewInitials && data.nickname) {
            previewInitials.textContent = data.nickname.substring(0, 2).toUpperCase();
        }
        
        if (data.linkedin) {
            if (previewLinkedin) {
                previewLinkedin.href = data.linkedin;
                previewLinkedin.style.display = 'block';
            }
        }
    }

    const formProfile = document.getElementById('form-profile');
    if (formProfile) {
        console.log('Profile form found, adding listener...');
        formProfile.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Profile form submitted!');
            const nickname = document.getElementById('user-nickname')?.value.trim();
            const emailPublic = document.getElementById('user-email')?.value.trim() || null;
            const about = document.getElementById('user-about')?.value.trim() || null;
            const linkedin = document.getElementById('user-linkedin')?.value.trim() || null;
            const instagram = document.getElementById('user-instagram')?.value.trim() || null;
            const profileMsg = document.getElementById('profile-msg');
            
            console.log('Saving profile:', { nickname, emailPublic, about, linkedin, instagram });
            
            if (!nickname) {
                alert('Por favor, preencha o apelido!');
                return;
            }

            if (!currentUser) {
                alert('Usuário não está logado!');
                return;
            }

            const { error } = await supabase
                .from('profiles')
                .upsert({ 
                    id: currentUser.id, 
                    nickname: nickname, 
                    email_public: emailPublic,
                    about: about,
                    linkedin: linkedin,
                    instagram: instagram,
                    updated_at: new Date() 
                });

            console.log('Save result:', error);
            if (error) {
                profileMsg.textContent = "Erro ao salvar: " + error.message;
                profileMsg.style.color = "#ff4d4f";
            } else {
                profileMsg.textContent = "Perfil atualizado com sucesso!";
                profileMsg.style.color = "#388e3c";
                await loadUserProfile();
            }
            profileMsg.style.display = 'block';
            setTimeout(() => profileMsg.style.display = 'none', 3000);
        });
    }

    // Avatar upload handler
    const avatarFileInput = document.getElementById('user-avatar-file');
    if (avatarFileInput) {
        avatarFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Preview local
            const reader = new FileReader();
            reader.onload = (evt) => {
                const img = document.getElementById('avatar-img');
                const initials = document.getElementById('avatar-initials');
                if (img) {
                    img.src = evt.target.result;
                    img.style.display = 'block';
                    if (initials) initials.style.display = 'none';
                }
            };
            reader.readAsDataURL(file);
        });
    }

    // Botão remover foto
    const btnRemoveAvatar = document.getElementById('btn-remove-avatar');
    if (btnRemoveAvatar) {
        btnRemoveAvatar.addEventListener('click', async () => {
            if (!currentUser) return;
            
            if (confirm('Tem certeza que deseja remover a foto de perfil?')) {
                const { error } = await supabase
                    .from('profiles')
                    .update({ avatar_url: null })
                    .eq('id', currentUser.id);
                
                if (!error) {
                    const img = document.getElementById('avatar-img');
                    const initials = document.getElementById('avatar-initials');
                    if (img) {
                        img.src = '';
                        img.style.display = 'none';
                    }
                    if (initials) initials.style.display = 'flex';
                    showToast('Foto removida!');
                }
            }
        });
    }

    async function loadProfileType() {
        if (!currentUser) return;
        const { data } = await supabase
            .from('profiles')
            .select('profile_type')
            .eq('id', currentUser.id)
            .maybeSingle();
        
        const display = document.getElementById('current-profile-display');
        const profileLabels = {
            'conservador': '🛡️ Conservador',
            'equilibrado': '⚖️ Equilibrado',
            'arrojado': '🚀 Arrojado'
        };
        
        if (data?.profile_type && display) {
            display.textContent = 'Perfil atual: ' + (profileLabels[data.profile_type] || data.profile_type);
        } else if (display) {
            display.textContent = 'Perfil não definido';
        }
    }
    
    const btnChangeProfile = document.getElementById('btn-change-profile');
    if (btnChangeProfile) {
        loadProfileType();
        
        window.addEventListener('profile-selected', (e) => {
            const profile = e.detail.profile;
            const nickname = e.detail.nickname;
            
            // Update avatar initials
            const initialsEl = document.getElementById('avatar-initials');
            if (initialsEl && nickname) {
                initialsEl.textContent = nickname.substring(0, 2).toUpperCase();
            }
            const previewInitials = document.getElementById('preview-initials');
            if (previewInitials && nickname) {
                previewInitials.textContent = nickname.substring(0, 2).toUpperCase();
            }
            
            const profileLabels = {
                'conservador': '🛡️ Conservador',
                'equilibrado': '⚖️ Equilibrado',
                'arrojado': '🚀 Arrojado'
            };
            const display = document.getElementById('current-profile-display');
            if (display) {
                display.textContent = 'Perfil atual: ' + (profileLabels[profile] || profile);
            }
            if (profileTypeMsg) {
                profileTypeMsg.textContent = 'Perfil atualizado!';
                profileTypeMsg.style.display = 'block';
                profileTypeMsg.style.color = 'green';
                setTimeout(() => { profileTypeMsg.style.display = 'none'; }, 3000);
            }
        });
        
        btnChangeProfile.addEventListener('click', () => {
            switchPage('dashboard');
            window.dispatchEvent(new CustomEvent('open-profile-modal'));
            
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            const dashLink = document.querySelector('.nav-link[data-page="dashboard"]');
            if (dashLink) dashLink.classList.add('active');
        });
    }
    
    // Budget Settings Form
    const budgetSettingsForm = document.getElementById('form-budget-settings');
    if (budgetSettingsForm) {
        // Atualizar total quando os campos mudarem
        ['budget-fixed-pct', 'budget-var-pct', 'budget-save-pct'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', updateBudgetTotalPct);
            }
        });
        
        budgetSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUser) {
                alert("Faça login para salvar!");
                return;
            }
            
            const fixedPct = parseInt(document.getElementById('budget-fixed-pct')?.value || 0);
            const varPct = parseInt(document.getElementById('budget-var-pct')?.value || 0);
            const savePct = parseInt(document.getElementById('budget-save-pct')?.value || 0);
            const total = fixedPct + varPct + savePct;
            
            if (total !== 100) {
                alert("Os percentuais devem somar 100%!");
                return;
            }
            
            const { error } = await supabase.from('budget_settings').upsert({
                user_id: currentUser.id,
                fixed_limit_pct: fixedPct,
                var_limit_pct: varPct,
                save_limit_pct: savePct,
                updated_at: new Date()
            }, { onConflict: 'user_id' });
            
            const msgEl = document.getElementById('budget-settings-msg');
            if (!error) {
                budgetFixedLimit = fixedPct;
                budgetVarLimit = varPct;
                budgetSaveLimit = savePct;
                msgEl.textContent = "Configurações salvas!";
                msgEl.style.color = "#388e3c";
                showToast("Configurações do orçamento salvas!");
                
                // Atualiza a visualização do orçamento imediatamente
                if (typeof renderBudgetManager === 'function') {
                    renderBudgetManager();
                }
                
                // Emite evento para o React atualizar
                window.dispatchEvent(new CustomEvent('budget-settings-updated', {
                    detail: { fixed: fixedPct, variable: varPct, save: savePct }
                }));
            } else {
                msgEl.textContent = "Erro: " + error.message;
                msgEl.style.color = "#ff4d4f";
            }
            msgEl.style.display = 'block';
            setTimeout(() => msgEl.style.display = 'none', 3000);
        });
    }

    // Community Handlers
    async function loadCommunityThreads() {
        const communityMain = document.querySelector('.community-main');
        if (!communityMain) return;

        // Gerenciando o estado de carregamento e container de tópicos
        let threadList = communityMain.querySelector('.thread-list');
        if (!threadList) {
            threadList = document.createElement('div');
            threadList.className = 'thread-list';
            // Inserir após o post fixado se existir, senão no início
            const pinned = communityMain.querySelector('.pinned-thread');
            if (pinned) {
                pinned.after(threadList);
            } else {
                communityMain.prepend(threadList);
            }
        }

        // Mostrar indicador de carregamento
        const loadingId = 'community-loading-indicator';
        if (!document.getElementById(loadingId)) {
            const loading = document.createElement('div');
            loading.id = loadingId;
            loading.style.textAlign = 'center';
            loading.style.padding = '20px';
            loading.style.color = 'var(--text-muted)';
            loading.style.fontSize = '13px';
            loading.textContent = 'Buscando inteligência coletiva...';
            threadList.prepend(loading);
        }

        try {
            console.group("Comunidade: Diagnóstico de Carregamento");
            console.log("Iniciando busca de tópicos...");

            let { data, error, status } = await supabase
                .from('community_topics')
                .select(`
                    *,
                    profiles:user_id (nickname)
                `)
                .order('created_at', { ascending: false });

            // Detecção de erro no Join
            if (error) {
                console.warn(`[Aviso] Busca com join falhou (Status: ${status}). Erro:`, error.message);
                console.log("Tentando Fallback: Busca simples (sem join)...");
                
                const fallback = await supabase
                    .from('community_topics')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (fallback.error) {
                    console.error("[Erro Fatal] Busca simples também falhou:", fallback.error);
                    throw fallback.error;
                }
                
                data = fallback.data;
                console.log("Fallback bem sucedido. Dados recuperados sem perfis.");
            }

            console.log(`Tópicos encontrados: ${data ? data.length : 0}`);
            if (data) console.table(data);

            // Limpar a lista atual (removendo cards estáticos e dinâmicos)
            const currentCards = threadList.querySelectorAll('.thread-card');
            console.log(`Limpando ${currentCards.length} cards existentes...`);
            currentCards.forEach(card => card.remove());

            const emptyMsg = threadList.querySelector('.empty-community-msg');
            if (emptyMsg) emptyMsg.remove();
            
            if (data && data.length > 0) {
                data.forEach(topic => {
                    const card = document.createElement('div');
                    card.className = 'thread-card';
                    const date = new Date(topic.created_at).toLocaleDateString('pt-BR');
                    const author = topic.profiles?.nickname || 'Membro AFIC';
                    
                    card.innerHTML = `
                        <div class="thread-badge" style="background: var(--navy-medium); color: var(--bg-white); border:none;">${topic.category}</div>
                        <h3 class="thread-title">${topic.title}</h3>
                        <p class="thread-excerpt">${topic.content.substring(0, 150)}${topic.content.length > 150 ? '...' : ''}</p>
                        <div class="thread-meta">
                            <span class="thread-author"><strong>${author}</strong></span>
                            <span class="thread-date">${date}</span>
                        </div>
                    `;
                    
                    card.addEventListener('click', () => {
                        loadTopicDetails(topic.id);
                    });
                    
                    threadList.appendChild(card);
                });
                console.log("Interface da comunidade atualizada com sucesso.");
            } else {
                console.warn("Nenhum dado retornado. Isso geralmente indica falta de políticas de RLS ou tabela vazia.");
                const p = document.createElement('p');
                p.className = 'empty-community-msg';
                p.style.cssText = 'text-align:center; padding: 40px; color: var(--text-muted); font-size: 14px;';
                p.textContent = 'Nenhuma discussão encontrada no momento. (Verifique RLS no Supabase)';
                threadList.appendChild(p);
            }
        } catch (err) {
            console.error("ERRO CRÍTICO NA COMUNIDADE:", err);
            showToast(`❌ Erro DB [${err.code || 'JS'}]: ${err.message.substring(0, 50)}...`);
            
            if (threadList.querySelectorAll('.thread-card').length === 0) {
                threadList.innerHTML = `
                    <div class="empty-community-msg" style="text-align:center; padding: 40px; color: #ff4d4f; font-size: 14px;">
                        <strong>Erro de conexão com o banco.</strong><br>
                        <small>Código: ${err.code || 'N/A'}</small><br>
                        <small>${err.message}</small>
                    </div>`;
            }
        } finally {
            console.groupEnd();
            const loader = document.getElementById(loadingId);
            if (loader) loader.remove();
        }
        
        // Garantir que o botão "Carregar mais" está no lugar certo (fim da community-main)
        let loadMore = communityMain.querySelector('.load-more-btn');
        if (!loadMore) {
            loadMore = document.createElement('button');
            loadMore.className = 'btn-secondary load-more-btn';
            loadMore.textContent = 'Carregar mais discussões';
            loadMore.style.marginTop = '24px';
            loadMore.addEventListener('click', () => showToast('📜 Todas as discussões carregadas.'));
            communityMain.appendChild(loadMore);
        }
    }

    async function loadTopicDetails(topicId) {
        // Show loading state
        switchPage('topic-details');
        document.getElementById('detail-topic-title').textContent = "Carregando conteúdo...";
        document.getElementById('detail-topic-title').setAttribute('data-id', topicId);
        document.getElementById('detail-topic-content').textContent = "";
        document.getElementById('topic-attachment-box').innerHTML = "";

        try {
            let { data, error } = await supabase
                .from('community_topics')
                .select(`
                    *,
                    profiles:user_id (nickname)
                `)
                .eq('id', topicId)
                .single();

            // FALLBACK: Se o join falhar, tenta buscar apenas o tópico
            if (error) {
                console.warn("Topic details join failed, attempting fallback...", error.message);
                const fallback = await supabase
                    .from('community_topics')
                    .select('*')
                    .eq('id', topicId)
                    .single();
                
                if (fallback.error) throw fallback.error;
                data = fallback.data;
            }

            if (!data) throw new Error("Postagem não encontrada.");

            const date = new Date(data.created_at).toLocaleDateString('pt-BR');
            const author = data.profiles?.nickname || 'Identidade Protegida';
            
            // Populate view
            document.getElementById('detail-topic-title').textContent = data.title;
            document.getElementById('detail-topic-author').innerHTML = `<strong>${author}</strong>`;
            document.getElementById('detail-topic-author-name').textContent = author;
            document.getElementById('detail-topic-date').textContent = date;
            document.getElementById('detail-topic-category').textContent = data.category;
            document.getElementById('detail-topic-content').textContent = data.content;
            
            // Attachment
            if (data.attachment_url) {
                document.getElementById('topic-attachment-box').innerHTML = `
                    <a href="${data.attachment_url}" target="_blank" class="attachment-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        Acessar Tese em PDF
                    </a>
                `;
            }

            // Avatar initials
            const avatar = document.getElementById('detail-topic-avatar');
            if (avatar) avatar.textContent = author.substring(0, 2).toUpperCase();
            
            loadLikes(topicId);
            loadComments(topicId);
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (err) {
            console.error("Erro ao abrir postagem:", err);
            showToast(`❌ Erro ao abrir postagem: ${err.message}`);
            switchPage('community');
        }
    }


    // Likes Logic
    async function loadLikes(topicId) {
        const { data, count, error } = await supabase
            .from('community_likes')
            .select('*', { count: 'exact' })
            .eq('topic_id', topicId);
        
        if (!error) {
            document.getElementById('topic-likes-count').textContent = count;
            const userLiked = data.some(l => l.user_id === currentUser?.id);
            const btn = document.getElementById('btn-like-topic');
            if (userLiked) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    }

    const btnLikeTopic = document.getElementById('btn-like-topic');
    if (btnLikeTopic) {
        btnLikeTopic.addEventListener('click', async () => {
            if (!currentUser) return showToast("⚠️ Faça login para curtir.");
            const topicId = document.getElementById('detail-topic-title').getAttribute('data-id');
            
            if (btnLikeTopic.classList.contains('active')) {
                await supabase.from('community_likes').delete().eq('topic_id', topicId).eq('user_id', currentUser.id);
            } else {
                await supabase.from('community_likes').insert([{ topic_id: topicId, user_id: currentUser.id }]);
            }
            loadLikes(topicId);
        });
    }

    // Comments Logic
    async function loadComments(topicId) {
        const container = document.getElementById('comments-list');
        container.innerHTML = '<p style="color:var(--text-muted); font-size:13px;">Carregando debate...</p>';

        try {
            const { data: comments, error: commentsError } = await supabase
                .from('community_comments')
                .select('*')
                .eq('topic_id', topicId)
                .order('created_at', { ascending: true });
            
            if (commentsError) throw commentsError;
            
            const { data: profiles } = await supabase.from('profiles').select('id, nickname');
            const profileMap = {};
            profiles?.forEach(p => profileMap[p.id] = p.nickname || 'Membro');
            
            let data = comments.map(c => ({ ...c, profiles: { nickname: profileMap[c.user_id] } }));

            container.innerHTML = data.length === 0 ? '<p style="color:var(--text-muted); font-size:13px; text-align:center;">Nenhum comentário ainda. Seja o primeiro a contribuir!</p>' : '';
            
            data.forEach(comment => {
                const div = document.createElement('div');
                div.className = 'comment-item';
                const date = new Date(comment.created_at).toLocaleDateString('pt-BR');
                const authorNickname = comment.profiles?.nickname || 'Membro';
                
                div.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <strong style="font-size: 14px;">${authorNickname}</strong>
                        <span style="font-size: 11px; color: var(--text-muted);">${date}</span>
                    </div>
                    <p style="font-size: 14px; color: var(--text-primary);">${comment.content}</p>
                `;
                container.appendChild(div);
            });
        } catch (err) {
            console.error("Erro ao carregar comentários:", err);
            container.innerHTML = '<p style="color:#ff4d4f; font-size:12px;">Erro ao carregar comentários.</p>';
        }
    }

    const formComment = document.getElementById('form-comment');
    if (formComment) {
        formComment.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUser) return showToast("⚠️ Faça login para comentar.");
            const input = document.getElementById('comment-input');
            const content = input.value.trim();
            const topicId = document.getElementById('detail-topic-title').getAttribute('data-id');

            if (!content) return;

            const { error } = await supabase
                .from('community_comments')
                .insert([{ topic_id: topicId, user_id: currentUser.id, content: content }]);

            if (!error) {
                input.value = "";
                loadComments(topicId);
            }
        });
    }

    // File Upload Handler
    async function uploadTopicFile(file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `teses/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('community-attachments')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('community-attachments')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }

    const topicFileInput = document.getElementById('topic-file');
    if (topicFileInput) {
        topicFileInput.addEventListener('change', () => {
            const status = document.getElementById('file-status');
            if (topicFileInput.files.length > 0) {
                status.textContent = `📎 Preparado: ${topicFileInput.files[0].name}`;
                status.style.color = "var(--gold-rich)";
            }
        });
    }
    if (btnOpenNewTopic) {
        btnOpenNewTopic.addEventListener('click', () => {
            if (!currentUserProfile || !currentUserProfile.nickname) {
                showToast('⚠️ Defina um apelido na aba "Minha Conta" antes de publicar.');
                switchPage('account');
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                document.getElementById('nav-account')?.classList.add('active');
                return;
            }
            modalNewTopic.classList.remove('hidden');
        });
    }

    if (btnCloseNewTopic) {
        btnCloseNewTopic.addEventListener('click', () => {
            modalNewTopic.classList.add('hidden');
        });
    }

    if (formNewTopic) {
        formNewTopic.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = formNewTopic.querySelector('button[type="submit"]');
            const titleInput = document.getElementById('topic-title');
            const contentInput = document.getElementById('topic-content');
            const categoryInput = document.getElementById('topic-category');
            const fileInput = document.getElementById('topic-file');
            
            const title = titleInput.value.trim();
            const content = contentInput.value.trim();
            const category = categoryInput.value;
            
            if (!title || !content) return;

            // Bloquear botão para evitar cliques duplos
            const originalBtnText = btnSubmit.textContent;
            btnSubmit.disabled = true;
            btnSubmit.textContent = "Publicando...";

            try {
                let attachmentUrl = null;
                if (fileInput.files.length > 0) {
                    showToast("📤 Enviando anexo PDF...");
                    attachmentUrl = await uploadTopicFile(fileInput.files[0]);
                }

                console.log("Inserting new topic:", title);
                const { error } = await supabase
                    .from('community_topics')
                    .insert([{
                        user_id: currentUser.id,
                        title,
                        category,
                        content,
                        attachment_url: attachmentUrl
                    }]);

                if (error) throw error;

                showToast('✅ Tópico publicado na Comunidade!');
                formNewTopic.reset();
                if (document.getElementById('file-status')) {
                    document.getElementById('file-status').textContent = 'Nenhum arquivo selecionado (Opcional)';
                    document.getElementById('file-status').style.color = '';
                }
                modalNewTopic.classList.add('hidden');
                
                // Recarregar discussões
                await loadCommunityThreads();
            } catch (err) {
                console.error("Erro ao publicar tópico:", err);
                let msg = err.message;
                if (msg.includes("column attachment_url")) {
                    msg = "Erro: A coluna 'attachment_url' falta no banco. Execute o script SQL de migração.";
                } else if (msg.includes("policy")) {
                    msg = "Erro de permissão RLS. Verifique as políticas de inserção no Supabase.";
                }
                showToast('❌ Erro ao publicar: ' + msg);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = originalBtnText;
            }
        });
    }

    // ─── 6. PLANS PAGE ───
    document.querySelectorAll('.plan-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const planName = btn.textContent.trim();
            showToast('💳 "' + planName + '" — O checkout será integrado com Stripe/Pix. Em breve!');
        });
    });

    // ─── 7. BUDGET ↔ CREDIT CARD MONTH SYNC ───
    // When budget month changes, also sync the CC viewer display
    const budgetPrev = document.getElementById('prev-month');
    const budgetNext = document.getElementById('next-month');
    if (budgetPrev) {
        budgetPrev.addEventListener('click', () => {
            if (typeof renderCCManager === 'function') renderCCManager();
        });
    }
    if (budgetNext) {
        budgetNext.addEventListener('click', () => {
            if (typeof renderCCManager === 'function') renderCCManager();
        });
    }

    // ─── MOBILE SIDEBAR TOGGLE ───
    if (window.innerWidth <= 900) {
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger-btn';
        hamburger.setAttribute('aria-label', 'Menu');
        hamburger.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="22" height="22">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
        `;
        hamburger.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            color: var(--text-primary);
            margin-right: 12px;
            order: -1;
        `;
        
        const topBar = document.getElementById('top-bar');
        const sidebar = document.getElementById('sidebar');
        
        if (topBar && sidebar) {
            topBar.insertBefore(hamburger, topBar.firstChild);
            
            hamburger.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
            
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    sidebar.classList.remove('open');
                });
            });
        }
    }

    console.log('AFIC Dashboard initialized ✦');

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('afic-theme');
    
    // Aplica tema salvo
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('afic-theme', isDark ? 'dark' : 'light');
            // Emite evento para React atualizar
            window.dispatchEvent(new CustomEvent('theme-changed', { detail: { dark: isDark } }));
        });
    }

  } catch(err) {
    console.error('AFIC INIT ERROR:', err);
  }
}

// Toggle password visibility
window.togglePassword = function() {
  const passwordInput = document.getElementById('auth-password');
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
  } else {
    passwordInput.type = 'password';
  }
};

// Toggle auth theme (light/dark)
window.toggleAuthTheme = function() {
  const authModal = document.getElementById('auth-modal');
  authModal.classList.toggle('light');
};

// Handle hash navigation
window.handleHashChange = function() {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'assessment') {
    const page = document.getElementById('page-assessment');
    if (page) {
      page.classList.remove('page-hidden');
      page.style.display = 'flex';
    }
  }
};

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initApp);
} else {
  window.initApp();
}

// Handle hash navigation on load and change
window.addEventListener('hashchange', window.handleHashChange);
window.addEventListener('DOMContentLoaded', function() {
  if (window.location.hash) {
    window.handleHashChange();
  }
  // Resetar para step 1
  window.currentStep = 1;
  // Mostrar primeiro step
  document.querySelectorAll('.assessment-step').forEach(step => {
    step.classList.add('hidden');
    step.style.display = 'none';
  });
  const firstStep = document.querySelector('.assessment-step[data-step="1"]');
  if (firstStep) {
    firstStep.classList.remove('hidden');
    firstStep.style.display = 'flex';
    firstStep.classList.add('active');
  }
  window.updateProgress();
});

// Assessment step navigation
window.currentStep = 1;
window.totalSteps = 9; // 1 contato + 8 perguntas

window.updateProgress = function() {
    const progress = (window.currentStep / window.totalSteps) * 100;
    const progressBar = document.getElementById('assessment-progress-bar');
    const progressText = document.getElementById('assessment-progress-text');
    if (progressBar) {
        progressBar.style.width = progress + '%';
    }
    if (progressText) {
        progressText.textContent = window.currentStep + '/' + window.totalSteps;
    }
};

window.nextStep = function() {
    const currentStepEl = document.querySelector(`.assessment-step[data-step="${window.currentStep}"]`);
    const toast = document.getElementById('assessment-toast');
    const toastMessage = toast?.querySelector('.toast-message');
    
    // Validação do step atual
    if (window.currentStep === 1) {
        const nome = document.getElementById('assessment-nome')?.value.trim();
        const email = document.getElementById('assessment-email')?.value.trim();
        const whatsapp = document.getElementById('assessment-whatsapp')?.value.trim();
        if (!nome || !email || !whatsapp) {
            if (toast) { toast.classList.remove('hidden', 'success'); toast.classList.add('error'); }
            if (toastMessage) toastMessage.textContent = 'Preencha todos os dados de contato.';
            return;
        }
    } else if (window.currentStep === 2) {
        if (!document.querySelector('input[name="dinheiro1"]:checked')) {
            if (toast) { toast.classList.remove('hidden', 'success'); toast.classList.add('error'); }
            if (toastMessage) toastMessage.textContent = 'Responda o que acontece com seu dinheiro.';
            return;
        }
    } else if (window.currentStep === 3) {
        if (!document.querySelector('input[name="emergencia"]:checked')) {
            if (toast) { toast.classList.remove('hidden', 'success'); toast.classList.add('error'); }
            if (toastMessage) toastMessage.textContent = 'Selecione como resolveria uma emergência.';
            return;
        }
    } else if (window.currentStep === 4) {
        if (!document.querySelector('input[name="trava"]:checked')) {
            if (toast) { toast.classList.remove('hidden', 'success'); toast.classList.add('error'); }
            if (toastMessage) toastMessage.textContent = 'Selecione o que travou seu patrimônio.';
            return;
        }
    } else if (window.currentStep === 5) {
        if (!document.querySelector('input[name="cartao"]:checked')) {
            if (toast) { toast.classList.remove('hidden', 'success'); toast.classList.add('error'); }
            if (toastMessage) toastMessage.textContent = 'Selecione como usa seu cartão.';
            return;
        }
    } else if (window.currentStep === 6) {
        if (!document.querySelector('input[name="paciencia"]:checked')) {
            if (toast) { toast.classList.remove('hidden', 'success'); toast.classList.add('error'); }
            if (toastMessage) toastMessage.textContent = 'Selecione seu nível de paciência.';
            return;
        }
    } else if (window.currentStep === 7) {
        if (!document.querySelector('input[name="sucesso"]:checked')) {
            if (toast) { toast.classList.remove('hidden', 'success'); toast.classList.add('error'); }
            if (toastMessage) toastMessage.textContent = 'Defina o que é sucesso financeiro para você.';
            return;
        }
    } else if (window.currentStep === 8) {
        if (!document.querySelector('input[name="corte"]:checked')) {
            if (toast) { toast.classList.remove('hidden', 'success'); toast.classList.add('error'); }
            if (toastMessage) toastMessage.textContent = 'Selecione como reage a necessidade de cortar luxos.';
            return;
        }
    }
    
    // Ocultar step atual
    if (currentStepEl) {
        currentStepEl.classList.remove('active');
        currentStepEl.classList.add('hidden');
    }
    
    // Avançar para próximo step
    window.currentStep++;
    
    // Mostrar próximo step
    const nextStepEl = document.querySelector(`.assessment-step[data-step="${window.currentStep}"]`);
    if (nextStepEl) {
        nextStepEl.classList.remove('hidden');
        nextStepEl.classList.add('active');
    }
    
    // Atualizar barra de progresso
    window.updateProgress();
    
    // Fechar toast se existir
    if (toast) {
        toast.classList.add('hidden');
    }
};

// Assessment form handler
window.handleAssessmentSubmit = async function(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  const nome = document.getElementById('assessment-nome')?.value.trim();
  const email = document.getElementById('assessment-email')?.value.trim();
  const whatsapp = document.getElementById('assessment-whatsapp')?.value.trim();
  const toast = document.getElementById('assessment-toast');
  const toastMessage = toast?.querySelector('.toast-message');
  
  // Validação dados contato
  if (!nome) {
    if (toast) { toast.classList.remove('hidden', 'success'); toast.classList.add('error'); }
    if (toastMessage) toastMessage.textContent = 'Preencha seu nome completo.';
    return false;
  }
  if (!email) {
    if (toast) { toast.classList.remove('hidden', 'success'); toast.classList.add('error'); }
    if (toastMessage) toastMessage.textContent = 'Preencha seu e-mail.';
    return false;
  }
  if (!whatsapp) {
    if (toast) { toast.classList.remove('hidden', 'success'); toast.classList.add('error'); }
    if (toastMessage) toastMessage.textContent = 'Preencha seu WhatsApp.';
    return false;
  }
  
  // Validação Bloco 1 - Removido: campos sikap dan janela antigos
  if (!document.querySelector('input[name="dinheiro1"]:checked')) {
    if (toast) { toast.classList.remove('hidden', 'success'); toast.classList.add('error'); }
    if (toastMessage) toastMessage.textContent = 'Responda o que acontece com seu dinheiro.';
    return false;
  }
  if (!document.querySelector('input[name="emergencia"]:checked')) {
    if (toast) { toast.classList.remove('hidden', 'success'); toast.classList.add('error'); }
    if (toastMessage) toastMessage.textContent = 'Selecione como resolveria uma emergência.';
    return false;
  }
  if (!document.querySelector('input[name="trava"]:checked')) {
    if (toast) { toast.classList.remove('hidden', 'success'); toast.classList.add('error'); }
    if (toastMessage) toastMessage.textContent = 'Selecione o que travou seu patrimônio.';
    return false;
  }
  if (!document.querySelector('input[name="cartao"]:checked')) {
    if (toast) { toast.classList.remove('hidden', 'success'); toast.classList.add('error'); }
    if (toastMessage) toastMessage.textContent = 'Selecione como usa seu cartão.';
    return false;
  }
  if (!document.querySelector('input[name="paciencia"]:checked')) {
    if (toast) { toast.classList.remove('hidden', 'success'); toast.classList.add('error'); }
    if (toastMessage) toastMessage.textContent = 'Selecione seu nível de paciência.';
    return false;
  }
  if (!document.querySelector('input[name="sucesso"]:checked')) {
    if (toast) { toast.classList.remove('hidden', 'success'); toast.classList.add('error'); }
    if (toastMessage) toastMessage.textContent = 'Defina o que é sucesso financeiro para você.';
    return false;
  }
  if (!document.querySelector('input[name="corte"]:checked')) {
    if (toast) { toast.classList.remove('hidden', 'success'); toast.classList.add('error'); }
    if (toastMessage) toastMessage.textContent = 'Selecione como reage a necessidade de cortar luxos.';
    return false;
  }
  if (!document.querySelector('input[name="tempo"]:checked')) {
    if (toast) { toast.classList.remove('hidden', 'success'); toast.classList.add('error'); }
    if (toastMessage) toastMessage.textContent = 'Selecione sua disponibilidade de tempo.';
    return false;
  }
  
  // Coletar dados
  const formData = {
    nome, email, whatsapp,
    dinheiro1: document.querySelector('input[name="dinheiro1"]:checked')?.value,
    emergencia: document.querySelector('input[name="emergencia"]:checked')?.value,
    trava: document.querySelector('input[name="trava"]:checked')?.value,
    cartao: document.querySelector('input[name="cartao"]:checked')?.value,
    paciencia: document.querySelector('input[name="paciencia"]:checked')?.value,
    sucesso: document.querySelector('input[name="sucesso"]:checked')?.value,
    corte: document.querySelector('input[name="corte"]:checked')?.value,
    tempo: document.querySelector('input[name="tempo"]:checked')?.value
  };
  
  console.log('Assessment enviado:', formData);
  
  // Salvar no banco de dados
  const supabaseDb = window.supabaseApp || window.aficSupabase;
  
  // Check what we have
  console.log('Supabase disponível:', !!supabaseDb);
  console.log('Keys do supabase:', supabaseDb ? Object.keys(supabaseDb) : 'n/a');
  
  let saveError = null;
  
  if (!supabaseDb) {
    console.error('Supabase não initialized');
    saveError = 'Supabase não initialized';
  } else {
    try {
      const { error } = await supabaseDb.from('afic_assessment_responses').insert([formData]);
      if (error) {
        console.error('Erro do Supabase:', error);
        saveError = error.message;
      } else {
        console.log('Salvo!');
      }
    } catch(err) {
      console.error('Erro catch:', err);
      saveError = err.message;
    }
  }
  
  if (saveError) {
    if (toast) {
      toast.classList.remove('hidden', 'success');
      toast.classList.add('error');
    }
    if (toastMessage) toastMessage.textContent = 'Erro ao enviar: ' + saveError;
    setTimeout(() => {
      if (toast) toast.classList.add('hidden');
    }, 5000);
    return false;
  }
  
  if (toast) {
    toast.classList.remove('hidden', 'error');
    toast.classList.add('success');
  }
  if (toastMessage) toastMessage.textContent = 'Respostas enviadas! Nossa equipe entrará em contato em breve.';
  
  setTimeout(() => {
    if (toast) toast.classList.add('hidden');
    switchPage('home');
  }, 3000);
  
  return false;
};

window.loadAssessmentResponses = async function() {
  const container = document.getElementById('assessment-responses-list');
  if (!container) return;
  
  const supabaseDb = window.supabaseApp || window.aficSupabase;
  if (!supabaseDb) {
    container.innerHTML = '<p style="color: red;">Supabase não conectado</p>';
    return;
  }
  
  try {
    const { data, error } = await supabaseDb.from('afic_assessment_responses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      container.innerHTML = '<p>Nenhuma resposta encontrada.</p>';
      return;
    }
    
    const statusLabels = {
      'novo': 'Pendente',
      'aprovado': 'Aprovado',
      'rejeitado': 'Rejeitado'
    };
    
    container.innerHTML = data.map(r => `
      <div class="assessment-card" data-id="${r.id}">
        <div class="assessment-header">
          <div>
            <strong class="assessment-nome">${r.nome || '-'}</strong>
            <span class="assessment-email">${r.email || '-'}</span>
          </div>
          <div class="assessment-actions">
            <button class="btn-analysis" data-id="${r.id}" style="background: #D4AF37; color: #000; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">Análise</button>
            <select class="status-select" data-id="${r.id}">
              <option value="novo" ${r.status === 'novo' ? 'selected' : ''}>Pendente</option>
              <option value="aprovado" ${r.status === 'aprovado' ? 'selected' : ''}>Aprovado</option>
              <option value="rejeitado" ${r.status === 'rejeitado' ? 'selected' : ''}>Rejeitado</option>
            </select>
            <span class="assessment-date">${r.created_at ? new Date(r.created_at).toLocaleString('pt-BR') : ''}</span>
          </div>
        </div>
        <div class="assessment-grid">
          <div><span class="assessment-label">WhatsApp:</span> <span style="color: #fff;">${r.whatsapp || '-'}</span></div>
        </div>
      </div>
    `).join('');
    
    container.querySelectorAll('.btn-analysis').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const item = data.find(d => d.id === id);
        if (item) showAssessmentDetail(item);
      });
    });
    
    container.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        const newStatus = e.target.value;
        const { error } = await supabaseDb.from('afic_assessment_responses')
          .update({ status: newStatus })
          .eq('id', id);
        if (error) {
          alert('Erro ao atualizar: ' + error.message);
          e.target.value = e.target.dataset.original;
        }
      });
    });
    
  } catch(err) {
    container.innerHTML = '<p style="color: red;">Erro ao carregar: ' + err.message + '</p>';
  }
};

window.showAssessmentDetail = function(r) {
  const modal = document.getElementById('modal-assessment-detail');
  const nomeEl = document.getElementById('detailNome');
  const emailEl = document.getElementById('detailEmail');
  const contentEl = document.getElementById('detailContent');
  
  nomeEl.textContent = r.nome || 'Detalhes do Perfil';
  emailEl.textContent = r.email || '';
  
  const answersMap = {
    dinheiro1: {
      'some': 'Vai quase tudo para pagar as contas do mês passado e faturas.',
      'percebe': 'Consigo pagar o básico, mas o resto some sem perceber.',
      'separo': 'Já separo uma parte antes de começar a gastar.'
    },
    emergencia: {
      'emprestou': 'Usaria limite, cartão ou pediria emprestado.',
      'atrasar': 'Venderia algo ou atrasaria outras contas.',
      'fundo': 'Tenho reserva para emergências.'
    },
    trava: {
      'pouco': 'Ganha pouco, só rico investe.',
      'conhecimento': 'Tenho medo de perder, não entendo o mercado.',
      'disciplina': 'Tento guardar, mas sempre gasto demais.'
    },
    cartao: {
      'extensao': 'Extensão da renda. Pago mínimo ou parcelo.',
      'consome': 'Uso muito, pago o total, mas consome o que ganho.',
      'estrategico': 'Uso estratégico para pontos, sempre pago o total.'
    },
    paciencia: {
      'imediato': 'Quero resultados já.',
      'medio': 'Aguardo até 1 ano.',
      'processo': 'Entendo que é um processo longo.'
    },
    sucesso: {
      'acertar': 'Acertar o timing do mercado.',
      'dividas': 'Sair das dívidas.',
      'patrimonio': 'Acumular patrimônio institucional.'
    },
    corte: {
      'difcil': 'Muito difícil abrir mão dos luxos.',
      'sacrificio': 'Consigo com muito sacrifício.',
      'equilibrio': 'Consigo encontrar equilíbrio.'
    },
    tempo: {
      'pouco': 'Tenho pouco tempo disponível.',
      'medio': 'Consigo dedicar algumas horas por semana.',
      '2-3': 'Tenho tempo de dedicarme full time.'
    }
  };
  
  const getAnswer = (field, value) => {
    if (!value) return '-';
    return answersMap[field]?.[value] || value;
  };
  
  const questions = [
    { q: '1. O que você faz com o seu dinheiro?', a: getAnswer('dinheiro1', r.dinheiro1) },
    { q: '2. Em uma emergência, você tem reserves?', a: getAnswer('emergencia', r.emergencia) },
    { q: '3. O que mais trava o seu crescimento financeiro?', a: getAnswer('trava', r.trava) },
    { q: '4. Como você usa o cartão de crédito?', a: getAnswer('cartao', r.cartao) },
    { q: '5. Qual o seu nível de paciência para ver resultados?', a: getAnswer('paciencia', r.paciencia) },
    { q: '6. O que é sucesso financeiro para você?', a: getAnswer('sucesso', r.sucesso) },
    { q: '7. Como você reage a necessidade de cortar luxos?', a: getAnswer('corte', r.corte) },
    { q: '8. Quanto tempo disponível você tem para trabalhar nisso?', a: getAnswer('tempo', r.tempo) }
  ];
  
  contentEl.innerHTML = questions.map(item => `
    <div style="margin-bottom: 18px;">
      <div style="color: #fbbf24; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; font-weight: 600;">${item.q}</div>
      <div style="color: #f1f5f9; font-size: 14px; line-height: 1.5;">${item.a || '-'}</div>
    </div>
  `).join('') + `
    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(212,175,55,0.3); display: flex; justify-content: space-between; font-size: 13px;">
      <div>
        <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">WhatsApp</div>
        <div style="color: #fbbf24; font-weight: 600;">${r.whatsapp || '-'}</div>
      </div>
      <div style="text-align: right;">
        <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Enviado</div>
        <div style="color: #e2e8f0;">${r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : '-'}</div>
      </div>
    </div>
  `;
  
  modal.classList.remove('hidden');
  
  document.getElementById('btn-close-detail').onclick = () => {
    modal.classList.add('hidden');
  };
};

window.exportAssessmentExcel = async function() {
  const supabaseDb = window.supabaseApp || window.aficSupabase;
  if (!supabaseDb) {
    alert('Supabase não conectado');
    return;
  }
  
  try {
    const { data, error } = await supabaseDb.from('afic_assessment_responses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    if (!data || data.length === 0) {
      alert('Nenhuma resposta para exportar');
      return;
    }
    
    const headers = [
      'Nome',
      'E-mail',
      'WhatsApp',
      '1. O que você faz com o seu dinheiro?',
      '2. Em uma emergência, você tem reserves?',
      '3. O que mais trava o seu crescimento financeiro?',
      '4. Como você usa o cartão de crédito?',
      '5. Qual o seu nível de paciência para ver resultados?',
      '6. O que é sucesso financeiro para você?',
      '7. Como você reage a necessidade de cortar luxos?',
      '8. Quanto tempo disponível você tem para trabalhar nisso?',
      'Status',
      'Data do envio'
    ];
    
    const rows = data.map(r => [
      r.nome || '',
      r.email || '',
      r.whatsapp || '',
      r.dinheiro1 || '',
      r.emergencia || '',
      r.trava || '',
      r.cartao || '',
      r.paciencia || '',
      r.sucesso || '',
      r.corte || '',
      r.tempo || '',
      r.status || '',
      r.created_at ? new Date(r.created_at).toLocaleString('pt-BR') : ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Analise-de-Perfil_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
    
  } catch(err) {
    alert('Erro ao exportar: ' + err.message);
  }
};

/* ═══════════════════════════════════════════════════════════════
   ADMIN DASHBOARD - KANBAN FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */

window.loadKanban = async function() {
  const board = document.getElementById('kanban-board');
  if (!board) return;
  
  const supabaseDb = window.supabaseApp || window.aficSupabase;
  if (!supabaseDb) {
    board.innerHTML = '<p style="color: #ef4444; padding: 20px;">Supabase não conectado</p>';
    return;
  }
  
  try {
    const { data, error } = await supabaseDb.from('afic_assessment_responses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const columns = [
      { id: 'novo', title: 'Novas Aplicações' },
      { id: 'analise', title: 'Em Análise' },
      { id: 'qualificado', title: 'Qualificado (O Despertar)' },
      { id: 'highticket', title: 'Qualificado (High-Ticket)' },
      { id: 'reprovado', title: 'Reprovados' }
    ];
    
    const getStatus = (r) => r.status || 'novo';
    const getFlags = (r) => {
      const flags = [];
      if (r.dinheiro1 === 'separo') flags.push({ type: 'green', label: 'Finança' });
      if (r.emergencia === 'fundo') flags.push({ type: 'green', label: 'Reserva' });
      if (r.trava === 'pouco') flags.push({ type: 'red', label: 'Income' });
      if (r.paciencia === 'imediato') flags.push({ type: 'red', label: 'Impaciente' });
      if (r.cartao === 'estrategico') flags.push({ type: 'green', label: 'Cartão' });
      return flags;
    };
    
    board.innerHTML = columns.map(col => {
      const cards = data.filter(r => getStatus(r) === col.id);
      return `
        <div class="kanban-column">
          <div class="column-header">
            <span class="column-title">${col.title}</span>
            <span class="column-count">${cards.length}</span>
          </div>
          <div class="kanban-cards">
            ${cards.map(r => `
              <div class="candidate-card" onclick="openCandidate('${r.id}')">
                <div class="candidate-name">${r.nome || '-'}</div>
                <div class="candidate-contact">${r.email || '-'}<br>${r.whatsapp || '-'}</div>
                <div class="candidate-tags">
                  ${getFlags(r).map(f => `<span class="tag ${f.type}">${f.label}</span>`).join('')}
                </div>
                <div class="candidate-notes">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                  Ver detalhes
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
    
    window.kanbanData = data;
    
  } catch(err) {
    board.innerHTML = '<p style="color: #ef4444; padding: 20px;">Erro ao carregar: ' + err.message + '</p>';
  }
};

window.openCandidate = function(id) {
  const data = window.kanbanData;
  const r = data.find(d => d.id === id);
  if (!r) return;
  
  const modal = document.getElementById('candidate-modal');
  document.getElementById('candidate-name').textContent = r.nome || 'Candidato';
  document.getElementById('candidate-email').textContent = r.email || '';
  
  const answersMap = {
    dinheiro1: { 'some': 'Vai quase tudo para pagar as contas.', 'percebe': 'Consigo pagar o básico, mas o resto some.', 'separo': 'Já separo uma parte antes.' },
    emergencia: { 'emprestou': 'Usaria limite ou pediria emprestado.', 'atrasar': 'Venderia algo ou atrasaria contas.', 'fundo': 'Tenho reserva para emergências.' },
    trava: { 'pouco': 'Ganha pouco, só rico investe.', 'conhecimento': 'Tenho medo de perder.', 'disciplina': 'Tento guardar, mas sempre gasto.' },
    cartao: { 'extensao': 'Extensão da renda.', 'consome': 'Uso muito, pago o total.', 'estrategico': 'Uso estratégico, sempre pago.' },
    paciencia: { 'imediato': 'Quero resultados já.', 'medio': 'Aguardo até 1 ano.', 'processo': 'Entendo que é um processo longo.' },
    sucesso: { 'acertar': 'Acertar o timing.', 'dividas': 'Sair das dívidas.', 'patrimonio': 'Acumular patrimônio.' },
    corte: { 'difcil': 'Muito difícil abrir mão.', 'sacrificio': 'Consigo com sacrifício.', 'equilibrio': 'Consigo equilibrar.' },
    tempo: { 'pouco': 'Tenho poco tempo.', 'medio': 'Algumas horas por semana.', '2-3': 'Tenho tempo full.' }
  };
  
  const getAnswer = (field, val) => answersMap[field]?.[val] || val || '-';
  
  const questions = [
    { q: 'O que faz com o dinheiro?', a: getAnswer('dinheiro1', r.dinheiro1) },
    { q: 'Emergência financeira?', a: getAnswer('emergencia', r.emergencia) },
    { q: 'O que trava o crescimento?', a: getAnswer('trava', r.trava) },
    { q: 'Uso do cartão?', a: getAnswer('cartao', r.cartao) },
    { q: 'Paciência para resultados?', a: getAnswer('paciencia', r.paciencia) },
    { q: 'Sucesso financeiro?', a: getAnswer('sucesso', r.sucesso) },
    { q: 'Corte de luxos?', a: getAnswer('corte', r.corte) },
    { q: 'Tempo disponível?', a: getAnswer('tempo', r.tempo) }
  ];
  
  document.getElementById('candidate-content').innerHTML = questions.map(q => `
    <div class="drawer-question">
      <div class="drawer-question-label">${q.q}</div>
      <div class="drawer-question-answer">${q.a}</div>
    </div>
  `).join('') + `
    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
      <div style="color: #fbbf24; font-size: 11px; text-transform: uppercase; margin-bottom: 8px;">Contato</div>
      <div style="color: white; font-size: 14px;">${r.whatsapp || '-'}</div>
      <div style="color: #94a3b8; font-size: 13px; margin-top: 4px;">${r.email || '-'}</div>
    </div>
  `;
  
  window.currentCandidateId = id;
  modal.classList.remove('hidden');
};

window.closeCandidateModal = function() {
  document.getElementById('candidate-modal').classList.add('hidden');
};

window.candidateAction = async function(action) {
  const id = window.currentCandidateId;
  if (!id) return;
  
  let newStatus;
  if (action === 'aprovar') newStatus = 'qualificado';
  else if (action === 'escalar') newStatus = 'highticket';
  else if (action === 'negar') newStatus = 'reprovado';
  
  const supabaseDb = window.supabaseApp || window.aficSupabase;
  if (!supabaseDb) {
    alert('Supabase não conectado');
    return;
  }
  
  try {
    const { error } = await supabaseDb.from('afic_assessment_responses')
      .update({ status: newStatus })
      .eq('id', id);
    
    if (error) throw error;
    
    closeCandidateModal();
    loadKanban();
    alert('Candidato atualizado para: ' + (newStatus === 'qualificado' ? 'Qualificado (O Despertar)' : newStatus === 'highticket' ? 'High-Ticket' : 'Reprovado'));
  } catch(err) {
    alert('Erro ao atualizar: ' + err.message);
  }
};

window.loadAlunos = async function() {
  const supabaseDb = window.supabaseApp || window.aficSupabase;
  if (!supabaseDb) return [];
  
  const { data, error } = await supabaseDb.from('afic_alunos').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error loading alunos:', error);
    return [];
  }
  return data || [];
};

window.renderAlunosModule = async function() {
  const board = document.getElementById('kanban-board');
  if (!board) return;

  const alunos = await window.loadAlunos();
  const statusFilter = document.getElementById('aluno-status-filter')?.value || 'todos';
  const planoFilter = document.getElementById('aluno-plano-filter')?.value || 'todos';

  let filtered = alunos;
  if (statusFilter !== 'todos') {
    filtered = filtered.filter(a => a.status_pagamento === statusFilter);
  }
  if (planoFilter !== 'todos') {
    filtered = filtered.filter(a => a.plano === planoFilter);
  }

  const planoCounts = { ninguno: 0, despertar: 0, assinante: 0, private: 0, elite: 0 };
const statusCounts = { pendente: 0, ativo: 0, inadimplente: 0, cancelado: 0 };
  alunos.forEach(a => {
    if (planoCounts[a.plano] !== undefined) planoCounts[a.plano]++;
    if (statusCounts[a.status_pagamento] !== undefined) statusCounts[a.status_pagamento]++;
  });

  const receitaTotal = (alunos.reduce((sum, a) => sum + (parseFloat(a.valor_pago) || 0), 0)).toLocaleString('pt-BR');
  
  const html = `
    <div class="alunos-toolbar">
      <div class="toolbar-left">
        <button class="btn-primary" onclick="openAlunoModal()">+ Novo Aluno</button>
        <input type="text" id="aluno-search" placeholder="Buscar por nome ou email..." oninput="filterAlunos()" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; width: 280px;">
      </div>
      <div class="toolbar-right">
        <select id="aluno-status-filter" onchange="renderAlunosModule()" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px;">
          <option value="todos">Todos Status (${alunos.length})</option>
          <option value="pendente">Pendente (${statusCounts.pendente})</option>
          <option value="ativo">Ativo (${statusCounts.ativo})</option>
          <option value="inadimplente">Inadimplente (${statusCounts.inadimplente})</option>
          <option value="cancelado">Cancelado (${statusCounts.cancelado})</option>
        </select>
        <select id="aluno-plano-filter" onchange="renderAlunosModule()" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px;">
          <option value="todos">Todos Planos</option>
          <option value="despertar">Despertar (${planoCounts.despertar})</option>
          <option value="assinante">Assinante (${planoCounts.assinante})</option>
          <option value="private">Private (${planoCounts.private})</option>
          <option value="elite">Elite (${planoCounts.elite})</option>
        </select>
      </div>
    </div>
    <div class="alunos-stats">
      <div class="stat-card">
        <span class="stat-number">${alunos.length}</span>
        <span class="stat-label">Total Alunos</span>
      </div>
      <div class="stat-card active">
        <span class="stat-number">${statusCounts.ativo}</span>
        <span class="stat-label">Ativos</span>
      </div>
      <div class="stat-card warning">
        <span class="stat-number">${statusCounts.inadimplente}</span>
        <span class="stat-label">Inadimplentes</span>
      </div>
      <div class="stat-card revenue">
        <span class="stat-number">R$ ${receitaTotal}</span>
        <span class="stat-label">Receita Total</span>
      </div>
    </div>
    <div class="alunos-table-container">
      <table class="alunos-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>WhatsApp</th>
            <th>Plano</th>
            <th>Status</th>
            <th>Valor</th>
            <th>Início</th>
            <th>Último Acesso</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="alunos-tbody">
          ${filtered.length === 0 ? '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #94a3b8;">Nenhum aluno encontrado</td></tr>' : filtered.map(aluno => `
            <tr>
              <td><strong>${aluno.nome || '-'}</strong></td>
              <td>${aluno.email || '-'}</td>
              <td>${aluno.whatsapp || '-'}</td>
              <td><span class="badge plano-${aluno.plano}">${aluno.plano || 'nenhum'}</span></td>
              <td><span class="badge status-${aluno.status_pagamento}">${aluno.status_pagamento || 'pendente'}</span></td>
              <td>R$ ${parseFloat(aluno.valor_pago || 0).toLocaleString('pt-BR')}</td>
              <td>${aluno.data_inicio ? new Date(aluno.data_inicio).toLocaleDateString('pt-BR') : '-'}</td>
              <td>${aluno.ultimo_acesso ? new Date(aluno.ultimo_acesso).toLocaleDateString('pt-BR') : '-'}</td>
              <td>
                <button class="btn-icon" onclick="openAlunoModal('${aluno.id}')" title="Editar">✏️</button>
                <button class="btn-icon" onclick="deleteAluno('${aluno.id}')" title="Excluir">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  board.innerHTML = html;
};

window.filterAlunos = function() {
  const search = document.getElementById('aluno-search')?.value.toLowerCase() || '';
  const rows = document.querySelectorAll('#alunos-tbody tr');
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(search) ? '' : 'none';
  });
};

window.openAlunoModal = async function(alunoId) {
  const supabaseDb = window.supabaseApp || window.aficSupabase;
  let aluno = null;
  
  if (alunoId) {
    const { data } = await supabaseDb.from('afic_alunos').select('*').eq('id', alunoId).limit(1);
    aluno = data?.[0];
  }

  const isEdit = !!aluno;
  const modal = document.createElement('div');
  modal.id = 'aluno-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h2>${isEdit ? 'Editar Aluno' : 'Novo Aluno'}</h2>
        <button class="btn-close" onclick="closeAlunoModal()">&times;</button>
      </div>
      <form id="aluno-form" onsubmit="saveAluno(event, '${alunoId || ''}')">
        <div class="form-grid">
          <div class="form-group">
            <label>Nome Completo</label>
            <input type="text" name="nome" value="${aluno?.nome || ''}" required>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" value="${aluno?.email || ''}" required>
          </div>
          <div class="form-group">
            <label>WhatsApp</label>
            <input type="text" name="whatsapp" value="${aluno?.whatsapp || ''}" placeholder="(11) 99999-9999">
          </div>
          <div class="form-group">
            <label>Plano</label>
            <select name="plano">
              <option value="nenhum" ${aluno?.plano === 'nenhum' ? 'selected' : ''}}>Nenhum</option>
              <option value="despertar" ${aluno?.plano === 'despertar' ? 'selected' : ''}}>Despertar</option>
              <option value="assinante" ${aluno?.plano === 'assinante' ? 'selected' : ''}}>Assinante</option>
              <option value="private" ${aluno?.plano === 'private' ? 'selected' : ''}}>Private</option>
              <option value="elite" ${aluno?.plano === 'elite' ? 'selected' : ''}}>Elite</option>
            </select>
          </div>
          <div class="form-group">
            <label>Status Pagamento</label>
            <select name="status_pagamento">
              <option value="pendente" ${aluno?.status_pagamento === 'pendente' ? 'selected' : ''}}>Pendente</option>
              <option value="ativo" ${aluno?.status_pagamento === 'ativo' ? 'selected' : ''}}>Ativo</option>
              <option value="inadimplente" ${aluno?.status_pagamento === 'inadimplente' ? 'selected' : ''}}>Inadimplente</option>
              <option value="cancelado" ${aluno?.status_pagamento === 'cancelado' ? 'selected' : ''}}>Cancelado</option>
            </select>
          </div>
          <div class="form-group">
            <label>Valor Pago (R$)</label>
            <input type="number" name="valor_pago" value="${aluno?.valor_pago || 0}" step="0.01">
          </div>
          <div class="form-group">
            <label>Data Início</label>
            <input type="date" name="data_inicio" value="${aluno?.data_inicio ? new Date(aluno.data_inicio).toISOString().split('T')[0] : ''}">
          </div>
          <div class="form-group full">
            <label>Notas</label>
            <textarea name="notas" rows="3">${aluno?.notas || ''}</textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="closeAlunoModal()">Cancelar</button>
          <button type="submit" class="btn-primary">${isEdit ? 'Salvar' : 'Criar'}</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
};

window.closeAlunoModal = function() {
  const modal = document.getElementById('aluno-modal');
  if (modal) modal.remove();
};

window.saveAluno = async function(e, alunoId) {
  e.preventDefault();
  const supabaseDb = window.supabaseApp || window.aficSupabase;
  if (!supabaseDb) {
    alert('Supabase não conectado');
    return;
  }

  const form = e.target;
  const formData = {
    nome: form.nome.value,
    email: form.email.value,
    whatsapp: form.whatsapp.value,
    plano: form.plano.value,
    status_pagamento: form.status_pagamento.value,
    valor_pago: parseFloat(form.valor_pago.value) || 0,
    data_inicio: form.data_inicio.value ? new Date(form.data_inicio.value).toISOString() : null,
    notas: form.notas.value,
    updated_at: new Date().toISOString()
  };

  try {
    if (alunoId) {
      const { error } = await supabaseDb.from('afic_alunos').update(formData).eq('id', alunoId);
      if (error) throw error;
      alert('Aluno atualizado!');
    } else {
      const { error } = await supabaseDb.from('afic_alunos').insert([formData]);
      if (error) throw error;
      alert('Aluno criado!');
    }
    closeAlunoModal();
    window.renderAlunosModule();
  } catch(err) {
    alert('Erro: ' + err.message);
  }
};

window.deleteAluno = async function(alunoId) {
  if (!confirm('Tem certeza que deseja excluir este aluno?')) return;
  
  const supabaseDb = window.supabaseApp || window.aficSupabase;
  if (!supabaseDb) return;

  try {
    const { error } = await supabaseDb.from('afic_alunos').delete().eq('id', alunoId);
    if (error) throw error;
    alert('Aluno excluído!');
    window.renderAlunosModule();
  } catch(err) {
    alert('Erro ao excluir: ' + err.message);
  }
};

window.switchAdminModule = function(module) {
  const links = document.querySelectorAll('.nav-module');
  links.forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.nav-module[data-module="${module}"]`);
  if (activeLink) activeLink.classList.add('active');
  
  const header = document.getElementById('admin-header-title');
  const exportBtn = document.getElementById('admin-export-btn');
  const moduleNames = {
    crm: 'Pipeline de Elegibilidade',
    alunos: 'Gestão de Alunos',
    telemetria: 'Telemetria e Engajamento',
    financeiro: 'Motor Financeiro',
    conteudo: 'Gestão de Conteúdo'
  };
  if (header) header.textContent = moduleNames[module] || 'Admin';
  
  const board = document.getElementById('kanban-board');
  
  if (module === 'alunos') {
    if (exportBtn) exportBtn.style.display = 'flex';
    exportBtn.onclick = () => {
      const rows = document.querySelectorAll('#alunos-tbody tr');
      let csv = 'Nome,Email,WhatsApp,Plano,Status,Valor,Data Início\n';
      rows.forEach(row => {
        if (row.style.display !== 'none') {
          const cols = row.querySelectorAll('td');
          csv += Array.from(cols).map(c => c.textContent).join(',') + '\n';
        }
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'alunos_' + new Date().toISOString().split('T')[0] + '.csv';
      a.click();
    };
    window.renderAlunosModule();
    window.updateAdminQuickStats();
  } else if (module === 'crm') {
    if (exportBtn) {
      exportBtn.style.display = 'flex';
      exportBtn.onclick = window.exportAssessmentExcel;
    }
    window.loadKanban();
    window.updateAdminQuickStats();
  } else if (module === 'telemetria') {
    if (exportBtn) exportBtn.style.display = 'none';
    window.renderTelemetriaModule();
    window.updateAdminQuickStats();
  } else if (module === 'financeiro') {
    if (exportBtn) exportBtn.style.display = 'flex';
    exportBtn.onclick = () => {
      window.exportFinanceiroCSV();
    };
    window.renderFinanceiroModule();
    window.updateAdminQuickStats();
  } else if (module === 'conteudo') {
    if (exportBtn) exportBtn.style.display = 'flex';
    exportBtn.onclick = () => {
      window.exportConteudoCSV();
    };
    window.renderConteudoModule();
    window.updateAdminQuickStats();
  } else {
    if (exportBtn) exportBtn.style.display = 'none';
    board.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #64748b; font-size: 16px;">Módulo "${moduleNames[module]}" em desenvolvimento</div>`;
  }
};

window.renderTelemetriaModule = async function() {
  const board = document.getElementById('kanban-board');
  if (!board) return;
  
  const supabaseDb = window.supabaseApp || window.aficSupabase;
  
  let alunosData = [];
  let progressData = [];
  let assessmentData = [];
  
  try {
    if (supabaseDb) {
      const { data: alunos } = await supabaseDb.from('afic_alunos').select('*');
      alunosData = alunos || [];
      
      const { data: progress } = await supabaseDb.from('academy_user_progress').select('*');
      progressData = progress || [];
      
      const { data: assessment } = await supabaseDb.from('afic_assessment_responses').select('*');
      assessmentData = assessment || [];
    }
  } catch(e) {
    console.log('Telemetria load error:', e);
  }
  
  const now = new Date();
  const dias = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dias.push(d.toISOString().split('T')[0]);
  }
  
  const ativos7dias = alunosData.filter(a => {
    if (!a.ultimo_acesso) return false;
    const acesso = new Date(a.ultimo_acesso);
    const diff = now - acesso;
    return diff < 7 * 24 * 60 * 60 * 1000;
  }).length;
  
  const ativos30dias = alunosData.filter(a => {
    if (!a.ultimo_acesso) return false;
    const acesso = new Date(a.ultimo_acesso);
    return now - acesso < 30 * 24 * 60 * 60 * 1000;
  }).length;
  
  const cursosIniciados = progressData.length;
  const cursosConcluidos = progressData.filter(p => p.is_completed).length;
  
  const html = `
    <div class="telemetria-grid">
      <div class="tele-card">
        <div class="tele-icon">👥</div>
        <div class="tele-content">
          <span class="tele-number">${alunosData.length}</span>
          <span class="tele-label">Total Cadastrados</span>
        </div>
      </div>
      <div class="tele-card">
        <div class="tele-icon">✅</div>
        <div class="tele-content">
          <span class="tele-number">${alunosData.filter(a => a.status_pagamento === 'ativo').length}</span>
          <span class="tele-label">Ativos</span>
        </div>
      </div>
      <div class="tele-card">
        <div class="tele-icon">🔥</div>
        <div class="tele-content">
          <span class="tele-number">${ativos7dias}</span>
          <span class="tele-label">Ativos 7 dias</span>
        </div>
      </div>
      <div class="tele-card">
        <div class="tele-icon">📚</div>
        <div class="tele-content">
          <span class="tele-number">${cursosConcluidos}</span>
          <span class="tele-label">Aulas Concluídas</span>
        </div>
      </div>
      <div class="tele-card">
        <div class="tele-icon">📝</div>
        <div class="tele-content">
          <span class="tele-number">${assessmentData.length}</span>
          <span class="tele-label">Avaliações</span>
        </div>
      </div>
      <div class="tele-card">
        <div class="tele-icon">⚠️</div>
        <div class="tele-content">
          <span class="tele-number">${alunosData.filter(a => a.status_pagamento === 'inadimplente').length}</span>
          <span class="tele-label">Inadimplentes</span>
        </div>
      </div>
    </div>
    
    <div class="tele-section">
      <h3 class="tele-title">Distribuição por Plano</h3>
      <div class="tele-chart">
        ${[
          { label: 'Nenhum', count: alunosData.filter(a => !a.plano || a.plano === 'nenhum').length, color: '#94a3b8' },
          { label: 'Despertar', count: alunosData.filter(a => a.plano === 'despertar').length, color: '#3b82f6' },
          { label: 'Assinante', count: alunosData.filter(a => a.plano === 'assinante').length, color: '#8b5cf6' },
          { label: 'Private', count: alunosData.filter(a => a.plano === 'private').length, color: '#22c55e' },
          { label: 'Elite', count: alunosData.filter(a => a.plano === 'elite').length, color: '#D4AF37' }
        ].map(item => `
          <div class="chart-row">
            <span class="chart-label" style="color: ${item.color}">${item.label}</span>
            <div class="chart-bar-container">
              <div class="chart-bar" style="width: ${alunosData.length ? (item.count / alunosData.length * 100) : 0}%; background: ${item.color}"></div>
            </div>
            <span class="chart-value">${item.count}</span>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="tele-section">
      <h3 class="tele-title">Status de Pagamento</h3>
      <div class="tele-chart">
        ${[
          { label: 'Ativo', count: alunosData.filter(a => a.status_pagamento === 'ativo').length, color: '#22c55e' },
          { label: 'Pendente', count: alunosData.filter(a => a.status_pagamento === 'pendente').length, color: '#fbbf24' },
          { label: 'Inadimplente', count: alunosData.filter(a => a.status_pagamento === 'inadimplente').length, color: '#ef4444' },
          { label: 'Cancelado', count: alunosData.filter(a => a.status_pagamento === 'cancelado').length, color: '#94a3b8' }
        ].map(item => `
          <div class="chart-row">
            <span class="chart-label" style="color: ${item.color}">${item.label}</span>
            <div class="chart-bar-container">
              <div class="chart-bar" style="width: ${alunosData.length ? (item.count / alunosData.length * 100) : 0}%; background: ${item.color}"></div>
            </div>
            <span class="chart-value">${item.count}</span>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="tele-section">
      <h3 class="tele-title">Últimos Acessos</h3>
      <table class="tele-table">
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Último Acesso</th>
            <th>Plano</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${alunosData.filter(a => a.ultimo_acesso).sort((a, b) => new Date(b.ultimo_acesso) - new Date(a.ultimo_acesso)).slice(0, 10).map(a => `
            <tr>
              <td>${a.nome || a.email}</td>
              <td>${new Date(a.ultimo_acesso).toLocaleDateString('pt-BR')}</td>
              <td><span class="badge plano-${a.plano || 'nenhum'}">${a.plano || 'nenhum'}</span></td>
              <td><span class="badge status-${a.status_pagamento}">${a.status_pagamento}</span></td>
            </tr>
          `).join('') || '<tr><td colspan="4">Nenhum acesso registrado</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
  
  board.innerHTML = html;
};

window.renderFinanceiroModule = async function() {
  const board = document.getElementById('kanban-board');
  if (!board) return;
  
  const supabaseDb = window.supabaseApp || window.aficSupabase;
  
  let alunosData = [];
  let budgetData = [];
  
  try {
    if (supabaseDb) {
      const { data: alunos } = await supabaseDb.from('afic_alunos').select('*');
      alunosData = alunos || [];
      
      const { data: budget } = await supabaseDb.from('budget_transactions').select('*');
      budgetData = budget || [];
    }
  } catch(e) {
    console.log('Financeiro load error:', e);
  }
  
  const receitaMensal = alunosData
    .filter(a => a.status_pagamento === 'ativo')
    .reduce((sum, a) => sum + (parseFloat(a.valor_pago) || 0), 0);
  
  const receitaPendentes = alunosData
    .filter(a => a.status_pagamento === 'pendente')
    .reduce((sum, a) => sum + (parseFloat(a.valor_pago) || 0), 0);
  
  const receitaInadimplente = alunosData
    .filter(a => a.status_pagamento === 'inadimplente')
    .reduce((sum, a) => sum + (parseFloat(a.valor_pago) || 0), 0);
  
  const receitaTotalGeral = alunosData.reduce((sum, a) => sum + (parseFloat(a.valor_pago) || 0), 0);
  
  const meses = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    meses.push({
      nome: d.toLocaleDateString('pt-BR', { month: 'short' }),
      ano: d.getFullYear(),
      mes: d.getMonth() + 1
    });
  }
  
  window.financeiroData = { alunosData, budgetData, meses };
  
  const html = `
    <div class="financeiro-grid">
      <div class="financeiro-card receita">
        <div class="fin-header">
          <span class="fin-icon">💰</span>
          <span class="fin-title">Receita Mensal</span>
        </div>
        <span class="fin-value">R$ ${receitaMensal.toLocaleString('pt-BR')}</span>
        <span class="fin-subtitle">ativos: ${alunosData.filter(a => a.status_pagamento === 'ativo').length} alunos</span>
      </div>
      
      <div class="financeiro-card pendente">
        <div class="fin-header">
          <span class="fin-icon">⏳</span>
          <span class="fin-title">Pendente</span>
        </div>
        <span class="fin-value">R$ ${receitaPendentes.toLocaleString('pt-BR')}</span>
        <span class="fin-subtitle">${alunosData.filter(a => a.status_pagamento === 'pendente').length} aguardando</span>
      </div>
      
      <div class="financeiro-card advertencia">
        <div class="fin-header">
          <span class="fin-icon">⚠️</span>
          <span class="fin-title">Inadimplência</span>
        </div>
        <span class="fin-value">R$ ${receitaInadimplente.toLocaleString('pt-BR')}</span>
        <span class="fin-subtitle">${alunosData.filter(a => a.status_pagamento === 'inadimplente').length} devedores</span>
      </div>
      
      <div class="financeiro-card total">
        <div class="fin-header">
          <span class="fin-icon">📊</span>
          <span class="fin-title">Receita Total</span>
        </div>
        <span class="fin-value">R$ ${receitaTotalGeral.toLocaleString('pt-BR')}</span>
        <span class="fin-subtitle">desde o início</span>
      </div>
    </div>
    
    <div class="financeiro-section">
      <h3 class="fin-section-title">Receita por Plano</h3>
      <div class="fin-chart">
        ${[
          { label: 'Elite', value: alunosData.filter(a => a.plano === 'elite').reduce((s, a) => s + (parseFloat(a.valor_pago) || 0), 0), color: '#D4AF37' },
          { label: 'Private', value: alunosData.filter(a => a.plano === 'private').reduce((s, a) => s + (parseFloat(a.valor_pago) || 0), 0), color: '#22c55e' },
          { label: 'Assinante', value: alunosData.filter(a => a.plano === 'assinante').reduce((s, a) => s + (parseFloat(a.valor_pago) || 0), 0), color: '#8b5cf6' },
          { label: 'Despertar', value: alunosData.filter(a => a.plano === 'despertar').reduce((s, a) => s + (parseFloat(a.valor_pago) || 0), 0), color: '#3b82f6' },
          { label: 'Outros', value: alunosData.filter(a => !a.plano || a.plano === 'nenhum').reduce((s, a) => s + (parseFloat(a.valor_pago) || 0), 0), color: '#94a3b8' }
        ].map(item => `
          <div class="fin-row">
            <span class="fin-label" style="color: ${item.color}">${item.label}</span>
            <div class="fin-bar-container">
              <div class="fin-bar" style="width: ${receitaTotalGeral ? (item.value / receitaTotalGeral * 100) : 0}%; background: ${item.color}"></div>
            </div>
            <span class="fin-value-text">R$ ${item.value.toLocaleString('pt-BR')}</span>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="financeiro-section">
      <h3 class="fin-section-title">Alunos por Plano (Qtd)</h3>
      <div class="fin-chart">
        ${[
          { label: 'Elite', count: alunosData.filter(a => a.plano === 'elite').length, color: '#D4AF37' },
          { label: 'Private', count: alunosData.filter(a => a.plano === 'private').length, color: '#22c55e' },
          { label: 'Assinante', count: alunosData.filter(a => a.plano === 'assinante').length, color: '#8b5cf6' },
          { label: 'Despertar', count: alunosData.filter(a => a.plano === 'despertar').length, color: '#3b82f6' },
          { label: 'Outros', count: alunosData.filter(a => !a.plano || a.plano === 'nenhum').length, color: '#94a3b8' }
        ].map(item => `
          <div class="fin-row">
            <span class="fin-label" style="color: ${item.color}">${item.label}</span>
            <div class="fin-bar-container">
              <div class="fin-bar" style="width: ${alunosData.length ? (item.count / alunosData.length * 100) : 0}%; background: ${item.color}"></div>
            </div>
            <span class="fin-value-text">${item.count}</span>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="financeiro-section">
      <h3 class="fin-section-title">Lista de Alunos Ativos</h3>
      <table class="fin-table">
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Plano</th>
            <th>Valor Mensal</th>
            <th>Data Início</th>
            <th>Próxima Renovação</th>
          </tr>
        </thead>
        <tbody>
          ${alunosData.filter(a => a.status_pagamento === 'ativo').map(a => `
            <tr>
              <td>${a.nome || a.email}</td>
              <td><span class="badge plano-${a.plano || 'nenhum'}">${a.plano || '-'}</span></td>
              <td>R$ ${(parseFloat(a.valor_pago) || 0).toLocaleString('pt-BR')}</td>
              <td>${a.data_inicio ? new Date(a.data_inicio).toLocaleDateString('pt-BR') : '-'}</td>
              <td>${a.data_renovacao ? new Date(a.data_renovacao).toLocaleDateString('pt-BR') : '-'}</td>
            </tr>
          `).join('') || '<tr><td colspan="5">Nenhum ativo</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
  
  board.innerHTML = html;
};

window.exportFinanceiroCSV = function() {
  if (!window.financeiroData) return;
  const { alunosData } = window.financeiroData;
  let csv = 'Nome,Email,Plano,Status,Valor,Data Início,Data Renovação,Último Acesso\n';
  alunosData.forEach(a => {
    csv += `${a.nome || ''},${a.email || ''},${a.plano || ''},${a.status_pagamento || ''},${a.valor_pago || 0},${a.data_inicio || ''},${a.data_renovacao || ''},${a.ultimo_acesso || ''}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'financeiro_' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
};

window.renderConteudoModule = async function() {
  const board = document.getElementById('kanban-board');
  if (!board) return;
  
  const supabaseDb = window.supabaseApp || window.aficSupabase;
  
  let modules = [];
  let lessons = [];
  let topics = [];
  let comments = [];
  
  try {
    if (supabaseDb) {
      const { data: mods } = await supabaseDb.from('academy_modules').select('*').order('created_at', { ascending: true });
      modules = mods || [];
      
      const { data: less } = await supabaseDb.from('academy_lessons').select('*').order('created_at', { ascending: true });
      lessons = less || [];
      
      const { data: top } = await supabaseDb.from('community_topics').select('*').order('created_at', { ascending: false });
      topics = top || [];
      
      const { data: comm } = await supabaseDb.from('community_comments').select('*').order('created_at', { ascending: false });
      comments = comm || [];
    }
  } catch(e) {
    console.log('Conteudo load error:', e);
  }
  
  window.conteudoData = { modules, lessons, topics, comments };
  
  const totalAulas = lessons.length;
  const totalVideos = lessons.filter(l => l.video_url && l.video_url.length > 5).length;
  const totalPDFs = lessons.filter(l => l.pdf_url && l.pdf_url.length > 5).length;
  const totalTopicos = topics.length;
  const totalComentarios = comments.length;
  
  const html = `
    <div class="conteudo-grid">
      <div class="conteudo-card">
        <span class="conteudo-icon">📚</span>
        <div class="conteudo-info">
          <span class="conteudo-number">${modules.length}</span>
          <span class="conteudo-label">Módulos</span>
        </div>
      </div>
      <div class="conteudo-card">
        <span class="conteudo-icon">🎬</span>
        <div class="conteudo-info">
          <span class="conteudo-number">${totalAulas}</span>
          <span class="conteudo-label">Total Aulas</span>
        </div>
      </div>
      <div class="conteudo-card">
        <span class="conteudo-icon">📹</span>
        <div class="conteudo-info">
          <span class="conteudo-number">${totalVideos}</span>
          <span class="conteudo-label">Com Vídeo</span>
        </div>
      </div>
      <div class="conteudo-card">
        <span class="conteudo-icon">📄</span>
        <div class="conteudo-info">
          <span class="contaudo-number">${totalPDFs}</span>
          <span class="conteudo-label">Com Material</span>
        </div>
      </div>
      <div class="conteudo-card">
        <span class="conteudo-icon">💬</span>
        <div class="conteudo-info">
          <span class="conteudo-number">${totalTopicos}</span>
          <span class="conteudo-label">Tópicos Fórum</span>
        </div>
      </div>
      <div class="conteudo-card">
        <span class="conteudo-icon">💭</span>
        <div class="conteudo-info">
          <span class="conteudo-number">${totalComentarios}</span>
          <span class="conteudo-label">Comentários</span>
        </div>
      </div>
    </div>
    
    <div class="conteudo-section">
      <h3 class="conteudo-title">Estrutura dos Módulos</h3>
      <div class="modulos-list">
        ${modules.length === 0 ? '<p style="color: #64748b; text-align: center; padding: 20px;">Nenhum módulo cadastrado</p>' : modules.map((mod, idx) => {
          const modLessons = lessons.filter(l => l.module_id === mod.id);
          return `
            <div class="modulo-item">
              <div class="modulo-header">
                <span class="modulo-num">${idx + 1}</span>
                <span class="modulo-name">${mod.title}</span>
                <span class="modulo-meta">${modLessons.length} aulas</span>
              </div>
              <div class="modulo-lessons">
                ${modLessons.map(l => `
                  <div class="lesson-chip">
                    <span class="lesson-icon">${l.video_url ? '📹' : '📄'}</span>
                    <span class="lesson-title">${l.title}</span>
                    <span class="lesson-duration">${l.duration || '-'}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    
    <div class="conteudo-section">
      <h3 class="conteudo-title">Últimos Tópicos do Fórum</h3>
      <table class="conteudo-table">
        <thead>
          <tr>
            <th>Tópico</th>
            <th>Autor</th>
            <th>Comentários</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          ${topics.length === 0 ? '<tr><td colspan="4">Nenhum tópico</td></tr>' : topics.slice(0, 10).map(t => {
            const topComments = comments.filter(c => c.topic_id === t.id).length;
            return `
              <tr>
                <td><strong>${t.title}</strong></td>
                <td>${t.author_name || '-'}</td>
                <td>${topComments}</td>
                <td>${new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="conteudo-actions">
      <button class="btn-action" onclick="alert('Funcionalidade em desenvolvimento')">+ Novo Módulo</button>
      <button class="btn-action" onclick="alert('Funcionalidade em desenvolvimento')">+ Nova Aula</button>
      <button class="btn-action secondary" onclick="alert('Funcionalidade em desenvolvimento')">Gerenciar Fórum</button>
    </div>
  `;
  
  board.innerHTML = html;
};

window.exportConteudoCSV = function() {
  if (!window.conteudoData) return;
  const { modules, lessons } = window.conteudoData;
  let csv = 'Módulo,Aula,Duração,URL Vídeo,URL PDF\n';
  modules.forEach(mod => {
    const modLessons = lessons.filter(l => l.module_id === mod.id);
    modLessons.forEach(l => {
      csv += `${mod.title},${l.title},${l.duration || ''},${l.video_url || ''},${l.pdf_url || ''}\n`;
    });
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'conteudo_' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
};

window.updateAdminQuickStats = async function() {
  const supabaseDb = window.supabaseApp || window.aficSupabase;
  const container = document.getElementById('admin-quick-stats');
  if (!container) return;
  
  let alunos = 0, assessment = 0, modules = 0, progress = 0, topics = 0;
  
  try {
    if (supabaseDb) {
      const { data: a } = await supabaseDb.from('afic_alunos').select('id');
      alunos = a?.length || 0;
      
      const { data: assess } = await supabaseDb.from('afic_assessment_responses').select('id');
      assessment = assess?.length || 0;
      
      const { data: mods } = await supabaseDb.from('academy_modules').select('id');
      modules = mods?.length || 0;
      
      const { data: prog } = await supabaseDb.from('academy_user_progress').select('id');
      progress = prog?.length || 0;
      
      const { data: tpc } = await supabaseDb.from('community_topics').select('id');
      topics = tpc?.length || 0;
    }
  } catch(e) {}
  
  const badgeAlunos = document.getElementById('badge-alunos');
  if (badgeAlunos) badgeAlunos.textContent = alunos;
  
  container.innerHTML = `
    <div class="quick-stat">
      <div class="quick-stat-icon blue">👥</div>
      <div>
        <div class="quick-stat-value">${alunos}</div>
        <div class="quick-stat-label">Alunos</div>
      </div>
    </div>
    <div class="quick-stat">
      <div class="quick-stat-icon green">✅</div>
      <div>
        <div class="quick-stat-value">${assessment}</div>
        <div class="quick-stat-label">Avaliações</div>
      </div>
    </div>
    <div class="quick-stat">
      <div class="quick-stat-icon yellow">📚</div>
      <div>
        <div class="quick-stat-value">${modules}</div>
        <div class="quick-stat-label">Módulos</div>
      </div>
    </div>
    <div class="quick-stat">
      <div class="quick-stat-icon purple">📖</div>
      <div>
        <div class="quick-stat-value">${progress}</div>
        <div class="quick-stat-label">Progresso</div>
      </div>
    </div>
    <div class="quick-stat">
      <div class="quick-stat-icon red">💬</div>
      <div>
        <div class="quick-stat-value">${topics}</div>
        <div class="quick-stat-label">Tópicos</div>
      </div>
    </div>
  `;
};

window.signOut = async function() {
  if (confirm('Deseja sair?')) {
    const supabaseDb = window.supabaseApp || window.aficSupabase;
    if (supabaseDb) await supabaseDb.auth.signOut();
    window.location.reload();
  }
};


