// ===========================
// MÓDULO: AUTENTICAÇÃO
// ===========================

const AuthModule = {
  currentUser: null,
  
  // Credenciais pré-configuradas
  usuarios: {
    'jogador': { senha: 'jogador.f13', role: 'jogador', nome: 'Jogador' },
    'donks': { senha: 'D.f13', role: 'diretor', nome: 'Diretor Donks' },
    'william': { senha: 'W.f13', role: 'diretor', nome: 'Diretor William' },
    'admin': { senha: '123456', role: 'admin', nome: 'Administrador' }
  },

  init() {
    const usuarioSalvo = localStorage.getItem('familia13_user');
    if (usuarioSalvo) {
      this.currentUser = JSON.parse(usuarioSalvo);
      this.showApp();
      loadModule('menu');
    } else {
      this.showLogin();
    }
  },

  login(event) {
    event.preventDefault();
    const login = document.getElementById('login-user').value.trim();
    const senha = document.getElementById('login-pass').value;
    const errorEl = document.getElementById('login-error');
    const loginKey = login.toLowerCase();

    console.log('Tentativa de login:', { login, senha });
    console.log('Usuários disponíveis:', Object.keys(this.usuarios));

    if (!login || !senha) {
      errorEl.textContent = 'Preencha login e senha';
      errorEl.style.display = 'block';
      return;
    }

    const usuario = this.usuarios[loginKey];
    console.log('Usuário encontrado:', usuario);
    
    if (usuario && usuario.senha === senha) {
      console.log('Login bem-sucedido!');
      this.currentUser = {
        login: loginKey,
        role: usuario.role,
        nome: usuario.nome
      };
      console.log('Usuário atual:', this.currentUser);
      localStorage.setItem('familia13_user', JSON.stringify(this.currentUser));
      this.logAction('login', 'Fez login no sistema', {});
      this.showApp();
      errorEl.style.display = 'none';
      document.getElementById('login-user').value = '';
      document.getElementById('login-pass').value = '';
      loadModule('menu');
    } else if (!usuario) {
      errorEl.textContent = 'Usuário não encontrado';
      errorEl.style.display = 'block';
      document.getElementById('login-pass').value = '';
    } else {
      errorEl.textContent = `Senha incorreta (você digitou: "${senha}")`;
      errorEl.style.display = 'block';
      document.getElementById('login-pass').value = '';
    }
  },

  logout() {
    UI.showConfirm('Tem certeza que deseja sair?', () => {
      this.logAction('logout', 'Fez logout do sistema', {});
      localStorage.removeItem('familia13_user');
      this.currentUser = null;
      this.showLogin();
    });
  },

  logAction(acao, descricao, dados) {
    if (!this.currentUser) return;
    
    const log = {
      id: db.ref().child('logs').push().key,
      usuario: this.currentUser.login,
      role: this.currentUser.role,
      acao: acao,
      descricao: descricao,
      dados: dados,
      timestamp: new Date().toISOString(),
      data: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('pt-BR')
    };
    
    db.ref('logs/' + log.id).set(log)
      .then(() => this.cleanupOldLogs())
      .catch(err => console.error('Erro ao registrar log:', err));
  },

  cleanupOldLogs() {
    const cutoffIso = new Date(Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    db.ref('logs')
      .orderByChild('timestamp')
      .endAt(cutoffIso)
      .once('value')
      .then(snap => {
        const updates = {};
        snap.forEach(child => {
          updates[child.key] = null;
        });

        if (Object.keys(updates).length > 0) {
          db.ref('logs').update(updates).catch(err => console.error('Erro ao remover logs antigos:', err));
        }
      })
      .catch(err => console.error('Erro ao consultar logs antigos:', err));
  },

  showLogin() {
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
  },

  showApp() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    
    // Atualizar informações do usuário na sidebar
    document.getElementById('user-name').textContent = this.currentUser.nome;
    let roleText = '';
    if (this.currentUser.role === 'jogador') roleText = 'Jogador';
    else if (this.currentUser.role === 'diretor') roleText = 'Diretor';
    else if (this.currentUser.role === 'admin') roleText = 'Administrador';
    document.getElementById('user-role').textContent = roleText;

    // Controlar acesso a módulos
    if (this.currentUser.role === 'jogador') {
      // Jogador: Menu, Jogos (somente leitura) e Estatísticas
      document.getElementById('btn-jogadores').style.display = 'none';
      document.getElementById('btn-jogos').style.display = 'block';
      document.getElementById('btn-financeiro').style.display = 'none';
      document.getElementById('btn-logs').style.display = 'none';
    } else if (this.currentUser.role === 'diretor') {
      // Diretor: tudo exceto logs
      document.getElementById('btn-jogadores').style.display = 'block';
      document.getElementById('btn-jogos').style.display = 'block';
      document.getElementById('btn-financeiro').style.display = 'block';
      document.getElementById('btn-logs').style.display = 'none';
    } else if (this.currentUser.role === 'admin') {
      // Admin: acesso a tudo
      document.getElementById('btn-jogadores').style.display = 'block';
      document.getElementById('btn-jogos').style.display = 'block';
      document.getElementById('btn-financeiro').style.display = 'block';
      document.getElementById('btn-logs').style.display = 'block';
    }
  }
};

// ===========================
// CONFIGURAÇÃO FIREBASE
// ===========================

const firebaseConfig = {
  apiKey: "AIzaSyBviX1DvqHx9FAjvXYNZ0QWtzi70GKIL90",
  authDomain: "familia-13-2aa28.firebaseapp.com",
  projectId: "familia-13-2aa28",
  storageBucket: "familia-13-2aa28.appspot.com",
  messagingSenderId: "294807436895",
  appId: "1:294807436895:web:28bace2f8f3bb648d0a5ea",
  databaseURL: "https://familia-13-2aa28-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===========================
// CONSTANTES E CONFIGURAÇÕES
// ===========================

const MESES = ['jan/26','fev/26','mar/26','abr/26','mai/26','jun/26','jul/26','ago/26','set/26','out/26','nov/26','dez/26'];
const LOG_RETENTION_DAYS = 90;

// ===========================
// UTILITÁRIOS E HELPERS
// ===========================

const UI = {
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOutDown 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  showConfirm(message, onConfirm) {
    const modal = document.getElementById('confirmModal') || this.createConfirmModal();
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmYes').onclick = () => {
      onConfirm();
      this.closeModal(modal);
    };
    document.getElementById('confirmNo').onclick = () => this.closeModal(modal);
    this.openModal(modal);
  },

  createConfirmModal() {
    const modal = document.createElement('div');
    modal.id = 'confirmModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Confirmação</h2>
          <button class="modal-close" onclick="UI.closeModal(document.getElementById('confirmModal'))">&times;</button>
        </div>
        <div id="confirmMessage" style="margin: 20px 0; font-size: 16px;"></div>
        <div class="modal-footer">
          <button class="btn-danger" id="confirmNo">Cancelar</button>
          <button class="btn-success" id="confirmYes">Confirmar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  },

  openModal(modal) {
    modal.classList.add('active');
  },

  closeModal(modal) {
    modal.classList.remove('active');
  },

  showLoading(element) {
    element.innerHTML = '<div class="spinner"></div> Carregando...';
  },

  clearInputs(ids) {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }
};

