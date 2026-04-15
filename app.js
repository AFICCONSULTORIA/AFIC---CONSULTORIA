/* ═══════════════════════════════════════════════════════════════
   AFIC CONSULTORIA — Application Logic
   ═══════════════════════════════════════════════════════════════ */

// Função de inicialização chamada após DOM estar pronto
window.initApp = function() {
  console.log("AFIC App Initializing...");
  
  try {
    // ─── SUPABASE INITIALIZATION ───
    const supabase = window.aficSupabase;
    let currentUser = null;
    let currentUserProfile = null;

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
                switchPage('dashboard');
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                const dashLink = document.querySelector('.nav-link[data-page="dashboard"]');
                if (dashLink) dashLink.classList.add('active');
            } else {
                switchPage('dashboard');
                // Mostrar modal de login quando não logado
                if (authModal) {
                    authModal.classList.remove('hidden');
                    authModal.style.display = 'flex';
                }
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
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page-content');
    
    // Page map: data-page value → page element ID
    const pageMap = {
        'home': 'page-home',
        'dashboard': 'page-dashboard',
        'tools': 'page-tools',
        'education': 'page-education',
        'community': 'page-community',
        'account': 'page-account',
        'plans': 'page-plans'
    };

    function switchPage(pageName) {
        try {
            const pages = document.querySelectorAll('.page-content');
            // Hide all pages
            pages.forEach(p => p.classList.add('page-hidden'));
            
            // Show target page
            const targetId = pageMap[pageName];
            if (targetId) {
                const targetPage = document.getElementById(targetId);
                if (targetPage) {
                    targetPage.classList.remove('page-hidden');
                    // Re-trigger animations
                    targetPage.style.animation = 'none';
                    targetPage.offsetHeight; // force reflow
                    targetPage.style.animation = '';
                }
            }

            // If switching to tools, auto-calculate 
            if (pageName === 'tools') {
                setTimeout(() => {
                    try { calculateCompound(); } catch(e) { console.error('Calc error:', e); }
                }, 100);
            }
            
            console.log('Switched to page:', pageName);
        } catch(err) {
            console.error('switchPage error:', err);
        }
    }
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const page = link.getAttribute('data-page');
            switchPage(page);
        });
    });

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
        const { data, error } = await supabase
            .from('profiles')
            .select('nickname')
            .eq('id', currentUser.id)
            .single();
        
        if (!error && data) {
            currentUserProfile = data;
            const nicknameInput = document.getElementById('user-nickname');
            if (nicknameInput) nicknameInput.value = data.nickname || '';
            
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

  } catch(err) {
    console.error('AFIC INIT ERROR:', err);
  }
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initApp);
} else {
  window.initApp();
}
