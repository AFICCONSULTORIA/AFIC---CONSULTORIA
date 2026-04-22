const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

const updatedKanbanLogic = `
window.allKanbanData = [];

window.renderKanban = function(data) {
  const board = document.getElementById('kanban-board');
  if (!board) return;

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
    return \`
      <div class="kanban-column">
        <div class="column-header">
          <span class="column-title">\${col.title}</span>
          <span class="column-count">\${cards.length}</span>
        </div>
        <div class="kanban-cards">
          \${cards.map(r => \`
            <div class="candidate-card" onclick="openCandidate('\${r.id}')" style="cursor: pointer;">
              <div class="candidate-name" style="font-weight: 700; color: #fff; margin-bottom: 4px;">\${r.nome || '-'}</div>
              <div class="candidate-contact" style="font-size: 11px; color: #94a3b8; line-height: 1.4;">\${r.email || '-'}<br>\${r.whatsapp || '-'}</div>
              
              <div class="candidate-income-display" style="margin: 8px 0; padding: 6px; background: rgba(212,175,55,0.05); border: 1px solid rgba(212,175,55,0.1); border-radius: 6px;">
                <div style="font-size: 10px; color: #D4AF37; display: flex; justify-content: space-between;">
                  <span>Renda: <strong>\${r.renda_atual || '-'}</strong></span>
                  <span>Sonho: <strong>\${r.renda_sonho || '-'}</strong></span>
                </div>
              </div>

              <div class="candidate-tags" style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;">
                \${getFlags(r).map(f => \`<span class="tag \${f.type}" style="font-size: 9px; padding: 2px 6px; border-radius: 4px; background: \${f.type === 'green' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}; color: \${f.type === 'green' ? '#4ade80' : '#f87171'};">\${f.label}</span>\`).join('')}
              </div>
              <div class="candidate-notes" style="margin-top: 10px; font-size: 11px; color: #64748b; display: flex; align-items: center; gap: 4px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                Ver detalhes
              </div>
            </div>
          \`).join('')}
        </div>
      </div>
    \`;
  }).join('');
};

window.filterKanban = function() {
    const search = document.getElementById('filter-kanban-search')?.value.toLowerCase() || '';
    const filtered = window.allKanbanData.filter(r => {
        return (r.nome?.toLowerCase().includes(search) || r.email?.toLowerCase().includes(search) || r.whatsapp?.includes(search));
    });
    window.renderKanban(filtered);
};

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
    
    window.allKanbanData = data || [];
    window.renderKanban(window.allKanbanData);
    window.kanbanData = data;

    // Listeners de filtro
    const searchInput = document.getElementById('filter-kanban-search');
    if (searchInput && !searchInput.dataset.listening) {
        searchInput.addEventListener('input', window.filterKanban);
        searchInput.dataset.listening = 'true';
    }
    
  } catch(err) {
    board.innerHTML = '<p style="color: #ef4444; padding: 20px;">Erro ao carregar: ' + err.message + '</p>';
  }
};
`;

const startIndex = content.indexOf('window.loadKanban = async function()');
const endIndex = content.indexOf('window.openCandidate = function(id)');

if (startIndex !== -1 && endIndex !== -1) {
    const newContent = content.substring(0, startIndex) + updatedKanbanLogic + '\n\n' + content.substring(endIndex);
    fs.writeFileSync('app.js', newContent, 'utf8');
    console.log('App.js Kanban updated successfully');
} else {
    console.error('Could not find loadKanban or openCandidate functions');
}