// ===========================
// MÓDULO: JOGADORES
// ===========================

const JogadoresModule = {
  currentEditId: null,
  filterNome: '',
  filterPosicao: '',
  filterMes: '',
  sortBy: 'nome',
  sortOrder: 'asc',

  init() {
    const isReadOnly = AuthModule.currentUser?.role === 'jogador';
    const container = document.getElementById('main-content');
    const actionsHeader = isReadOnly ? '' : '<th>Ações</th>';
    container.innerHTML = `
      <h1>📋 Gerenciar Jogadores</h1>
      <div class="form-container" id="jogadores-form-bloco">
        <p style="color: var(--text-secondary); margin-bottom: 24px;">Adicione novos jogadores ou edite os existentes</p>
        <div class="form-row">
          <div class="form-column">
            <div class="form-group">
              <label for="nome">Nome do Jogador</label>
              <input id="nome" type="text" placeholder="Ex: João Silva">
            </div>
          </div>
          <div class="form-column">
            <div class="form-group">
              <label for="posicao">Posição</label>
              <input id="posicao" type="text" placeholder="Ex: Atacante, Defesa, Goleiro">
            </div>
          </div>
          <div class="form-column">
            <div class="form-group">
              <label for="valorMensalidade">Valor da Mensalidade (R$)</label>
              <input id="valorMensalidade" type="number" min="0" step="0.01" placeholder="Ex: 50.00">
            </div>
          </div>
        </div>
        <div class="action-row">
          <button class="btn-success" id="salvarJogador">✓ Salvar Jogador</button>
          <button class="btn-primary" onclick="loadModule('menu')" style="margin-left: auto;">← Voltar</button>
        </div>
      </div>

      <div class="form-container">
        <h3>Filtros e Ordenação</h3>
        <div class="form-row">
          <div class="form-column">
            <div class="form-group">
              <label for="filterNome">Buscar por Nome</label>
              <input id="filterNome" type="text" placeholder="Digite o nome" onkeyup="JogadoresModule.applyFilters()">
            </div>
          </div>
          <div class="form-column">
            <div class="form-group">
              <label for="filterPosicao">Filtrar por Posição</label>
              <input id="filterPosicao" type="text" placeholder="Digite a posição" onkeyup="JogadoresModule.applyFilters()">
            </div>
          </div>
          <div class="form-column">
            <div class="form-group">
              <label for="filterMes">Filtrar por Mês</label>
              <select id="filterMes" onchange="JogadoresModule.applyFilters()">
                <option value="">Todos os meses</option>
                ${MESES.map((m, i) => `<option value="${i}">${m}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-column">
            <div class="form-group">
              <label for="sortBy">Ordenar por</label>
              <select id="sortBy" onchange="JogadoresModule.applyFilters()">
                <option value="nome">Nome (A-Z)</option>
                <option value="nome-desc">Nome (Z-A)</option>
                <option value="posicao">Posição</option>
                <option value="valor">Valor Mensalidade</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <table id="jogadores-table-container">
          <thead>
            <tr>
              <th onclick="JogadoresModule.sortTable('nome')" style="cursor: pointer;">Nome ↕</th>
              <th onclick="JogadoresModule.sortTable('posicao')" style="cursor: pointer;">Posição ↕</th>
              <th onclick="JogadoresModule.sortTable('valor')" style="cursor: pointer;">Mensalidade (R$) ↕</th>
              ${MESES.map(m => `<th style="text-align: center; padding: 12px 8px; font-size: 11px; font-weight: 700; min-width: 70px;">${m}</th>`).join('')}
              ${actionsHeader}
            </tr>
          </thead>
          <tbody id="jogadores-table"></tbody>
        </table>
      </div>
    `;
    
    document.getElementById('salvarJogador').onclick = () => this.save();
    if (isReadOnly) {
      const formBloco = document.getElementById('jogadores-form-bloco');
      if (formBloco) formBloco.style.display = 'none';
    }
    this.load();
  },

  save(id = null) {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    const nome = document.getElementById('nome').value.trim();
    const posicao = document.getElementById('posicao').value.trim();
    const valorMensalidade = parseFloat(document.getElementById('valorMensalidade').value) || 0;
    
    if (!nome || !posicao) {
      UI.showToast('Preencha nome e posição', 'error');
      return;
    }

    const jogadorId = id || this.currentEditId || db.ref().child('jogadores').push().key;
    
    const mensalidades = Array(12).fill(null).map(() => ({ pago: false, valor: valorMensalidade }));

    db.ref('jogadores/' + jogadorId).set({
      id: jogadorId,
      nome,
      posicao,
      valorMensalidade,
      mensalidades
    }).then(() => {
      const acao = this.currentEditId ? 'editar_jogador' : 'adicionar_jogador';
      const descricao = this.currentEditId ? `Editou o jogador ${nome}` : `Adicionou o jogador ${nome}`;
      AuthModule.logAction(acao, descricao, { jogador: nome, posicao });
      UI.showToast('Jogador salvo com sucesso!', 'success');
      UI.clearInputs(['nome', 'posicao', 'valorMensalidade']);
      this.currentEditId = null;
      document.getElementById('salvarJogador').textContent = '✓ Salvar Jogador';
      this.load();
    }).catch(err => {
      UI.showToast('Erro ao salvar jogador', 'error');
      console.error(err);
    });
  },

  load() {
    const tabela = document.getElementById('jogadores-table');
    UI.showLoading(tabela);

    db.ref('jogadores').once('value').then(snap => {
      const data = snap.val();
      
      if (!data) {
        tabela.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">Nenhum jogador cadastrado</td></tr>';
        return;
      }

      this.allData = Object.values(data);
      this.applyFilters();
    }).catch(err => {
      UI.showToast('Erro ao carregar jogadores', 'error');
      console.error(err);
    });
  },

  applyFilters() {
    const tabela = document.getElementById('jogadores-table');
    if (!this.allData) return;

    const filterNome = document.getElementById('filterNome')?.value.toLowerCase() || '';
    const filterPosicao = document.getElementById('filterPosicao')?.value.toLowerCase() || '';
    const filterMes = document.getElementById('filterMes')?.value || '';
    const sortBy = document.getElementById('sortBy')?.value || 'nome';

    let filtered = this.allData.filter(j => {
      const nomeMatch = !filterNome || j.nome.toLowerCase().includes(filterNome);
      const posicaoMatch = !filterPosicao || j.posicao.toLowerCase().includes(filterPosicao);
      
      let mesMatch = true;
      if (filterMes !== '') {
        const mesIdx = parseInt(filterMes);
        const mensalidades = j.mensalidades || Array(12).fill({ pago: false, valor: 0 });
        const mensal = mensalidades[mesIdx];
        mesMatch = mensal && mensal.pago;
      }
      
      return nomeMatch && posicaoMatch && mesMatch;
    });

    // Ordenação
    filtered.sort((a, b) => {
      if (sortBy === 'nome') {
        return a.nome.localeCompare(b.nome);
      } else if (sortBy === 'nome-desc') {
        return b.nome.localeCompare(a.nome);
      } else if (sortBy === 'posicao') {
        return a.posicao.localeCompare(b.posicao);
      } else if (sortBy === 'valor') {
        return (b.valorMensalidade || 0) - (a.valorMensalidade || 0);
      }
      return 0;
    });

    this.renderTable(filtered);
  },

  renderTable(jogadores) {
    const isReadOnly = AuthModule.currentUser?.role === 'jogador';
    const tabela = document.getElementById('jogadores-table');
    tabela.innerHTML = '';

    if (jogadores.length === 0) {
      tabela.innerHTML = `<tr><td colspan="${3 + MESES.length + 1}" style="text-align: center; color: #999;">Nenhum resultado encontrado</td></tr>`;
      return;
    }

    jogadores.forEach(j => {
      const mensalidades = j.mensalidades || Array(12).fill({ pago: false, valor: j.valorMensalidade || 0 });
      const valorMensalidade = j.valorMensalidade || 0;

      const row = document.createElement('tr');
      let rowHtml = `
        <td style="font-weight: 600;">${j.nome}</td>
        <td>${j.posicao}</td>
        <td style="font-weight: 700; color: var(--primary-color);">R$ ${valorMensalidade.toFixed(2)}</td>
      `;

      // Adicionar uma célula para cada mês
      mensalidades.forEach((mensal, i) => {
        const pago = mensal && mensal.pago ? true : false;
        const valorPago = mensal && mensal.valorPago !== undefined ? mensal.valorPago : (mensal && mensal.valor !== undefined ? mensal.valor : valorMensalidade);
        const valor = mensal && mensal.valor !== undefined ? mensal.valor : valorMensalidade;
        
        if (isReadOnly) {
          rowHtml += `
            <td style="text-align: center; padding: 8px;">
              <div class="chip-toggle ${pago ? 'active' : ''}" title="R$ ${valor.toFixed(2)}" style="flex-direction: column; height: auto; padding: 6px 10px; border-radius: 20px; display: inline-flex; cursor: default;">
                <div style="font-size: 12px; font-weight: 700;">${pago ? 'R$ ' + valorPago.toFixed(2) : '-'}</div>
                <div style="font-size: 9px; margin-top: 2px;">${pago ? '✓' : ''}</div>
              </div>
            </td>
          `;
        } else {
          rowHtml += `
            <td style="text-align: center; padding: 8px;">
              <label class="chip-toggle ${pago ? 'active' : ''}" title="R$ ${valor.toFixed(2)}" style="flex-direction: column; height: auto; padding: 6px 10px; border-radius: 20px; cursor: pointer; display: inline-flex;">
                <input type="checkbox" ${pago ? 'checked' : ''} onchange="JogadoresModule.abrirModalPagamento('${j.id}',${i},this)" style="display: none;">
                <div style="font-size: 12px; font-weight: 700;">${pago ? 'R$ ' + valorPago.toFixed(2) : '-'}</div>
                <div style="font-size: 9px; margin-top: 2px;">${pago ? '✓' : ''}</div>
              </label>
            </td>
          `;
        }
      });

      if (!isReadOnly) {
        rowHtml += `
          <td>
            <button class="action-btn edit-btn" onclick="JogadoresModule.editar('${j.id}')">Editar</button>
            <button class="action-btn delete-btn" onclick="JogadoresModule.remover('${j.id}')">Excluir</button>
          </td>
        `;
      }

      row.innerHTML = rowHtml;
      tabela.appendChild(row);
    });
  },

  abrirModalPagamento(jogadorId, mesIndex, checkbox) {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    // Buscar dados do jogador
    db.ref('jogadores/' + jogadorId).once('value').then(snap => {
      const j = snap.val();
      const mensalidades = j.mensalidades || Array(12).fill({ pago: false, valor: 0, valorPago: 0 });
      const mensal = mensalidades[mesIndex] || { pago: false, valor: j.valorMensalidade || 0, valorPago: 0 };
      const valorPadrao = mensal.valor || j.valorMensalidade || 0;

      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      `;

      modal.innerHTML = `
        <div style="
          background: white;
          border-radius: 16px;
          padding: 28px;
          min-width: 320px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          border: 2px solid var(--border-color);
        ">
          <h3 style="margin-bottom: 20px; color: var(--text-primary);">
            ${checkbox.checked ? 'Registrar Pagamento' : 'Desmarcar Pagamento'}
          </h3>
          ${checkbox.checked ? `
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-primary);">
                Valor Pago (R$)
              </label>
              <input type="number" id="valorPagoInput" min="0" step="0.01" value="${mensal.valorPago || valorPadrao}" 
                style="width: 100%; padding: 12px 14px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 16px; font-weight: 600;">
              <small style="display: block; margin-top: 8px; color: var(--text-secondary);">Valor padrão: R$ ${valorPadrao.toFixed(2)}</small>
            </div>
          ` : ''}
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button onclick="document.body.removeChild(document.querySelector('[data-modal-pagamento]'))" 
              style="padding: 10px 20px; background: var(--border-color); border: none; border-radius: 8px; cursor: pointer; font-weight: 600; color: var(--text-primary); transition: all 0.3s;">
              Cancelar
            </button>
            <button onclick="JogadoresModule.salvarPagamento('${jogadorId}', ${mesIndex}, ${checkbox.checked})"
              style="padding: 10px 20px; background: var(--primary-color); border: none; border-radius: 8px; cursor: pointer; font-weight: 600; color: white; transition: all 0.3s;">
              ${checkbox.checked ? 'Marcar Pago' : 'Desmarcar'}
            </button>
          </div>
        </div>
      `;
      
      modal.setAttribute('data-modal-pagamento', 'true');
      modal.onclick = (e) => {
        if (e.target === modal) document.body.removeChild(modal);
      };
      
      document.body.appendChild(modal);
      setTimeout(() => {
        const input = document.getElementById('valorPagoInput');
        if (input) input.focus();
      }, 0);
    });
  },

  salvarPagamento(jogadorId, mesIndex, marcadoComoPago) {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    const valorPago = document.getElementById('valorPagoInput')?.value || 0;
    
    if (marcadoComoPago && (!valorPago || valorPago <= 0)) {
      UI.showToast('Informe um valor válido', 'error');
      return;
    }

    const update = {
      [`mensalidades/${mesIndex}/pago`]: marcadoComoPago,
      [`mensalidades/${mesIndex}/valorPago`]: parseFloat(valorPago) || 0,
      [`mensalidades/${mesIndex}/dataPagamento`]: marcadoComoPago ? new Date().toISOString().split('T')[0] : null
    };

    db.ref('jogadores/' + jogadorId).update(update).then(() => {
      const descricao = marcadoComoPago ? `Registrou pagamento de mensalidade: R$ ${parseFloat(valorPago).toFixed(2)}` : 'Removeu registro de pagamento';
      AuthModule.logAction('pagamento_mensalidade', descricao, { valor: valorPago, mes: MESES[mesIndex] });
      UI.showToast(marcadoComoPago ? 'Pagamento registrado!' : 'Pagamento removido!', 'success');
      document.body.removeChild(document.querySelector('[data-modal-pagamento]'));
      this.load();
    }).catch(err => {
      UI.showToast('Erro ao salvar pagamento', 'error');
      console.error(err);
    });
  },

  sortTable(campo) {
    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
      if (campo === 'nome') sortBy.value = sortBy.value === 'nome' ? 'nome-desc' : 'nome';
      else if (campo === 'posicao') sortBy.value = 'posicao';
      else if (campo === 'valor') sortBy.value = 'valor';
      this.applyFilters();
    }
  },

  editar(id) {
    db.ref('jogadores/' + id).once('value').then(snap => {
      const j = snap.val();
      document.getElementById('nome').value = j.nome;
      document.getElementById('posicao').value = j.posicao;
      document.getElementById('valorMensalidade').value = j.valorMensalidade || 0;
      document.getElementById('salvarJogador').textContent = 'Atualizar Jogador';
      this.currentEditId = id;
      window.scrollTo(0, 0);
    });
  },

  remover(id) {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    UI.showConfirm('Tem certeza que deseja excluir este jogador?', () => {
      db.ref('jogadores/' + id).once('value').then(snap => {
        const j = snap.val() || {};
        db.ref('jogadores/' + id).remove().then(() => {
          AuthModule.logAction('remover_jogador', `Removeu o jogador ${j.nome || ''}`.trim(), { jogadorId: id, nome: j.nome || '' });
          UI.showToast('Jogador removido!', 'success');
          this.load();
        });
      });
    });
  }
};

