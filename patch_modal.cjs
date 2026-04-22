const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

const updatedModalLogic = `
  const questions = [
    { q: 'Renda Atual', a: r.renda_atual || '-' },
    { q: 'Renda Pretendida', a: r.renda_sonho || '-' },
    { q: 'O que faz com o dinheiro?', a: getAnswer('dinheiro1', r.dinheiro1) },
    { q: 'Emergência financeira?', a: getAnswer('emergencia', r.emergencia) },
    { q: 'O que trava o crescimento?', a: getAnswer('trava', r.trava) },
    { q: 'Uso do cartão?', a: getAnswer('cartao', r.cartao) },
    { q: 'Paciência para resultados?', a: getAnswer('paciencia', r.paciencia) },
    { q: 'Sucesso financeiro?', a: getAnswer('sucesso', r.sucesso) },
    { q: 'Corte de luxos?', a: getAnswer('corte', r.corte) },
    { q: 'Tempo disponível?', a: getAnswer('tempo', r.tempo) }
  ];
`;

const startIndex = content.indexOf('const questions = [');
const endIndex = content.indexOf('];', startIndex) + 2;

if (startIndex !== -1 && endIndex !== -1) {
    const newContent = content.substring(0, startIndex) + updatedModalLogic + content.substring(endIndex);
    fs.writeFileSync('app.js', newContent, 'utf8');
    console.log('App.js Modal updated successfully');
} else {
    console.error('Could not find questions array');
}
