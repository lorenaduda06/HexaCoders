// ------------------------------------------------------------
//  BeautyFlow — lógica principal
// ------------------------------------------------------------

// ------------------------------------------------------------
//  DADOS (simulam um banco local via localStorage)
// ------------------------------------------------------------
function carregar(chave, padrao) {
  try { return JSON.parse(localStorage.getItem(chave)) || padrao; } catch { return padrao; }
}
function salvar(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}

let agendamentos = carregar('bf_agendamentos', []);
let clientes     = carregar('bf_clientes', [
  { id: 1, nome: 'Ana Paula Silva',   telefone: '(43) 99123-4567' },
  { id: 2, nome: 'Maria Helena Costa', telefone: '(43) 98765-4321' },
  { id: 3, nome: 'Juliana Ferreira',  telefone: '(43) 99333-1122' }
]);
let servicos = carregar('bf_servicos', [
  { id: 1, nome: 'Limpeza de Pele',      valor: 150, retorno: 30, icone: '🧖' },
  { id: 2, nome: 'Design de Sobrancelha', valor: 50,  retorno: 20, icone: '✨' },
  { id: 3, nome: 'Peeling Químico',       valor: 220, retorno: 45, icone: '💎' },
  { id: 4, nome: 'Hidratação Facial',     valor: 120, retorno: 30, icone: '💆' }
]);
let compras = carregar('bf_compras', []);

// ------------------------------------------------------------
//  NAVEGAÇÃO ENTRE TELAS
// ------------------------------------------------------------
function irParaTela(nome, el) {
  document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('ativo'));

  const tela = document.getElementById('tela-' + nome);
  if (tela) tela.classList.add('ativa');
  if (el)   el.classList.add('ativo');

  // inicializa cada tela ao abrir
  if (nome === 'agenda')   iniciarAgenda();
  if (nome === 'clientes') renderizarClientes();
  if (nome === 'servicos') renderizarServicos();
  if (nome === 'consumo')  iniciarConsumo();
  if (nome === 'retorno')  renderizarRetorno();
}

// ------------------------------------------------------------
//  MODAIS
// ------------------------------------------------------------
function abrirModal(id) {
  const el = document.getElementById('modal-' + id);
  if (el) el.style.display = 'flex';
}

function fecharModais() {
  document.querySelectorAll('.fundo-modal').forEach(m => m.style.display = 'none');
  agIdEditando = null;
}

function fecharJanela(event) {
  if (event.target.classList.contains('fundo-modal')) fecharModais();
}

// ------------------------------------------------------------
//  AGENDA
// ------------------------------------------------------------
let dataAtual = new Date();
dataAtual.setHours(0, 0, 0, 0);

function iniciarAgenda() {
  renderizarDataNav();
  renderizarGrade();
}

function renderizarDataNav() {
  const opts = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
  const str  = dataAtual.toLocaleDateString('pt-BR', opts);
  document.getElementById('lb-data-nav').textContent   = dataAtual.toLocaleDateString('pt-BR');
  document.getElementById('subtitulo-data').textContent = str.charAt(0).toUpperCase() + str.slice(1);
}

function alternarData(delta) {
  dataAtual.setDate(dataAtual.getDate() + delta);
  renderizarDataNav();
  renderizarGrade();
}

function agendarHoje() {
  dataAtual = new Date();
  dataAtual.setHours(0, 0, 0, 0);
  renderizarDataNav();
  renderizarGrade();
}

const HORAS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'];