// ===========================
// MÓDULO: JOGOS
// ===========================

const JogosModule = {
  currentEditId: null,
  finalizeGameId: null,
  jogadoresData: {},

  init() {
    const isReadOnly = AuthModule.currentUser?.role === 'jogador';
    const actionsHeader = isReadOnly ? '' : '<th>Ações</th>';
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <h1>📅 Agenda de Jogos</h1>
      <div class="form-container" id="jogos-agendar-bloco">
        <h3>Agendar novo jogo</h3>
        <div class="form-row">
          <div class="form-column">
            <div class="form-group">
              <label for="dataJogo">Data</label>
              <input id="dataJogo" type="date">
            </div>
          </div>
          <div class="form-column">
            <div class="form-group">
              <label for="horaJogo">Hora</label>
              <input id="horaJogo" type="time">
            </div>
          </div>
          <div class="form-column">
            <div class="form-group">
              <label for="adversario">Adversário</label>
              <input id="adversario" type="text" placeholder="Nome do time">
            </div>
          </div>
          <div class="form-column">
            <div class="form-group">
              <label for="localJogo">Local</label>
              <input id="localJogo" type="text" placeholder="Campo/Endereço (opcional)">
            </div>
          </div>
        </div>
        <div class="action-row">
          <button class="btn-success" id="btnAgendar">✓ Agendar Jogo</button>
          <button class="btn-primary" onclick="loadModule('menu')" style="margin-left: auto;">← Voltar</button>
        </div>
      </div>

      <div class="form-container" id="finalizar-bloco" style="display: none;">
        <h3>Finalizar jogo</h3>
        <p id="finalizar-info" style="color: var(--text-secondary); margin-bottom: 16px;"></p>
        <div class="form-row">
          <div class="form-column">
            <div class="form-group">
              <label for="placar">Placar Final</label>
              <input id="placar" type="text" placeholder="Ex: 3 x 2">
            </div>
          </div>
        </div>
        <h3 style="margin-top: 10px;">Eventos por jogador</h3>
        <div id="jogadores-eventos-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-top: 10px;"></div>
        <div class="action-row">
          <button class="btn-success" id="btnFinalizar">✓ Salvar Resultado</button>
          <button class="btn-secondary" id="btnCancelarFinalizar">Cancelar</button>
        </div>
      </div>

      <div class="table-responsive" style="margin-top: 25px;">
        <table class="games-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Hora</th>
              <th>Adversário</th>
              <th>Local</th>
              ${actionsHeader}
            </tr>
          </thead>
          <tbody id="tabela-jogos-agenda"></tbody>
        </table>
      </div>

      <div class="table-responsive" style="margin-top: 25px;">
        <table class="games-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Adversário</th>
              <th>Placar</th>
              <th>Gols</th>
              <th>Assistências</th>
              ${actionsHeader}
            </tr>
          </thead>
          <tbody id="tabela-jogos-concluidos"></tbody>
        </table>
      </div>
    `;

    document.getElementById('btnAgendar').onclick = () => this.schedule();
    document.getElementById('btnFinalizar').onclick = () => this.finalize();
    document.getElementById('btnCancelarFinalizar').onclick = () => this.cancelFinalize();

    if (isReadOnly) {
      const agendarBloco = document.getElementById('jogos-agendar-bloco');
      if (agendarBloco) agendarBloco.style.display = 'none';
    }

    this.loadJogadores();
    this.load();
  },

  loadJogadores() {
    const container = document.getElementById('jogadores-eventos-container');
    if (!container) return; // ainda não renderizado
    UI.showLoading(container);

    db.ref('jogadores').once('value').then(snap => {
      container.innerHTML = '';
      const data = snap.val();
      this.jogadoresData = data || {};

      if (!data) {
        container.innerHTML = '<p style="color: #999;">Nenhum jogador cadastrado</p>';
        return;
      }

      Object.values(data).forEach(j => {
        const wrap = document.createElement('div');
        wrap.className = 'form-group';
        wrap.innerHTML = `
          <label style="font-weight:600;">${j.nome}</label>
          <div class="form-row" style="margin: 8px 0 0 0; grid-template-columns: repeat(2, 1fr);">
            <div class="form-group">
              <label for="gols-${j.id}" style="font-size:12px; color: var(--text-secondary);">Gols</label>
              <input id="gols-${j.id}" type="number" min="0" value="0" placeholder="0">
            </div>
            <div class="form-group">
              <label for="ast-${j.id}" style="font-size:12px; color: var(--text-secondary);">Assistências</label>
              <input id="ast-${j.id}" type="number" min="0" value="0" placeholder="0">
            </div>
          </div>
        `;
        container.appendChild(wrap);
      });
    });
  },

  schedule(id = null) {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    const data = document.getElementById('dataJogo').value;
    const hora = (document.getElementById('horaJogo').value || '').trim();
    const adversario = document.getElementById('adversario').value.trim();
    const local = (document.getElementById('localJogo').value || '').trim();

    if (!data || !adversario) {
      UI.showToast('Informe a data e o adversário', 'error');
      return;
    }

    const jogoId = id || db.ref().child('jogos').push().key;
    const payload = { id: jogoId, data, hora, adversario, local, status: 'agendado' };

    db.ref('jogos/' + jogoId).set(payload).then(() => {
      const acao = id ? 'editar_jogo' : 'agendar_jogo';
      const descricao = id ? `Atualizou o jogo vs ${adversario}` : `Agendou jogo vs ${adversario}`;
      AuthModule.logAction(acao, descricao, { jogoId, data, hora, adversario, local });
      UI.showToast('Jogo agendado!', 'success');
      UI.clearInputs(['dataJogo', 'horaJogo', 'adversario', 'localJogo']);
      this.load();
    }).catch(err => {
      UI.showToast('Erro ao agendar jogo', 'error');
      console.error(err);
    });
  },

  atualizarGols(goleadores) {
    Object.entries(goleadores).forEach(([playerId, gols]) => {
      const ref = db.ref('jogadores/' + playerId + '/gols');
      ref.once('value').then(snap => {
        ref.set((snap.val() || 0) + gols);
      });
    });
  },

  atualizarAssistencias(assistencias) {
    Object.entries(assistencias).forEach(([playerId, ast]) => {
      const ref = db.ref('jogadores/' + playerId + '/assistencias');
      ref.once('value').then(snap => {
        ref.set((snap.val() || 0) + ast);
      });
    });
  },

  load() {
    const tbodyAgenda = document.getElementById('tabela-jogos-agenda');
    const tbodyConcluidos = document.getElementById('tabela-jogos-concluidos');
    if (tbodyAgenda) UI.showLoading(tbodyAgenda);
    if (tbodyConcluidos) UI.showLoading(tbodyConcluidos);

    db.ref('jogos').once('value').then(snap => {
      if (tbodyAgenda) tbodyAgenda.innerHTML = '';
      if (tbodyConcluidos) tbodyConcluidos.innerHTML = '';
      const data = snap.val();

      if (!data) {
        if (tbodyAgenda) tbodyAgenda.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">Nenhum jogo agendado</td></tr>';
        if (tbodyConcluidos) tbodyConcluidos.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">Nenhum jogo concluído</td></tr>';
        return;
      }

      const values = Object.values(data);
      values.sort((a,b) => (a.data||'').localeCompare(b.data||''));

      values.forEach(j => {
        const status = j.status || (j.placar ? 'concluido' : 'agendado');
        const readOnly = AuthModule.currentUser?.role === 'jogador';
        if (status === 'agendado') {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td data-label="Data">${j.data || ''} <span class="badge badge--info" style="margin-left:8px;">Agendado</span></td>
            <td data-label="Hora">${j.hora || ''}</td>
            <td data-label="Adversário">${j.adversario || ''}</td>
            <td data-label="Local">${j.local || ''}</td>
            ${readOnly ? '' : `
            <td data-label="Ações">
              <button class="action-btn edit-btn" onclick="JogosModule.editar('${j.id}')">Editar</button>
              <button class="action-btn success-btn" onclick="JogosModule.startFinalize('${j.id}')">Concluir</button>
              <button class="action-btn delete-btn" onclick="JogosModule.remover('${j.id}')">Excluir</button>
            </td>`}
          `;
          if (tbodyAgenda) tbodyAgenda.appendChild(row);
        } else {
          const goleadores = Object.entries(j.goleadores || {}).map(([id, gols]) => {
            const jogador = this.jogadoresData[id];
            return jogador ? `${jogador.nome} (${gols})` : `${gols}`;
          }).join(', ') || '-';
          const assistencias = Object.entries(j.assistencias || {}).map(([id, ast]) => {
            const jogador = this.jogadoresData[id];
            return jogador ? `${jogador.nome} (${ast})` : `${ast}`;
          }).join(', ') || '-';

          const row = document.createElement('tr');
          row.innerHTML = `
            <td data-label="Data">${j.data || ''} <span class="badge badge--success" style="margin-left:8px;">Concluído</span></td>
            <td data-label="Adversário">${j.adversario || ''}</td>
            <td data-label="Placar">${j.placar || ''}</td>
            <td data-label="Gols" style="font-size: 13px;">${goleadores}</td>
            <td data-label="Assistências" style="font-size: 13px;">${assistencias}</td>
            ${readOnly ? '' : `
            <td data-label="Ações">
              <button class="action-btn edit-btn" onclick="JogosModule.editar('${j.id}')">Editar</button>
              <button class="action-btn delete-btn" onclick="JogosModule.remover('${j.id}')">Excluir</button>
            </td>`}
          `;
          if (tbodyConcluidos) tbodyConcluidos.appendChild(row);
        }
      });
    }).catch(err => {
      UI.showToast('Erro ao carregar jogos', 'error');
      console.error(err);
    });
  },

  editar(id) {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    db.ref('jogos/' + id).once('value').then(snap => {
      const j = snap.val();
      if (!j.status || j.status === 'concluido') {
        // editar dados básicos não é foco aqui; permitir apenas ajuste rápido de placar via finalizar
        this.startFinalize(id);
      } else {
        // edição do agendamento
        document.getElementById('dataJogo').value = j.data || '';
        document.getElementById('horaJogo').value = j.hora || '';
        document.getElementById('adversario').value = j.adversario || '';
        document.getElementById('localJogo').value = j.local || '';
        this.currentEditId = id;
        // ao agendar novamente, reaproveitamos o mesmo id
        document.getElementById('btnAgendar').onclick = () => this.schedule(id);
        window.scrollTo(0, 0);
      }
    });
  },

  remover(id) {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    UI.showConfirm('Tem certeza que deseja excluir este jogo?', () => {
      db.ref('jogos/' + id).once('value').then(snap => {
        const j = snap.val();
        if (j && j.status === 'concluido') {
          Object.entries(j.goleadores || {}).forEach(([pid, gols]) => {
            const ref = db.ref('jogadores/' + pid + '/gols');
            ref.once('value').then(s => {
              ref.set(Math.max(0, (s.val() || 0) - gols));
            });
          });
          Object.entries(j.assistencias || {}).forEach(([pid, ast]) => {
            const ref = db.ref('jogadores/' + pid + '/assistencias');
            ref.once('value').then(s => {
              ref.set(Math.max(0, (s.val() || 0) - ast));
            });
          });
        }
        db.ref('jogos/' + id).remove().then(() => {
          AuthModule.logAction('remover_jogo', `Removeu o jogo vs ${j?.adversario || ''}`.trim(), { jogoId: id, data: j?.data || '', adversario: j?.adversario || '' });
          UI.showToast('Jogo removido!', 'success');
          this.load();
        });
      });
    });
  },

  startFinalize(id) {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    this.finalizeGameId = id;
    db.ref('jogos/' + id).once('value').then(snap => {
      const j = snap.val() || {};
      const info = `${j.data || ''} • ${j.adversario || ''} ${j.local ? '• ' + j.local : ''}`;
      document.getElementById('finalizar-info').textContent = info;
      document.getElementById('finalizar-bloco').style.display = 'block';
      window.scrollTo(0, 0);

      // Preenche os valores existentes, se houver
      Object.entries(j.goleadores || {}).forEach(([pid, gols]) => {
        const el = document.getElementById(`gols-${pid}`);
        if (el) el.value = gols;
      });
      Object.entries(j.assistencias || {}).forEach(([pid, ast]) => {
        const el = document.getElementById(`ast-${pid}`);
        if (el) el.value = ast;
      });
      document.getElementById('placar').value = j.placar || '';
    });
  },

  cancelFinalize() {
    this.finalizeGameId = null;
    const bloco = document.getElementById('finalizar-bloco');
    if (bloco) bloco.style.display = 'none';
    // reset inputs de eventos
    document.querySelectorAll('[id^="gols-"]').forEach(el => el.value = '0');
    document.querySelectorAll('[id^="ast-"]').forEach(el => el.value = '0');
    const pl = document.getElementById('placar');
    if (pl) pl.value = '';
  },

  finalize() {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    const id = this.finalizeGameId;
    if (!id) {
      UI.showToast('Selecione um jogo para finalizar', 'error');
      return;
    }
    const placar = (document.getElementById('placar').value || '').trim();
    if (!placar) {
      UI.showToast('Informe o placar final', 'error');
      return;
    }

    const goleadores = {};
    document.querySelectorAll('[id^="gols-"]').forEach(input => {
      const qtd = parseInt(input.value) || 0;
      if (qtd > 0) goleadores[input.id.replace('gols-', '')] = qtd;
    });

    const assistencias = {};
    document.querySelectorAll('[id^="ast-"]').forEach(input => {
      const qtd = parseInt(input.value) || 0;
      if (qtd > 0) assistencias[input.id.replace('ast-', '')] = qtd;
    });

    const update = { placar, goleadores, assistencias, status: 'concluido' };
    db.ref('jogos/' + id).update(update).then(() => {
      AuthModule.logAction('finalizar_jogo', `Finalizou o jogo ${placar}`, { jogoId: id, placar, goleadores, assistencias });
      this.atualizarGols(goleadores);
      this.atualizarAssistencias(assistencias);
      UI.showToast('Jogo finalizado!', 'success');
      this.cancelFinalize();
      this.load();
    }).catch(err => {
      UI.showToast('Erro ao finalizar jogo', 'error');
      console.error(err);
    });
  }
};

