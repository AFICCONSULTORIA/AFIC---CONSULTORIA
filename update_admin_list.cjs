const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

const updatedLoadLogic = `
window.allAnalisePerfilResponses = []; // Cache local para filtros

window.renderAnalisePerfilList = function(data) {
    const container = document.getElementById('analise-perfil-responses-list');
    if (!container) return;
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p>Nenhuma resposta encontrada.</p>';
        return;
    }

    container.innerHTML = data.map(r => \`
      <div class="analise-perfil-card" data-id="\${r.id}" style="margin-bottom: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; transition: all 0.2s;">
        <div class="analise-perfil-header" style="padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; background: rgba(5, 24, 69, 0.2);">
          <div>
            <strong class="analise-perfil-nome" style="color: #fff; display: block; font-size: 16px;">\${r.nome || '-'}</strong>
            <span class="analise-perfil-email" style="color: #94a3b8; font-size: 13px;">\${r.email || '-'}</span>
          </div>
          <div class="analise-perfil-actions" style="display: flex; align-items: center; gap: 12px;">
            <button class="btn-analysis" data-id="\${r.id}" style="background: #D4AF37; color: #000; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">Análise Completa</button>
            <select class="status-select" data-id="\${r.id}" style="background: rgba(0,0,0,0.3); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 7px 10px; border-radius: 6px; font-size: 13px;">
              <option value="novo" \${r.status === 'novo' ? 'selected' : ''}>Pendente</option>
              <option value="aprovado" \${r.status === 'aprovado' ? 'selected' : ''}>Aprovado</option>
              <option value="rejeitado" \${r.status === 'rejeitado' ? 'selected' : ''}>Rejeitado</option>
            </select>
          </div>
        </div>
        <div class="analise-perfil-grid" style="padding: 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
          <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border-left: 3px solid #D4AF37;">
            <span class="analise-perfil-label" style="display: block; color: #94a3b8; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">Renda Atual</span>
            <span style="color: #fff; font-weight: 600; font-size: 15px;">\${r.renda_atual || 'Não inf.'}</span>
          </div>
          <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border-left: 3px solid #22c55e;">
            <span class="analise-perfil-label" style="display: block; color: #94a3b8; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">Renda Sonho</span>
            <span style="color: #fff; font-weight: 600; font-size: 15px;">\${r.renda_sonho || 'Não inf.'}</span>
          </div>
          <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px;">
            <span class="analise-perfil-label" style="display: block; color: #94a3b8; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">WhatsApp</span>
            <span style="color: #fff; font-size: 14px;">\${r.whatsapp || '-'}</span>
          </div>
        </div>
        <div style="padding: 8px 16px; background: rgba(0,0,0,0.1); display: flex; justify-content: flex-end;">
            <span class="analise-perfil-date" style="color: #64748b; font-size: 11px;">Enviado em \${r.created_at ? new Date(r.created_at).toLocaleString('pt-BR') : ''}</span>
        </div>
      </div>
    \`).join('');

    // Reatachar listeners
    container.querySelectorAll('.btn-analysis').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const item = data.find(d => d.id === id);
        if (item) showAnalisePerfilDetail(item);
      });
    });
    
    container.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        const newStatus = e.target.value;
        const supabaseDb = window.supabaseApp || window.aficSupabase;
        const { error } = await supabaseDb.from('afic_analise_perfil_responses').update({ status: newStatus }).eq('id', id);
        if (error) alert('Erro ao atualizar: ' + error.message);
      });
    });
};

window.filterAnalisePerfilList = function() {
    const search = document.getElementById('filter-analise-perfil-search')?.value.toLowerCase() || '';
    const status = document.getElementById('filter-analise-perfil-status')?.value || 'all';

    const filtered = window.allAnalisePerfilResponses.filter(r => {
        const matchesSearch = (r.nome?.toLowerCase().includes(search) || r.email?.toLowerCase().includes(search));
        const matchesStatus = (status === 'all' || r.status === status);
        return matchesSearch && matchesStatus;
    });

    window.renderAnalisePerfilList(filtered);
};

window.loadAnalisePerfilResponses = async function() {
  const container = document.getElementById('analise-perfil-responses-list');
  if (!container) return;
  
  const supabaseDb = window.supabaseApp || window.aficSupabase;
  if (!supabaseDb) {
    container.innerHTML = '<p style="color: red;">Supabase não conectado</p>';
    return;
  }
  
  try {
    const { data, error } = await supabaseDb.from('afic_analise_perfil_responses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    window.allAnalisePerfilResponses = data || [];
    window.renderAnalisePerfilList(window.allAnalisePerfilResponses);
    
    // Listeners de filtro (apenas uma vez)
    const searchInput = document.getElementById('filter-analise-perfil-search');
    const statusSelect = document.getElementById('filter-analise-perfil-status');
    
    if (searchInput && !searchInput.dataset.listening) {
        searchInput.addEventListener('input', window.filterAnalisePerfilList);
        searchInput.dataset.listening = 'true';
    }
    if (statusSelect && !statusSelect.dataset.listening) {
        statusSelect.addEventListener('change', window.filterAnalisePerfilList);
        statusSelect.dataset.listening = 'true';
    }
    
  } catch(err) {
    container.innerHTML = '<p style="color: red;">Erro ao carregar: ' + err.message + '</p>';
  }
};
`;

const startTag = 'window.loadAnalisePerfilResponses = async function() {';
const endTag = '/* ═══════════════════════════════════════════════════════════════\n   ADMIN DASHBOARD - KANBAN FUNCTIONS';

const startIndex = content.indexOf(startTag);
const endIndex = content.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1) {
    const newContent = content.substring(0, startIndex) + updatedLoadLogic + '\n\n' + content.substring(endIndex);
    fs.writeFileSync('app.js', newContent, 'utf8');
    console.log('App.js admin list updated with filters and income display');
} else {
    console.error('Could not find tags for replacement');
}