function renderizarGrade() {
  const chave = dataAtual.toISOString().slice(0, 10);
  const dodia = agendamentos.filter(a => a.data === chave);

  // coluna de horas
  const colH = document.getElementById('col-horas');
  colH.innerHTML = HORAS.map(h =>
    `<div class="hora-slot">${h}</div>`
  ).join('');

  // coluna de agendamentos
  const colA = document.getElementById('col-agendamentos');
  colA.innerHTML = HORAS.map(h => {
    const ag = dodia.find(a => a.hora === h);
    if (!ag) return `<div class="slot-vazio"></div>`;

    const cor = ag.status === 'realizado' ? 'card-ag-verde'
              : ag.status === 'cancelado'  ? 'card-ag-vermelho'
              : 'card-ag-rosa';

    return `<div class="card-agendamento ${cor}" onclick="abrirDetalhe(${ag.id})">
              <strong>${ag.cliente}</strong>
              <span>${ag.servico}</span>
              <span class="tag-status">${ag.status}</span>
            </div>`;
  }).join('');

  // cards de resumo
  const total     = dodia.length;
  const realizados = dodia.filter(a => a.status === 'realizado').length;
  const cancelados = dodia.filter(a => a.status === 'cancelado').length;
  const pendentes  = dodia.filter(a => a.status === 'agendado').length;

  document.getElementById('cards-resumo').innerHTML = `
    <div class="card-resumo-dia"><div class="num-card-resumo">${total}</div><div class="lb-card-resumo">Total do dia</div></div>
    <div class="card-resumo-dia" style="border-left-color:var(--verde)"><div class="num-card-resumo" style="color:var(--verde)">${realizados}</div><div class="lb-card-resumo">Realizados</div></div>
    <div class="card-resumo-dia" style="border-left-color:var(--amarelo)"><div class="num-card-resumo" style="color:var(--amarelo)">${pendentes}</div><div class="lb-card-resumo">Pendentes</div></div>
    <div class="card-resumo-dia" style="border-left-color:var(--vermelho)"><div class="num-card-resumo" style="color:var(--vermelho)">${cancelados}</div><div class="lb-card-resumo">Cancelados</div></div>
  `;
}

// Abre modal de novo agendamento
function marcarData() {
  const hoje = dataAtual.toISOString().slice(0, 10);
  document.getElementById('input-data-ag').value = hoje;
  document.getElementById('campo-cliente').value = '';
  document.getElementById('sel-servico').value   = '';
  document.getElementById('inp-hora-ag').value   = '';
  clienteSelecionado = null;

  // preenche o select de serviços dinamicamente
  const sel = document.getElementById('sel-servico');
  sel.innerHTML = '<option value="">Selecione um serviço...</option>' +
    servicos.map(s => `<option value="${s.id}">${s.icone} ${s.nome} — R$ ${s.valor.toFixed(2).replace('.',',')}</option>`).join('');

  abrirModal('agendar');
}

function cancelarNovoAgendamento() { fecharModais(); }

let clienteSelecionado = null;

function autocomplete(valor) {
  const lista = document.getElementById('lista-autocomplete');
  if (!valor.trim()) { lista.style.display = 'none'; return; }

  const filtrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(valor.toLowerCase())
  );

  if (!filtrados.length) { lista.style.display = 'none'; return; }

  lista.innerHTML = filtrados.map(c =>
    `<div class="item-autocomplete" onclick="selecionarCliente(${c.id},'${c.nome}')">${c.nome}</div>`
  ).join('');
  lista.style.display = 'block';
}

function selecionarCliente(id, nome) {
  clienteSelecionado = id;
  document.getElementById('campo-cliente').value = nome;
  document.getElementById('lista-autocomplete').style.display = 'none';
}

function salvarAgendamento() {
  const nomeDigitado = document.getElementById('campo-cliente').value.trim();
  const servicoId    = document.getElementById('sel-servico').value;
  const data         = document.getElementById('input-data-ag').value;
  const hora         = document.getElementById('inp-hora-ag').value;

  if (!nomeDigitado || !servicoId || !data || !hora) {
    alert('Preencha todos os campos.'); return;
  }

  const serv = servicos.find(s => s.id == servicoId);
  const id   = Date.now();

  agendamentos.push({
    id,
    cliente:  nomeDigitado,
    clienteId: clienteSelecionado,
    servico:  serv ? serv.nome : servicoId,
    servicoId: serv ? serv.id : null,
    valor:    serv ? serv.valor : 0,
    data,
    hora,
    status:   'agendado'
  });

  salvar('bf_agendamentos', agendamentos);
  fecharModais();

  // vai pra data agendada
  const [y, m, d] = data.split('-').map(Number);
  dataAtual = new Date(y, m - 1, d);
  renderizarDataNav();
  renderizarGrade();
}

// Detalhe do agendamento
let agIdEditando = null;