// ===========================
// MÓDULO: ESTATÍSTICAS
// ===========================

const EstatisticasModule = {
  init() {
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <h1>📊 Estatísticas</h1>
      
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-content">
            <div class="stat-label">Vitórias</div>
            <div class="stat-value" id="totalVitorias">0</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🤝</div>
          <div class="stat-content">
            <div class="stat-label">Empates</div>
            <div class="stat-value" id="totalEmpates">0</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">❌</div>
          <div class="stat-content">
            <div class="stat-label">Derrotas</div>
            <div class="stat-value" id="totalDerrotas">0</div>
          </div>
        </div>
      </div>

      <h2 style="margin-top: 30px; margin-bottom: 20px;">Estatísticas dos Jogadores</h2>
      <div style="overflow-x: auto;">
        <table class="styled-table">
          <thead>
            <tr>
              <th>Jogador</th>
              <th>Posição</th>
              <th>⚽ Gols</th>
              <th>🎯 Assistências</th>
            </tr>
          </thead>
          <tbody id="stats-table"></tbody>
        </table>
      </div>
    `;
    
    this.load();
  },

  load() {
    // Carregar estatísticas dos jogadores
    db.ref('jogadores').once('value').then(jogadoresSnap => {
      const jogadores = jogadoresSnap.val() || {};
      
      // Carregar dados dos jogos para calcular estatísticas
      db.ref('jogos').once('value').then(jogosSnap => {
        const jogos = jogosSnap.val() || {};
        
        // Calcular vitórias, empates, derrotas
        this.calcularResultados(jogos);
        
        // Preparar dados dos jogadores
        const jogadoresArray = Object.values(jogadores).sort((a, b) => 
          a.nome.localeCompare(b.nome)
        );
        
        // Renderizar tabela
        this.renderTable(jogadoresArray);
      });
    });
  },

  calcularResultados(jogos) {
    let vitórias = 0;
    let empates = 0;
    let derrotas = 0;

    Object.values(jogos).forEach(jogo => {
      if (jogo.status === 'concluido' && jogo.placar) {
        const placar = jogo.placar.split('x').map(s => parseInt(s.trim()));
        
        if (placar[0] > placar[1]) {
          vitórias++;
        } else if (placar[0] < placar[1]) {
          derrotas++;
        } else {
          empates++;
        }
      }
    });

    document.getElementById('totalVitorias').textContent = vitórias;
    document.getElementById('totalEmpates').textContent = empates;
    document.getElementById('totalDerrotas').textContent = derrotas;
  },

  renderTable(jogadores) {
    const tabela = document.getElementById('stats-table');
    tabela.innerHTML = '';

    if (jogadores.length === 0) {
      tabela.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999;">Nenhum jogador cadastrado</td></tr>';
      return;
    }

    jogadores.forEach(j => {
      const gols = j.gols || 0;
      const assistencias = j.assistencias || 0;
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="font-weight: 600;">${j.nome}</td>
        <td>${j.posicao}</td>
        <td style="text-align: center; font-weight: 700; color: var(--primary-color);">${gols}</td>
        <td style="text-align: center; font-weight: 700; color: var(--accent-color);">${assistencias}</td>
      `;
      tabela.appendChild(row);
    });
  }
};

// ===========================
// MÓDULO: LOGS
// ===========================

const LogsModule = {
  init() {
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <h1>📋 Logs do Sistema</h1>
      
      <div class="form-container" style="margin-bottom: 20px;">
        <div class="form-row">
          <div class="form-column">
            <div class="form-group">
              <label for="filterLogsUsuario">Filtrar por Usuário</label>
              <input id="filterLogsUsuario" type="text" placeholder="Digite o login" onkeyup="LogsModule.applyFilters()">
            </div>
          </div>
          <div class="form-column">
            <div class="form-group">
              <label for="filterLogsAcao">Filtrar por Ação</label>
              <input id="filterLogsAcao" type="text" placeholder="Digite a ação" onkeyup="LogsModule.applyFilters()">
            </div>
          </div>
          <div class="form-column">
            <div class="form-group">
              <label for="filterLogsData">Filtrar por Data</label>
              <input id="filterLogsData" type="date" onchange="LogsModule.applyFilters()">
            </div>
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th style="min-width: 120px;">Data/Hora</th>
              <th style="min-width: 100px;">Usuário</th>
              <th style="min-width: 100px;">Perfil</th>
              <th style="min-width: 150px;">Ação</th>
              <th>Descrição</th>
            </tr>
          </thead>
          <tbody id="logs-table"></tbody>
        </table>
      </div>
    `;
    this.load();
  },

  load() {
    const tabela = document.getElementById('logs-table');
    UI.showLoading(tabela);

    const cutoffIso = new Date(Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    db.ref('logs')
      .orderByChild('timestamp')
      .startAt(cutoffIso)
      .limitToLast(500)
      .once('value')
      .then(snap => {
        const logs = [];
        snap.forEach(item => {
          logs.unshift(item.val());
        });
        
        this.allLogs = logs;
        this.applyFilters();
      }).catch(err => {
        UI.showToast('Erro ao carregar logs', 'error');
        console.error(err);
      });
  },

  applyFilters() {
    if (!this.allLogs) return;

    const filterUsuario = document.getElementById('filterLogsUsuario')?.value.toLowerCase() || '';
    const filterAcao = document.getElementById('filterLogsAcao')?.value.toLowerCase() || '';
    const filterData = document.getElementById('filterLogsData')?.value || '';

    const filtered = this.allLogs.filter(log => {
      const usuarioMatch = !filterUsuario || log.usuario.toLowerCase().includes(filterUsuario);
      const acaoMatch = !filterAcao || log.acao.toLowerCase().includes(filterAcao);
      const dataMatch = !filterData || log.data === filterData;
      
      return usuarioMatch && acaoMatch && dataMatch;
    });

    this.renderTable(filtered);
  },

  renderTable(logs) {
    const tabela = document.getElementById('logs-table');
    tabela.innerHTML = '';

    if (logs.length === 0) {
      tabela.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">Nenhum log encontrado</td></tr>';
      return;
    }

    logs.forEach(log => {
      const roleColor = log.role === 'admin' ? '#2563eb' : (log.role === 'diretor' ? '#f97316' : '#64748b');
      const roleName = log.role === 'admin' ? 'Admin' : (log.role === 'diretor' ? 'Diretor' : 'Jogador');
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="font-size: 13px;">${log.hora}</td>
        <td style="font-weight: 600;">${log.usuario}</td>
        <td><span style="display: inline-block; padding: 4px 10px; background: ${roleColor}; color: white; border-radius: 4px; font-size: 12px; font-weight: 600;">${roleName}</span></td>
        <td style="font-weight: 600;">${log.acao}</td>
        <td style="color: var(--text-secondary);">${log.descricao}</td>
      `;
      tabela.appendChild(row);
    });
  }
};