function abrirDetalhe(id) {
  const ag = agendamentos.find(a => a.id === id);
  if (!ag) return;
  agIdEditando = id;

  document.getElementById('conteudo-detalhe').innerHTML = `
    <p><strong>Cliente:</strong> ${ag.cliente}</p>
    <p><strong>Serviço:</strong> ${ag.servico}</p>
    <p><strong>Data:</strong> ${ag.data.split('-').reverse().join('/')}</p>
    <p><strong>Horário:</strong> ${ag.hora}</p>
    <p><strong>Valor:</strong> R$ ${ag.valor.toFixed(2).replace('.',',')}</p>
    <p><strong>Status:</strong> <span class="etiqueta ${ag.status === 'realizado' ? 'etiqueta-verde' : ag.status === 'cancelado' ? 'etiqueta-vermelho' : 'etiqueta-amarelo'}">${ag.status}</span></p>
  `;
  abrirModal('detalhe');
}

function baixaAgendamento(status) {
  const ag = agendamentos.find(a => a.id === agIdEditando);
  if (!ag) return;
  ag.status = status;
  salvar('bf_agendamentos', agendamentos);
  fecharModais();
  renderizarGrade();
}

// ------------------------------------------------------------
//  CLIENTES
// ------------------------------------------------------------
function renderizarClientes(filtro) {
  const busca = filtro || document.getElementById('busca-cliente')?.value.toLowerCase() || '';
  const lista = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca) ||
    (c.telefone || '').includes(busca)
  );

  const tbody = document.getElementById('lista-clientes-corpo');
  if (!tbody) return;

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--texto-leve);padding:24px">Nenhum cliente encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(c => {
    const ult = agendamentos
      .filter(a => a.clienteId === c.id && a.status === 'realizado')
      .sort((a, b) => b.data.localeCompare(a.data))[0];
    const ultStr = ult
      ? `${ult.servico} (${ult.data.split('-').reverse().join('/')})`
      : '—';

    return `<tr>
      <td>${c.nome}</td>
      <td>${c.telefone || '—'}</td>
      <td>${ultStr}</td>
      <td>
        <button class="bt-icone" onclick="editarCliente(${c.id})" title="Editar">✏️</button>
        <button class="bt-icone" onclick="excluirCliente(${c.id})" title="Excluir">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('busca-cliente');
  if (inp) inp.addEventListener('input', () => renderizarClientes(inp.value.toLowerCase()));
});

function abrirModal_cliente() {
  // reutiliza o modal de agendamento como cadastro de cliente simples
  const nome = prompt('Nome do cliente:');
  if (!nome?.trim()) return;
  const tel  = prompt('Telefone:');
  clientes.push({ id: Date.now(), nome: nome.trim(), telefone: tel || '' });
  salvar('bf_clientes', clientes);
  renderizarClientes();
}

// override do onclick do HTML: onclick="abrirModal('cliente')"
const _abrirModalOrig = window.abrirModal;
window.abrirModal = function(id) {
  if (id === 'cliente') { abrirModal_cliente(); return; }
  _abrirModalOrig(id);
};

function editarCliente(id) {
  const c = clientes.find(x => x.id === id);
  if (!c) return;
  const nome = prompt('Nome:', c.nome);
  if (nome === null) return;
  const tel  = prompt('Telefone:', c.telefone);
  c.nome = nome.trim() || c.nome;
  c.telefone = tel ?? c.telefone;
  salvar('bf_clientes', clientes);
  renderizarClientes();
}

function excluirCliente(id) {
  if (!confirm('Excluir este cliente?')) return;
  clientes = clientes.filter(c => c.id !== id);
  salvar('bf_clientes', clientes);
  renderizarClientes();
}

// ------------------------------------------------------------
//  SERVIÇOS
// ------------------------------------------------------------
function renderizarServicos() {
  const grid = document.getElementById('grid-servicos');
  if (!grid) return;

  document.getElementById('total-servicos').textContent = servicos.length;

  if (servicos.length) {
    const valores = servicos.map(s => s.valor);
    const media   = valores.reduce((a, b) => a + b, 0) / valores.length;
    const min     = Math.min(...valores);
    const max     = Math.max(...valores);
    document.getElementById('ticket-medio').textContent  = 'R$ ' + media.toFixed(2).replace('.',',');
    document.getElementById('mais-barato').textContent   = 'R$ ' + min.toFixed(2).replace('.',',');
    document.getElementById('mais-caro').textContent     = 'R$ ' + max.toFixed(2).replace('.',',');
  }

  grid.innerHTML = servicos.map(s => `
    <div class="card-servico">
      <div class="icone-servico">${s.icone || '✨'}</div>
      <div class="nome-servico">${s.nome}</div>
      <div class="preco-servico">R$ ${s.valor.toFixed(2).replace('.',',')}</div>
      <div class="retorno-servico">Retorno ideal: ${s.retorno} dias</div>
      <div class="acoes-servico">
        <button class="bt-cinza" style="font-size:12px;padding:5px 12px" onclick="editarServico(${s.id})">✏️ Editar</button>
        <button class="bt-cinza" style="font-size:12px;padding:5px 12px" onclick="excluirServico(${s.id})">🗑️</button>
      </div>
    </div>
  `).join('');
}

function novoServico() {
  document.getElementById('inp-servico-nome').value    = '';
  document.getElementById('inp-servico-valor').value   = '';
  document.getElementById('inp-servico-retorno').value = '';
  document.getElementById('inp-servico-icone').value   = '';
  document.getElementById('inp-servico-id').value      = '';
  document.querySelector('#modal-servico .titulo-modal').textContent = '✨ Novo Serviço';
  abrirModal('servico');
}

function editarServico(id) {
  const s = servicos.find(x => x.id === id);
  if (!s) return;
  document.getElementById('inp-servico-nome').value    = s.nome;
  document.getElementById('inp-servico-valor').value   = s.valor;
  document.getElementById('inp-servico-retorno').value = s.retorno;
  document.getElementById('inp-servico-icone').value   = s.icone || '';
  document.getElementById('inp-servico-id').value      = s.id;
  document.querySelector('#modal-servico .titulo-modal').textContent = '✏️ Editar Serviço';
  abrirModal('servico');
}

function salvarServico() {
  const nome    = document.getElementById('inp-servico-nome').value.trim();
  const valor   = parseFloat(document.getElementById('inp-servico-valor').value);
  const retorno = parseInt(document.getElementById('inp-servico-retorno').value);
  const icone   = document.getElementById('inp-servico-icone').value.trim() || '✨';
  const idEdit  = document.getElementById('inp-servico-id').value;

  if (!nome || isNaN(valor) || isNaN(retorno)) { alert('Preencha todos os campos.'); return; }

  if (idEdit) {
    const s = servicos.find(x => x.id == idEdit);
    if (s) { s.nome = nome; s.valor = valor; s.retorno = retorno; s.icone = icone; }
  } else {
    servicos.push({ id: Date.now(), nome, valor, retorno, icone });
  }

  salvar('bf_servicos', servicos);
  fecharModais();
  renderizarServicos();
}

function excluirServico(id) {
  if (!confirm('Excluir este serviço?')) return;
  servicos = servicos.filter(s => s.id !== id);
  salvar('bf_servicos', servicos);
  renderizarServicos();
}

// ------------------------------------------------------------
//  CONSUMO
// ------------------------------------------------------------
let mesConsumo = new Date();

function iniciarConsumo() {
  mesConsumo = new Date();
  atualizarMesNav();
  renderizarConsumo();
}

function mudarMes(delta) {
  mesConsumo.setMonth(mesConsumo.getMonth() + delta);
  atualizarMesNav();
  renderizarConsumo();
}

function atualizarMesNav() {
  const str = mesConsumo.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  document.getElementById('lb-mes-nav').textContent       = str.charAt(0).toUpperCase() + str.slice(1);
  document.getElementById('subtitulo-consumo').textContent = 'Registro de compras — ' + str;
}

function renderizarConsumo() {
  const busca = (document.getElementById('busca-consumo')?.value || '').toLowerCase();
  const mes   = mesConsumo.getMonth();
  const ano   = mesConsumo.getFullYear();

  const filtradas = compras.filter(c => {
    const d = new Date(c.data + 'T00:00:00');
    return d.getMonth() === mes && d.getFullYear() === ano &&
           c.produto.toLowerCase().includes(busca);
  });

  const tbody = document.getElementById('tbody-consumo');
  const msg   = document.getElementById('msg-consumo-vazia');
  const tabela = document.getElementById('tabela-consumo');

  if (!filtradas.length) {
    tbody.innerHTML = '';
    msg.style.display    = 'block';
    tabela.style.display = 'none';
  } else {
    msg.style.display    = 'none';
    tabela.style.display = 'table';
    tbody.innerHTML = filtradas
      .sort((a, b) => b.data.localeCompare(a.data))
      .map(c => `
        <tr>
          <td>${c.produto}</td>
          <td>${c.data.split('-').reverse().join('/')}</td>
          <td style="color:var(--vermelho);font-weight:700">R$ ${parseFloat(c.valor).toFixed(2).replace('.',',')}</td>
          <td>
            <button class="bt-icone" onclick="editarCompra(${c.id})">✏️</button>
            <button class="bt-icone" onclick="excluirCompra(${c.id})">🗑️</button>
          </td>
        </tr>
      `).join('');
  }

  // resumo
  const total = filtradas.reduce((s, c) => s + parseFloat(c.valor), 0);
  document.getElementById('total-compras').textContent = 'R$ ' + total.toFixed(2).replace('.',',');
  document.getElementById('qtd-itens').textContent     = filtradas.length;

  if (filtradas.length) {
    const maior = filtradas.reduce((a, b) => parseFloat(a.valor) >= parseFloat(b.valor) ? a : b);
    document.getElementById('maior-gasto').textContent = maior.produto + ' (R$ ' + parseFloat(maior.valor).toFixed(2).replace('.',',') + ')';
  } else {
    document.getElementById('maior-gasto').textContent = '—';
  }
}

function abrirModalConsumo() {
  document.getElementById('inp-consumo-produto').value = '';
  document.getElementById('inp-consumo-valor').value   = '';
  document.getElementById('inp-consumo-data').value    = new Date().toISOString().slice(0, 10);
  document.getElementById('inp-consumo-id').value      = '';
  abrirModal('consumo');
}

function salvarConsumo() {
  const produto = document.getElementById('inp-consumo-produto').value.trim();
  const valor   = document.getElementById('inp-consumo-valor').value;
  const data    = document.getElementById('inp-consumo-data').value;
  const idEdit  = document.getElementById('inp-consumo-id').value;

  if (!produto || !valor || !data) { alert('Preencha todos os campos.'); return; }

  if (idEdit) {
    const c = compras.find(x => x.id == idEdit);
    if (c) { c.produto = produto; c.valor = valor; c.data = data; }
  } else {
    compras.push({ id: Date.now(), produto, valor, data });
  }

  salvar('bf_compras', compras);
  fecharModais();
  renderizarConsumo();
}

function editarCompra(id) {
  const c = compras.find(x => x.id === id);
  if (!c) return;
  document.getElementById('inp-consumo-produto').value = c.produto;
  document.getElementById('inp-consumo-valor').value   = c.valor;
  document.getElementById('inp-consumo-data').value    = c.data;
  document.getElementById('inp-consumo-id').value      = c.id;
  abrirModal('consumo');
}

function excluirCompra(id) {
  if (!confirm('Excluir esta compra?')) return;
  compras = compras.filter(c => c.id !== id);
  salvar('bf_compras', compras);
  renderizarConsumo();
}

// ------------------------------------------------------------
//  RETORNO DE CLIENTES
// ------------------------------------------------------------
let filtroRetornoAtivo = 'todas';

function renderizarRetorno() {
  const hoje    = new Date(); hoje.setHours(0,0,0,0);
  const retornos = [];

  agendamentos.forEach(ag => {
    if (ag.status !== 'realizado') return;
    const serv = servicos.find(s => s.id === ag.servicoId);
    if (!serv || !serv.retorno) return;

    const dataAg  = new Date(ag.data + 'T00:00:00');
    const retorno = new Date(dataAg);
    retorno.setDate(retorno.getDate() + serv.retorno);

    const diff = Math.round((retorno - hoje) / 86400000);
    retornos.push({ ag, serv, retorno, diff });
  });

  // contadores
  const nHoje    = retornos.filter(r => r.diff === 0).length;
  const n3dias   = retornos.filter(r => r.diff > 0 && r.diff <= 3).length;
  const n7dias   = retornos.filter(r => r.diff > 0 && r.diff <= 7).length;
  const nVencidas= retornos.filter(r => r.diff < 0).length;

  document.getElementById('num-hoje').textContent    = nHoje;
  document.getElementById('num-3dias').textContent   = n3dias;
  document.getElementById('num-7dias').textContent   = n7dias;
  document.getElementById('num-vencidas').textContent= nVencidas;

  // filtro
  let lista = retornos;
  if (filtroRetornoAtivo === 'hoje')    lista = retornos.filter(r => r.diff === 0);
  if (filtroRetornoAtivo === '3dias')   lista = retornos.filter(r => r.diff > 0 && r.diff <= 3);
  if (filtroRetornoAtivo === '7dias')   lista = retornos.filter(r => r.diff > 0 && r.diff <= 7);
  if (filtroRetornoAtivo === 'vencidas')lista = retornos.filter(r => r.diff < 0);

  const container = document.getElementById('lista-retorno');

  if (!lista.length) {
    container.innerHTML = `<div class="msg-vazia"><div class="msg-vazia-icone">🔔</div>Nenhum retorno nesta categoria.</div>`;
    return;
  }

  container.innerHTML = lista
    .sort((a, b) => a.diff - b.diff)
    .map(({ ag, serv, retorno, diff }) => {
      const classe = diff < 0 ? 'card-retorno vencido' : diff === 0 ? 'card-retorno hoje' : 'card-retorno em-breve';
      const label  = diff < 0 ? `Vencido há ${Math.abs(diff)} dia(s)` : diff === 0 ? 'Hoje!' : `Em ${diff} dia(s)`;
      const dataFmt= retorno.toLocaleDateString('pt-BR');

      return `<div class="${classe}">
        <div>
          <strong>${ag.cliente}</strong>
          <div style="font-size:13px;color:var(--texto-leve)">${serv.nome} • Retorno: ${dataFmt}</div>
        </div>
        <span class="etiqueta ${diff < 0 ? 'etiqueta-vermelho' : diff === 0 ? 'etiqueta-amarelo' : 'etiqueta-verde'}">${label}</span>
      </div>`;
    }).join('');
}

function filtroRetorno(tipo, el) {
  filtroRetornoAtivo = tipo;
  document.querySelectorAll('.filtro').forEach(f => f.classList.remove('ativo'));
  el.classList.add('ativo');
  renderizarRetorno();
}

// ------------------------------------------------------------
//  CSS extra para os slots da grade (injetado via JS)
// ------------------------------------------------------------
const estilos = document.createElement('style');
estilos.textContent = `
  .hora-slot {
    height: 56px; display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: var(--texto-leve);
    border-bottom: 1px solid var(--borda);
  }
  .slot-vazio {
    height: 56px; border-bottom: 1px dashed var(--borda);
    transition: background 0.15s;
  }
  .slot-vazio:hover { background: var(--rosa-fundo); }
  .card-agendamento {
    height: 56px; padding: 6px 14px; border-bottom: 1px solid var(--borda);
    display: flex; align-items: center; gap: 10px; cursor: pointer;
    transition: opacity 0.15s;
  }
  .card-agendamento:hover { opacity: 0.85; }
  .card-agendamento strong { font-size: 14px; }
  .card-agendamento span   { font-size: 12px; color: var(--texto-leve); }
  .card-ag-rosa    { background: #fff0f7; border-left: 4px solid var(--rosa); }
  .card-ag-verde   { background: #f0faf5; border-left: 4px solid var(--verde); }
  .card-ag-vermelho{ background: #fff0f0; border-left: 4px solid var(--vermelho); }
  .tag-status {
    margin-left: auto; font-size: 11px; font-weight: 700; padding: 2px 8px;
    border-radius: 50px; background: var(--borda); color: var(--texto-leve);
  }
  #modal-agendar { display: none; }
`;
document.head.appendChild(estilos);

// ------------------------------------------------------------
//  INICIALIZAÇÃO
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // o modal de agendamento começa escondido
  document.getElementById('modal-agendar').style.display = 'none';
  // abre na tela da agenda
  iniciarAgenda();
});