// ===========================
// MÓDULO: FINANCEIRO
// ===========================

const FinanceiroModule = {
  init() {
    const isReadOnly = AuthModule.currentUser?.role === 'jogador';
    const actionsHeader = isReadOnly ? '' : '<th>Ações</th>';
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <h1>💰 Financeiro</h1>
      <div class="form-row" id="financeiro-form-row" style="margin-bottom: 20px;">
        <div class="form-container">
          <h3>Nova Entrada</h3>
          <div class="form-row">
            <div class="form-column">
              <div class="form-group">
                <label for="valorEntrada">Valor</label>
                <input id="valorEntrada" type="number" min="0" step="0.01" placeholder="0,00">
              </div>
            </div>
            <div class="form-column">
              <div class="form-group">
                <label for="mesEntrada">Mês</label>
                <select id="mesEntrada"></select>
              </div>
            </div>
            <div class="form-column">
              <div class="form-group">
                <label for="categoriaEntrada">Categoria</label>
                <input id="categoriaEntrada" type="text" placeholder="Ex: Taxa jogadores">
              </div>
            </div>
          </div>
          <div class="action-row">
            <button class="btn-success" onclick="FinanceiroModule.adicionar('entrada')">✓ Salvar Entrada</button>
          </div>
        </div>
        <div class="form-container">
          <h3>Nova Saída</h3>
          <div class="form-row">
            <div class="form-column">
              <div class="form-group">
                <label for="valorSaida">Valor</label>
                <input id="valorSaida" type="number" min="0" step="0.01" placeholder="0,00">
              </div>
            </div>
            <div class="form-column">
              <div class="form-group">
                <label for="mesSaida">Mês</label>
                <select id="mesSaida"></select>
              </div>
            </div>
            <div class="form-column">
              <div class="form-group">
                <label for="categoriaSaida">Categoria</label>
                <input id="categoriaSaida" type="text" placeholder="Ex: Aluguel campo">
              </div>
            </div>
          </div>
          <div class="action-row">
            <button class="btn-danger" onclick="FinanceiroModule.adicionar('saida')">Salvar Saída</button>
          </div>
        </div>
      </div>
      <div class="form-container" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-size: 26px;">📦</div>
          <h3 id="caixa-total" style="color: var(--success-color); font-size: 22px; margin: 0;">Caixa Atual: R$ 0,00</h3>
          <button class="btn-primary" onclick="loadModule('menu')" style="margin-left: auto;">← Voltar</button>
        </div>
      </div>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              ${MESES.map(m => `<th style="min-width: 80px;">${m}</th>`).join('')}
              ${actionsHeader}
            </tr>
          </thead>
          <tbody id="tabela-financeiro"></tbody>
        </table>
      </div>
    `;

    MESES.forEach(mes => {
      document.getElementById('mesEntrada').innerHTML += `<option>${mes}</option>`;
      document.getElementById('mesSaida').innerHTML += `<option>${mes}</option>`;
    });

    if (isReadOnly) {
      const frm = document.getElementById('financeiro-form-row');
      if (frm) frm.style.display = 'none';
    }
    this.load();
  },

  adicionar(tipo, idExistente = null) {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    const valor = parseFloat(document.getElementById(`valor${tipo === 'entrada' ? 'Entrada' : 'Saida'}`).value);
    const mes = document.getElementById(`mes${tipo === 'entrada' ? 'Entrada' : 'Saida'}`).value;
    const categoria = document.getElementById(`categoria${tipo === 'entrada' ? 'Entrada' : 'Saida'}`).value.trim();

    if (!valor || !mes || !categoria) {
      UI.showToast('Preencha todos os campos', 'error');
      return;
    }

    const id = idExistente || db.ref().child('financeiro').push().key;
    
    db.ref('financeiro/' + id).set({
      id,
      tipo,
      valor,
      mes,
      categoria
    }).then(() => {
      const acao = idExistente ? 'editar_financeiro' : 'adicionar_financeiro';
      const descricao = `${idExistente ? 'Atualizou' : 'Registrou'} ${tipo === 'entrada' ? 'entrada' : 'saída'}: ${categoria}`;
      AuthModule.logAction(acao, descricao, { id, tipo, valor, mes, categoria });
      UI.showToast('Movimentação salva!', 'success');
      UI.clearInputs([`valor${tipo === 'entrada' ? 'Entrada' : 'Saida'}`, `categoria${tipo === 'entrada' ? 'Entrada' : 'Saida'}`]);
      this.load();
    }).catch(err => {
      UI.showToast('Erro ao salvar movimentação', 'error');
      console.error(err);
    });
  },

  load() {
    const tabela = document.getElementById('tabela-financeiro');
    UI.showLoading(tabela);

    // Buscar dados financeiros e mensalidades
    Promise.all([
      db.ref('financeiro').once('value'),
      db.ref('jogadores').once('value')
    ]).then(([snapFinanceiro, snapJogadores]) => {
      const dados = {};
      const registros = {};
      let totalEntradas = 0;
      let totalSaidas = 0;

      // Processar movimentações financeiras manuais
      snapFinanceiro.forEach(item => {
        const m = item.val();
        if (!dados[m.categoria]) dados[m.categoria] = {};
        dados[m.categoria][m.mes] = m;
        registros[m.id] = m;
        if (m.tipo === 'entrada') totalEntradas += m.valor;
        else totalSaidas += m.valor;
      });

      // Processar mensalidades pagas
      const jogadores = snapJogadores.val() || {};
      const mensalidades = {};
      
      Object.values(jogadores).forEach(jogador => {
        if (jogador.mensalidades && Array.isArray(jogador.mensalidades)) {
          jogador.mensalidades.forEach((mensal, idx) => {
            if (mensal && mensal.pago) {
              const mes = MESES[idx];
              if (!mensalidades[mes]) mensalidades[mes] = 0;
              mensalidades[mes] += (mensal.valorPago || mensal.valor || 0);
            }
          });
        }
      });

      // Adicionar linha de mensalidades ao dados
      if (Object.keys(mensalidades).length > 0) {
        dados['📝 Mensalidades Pagas'] = {};
        MESES.forEach(mes => {
          if (mensalidades[mes]) {
            dados['📝 Mensalidades Pagas'][mes] = {
              id: 'mensalidades-' + mes,
              tipo: 'entrada',
              valor: mensalidades[mes],
              mes: mes,
              categoria: '📝 Mensalidades Pagas',
              automatico: true
            };
            totalEntradas += mensalidades[mes];
          }
        });
      }

      tabela.innerHTML = '';

      if (Object.keys(dados).length === 0) {
        tabela.innerHTML = '<tr><td colspan="' + (MESES.length + 2) + '" style="text-align: center; color: #999;">Nenhuma movimentação cadastrada</td></tr>';
        document.getElementById('caixa-total').innerText = `Caixa Atual: R$ 0,00`;
        return;
      }

      for (const cat in dados) {
        let linha = `<tr><td><strong>${cat}</strong></td>`;
        MESES.forEach(m => {
          const item = dados[cat][m];
          linha += `<td>${item ? `<span style="color: ${item.tipo === 'entrada' ? 'var(--success-color)' : 'var(--danger-color)'}; font-weight: 600;">R$ ${item.valor.toFixed(2)}</span>` : ''}</td>`;
        });
        
        const ultimoMes = Object.keys(dados[cat]).pop();
        const idItem = dados[cat][ultimoMes].id;
        const ehAutomatico = dados[cat][ultimoMes].automatico;
        const isReadOnly = AuthModule.currentUser?.role === 'jogador';
        if (!isReadOnly) {
          linha += `<td>`;
          if (!ehAutomatico) {
            linha += `<button class="action-btn edit-btn" onclick="FinanceiroModule.editar('${idItem}')">Editar</button>
                     <button class="action-btn delete-btn" onclick="FinanceiroModule.remover('${idItem}')">Excluir</button>`;
          } else {
            linha += `<span style="font-size: 12px; color: var(--text-secondary);">Automático</span>`;
          }
          linha += `</td>`;
        }
        linha += `</tr>`;
        tabela.innerHTML += linha;
      }

      document.getElementById('caixa-total').innerText = `Caixa Atual: R$ ${(totalEntradas - totalSaidas).toFixed(2)}`;
    }).catch(err => {
      UI.showToast('Erro ao carregar financeiro', 'error');
      console.error(err);
    });
  },

  editar(id) {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    db.ref('financeiro/' + id).once('value').then(snap => {
      const m = snap.val();
      document.getElementById(`valor${m.tipo === 'entrada' ? 'Entrada' : 'Saida'}`).value = m.valor;
      document.getElementById(`mes${m.tipo === 'entrada' ? 'Entrada' : 'Saida'}`).value = m.mes;
      document.getElementById(`categoria${m.tipo === 'entrada' ? 'Entrada' : 'Saida'}`).value = m.categoria;
      window.scrollTo(0, 0);
    });
  },

  remover(id) {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    UI.showConfirm('Tem certeza que deseja excluir esta movimentação?', () => {
      db.ref('financeiro/' + id).once('value').then(snap => {
        const mov = snap.val() || {};
        db.ref('financeiro/' + id).remove().then(() => {
          AuthModule.logAction('remover_financeiro', `Removeu ${mov.tipo === 'entrada' ? 'entrada' : 'saída'}: ${mov.categoria || ''}`.trim(), { id, tipo: mov.tipo, valor: mov.valor, mes: mov.mes, categoria: mov.categoria });
          UI.showToast('Movimentação removida!', 'success');
          this.load();
        });
      });
    });
  }
};

// ===========================
// MÓDULO: MENU
// ===========================

const MenuModule = {
  init() {
    const role = AuthModule.currentUser?.role || '';

    const cards = [
      {
        id: 'jogadores',
        icon: '👥',
        title: 'Jogadores',
        desc: 'Gerencie seus jogadores, posições e dados',
        roles: ['diretor', 'admin']
      },
      {
        id: 'jogos',
        icon: '⚽',
        title: 'Jogos',
        desc: 'Registre partidas e acompanhe marcadores',
        roles: ['jogador', 'diretor', 'admin']
      },
      {
        id: 'estatisticas',
        icon: '📊',
        title: 'Estatísticas',
        desc: 'Acompanhe desempenho e resultados',
        roles: ['jogador', 'diretor', 'admin']
      },
      {
        id: 'financeiro',
        icon: '💰',
        title: 'Financeiro',
        desc: 'Controle receitas e despesas da equipe',
        roles: ['diretor', 'admin']
      },
      {
        id: 'logs',
        icon: '📋',
        title: 'Logs do Sistema',
        desc: 'Acompanhe todas as ações da plataforma',
        roles: ['admin']
      }
    ];

    const cardsHtml = cards
      .filter(card => card.roles.includes(role))
      .map(card => `
        <div class="dashboard-card" onclick="loadModule('${card.id}')" style="cursor: pointer;">
          <div style="font-size: 56px; margin-bottom: 16px;">${card.icon}</div>
          <div class="dashboard-card-title" style="margin-bottom: 10px;">${card.title}</div>
          <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">${card.desc}</div>
        </div>
      `).join('');

    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="menu-wrapper" style="padding: 40px 0; max-width: 100%; overflow: hidden;">
        <h1 class="welcome-title" style="font-size: 36px; margin-bottom: 15px; background: linear-gradient(135deg, var(--accent-color), #0891b2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700;">Bem-vindo ao Família 13</h1>
        <p class="welcome-subtitle" style="font-size: 17px; color: var(--text-secondary); margin-bottom: 50px;">Gerenciador profissional para sua equipe de futebol</p>
        <div class="dashboard-grid">${cardsHtml}</div>
      </div>
    `;
  }
};

// ===========================
// CONTROLE DE SIDEBAR MOBILE
// ===========================

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const hamburger = document.getElementById('hamburger-btn');
  
  if (sidebar && overlay && hamburger) {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    hamburger.classList.toggle('active');
    
    // Prevenir scroll do body quando sidebar estiver aberta
    if (sidebar.classList.contains('active')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
}

function closeSidebarOnMobile() {
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const hamburger = document.getElementById('hamburger-btn');
    
    if (sidebar && overlay && hamburger) {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
      hamburger.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
}

// ===========================
// CARREGADOR DE MÓDULOS
// ===========================

function loadModule(mod) {
  const modules = {
    'menu': MenuModule,
    'jogadores': JogadoresModule,
    'jogos': JogosModule,
    'estatisticas': EstatisticasModule,
    'financeiro': FinanceiroModule,
    'logs': LogsModule
  };

  if (modules[mod]) {
    modules[mod].init();
  }
}

// ===========================
// INICIALIZAÇÃO
// ===========================

window.addEventListener('DOMContentLoaded', () => {
  AuthModule.init();
});
