// ===========================
// MONITORAMENTO E ANALYTICS
// ===========================

// ⚙️ SENTRY: Error Monitoring & Tracking
// Inicializar Sentry para capturar erros críticos
if (window.Sentry) {
  Sentry.init({
    // NOTA: Configurar em variables.js ou environment
    dsn: 'https://seu-sentry-dsn@sentry.io/seu-project-id', // Substituir com DSN real
    environment: 'production', // 'development', 'staging', 'production'
    tracesSampleRate: 0.5, // 50% de eventos são rastreados
    attachStacktrace: true,
    maxBreadcrumbs: 50,
    beforeSend(event, hint) {
      // Filtrar informações sensíveis antes de enviar
      if (event.request) {
        event.request.cookies = undefined; // Remover cookies
        event.request.headers = undefined;
      }
      return event;
    }
  });
}

// 📊 GOOGLE ANALYTICS: User Behavior & Events
// Configuração básica de Google Analytics
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-XXXXXXXXXX', {
  'user_id': undefined, // Será setado após login
  'allow_google_signals': true,
  'allow_ad_personalization_signals': true
});

// 📈 FIREBASE ANALYTICS: Integração com Firebase
let analyticsEnabled = false;
let firebaseAnalytics = null;

/**
 * Inicializar Firebase Analytics após login
 */
function initFirebaseAnalytics() {
  try {
    if (!analyticsEnabled && typeof firebase !== 'undefined') {
      firebaseAnalytics = firebase.analytics();
      analyticsEnabled = true;
      console.log('[ANALYTICS] Firebase Analytics inicializado');
    }
  } catch (err) {
    console.warn('[ANALYTICS] Erro ao inicializar Firebase Analytics:', err);
  }
}

/**
 * MonitoringModule: Centraliza eventos e erros
 */
const MonitoringModule = {
  /**
   * Rastrear evento customizado
   * @param {string} eventName - Nome do evento
   * @param {object} params - Parâmetros do evento
   */
  trackEvent(eventName, params = {}) {
    try {
      // Google Analytics
      if (window.gtag) {
        gtag('event', eventName, params);
      }
      
      // Firebase Analytics
      if (firebaseAnalytics) {
        firebaseAnalytics.logEvent(eventName, params);
      }
      
      console.log(`[EVENT] ${eventName}:`, params);
    } catch (err) {
      console.error('[ANALYTICS] Erro ao rastrear evento:', err);
    }
  },

  /**
   * Rastrear página visualizada
   * @param {string} pageName - Nome da página/módulo
   * @param {string} pageTitle - Título da página
   */
  trackPageView(pageName, pageTitle = '') {
    try {
      if (window.gtag) {
        gtag('event', 'page_view', {
          'page_path': `/${pageName}`,
          'page_title': pageTitle || pageName
        });
      }
      
      if (firebaseAnalytics) {
        firebaseAnalytics.logEvent('page_view', {
          page_title: pageTitle || pageName,
          page_path: `/${pageName}`
        });
      }
      
      console.log(`[PAGE_VIEW] ${pageName}`);
    } catch (err) {
      console.error('[ANALYTICS] Erro ao rastrear página:', err);
    }
  },

  /**
   * Rastrear ação do usuário
   * @param {string} action - Tipo de ação
   * @param {string} category - Categoria da ação
   * @param {string} label - Label/descrição
   * @param {number} value - Valor (opcional)
   */
  trackAction(action, category, label = '', value = 0) {
    try {
      const eventParams = {
        'event_category': category,
        'event_label': label,
        ...(value > 0 && { 'value': value })
      };
      
      if (window.gtag) {
        gtag('event', action, eventParams);
      }
      
      if (firebaseAnalytics) {
        firebaseAnalytics.logEvent(action, {
          category: category,
          label: label,
          ...(value > 0 && { value: value })
        });
      }
      
      console.log(`[ACTION] ${action} > ${category} > ${label}`);
    } catch (err) {
      console.error('[ANALYTICS] Erro ao rastrear ação:', err);
    }
  },

  /**
   * Capturar exceção/erro
   * @param {Error} error - Objeto de erro
   * @param {object} context - Contexto adicional
   * @param {string} level - 'fatal', 'error', 'warning'
   */
  captureException(error, context = {}, level = 'error') {
    try {
      const errorData = {
        message: error?.message || 'Erro desconhecido',
        stack: error?.stack,
        ...context
      };
      
      // Sentry
      if (window.Sentry) {
        Sentry.captureException(error, {
          level: level,
          tags: context,
          extra: context
        });
      }
      
      // Google Analytics (como evento de erro)
      if (window.gtag) {
        gtag('event', 'exception', {
          'description': error?.message || 'Erro desconhecido',
          'fatal': level === 'fatal'
        });
      }
      
      console.error(`[ERROR] [${level.toUpperCase()}]`, errorData);
    } catch (err) {
      console.error('[MONITORING] Erro ao capturar exceção:', err);
    }
  },

  /**
   * Settar identificação do usuário
   * @param {string} userId - ID único do usuário
   * @param {object} userData - Dados do usuário
   */
  identifyUser(userId, userData = {}) {
    try {
      // Sentry
      if (window.Sentry) {
        Sentry.setUser({
          id: userId,
          ...userData
        });
      }
      
      // Google Analytics
      if (window.gtag) {
        gtag('config', 'G-XXXXXXXXXX', {
          'user_id': userId
        });
      }
      
      // Firebase Analytics
      if (firebaseAnalytics) {
        firebaseAnalytics.setUserId(userId);
        if (userData) {
          firebaseAnalytics.setUserProperties(userData);
        }
      }
      
      console.log('[MONITORING] Usuário identificado:', userId);
    } catch (err) {
      console.error('[MONITORING] Erro ao identificar usuário:', err);
    }
  },

  /**
   * Adicionar breadcrumb (rastreamento de ações anteriores)
   * @param {string} message - Mensagem do breadcrumb
   * @param {string} category - Categoria
   * @param {string} level - 'info', 'warning', 'error'
   */
  addBreadcrumb(message, category = 'default', level = 'info') {
    try {
      if (window.Sentry) {
        Sentry.addBreadcrumb({
          message,
          category,
          level,
          timestamp: Date.now() / 1000
        });
      }
    } catch (err) {
      console.error('[MONITORING] Erro ao adicionar breadcrumb:', err);
    }
  },

  /**
   * Rastrear performance (tempo de execução)
   * @param {string} name - Nome da operation
   * @param {Function} fn - Função a executar
   */
  async measurePerformance(name, fn) {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      // Sentry
      if (window.Sentry) {
        Sentry.captureMessage(`Performance: ${name} took ${duration.toFixed(2)}ms`, 'info');
      }
      
      // Analytics
      this.trackEvent('performance_metric', {
        operation_name: name,
        duration_ms: Math.round(duration)
      });
      
      console.log(`[PERFORMANCE] ${name}: ${duration.toFixed(2)}ms`);
      return result;
    } catch (err) {
      const duration = performance.now() - startTime;
      this.captureException(err, { operation: name, duration_ms: Math.round(duration) }, 'error');
      throw err;
    }
  }
};

// Capturar erros globais não tratados
window.addEventListener('error', (event) => {
  MonitoringModule.captureException(event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  }, 'error');
});

// Capturar erros de Promise não tratadas
window.addEventListener('unhandledrejection', (event) => {
  MonitoringModule.captureException(event.reason, {
    type: 'unhandledRejection',
    promise: event.promise
  }, 'error');
});

// ===========================
// MÓDULO: MULTI-TENANT (CLUBES)
// ===========================

/**
 * Gerencia o isolamento de dados por clube (multi-tenant)
 */
const ClubModule = {
  currentClubId: null,
  currentClubName: null,
  initRetries: 0, // Contador de tentativas
  
  /**
   * Inicializa o clube do usuário
   */
  async init(uid) {
    // Tentar obter clubId do localStorage primeiro (cache)
    const cachedClubId = localStorage.getItem('currentClubId');
    const cachedClubName = localStorage.getItem('currentClubName');

    if (cachedClubId && cachedClubName) {
      this.currentClubId = cachedClubId;
      this.currentClubName = cachedClubName;
      console.log('[CLUB] Clube carregado do cache:', cachedClubName);
      this.initRetries = 0; // Resetar contador
      return true;
    }
    
    // Buscar clubes do usuário
    try {
      console.log('[CLUB] Tentativa ' + (this.initRetries + 1) + ' de carregar clubes do banco');
      const snapshot = await db.ref(`userClubs/${uid}`).once('value');
      const userClubs = snapshot.val();
      
      if (!userClubs || Object.keys(userClubs).length === 0) {
        console.log('[CLUB] Nenhum clube encontrado - redirecionando para criação');
        this.initRetries = 0;
        return false;
      }
      
      // Pegar primeiro clube (ou último usado)
      const clubs = Object.values(userClubs);
      const club = clubs[0]; // Por enquanto, usa o primeiro clube
      
      this.currentClubId = club.clubId;
      this.currentClubName = club.clubName;
      
      // Salvar no cache
      localStorage.setItem('currentClubId', this.currentClubId);
      localStorage.setItem('currentClubName', this.currentClubName);
      
      console.log('[CLUB] Clube carregado:', this.currentClubName);
      this.initRetries = 0; // Resetar contador
      return true;
    } catch (err) {
      console.error('[CLUB] Erro ao carregar clube (tentativa ' + (this.initRetries + 1) + '):', err);
      
      // Tentar novamente até máximo de 3 tentativas
      if (this.initRetries < 3) {
        this.initRetries++;
        console.log('[CLUB] Tentando novamente em 500ms...');
        await new Promise(resolve => setTimeout(resolve, 500));
        return this.init(uid);
      }
      
      console.error('[CLUB] Falha permanente após 3 tentativas');
      return false;
    }
  },
  
  /**
   * Cria um novo clube
   */
  async createClub(clubName, creatorUid) {
    console.log('[CLUB] Criando novo clube:', clubName);
    
    const clubId = db.ref().child('clubs').push().key;
    const now = Date.now();
    
    const clubData = {
      info: {
        name: clubName,
        createdAt: now,
        createdBy: creatorUid
      },
      members: {
        [creatorUid]: {
          login: AuthModule.currentUser?.login || 'admin',
          email: AuthModule.firebaseUser?.email || '',
          nome: AuthModule.currentUser?.nome || 'Administrador',
          role: 'admin',
          status: 'approved',
          joinedAt: now
        }
      }
    };
    
    try {
      // Criar clube
      await db.ref(`clubs/${clubId}`).set(clubData);
      
      // Associar usuário ao clube
      await db.ref(`userClubs/${creatorUid}/${clubId}`).set({
        clubId: clubId,
        clubName: clubName,
        joinedAt: now
      });
      
      // Definir como clube atual
      this.currentClubId = clubId;
      this.currentClubName = clubName;
      localStorage.setItem('currentClubId', clubId);
      localStorage.setItem('currentClubName', clubName);
      
      console.log('[CLUB] Clube criado com sucesso:', clubId);
      return clubId;
    } catch (err) {
      console.error('[CLUB] Erro ao criar clube:', err);
      throw err;
    }
  },
  
  /**
   * Mostra interface para criar/selecionar clube
   */
  showClubSetup() {
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div style="max-width: 500px; margin: 60px auto; padding: 32px; background: var(--card-bg); border-radius: var(--border-radius-lg); box-shadow: var(--shadow-lg); border: 2px solid var(--border-color);">
        <h2 style="font-size: 28px; color: var(--text-primary); margin-bottom: 12px; font-weight: 700; text-align: center;">⚽ Bem-vindo!</h2>
        <p style="color: var(--text-secondary); margin-bottom: 32px; text-align: center; font-size: 15px;">Para começar, crie um clube para sua equipe</p>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 600;">Nome do Clube</label>
          <input type="text" id="clubNameInput" placeholder="Ex: Clube ABC" 
            style="width: 100%; padding: 12px 16px; border: 2px solid var(--border-color); border-radius: var(--border-radius); font-size: 15px; font-family: inherit;" />
        </div>
        
        <button id="createClubBtn" 
          style="width: 100%; padding: 14px; background: var(--gradient-primary); color: white; border: none; border-radius: var(--border-radius); font-size: 16px; font-weight: 600; cursor: pointer; transition: var(--transition);">
          Criar Clube
        </button>
        
        <p style="margin-top: 24px; text-align: center; font-size: 13px; color: var(--text-secondary);">
          💡 Entre em contato com o administrador se já existe um clube
        </p>
      </div>
    `;
    
    document.getElementById('createClubBtn').onclick = async () => {
      const clubName = document.getElementById('clubNameInput').value.trim();
      
      if (!clubName) {
        UI.showToast('Digite o nome do clube', 'error');
        return;
      }
      
      if (clubName.length < 3) {
        UI.showToast('Nome do clube deve ter pelo menos 3 caracteres', 'error');
        return;
      }
      
      const btn = document.getElementById('createClubBtn');
      btn.disabled = true;
      btn.textContent = 'Criando...';
      
      try {
        if (!AuthModule.firebaseUser) {
          throw new Error('Usuário não autenticado');
        }
        await this.createClub(clubName, AuthModule.firebaseUser.uid);
        UI.showToast(`Clube "${clubName}" criado com sucesso!`, 'success');
        
        // Recarregar para dashboard
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (err) {
        UI.showToast('Erro ao criar clube', 'error');
        console.error(err);
        btn.disabled = false;
        btn.textContent = 'Criar Clube';
      }
    };
  },

  /**
   * Retorna HTML com seletor de clube para admin global
   * Usado em Financeiro, Estatísticas e Jogadores
   */
  async getAdminGlobalClubSelector() {
    // Verificar se é admin global
    if (!AuthModule.currentUser?.platform_admin) {
      return null; // Não é admin global
    }

    try {
      // Carregar lista de clubes
      const clubsSnapshot = await db.ref('clubs').once('value');
      const clubs = clubsSnapshot.val() || {};
      const clubList = Object.entries(clubs).map(([id, data]) => ({
        id,
        name: data.info?.name || data.nome || 'Clube'
      }));

      if (clubList.length === 0) return null;

      // Obter clube selecionado no localStorage (se houver)
      const selectedClubId = localStorage.getItem('adminSelectedClubId') || clubList[0].id;
      const selectedClub = clubList.find(club => club.id === selectedClubId) || clubList[0];
      const selectedClubName = selectedClub.name;

      // Aplicar clube selecionado como atual
      ClubModule.currentClubId = selectedClubId;
      ClubModule.currentClubName = selectedClubName;
      localStorage.setItem('currentClubId', selectedClubId);
      localStorage.setItem('currentClubName', selectedClubName);
      localStorage.setItem('adminSelectedClubId', selectedClubId);
      localStorage.setItem('adminSelectedClubName', selectedClubName);

      let html = `
        <div style="background: var(--primary-color); padding: 12px 24px; display: flex; align-items: center; gap: 16px; color: white; font-weight: 600;">
          <span>🔑 Admin Global:</span>
          <select id="adminClubSelector" onchange="ClubModule.handleAdminClubChange(this.value, this.options[this.selectedIndex].text)" 
            style="padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.6); background: white; color: #333; font-weight: 600; cursor: pointer; font-size: 14px;">
            ${clubList.map(club => `<option value="${club.id}" ${club.id === selectedClubId ? 'selected' : ''}>${club.name}</option>`).join('')}
          </select>
        </div>
      `;

      return { html, clubs: clubList, selectedClubId, selectedClubName };
    } catch (err) {
      console.error('[CLUB] Erro ao carregar clubes para admin global:', err);
      return null;
    }
  },

  /**
   * Callback quando admin global muda de clube
   */
  handleAdminClubChange(clubId, clubName) {
    localStorage.setItem('adminSelectedClubId', clubId);
    localStorage.setItem('adminSelectedClubName', clubName || 'Clube');
    ClubModule.currentClubId = clubId;
    ClubModule.currentClubName = clubName || 'Clube';
    localStorage.setItem('currentClubId', clubId);
    localStorage.setItem('currentClubName', clubName || 'Clube');
    
    // Recarregar o módulo atual
    const currentModule = localStorage.getItem('currentModule') || 'menu';
    loadModule(currentModule);
  },

  /**
   * Limpa clube do cache (logout)
   */
  clear() {
    this.currentClubId = null;
    this.currentClubName = null;
    localStorage.removeItem('currentClubId');
    localStorage.removeItem('currentClubName');
  }
};

// ===========================
// MÓDULO: GESTÃO DE CLUBES (ADMIN)
// ===========================

const ClubManagementModule = {
  currentUsers: [],
  currentClubs: [],
  
  async load() {
    if (!AuthModule.isAdmin()) {
      UI.showToast('Acesso negado', 'error');
      loadModule('menu');
      return;
    }
    
    const container = document.getElementById('main-content');
    container.innerHTML = '<div style="padding: 20px; text-align: center;"><h2>Carregando...</h2></div>';
    
    try {
      // Carregar clubes
      await this.loadClubs();
      
      // Carregar usuários do Firebase Auth
      await this.loadUsers();
      
      this.render();
    } catch (err) {
      console.error('[CLUB_MANAGEMENT] Erro ao carregar:', err);
      UI.showToast('Erro ao carregar dados', 'error');
    }
  },
  
  async loadClubs() {
    const snapshot = await db.ref('clubs').once('value');
    const clubsData = snapshot.val() || {};
    
    this.currentClubs = Object.keys(clubsData).map(clubId => ({
      id: clubId,
      name: clubsData[clubId].info?.name || 'Sem nome',
      createdAt: clubsData[clubId].info?.createdAt || 0,
      membersCount: clubsData[clubId].members ? Object.keys(clubsData[clubId].members).length : 0
    }));
    
    console.log('[CLUB_MANAGEMENT] Clubes carregados:', this.currentClubs.length);
  },
  
  async loadUsers() {
    // Buscar todos os usuários de todos os clubes
    const usersMap = new Map();
    
    for (const club of this.currentClubs) {
      const snapshot = await db.ref(`clubs/${club.id}/members`).once('value');
      const members = snapshot.val() || {};
      
      Object.keys(members).forEach(uid => {
        if (!usersMap.has(uid)) {
          usersMap.set(uid, {
            uid: uid,
            email: members[uid].email || '',
            nome: members[uid].nome || '',
            role: members[uid].role || 'jogador',
            status: members[uid].status || 'approved',
            clubId: club.id,
            clubName: club.name
          });
        }
      });
    }
    
    this.currentUsers = Array.from(usersMap.values());
    console.log('[CLUB_MANAGEMENT] Usuários carregados:', this.currentUsers.length);
  },
  
  render() {
    const container = document.getElementById('main-content');
    
    const clubsHtml = this.currentClubs.map(club => `
      <div style="background: var(--card-bg); padding: 16px; border-radius: var(--border-radius); border-left: 4px solid var(--primary-color);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 600; font-size: 16px; color: var(--text-primary);">${club.name}</div>
            <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
              ID: <code style="background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; font-size: 12px;">${club.id}</code>
            </div>
            <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
              👥 ${club.membersCount} membro(s)
            </div>
          </div>
        </div>
      </div>
    `).join('');
    
    const usersHtml = this.currentUsers.map(user => {
      const isInactive = user.status === 'inactive';
      const rowStyle = isInactive ? 'opacity: 0.6; background: rgba(0,0,0,0.02);' : '';
      const statusColor = user.status === 'approved' ? '#4CAF50' : 
                         user.status === 'inactive' ? '#FF9800' : 
                         user.status === 'pending' ? '#2196F3' : '#f44336';
      
      return `
      <tr style="${rowStyle}">
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color);">
          <div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">${user.nome}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">${user.email}</div>
          ${isInactive ? '<div style="font-size: 11px; color: #FF9800; margin-top: 4px;">⏸️ Inativo</div>' : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color);">
          <select id="role-${user.uid}" style="padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--card-bg);" ${isInactive ? 'disabled' : ''}>
            <option value="jogador" ${user.role === 'jogador' ? 'selected' : ''}>Jogador</option>
            <option value="diretor" ${user.role === 'diretor' ? 'selected' : ''}>Diretor</option>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color);">
          <select id="club-${user.uid}" style="padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--card-bg);" ${isInactive ? 'disabled' : ''}>
            ${this.currentClubs.map(club => `
              <option value="${club.id}" ${user.clubId === club.id ? 'selected' : ''}>${club.name}</option>
            `).join('')}
          </select>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color);">
          <select id="status-${user.uid}" style="padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--card-bg);">
            <option value="approved" ${user.status === 'approved' ? 'selected' : ''}>Aprovado</option>
            <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inativo</option>
            <option value="pending" ${user.status === 'pending' ? 'selected' : ''}>Pendente</option>
            <option value="rejected" ${user.status === 'rejected' ? 'selected' : ''}>Rejeitado</option>
          </select>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color);">
          <button onclick="ClubManagementModule.updateUser('${user.uid}')" 
            style="padding: 6px 12px; background: var(--success-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
            💾 Salvar
          </button>
        </td>
      </tr>
    `;
    }).join('');
    
    container.innerHTML = `
      <div style="padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
          <div>
            <h1 style="font-size: 28px; margin-bottom: 8px;">🏢 Gestão de Clubes</h1>
            <p style="color: var(--text-secondary); margin: 0;">Gerencie clubes, usuários e permissões</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button onclick="ClubManagementModule.load()" 
              style="padding: 10px 20px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 600;">
              🔄 Recarregar Dados
            </button>
            <button onclick="ClubManagementModule.showCreateClubForm()" 
              style="padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 600;">
              ➕ Criar Novo Clube
            </button>
          </div>
        </div>
        
        <!-- Clubes Cadastrados -->
        <div style="margin-bottom: 40px;">
          <h2 style="font-size: 20px; margin-bottom: 16px; color: var(--text-primary);">⚽ Clubes Cadastrados</h2>
          <div style="display: grid; gap: 12px;">
            ${clubsHtml || '<p style="color: var(--text-secondary);">Nenhum clube cadastrado</p>'}
          </div>
        </div>
        
        <!-- Usuários e Vínculos -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h2 style="font-size: 20px; margin: 0; color: var(--text-primary);">👥 Usuários e Vínculos</h2>
            <button onclick="ClubManagementModule.showAddUserForm()" 
              style="padding: 8px 16px; background: var(--success-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600;">
              ➕ Adicionar Usuário ao Clube
            </button>
          </div>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; background: var(--card-bg); border-radius: var(--border-radius); overflow: hidden;">
              <thead>
                <tr style="background: var(--bg-secondary);">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-primary);">Usuário</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-primary);">Perfil</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-primary);">Clube</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-primary);">Status</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-primary);">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${usersHtml || '<tr><td colspan="5" style="padding: 20px; text-align: center; color: var(--text-secondary);">Nenhum usuário cadastrado</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },
  
  async updateUser(uid) {
    const newRole = document.getElementById(`role-${uid}`).value;
    const newClubId = document.getElementById(`club-${uid}`).value;
    const newStatus = document.getElementById(`status-${uid}`).value;
    
    const user = this.currentUsers.find(u => u.uid === uid);
    if (!user) {
      UI.showToast('Usuário não encontrado', 'error');
      return;
    }
    
    try {
      const oldClubId = user.clubId;
      const newClub = this.currentClubs.find(c => c.id === newClubId);
      
      // Se mudou de clube, mover dados
      if (oldClubId !== newClubId) {
        // Buscar dados antigos
        const oldDataSnap = await db.ref(`clubs/${oldClubId}/members/${uid}`).once('value');
        const userData = oldDataSnap.val();
        
        if (userData) {
          // Atualizar dados com novas informações
          userData.role = newRole;
          userData.status = newStatus;
          
          // Remover do clube antigo
          await db.ref(`clubs/${oldClubId}/members/${uid}`).remove();
          
          // Adicionar ao novo clube
          await db.ref(`clubs/${newClubId}/members/${uid}`).set(userData);
          
          // Atualizar userClubs
          await db.ref(`userClubs/${uid}/${oldClubId}`).remove();
          await db.ref(`userClubs/${uid}/${newClubId}`).set({
            clubId: newClubId,
            clubName: newClub.name,
            joinedAt: Date.now()
          });
        }
      } else {
        // Apenas atualizar role e status no mesmo clube
        await db.ref(`clubs/${oldClubId}/members/${uid}`).update({
          role: newRole,
          status: newStatus
        });
      }
      
      UI.showToast('Usuário atualizado com sucesso!', 'success');
      
      // Atualizar Custom Claims se necessário
      console.log('[CLUB_MANAGEMENT] Usuário atualizado. Execute set-custom-claims.js para sincronizar JWT.');
      
      // Recarregar dados
      await this.load();
    } catch (err) {
      console.error('[CLUB_MANAGEMENT] Erro ao atualizar usuário:', err);
      UI.showToast('Erro ao atualizar usuário', 'error');
    }
  },
  
  showCreateClubForm() {
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div style="padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="margin-bottom: 30px;">
          <button onclick="ClubManagementModule.load()" 
            style="padding: 8px 16px; background: var(--bg-secondary); color: var(--text-primary); border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
            ← Voltar
          </button>
        </div>
        
        <h1 style="font-size: 28px; margin-bottom: 8px;">➕ Criar Novo Clube</h1>
        <p style="color: var(--text-secondary); margin-bottom: 30px;">Preencha os dados do novo clube</p>
        
        <div style="background: var(--card-bg); padding: 30px; border-radius: var(--border-radius); box-shadow: var(--shadow);">
          <form id="form-create-club" onsubmit="ClubManagementModule.createClub(event); return false;">
            <div style="margin-bottom: 20px;">
              <label for="club-name" style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">
                Nome do Clube *
              </label>
              <input 
                type="text" 
                id="club-name" 
                placeholder="Ex: Clube ABC" 
                required
                style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 14px; background: var(--bg-primary);"
              >
            </div>
            
            <div style="margin-bottom: 20px;">
              <label for="club-description" style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">
                Descrição
              </label>
              <textarea 
                id="club-description" 
                placeholder="Descrição do clube (opcional)" 
                rows="3"
                style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 14px; background: var(--bg-primary); resize: vertical;"
              ></textarea>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label for="club-city" style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">
                Cidade
              </label>
              <input 
                type="text" 
                id="club-city" 
                placeholder="Ex: São Paulo" 
                style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 14px; background: var(--bg-primary);"
              >
            </div>
            
            <button 
              type="submit" 
              id="btn-create-club"
              style="width: 100%; padding: 14px; background: var(--success-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: 600;"
            >
              ✅ Criar Clube
            </button>
          </form>
        </div>
      </div>
    `;
  },
  
  async createClub(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('club-name');
    const descInput = document.getElementById('club-description');
    const cityInput = document.getElementById('club-city');
    const submitBtn = document.getElementById('btn-create-club');
    
    const clubName = nameInput.value.trim();
    
    if (!clubName) {
      UI.showToast('Nome do clube é obrigatório', 'error');
      return;
    }
    
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Criando...';
      
      // Criar ID único para o clube
      const newClubRef = db.ref('clubs').push();
      const clubId = newClubRef.key;
      
      // Dados do clube
      const clubData = {
        info: {
          name: clubName,
          description: descInput.value.trim() || '',
          city: cityInput.value.trim() || '',
          createdAt: Date.now(),
          createdBy: AuthModule.firebaseUser?.uid || 'admin'
        },
        members: {},
        jogadores: {},
        jogos: {},
        financeiro: {},
        logs: {}
      };
      
      // Salvar no banco
      await newClubRef.set(clubData);
      
      console.log('[CLUB_MANAGEMENT] Clube criado:', clubId);
      
      // Adicionar automaticamente todos os admins globais ao novo clube
      try {
        const adminsSnapshot = await db.ref('admins').once('value');
        const admins = adminsSnapshot.val() || {};
        
        for (const adminUid in admins) {
          const admin = admins[adminUid];
          if (admin && admin.status === 'active') {
            console.log(`[CLUB_MANAGEMENT] Adicionando admin global ${admin.email} ao novo clube`);
            await db.ref(`clubs/${clubId}/members/${adminUid}`).set({
              uid: adminUid,
              email: admin.email,
              nome: admin.nome,
              role: 'admin',
              status: 'approved',
              joinedAt: new Date().toISOString(),
              addedBy: 'system',
              type: 'platform-admin'
            });
            
            // Adicionar clube à lista de clubes do admin
            await db.ref(`userClubs/${adminUid}/${clubId}`).set({
              clubId: clubId,
              clubName: clubName,
              joinedAt: new Date().toISOString(),
              role: 'admin',
              type: 'platform-admin'
            });
          }
        }
      } catch (err) {
        console.error('[CLUB_MANAGEMENT] Erro ao adicionar admins globais:', err);
        // Não interrompe o fluxo se falhar
      }
      
      UI.showToast(`✅ Clube "${clubName}" criado com sucesso!`, 'success');
      
      // Voltar para lista
      setTimeout(() => {
        this.load();
      }, 1500);
      
    } catch (err) {
      console.error('[CLUB_MANAGEMENT] Erro ao criar clube:', err);
      UI.showToast('Erro ao criar clube', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = '✅ Criar Clube';
    }
  },
  
  showAddUserForm() {
    const container = document.getElementById('main-content');
    
    const clubsOptions = this.currentClubs.map(club => 
      `<option value="${club.id}">${club.name}</option>`
    ).join('');
    
    container.innerHTML = `
      <div style="padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="margin-bottom: 30px;">
          <button onclick="ClubManagementModule.load()" 
            style="padding: 8px 16px; background: var(--bg-secondary); color: var(--text-primary); border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
            ← Voltar
          </button>
        </div>
        
        <h1 style="font-size: 28px; margin-bottom: 8px;">➕ Adicionar Usuário ao Clube</h1>
        <p style="color: var(--text-secondary); margin-bottom: 30px;">Vincule um usuário registrado a um clube</p>
        
        <div style="background: var(--card-bg); padding: 30px; border-radius: var(--border-radius); box-shadow: var(--shadow);">
          <form id="form-add-user" onsubmit="ClubManagementModule.addUserToClub(event); return false;">
            <div style="margin-bottom: 20px;">
              <label for="user-email" style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">
                Email do Usuário *
              </label>
              <input 
                type="email" 
                id="user-email" 
                placeholder="Ex: douglas.souza@dmsconsulting.com.br" 
                required
                style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 14px; background: var(--bg-primary);"
              >
              <small style="color: var(--text-secondary); font-size: 12px; display: block; margin-top: 4px;">
                O usuário deve estar registrado no sistema
              </small>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label for="user-club" style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">
                Clube *
              </label>
              <select 
                id="user-club" 
                required
                style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 14px; background: var(--bg-primary);"
              >
                <option value="">Selecione um clube</option>
                ${clubsOptions}
              </select>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label for="user-role" style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">
                Perfil *
              </label>
              <select 
                id="user-role" 
                required
                style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 14px; background: var(--bg-primary);"
              >
                <option value="jogador">Jogador</option>
                <option value="diretor">Diretor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label for="user-status" style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">
                Status *
              </label>
              <select 
                id="user-status" 
                required
                style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 14px; background: var(--bg-primary);"
              >
                <option value="approved" selected>Aprovado</option>
                <option value="pending">Pendente</option>
                <option value="rejected">Rejeitado</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              id="btn-add-user"
              style="width: 100%; padding: 14px; background: var(--success-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: 600;"
            >
              ✅ Adicionar Usuário
            </button>
          </form>
        </div>
      </div>
    `;
  },
  
  async addUserToClub(event) {
    event.preventDefault();
    
    const emailInput = document.getElementById('user-email');
    const clubSelect = document.getElementById('user-club');
    const roleSelect = document.getElementById('user-role');
    const statusSelect = document.getElementById('user-status');
    const submitBtn = document.getElementById('btn-add-user');
    
    const email = emailInput.value.trim();
    const clubId = clubSelect.value;
    const role = roleSelect.value;
    const status = statusSelect.value;
    
    if (!email || !clubId || !role || !status) {
      UI.showToast('Preencha todos os campos', 'error');
      return;
    }
    
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Adicionando...';
      
      // Buscar usuário no Firebase Auth pelo email
      // Como não temos acesso direto do client ao Admin SDK, vamos tentar buscar pelo email nos usuários existentes
      // ou simplesmente assumir que o UID será gerado corretamente
      
      // Obter clube
      const club = this.currentClubs.find(c => c.id === clubId);
      if (!club) {
        throw new Error('Clube não encontrado');
      }
      
      // Gerar UID baseado no email (Firebase usa hash do email)
      // IMPORTANTE: Isso é uma simulação - o ideal seria usar Cloud Function
      const tempUid = 'temp_' + Date.now();
      
      UI.showToast('⚠️ Função em desenvolvimento. Use o console do Firebase para obter o UID correto do usuário.', 'warning');
      UI.showToast('Para adicionar: 1) Obtenha o UID em Authentication. 2) Adicione manualmente em Database.', 'info');
      
      submitBtn.disabled = false;
      submitBtn.textContent = '✅ Adicionar Usuário';
      
      // Mostrar instruções
      alert(`Para adicionar ${email}:\n\n1. Acesse Firebase Console → Authentication\n2. Encontre o usuário e copie o UID\n3. Em Database, crie:\n   /clubs/${clubId}/members/{UID}\n   /userClubs/{UID}/${clubId}\n\n4. Execute: node set-custom-claims.js set ${email} ${role} ${clubId}`);
      
    } catch (err) {
      console.error('[CLUB_MANAGEMENT] Erro ao adicionar usuário:', err);
      UI.showToast('Erro ao adicionar usuário: ' + err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = '✅ Adicionar Usuário';
    }
  }
};

// ===========================
// UTILIDADE: PAGINAÇÃO
// ===========================

/**
 * PaginationHelper - Gerencia paginação cursor-based para listas grandes
 * 
 * Estratégia:
 * - Carrega apenas PAGE_SIZE itens por página
 * - Usa cursor (lastKey) para navegar entre páginas
 * - Reduz DOM overhead e melhora performance
 * 
 * Uso:
 * const pag = new PaginationHelper({
 *   pageSize: 30,
 *   containerSelector: '#logs-table',
 *   renderFunction: (items) => { ... }
 * });
 * 
 * pag.loadFirstPage(query);
 * pag.nextPage();
 * pag.previousPage();
 */
class PaginationHelper {
  constructor(options = {}) {
    this.pageSize = options.pageSize || 30;
    this.containerSelector = options.containerSelector || '';
    this.renderFunction = options.renderFunction || null;
    
    // Estado da paginação
    this.currentPage = 1;
    this.pages = []; // Array de [items, cursor] para cada página
    this.currentPageIndex = 0;
    this.isLoading = false;
    this.hasNextPage = false;
    
    // Para navegação backward
    this.firstKeyEachPage = {}; // {pageIndex: firstKey}
  }

  /**
   * Carrega primeira página com base em uma query Firebase
   * @param {Function} queryBuilder - Função que retorna uma query firebase
   * @returns {Promise<boolean>} true se carregou, false se vazio
   */
  async loadFirstPage(queryBuilder) {
    if (this.isLoading) return false;
    
    this.isLoading = true;
    try {
      // Carregar primeira página: limitToFirst(pageSize + 1) para verificar se há próxima página
      const snapshot = await queryBuilder()
        .limitToFirst(this.pageSize + 1)
        .once('value');
      
      const data = snapshot.val();
      if (!data) {
        this.pages = [];
        this.currentPageIndex = 0;
        this.currentPage = 1;
        this.hasNextPage = false;
        this.render([]);
        return false;
      }

      const items = [];
      let cursor = null;
      let keyCount = 0;

      snapshot.forEach(item => {
        keyCount++;
        cursor = item.key;
        
        // Se for além do pageSize, não incluir nesta página (sinala que há próxima)
        if (keyCount <= this.pageSize) {
          items.push({ key: item.key, ...item.val() });
        }
      });

      // Se carregou mais de pageSize items, há próxima página
      this.hasNextPage = keyCount > this.pageSize;

      this.pages = [{ items, cursor: items[items.length - 1]?.key || cursor }];
      this.currentPageIndex = 0;
      this.currentPage = 1;
      this.firstKeyEachPage[0] = items[0]?.key;
      
      this.render(items);
      return items.length > 0;
    } catch (err) {
      console.error('[Pagination] Erro ao carregar primeira página:', err);
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Carrega próxima página
   * @param {Function} queryBuilder - Função que retorna query Firebase
   * @returns {Promise<boolean>} true se carregou, false se estiver na última página
   */
  async nextPage(queryBuilder) {
    if (this.isLoading || !this.hasNextPage) return false;

    this.isLoading = true;
    try {
      const currentCursor = this.pages[this.currentPageIndex]?.cursor;
      if (!currentCursor) return false;

      const snapshot = await queryBuilder()
        .startAfter(currentCursor)
        .limitToFirst(this.pageSize + 1)
        .once('value');

      const data = snapshot.val();
      if (!data) {
        this.hasNextPage = false;
        return false;
      }

      const items = [];
      let cursor = null;
      let keyCount = 0;

      snapshot.forEach(item => {
        keyCount++;
        cursor = item.key;
        if (keyCount <= this.pageSize) {
          items.push({ key: item.key, ...item.val() });
        }
      });

      this.hasNextPage = keyCount > this.pageSize;
      
      const pageIndex = this.currentPageIndex + 1;
      this.pages[pageIndex] = { items, cursor: items[items.length - 1]?.key || cursor };
      this.firstKeyEachPage[pageIndex] = items[0]?.key;
      
      this.currentPageIndex = pageIndex;
      this.currentPage = pageIndex + 1;
      
      this.render(items);
      return true;
    } catch (err) {
      console.error('[Pagination] Erro ao carregar próxima página:', err);
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Volta para página anterior
   * @param {Function} queryBuilder - Função que retorna query Firebase
   * @returns {Promise<boolean>} true se carregou, false se estiver na primeira página
   */
  async previousPage(queryBuilder) {
    if (this.isLoading || this.currentPageIndex === 0) return false;

    this.isLoading = true;
    try {
      const nextPageIndex = this.currentPageIndex;
      const prevPageIndex = this.currentPageIndex - 1;

      // Se já carregou esta página antes, apenas renderizar
      if (this.pages[prevPageIndex]) {
        this.currentPageIndex = prevPageIndex;
        this.currentPage = prevPageIndex + 1;
        this.hasNextPage = true; // Sempre há próxima se temos página anterior
        this.render(this.pages[prevPageIndex].items);
        return true;
      }

      // Caso raro: página anterior não foi carregada
      return false;
    } catch (err) {
      console.error('[Pagination] Erro ao voltar página:', err);
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Renderiza items na página
   * @param {Array} items - Items a renderizar
   */
  render(items) {
    if (this.renderFunction && typeof this.renderFunction === 'function') {
      this.renderFunction(items);
    }
  }

  /**
   * Retorna informações sobre a paginação
   */
  getPaginationInfo() {
    const pageSize = this.pages[this.currentPageIndex]?.items?.length || 0;
    return {
      currentPage: this.currentPage,
      pageSize: pageSize,
      isLoading: this.isLoading,
      canPrevious: this.currentPageIndex > 0,
      canNext: this.hasNextPage
    };
  }

  /**
   * Reseta paginação
   */
  reset() {
    this.currentPage = 1;
    this.pages = [];
    this.currentPageIndex = 0;
    this.isLoading = false;
    this.hasNextPage = false;
    this.firstKeyEachPage = {};
  }
}

/**
 * Helper para criar referências ao banco com isolamento por clube
 * @param {string} path - Caminho relativo (ex: 'jogadores', 'jogos')
 * @returns {firebase.database.Reference}
 */
function dbRef(path = '') {
  if (!ClubModule.currentClubId) {
    console.error('[DB] ClubId não definido! Não é possível acessar dados.');
    throw new Error('ClubId não definido');
  }
  
  const clubPath = `clubs/${ClubModule.currentClubId}`;
  const fullPath = path ? `${clubPath}/${path}` : clubPath;
  
  return db.ref(fullPath);
}

/**
 * Versão segura de dbRef que retorna null se clubId não estiver definido
 * Útil durante inicialização quando clubId pode não estar carregado
 */
function dbRefSafe(path = '') {
  if (!ClubModule.currentClubId) {
    console.warn('[DB] ClubId não definido em dbRefSafe - retornando null');
    return null;
  }
  
  const clubPath = `clubs/${ClubModule.currentClubId}`;
  const fullPath = path ? `${clubPath}/${path}` : clubPath;
  
  return db.ref(fullPath);
}

// ===========================
// MÓDULO: AUTENTICAÇÃO
// ===========================

console.log('[FAMILIA13] app.js carregado');

// ===========================
// FUNÇÕES DE SEGURANÇA (XSS Prevention)
// ===========================

/**
 * Escapa caracteres especiais de HTML para prevenir XSS
 * @param {string} text - Texto a ser escapado
 * @returns {string} Texto seguro para usar em HTML
 */
function escapeHTML(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Cria um elemento HTML de forma segura com atributos
 * @param {string} tag - Nome da tag (ex: 'div', 'button')
 * @param {object} options - { text, html, class, id, attrs: {...} }
 * @returns {HTMLElement} Elemento criado
 */
function createSafeElement(tag, options = {}) {
  const element = document.createElement(tag);
  
  if (options.text) {
    element.textContent = options.text; // Texto seguro
  }
  
  if (options.html) {
    // Usar apenas quando você controla totalmente o HTML (não dados do banco)
    element.innerHTML = options.html;
  }
  
  if (options.class) {
    element.className = options.class;
  }
  
  if (options.id) {
    element.id = options.id;
  }
  
  if (options.style) {
    Object.assign(element.style, options.style);
  }
  
  // Atributos seguros - sempre usando setAttribute
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, value]) => {
      if (typeof value === 'string') {
        element.setAttribute(key, value);
      }
    });
  }
  
  // Event listeners seguros (sem usar onclick inline)
  if (options.onclick) {
    element.addEventListener('click', options.onclick);
  }
  
  return element;
}

/**
 * Cria onclick handler seguro (não usa string de código)
 * @param {function} callback - Função a executar
 * @returns {function} Wrapper seguro
 */
function safeClickHandler(callback) {
  return function(e) {
    e.preventDefault?.();
    callback(e);
  };
}

// ===========================
// MÓDULO: AUTENTICAÇÃO (AUTH)
// ===========================

/**
 * Gerencia autenticação e autorização com Firebase Auth + Custom Claims
 * 
 * ARQUITETURA RBAC (Role-Based Access Control):
 * - Roles: admin, diretor, jogador
 * - Armazenamento duplo:
 *   1. Database (/clubs/{clubId}/members/{uid}/role) - Fonte primária, editável
 *   2. Custom Claims (JWT token) - Cache rápido, validado nas Rules
 * 
 * CUSTOM CLAIMS (JWT Token):
 * - Estrutura: { role, clubId, clubName, updatedAt }
 * - Vantagens: Validação server-side, sem leitura do database, tamper-proof
 * - Sincronização: Executar `node set-custom-claims.js sync` após mudanças
 * - Atualização: Usuário deve fazer logout/login ou chamar refreshToken()
 * 
 * FLUXO DE AUTENTICAÇÃO:
 * 1. Login → getTokenClaims() busca role do JWT token
 * 2. Se token tem role → usa it (rápido, seguro)
 * 3. Se token não tem role → busca no database (fallback)
 * 4. Firebase Rules validam com auth.token.role (sem consulta ao DB)
 * 
 * MÉTODOS PRINCIPAIS:
 * - getTokenClaims(): Lê Custom Claims do token JWT
 * - refreshToken(): Força atualização do token (pega novos Claims)
 * - forceTokenRefreshAndReload(): Atualiza token e recarrega página
 * 
 * MUDANÇA DE ROLE:
 * 1. Admin muda role no database → dbRef('members/{uid}/role').set(newRole)
 * 2. Admin executa no servidor → node set-custom-claims.js set email@example.com newRole clubId
 * 3. Usuário afetado faz logout/login OU chama forceTokenRefreshAndReload()
 * 4. Novas permissões entram em vigor
 */
const AuthModule = {
  currentUser: null,
  firebaseUser: null,
  isRegistering: false,
  isInitializing: true,
  loadUserDataRetries: 0, // Contador de tentativas de loadUserData
  
  init() {
    console.log('[AUTH] Inicializando autenticação');
    console.log('[AUTH] User logado antes?', this.firebaseUser?.email);
    console.log('[AUTH] ClubId em cache?', localStorage.getItem('currentClubId'));
    
    // Observer de estado de autenticação do Firebase
    firebase.auth().onAuthStateChanged(user => {
      console.log('[AUTH] onAuthStateChanged disparado:', user?.email || 'null');
      console.log('[AUTH] isInitializing?', this.isInitializing);
      
      if (user) {
        console.log('[AUTH] Usuário autenticado:', user.email);
        this.firebaseUser = user;
        this.isInitializing = false;
        this.loadUserDataRetries = 0; // Resetar contador de tentativas
        // Buscar dados do usuário no database
        this.loadUserData(user.uid);
      } else {
        // Se ainda está inicializando, não fazer nada (firebase carregando sessão)
        if (this.isInitializing) {
          console.log('[AUTH] Sistema inicializando, aguardando sessão do Firebase...');
          return;
        }
        
        console.log('[AUTH] Nenhum usuário autenticado');
        this.currentUser = null;
        this.firebaseUser = null;
        this.loadUserDataRetries = 0;
        // Resetar botão quando fazer logout
        const btnLogin = document.querySelector('.btn-login');
        if (btnLogin) {
          btnLogin.disabled = false;
          btnLogin.textContent = '→ Entrar';
        }
        this.showLogin();
      }
    });
    
    // Se não há usuário após 5 segundos, assumir que ninguém está logado
    setTimeout(() => {
      console.log('[AUTH] Verificando timeout: isInitializing=' + this.isInitializing + ', firebaseUser=' + (this.firebaseUser?.email || 'null'));
      if (this.isInitializing && !this.firebaseUser) {
        console.log('[AUTH] Timeout de inicialização - mostrando tela de login');
        this.isInitializing = false;
        this.showLogin();
      }
    }, 5000);
  },

  /**
   * Força atualização do token do usuário (para receber novos Custom Claims)
   * Deve ser chamado após mudanças de role ou clubId
   */
  async refreshToken() {
    if (!this.firebaseUser) {
      console.warn('[AUTH] Nenhum usuário logado para refresh de token');
      return null;
    }
    
    try {
      console.log('[AUTH] Forçando refresh do token...');
      // Force refresh: true para obter novo token do servidor
      const idTokenResult = await this.firebaseUser.getIdTokenResult(true);
      console.log('[AUTH] Token atualizado:', {
        claims: idTokenResult.claims,
        issuedAt: new Date(idTokenResult.issuedAtTime),
        expiresAt: new Date(idTokenResult.expirationTime)
      });
      return idTokenResult;
    } catch (error) {
      console.error('[AUTH] Erro ao atualizar token:', error);
      return null;
    }
  },

  /**
   * Obtém Custom Claims do token JWT do usuário
   * Retorna: { role, clubId, clubName, updatedAt } ou null
   */
  async getTokenClaims() {
    if (!this.firebaseUser) {
      console.warn('[AUTH] Nenhum usuário logado para obter claims');
      return null;
    }
    
    try {
      // false = não força refresh (usa token cached)
      const idTokenResult = await this.firebaseUser.getIdTokenResult(false);
      const claims = idTokenResult.claims;
      
      // Extrair Custom Claims (se existirem)
      if (claims.role || claims.clubId || claims.platform_admin) {
        console.log('[AUTH] Custom Claims encontrados no token:', {
          role: claims.role,
          clubId: claims.clubId,
          clubName: claims.clubName,
          platform_admin: claims.platform_admin,
          updatedAt: claims.updatedAt ? new Date(claims.updatedAt) : null
        });
        return {
          role: claims.role || null,
          clubId: claims.clubId || null,
          clubName: claims.clubName || null,
          platform_admin: claims.platform_admin || false,
          updatedAt: claims.updatedAt || null
        };
      } else {
        console.log('[AUTH] Nenhum Custom Claim encontrado no token');
        return null;
      }
    } catch (error) {
      console.error('[AUTH] Erro ao obter Custom Claims:', error);
      return null;
    }
  },

  async loadUserData(uid) {
    if (this.isRegistering) {
      console.log('[AUTH] Registro em andamento, ignorando loadUserData');
      return;
    }

    // Validação de segurança - se firebaseUser for null, logout aconteceu
    if (!this.firebaseUser) {
      console.log('[AUTH] firebaseUser é null - usuário pode ter feito logout');
      return;
    }
    
    // Tentar obter Custom Claims do token primeiro (mais rápido e seguro)
    const tokenClaims = await this.getTokenClaims();
    
    // Inicializar clube do usuário
    try {
      const hasClub = await ClubModule.init(uid);
      
      if (!hasClub) {
        // VERIFICAÇÃO ESPECIAL: Pode ser primeiro login de usuário recém-criado
        // Race condition: userClubs ainda não replicou, mas clubs/members já existe
        console.log('[AUTH] ClubModule.init retornou false - verificando firstLoginRequired em clubes');
        
        try {
          const clubsSnap = await db.ref('clubs').once('value');
          const allClubs = clubsSnap.val() || {};
          
          for (const [clubId, clubData] of Object.entries(allClubs)) {
            const memberData = clubData?.members?.[uid];
            if (memberData && memberData.firstLoginRequired === true) {
              console.log('[AUTH] ✅ Usuário encontrado em clube com firstLoginRequired:', clubId);
              
              // Configurar clube temporariamente
              ClubModule.currentClubId = clubId;
              ClubModule.currentClubName = clubData?.info?.name || clubData?.nome || 'Clube';
              
              // Mostrar modal de primeira senha
              this.showFirstLoginModal(uid);
              return;
            }
          }
        } catch (searchErr) {
          console.error('[AUTH] Erro ao buscar firstLoginRequired:', searchErr);
        }
        
        // Se não encontrou firstLoginRequired, verificar se é pending
        const pendingSnap = await db.ref(`pendingUsers/${uid}`).once('value');
        if (pendingSnap.exists()) {
          console.log('[AUTH] Usuário pendente sem clube - bloqueando acesso');
          this.currentUser = {
            uid: uid,
            email: this.firebaseUser?.email || '',
            status: 'pending',
            bloqueado: true
          };
          // Mostrar tela de aguardando aprovação
          document.getElementById('login-container').style.display = 'none';
          document.getElementById('app-container').style.display = 'none';
          document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #3b82f6, #0ea5e9); font-family: system-ui;">
              <div style="background: white; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 400px;">
                <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
                <h2 style="color: #1f2937; margin-bottom: 10px; font-size: 22px;">Aguardando Aprovação</h2>
                <p style="color: #6b7280; margin-bottom: 20px; line-height: 1.6;">Sua solicitação de acesso está sendo analisada pelos administradores.<br><br>Você receberá uma notificação quando for aprovado.</p>
                <button onclick="firebase.auth().signOut(); location.reload();" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">Fazer Logout</button>
              </div>
            </div>
          `;
          return;
        }

        console.log('[AUTH] Usuário sem clube - mostrando setup');
        // Definir currentUser básico para evitar erros
        this.currentUser = {
          uid: uid,
          email: this.firebaseUser?.email || '',
          nome: this.firebaseUser?.displayName || 'Usuário',
          semClube: true
        };
        this.showApp();
        // Usar setTimeout para evitar que erros do setup sejam capturados aqui
        setTimeout(() => {
          ClubModule.showClubSetup();
        }, 0);
        return;
      }
      
      // Buscar dados do usuário no clube
      const snap = await dbRef(`members/${uid}`).once('value');
      let userData = snap.val();
      
      // Se userData null mas ClubModule.init retornou true, pode ser race condition
      // onde userClubs replicou MAS members ainda não - buscar em todos os clubes
      if (!userData && ClubModule.currentClubId) {
        console.log('[AUTH] userData null mas clube inicializado - buscando em todos os clubes (race condition)');
        try {
          const clubsSnap = await db.ref('clubs').once('value');
          const allClubs = clubsSnap.val() || {};
          
          for (const [clubId, clubData] of Object.entries(allClubs)) {
            const memberData = clubData?.members?.[uid];
            if (memberData) {
              console.log('[AUTH] ✅ Usuário encontrado em clube:', clubId);
              
              // Se firstLoginRequired, configurar clube e mostrar modal
              if (memberData.firstLoginRequired === true) {
                console.log('[AUTH] firstLoginRequired detectado - configurando clube');
                ClubModule.currentClubId = clubId;
                ClubModule.currentClubName = clubData?.info?.name || clubData?.nome || 'Clube';
                this.showFirstLoginModal(uid);
                return;
              }
              
              // Se não é firstLogin, usar esses dados
              // Atualizar ClubModule se clube encontrado for diferente
              if (clubId !== ClubModule.currentClubId) {
                console.log('[AUTH] Clube correto encontrado, atualizando ClubModule');
                ClubModule.currentClubId = clubId;
                ClubModule.currentClubName = clubData?.info?.name || clubData?.nome || 'Clube';
              }
              
              userData = memberData;
              break;
            }
          }
        } catch (searchErr) {
          console.error('[AUTH] Erro ao buscar usuário em clubes:', searchErr);
        }
      }
      
      if (userData) {
        // Validar se usuário está aprovado
        if (userData.status === 'pending') {
          console.log('[AUTH] Usuário pendente de aprovação - bloqueando acesso');
          this.currentUser = {
            uid: uid,
            email: this.firebaseUser?.email || '',
            status: 'pending',
            bloqueado: true
          };
          // Mostrar tela de aguardando aprovação
          document.getElementById('login-container').style.display = 'none';
          document.getElementById('app-container').style.display = 'none';
          document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #3b82f6, #0ea5e9); font-family: system-ui;">
              <div style="background: white; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 400px;">
                <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
                <h2 style="color: #1f2937; margin-bottom: 10px; font-size: 22px;">Aguardando Aprovação</h2>
                <p style="color: #6b7280; margin-bottom: 20px; line-height: 1.6;">Sua solicitação de acesso está sendo analisada pelos administradores.<br><br>Você receberá uma notificação quando for aprovado.</p>
                <button onclick="firebase.auth().signOut(); location.reload();" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">Fazer Logout</button>
              </div>
            </div>
          `;
          return;
        }
        if (userData.status === 'rejected') {
          console.log('[AUTH] Conta rejeitada - bloqueando acesso');
          this.currentUser = {
            uid: uid,
            email: this.firebaseUser?.email || '',
            status: 'rejected',
            bloqueado: true
          };
          // Mostrar tela de acesso negado
          document.getElementById('login-container').style.display = 'none';
          document.getElementById('app-container').style.display = 'none';
          document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #ef4444, #dc2626); font-family: system-ui;">
              <div style="background: white; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 400px;">
                <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
                <h2 style="color: #dc2626; margin-bottom: 10px; font-size: 22px;">Acesso Negado</h2>
                <p style="color: #6b7280; margin-bottom: 20px; line-height: 1.6;">Sua solicitação de acesso foi rejeitada pelos administradores.<br><br>Se acredita que há um erro, entre em contato com o suporte.</p>
                <button onclick="firebase.auth().signOut(); location.reload();" style="background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">Fazer Logout</button>
              </div>
            </div>
          `;
          return;
        }
        
        // Determinar role: Preferir token (Custom Claims), fallback para database
        let userRole = userData.role || 'jogador'; // Default do database
        
        if (tokenClaims && tokenClaims.role) {
          console.log('[AUTH] Usando role do token JWT:', tokenClaims.role);
          userRole = tokenClaims.role;
          
          // Validar consistência: Se role do token diferir do database, avisar
          if (tokenClaims.role !== userData.role) {
            console.warn('[AUTH] ⚠️ Role do token difere do database!', {
              token: tokenClaims.role,
              database: userData.role
            });
            console.warn('[AUTH] Usando role do token (mais atualizado)');
          }
        } else {
          console.log('[AUTH] Custom Claims não encontrados, usando role do database:', userRole);
        }
        
        // Usuário aprovado - pode fazer login
        this.currentUser = {
          uid: uid,
          email: this.firebaseUser?.email || '',
          login: userData.login || (this.firebaseUser?.email?.split('@')[0]) || 'usuario',
          role: userRole, // Role do token (ou database como fallback)
          nome: userData.nome || this.firebaseUser?.displayName || 'Usuário',
          status: userData.status,
          clubId: ClubModule.currentClubId,
          clubName: ClubModule.currentClubName,
          platform_admin: tokenClaims?.platform_admin || false,
          // Guardar se está usando Custom Claims
          usingTokenAuth: !!(tokenClaims && tokenClaims.role)
        };
        
        // Verificar se é primeira vez (obrigar troca de senha)
        if (userData.firstLoginRequired === true) {
          console.log('[AUTH] ⚠️ Primeira sessão detectada - forçar troca de senha');
          this.showFirstLoginModal(uid);
          return;
        }
        
        console.log('[AUTH] Usuário carregado:', {
          uid: this.currentUser.uid,
          role: this.currentUser.role,
          clubName: this.currentUser.clubName,
          tokenAuth: this.currentUser.usingTokenAuth
        });
        
        // Resetar contador de tentativas após sucesso
        this.loadUserDataRetries = 0;
        
        this.logAction('login', 'Fez login no sistema', {});
        this.showApp();
        loadModule('menu');
      } else {
        // Usuário está no clube mas não tem perfil de membro
        // Pode ser race condition após aprovação - tentar novamente
        console.log('[AUTH] Usuário sem perfil no clube (tentativa ' + (this.loadUserDataRetries + 1) + ')');
        
        if (this.loadUserDataRetries < 3) {
          // Incremendar tentativas e aguardar sincronização
          this.loadUserDataRetries++;
          const delayMs = 1000; // 1 segundo entre tentativas
          console.log('[AUTH] Esperando sincronização... tentando novamente em ' + delayMs + 'ms');
          setTimeout(() => {
            this.loadUserData(uid);
          }, delayMs);
        } else {
          // Após 3 tentativas falhadas, mostrar erro real
          console.log('[AUTH] Falha permanente ao carregar perfil após 3 tentativas');
          UI.showToast('Você precisa ser adicionado ao clube por um administrador', 'warning');
          this.silentLogout();
        }
      }
    } catch (err) {
      console.error('[AUTH] Erro ao carregar dados (tentativa ' + (this.loadUserDataRetries + 1) + '):', err);
      
      // Tentar novamente até máximo  de 3 vezes
      if (this.loadUserDataRetries < 3) {
        this.loadUserDataRetries++;
        console.log('[AUTH] Tentando carregar novamente em 1 segundo...');
        setTimeout(() => {
          this.loadUserData(uid);
        }, 1000);
      } else {
        // Se falhou 3 vezes, mostrar erro
        console.error('[AUTH] Falha permanente ao carregar dados após 3 tentativas');
        UI.showToast('Erro de conexão. Por favor, recarregue a página.', 'error');
        // NÃO fazer logout - deixar usuário tentar de novo
      }
    }
  },

  showForm(formType) {
    // Ocultar todos os formulários
    document.getElementById('form-login').style.display = 'none';
    document.getElementById('form-register').style.display = 'none';
    document.getElementById('form-reset').style.display = 'none';
    
    // Limpar mensagens de erro
    document.getElementById('login-error').style.display = 'none';
    const registerError = document.getElementById('register-error');
    const registerSuccess = document.getElementById('register-success');
    if (registerError) registerError.style.display = 'none';
    if (registerSuccess) registerSuccess.style.display = 'none';
    
    const resetError = document.getElementById('reset-error');
    const resetSuccess = document.getElementById('reset-success');
    if (resetError) resetError.style.display = 'none';
    if (resetSuccess) resetSuccess.style.display = 'none';
    
    // Mostrar formulário solicitado
    if (formType === 'login') {
      document.getElementById('form-login').style.display = 'block';
    } else if (formType === 'register') {
      // Registro desabilitado - create user deve ser feito via diretor
      UI.showToast('Auto-registro desabilitado. Peça ao diretor para criar sua conta.', 'warning');
      document.getElementById('form-login').style.display = 'block';
    } else if (formType === 'reset') {
      document.getElementById('form-reset').style.display = 'block';
    }
  },

  login(event) {
    event.preventDefault();
    console.log('[AUTH] Tentativa de login');
    MonitoringModule.trackEvent('login_attempt', { timestamp: new Date().toISOString() });
    
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-pass').value;
    const errorEl = document.getElementById('login-error');

    if (!email || !senha) {
      errorEl.textContent = 'Preencha email e senha';
      errorEl.style.display = 'block';
      MonitoringModule.trackEvent('login_validation_error', { reason: 'empty_fields' });
      return;
    }

    // Desabilitar botão durante login
    const btnLogin = document.querySelector('.btn-login');
    const originalText = btnLogin.textContent;
    btnLogin.disabled = true;
    btnLogin.textContent = 'Entrando...';

    // Timeout de segurança para resetar botão se login demorar muito
    let loginTimeout = setTimeout(() => {
      console.warn('[AUTH] Login timeout - resetando botão');
      MonitoringModule.trackEvent('login_timeout', { duration_ms: 15000 });
      if (btnLogin) {
        btnLogin.disabled = false;
        btnLogin.textContent = originalText;
      }
    }, 15000); // 15 segundos de timeout

    // Autenticar com Firebase
    firebase.auth().signInWithEmailAndPassword(email, senha)
      .then(async userCredential => {
        clearTimeout(loginTimeout);
        console.log('[AUTH] Login bem-sucedido:', userCredential.user.email);
        
        // Forçar refresh do token para obter custom claims atualizados
        console.log('[AUTH] Forçando refresh do token para obter claims atualizados...');
        await userCredential.user.getIdToken(true);
        
        // Rastrear login bem-sucedido
        MonitoringModule.trackEvent('login_success', { 
          email: email,
          uid: userCredential.user.uid
        });
        MonitoringModule.identifyUser(userCredential.user.uid, { email: email });
        
        errorEl.style.display = 'none';
        document.getElementById('login-pass').value = '';
      })
      .catch(error => {
        clearTimeout(loginTimeout);
        console.error('[AUTH] Erro no login:', error);
        btnLogin.disabled = false;
        btnLogin.textContent = originalText;
        
        let errorMessage = 'Erro ao fazer login';
        let errorCode = error.code || 'unknown';
        
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'Usuário não encontrado';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'Senha incorreta';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Email inválido';
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'Erro de conexão. Verifique sua internet';
        }
        
        // Rastrear erro de login
        MonitoringModule.trackEvent('login_error', { 
          error_code: errorCode,
          email: email
        });
        MonitoringModule.captureException(error, {
          context: 'login',
          email: email
        }, 'warning');
        
        errorEl.textContent = errorMessage;
        errorEl.style.display = 'block';
        document.getElementById('login-pass').value = '';
      });
  },

  register(event) {
    event.preventDefault();
    console.log('[AUTH] Tentativa de registro');
    MonitoringModule.trackEvent('register_attempt', { timestamp: new Date().toISOString() });
    
    const nome = document.getElementById('register-nome').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const senha = document.getElementById('register-pass').value;
    const senhaConfirm = document.getElementById('register-pass-confirm').value;
    const errorEl = document.getElementById('register-error');
    const successEl = document.getElementById('register-success');
    
    errorEl.style.display = 'none';
    successEl.style.display = 'none';
    
    // Validações
    if (!nome || !email || !senha || !senhaConfirm) {
      errorEl.textContent = 'Preencha todos os campos';
      errorEl.style.display = 'block';
      return;
    }
    
    if (senha !== senhaConfirm) {
      errorEl.textContent = 'As senhas não coincidem';
      errorEl.style.display = 'block';
      return;
    }
    
    if (senha.length < 6) {
      errorEl.textContent = 'A senha deve ter no mínimo 6 caracteres';
      errorEl.style.display = 'block';
      return;
    }
    
    // Desabilitar botão
    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Criando conta...';
    
    // Criar usuário no Firebase Auth
    this.isRegistering = true;
    let createdUid = null;
    firebase.auth().createUserWithEmailAndPassword(email, senha)
      .then(userCredential => {
        const uid = userCredential.user.uid;
        createdUid = uid;
        console.log('[AUTH] Usuário criado:', email);
        
        // Atualizar perfil com nome
        return userCredential.user.updateProfile({ displayName: nome });
      })
      .then(() => {
        if (!createdUid) {
          throw new Error('UID não encontrado após registro');
        }

        return db.ref(`pendingUsers/${createdUid}`).set({
          nome: nome,
          email: email,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      })
      .then(() => {
        console.log('[AUTH] Registro completo - usuário aguardando vinculação ao clube');
        successEl.textContent = '✓ Conta criada com sucesso! Aguardando aprovação do administrador.';
        successEl.style.display = 'block';
        
        MonitoringModule.trackEvent('register_success', { email: email });
        
        // Limpar formulário
        document.getElementById('register-nome').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-pass').value = '';
        document.getElementById('register-pass-confirm').value = '';
        
        // Reabilitar botão do formulário
        btn.disabled = false;
        btn.textContent = originalText;

        // Fazer logout para que usuário veja que precisa de aprovação
        firebase.auth().signOut().then(() => {
          console.log('[AUTH] Logged out após registro com sucesso');
          // Aguardar 2 segundos e voltar para login
          setTimeout(() => {
            AuthModule.showLogin();
            AuthModule.showForm('login');
            UI.showToast('Sua conta foi criada! Aguarde enquanto o administrador aprova e vincula você a um clube.', 'info');
          }, 2000);
        }).finally(() => {
          this.isRegistering = false;
        });
      })
      .catch(error => {
        console.error('[AUTH] Erro no registro:', error);
        console.error('[AUTH] Código do erro:', error.code);
        console.error('[AUTH] Mensagem:', error.message);
        this.isRegistering = false;
        btn.disabled = false;
        btn.textContent = originalText;
        
        let errorMessage = 'Erro ao criar conta';
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Este email já está cadastrado';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Email inválido';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Senha muito fraca (mínimo 6 caracteres)';
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'Erro de conexão. Verifique sua internet';
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMessage = 'Registro desabilitado. Contate o administrador';
        } else {
          errorMessage = `Erro: ${error.code || 'desconhecido'}`;
        }
        
        errorEl.textContent = errorMessage;
        errorEl.style.display = 'block';
      });
  },

  resetPassword(event) {
    event.preventDefault();
    console.log('[AUTH] Reset de senha simples');
    
    const email = document.getElementById('reset-email').value.trim();
    const senhaNova = document.getElementById('reset-pass-nova').value;
    const senhaConfirm = document.getElementById('reset-pass-confirm').value;
    const errorEl = document.getElementById('reset-error');
    const successEl = document.getElementById('reset-success');
    
    errorEl.style.display = 'none';
    successEl.style.display = 'none';
    
    // Validações
    if (!email || !senhaNova || !senhaConfirm) {
      errorEl.textContent = 'Preencha todos os campos';
      errorEl.style.display = 'block';
      return;
    }
    
    if (senhaNova !== senhaConfirm) {
      errorEl.textContent = 'As senhas não coincidem';
      errorEl.style.display = 'block';
      return;
    }
    
    if (senhaNova.length < 6) {
      errorEl.textContent = 'A senha deve ter no mínimo 6 caracteres';
      errorEl.style.display = 'block';
      return;
    }
    
    // Desabilitar botão
    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Alterando...';
    
    // Usar sendPasswordResetEmail do Firebase
    firebase.auth().sendPasswordResetEmail(email)
      .then(() => {
        console.log('[AUTH] Email de reset enviado');
        
        // Armazenar na sessionStorage que o usuário quer resetar esta senha
        sessionStorage.setItem('resetEmail', email);
        sessionStorage.setItem('resetPassword', senhaNova);
        
        successEl.innerHTML = `
          <div style="line-height: 1.6;">
            ✓ <strong>Senha alterada com sucesso!</strong><br>
            <span style="font-size: 12px;">Redirecionando para login...</span>
          </div>
        `;
        successEl.style.display = 'block';
        
        // Limpar formulário
        document.getElementById('reset-email').value = '';
        document.getElementById('reset-pass-nova').value = '';
        document.getElementById('reset-pass-confirm').value = '';
        
        // Voltar ao login após 2 segundos
        setTimeout(() => {
          this.showForm('login');
          document.getElementById('login-email').value = email;
          btn.disabled = false;
          btn.textContent = originalText;
          
          UI.showToast(`Nova senha: ${senhaNova}`, 'info');
        }, 2000);
      })
      .catch(error => {
        console.error('[AUTH] Erro ao enviar email reset:', error);
        btn.disabled = false;
        btn.textContent = originalText;
        
        let errorMessage = 'Erro ao processar reset';
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'Email não encontrado';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Email inválido';
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'Erro de conexão';
        }
        
        errorEl.textContent = errorMessage;
        errorEl.style.display = 'block';
      });
  },

  verifyEmail() {
    // Função removida - não é mais necessária
  },

  logout() {
    UI.showConfirm('Tem certeza que deseja sair?', () => {
      // Rastrear logout
      const userId = this.firebaseUser?.uid || 'unknown';
      MonitoringModule.trackEvent('logout', { 
        uid: userId,
        timestamp: new Date().toISOString()
      });
      
      // Resetar botão ANTES de fazer logout
      const btnLogin = document.querySelector('.btn-login');
      if (btnLogin) {
        btnLogin.disabled = false;
        btnLogin.textContent = '→ Entrar';
      }
      
      this.logAction('logout', 'Fez logout do sistema', {});
      firebase.auth().signOut().then(() => {
        console.log('[AUTH] Logout realizado');
        this.currentUser = null;
        this.firebaseUser = null;
        // Garantir que showLogin é chamado
        this.showLogin();
      }).catch(err => {
        console.error('[AUTH] Erro no logout:', err);
        MonitoringModule.captureException(err, { context: 'logout' }, 'error');
        UI.showToast('Erro ao fazer logout', 'error');
        // Resetar botão mesmo em erro
        if (btnLogin) {
          btnLogin.disabled = false;
          btnLogin.textContent = '→ Entrar';
        }
      });
    });
  },

  async showFirstLoginModal(uid) {
    // Modal para forçar troca de senha no primeiro login
    const email = firebase.auth().currentUser?.email;
    
    // Buscar clubId do usuário
    let clubId = null;
    try {
      const userClubsSnap = await db.ref(`userClubs/${uid}`).once('value');
      const userClubs = userClubsSnap.val();
      if (userClubs) {
        clubId = Object.keys(userClubs)[0]; // Pegar o primeiro clube
        console.log('[AUTH] Clube encontrado para primeira senha:', clubId);
      }
    } catch (err) {
      console.error('[AUTH] Erro ao buscar clube:', err);
    }
    
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'none';
    
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #3b82f6, #0ea5e9); font-family: system-ui;">
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 450px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 12px;">🔐</div>
            <h2 style="color: #1f2937; margin: 0; font-size: 24px;">Bem-vindo!</h2>
            <p style="color: #6b7280; margin: 8px 0 0 0; font-size: 14px;">Primeira vez? Escolha uma nova senha para sua conta</p>
          </div>
          
          <form id="firstLoginForm" style="display: flex; flex-direction: column; gap: 16px;">
            <div>
              <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 6px; font-size: 14px;">Senha Temporária</label>
              <input type="password" id="firstLoginTempPassword" placeholder="Senha recebida" required style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
            </div>
            
            <div>
              <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 6px; font-size: 14px;">Nova Senha</label>
              <input type="password" id="firstLoginNewPassword" placeholder="Mínimo 6 caracteres" required style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
            </div>
            
            <div>
              <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 6px; font-size: 14px;">Confirmar Senha</label>
              <input type="password" id="firstLoginConfirmPassword" placeholder="Repita a senha" required style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
            </div>
            
            <button type="submit" style="background: #3b82f6; color: white; border: none; padding: 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px;">🔒 Criar Nova Senha</button>
          </form>
          
          <div id="firstLoginError" style="display: none; color: #dc2626; font-size: 13px; margin-top: 12px; padding: 10px; background: #fee2e2; border-radius: 6px;"></div>
        </div>
      </div>
    `;
    
    const form = document.getElementById('firstLoginForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const tempPass = document.getElementById('firstLoginTempPassword').value;
      const newPass = document.getElementById('firstLoginNewPassword').value;
      const confirmPass = document.getElementById('firstLoginConfirmPassword').value;
      const errorDiv = document.getElementById('firstLoginError');
      const submitBtn = form.querySelector('button[type="submit"]');
      
      // Validar
      if (!tempPass) {
        errorDiv.textContent = '❌ Digite a senha temporária';
        errorDiv.style.display = 'block';
        return;
      }
      
      if (newPass.length < 6) {
        errorDiv.textContent = '❌ Nova senha deve ter mínimo 6 caracteres';
        errorDiv.style.display = 'block';
        return;
      }
      
      if (newPass !== confirmPass) {
        errorDiv.textContent = '❌ Senhas não conferem';
        errorDiv.style.display = 'block';
        return;
      }
      
      try {
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Processando...';
        
        const currentUser = firebase.auth().currentUser;
        if (!currentUser || !email) {
          throw new Error('Usuário não autenticado');
        }
        
        console.log('[AUTH] Iniciando atualização de senha para uid:', uid);
        
        // 1. Reauthenticar com a senha temporária
        console.log('[AUTH] Re-autenticando com senha temporária...');
        const credential = firebase.auth.EmailAuthProvider.credential(email, tempPass);
        await currentUser.reauthenticateWithCredential(credential);
        console.log('[AUTH] ✅ Re-autenticação bem-sucedida');
        
        // 2. Atualizar senha no Firebase Auth
        await currentUser.updatePassword(newPass);
        console.log('[AUTH] ✅ Senha atualizada com sucesso');
        
        // 3. Remover flag de primeira senha do database
        if (clubId) {
          try {
            await db.ref(`clubs/${clubId}/members/${uid}/firstLoginRequired`).remove();
            console.log('[AUTH] ✅ Flag firstLoginRequired removida');
          } catch (dbErr) {
            console.warn('[AUTH] ⚠️ Erro ao remover flag:', dbErr.message);
          }
        }
        
        // 4. Fazer logout e redirecionar para login
        console.log('[AUTH] Fazendo logout automático...');
        await firebase.auth().signOut();
        
        // Mostrar mensagem de sucesso
        submitBtn.textContent = '✅ Senha Atualizada!';
        submitBtn.style.background = '#059669';
        errorDiv.innerHTML = `✅ <strong>Senha atualizada com sucesso!</strong><br>Recarregando em 2 segundos...`;
        errorDiv.style.color = '#059669';
        errorDiv.style.background = '#ecfdf5';
        errorDiv.style.display = 'block';
        
        // Recarregar página após 2 segundos
        setTimeout(() => {
          console.log('[AUTH] Recarregando página...');
          window.location.reload();
        }, 2000);
        
      } catch (err) {
        console.error('[AUTH] ❌ Erro ao atualizar senha:', err);
        console.error('[AUTH] Código do erro:', err.code);
        console.error('[AUTH] Mensagem:', err.message);
        
        // Mensagens de erro específicas
        let errorMsg = '❌ Erro ao atualizar senha.';
        if (err.code === 'auth/wrong-password') {
          errorMsg = '❌ Senha temporária incorreta. Verifique e tente novamente.';
        } else if (err.code === 'auth/weak-password') {
          errorMsg = '❌ Senha fraca. Use uma senha mais segura.';
        } else if (err.code === 'auth/requires-recent-login') {
          errorMsg = '❌ Autenticação expirada. Recarregue a página e tente novamente.';
        } else if (err.message) {
          errorMsg = `❌ ${err.message}`;
        }
        
        errorDiv.textContent = errorMsg;
        errorDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = '🔒 Criar Nova Senha';
      }
    });
  },

  silentLogout() {
    // Logout sem pedir confirmação (usado para bloqueios automáticos)
    console.log('[AUTH] Logout silencioso');
    MonitoringModule.trackEvent('silent_logout', { timestamp: new Date().toISOString() });
   ClubModule.clear(); // Limpar cache do clube
    firebase.auth().signOut().then(() => {
      console.log('[AUTH] Logout silencioso realizado');
      this.currentUser = null;
      this.firebaseUser = null;
      this.showLogin();
      // Garantir que botão está resetado
      setTimeout(() => {
        const btnLogin = document.querySelector('.btn-login');
        if (btnLogin) {
          btnLogin.disabled = false;
          btnLogin.textContent = '→ Entrar';
        }
      }, 100);
    }).catch(err => {
      console.error('[AUTH] Erro no logout silencioso:', err);
      // Resetar botão mesmo em caso de erro
      const btnLogin = document.querySelector('.btn-login');
      if (btnLogin) {
        btnLogin.disabled = false;
        btnLogin.textContent = '→ Entrar';
      }
    });
  },

  /**
   * Força atualização do token e recarrega dados do usuário
   * Útil quando um admin muda o role de alguém e precisa entrar em vigor imediatamente
   * Retorna: true se sucesso, false se erro
   */
  async forceTokenRefreshAndReload() {
    if (!this.firebaseUser || !this.currentUser) {
      console.warn('[AUTH] Nenhum usuário logado para refresh');
      return false;
    }
    
    try {
      console.log('[AUTH] 🔄 Forçando atualização do token...');
      UI.showToast('Atualizando permissões...', 'info');
      
      // Força refresh do token (pega novos Custom Claims do servidor)
      const newToken = await this.refreshToken();
      
      if (!newToken) {
        console.error('[AUTH] Falha ao atualizar token');
        UI.showToast('Erro ao atualizar permissões', 'error');
        return false;
      }
      
      // Recarregar dados do usuário com novo token
      await this.loadUserData(this.currentUser.uid);
      
      console.log('[AUTH] ✅ Token e permissões atualizados!');
      UI.showToast('Permissões atualizadas com sucesso!', 'success');
      
      // Recarregar página atual para aplicar novas permissões
      const currentModule = window.location.hash.replace('#', '') || 'menu';
      loadModule(currentModule);
      
      return true;
    } catch (error) {
      console.error('[AUTH] Erro ao forçar refresh de token:', error);
      UI.showToast('Erro ao atualizar permissões', 'error');
      return false;
    }
  },

  logAction(acao, descricao, dados) {
    if (!this.currentUser) return;
    
    const log = {
      id: dbRef().child('logs').push().key,
      usuario: this.currentUser.login || 'unknown',
      role: this.currentUser.role || 'jogador',
      acao: String(acao || ''),
      descricao: String(descricao || ''),
      timestamp: new Date().toISOString(),
      data: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('pt-BR')
    };
    
    dbRef('logs/' + log.id).set(log)
      .then(() => this.cleanupOldLogs())
      .catch(err => console.error('Erro ao registrar log:', err));
  },

  cleanupOldLogs() {
    const cutoffIso = new Date(Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    dbRef('logs')
      .orderByChild('timestamp')
      .endAt(cutoffIso)
      .once('value')
      .then(snap => {
        const updates = {};
        snap.forEach(child => {
          updates[child.key] = null;
        });

        if (Object.keys(updates).length > 0) {
          dbRef('logs').update(updates).catch(err => console.error('Erro ao remover logs antigos:', err));
        }
      })
      .catch(err => console.error('Erro ao consultar logs antigos:', err));
  },

  showLogin() {
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    
    appContainer.style.display = 'none';
    appContainer.style.opacity = '0';
    loginContainer.style.display = 'flex';
    
    // Garantir que botão está no estado correto ao mostrar tela de login
    setTimeout(() => {
      const btnLogin = document.querySelector('.btn-login');
      if (btnLogin) {
        btnLogin.disabled = false;
        btnLogin.textContent = '→ Entrar';
      }
    }, 0);
    
    console.log('[AUTH] Login container mostrado');
  },

  showApp() {
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    
    loginContainer.style.display = 'none';
    appContainer.style.display = 'flex';
    
    // Transição suave de entrada
    setTimeout(() => {
      appContainer.style.opacity = '1';
    }, 50);
    
    // Atualizar informações do usuário na sidebar
    document.getElementById('user-name').textContent = this.currentUser.nome;
    let roleText = '';
    if (this.currentUser.role === 'jogador') roleText = 'Jogador';
    else if (this.currentUser.role === 'diretor') roleText = 'Diretor';
    else if (this.currentUser.role === 'admin') roleText = 'Administrador';
    document.getElementById('user-role').textContent = roleText;

    // Controlar acesso a módulos
    const btnJogadores = document.getElementById('btn-jogadores');
    const btnJogos = document.getElementById('btn-jogos');
    const btnFinanceiro = document.getElementById('btn-financeiro');
    const btnUsuarios = document.getElementById('btn-usuarios');
    const btnLogs = document.getElementById('btn-logs');
    const btnGestaoClubes = document.getElementById('btn-gestao-clubes');
    
    if (this.currentUser.role === 'jogador') {
      // Jogador: Menu, Jogos (somente leitura) e Estatísticas
      if (btnJogadores) btnJogadores.style.display = 'none';
      if (btnJogos) btnJogos.style.display = 'block';
      if (btnFinanceiro) btnFinanceiro.style.display = 'none';
      if (btnUsuarios) btnUsuarios.style.display = 'none';
      if (btnLogs) btnLogs.style.display = 'none';
      if (btnGestaoClubes) btnGestaoClubes.style.display = 'none';
    } else if (this.currentUser.role === 'diretor') {
      // Diretor: tudo exceto logs e gestão de clubes
      if (btnJogadores) btnJogadores.style.display = 'block';
      if (btnJogos) btnJogos.style.display = 'block';
      if (btnFinanceiro) btnFinanceiro.style.display = 'block';
      if (btnUsuarios) btnUsuarios.style.display = 'block';
      if (btnLogs) btnLogs.style.display = 'none';
      if (btnGestaoClubes) btnGestaoClubes.style.display = 'none';
    } else if (this.currentUser.role === 'admin') {
      // Admin: acesso a tudo
      if (btnJogadores) btnJogadores.style.display = 'block';
      if (btnJogos) btnJogos.style.display = 'block';
      if (btnFinanceiro) btnFinanceiro.style.display = 'block';
      if (btnUsuarios) btnUsuarios.style.display = 'block';
      if (btnLogs) btnLogs.style.display = 'block';
      if (btnGestaoClubes) btnGestaoClubes.style.display = 'block';
    }
    
    console.log('[AUTH] App container mostrado com transição');
  },

  // ===========================
  // MÉTODOS DE PERMISSÃO
  // ===========================
  
  canRead(section) {
    if (!this.currentUser) return false;
    
    const role = this.currentUser.role;
    const readPermissions = {
      'jogadores': ['jogador', 'diretor', 'admin'],
      'jogos': ['jogador', 'diretor', 'admin'],
      'financeiro': ['diretor', 'admin'],
      'logs': ['admin'],
      'users': ['admin']
    };
    
    return readPermissions[section]?.includes(role) || false;
  },

  canWrite(section) {
    if (!this.currentUser) return false;
    
    const role = this.currentUser.role;
    const writePermissions = {
      'jogadores': ['diretor', 'admin'],
      'jogos': ['diretor', 'admin'],
      'financeiro': ['admin'],
      'logs': [], // logs são apenas leitura
      'users': ['admin']
    };
    
    return writePermissions[section]?.includes(role) || false;
  },

  isAdmin() {
    return this.currentUser?.role === 'admin';
  },

  isDiretor() {
    return this.currentUser?.role === 'diretor' || this.currentUser?.role === 'admin';
  },

  isApproved() {
    return this.currentUser?.status === 'approved';
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
console.log('[FIREBASE] ✓ Firebase inicializado');

// Configurar Cloud Functions
const functions = firebase.functions();
console.log('[FIREBASE] ✓ Cloud Functions configuradas');

// Configurar persistência de sessão IMEDIATAMENTE
const auth = firebase.auth();
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => {
    console.log('[FIREBASE] ✓ LOCAL persistence configurada');
  })
  .catch(error => {
    console.error('[FIREBASE] ✗ Erro ao configurar persistence:', error);
    // Fallback para SESSION persistence
    return auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
      .then(() => console.log('[FIREBASE] ✓ SESSION persistence ativado como fallback'))
      .catch(err => console.error('[FIREBASE] ✗ Erro ao configurar SESSION persistence:', err));
  });

const db = firebase.database();
console.log('[FIREBASE] ✓ Banco de dados conectado');

// ===========================
// CONSTANTES E CONFIGURAÇÕES
// ===========================

const LOG_RETENTION_DAYS = 90;

const MONTH_KEY_REGEX = /^\d{4}-\d{2}$/;
const LEGACY_MONTH_ABBR = {
  jan: 1,
  fev: 2,
  mar: 3,
  abr: 4,
  mai: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  set: 9,
  out: 10,
  nov: 11,
  dez: 12
};
const MONTH_FORMATTER = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' });

const pad2 = (value) => String(value).padStart(2, '0');

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
};

const normalizeMonthKey = (value) => {
  if (!value) return '';

  if (typeof value === 'number' && Number.isFinite(value)) {
    const dt = new Date(value);
    if (!Number.isNaN(dt.getTime())) return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}`;
  }

  const raw = String(value).trim().toLowerCase();
  if (MONTH_KEY_REGEX.test(raw)) return raw;

  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) return `${isoMatch[1]}-${pad2(isoMatch[2])}`;

  const legacyMatch = raw.match(/^([a-z]{3})\/(\d{2})$/);
  if (!legacyMatch) return raw;

  const monthNum = LEGACY_MONTH_ABBR[legacyMatch[1]];
  if (!monthNum) return raw;

  const yearNum = parseInt(legacyMatch[2], 10);
  const fullYear = yearNum < 100 ? 2000 + yearNum : yearNum;
  return `${fullYear}-${pad2(monthNum)}`;
};

const formatMonthLabel = (monthKey) => {
  const normalized = normalizeMonthKey(monthKey);
  if (!MONTH_KEY_REGEX.test(normalized)) return monthKey || '';

  const [year, month] = normalized.split('-').map(Number);
  const label = MONTH_FORMATTER.format(new Date(year, month - 1, 1));
  return label.replace('.', '');
};

const normalizeMensalidades = (jogador) => {
  if (!jogador || !jogador.mensalidades) return { map: {}, migrated: false };

  if (Array.isArray(jogador.mensalidades)) {
    const baseYear = jogador.mensalidadesBaseYear || (jogador.createdAt ? new Date(jogador.createdAt).getFullYear() : new Date().getFullYear());
    const map = {};

    jogador.mensalidades.forEach((mensal, idx) => {
      if (!mensal) return;
      const key = `${baseYear}-${pad2(idx + 1)}`;
      map[key] = mensal;
    });

    return { map, migrated: true, baseYear };
  }

  if (typeof jogador.mensalidades === 'object') {
    const map = {};
    let migrated = false;

    Object.entries(jogador.mensalidades).forEach(([key, value]) => {
      const normalized = normalizeMonthKey(key);
      const targetKey = normalized || key;
      if (targetKey !== key) migrated = true;
      map[targetKey] = value;
    });

    return { map, migrated };
  }

  return { map: {}, migrated: false };
};

const collectMonthKeysFromPlayers = (players, forcedMonthKey = '') => {
  if (forcedMonthKey) return [normalizeMonthKey(forcedMonthKey)];

  const keys = new Set();
  (players || []).forEach(jogador => {
    const { map } = normalizeMensalidades(jogador);
    Object.keys(map || {}).forEach(key => {
      const normalized = normalizeMonthKey(key);
      if (normalized) keys.add(normalized);
    });
  });

  if (keys.size === 0) keys.add(getCurrentMonthKey());
  return Array.from(keys).sort();
};

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

const sanitizeLogData = (input) => {
  if (input === undefined) return {};
  if (input === null) return null;
  if (Array.isArray(input)) {
    return input
      .map(item => sanitizeLogData(item))
      .filter(item => item !== undefined);
  }
  if (typeof input !== 'object') return input;

  const cleaned = {};
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined) return;
    const sanitized = sanitizeLogData(value);
    if (sanitized !== undefined) cleaned[key] = sanitized;
  });
  return cleaned;
};

// ===========================
// MÓDULO: GERENCIAMENTO DE USUÁRIOS
// ===========================

const UserManagementModule = {
  pendingClubs: [],
  pendingRoles: [
    { value: 'jogador', label: 'Jogador' },
    { value: 'diretor', label: 'Diretor' },
    { value: 'admin', label: 'Admin' }
  ],
  
  init() {
    const container = document.getElementById('main-content');
    const role = AuthModule.currentUser?.role;
    const isPlatformAdmin = !!AuthModule.currentUser?.platform_admin;
    
    let novoUsuarioHtml = '';
    if (role === 'diretor' || role === 'admin' || isPlatformAdmin) {
      // Diretor/admin de clube OU admin global pode criar novo usuário
      
      let clubSelectHtml = '';
      if (isPlatformAdmin) {
        // Admin global precisa selecionar o clube
        clubSelectHtml = `
          <div>
            <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 6px; font-size: 12px;">Clube</label>
            <select id="newUserClube" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; box-sizing: border-box;">
              <option value="">Carregando clubes...</option>
            </select>
          </div>
        `;
      }
      
      novoUsuarioHtml = `
        <div class="form-container" style="margin-bottom: 20px; background: #f0f9ff; border-left: 4px solid #3b82f6;">
          <h3 style="margin-top: 0;">➕ Novo Usuário</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            ${clubSelectHtml}
            <div>
              <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 6px; font-size: 12px;">Email</label>
              <input type="email" id="newUserEmail" placeholder="usuario@exemplo.com" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; box-sizing: border-box;">
            </div>
            <div>
              <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 6px; font-size: 12px;">Nome Completo</label>
              <input type="text" id="newUserNome" placeholder="João Silva" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; box-sizing: border-box;">
            </div>
            <div>
              <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 6px; font-size: 12px;">Perfil</label>
              <select id="newUserPerfil" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; box-sizing: border-box;">
                <option value="">Selecione...</option>
                <option value="jogador">Jogador</option>
                <option value="diretor">Diretor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style="display: flex; gap: 8px; align-items: flex-end;">
              <button class="btn-success" onclick="UserManagementModule.criarNovoUsuario()" style="flex: 1; padding: 8px;">✅ Criar Usuário</button>
            </div>
          </div>
          <div id="newUserError" style="display: none; color: #dc2626; font-size: 12px; padding: 8px; background: #fee2e2; border-radius: 4px;"></div>
          <div id="newUserSuccess" style="display: none; color: #059669; font-size: 12px; padding: 8px; background: #ecfdf5; border-radius: 4px;"></div>
        </div>
      `;
    }
    
    container.innerHTML = `
      <h1>🔐 Gerenciar Usuários</h1>

      ${novoUsuarioHtml}

      <div class="form-container" style="margin-bottom: 20px;">
        <h3>Usuários do Clube</h3>
        <div id="all-users-list" style="min-height: 100px;">
          <p style="text-align: center; color: #666;">Carregando...</p>
        </div>
      </div>

      <div class="action-row" style="justify-content: flex-start; gap: 10px;">
        <button class="btn-primary" onclick="UserManagementModule.loadUsers()">🔄 Atualizar</button>
        <button class="btn-primary" onclick="loadModule('menu')" style="margin-left: auto;">← Voltar</button>
      </div>
    `;
    
    // Se for admin global, carregar lista de clubes
    if (isPlatformAdmin) {
      this.carregarClubesParaSelect();
    }
    
    this.loadUsers();
  },

  carregarClubesParaSelect() {
    db.ref('clubs').once('value', snap => {
      const clubs = snap.val() || {};
      const selectClube = document.getElementById('newUserClube');
      
      if (!selectClube) return;
      
      selectClube.innerHTML = '<option value="">Selecione um clube</option>';
      
      Object.entries(clubs).forEach(([clubId, clubData]) => {
        const option = document.createElement('option');
        option.value = clubId;
        option.textContent = clubData?.info?.name || clubId;
        selectClube.appendChild(option);
      });
    });
  },

  async criarNovoUsuario() {
    const email = document.getElementById('newUserEmail').value.trim();
    const nome = document.getElementById('newUserNome').value.trim();
    const perfil = document.getElementById('newUserPerfil').value;
    const errorDiv = document.getElementById('newUserError');
    const successDiv = document.getElementById('newUserSuccess');
    const isPlatformAdmin = !!AuthModule.currentUser?.platform_admin;
    
    // Limpar mensagens
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    // Validar
    if (!email || !email.includes('@')) {
      errorDiv.textContent = '❌ Email inválido';
      errorDiv.style.display = 'block';
      return;
    }
    
    if (!nome) {
      errorDiv.textContent = '❌ Nome obrigatório';
      errorDiv.style.display = 'block';
      return;
    }
    
    if (!perfil) {
      errorDiv.textContent = '❌ Perfil obrigatório';
      errorDiv.style.display = 'block';
      return;
    }
    
    try {
      // Determinar clubId: admin global seleciona, diretor/admin usa o clube atual
      let clubId = ClubModule.currentClubId;
      if (isPlatformAdmin) {
        clubId = document.getElementById('newUserClube')?.value;
        if (!clubId) {
          throw new Error('Selecione um clube');
        }
      }
      
      if (!clubId) {
        throw new Error('Clube não identificado');
      }
      
      UI.showLoading(document.getElementById('newUserEmail'));
      
      const createUser = functions.httpsCallable('createUserByDirector');
      const result = await createUser({
        clubId,
        email,
        nome,
        perfil
      });
      
      console.log('[USERS] ✅ Usuário criado:', result.data);
      
      // Mostrar senha em campo copiável
      const senhaTemporaria = result.data.senhaTemporaria;
      successDiv.innerHTML = `
        <div style="background: #ecfdf5; border: 2px solid #059669; border-radius: 6px; padding: 15px;">
          <div style="color: #059669; font-weight: 600; margin-bottom: 12px;">✅ <strong>${nome}</strong> criado com sucesso!</div>
          <div style="background: white; border: 1px solid #d1d5db; border-radius: 4px; padding: 10px; margin-bottom: 12px;">
            <label style="display: block; color: #374151; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Senha Temporária (copie abaixo):</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" value="${senhaTemporaria}" id="tempPasswordField" readonly style="flex: 1; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-family: monospace; font-weight: bold; color: #dc2626; background: #fef2f2;">
              <button type="button" onclick="UserManagementModule.copiarSenha('${senhaTemporaria}')" style="background: #3b82f6; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">📋 Copiar</button>
            </div>
          </div>
          <button type="button" onclick="UserManagementModule.regenerarSenhaTemporaria('${result.data.uid}', '${clubId || ClubModule.currentClubId}', '${email}')" style="background: #f59e0b; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; width: 100%;">🔄 Gerar Nova Senha Temporária</button>
          <small style="display: block; color: #666; margin-top: 12px;">📝 Compartilhe esta senha com o usuário. Ele deve trocar na primeira vez que acessar.</small>
        </div>
      `;
      successDiv.style.display = 'block';
      
      // Limpar formulário
      document.getElementById('newUserEmail').value = '';
      document.getElementById('newUserNome').value = '';
      document.getElementById('newUserPerfil').value = '';
      if (document.getElementById('newUserClube')) {
        document.getElementById('newUserClube').value = '';
      }
      
      // Atualizar lista
      setTimeout(() => {
        this.loadUsers();
      }, 1000);
      
    } catch (err) {
      console.error('[USERS] ❌ Erro ao criar usuário:', err);
      const msg = err.message || err.code || 'Erro desconhecido';
      errorDiv.textContent = `❌ ${msg}`;
      errorDiv.style.display = 'block';
    }
  },

  copiarSenha(senha) {
    navigator.clipboard.writeText(senha).then(() => {
      UI.showToast('✅ Senha copiada para a área de transferência!', 'success');
    }).catch(err => {
      console.error('Erro ao copiar:', err);
      UI.showToast('❌ Erro ao copiar', 'error');
    });
  },

  async regenerarSenhaTemporaria(uid, clubId, email) {
    if (!confirm('Tem certeza? Uma nova senha temporária será gerada e a atual será invalidada.')) {
      return;
    }
    
    // Fallback: se clubId não foi passado, usar o clube atual
    if (!clubId) {
      clubId = ClubModule.currentClubId;
    }
    
    if (!uid || !clubId) {
      UI.showToast('❌ Erro: Dados incompletos (uid ou clubId ausente)', 'error');
      console.error('[USERS] regenerarSenhaTemporaria chamado com:', { uid, clubId, email });
      return;
    }
    
    try {
      UI.showLoading(document.getElementById('newUserSuccess'));
      
      // Chamar Cloud Function para resetar senha
      const resetPassword = functions.httpsCallable('resetUserPassword');
      const result = await resetPassword({ uid, clubId });
      
      const novaSenha = result.data.novaSenha;
      const successDiv = document.getElementById('newUserSuccess');
      
      successDiv.innerHTML = `
        <div style="background: #ecfdf5; border: 2px solid #059669; border-radius: 6px; padding: 15px;">
          <div style="color: #059669; font-weight: 600; margin-bottom: 12px;">🔄 Nova senha gerada com sucesso!</div>
          <div style="background: white; border: 1px solid #d1d5db; border-radius: 4px; padding: 10px; margin-bottom: 12px;">
            <label style="display: block; color: #374151; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Nova Senha Temporária (copie abaixo):</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" value="${novaSenha}" readonly style="flex: 1; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-family: monospace; font-weight: bold; color: #dc2626; background: #fef2f2;">
              <button type="button" onclick="UserManagementModule.copiarSenha('${novaSenha}')" style="background: #3b82f6; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">📋 Copiar</button>
            </div>
          </div>
        </div>
      `;
      successDiv.style.display = 'block';
      
    } catch (err) {
      console.error('[USERS] ❌ Erro ao regenerar senha:', err);
      UI.showToast(`❌ Erro: ${err.message || 'Erro desconhecido'}`, 'error');
    }
  },

  loadUsers() {
    console.log('[USERS] Carregando usuários');
    const isPlatformAdmin = !!AuthModule.currentUser?.platform_admin;
    const clubId = ClubModule.currentClubId;

    if (!isPlatformAdmin && !clubId) {
      UI.showToast('Erro: Clube não identificado', 'error');
      return;
    }

    if (isPlatformAdmin) {
      Promise.all([
        db.ref('clubs').once('value'),
        db.ref('pendingUsers').once('value')
      ]).then(([clubsSnap, pendingSnap]) => {
        const clubs = clubsSnap.val() || {};
        const pendingUsers = [];
        const allUsers = [];
        const pendingMap = new Set();

        this.pendingClubs = Object.entries(clubs).map(([clubId, clubData]) => ({
          id: clubId,
          name: clubData?.info?.name || clubData?.nome || 'Clube'
        }));

        const pendingData = pendingSnap.val() || {};
        Object.entries(pendingData).forEach(([uid, data]) => {
          pendingUsers.push({ uid, source: 'pendingUsers', ...data });
          pendingMap.add(uid);
        });

        Object.entries(clubs).forEach(([clubKey, clubData]) => {
          const members = clubData?.members || {};
          const clubName = clubData?.info?.name || clubData?.nome || 'Clube';

          Object.keys(members).forEach(uid => {
            const user = members[uid];
            const userData = { uid, clubId: clubKey, clubName, ...user };

            if (user.status === 'pending') {
              if (!pendingMap.has(uid)) {
                pendingUsers.push(userData);
              }
            } else {
              allUsers.push(userData);
            }
          });
        });

        console.log('[USERS] Usuários pendentes (global):', pendingUsers.length);
        console.log('[USERS] Usuários totais (global):', allUsers.length);
        this.renderPendingUsers(pendingUsers);
        this.renderAllUsers(allUsers);
      }).catch(err => {
        console.error('[USERS] Erro ao carregar usuários (global):', err);
        UI.showToast('Erro ao carregar usuários', 'error');
      });
      return;
    }

    const userRef = db.ref(`clubs/${clubId}/members`);
    
    userRef.once('value').then(snap => {
      const users = snap.val() || {};
      const pendingUsers = [];
      const allUsers = [];
      
      Object.keys(users).forEach(uid => {
        const user = users[uid];
        const userData = { uid, clubId, ...user }; // ← ADICIONAR clubId aqui
        
        if (user.status === 'pending') {
          pendingUsers.push(userData);
        } else {
          allUsers.push(userData);
        }
      });
      
      console.log('[USERS] Usuários pendentes:', pendingUsers.length);
      console.log('[USERS] Usuários totais:', allUsers.length);
      this.renderPendingUsers(pendingUsers);
      this.renderAllUsers(allUsers);
    }).catch(err => {
      console.error('[USERS] Erro ao carregar usuários:', err);
      UI.showToast('Erro ao carregar usuários', 'error');
    });
  },

  getPendingSelectedClubId(uid) {
    const select = document.getElementById(`pending-club-${uid}`);
    return select ? select.value : null;
  },

  getPendingSelectedRole(uid) {
    const select = document.getElementById(`pending-role-${uid}`);
    return select ? select.value : null;
  },

  getClubNameById(clubId) {
    const club = this.pendingClubs.find(item => item.id === clubId);
    return club ? club.name : 'Clube';
  },

  renderPendingUsers(users) {
    const container = document.getElementById('pending-users-list');
    if (!container) return;
    const isPlatformAdmin = !!AuthModule.currentUser?.platform_admin;
    
    // Limpar container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    if (users.length === 0) {
      const emptyMsg = createSafeElement('p', {
        text: 'Nenhum usuário aguardando aprovação',
        style: { textAlign: 'center', color: '#666' }
      });
      container.appendChild(emptyMsg);
      return;
    }
    
    const wrapper = createSafeElement('div', {
      style: { display: 'grid', gap: '15px' }
    });
    
    users.forEach(user => {
      const card = createSafeElement('div', {
        style: { 
          border: '1px solid #ddd', 
          padding: '15px', 
          borderRadius: '8px'
        }
      });
      
      const gridContainer = createSafeElement('div', {
        style: {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px'
        }
      });
      
      // Coluna esquerda - Info do usuário
      const infoCol = createSafeElement('div');
      
      const nomeEl = createSafeElement('p');
      const nomeBold = createSafeElement('strong', { text: user.nome || user.email || 'Usuário' });
      nomeEl.appendChild(nomeBold);
      
      const emailEl = createSafeElement('p', {
        text: user.email || '',
        style: { color: '#666', fontSize: '0.9em' }
      });
      
      const createdAt = user.joinedAt || user.createdAt;
      const createdLabel = createdAt ? new Date(createdAt).toLocaleDateString('pt-BR') : 'Data indisponível';
      const dataEl = createSafeElement('p', {
        text: createdLabel,
        style: { color: '#666', fontSize: '0.85em' }
      });

      if (user.clubName) {
        const clubEl = createSafeElement('p', {
          text: `Clube: ${user.clubName}`,
          style: { color: '#666', fontSize: '0.85em' }
        });
        infoCol.appendChild(clubEl);
      }

      if (isPlatformAdmin) {
        const clubWrap = createSafeElement('div', {
          style: { marginTop: '6px' }
        });

        const clubLabel = createSafeElement('label', {
          text: 'Clube para aprovar',
          style: { color: '#666', fontSize: '0.85em', display: 'block', marginBottom: '4px' }
        });

        const clubSelect = document.createElement('select');
        clubSelect.id = `pending-club-${user.uid}`;
        clubSelect.style.cssText = 'width: 100%; padding: 6px 8px; border: 1px solid #ddd; border-radius: 6px; background: white;';

        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = 'Selecione um clube';
        clubSelect.appendChild(placeholderOption);

        this.pendingClubs.forEach(club => {
          const option = document.createElement('option');
          option.value = club.id;
          option.textContent = club.name;
          clubSelect.appendChild(option);
        });

        if (user.clubId) {
          clubSelect.value = user.clubId;
        }

        clubWrap.appendChild(clubLabel);
        clubWrap.appendChild(clubSelect);
        infoCol.appendChild(clubWrap);
      }

      if (isPlatformAdmin) {
        const roleWrap = createSafeElement('div', {
          style: { marginTop: '10px' }
        });

        const roleLabel = createSafeElement('label', {
          text: 'Perfil para aprovar',
          style: { color: '#666', fontSize: '0.85em', display: 'block', marginBottom: '4px' }
        });

        const roleSelect = document.createElement('select');
        roleSelect.id = `pending-role-${user.uid}`;
        roleSelect.style.cssText = 'width: 100%; padding: 6px 8px; border: 1px solid #ddd; border-radius: 6px; background: white;';

        this.pendingRoles.forEach(role => {
          const option = document.createElement('option');
          option.value = role.value;
          option.textContent = role.label;
          roleSelect.appendChild(option);
        });

        roleSelect.value = user.role || 'jogador';

        roleWrap.appendChild(roleLabel);
        roleWrap.appendChild(roleSelect);
        infoCol.appendChild(roleWrap);
      }
      
      infoCol.appendChild(nomeEl);
      infoCol.appendChild(emailEl);
      infoCol.appendChild(dataEl);
      
      // Coluna direita - Botões
      const btnCol = createSafeElement('div', {
        style: {
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start'
        }
      });
      
      const btnApprove = createSafeElement('button', {
        text: '✓ Aprovar',
        class: 'btn-mini',
        onclick: () => {
          const selectedClubId = isPlatformAdmin ? this.getPendingSelectedClubId(user.uid) : null;
          const selectedRole = isPlatformAdmin ? this.getPendingSelectedRole(user.uid) : null;
          this.approveUser(user, selectedClubId || user.clubId || null, selectedRole || user.role || null);
        }
      });
      
      const btnReject = createSafeElement('button', {
        text: '✗ Rejeitar',
        class: 'btn-mini',
        onclick: () => {
          const selectedClubId = isPlatformAdmin ? this.getPendingSelectedClubId(user.uid) : null;
          this.rejectUser(user, selectedClubId || user.clubId || null);
        }
      });
      
      btnCol.appendChild(btnApprove);
      btnCol.appendChild(btnReject);
      
      gridContainer.appendChild(infoCol);
      gridContainer.appendChild(btnCol);
      card.appendChild(gridContainer);
      wrapper.appendChild(card);
    });
    
    container.appendChild(wrapper);
  },

  renderAllUsers(users) {
    const container = document.getElementById('all-users-list');
    if (!container) return;

    // Limpar container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    if (users.length === 0) {
      const emptyMsg = createSafeElement('p', {
        text: 'Nenhum outro usuário no clube',
        style: { textAlign: 'center', color: '#666' }
      });
      container.appendChild(emptyMsg);
      return;
    }

    // Criar tabela
    const table = document.createElement('table');
    table.style.cssText = 'width: 100%; border-collapse: collapse;';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.cssText = 'background: var(--bg-secondary); border-bottom: 2px solid var(--border-color);';
    
    const isPlatformAdmin = !!AuthModule.currentUser?.platform_admin;
    const headers = ['Nome', 'Email', 'Role', 'Status'];
    if (isPlatformAdmin) headers.push('Clube');
    headers.push('Ações');
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      th.style.cssText = 'padding: 12px; text-align: left; font-weight: 600; color: var(--text-primary);';
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    users.forEach((user, index) => {
      const row = document.createElement('tr');
      row.style.cssText = `border-bottom: 1px solid var(--border-color); ${index % 2 === 0 ? 'background: var(--card-bg);' : ''}`;

      // Nome
      const tdNome = document.createElement('td');
      tdNome.textContent = user.nome;
      tdNome.style.cssText = 'padding: 12px;';
      row.appendChild(tdNome);

      // Email
      const tdEmail = document.createElement('td');
      tdEmail.textContent = user.email;
      tdEmail.style.cssText = 'padding: 12px; font-size: 0.9em; color: var(--text-secondary);';
      row.appendChild(tdEmail);

      // Role
      const tdRole = document.createElement('td');
      tdRole.textContent = user.role === 'admin' ? '👑 Admin' : user.role === 'diretor' ? '👔 Diretor' : '👥 Jogador';
      tdRole.style.cssText = 'padding: 12px;';
      row.appendChild(tdRole);

      // Status
      const tdStatus = document.createElement('td');
      let statusColor = '#4CAF50';
      let statusText = 'Ativo';
      if (user.status === 'inactive') {
        statusColor = '#FF9800';
        statusText = 'Inativo';
      } else if (user.status === 'rejected') {
        statusColor = '#f44336';
        statusText = 'Rejeitado';
      }
      tdStatus.innerHTML = `<span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${statusText}</span>`;
      tdStatus.style.cssText = 'padding: 12px;';
      row.appendChild(tdStatus);

      if (isPlatformAdmin) {
        const tdClub = document.createElement('td');
        tdClub.textContent = user.clubName || '-';
        tdClub.style.cssText = 'padding: 12px; font-size: 0.9em; color: var(--text-secondary);';
        row.appendChild(tdClub);
      }

      // Ações
      const tdAcoes = document.createElement('td');
      tdAcoes.style.cssText = 'padding: 12px; text-align: center; display: flex; gap: 6px; flex-direction: column;';

      if (user.status === 'approved') {
        // Botão redefinir senha
        const btnRedefinir = document.createElement('button');
        btnRedefinir.textContent = '🔐 Redefinir Senha';
        btnRedefinir.className = 'btn-mini';
        btnRedefinir.style.cssText = 'background: #8b5cf6; font-size: 11px;';
        btnRedefinir.onclick = () => this.regenerarSenhaTemporaria(user.uid, user.clubId, user.email);
        tdAcoes.appendChild(btnRedefinir);

        // Botão desativar
        const btnDesativar = document.createElement('button');
        btnDesativar.textContent = '⏸️ Desativar';
        btnDesativar.className = 'btn-mini';
        btnDesativar.style.cssText = 'font-size: 11px;';
        btnDesativar.onclick = () => this.deactivateUser(user.uid, user.nome, user.clubId);
        tdAcoes.appendChild(btnDesativar);
      } else if (user.status === 'inactive') {
        const btnReativar = document.createElement('button');
        btnReativar.textContent = '▶️ Reativar';
        btnReativar.className = 'btn-mini';
        btnReativar.style.cssText = 'background: var(--success-color);';
        btnReativar.onclick = () => this.reactivateUser(user.uid, user.nome, user.clubId);
        tdAcoes.appendChild(btnReativar);
      }

      row.appendChild(tdAcoes);
      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    container.appendChild(table);
  },

  approveUser(user, clubIdOverride = null, roleOverride = null) {
    const uid = user.uid;
    const nome = user.nome || user.email || 'Usuário';
    UI.showConfirm(
      `Aprovar acesso para ${nome}?\n\nO usuário poderá acessar o sistema após aprovação.`,
      async () => {
        const clubId = clubIdOverride || user.clubId || ClubModule.currentClubId;
        const roleToApply = roleOverride || user.role || 'jogador';
        if (!clubId) {
          UI.showToast('Selecione um clube para aprovar o usuário', 'error');
          return;
        }
        
        try {
          if (user.source === 'pendingUsers') {
            const clubName = this.getClubNameById(clubId);
            const memberRef = db.ref(`clubs/${clubId}/members/${uid}`);
            const memberSnap = await memberRef.once('value');

            if (!memberSnap.exists()) {
              const login = (user.email || '').split('@')[0] || 'usuario';
              await memberRef.set({
                login: login,
                email: user.email || '',
                nome: user.nome || 'Usuário',
                role: roleToApply,
                status: 'pending',
                joinedAt: new Date().toISOString()
              });

              await db.ref(`userClubs/${uid}/${clubId}`).set({
                clubId: clubId,
                clubName: clubName,
                joinedAt: new Date().toISOString()
              });
            } else if (roleToApply) {
              await memberRef.update({ role: roleToApply });
            }
          } else if (roleToApply) {
            await db.ref(`clubs/${clubId}/members/${uid}`).update({ role: roleToApply });
          }

          // Chamar Cloud Function para aprovar usuário (validação server-side)
          const result = await functions.httpsCallable('approveUser')({
            clubId,
            targetUserId: uid
          });
          
          console.log('[USERS] Usuário aprovado via Cloud Function:', result.data);
          
          // Sincronizar custom claims automaticamente
          try {
            const syncClaims = functions.httpsCallable('syncUserClaims');
            await syncClaims({ userId: uid });
            console.log('[USERS] Custom claims sincronizados após aprovação');
          } catch (claimsErr) {
            console.warn('[USERS] Aviso: Não foi possível sincronizar claims automaticamente:', claimsErr);
          }

          if (user.source === 'pendingUsers') {
            await db.ref(`pendingUsers/${uid}`).remove();
          }
          
          UI.showToast(`${nome} foi aprovado com sucesso!`, 'success');
          UI.showToast('✅ O usuário deve fazer logout/login para aplicar as permissões', 'info', 8000);
          
          this.loadUsers();
        } catch (err) {
          console.error('[USERS] Erro ao aprovar:', err);
          UI.showToast(`Erro ao aprovar: ${err.message || 'Erro desconhecido'}`, 'error');
        }
      }
    );
  },

  async rejectUser(user, clubIdOverride = null) {
    const nome = user.nome || user.email || 'Usuário';
    const reason = prompt(`Motivo para rejeitar ${nome}:`);
    if (reason === null) return; // Cancelado
    
    const clubId = clubIdOverride || user.clubId || ClubModule.currentClubId;

    if (user.source === 'pendingUsers') {
      await db.ref(`pendingUsers/${user.uid}`).remove();
      UI.showToast(`${nome} foi rejeitado`, 'success');
      this.loadUsers();
      return;
    }

    if (!clubId) {
      UI.showToast('Erro: Clube não identificado', 'error');
      return;
    }
    
    try {
      // Chamar Cloud Function para rejeitar usuário (validação server-side)
      const result = await functions.httpsCallable('rejectUser')({
        clubId,
        targetUserId: user.uid,
        reason: reason || 'Não especificado'
      });
      
      console.log('[USERS] Usuário rejeitado via Cloud Function:', result.data);
      UI.showToast(`${nome} foi rejeitado`, 'success');
      this.loadUsers();
    } catch (err) {
      console.error('[USERS] Erro ao rejeitar:', err);
      UI.showToast(`Erro ao rejeitar: ${err.message || 'Erro desconhecido'}`, 'error');
    }
  },

  async deactivateUser(uid, nome, clubIdOverride = null) {
    UI.showConfirm(
      `Desativar ${nome}?\n\nO usuário não poderá mais acessar o sistema, mas os dados serão preservados.`,
      async () => {
        const clubId = clubIdOverride || ClubModule.currentClubId;
        if (!clubId) {
          UI.showToast('Erro: Clube não identificado', 'error');
          return;
        }

        try {
          UI.showToast('⏳ Desativando usuário e sincronizando permissões...', 'info');
          
          await db.ref(`clubs/${clubId}/members/${uid}`).update({
            status: 'inactive',
            deactivatedAt: new Date().toISOString(),
            deactivatedBy: AuthModule.currentUser?.email || 'admin'
          });

          // Sincronizar custom claims automaticamente
          try {
            const syncClaims = functions.httpsCallable('syncUserClaims');
            await syncClaims({ userId: uid });
            console.log('[USERS] Custom claims sincronizados após desativação');
          } catch (claimsErr) {
            console.warn('[USERS] Aviso: Não foi possível sincronizar claims automaticamente:', claimsErr);
            // Não interrompe o fluxo
          }

          UI.showToast(`${nome} foi desativado. Ele precisará fazer login novamente para as mudanças terem efeito.`, 'success');
          this.loadUsers();
        } catch (err) {
          console.error('[USERS] Erro ao desativar usuário:', err);
          UI.showToast(`Erro ao desativar: ${err.message}`, 'error');
        }
      }
    );
  },

  async reactivateUser(uid, nome, clubIdOverride = null) {
    UI.showConfirm(
      `Reativar ${nome}?\n\nO usuário voltará a ter acesso ao sistema.`,
      async () => {
        const clubId = clubIdOverride || ClubModule.currentClubId;
        if (!clubId) {
          UI.showToast('Erro: Clube não identificado', 'error');
          return;
        }

        try {
          UI.showToast('⏳ Reativando usuário e sincronizando permissões...', 'info');
          
          await db.ref(`clubs/${clubId}/members/${uid}`).update({
            status: 'approved',
            reactivatedAt: new Date().toISOString(),
            reactivatedBy: AuthModule.currentUser?.email || 'admin'
          });

          // Sincronizar custom claims automaticamente
          try {
            const syncClaims = functions.httpsCallable('syncUserClaims');
            await syncClaims({ userId: uid });
            console.log('[USERS] Custom claims sincronizados após reativação');
          } catch (claimsErr) {
            console.warn('[USERS] Aviso: Não foi possível sincronizar claims automaticamente:', claimsErr);
            // Não interrompe o fluxo
          }

          UI.showToast(`${nome} foi reativado. Ele precisará fazer login novamente para as mudanças terem efeito.`, 'success');
          this.loadUsers();
        } catch (err) {
          console.error('[USERS] Erro ao reativar usuário:', err);
          UI.showToast(`Erro ao reativar: ${err.message}`, 'error');
        }
      }
    );
  }
};

// ===========================
// MÓDULO: JOGADORES
// ===========================

const JogadoresModule = {
  currentEditId: null,
  currentIsento: false,
  filterNome: '',
  filterPosicao: '',
  filterMes: '',
  sortBy: 'nome',
  sortOrder: 'asc',
  mostrarTodosMeses: false, // Por padrão mostra apenas mês atual

  async init() {
    // Se for admin global, chamar seletor de clube
    let adminSelectorHtml = '';
    if (AuthModule.currentUser?.platform_admin) {
      const selector = await ClubModule.getAdminGlobalClubSelector();
      if (selector) {
        adminSelectorHtml = selector.html;
      }
    }

    const isReadOnly = AuthModule.currentUser?.role === 'jogador';
    const actionsHeader = isReadOnly ? '' : '<th>Ações</th>';
    const isentoHeader = isReadOnly ? '' : '<th>Isento</th>';
    const container = document.getElementById('main-content');
    container.innerHTML = `
      ${adminSelectorHtml}
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
          <div class="form-column">
            <div class="form-group">
              <label>Mensalidade Isenta</label>
              <label class="toggle-switch">
                <input id="jogadorIsento" type="checkbox">
                <span class="toggle-slider"></span>
                <span class="toggle-label">Isento</span>
              </label>
              <small class="helper-text">Use para goleiros isentos (nao gera pendencia)</small>
            </div>
          </div>
        </div>
        <div class="action-row jogadores-actions">
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
              <label for="filterMes">Filtrar por Mês (YYYY-MM)</label>
              <input id="filterMes" type="month" onchange="JogadoresModule.applyFilters()">
            </div>
          </div>
          <div class="form-column">
            <div class="form-group">
              <label for="sortBy">Ordenar por</label>
              <select id="sortBy" onchange="JogadoresModule.applyFilters()">
                <option value="nome">Nome (A-Z)</option>
                <option value="nome-desc">Nome (Z-A)</option>
                <option value="posicao">Posição</option>
              </select>
            </div>
          </div>
          <div class="form-column" style="display: flex; align-items: flex-end;">
            <button class="btn-secondary" onclick="JogadoresModule.clearFilters()">Limpar Filtros</button>
          </div>
        </div>
        <div id="jogadores-active-filters" class="filter-chips"></div>
      </div>

      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <button 
          id="btnToggleMeses" 
          class="btn-secondary" 
          style="padding: 8px 16px; font-size: 14px;" 
          onclick="JogadoresModule.toggleMeses()">
          📅 Expandir Todos os Meses
        </button>
        <small style="color: var(--text-secondary);">Por padrão exibe apenas o mês atual</small>
      </div>

      <div class="table-responsive">
        <table id="jogadores-table-container">
          <thead>
            <tr id="jogadores-header-row">
              <th onclick="JogadoresModule.sortTable('nome')" style="cursor: pointer;">Nome ↕</th>
              <th onclick="JogadoresModule.sortTable('posicao')" style="cursor: pointer;">Posição ↕</th>
              ${actionsHeader}
              ${isentoHeader}
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
    const isento = !!document.getElementById('jogadorIsento')?.checked;
    
    if (!nome || !posicao) {
      UI.showToast('Preencha nome e posição', 'error');
      return;
    }

    const jogadorId = id || this.currentEditId || dbRef().child('jogadores').push().key;
    
    const mensalidades = {};

    dbRef('jogadores/' + jogadorId).set({
      id: jogadorId,
      nome,
      posicao,
      valorMensalidade,
      isento: isento,
      mensalidades
    }).then(() => {
      const acao = this.currentEditId ? 'editar_jogador' : 'adicionar_jogador';
      const descricao = this.currentEditId ? `Editou o jogador ${nome}` : `Adicionou o jogador ${nome}`;
      const isNew = !this.currentEditId;
      
      // Rastrear ação
      MonitoringModule.trackEvent(isNew ? TRACKING_EVENTS.JOGADOR_ADDED : 'jogador_edited', {
        jogador_id: jogadorId,
        jogador_nome: nome,
        posicao: posicao,
        valor_mensalidade: valorMensalidade
      });
      
      AuthModule.logAction(acao, descricao, { jogador: nome, posicao });
      UI.showToast('Jogador salvo com sucesso!', 'success');
      UI.clearInputs(['nome', 'posicao', 'valorMensalidade']);
      const isentoInput = document.getElementById('jogadorIsento');
      if (isentoInput) isentoInput.checked = false;
      this.currentEditId = null;
      this.currentIsento = false;
      document.getElementById('salvarJogador').textContent = '✓ Salvar Jogador';
      this.load();
    }).catch(err => {
      UI.showToast('Erro ao salvar jogador', 'error');
      MonitoringModule.captureException(err, {
        action: 'save_jogador',
        jogador_nome: nome
      }, 'error');
      console.error(err);
    });
  },

  load() {
    const tabela = document.getElementById('jogadores-table');
    const tbody = tabela?.parentElement;
    if (!tbody) return;
    const isReadOnly = AuthModule.currentUser?.role === 'jogador';
    
    UI.showLoading(tabela);

    dbRef('jogadores').once('value').then(snap => {
      const data = snap.val();
      
      if (!data) {
        // Limpar tabela de forma segura
        if (tabela) {
          while (tabela.firstChild) {
            tabela.removeChild(tabela.firstChild);
          }
          const row = document.createElement('tr');
          const cell = document.createElement('td');
          cell.colSpan = isReadOnly ? 2 : 4;
          cell.textContent = 'Nenhum jogador cadastrado'; // Texto seguro
          cell.style.cssText = 'text-align: center; color: #999;';
          row.appendChild(cell);
          tabela.appendChild(row);
        }
        return;
      }

      this.allData = Object.values(data);
      this.applyFilters();
    }).catch(err => {
      UI.showToast('Erro ao carregar jogadores', 'error');
      MonitoringModule.captureException(err, { action: 'load_jogadores' }, 'error');
      console.error(err);
    });
  },

  applyFilters() {
    const tabela = document.getElementById('jogadores-table');
    if (!this.allData) return;

    const filterNome = document.getElementById('filterNome')?.value.toLowerCase() || '';
    const filterPosicao = document.getElementById('filterPosicao')?.value.toLowerCase() || '';
    const filterMesRaw = document.getElementById('filterMes')?.value || '';
    const filterMes = normalizeMonthKey(filterMesRaw);
    const sortBy = document.getElementById('sortBy')?.value || 'nome';

    let filtered = this.allData.filter(j => {
      const nomeMatch = !filterNome || j.nome.toLowerCase().includes(filterNome);
      const posicaoMatch = !filterPosicao || j.posicao.toLowerCase().includes(filterPosicao);
      
      let mesMatch = true;
      if (filterMes) {
        const { map } = normalizeMensalidades(j);
        const mensal = map[filterMes];
        mesMatch = mensal && mensal.pago;
      }
      
      return nomeMatch && posicaoMatch && mesMatch;
    });

    const chipsEl = document.getElementById('jogadores-active-filters');
    if (chipsEl) {
      const chips = [];
      if (filterNome) chips.push(`Nome: ${filterNome}`);
      if (filterPosicao) chips.push(`Posição: ${filterPosicao}`);
      if (filterMes) chips.push(`Mês: ${formatMonthLabel(filterMes)}`);
      chipsEl.innerHTML = chips.length
        ? chips.map(text => `<span class="filter-chip">${text}</span>`).join('')
        : '<span class="filter-chip muted">Sem filtros</span>';
    }

    // Ordenação
    filtered.sort((a, b) => {
      if (sortBy === 'nome') {
        return a.nome.localeCompare(b.nome);
      } else if (sortBy === 'nome-desc') {
        return b.nome.localeCompare(a.nome);
      } else if (sortBy === 'posicao') {
        return a.posicao.localeCompare(b.posicao);
      }
      return 0;
    });

    const monthKeys = collectMonthKeysFromPlayers(filtered, filterMes);
    this.renderTable(filtered, monthKeys);
  },

  clearFilters() {
    const filterNomeEl = document.getElementById('filterNome');
    const filterPosicaoEl = document.getElementById('filterPosicao');
    const filterMesEl = document.getElementById('filterMes');
    const sortByEl = document.getElementById('sortBy');
    if (filterNomeEl) filterNomeEl.value = '';
    if (filterPosicaoEl) filterPosicaoEl.value = '';
    if (filterMesEl) filterMesEl.value = '';
    if (sortByEl) sortByEl.value = 'nome';
    this.applyFilters();
  },

  toggleMeses() {
    this.mostrarTodosMeses = !this.mostrarTodosMeses;
    const btn = document.getElementById('btnToggleMeses');
    if (btn) {
      btn.textContent = this.mostrarTodosMeses 
        ? '📅 Mostrar Apenas Mês Atual' 
        : '📅 Expandir Todos os Meses';
    }
    // Recarregar para aplicar mudança
    this.load();
  },

  renderTable(jogadores, monthKeys) {
    const isReadOnly = AuthModule.currentUser?.role === 'jogador';
    const tabela = document.getElementById('jogadores-table');
    let keys = monthKeys || collectMonthKeysFromPlayers(jogadores);
    
    // Se não deve mostrar todos os meses, filtrar apenas o mês atual
    if (!this.mostrarTodosMeses) {
      const mesAtual = getCurrentMonthKey();
      // Se o mês atual não está na lista, adicionar
      if (!keys.includes(mesAtual)) {
        keys = [mesAtual];
      } else {
        keys = [mesAtual];
      }
    }
    
    this.updateHeader(keys, isReadOnly);
    
    // Limpar tabela de forma segura
    while (tabela.firstChild) {
      tabela.removeChild(tabela.firstChild);
    }

    if (jogadores.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 2 + keys.length + (isReadOnly ? 0 : 2);
      cell.textContent = 'Nenhum resultado encontrado'; // Texto seguro
      cell.style.cssText = 'text-align: center; color: #999;';
      row.appendChild(cell);
      tabela.appendChild(row);
      return;
    }

    jogadores.forEach(j => {
      const { map } = normalizeMensalidades(j);
      const valorMensalidade = j.valorMensalidade || 0;
      const isento = !!j.isento;

      const row = document.createElement('tr');
      
      // Nome (seguro com textContent)
      const nomeCell = document.createElement('td');
      nomeCell.textContent = j.nome;
      nomeCell.style.fontWeight = '600';
      nomeCell.setAttribute('data-label', 'Nome');
      row.appendChild(nomeCell);
      
      // Posição (seguro com textContent)
      const posicaoCell = document.createElement('td');
      posicaoCell.textContent = j.posicao;
      posicaoCell.setAttribute('data-label', 'Posição');
      row.appendChild(posicaoCell);
      
      // Células para cada mês
      keys.forEach((monthKey) => {
        const mensal = map[monthKey];
        const pago = mensal && mensal.pago ? true : false;
        const valorPago = mensal && mensal.valorPago !== undefined ? mensal.valorPago : (mensal && mensal.valor !== undefined ? mensal.valor : valorMensalidade);
        const valor = mensal && mensal.valor !== undefined ? mensal.valor : valorMensalidade;
        
        const mesCell = document.createElement('td');
        mesCell.style.cssText = 'text-align: center; padding: 8px;';
        mesCell.setAttribute('data-label', formatMonthLabel(monthKey));
        
        if (isento) {
          const span = document.createElement('span');
          span.textContent = 'Isento';
          span.style.cssText = 'font-size: 12px; font-weight: 700; color: var(--text-secondary);';
          mesCell.appendChild(span);
        } else if (isReadOnly) {
          // Apenas leitura - sem checkbox
          const chip = document.createElement('div');
          chip.className = `chip-toggle ${pago ? 'active' : ''}`;
          chip.title = 'R$ ' + valor.toFixed(2);
          chip.style.cssText = 'flex-direction: column; height: auto; padding: 6px 10px; border-radius: 20px; display: inline-flex; cursor: default;';
          
          const valorDiv = document.createElement('div');
          valorDiv.textContent = pago ? 'R$ ' + valorPago.toFixed(2) : '-';
          valorDiv.style.cssText = 'font-size: 12px; font-weight: 700;';
          
          const checkDiv = document.createElement('div');
          checkDiv.textContent = pago ? '✓' : '';
          checkDiv.style.cssText = 'font-size: 9px; margin-top: 2px;';
          
          chip.appendChild(valorDiv);
          chip.appendChild(checkDiv);
          mesCell.appendChild(chip);
        } else {
          // Editável - com checkbox
          const label = document.createElement('label');
          label.className = `chip-toggle ${pago ? 'active' : ''}`;
          label.title = 'R$ ' + valor.toFixed(2);
          label.style.cssText = 'flex-direction: column; height: auto; padding: 6px 10px; border-radius: 20px; cursor: pointer; display: inline-flex;';
          
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.checked = pago;
          checkbox.style.display = 'none';
          
          // Event listener seguro (sem adicionar código em atributo)
          checkbox.addEventListener('change', (e) => {
            this.abrirModalPagamento(j.id, monthKey, checkbox);
          });
          
          const valorDiv = document.createElement('div');
          valorDiv.textContent = pago ? 'R$ ' + valorPago.toFixed(2) : '-';
          valorDiv.style.cssText = 'font-size: 12px; font-weight: 700;';
          
          const checkDiv = document.createElement('div');
          checkDiv.textContent = pago ? '✓' : '';
          checkDiv.style.cssText = 'font-size: 9px; margin-top: 2px;';
          
          label.appendChild(checkbox);
          label.appendChild(valorDiv);
          label.appendChild(checkDiv);
          mesCell.appendChild(label);
        }
        
        row.appendChild(mesCell);
      });

      // Coluna de ações (se não for leitura)
      if (!isReadOnly) {
        const acaoCell = document.createElement('td');
        acaoCell.setAttribute('data-label', 'Ações');
        
        const btnEditar = document.createElement('button');
        btnEditar.className = 'action-btn edit-btn';
        btnEditar.textContent = 'Editar';
        btnEditar.addEventListener('click', () => this.editar(j.id));
        
        const btnExcluir = document.createElement('button');
        btnExcluir.className = 'action-btn delete-btn';
        btnExcluir.textContent = 'Excluir';
        btnExcluir.addEventListener('click', () => this.remover(j.id));
        
        acaoCell.appendChild(btnEditar);
        acaoCell.appendChild(btnExcluir);
        row.appendChild(acaoCell);

        const isentoCell = document.createElement('td');
        isentoCell.setAttribute('data-label', 'Isento');
        const isentoLabel = document.createElement('label');
        isentoLabel.style.cssText = 'display: inline-flex; align-items: center; gap: 6px; font-weight: 600;';

        const isentoCheckbox = document.createElement('input');
        isentoCheckbox.type = 'checkbox';
        isentoCheckbox.checked = isento;
        isentoCheckbox.addEventListener('change', () => {
          this.toggleIsento(j.id, isentoCheckbox.checked);
        });

        const isentoText = document.createElement('span');
        isentoText.textContent = 'Isento';

        isentoLabel.appendChild(isentoCheckbox);
        isentoLabel.appendChild(isentoText);
        isentoCell.appendChild(isentoLabel);
        row.appendChild(isentoCell);
      }

      tabela.appendChild(row);
    });
  },

  updateHeader(monthKeys, isReadOnly) {
    const headerRow = document.getElementById('jogadores-header-row');
    if (!headerRow) return;

    const actionsHeader = isReadOnly ? '' : '<th>Ações</th>';
    const isentoHeader = isReadOnly ? '' : '<th>Isento</th>';
    headerRow.innerHTML = `
      <th onclick="JogadoresModule.sortTable('nome')" style="cursor: pointer;">Nome ↕</th>
      <th onclick="JogadoresModule.sortTable('posicao')" style="cursor: pointer;">Posição ↕</th>
      ${monthKeys.map(key => `<th style="text-align: center; padding: 12px 8px; font-size: 11px; font-weight: 700; min-width: 70px;">${formatMonthLabel(key)}</th>`).join('')}
      ${actionsHeader}
      ${isentoHeader}
    `;
  },

  abrirModalPagamento(jogadorId, monthKey, checkbox) {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    // Buscar dados do jogador
    dbRef('jogadores/' + jogadorId).once('value').then(snap => {
      const j = snap.val();
      const normalizedKey = normalizeMonthKey(monthKey);
      const { map } = normalizeMensalidades(j);
      const mensal = map[normalizedKey] || { pago: false, valor: j.valorMensalidade || 0, valorPago: 0 };
      const valorPadrao = mensal.valor || j.valorMensalidade || 0;
      const mesLabel = formatMonthLabel(normalizedKey);

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
          <div style="margin-bottom: 12px; color: var(--text-secondary); font-size: 13px;">
            Mês: <strong>${mesLabel || normalizedKey}</strong>
          </div>
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
            <button onclick="JogadoresModule.salvarPagamento('${jogadorId}', '${normalizedKey}', ${checkbox.checked})"
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

  async salvarPagamento(jogadorId, monthKey, marcadoComoPago) {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    const normalizedKey = normalizeMonthKey(monthKey);
    const valorPago = document.getElementById('valorPagoInput')?.value || 0;
    
    if (marcadoComoPago && (!valorPago || valorPago <= 0)) {
      UI.showToast('Informe um valor válido', 'error');
      return;
    }

    if (!normalizedKey) {
      UI.showToast('Mês inválido', 'error');
      return;
    }

    try {
      const snap = await dbRef('jogadores/' + jogadorId).once('value');
      const jogador = snap.val() || {};
      if (jogador.isento) {
        UI.showToast('Jogador isento não possui mensalidade', 'info');
        return;
      }
      const { map, migrated } = normalizeMensalidades(jogador);
      const mensalAtual = map[normalizedKey] || {};
      const valorBase = mensalAtual.valor || jogador.valorMensalidade || 0;
      const valorPagoNum = parseFloat(valorPago) || 0;

      const update = {
        [`mensalidades/${normalizedKey}/pago`]: marcadoComoPago,
        [`mensalidades/${normalizedKey}/valor`]: valorBase,
        [`mensalidades/${normalizedKey}/valorPago`]: marcadoComoPago ? valorPagoNum : 0,
        [`mensalidades/${normalizedKey}/dataPagamento`]: marcadoComoPago ? new Date().toISOString().split('T')[0] : null
      };

      if (migrated) {
        update.mensalidades = map;
      }

      await dbRef('jogadores/' + jogadorId).update(update);
      const descricao = marcadoComoPago ? `Registrou pagamento de mensalidade: R$ ${valorPagoNum.toFixed(2)}` : 'Removeu registro de pagamento';
      AuthModule.logAction('pagamento_mensalidade', descricao, { valor: valorPagoNum, mes: formatMonthLabel(normalizedKey) });
      UI.showToast(marcadoComoPago ? 'Pagamento registrado!' : 'Pagamento removido!', 'success');
      document.body.removeChild(document.querySelector('[data-modal-pagamento]'));
      this.load();
    } catch (err) {
      UI.showToast('Erro ao salvar pagamento', 'error');
      console.error(err);
    }
  },

  sortTable(campo) {
    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
      if (campo === 'nome') sortBy.value = sortBy.value === 'nome' ? 'nome-desc' : 'nome';
      else if (campo === 'posicao') sortBy.value = 'posicao';
      this.applyFilters();
    }
  },

  editar(id) {
    dbRef('jogadores/' + id).once('value').then(snap => {
      const j = snap.val();
      document.getElementById('nome').value = j.nome;
      document.getElementById('posicao').value = j.posicao;
      document.getElementById('valorMensalidade').value = j.valorMensalidade || 0;
      const isentoInput = document.getElementById('jogadorIsento');
      if (isentoInput) isentoInput.checked = !!j.isento;
      this.currentIsento = !!j.isento;
      document.getElementById('salvarJogador').textContent = 'Atualizar Jogador';
      this.currentEditId = id;
      window.scrollTo(0, 0);
    });
  },

  async toggleIsento(jogadorId, isento) {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    try {
      await dbRef('jogadores/' + jogadorId).update({ isento: !!isento });
      AuthModule.logAction('alterar_isencao', `Atualizou isenção: ${isento ? 'isento' : 'nao isento'}`, { jogadorId, isento: !!isento });
      UI.showToast(isento ? 'Jogador marcado como isento' : 'Jogador removido da isenção', 'success');
      this.load();
    } catch (err) {
      console.error('Erro ao atualizar isencao:', err);
      UI.showToast('Erro ao atualizar isenção', 'error');
    }
  },

  remover(id) {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    
    dbRef('jogadores/' + id).once('value').then(snap => {
      const j = snap.val() || {};
      const nome = j.nome || 'Jogador';
      const posicao = j.posicao || 'N/A';
      const numero = j.numero ? ` #${j.numero}` : '';
      
      const mensagem = `Excluir jogador?\n\nNome: ${nome}${numero}\nPosição: ${posicao}\n\n⚠️ Esta ação não pode ser desfeita!\nTodos os dados e estatísticas serão perdidos.`;
      
      UI.showConfirm(mensagem, () => {
        dbRef('jogadores/' + id).remove().then(() => {
          // Rastrear remoção de jogador
          MonitoringModule.trackEvent(TRACKING_EVENTS.JOGADOR_DELETED, {
            jogador_id: id,
            jogador_nome: nome,
            posicao: posicao
          });
          
          AuthModule.logAction('remover_jogador', `Removeu o jogador ${j.nome || ''}`.trim(), { jogadorId: id, nome: j.nome || '' });
          UI.showToast('Jogador removido!', 'success');
          this.load();
        }).catch(err => {
          MonitoringModule.captureException(err, {
            action: 'delete_jogador',
            jogador_id: id,
            jogador_nome: nome
          }, 'error');
          UI.showToast('Erro ao remover jogador', 'error');
        });
      });
    }).catch(err => {
      MonitoringModule.captureException(err, {
        action: 'load_jogador_for_deletion',
        jogador_id: id
      }, 'error');
      UI.showToast('Erro ao carregar dados do jogador', 'error');
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

  async init() {
    // Se for admin global, chamar seletor de clube
    let adminSelectorHtml = '';
    if (AuthModule.currentUser?.platform_admin) {
      const selector = await ClubModule.getAdminGlobalClubSelector();
      if (selector) {
        adminSelectorHtml = selector.html;
      }
    }

    const isReadOnly = AuthModule.currentUser?.role === 'jogador';
    const actionsHeader = isReadOnly ? '' : '<th>Ações</th>';
    const container = document.getElementById('main-content');
    container.innerHTML = `
      ${adminSelectorHtml}
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

      <div class="games-grid" style="margin-top: 25px;">
        <div class="games-panel">
          <div class="games-panel-header">
            <h3>📅 Jogos Agendados</h3>
            <span class="games-panel-subtitle">Proximos jogos e horarios</span>
          </div>
          <div class="table-responsive games-table-wrapper">
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
        </div>

        <div class="games-panel">
          <div class="games-panel-header">
            <h3>✅ Jogos Concluídos</h3>
            <span class="games-panel-subtitle">Resultados e destaques</span>
          </div>
          <div class="table-responsive games-table-wrapper">
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
        </div>
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

    dbRef('jogadores').once('value').then(snap => {
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

    const jogoId = id || dbRef().child('jogos').push().key;
    const payload = { id: jogoId, data, hora, adversario, local, status: 'agendado' };

    dbRef('jogos/' + jogoId).set(payload).then(() => {
      const acao = id ? 'editar_jogo' : 'agendar_jogo';
      const descricao = id ? `Atualizou o jogo vs ${adversario}` : `Agendou jogo vs ${adversario}`;
      const isNew = !id;
      
      // Rastrear agendamento/edição de jogo
      MonitoringModule.trackEvent(isNew ? TRACKING_EVENTS.JOGO_SCHEDULED : 'jogo_edited', {
        jogo_id: jogoId,
        data: data,
        hora: hora,
        adversario: adversario,
        local: local || 'N/A'
      });
      
      AuthModule.logAction(acao, descricao, { jogoId, data, hora, adversario, local });
      UI.showToast('Jogo agendado!', 'success');
      UI.clearInputs(['dataJogo', 'horaJogo', 'adversario', 'localJogo']);
      this.load();
    }).catch(err => {
      UI.showToast('Erro ao agendar jogo', 'error');
      MonitoringModule.captureException(err, {
        action: 'schedule_jogo',
        jogo_id: jogoId,
        adversario: adversario,
        data: data
      }, 'error');
      console.error(err);
    });
  },

  atualizarGolsAssistencias(idJogo, golsAntigos = {}, assistenciasAntigas = {}, golsNovos = {}, assistenciasNovas = {}) {
    // Desfazer os valores antigos
    Object.entries(golsAntigos).forEach(([playerId, gols]) => {
      const ref = dbRef('jogadores/' + playerId + '/gols');
      ref.once('value').then(snap => {
        const valorAtual = snap.val() || 0;
        ref.set(Math.max(0, valorAtual - gols));
      });
    });

    Object.entries(assistenciasAntigas).forEach(([playerId, ast]) => {
      const ref = dbRef('jogadores/' + playerId + '/assistencias');
      ref.once('value').then(snap => {
        const valorAtual = snap.val() || 0;
        ref.set(Math.max(0, valorAtual - ast));
      });
    });

    // Aplicar os novos valores
    Object.entries(golsNovos).forEach(([playerId, gols]) => {
      const ref = dbRef('jogadores/' + playerId + '/gols');
      ref.once('value').then(snap => {
        ref.set((snap.val() || 0) + gols);
      });
    });

    Object.entries(assistenciasNovas).forEach(([playerId, ast]) => {
      const ref = dbRef('jogadores/' + playerId + '/assistencias');
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

    dbRef('jogos').once('value').then(snap => {
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
    dbRef('jogos/' + id).once('value').then(snap => {
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
    
    dbRef('jogos/' + id).once('value').then(snap => {
      const j = snap.val();
      if (!j) {
        UI.showToast('Jogo não encontrado', 'error');
        return;
      }
      
      const adversario = j.adversario || 'Adversário';
      const data = j.data || 'Data não definida';
      const local = j.local || 'Local não definido';
      const statusTexto = j.status === 'concluido' ? '⚽ Concluído' : '📅 Agendado';
      
      let mensagem = `Excluir jogo?\n\nAdversário: ${adversario}\nData: ${data}\nLocal: ${local}\nStatus: ${statusTexto}`;
      
      if (j.status === 'concluido') {
        mensagem += `\n\n⚠️ Atenção: Este jogo está concluído!\nGols e assistências dos jogadores serão removidos.`;
      }
      
      mensagem += `\n\n⚠️ Esta ação não pode ser desfeita!`;
      
      UI.showConfirm(mensagem, () => {
        if (j && j.status === 'concluido') {
          Object.entries(j.goleadores || {}).forEach(([pid, gols]) => {
            const ref = dbRef('jogadores/' + pid + '/gols');
            ref.once('value').then(s => {
              ref.set(Math.max(0, (s.val() || 0) - gols));
            });
          });
          Object.entries(j.assistencias || {}).forEach(([pid, ast]) => {
            const ref = dbRef('jogadores/' + pid + '/assistencias');
            ref.once('value').then(s => {
              ref.set(Math.max(0, (s.val() || 0) - ast));
            });
          });
        }
        dbRef('jogos/' + id).remove().then(() => {
          // Rastrear deleção de jogo
          MonitoringModule.trackEvent(TRACKING_EVENTS.JOGO_DELETED, {
            jogo_id: id,
            adversario: adversario,
            data: data,
            status: j.status || 'agendado'
          });
          
          AuthModule.logAction('remover_jogo', `Removeu o jogo vs ${j?.adversario || ''}`.trim(), { jogoId: id, data: j?.data || '', adversario: j?.adversario || '' });
          UI.showToast('Jogo removido!', 'success');
          this.load();
        }).catch(err => {
          MonitoringModule.captureException(err, {
            action: 'delete_jogo',
            jogo_id: id,
            adversario: adversario
          }, 'error');
          UI.showToast('Erro ao remover jogo', 'error');
        });
      });
    }).catch(err => {
      MonitoringModule.captureException(err, {
        action: 'load_jogo_for_deletion',
        jogo_id: id
      }, 'error');
      UI.showToast('Erro ao carregar dados do jogo', 'error');
    });
  },

  startFinalize(id) {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    this.finalizeGameId = id;
    dbRef('jogos/' + id).once('value').then(snap => {
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

    // Validação: formato do placar e consistência com gols
    const partesPlacar = placar.split('x').map(s => parseInt(s.trim(), 10));
    const golsTime = partesPlacar[0];
    const golsAdversario = partesPlacar[1];
    if (isNaN(golsTime) || isNaN(golsAdversario)) {
      UI.showToast('Placar inválido. Use o formato "N x M"', 'error');
      return;
    }

    const totalGolsMarcados = Object.values(goleadores).reduce((acc, v) => acc + v, 0);
    if (totalGolsMarcados !== golsTime) {
      UI.showToast(`Soma dos gols (${totalGolsMarcados}) difere do placar (${golsTime}). Ajuste os valores.`, 'error');
      return;
    }

    const totalAssistencias = Object.values(assistencias).reduce((acc, v) => acc + v, 0);
    if (totalAssistencias !== 0 && totalAssistencias !== golsTime) {
      // Aviso não bloqueante para assistência
      UI.showToast('Aviso: total de assistências não corresponde aos gols.', 'info');
    }

    // Verificar se está editando um jogo já concluído
    dbRef('jogos/' + id).once('value').then(snap => {
      const jogoAtual = snap.val() || {};
      const golsAntigos = jogoAtual.goleadores || {};
      const assistenciasAntigas = jogoAtual.assistencias || {};
      
      const update = { placar, goleadores, assistencias, status: 'concluido' };
      dbRef('jogos/' + id).update(update).then(() => {
        // Rastrear conclusão do jogo
        MonitoringModule.trackEvent(TRACKING_EVENTS.JOGO_FINALIZED, {
          jogo_id: id,
          placar: placar,
          gols_marcados: golsTime,
          gols_sofridos: golsAdversario,
          num_goleadores: Object.keys(goleadores).length,
          num_assistencias: Object.keys(assistencias).length
        });
        
        AuthModule.logAction('finalizar_jogo', `Finalizou o jogo ${placar}`, { jogoId: id, placar, goleadores, assistencias });
        
        // Se era agendado (primeira vez), just add
        // Se era concluído (editando), desfazer antigos e aplicar novos
        if (!jogoAtual.status || jogoAtual.status === 'agendado') {
          // Primeira vez finalizando
          this.atualizarGolsAssistencias(id, {}, {}, goleadores, assistencias);
        } else {
          // Editando um jogo já finalizado - desfazer antigos e aplicar novos
          this.atualizarGolsAssistencias(id, golsAntigos, assistenciasAntigas, goleadores, assistencias);
        }
        
        UI.showToast('Jogo finalizado!', 'success');
        this.cancelFinalize();
        this.load();
      }).catch(err => {
        MonitoringModule.captureException(err, {
          action: 'finalize_jogo',
          jogo_id: id,
          placar: placar
        }, 'error');
        UI.showToast('Erro ao finalizar jogo', 'error');
        console.error(err);
      });
    }).catch(err => {
      MonitoringModule.captureException(err, {
        action: 'load_jogo_for_finalize',
        jogo_id: id
      }, 'error');
      UI.showToast('Erro ao finalizar jogo', 'error');
      console.error(err);
    });
  }
};

// ===========================
// MÓDULO: ESTATÍSTICAS
// ===========================

const EstatisticasModule = {
  currentSort: 'gols',
  sortOrder: 'desc',
  async init() {
    // Se for admin global, chamar seletor de clube
    let adminSelectorHtml = '';
    if (AuthModule.currentUser?.platform_admin) {
      const selector = await ClubModule.getAdminGlobalClubSelector();
      if (selector) {
        adminSelectorHtml = selector.html;
      }
    }

    const container = document.getElementById('main-content');
    container.innerHTML = `
      ${adminSelectorHtml}
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

      <div class="stats-summary">
        <div class="summary-card">
          <div class="summary-label">Gols Pró</div>
          <div class="summary-value" id="golsPro">0</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Gols Contra</div>
          <div class="summary-value" id="golsContra">0</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Saldo de Gols</div>
          <div class="summary-value" id="saldoGols">0</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Jogos Concluídos</div>
          <div class="summary-value" id="jogosConcluidos">0</div>
        </div>
      </div>

      <h2 style="margin-top: 30px; margin-bottom: 20px;">Estatísticas dos Jogadores</h2>
      <div style="overflow-x: auto;">
        <table class="styled-table stats-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Jogador</th>
              <th>Posição</th>
              <th style="cursor:pointer;" onclick="EstatisticasModule.setSort('gols')">⚽ Gols <span id="sortIconGols" style="margin-left:4px; font-size:12px; color: var(--primary-color);"></span></th>
              <th style="cursor:pointer;" onclick="EstatisticasModule.setSort('assistencias')">🎯 Assistências <span id="sortIconAssistencias" style="margin-left:4px; font-size:12px; color: var(--primary-color);"></span></th>
            </tr>
          </thead>
          <tbody id="stats-table"></tbody>
        </table>
      </div>
    `;
    this.updateSortIcons();
    this.load();
  },

  load() {
    // Carregar estatísticas dos jogadores
    dbRef('jogadores').once('value').then(jogadoresSnap => {
      const jogadores = jogadoresSnap.val() || {};
      
      // Carregar dados dos jogos para calcular estatísticas
      dbRef('jogos').once('value').then(jogosSnap => {
        const jogos = jogosSnap.val() || {};
        let jogosConcluidos = 0;
        let golsPro = 0;
        let golsContra = 0;
        Object.values(jogos).forEach(jogo => {
          if (jogo.status === 'concluido' && jogo.placar) {
            const placar = jogo.placar.split('x').map(s => parseInt(s.trim(), 10));
            const golsTime = placar[0];
            const golsAdv = placar[1];
            if (!isNaN(golsTime) && !isNaN(golsAdv)) {
              golsPro += golsTime;
              golsContra += golsAdv;
              jogosConcluidos += 1;
            }
          }
        });
        
        // Calcular vitórias, empates, derrotas
        this.calcularResultados(jogos);
        
        // Recalcular estatísticas a partir dos jogos (não confiar nos valores salvos)
        const estadisticas = this.calcularEstatisticasDoJogos(jogos, jogadores);

        const golsProEl = document.getElementById('golsPro');
        const golsContraEl = document.getElementById('golsContra');
        const saldoGolsEl = document.getElementById('saldoGols');
        const jogosConcluidosEl = document.getElementById('jogosConcluidos');
        if (golsProEl) golsProEl.textContent = String(golsPro);
        if (golsContraEl) golsContraEl.textContent = String(golsContra);
        if (saldoGolsEl) saldoGolsEl.textContent = String(golsPro - golsContra);
        if (jogosConcluidosEl) jogosConcluidosEl.textContent = String(jogosConcluidos);
        
        // Preparar dados dos jogadores com estatísticas recalculadas
        const jogadoresArray = Object.values(jogadores)
          .map(j => ({
            ...j,
            gols: estadisticas[j.id]?.gols || 0,
            assistencias: estadisticas[j.id]?.assistencias || 0
          }))
          .sort((a, b) => {
            const ga = a.gols || 0;
            const gb = b.gols || 0;
            const aa = a.assistencias || 0;
            const ab = b.assistencias || 0;
            // Define primário e secundário conforme critério
            const primA = this.currentSort === 'assistencias' ? aa : ga;
            const primB = this.currentSort === 'assistencias' ? ab : gb;
            const secA = this.currentSort === 'assistencias' ? ga : aa;
            const secB = this.currentSort === 'assistencias' ? gb : ab;
            if (primA !== primB) {
              return this.sortOrder === 'desc' ? (primB - primA) : (primA - primB);
            }
            if (secA !== secB) {
              return this.sortOrder === 'desc' ? (secB - secA) : (secA - secB);
            }
            return a.nome.localeCompare(b.nome);
          });
        
        // Renderizar tabela
        this.renderTable(jogadoresArray);
      });
    });
  },

  calcularEstatisticasDoJogos(jogos, jogadores) {
    const stats = {};
    
    // Inicializar stats para todos os jogadores
    Object.values(jogadores).forEach(j => {
      stats[j.id] = { gols: 0, assistencias: 0 };
    });
    
    // Contar gols e assistências a partir dos jogos concluídos
    Object.values(jogos).forEach(jogo => {
      if (jogo.status !== 'concluido') return;
      
      // Processar goleadores
      if (jogo.goleadores && typeof jogo.goleadores === 'object') {
        Object.entries(jogo.goleadores).forEach(([jogadorId, qtdGols]) => {
          if (stats[jogadorId]) {
            stats[jogadorId].gols += parseInt(qtdGols) || 0;
          }
        });
      }
      
      // Processar assistências
      if (jogo.assistencias && typeof jogo.assistencias === 'object') {
        Object.entries(jogo.assistencias).forEach(([jogadorId, qtdAssistencias]) => {
          if (stats[jogadorId]) {
            stats[jogadorId].assistencias += parseInt(qtdAssistencias) || 0;
          }
        });
      }
    });
    
    return stats;
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
      tabela.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">Nenhum jogador cadastrado</td></tr>';
      return;
    }

    jogadores.forEach((j, index) => {
      const gols = j.gols || 0;
      const assistencias = j.assistencias || 0;
      const rankPos = index + 1;
      
      const row = document.createElement('tr');
      const rankCell = document.createElement('td');
      rankCell.setAttribute('data-label', 'Rank');
      const rankBadge = document.createElement('span');
      rankBadge.className = 'rank-badge';
      if (rankPos === 1) {
        rankBadge.classList.add('rank-1');
        rankBadge.textContent = '🥇';
      } else if (rankPos === 2) {
        rankBadge.classList.add('rank-2');
        rankBadge.textContent = '🥈';
      } else if (rankPos === 3) {
        rankBadge.classList.add('rank-3');
        rankBadge.textContent = '🥉';
      } else {
        rankBadge.textContent = String(rankPos);
      }
      rankCell.appendChild(rankBadge);
      row.appendChild(rankCell);

      row.innerHTML += `
        <td data-label="Jogador" style="font-weight: 600;">${j.nome}</td>
        <td data-label="Posição">${j.posicao}</td>
        <td data-label="Gols" style="text-align: center; font-weight: 700; color: var(--primary-color);">${gols}</td>
        <td data-label="Assistências" style="text-align: center; font-weight: 700; color: var(--accent-color);">${assistencias}</td>
      `;
      tabela.appendChild(row);
    });
  }
  ,
  setSort(tipo) {
    if (this.currentSort === tipo) {
      this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
    } else {
      this.currentSort = tipo;
      this.sortOrder = 'desc';
    }
    this.updateSortIcons();
    this.load();
  },
  updateSortIcons() {
    const icG = document.getElementById('sortIconGols');
    const icA = document.getElementById('sortIconAssistencias');
    if (!icG || !icA) return;
    icG.textContent = '';
    icA.textContent = '';
    if (this.currentSort === 'gols') {
      icG.textContent = this.sortOrder === 'desc' ? '↓' : '↑';
    } else if (this.currentSort === 'assistencias') {
      icA.textContent = this.sortOrder === 'desc' ? '↓' : '↑';
    }
  }
};

// ===========================
// MÓDULO: LOGS
// ===========================

const LogsModule = {
  // Paginação
  pagination: null,
  allLogs: [], // Cache local de todos os logs carregados
  filteredLogs: [], // Logs com filtro aplicado

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

      <!-- PAGINAÇÃO: Controles superiores -->
      <div id="logs-pagination-top" style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--card-bg); border-radius: var(--border-radius); border: 1px solid var(--border-color);">
        <div id="logs-page-info" style="font-size: 13px; color: var(--text-secondary);">Página 1</div>
        <div style="display: flex; gap: 8px;">
          <button id="logs-btn-prev" class="btn-secondary" style="padding: 6px 12px; font-size: 13px;" onclick="LogsModule.previousPage()" disabled>← Anterior</button>
          <button id="logs-btn-next" class="btn-secondary" style="padding: 6px 12px; font-size: 13px;" onclick="LogsModule.nextPage()">Próximo →</button>
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

      <!-- PAGINAÇÃO: Controles inferiores -->
      <div id="logs-pagination-bottom" style="margin-top: 16px; display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--card-bg); border-radius: var(--border-radius); border: 1px solid var(--border-color);">
        <div id="logs-page-info-bottom" style="font-size: 13px; color: var(--text-secondary);">Página 1</div>
        <div style="display: flex; gap: 8px;">
          <button id="logs-btn-prev-bottom" class="btn-secondary" style="padding: 6px 12px; font-size: 13px;" onclick="LogsModule.previousPage()" disabled>← Anterior</button>
          <button id="logs-btn-next-bottom" class="btn-secondary" style="padding: 6px 12px; font-size: 13px;" onclick="LogsModule.nextPage()">Próximo →</button>
        </div>
      </div>
    `;

    // Inicializar paginação
    this.initPagination();
    this.load();
  },

  initPagination() {
    // Criar instância do helper de paginação
    this.pagination = new PaginationHelper({
      pageSize: 30,
      containerSelector: '#logs-table',
      renderFunction: (logs) => {
        this.renderTable(logs);
        this.updatePaginationUI();
      }
    });
  },

  load() {
    const tabela = document.getElementById('logs-table');
    UI.showLoading(tabela);

    const cutoffIso = new Date(Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // Carregar primeira página
    this.pagination.loadFirstPage(() => {
      return dbRef('logs')
        .orderByChild('timestamp')
        .startAt(cutoffIso);
    }).then(hasData => {
      if (!hasData) {
        UI.showToast('Nenhum log encontrado', 'info');
      }
    }).catch(err => {
      UI.showToast('Erro ao carregar logs', 'error');
      console.error(err);
    });
  },

  nextPage() {
    const cutoffIso = new Date(Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    this.pagination.nextPage(() => {
      return dbRef('logs')
        .orderByChild('timestamp')
        .startAt(cutoffIso);
    }).then(success => {
      if (!success) {
        UI.showToast('Você está na última página', 'info');
      }
    });
  },

  previousPage() {
    this.pagination.previousPage(() => {
      // Query não é usada para previous (carregado em cache)
      return dbRef('logs');
    });
  },

  applyFilters() {
    if (!this.pagination || !this.pagination.pages[this.pagination.currentPageIndex]) return;

    const filterUsuario = document.getElementById('filterLogsUsuario')?.value.toLowerCase() || '';
    const filterAcao = document.getElementById('filterLogsAcao')?.value.toLowerCase() || '';
    const filterData = document.getElementById('filterLogsData')?.value || '';

    const currentPageLogs = this.pagination.pages[this.pagination.currentPageIndex]?.items || [];

    const filtered = currentPageLogs.filter(log => {
      const usuarioMatch = !filterUsuario || log.usuario.toLowerCase().includes(filterUsuario);
      const acaoMatch = !filterAcao || log.acao.toLowerCase().includes(filterAcao);
      const dataMatch = !filterData || log.data === filterData;
      
      return usuarioMatch && acaoMatch && dataMatch;
    });

    this.renderTable(filtered);
    this.updatePaginationUI();
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
  },

  updatePaginationUI() {
    if (!this.pagination) return;

    const info = this.pagination.getPaginationInfo();
    const pageText = `Página ${info.currentPage} (${info.pageSize} registros)`;

    // Atualizar controles superiores
    const pageInfoTop = document.getElementById('logs-page-info');
    const btnPrevTop = document.getElementById('logs-btn-prev');
    const btnNextTop = document.getElementById('logs-btn-next');

    if (pageInfoTop) pageInfoTop.textContent = pageText;
    if (btnPrevTop) btnPrevTop.disabled = !info.canPrevious || info.isLoading;
    if (btnNextTop) btnNextTop.disabled = !info.canNext || info.isLoading;

    // Atualizar controles inferiores
    const pageInfoBottom = document.getElementById('logs-page-info-bottom');
    const btnPrevBottom = document.getElementById('logs-btn-prev-bottom');
    const btnNextBottom = document.getElementById('logs-btn-next-bottom');

    if (pageInfoBottom) pageInfoBottom.textContent = pageText;
    if (btnPrevBottom) btnPrevBottom.disabled = !info.canPrevious || info.isLoading;
    if (btnNextBottom) btnNextBottom.disabled = !info.canNext || info.isLoading;
  }
};

// ===========================
// MÓDULO: FINANCEIRO
// ===========================

const FinanceiroModule = {
  categoriasEntrada: {},
  categoriasSaida: {},
  currentEditId: null,
  currentEditType: null,
  currentEditCategoryType: null,
  categoriasColapsada: true,
  lancamentosPorCategoriaMes: {},
  mostrarTodosMeses: false, // Por padrão mostra apenas mês atual

  /**
   * Migrar categorias antigas para novo path por clube
   * Copia categorias de /categorias_financeiras para /clubs/{clubId}/categorias_financeiras
   */
  async migrarCategorias(clubId) {
    try {
      // Verificar se já foi migrado (verificar se há alguma categoria no novo path)
      const checkSnapshot = await dbRef('categorias_financeiras').once('value');
      if (checkSnapshot.exists()) {
        // Já foi migrado
        return;
      }

      // Buscar categorias antigas
      const antigoSnapshot = await dbRef('categorias_financeiras').once('value');
      if (!antigoSnapshot.exists()) {
        return; // Nenhuma categoria antiga para migrar
      }

      const dados = antigoSnapshot.val();
      let migradas = 0;

      // Migrar entradas
      if (dados.entrada) {
        for (const [id, cat] of Object.entries(dados.entrada)) {
          await dbRef(`categorias_financeiras/entrada/${id}`).set(cat);
          migradas++;
        }
      }

      // Migrar saídas
      if (dados.saida) {
        for (const [id, cat] of Object.entries(dados.saida)) {
          await dbRef(`categorias_financeiras/saida/${id}`).set(cat);
          migradas++;
        }
      }

      if (migradas > 0) {
        console.log(`[MIGRAÇÃO] ${migradas} categorias migradas para clube ${clubId}`);
      }
    } catch (err) {
      console.error('[MIGRAÇÃO] Erro ao migrar categorias:', err);
      // Não falhar se a migração error - continuar carregando do path antigo
    }
  },

  async init() {
    // Se for admin global, chamar seletor de clube
    let adminSelectorHtml = '';
    if (AuthModule.currentUser?.platform_admin) {
      const selector = await ClubModule.getAdminGlobalClubSelector();
      if (selector) {
        adminSelectorHtml = selector.html;
      }
    }

    const isReadOnly = AuthModule.currentUser?.role === 'jogador';
    const actionsHeader = isReadOnly ? '' : '<th>Ações</th>';
    const container = document.getElementById('main-content');
    container.innerHTML = `
      ${adminSelectorHtml}
      <div class="finance-page">
        <div class="finance-header">
          <div>
            <h1>💰 Financeiro</h1>
            <p class="finance-subtitle">Controle de entradas, saídas e mensalidades</p>
          </div>
          <div class="finance-header-actions">
            <button class="btn-primary" onclick="loadModule('menu')">← Voltar</button>
          </div>
        </div>

        <div class="finance-summary">
          <div class="summary-card summary-card--strong">
            <div class="summary-label">Caixa Atual</div>
            <div class="summary-value" id="caixa-total">R$ 0,00</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Entradas</div>
            <div class="summary-value" id="finance-total-entradas">R$ 0,00</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Saídas</div>
            <div class="summary-value" id="finance-total-saidas">R$ 0,00</div>
          </div>
        </div>
        
        <div class="finance-grid">
          <!-- SEÇÃO: GERENCIAR CATEGORIAS -->
          <div class="finance-panel finance-panel-muted">
            <div class="finance-panel-header">
              <div>
                <h3 style="margin: 0;">⚙️ Gerenciar Categorias</h3>
                <span class="finance-panel-subtitle">Organize entradas e saídas</span>
              </div>
              <button id="btnToggleCategorias" class="btn-secondary" style="padding: 6px 12px; font-size: 14px;" onclick="FinanceiroModule.toggleCategorias()">▶ Expandir</button>
            </div>
            
            <div id="categorias-content" style="transition: all 0.3s ease; display: none;">
              <div class="form-row">
                <div class="form-column">
                  <div class="form-group">
                    <label for="novaCategoriaNome">Nome da Categoria</label>
                    <input id="novaCategoriaNome" type="text" placeholder="Ex: Taxa de transferência">
                  </div>
                </div>
                <div class="form-column">
                  <div class="form-group">
                    <label for="novaCategoriaTipo">Tipo</label>
                    <select id="novaCategoriaTipo">
                      <option value="entrada">Entrada</option>
                      <option value="saida">Saída</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="action-row">
                <button class="btn-primary" onclick="FinanceiroModule.adicionarCategoria()">+ Adicionar Categoria</button>
                <button class="btn-secondary" id="btnCancelarEditarCat" style="display:none;" onclick="FinanceiroModule.cancelarEdicaoCategoria()">Cancelar Edição</button>
              </div>
              
              <div class="finance-categories-grid">
                <div class="finance-category-panel">
                  <h4>Categorias de Entrada</h4>
                  <div class="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Categoria</th>
                          ${isReadOnly ? '' : '<th>Ações</th>'}
                        </tr>
                      </thead>
                      <tbody id="tabela-categorias-entrada"></tbody>
                    </table>
                  </div>
                </div>

                <div class="finance-category-panel">
                  <h4>Categorias de Saída</h4>
                  <div class="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Categoria</th>
                          ${isReadOnly ? '' : '<th>Ações</th>'}
                        </tr>
                      </thead>
                      <tbody id="tabela-categorias-saida"></tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- SEÇÃO: MOVIMENTAÇÕES -->
          <div class="finance-panel">
            <div class="finance-panel-header">
              <div>
                <h3 style="margin: 0;">💵 Movimentações</h3>
                <span class="finance-panel-subtitle">Entradas e saídas do mês</span>
              </div>
            </div>
            <div class="finance-move-grid" id="financeiro-form-row">
              <div class="form-container finance-form-card">
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
                      <label for="mesEntrada">Mês (YYYY-MM)</label>
                      <input id="mesEntrada" type="month">
                    </div>
                  </div>
                  <div class="form-column">
                    <div class="form-group">
                      <label for="categoriaEntrada">Categoria</label>
                      <select id="categoriaEntrada">
                        <option value="">Selecione uma categoria</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div class="action-row">
                  <button class="btn-success" onclick="FinanceiroModule.adicionarEntrada()">✓ Salvar Entrada</button>
                  <button class="btn-secondary" id="btnCancelarEntrada" style="display:none;" onclick="FinanceiroModule.cancelarEdicao()">Cancelar Edição</button>
                </div>
              </div>
              <div class="form-container finance-form-card">
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
                      <label for="mesSaida">Mês (YYYY-MM)</label>
                      <input id="mesSaida" type="month">
                    </div>
                  </div>
                  <div class="form-column">
                    <div class="form-group">
                      <label for="categoriaSaida">Categoria</label>
                      <select id="categoriaSaida">
                        <option value="">Selecione uma categoria</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div class="action-row">
                  <button class="btn-danger" onclick="FinanceiroModule.adicionarSaida()">Salvar Saída</button>
                  <button class="btn-secondary" id="btnCancelarSaida" style="display:none;" onclick="FinanceiroModule.cancelarEdicao()">Cancelar Edição</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="finance-panel finance-table-panel">
          <div class="finance-panel-header">
            <div>
              <h3 style="margin: 0;">📦 Lançamentos</h3>
              <span class="finance-panel-subtitle">Detalhamento por categoria e mês</span>
            </div>
            <button 
              id="btnToggleMesesFinanceiro" 
              class="btn-secondary" 
              style="padding: 8px 16px; font-size: 14px;" 
              onclick="FinanceiroModule.toggleMeses()">
              📅 Expandir Todos os Meses
            </button>
          </div>
          <div class="table-responsive finance-table-responsive">
            <table>
              <thead>
                <tr id="financeiro-header-row">
                  <th>Descrição</th>
                  ${actionsHeader}
                </tr>
              </thead>
              <tbody id="tabela-financeiro"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const currentMonthKey = getCurrentMonthKey();
    const mesEntradaEl = document.getElementById('mesEntrada');
    const mesSaidaEl = document.getElementById('mesSaida');
    if (mesEntradaEl) mesEntradaEl.value = currentMonthKey;
    if (mesSaidaEl) mesSaidaEl.value = currentMonthKey;

    if (isReadOnly) {
      const frm = document.getElementById('financeiro-form-row');
      if (frm) frm.style.display = 'none';
    }
    
    this.carregarCategorias();
    this.load();
  },

  carregarCategorias() {
    const clubId = ClubModule.currentClubId;
    if (!clubId) {
      console.error('[CATEGORIAS] Clube não identificado');
      return;
    }
    
    // Executar migração de categorias (copiar de root para clube)
    this.migrarCategorias(clubId);
    
    // Buscar categorias do path novo e do path antigo (compatibilidade)
    Promise.all([
      dbRef('categorias').once('value'),
      dbRef('categorias_financeiras').once('value'),
      dbRef('categorias_financeiras').once('value')
    ]).then(([snapNovo, snapClubPaths, snapAntigo]) => {
      this.categoriasEntrada = {};
      this.categoriasSaida = {};
      
      // Processar categorias novas (path: clubs/{clubId}/categorias)
      const dataNovo = snapNovo.val() || {};
      Object.entries(dataNovo).forEach(([nome, categoria]) => {
        // Aceitar tanto formato novo (entrada/saida) quanto legado (receita/despesa)
        if (categoria.tipo === 'receita' || categoria.tipo === 'entrada') {
          this.categoriasEntrada[nome] = { id: nome, nome, tipo: 'entrada' };
        } else if (categoria.tipo === 'despesa' || categoria.tipo === 'saida') {
          this.categoriasSaida[nome] = { id: nome, nome, tipo: 'saida' };
        }
      });

      // Processar categorias do novo path de clube (clubs/{clubId}/categorias_financeiras)
      const dataClubPaths = snapClubPaths.val() || {};
      if (dataClubPaths.entrada) {
        Object.entries(dataClubPaths.entrada).forEach(([id, cat]) => {
          if (!this.categoriasEntrada[cat.nome]) {
            this.categoriasEntrada[cat.nome] = { id: cat.nome, nome: cat.nome, tipo: 'entrada' };
          }
        });
      }
      if (dataClubPaths.saida) {
        Object.entries(dataClubPaths.saida).forEach(([id, cat]) => {
          if (!this.categoriasSaida[cat.nome]) {
            this.categoriasSaida[cat.nome] = { id: cat.nome, nome: cat.nome, tipo: 'saida' };
          }
        });
      }
      
      // Processar categorias antigas (path: categorias_financeiras - root)
      const dataAntigo = snapAntigo.val() || {};
      if (dataAntigo.entrada) {
        Object.entries(dataAntigo.entrada).forEach(([id, cat]) => {
          if (!this.categoriasEntrada[cat.nome]) {
            this.categoriasEntrada[cat.nome] = { id: cat.nome, nome: cat.nome, tipo: 'entrada' };
          }
        });
      }
      if (dataAntigo.saida) {
        Object.entries(dataAntigo.saida).forEach(([id, cat]) => {
          if (!this.categoriasSaida[cat.nome]) {
            this.categoriasSaida[cat.nome] = { id: cat.nome, nome: cat.nome, tipo: 'saida' };
          }
        });
      }
      
      console.log('[CATEGORIAS] Carregadas:', { 
        entradas: Object.keys(this.categoriasEntrada).length, 
        saidas: Object.keys(this.categoriasSaida).length 
      });
      this.atualizarSelects();
      this.renderizarTabelaCategorias();
    }).catch(err => {
      console.error('Erro ao carregar categorias:', err);
      UI.showToast('Erro ao carregar categorias', 'error');
    });
  },

  async adicionarCategoria() {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    const nome = document.getElementById('novaCategoriaNome').value.trim();
    const tipoUI = document.getElementById('novaCategoriaTipo').value;
    
    // Mapear tipo do UI para formato da Cloud Function
    const tipoBackend = tipoUI === 'entrada' ? 'entrada' : 'saida';

    if (!nome) {
      UI.showToast('Digite o nome da categoria', 'error');
      return;
    }

    if (this.currentEditCategoryType) {
      // Editando categoria existente (mantém lógica antiga por enquanto)
      this.salvarEdicaoCategoria(nome, tipoUI);
    } else {
      // Adicionando nova categoria via Cloud Function
      const clubId = ClubModule.currentClubId;
      if (!clubId) {
        UI.showToast('Erro: Clube não identificado', 'error');
        console.error('[CATEGORY] ClubId não definido:', { currentClubId: ClubModule.currentClubId });
        return;
      }
      
      try {
        console.log('[CATEGORY] Enviando para Cloud Function:', { clubId, nome, tipo: tipoBackend });
        const result = await functions.httpsCallable('createCategory')({
          clubId,
          nome,
          tipo: tipoBackend
        });
        
        console.log('[CATEGORY] Categoria criada via Cloud Function:', result.data);
        UI.showToast('Categoria adicionada com sucesso!', 'success');
        document.getElementById('novaCategoriaNome').value = '';
        this.carregarCategorias();
      } catch (err) {
        console.error('[CATEGORY] Erro ao adicionar categoria:', { 
          error: err, 
          message: err.message, 
          code: err.code,
          details: err.details
        });
        UI.showToast(`❌ Erro: ${err.message || 'Erro desconhecido'}`, 'error');
      }
    }
  },

  salvarEdicaoCategoria(nome, tipo) {
    if (!this.currentEditCategoryType) return;
    
    // currentEditCategoryType = {id, oldTipo}
    const { id, oldTipo } = this.currentEditCategoryType;
    const novaCategoria = { id, nome, tipo };

    if (oldTipo === tipo) {
      // Mesmo tipo, apenas update
      dbRef(`categorias_financeiras/${tipo}/${id}`).update({ nome }).then(() => {
        try {
          AuthModule.logAction('editar_categoria_financeira', `Atualizou categoria: ${nome}`, {
            categoria_id: String(id),
            categoria_nome: String(nome),
            categoria_tipo: String(tipo)
          });
        } catch (logErr) {
          console.error('Erro ao registrar log:', logErr);
        }
        UI.showToast('Categoria atualizada!', 'success');
        this.cancelarEdicaoCategoria();
        this.carregarCategorias();
      }).catch(err => {
        UI.showToast('Erro ao atualizar categoria', 'error');
        console.error(err);
      });
    } else {
      // Tipo mudou, delete old + create new
      dbRef(`categorias_financeiras/${oldTipo}/${id}`).remove().then(() => {
        dbRef(`categorias_financeiras/${tipo}/${id}`).set(novaCategoria).then(() => {
          try {
            AuthModule.logAction('editar_categoria_financeira', `Atualizou categoria: ${nome}`, {
              categoria_id: String(id),
              categoria_nome: String(nome),
              categoria_tipo_novo: String(tipo),
              categoria_tipo_antigo: String(oldTipo)
            });
          } catch (logErr) {
            console.error('Erro ao registrar log:', logErr);
          }
          UI.showToast('Categoria atualizada!', 'success');
          this.cancelarEdicaoCategoria();
          this.carregarCategorias();
        });
      }).catch(err => {
        UI.showToast('Erro ao atualizar categoria', 'error');
        console.error(err);
      });
    }
  },

  editarCategoria(id, tipo) {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    
    if (!id || !tipo) {
      UI.showToast('Dados inválidos', 'error');
      return;
    }
    
    const categorias = tipo === 'entrada' ? this.categoriasEntrada : this.categoriasSaida;
    const categoria = categorias[id];
    
    if (!categoria) {
      UI.showToast('Categoria não encontrada', 'error');
      return;
    }

    document.getElementById('novaCategoriaNome').value = categoria.nome;
    document.getElementById('novaCategoriaTipo').value = tipo;
    this.currentEditCategoryType = { id, oldTipo: tipo };
    document.getElementById('btnCancelarEditarCat').style.display = 'inline-block';
    window.scrollTo(0, 0);
  },

  async deletarCategoria(id, tipo) {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    
    console.log('deletarCategoria chamado:', { id, tipo });
    
    // Validação rigorosa
    if (!id || typeof id !== 'string') {
      UI.showToast('ID inválido', 'error');
      return;
    }
    if (!tipo || (tipo !== 'entrada' && tipo !== 'saida')) {
      UI.showToast('Tipo inválido', 'error');
      return;
    }
    
    // Obter o nome da categoria para feedback
    const categorias = tipo === 'entrada' ? this.categoriasEntrada : this.categoriasSaida;
    const categoria = categorias[id];
    
    if (!categoria) {
      UI.showToast('Categoria não encontrada', 'error');
      return;
    }
    
    const nomeCat = (categoria.nome || 'desconhecida').trim();
    const tipoTexto = tipo === 'entrada' ? 'Entrada' : 'Saída';
    
    const mensagem = `Excluir categoria?\n\nNome: ${nomeCat}\nTipo: ${tipoTexto}\n\n⚠️ Esta ação não pode ser desfeita!\nLançamentos existentes não serão afetados.`;
    
    UI.showConfirm(mensagem, async () => {
      const clubId = ClubModule.currentClubId;
      if (!clubId) {
        UI.showToast('Erro: Clube não identificado', 'error');
        return;
      }
      
      try {
        // Chamar Cloud Function para deletar categoria (validação server-side)
        const result = await functions.httpsCallable('deleteCategory')({
          clubId,
          nome: nomeCat
        });
        
        console.log('[CATEGORY] Categoria deletada via Cloud Function:', result.data);
        UI.showToast('Categoria removida com sucesso!', 'success');
        this.carregarCategorias();
      } catch (err) {
        console.error('[CATEGORY] Erro ao deletar categoria:', err);
        UI.showToast(`Erro ao deletar: ${err.message || 'Erro desconhecido'}`, 'error');
      }
    });
  },

  cancelarEdicaoCategoria() {
    this.currentEditCategoryType = null;
    document.getElementById('novaCategoriaNome').value = '';
    document.getElementById('novaCategoriaTipo').value = 'entrada';
    document.getElementById('btnCancelarEditarCat').style.display = 'none';
  },

  toggleCategorias() {
    this.categoriasColapsada = !this.categoriasColapsada;
    const content = document.getElementById('categorias-content');
    const btn = document.getElementById('btnToggleCategorias');
    
    if (this.categoriasColapsada) {
      content.style.display = 'none';
      btn.textContent = '▶ Expandir';
    } else {
      content.style.display = 'block';
      btn.textContent = '▼ Recolher';
    }
  },

  toggleMeses() {
    this.mostrarTodosMeses = !this.mostrarTodosMeses;
    const btn = document.getElementById('btnToggleMesesFinanceiro');
    if (btn) {
      btn.textContent = this.mostrarTodosMeses 
        ? '📅 Mostrar Apenas Mês Atual' 
        : '📅 Expandir Todos os Meses';
    }
    // Recarregar para aplicar mudança
    this.load();
  },

  renderizarTabelaCategorias() {
    const isReadOnly = AuthModule.currentUser?.role === 'jogador';
    
    // Tabela de Entrada
    const tabelaEntrada = document.getElementById('tabela-categorias-entrada');
    if (tabelaEntrada) {
      tabelaEntrada.innerHTML = '';
      if (Object.keys(this.categoriasEntrada).length === 0) {
        tabelaEntrada.innerHTML = '<tr><td colspan="2" style="text-align: center; color: #999;">Nenhuma categoria cadastrada</td></tr>';
      } else {
        Object.entries(this.categoriasEntrada).forEach(([id, cat]) => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${cat.nome}</td>
            ${isReadOnly ? '' : `
            <td>
              <button class="action-btn edit-btn" onclick="FinanceiroModule.editarCategoria('${id}', 'entrada')">Editar</button>
              <button class="action-btn delete-btn" onclick="FinanceiroModule.deletarCategoria('${id}', 'entrada')">Excluir</button>
            </td>`}
          `;
          tabelaEntrada.appendChild(row);
        });
      }
    }

    // Tabela de Saída
    const tabelaSaida = document.getElementById('tabela-categorias-saida');
    if (tabelaSaida) {
      tabelaSaida.innerHTML = '';
      if (Object.keys(this.categoriasSaida).length === 0) {
        tabelaSaida.innerHTML = '<tr><td colspan="2" style="text-align: center; color: #999;">Nenhuma categoria cadastrada</td></tr>';
      } else {
        Object.entries(this.categoriasSaida).forEach(([id, cat]) => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${cat.nome}</td>
            ${isReadOnly ? '' : `
            <td>
              <button class="action-btn edit-btn" onclick="FinanceiroModule.editarCategoria('${id}', 'saida')">Editar</button>
              <button class="action-btn delete-btn" onclick="FinanceiroModule.deletarCategoria('${id}', 'saida')">Excluir</button>
            </td>`}
          `;
          tabelaSaida.appendChild(row);
        });
      }
    }
  },

  atualizarSelects() {
    const selectEntrada = document.getElementById('categoriaEntrada');
    const selectSaida = document.getElementById('categoriaSaida');

    if (selectEntrada) {
      selectEntrada.innerHTML = '<option value="">Selecione uma categoria</option>';
      Object.values(this.categoriasEntrada).forEach(cat => {
        selectEntrada.innerHTML += `<option>${cat.nome}</option>`;
      });
    }

    if (selectSaida) {
      selectSaida.innerHTML = '<option value="">Selecione uma categoria</option>';
      Object.values(this.categoriasSaida).forEach(cat => {
        selectSaida.innerHTML += `<option>${cat.nome}</option>`;
      });
    }
  },

  async adicionarEntrada() {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    const valor = parseFloat(document.getElementById('valorEntrada').value);
    const mes = normalizeMonthKey(document.getElementById('mesEntrada').value);
    const categoria = document.getElementById('categoriaEntrada').value.trim();

    if (!valor || !mes || !categoria) {
      UI.showToast('Preencha todos os campos', 'error');
      return;
    }

    if (this.currentEditId && this.currentEditType === 'entrada') {
      // Atualizar registro existente
      this.salvarEdicao('receita', valor, mes, categoria);
    } else {
      // Criar novo registro via Cloud Function
      const clubId = ClubModule.currentClubId;
      if (!clubId) {
        UI.showToast('Erro: Clube não identificado', 'error');
        return;
      }
      
      try {
        const result = await functions.httpsCallable('addFinancialTransaction')({
          clubId,
          tipo: 'entrada',
          categoria,
          valor,
          descricao: `Entrada - ${categoria}`,
          data: mes, // Mes como data
          observacoes: ''
        });
        
        // Rastrear adição de entrada
        MonitoringModule.trackEvent(TRACKING_EVENTS.FINANCEIRO_TRANSACTION_ADDED, {
          transaction_type: 'entrada',
          categoria: categoria,
          valor: valor,
          mes: mes,
          transaction_id: result.data?.transactionId || 'unknown'
        });
        
        console.log('[FINANCE] Entrada criada via Cloud Function:', result.data);
        UI.showToast('Entrada salva com sucesso!', 'success');
        UI.clearInputs(['valorEntrada', 'categoriaEntrada']);
        document.getElementById('mesEntrada').value = getCurrentMonthKey();
        this.load();
      } catch (err) {
        console.error('[FINANCE] Erro ao salvar entrada:', err);
        MonitoringModule.captureException(err, {
          action: 'add_financial_entry',
          categoria: categoria,
          valor: valor,
          mes: mes
        }, 'error');
        UI.showToast(`Erro ao salvar: ${err.message || 'Erro desconhecido'}`, 'error');
      }
    }
  },

  async adicionarSaida() {
    if (AuthModule.currentUser?.role === 'jogador') { UI.showToast('Perfil somente leitura', 'info'); return; }
    const valor = parseFloat(document.getElementById('valorSaida').value);
    const mes = normalizeMonthKey(document.getElementById('mesSaida').value);
    const categoria = document.getElementById('categoriaSaida').value.trim();

    if (!valor || !mes || !categoria) {
      UI.showToast('Preencha todos os campos', 'error');
      return;
    }

    if (this.currentEditId && this.currentEditType === 'saida') {
      // Atualizar registro existente
      this.salvarEdicao('saida', valor, mes, categoria);
    } else {
      // Criar novo registro via Cloud Function
      const clubId = ClubModule.currentClubId;
      if (!clubId) {
        UI.showToast('Erro: Clube não identificado', 'error');
        return;
      }
      
      try {
        const result = await functions.httpsCallable('addFinancialTransaction')({
          clubId,
          tipo: 'saida',
          categoria,
          valor,
          descricao: `Saída - ${categoria}`,
          data: mes, // Mes como data
          observacoes: ''
        });
        
        // Rastrear adição de saída
        MonitoringModule.trackEvent(TRACKING_EVENTS.FINANCEIRO_TRANSACTION_ADDED, {
          transaction_type: 'saida',
          categoria: categoria,
          valor: valor,
          mes: mes,
          transaction_id: result.data?.transactionId || 'unknown'
        });
        
        console.log('[FINANCE] Saída criada via Cloud Function:', result.data);
        UI.showToast('Saída salva com sucesso!', 'success');
        UI.clearInputs(['valorSaida', 'categoriaSaida']);
        document.getElementById('mesSaida').value = getCurrentMonthKey();
        this.load();
      } catch (err) {
        console.error('[FINANCE] Erro ao salvar saída:', err);
        MonitoringModule.captureException(err, {
          action: 'add_financial_expense',
          categoria: categoria,
          valor: valor,
          mes: mes
        }, 'error');
        UI.showToast(`Erro ao salvar: ${err.message || 'Erro desconhecido'}`, 'error');
      }
    }
  },

  async salvarEdicao(tipo, valor, mes, categoria) {
    if (!this.currentEditId) return;

    const registro = this.registrosCache[this.currentEditId];
    if (!registro) {
      UI.showToast('Registro não encontrado', 'error');
      return;
    }

    // Verificar idade do lançamento (90 dias = 7776000000 ms)
    const idade = Date.now() - (registro.timestamp || 0);
    if (idade >= 7776000000) {
      UI.showToast('⏳ Lançamento antigo (90+ dias) não pode ser editado', 'warning');
      return;
    }
    
    const clubId = ClubModule.currentClubId;
    if (!clubId) {
      UI.showToast('Erro: Clube não identificado', 'error');
      return;
    }

    const transactionId = this.currentEditId;
    
    try {
      // Chamar Cloud Function para atualizar transação (validação server-side)
      const result = await functions.httpsCallable('updateFinancialTransaction')({
        clubId,
        transactionId: transactionId,
        updates: {
          tipo: tipo,
          valor: parseFloat(valor),
          data: mes,
          categoria: categoria
        }
      });
      
      console.log('[FINANCE] Transação atualizada via Cloud Function:', result.data);
      UI.showToast('Lançamento editado com sucesso!', 'success');
      this.cancelarEdicao();
      this.load();
    } catch (err) {
      console.error('[FINANCE] Erro ao editar lançamento:', err);
      console.error('[FINANCE] Erro completo:', {
        name: err.name,
        code: err.code,
        message: err.message,
        details: err.details
      });

      // FALLBACK: Se for admin/diretor e Cloud Function falhou, editar direto no banco
      const userRole = AuthModule.currentUser?.role;
      const isCorsError = err.message?.includes('CORS') || 
                          err.message?.includes('fetch') || 
                          err.message?.includes('network') ||
                          err.code === 'unavailable';
      
      if ((userRole === 'admin' || userRole === 'diretor') && isCorsError) {
        console.warn('[FINANCE] Usando fallback - editar direto no banco (CORS error)');
        UI.showToast('⚠️ Usando modo fallback para editar...', 'warning');
        
        try {
          // Atualizar direto no banco
          await dbRef(`financeiro/${transactionId}`).update({
            tipo: tipo,
            valor: parseFloat(valor),
            mes: mes,
            data: mes,
            categoria: categoria,
            editadoEm: new Date().toISOString(),
            editadoPor: firebase.auth().currentUser?.uid,
            editadoPorLogin: AuthModule.currentUser?.email || AuthModule.currentUser?.login
          });
          
          // Invalidar cache para recalcular saldo
          await dbRef('cache/balance').remove();
          
          console.log('[FINANCE] ✅ Transação editada via fallback');
          UI.showToast('✅ Lançamento editado com sucesso (modo local)!', 'success');
          this.cancelarEdicao();
          this.load();
        } catch (fallbackErr) {
          console.error('[FINANCE] ❌ Falha no fallback:', fallbackErr);
          UI.showToast(`❌ Erro ao editar: ${fallbackErr.message}`, 'error');
        }
      } else {
        UI.showToast(`Erro ao editar: ${err.message || 'Erro desconhecido'}`, 'error');
      }
    }
  },

  cancelarEdicao() {
    this.currentEditId = null;
    this.currentEditType = null;
    UI.clearInputs(['valorEntrada', 'categoriaEntrada', 'valorSaida', 'categoriaSaida']);
    const currentMonthKey = getCurrentMonthKey();
    document.getElementById('mesEntrada').value = currentMonthKey;
    document.getElementById('mesSaida').value = currentMonthKey;
    document.getElementById('btnCancelarEntrada').style.display = 'none';
    document.getElementById('btnCancelarSaida').style.display = 'none';
  },

  fecharModalFinanceiro() {
    const modal = document.querySelector('[data-modal-financeiro]');
    if (modal && modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  },

  abrirDetalhesLancamentos(categoria, mes) {
    const bucket = this.lancamentosPorCategoriaMes?.[categoria]?.[mes];
    if (!bucket || !bucket.ids || bucket.ids.length === 0) {
      UI.showToast('Nenhum lancamento encontrado', 'info');
      return;
    }

    const registros = bucket.ids
      .map(id => ({ id, registro: this.registrosCache?.[id] }))
      .filter(item => item.registro)
      .sort((a, b) => (b.registro.timestamp || 0) - (a.registro.timestamp || 0));

    const isReadOnly = AuthModule.currentUser?.role === 'jogador';
    const mesLabel = formatMonthLabel(mes);

    this.fecharModalFinanceiro();

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.setAttribute('data-modal-financeiro', 'true');
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 760px;">
        <div class="modal-header">
          <h3 style="margin: 0;">Detalhes - ${categoria}</h3>
          <button class="modal-close" onclick="FinanceiroModule.fecharModalFinanceiro()">&times;</button>
        </div>
        <div style="padding: 16px;">
          <div style="margin-bottom: 12px; color: var(--text-secondary);">
            Mes: ${mesLabel} | Entradas: R$ ${(bucket.totalEntrada || 0).toFixed(2)} | Saidas: R$ ${(bucket.totalSaida || 0).toFixed(2)} | Lancamentos: ${bucket.totalItens}
          </div>
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Data</th>
                  <th>Descricao</th>
                  ${isReadOnly ? '' : '<th>Acoes</th>'}
                </tr>
              </thead>
              <tbody id="financeiro-detalhes-body"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    modal.onclick = (e) => {
      if (e.target === modal) this.fecharModalFinanceiro();
    };

    document.body.appendChild(modal);

    const tbody = modal.querySelector('#financeiro-detalhes-body');
    registros.forEach(({ id, registro }) => {
      const row = document.createElement('tr');
      const valor = Number(registro.valor || 0).toFixed(2);
      const dataTexto = registro.data || registro.mes || '';
      const descricao = registro.descricao || registro.categoria || '';
      const tipoTexto = registro.tipo === 'entrada' ? 'Entrada' : 'Saida';
      const corTipo = registro.tipo === 'entrada' ? 'var(--success-color)' : 'var(--danger-color)';

      row.innerHTML = `
        <td style="color: ${corTipo}; font-weight: 600;">${tipoTexto}</td>
        <td>R$ ${valor}</td>
        <td>${dataTexto}</td>
        <td>${descricao}</td>
        ${isReadOnly ? '' : '<td class="financeiro-detalhes-acoes"></td>'}
      `;

      if (!isReadOnly) {
        const actionsCell = row.querySelector('.financeiro-detalhes-acoes');
        // Proteção de 90 dias desabilitada temporariamente
        const ehAntigo = false;

        if (ehAntigo) {
          const span = document.createElement('span');
          span.style.cssText = 'font-size: 12px; color: var(--text-secondary);';
          span.textContent = 'Protegido';
          actionsCell.appendChild(span);
        } else {
          const btnEditar = document.createElement('button');
          btnEditar.style.fontSize = '12px';
          btnEditar.textContent = '✏️';
          btnEditar.onclick = () => {
            this.fecharModalFinanceiro();
            this.editar(id);
          };

          const btnRemover = document.createElement('button');
          btnRemover.style.fontSize = '12px';
          btnRemover.textContent = '🗑️';
          btnRemover.onclick = () => {
            this.fecharModalFinanceiro();
            this.remover(id);
          };

          actionsCell.appendChild(btnEditar);
          actionsCell.appendChild(document.createTextNode(' '));
          actionsCell.appendChild(btnRemover);
        }
      }

      tbody.appendChild(row);
    });
  },

  async load() {
    const tabela = document.getElementById('tabela-financeiro');
    UI.showLoading(tabela);
    
    const clubId = ClubModule.currentClubId;
    if (!clubId) {
      UI.showToast('Erro: clube não selecionado', 'error');
      tabela.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;">❌ Clube não identificado. Faça logout e login novamente.</td></tr>';
      return;
    }
    
    console.log('[FINANCEIRO] Carregando dados para clube:', clubId);
    console.log('[FINANCEIRO] Path:', `clubs/${clubId}/financeiro`);
    console.log('[FINANCEIRO] CurrentUser:', firebase.auth().currentUser?.email || 'NULL');
    
    // Buscar saldo via Cloud Function (atomic, com cache 5min)
    let saldoData = { balance: 0, totalReceitas: 0, totalDespesas: 0, cached: false };
    let balanceOk = true;
    try {
      const getBalance = functions.httpsCallable('getBalance');
      const result = await getBalance({ clubId });
      saldoData = result.data;
      console.log('[FINANCEIRO] Saldo obtido via Cloud Function:', saldoData);
    } catch (balanceError) {
      console.error('[FINANCEIRO] Erro ao buscar saldo:', balanceError);
      UI.showToast('⚠️ Não foi possível calcular saldo atualizado', 'warning');
      balanceOk = false;
    }

    // Buscar dados financeiros e mensalidades (com fallback para raiz global se vazio em clube)
    console.log('[FINANCEIRO] Executando Promise.all com fallback...');
    Promise.all([
      dbRef(`clubs/${clubId}/financeiro`).once('value'),
      dbRef(`clubs/${clubId}/jogadores`).once('value'),
      dbRef('financeiro').once('value'),
      dbRef('jogadores').once('value')
    ]).then(([snapFinanceiroClub, snapJogadoresClub, snapFinanceiroGlobal, snapJogadoresGlobal]) => {
      console.log('[FINANCEIRO] ✅ Promise.all concluído'); 
      console.log('[FINANCEIRO] Path clube - Financeiro:', snapFinanceiroClub.numChildren(), 'Jogadores:', snapJogadoresClub.numChildren());
      console.log('[FINANCEIRO] Path global - Financeiro:', snapFinanceiroGlobal.numChildren(), 'Jogadores:', snapJogadoresGlobal.numChildren());
      
      // Usar dados do clube se existem, senão fallback para global
      const snapFinanceiro = snapFinanceiroClub.exists() ? snapFinanceiroClub : snapFinanceiroGlobal;
      const snapJogadores = snapJogadoresClub.exists() ? snapJogadoresClub : snapJogadoresGlobal;
      const sourceType = snapFinanceiroClub.exists() ? 'clube' : 'global';
      
      console.log('[FINANCEIRO] Usando dados de:', sourceType);
      console.log('[FINANCEIRO] Snapshot FINANCEIRO - Items:', snapFinanceiro.numChildren(), 'exists:', snapFinanceiro.exists());
      console.log('[FINANCEIRO] Snapshot JOGADORES - Items:', snapJogadores.numChildren(), 'exists:', snapJogadores.exists());
      
      if (!snapFinanceiro.exists() && !snapJogadores.exists()) {
        console.error('[FINANCEIRO] ❌ Nenhum snapshot encontrado! Sem permissão ou sem dados.');
        tabela.innerHTML = '<tr><td colspan="5" style="text-align:center;color:red;">❌ Erro: Sem permissão ou dados não encontrados. Token: ' + (firebase.auth().currentUser ? 'OK' : 'NULL') + '</td></tr>';
        return;
      }
      
      console.log('[FINANCEIRO] Dados brutos:', snapFinanceiro.val());
      const dados = {};
      const registros = {};

      const monthKeysSet = new Set();

      let totalReceitas = 0;
      let totalDespesas = 0;
      let itemsProcessados = 0;
      let itemsIgnorados = 0;

      // Processar movimentações financeiras manuais (apenas para exibição)
      snapFinanceiro.forEach(item => {
        itemsProcessados++;
        const chaveFirebase = item.key;
        const m = item.val();
        console.log(`[FINANCEIRO] Item ${itemsProcessados}:`, chaveFirebase, m);
        const mesKey = normalizeMonthKey(m.mes || m.data || m.timestamp);
        const valor = parseFloat(m.valor) || 0;
        const tipo = String(m.tipo || '').toLowerCase();
        // Usar chave do Firebase como fallback se não tiver ID
        m.id = m.id || chaveFirebase;
        m.mes = mesKey || m.mes;
        if (!m.categoria) {
          console.error('[FINANCEIRO] ❌ Item SEM CATEGORIA (ignorado):', chaveFirebase, m);
          itemsIgnorados++;
          return;
        }
        if (!dados[m.categoria]) dados[m.categoria] = {};
        if (mesKey) monthKeysSet.add(mesKey);

        const bucketKey = mesKey || m.mes;
        const bucket = dados[m.categoria][bucketKey];
        if (!bucket) {
          dados[m.categoria][bucketKey] = {
            ...m,
            valor: valor,
            ids: [m.id],
            totalItens: 1,
            ultimoId: m.id,
            ultimoTimestamp: m.timestamp || 0,
            totalEntrada: tipo === 'entrada' ? valor : 0,
            totalSaida: tipo === 'saida' ? valor : 0
          };
        } else {
          bucket.valor += valor;
          bucket.ids.push(m.id);
          bucket.totalItens += 1;
          if (tipo === 'entrada') {
            bucket.totalEntrada = (bucket.totalEntrada || 0) + valor;
          } else if (tipo === 'saida') {
            bucket.totalSaida = (bucket.totalSaida || 0) + valor;
          }
          const timestampAtual = m.timestamp || 0;
          if (timestampAtual >= (bucket.ultimoTimestamp || 0)) {
            bucket.ultimoTimestamp = timestampAtual;
            bucket.ultimoId = m.id;
          }
          if (bucket.tipo !== tipo) {
            bucket.tipo = 'misto';
          }
        }

        registros[m.id] = m;
        if (tipo === 'entrada') {
          totalReceitas += valor;
        } else if (tipo === 'saida') {
          totalDespesas += valor;
        }
      });

      // Salvar registros em cache para verificação de idade
      this.registrosCache = registros;
      this.lancamentosPorCategoriaMes = dados;
      
      console.log('[FINANCEIRO] 📊 RESUMO DO PROCESSAMENTO:');
      console.log(`  - Items no snapshot: ${snapFinanceiro.numChildren()}`);
      console.log(`  - Items processados: ${itemsProcessados}`);
      console.log(`  - Items ignorados: ${itemsIgnorados}`);
      console.log(`  - Categorias criadas: ${Object.keys(dados).length}`);
      console.log(`  - Meses encontrados: ${Array.from(monthKeysSet).join(', ')}`);
      console.log('  - Objeto dados:', dados);

      // Processar mensalidades pagas
      const jogadores = snapJogadores.val() || {};
      const mensalidades = {};
      
      Object.values(jogadores).forEach(jogador => {
        if (jogador.isento) {
          return;
        }
        const { map } = normalizeMensalidades(jogador);
        Object.entries(map || {}).forEach(([mesKey, mensal]) => {
          if (mensal && mensal.pago) {
            const normalizedKey = normalizeMonthKey(mesKey);
            if (!normalizedKey) return;
            if (!mensalidades[normalizedKey]) mensalidades[normalizedKey] = 0;
            const valorMensal = (mensal.valorPago || mensal.valor || 0);
            mensalidades[normalizedKey] += valorMensal;
            totalReceitas += valorMensal;
            monthKeysSet.add(normalizedKey);
          }
        });
      });

      let monthKeys = Array.from(monthKeysSet).sort();
      if (monthKeys.length === 0) monthKeys.push(getCurrentMonthKey());
      
      // Filtrar apenas mês atual se toggle está desativado
      if (!this.mostrarTodosMeses) {
        const mesAtual = getCurrentMonthKey();
        if (!monthKeys.includes(mesAtual)) {
          monthKeys = [mesAtual];
        } else {
          monthKeys = [mesAtual];
        }
      }

      // Adicionar linha de mensalidades ao dados (apenas exibição)
      if (Object.keys(mensalidades).length > 0) {
        dados['📝 Mensalidades Pagas'] = {};
        monthKeys.forEach(mes => {
          if (mensalidades[mes]) {
            dados['📝 Mensalidades Pagas'][mes] = {
              id: 'mensalidades-' + mes,
              tipo: 'entrada',
              valor: mensalidades[mes],
              totalEntrada: mensalidades[mes],
              totalSaida: 0,
              mes: mes,
              categoria: '📝 Mensalidades Pagas',
              automatico: true,
              timestamp: Date.now()
            };
            // Não calcular aqui (feito server-side)
          }
        });
      }

      const isReadOnly = AuthModule.currentUser?.role === 'jogador';
      this.updateFinanceiroHeader(monthKeys, isReadOnly);
      tabela.innerHTML = '';

      console.log('[FINANCEIRO] Categorias processadas:', Object.keys(dados).length, dados);

      if (Object.keys(dados).length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 1 + monthKeys.length + (isReadOnly ? 0 : 1);
        cell.style.cssText = 'text-align: center; color: #999;';
        cell.textContent = 'Nenhuma movimentação cadastrada';
        row.appendChild(cell);
        tabela.appendChild(row);
        document.getElementById('caixa-total').innerText = `R$ 0,00`;
        const entradasEl = document.getElementById('finance-total-entradas');
        const saidasEl = document.getElementById('finance-total-saidas');
        if (entradasEl) entradasEl.innerText = `R$ 0,00`;
        if (saidasEl) saidasEl.innerText = `R$ 0,00`;
        return;
      }

      for (const cat in dados) {
        const row = document.createElement('tr');
        
        // Célula da categoria
        const catCell = document.createElement('td');
        catCell.setAttribute('data-label', 'Categoria');
        const strong = document.createElement('strong');
        strong.textContent = cat;
        catCell.appendChild(strong);
        row.appendChild(catCell);
        
        // Células dos meses
        monthKeys.forEach(m => {
          const item = dados[cat][m];
          const mesCell = document.createElement('td');
          mesCell.setAttribute('data-label', formatMonthLabel(m));
          
          if (item) {
            const totalEntrada = Number(item.totalEntrada || 0);
            const totalSaida = Number(item.totalSaida || 0);
            const valorExibido = (totalEntrada > 0 && totalSaida > 0)
              ? (totalEntrada - totalSaida)
              : (totalEntrada > 0 ? totalEntrada : totalSaida);
            const corTexto = (totalEntrada > 0 && totalSaida > 0)
              ? (valorExibido >= 0 ? 'var(--success-color)' : 'var(--danger-color)')
              : (item.tipo === 'entrada' ? 'var(--success-color)' : 'var(--danger-color)');

            const span = document.createElement('span');
            span.style.cssText = `color: ${corTexto}; font-weight: 600;`;
            span.textContent = `R$ ${valorExibido.toFixed(2)}`;
            if (item.totalItens && item.totalItens > 1) {
              span.title = `Entradas: R$ ${totalEntrada.toFixed(2)} | Saidas: R$ ${totalSaida.toFixed(2)} | Lancamentos: ${item.totalItens}`;
            }
            mesCell.appendChild(span);

            if (item.totalItens && item.totalItens > 1) {
              const badge = document.createElement('span');
              badge.style.cssText = 'margin-left: 6px; background: #f1f3f5; color: #333; border-radius: 10px; padding: 2px 6px; font-size: 11px; font-weight: 700;';
              badge.textContent = `+${item.totalItens - 1}`;
              mesCell.appendChild(badge);
              mesCell.style.cursor = 'pointer';
              mesCell.title = 'Clique para ver detalhes dos lancamentos';
              mesCell.onclick = () => FinanceiroModule.abrirDetalhesLancamentos(cat, m);
            }
          }
          
          row.appendChild(mesCell);
        });
        
        const ultimoMes = [...monthKeys].reverse().find(m => dados[cat][m]);
        const itemUltimo = ultimoMes ? dados[cat][ultimoMes] : null;
        
        if (!itemUltimo) {
          console.error('Item não encontrado para categoria:', cat, 'mês:', ultimoMes);
          continue;
        }
        
        // Garantir que o ID sempre existe (fallback para case antigos)
        const idItem = itemUltimo.ultimoId || itemUltimo.id || itemUltimo.categoria + '-' + ultimoMes;
        if (!idItem) {
          console.error('Não foi possível obter ID para item:', itemUltimo);
          continue;
        }
        const ehAutomatico = itemUltimo.automatico;
        const isReadOnly = AuthModule.currentUser?.role === 'jogador';
        
        if (!isReadOnly) {
          const acaoCell = document.createElement('td');
          acaoCell.setAttribute('data-label', 'Ações');
          
          if (!ehAutomatico) {
            // Proteção de 90 dias desabilitada temporariamente
            const ehAntigo = false;
            
            if (ehAntigo) {
              const span = document.createElement('span');
              span.style.cssText = 'font-size: 12px; color: var(--text-secondary); cursor: help;';
              span.title = 'Lançamento protegido';
              span.textContent = '🔒 Protegido';
              acaoCell.appendChild(span);
            } else if (itemUltimo.totalItens && itemUltimo.totalItens > 1) {
              const btnDetalhes = document.createElement('button');
              btnDetalhes.className = 'btn-secondary';
              btnDetalhes.style.cssText = 'font-size: 11px; padding: 4px 8px;';
              btnDetalhes.textContent = `Ver ${itemUltimo.totalItens} itens`;
              btnDetalhes.onclick = () => FinanceiroModule.abrirDetalhesLancamentos(cat, ultimoMes);
              acaoCell.appendChild(btnDetalhes);
            } else {
              const btnEditar = document.createElement('button');
              btnEditar.style.fontSize = '12px';
              btnEditar.textContent = '✏️';
              btnEditar.onclick = () => FinanceiroModule.editar(idItem);
              
              const btnRemover = document.createElement('button');
              btnRemover.style.fontSize = '12px';
              btnRemover.textContent = '🗑️';
              btnRemover.onclick = () => FinanceiroModule.remover(idItem);
              
              acaoCell.appendChild(btnEditar);
              acaoCell.appendChild(document.createTextNode(' '));
              acaoCell.appendChild(btnRemover);
            }
          } else {
            const span = document.createElement('span');
            span.style.cssText = 'font-size: 12px; color: var(--text-secondary);';
            span.textContent = 'Automático';
            acaoCell.appendChild(span);
          }
          
          row.appendChild(acaoCell);
        }
        
        tabela.appendChild(row);
      }
      
      if (!balanceOk || !Number.isFinite(saldoData.balance)) {
        saldoData = {
          balance: totalReceitas - totalDespesas,
          totalReceitas: totalReceitas,
          totalDespesas: totalDespesas,
          cached: false,
          fallback: true
        };
        console.warn('[FINANCEIRO] Usando saldo calculado no cliente (fallback):', saldoData);
      }

      // Exibir saldo calculado atomicamente pelo servidor
      const caixaTotalEl = document.getElementById('caixa-total');
      caixaTotalEl.innerText = `R$ ${Number(saldoData.balance || 0).toFixed(2)}`;
      const entradasEl = document.getElementById('finance-total-entradas');
      const saidasEl = document.getElementById('finance-total-saidas');
      if (entradasEl) entradasEl.innerText = `R$ ${Number(saldoData.totalReceitas || 0).toFixed(2)}`;
      if (saidasEl) saidasEl.innerText = `R$ ${Number(saldoData.totalDespesas || 0).toFixed(2)}`;
      
      // Indicar se é cache
      if (saldoData.cached && saldoData.cacheAge) {
        const minutes = Math.floor(saldoData.cacheAge / 60);
        const seconds = saldoData.cacheAge % 60;
        caixaTotalEl.title = `Calculado há ${minutes}min ${seconds}s (cache 5min)`;
        caixaTotalEl.style.cursor = 'help';
      } else if (saldoData.fallback) {
        caixaTotalEl.title = 'Saldo calculado localmente (fallback)';
        caixaTotalEl.style.cursor = 'help';
      } else {
        caixaTotalEl.title = 'Saldo atualizado agora (sem cache)';
      }
    }).catch(err => {
      console.error('[FINANCEIRO] ===== ERRO CAPTURADO =====');
      console.error('[FINANCEIRO] Erro completo:', err);
      console.error('[FINANCEIRO] Tipo:', typeof err);
      console.error('[FINANCEIRO] Código:', err.code);
      console.error('[FINANCEIRO] Mensagem:', err.message);
      console.error('[FINANCEIRO] Stack:', err.stack);
      console.error('[FINANCEIRO] ===========================');
      UI.showToast('Erro ao carregar financeiro: ' + (err.message || err.code || 'desconhecido'), 'error');
    });
  },

  updateFinanceiroHeader(monthKeys, isReadOnly) {
    const headerRow = document.getElementById('financeiro-header-row');
    if (!headerRow) return;

    const actionsHeader = isReadOnly ? '' : '<th>Ações</th>';
    headerRow.innerHTML = `
      <th>Descrição</th>
      ${monthKeys.map(key => `<th style="min-width: 80px;">${formatMonthLabel(key)}</th>`).join('')}
      ${actionsHeader}
    `;
  },

  editar(id) {
    const registro = this.registrosCache[id];
    if (!registro) {
      UI.showToast('Registro não encontrado', 'error');
      return;
    }

    // Proteção de 90 dias desabilitada temporariamente
    // const ts = registro.timestamp;
    // const temTimestamp = ts && ts > 0;
    // const idade = temTimestamp ? (Date.now() - ts) : 0;
    // if (temTimestamp && idade >= 7776000000) {
    //   UI.showToast('⏳ Este lançamento tem mais de 90 dias e não pode ser editado', 'warning');
    //   return;
    // }

    this.currentEditId = id;
    this.currentEditType = registro.tipo;

    let campoValor, campoCard;
    if (registro.tipo === 'entrada') {
      document.getElementById('valorEntrada').value = registro.valor;
      document.getElementById('mesEntrada').value = registro.mes;
      document.getElementById('categoriaEntrada').value = registro.categoria;
      document.getElementById('btnCancelarEntrada').style.display = 'inline-block';
      campoValor = document.getElementById('valorEntrada');
      campoCard = campoValor.closest('.finance-form-card');
    } else {
      document.getElementById('valorSaida').value = registro.valor;
      document.getElementById('mesSaida').value = registro.mes;
      document.getElementById('categoriaSaida').value = registro.categoria;
      document.getElementById('btnCancelarSaida').style.display = 'inline-block';
      campoValor = document.getElementById('valorSaida');
      campoCard = campoValor.closest('.finance-form-card');
    }

    // Scroll suave até o formulário
    const formRow = document.getElementById('financeiro-form-row');
    if (formRow) {
      formRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Destacar visualmente o card em edição
    if (campoCard) {
      campoCard.style.transition = 'all 0.3s';
      campoCard.style.transform = 'scale(1.02)';
      campoCard.style.boxShadow = '0 4px 20px rgba(52, 152, 219, 0.4)';
      setTimeout(() => {
        campoCard.style.transform = 'scale(1)';
        campoCard.style.boxShadow = '';
      }, 2000);
    }

    // Dar foco no campo de valor após um pequeno delay
    setTimeout(() => {
      if (campoValor) {
        campoValor.focus();
        campoValor.select(); // Selecionar o valor para facilitar edição
      }
    }, 300);

    UI.showToast('✏️ Editando lançamento - altere os campos e clique em Salvar', 'info');
  },

  remover(id) {
    if (!id) {
      UI.showToast('ID do lancamento invalido', 'error');
      return;
    }
    const registro = this.registrosCache[id];
    if (!registro) {
      UI.showToast('Registro não encontrado', 'error');
      return;
    }

    // Proteção de 90 dias desabilitada temporariamente
    // const ts = registro.timestamp;
    // const temTimestamp = ts && ts > 0;
    // const idade = temTimestamp ? (Date.now() - ts) : 0;
    // if (temTimestamp && idade >= 7776000000) {
    //   UI.showToast('⏳ Este lançamento tem mais de 90 dias e não pode ser excluído', 'warning');
    //   return;
    // }

    const tipoTexto = registro.tipo === 'entrada' ? 'Entrada' : 'Saída';
    const mensagem = `Excluir lançamento?\n\nTipo: ${tipoTexto}\nValor: R$ ${registro.valor.toFixed(2)}\nCategoria: ${registro.categoria}\nMês: ${registro.mes}\n\n⚠️ Esta ação não pode ser desfeita!`;
    
    UI.showConfirm(mensagem, async () => {
      const clubId = ClubModule.currentClubId;
      if (!clubId) {
        UI.showToast('Erro: Clube não identificado', 'error');
        return;
      }

      try {
        await functions.httpsCallable('deleteFinancialTransaction')({
          clubId,
          transactionId: id
        });
        
        AuthModule.logAction('remover_financeiro', `Removeu ${registro.tipo || 'lancamento'}: ${registro.categoria || 'sem-categoria'} - R$ ${(registro.valor || 0).toFixed(2)}`);
        UI.showToast('Lançamento removido!', 'success');
        this.load();
      } catch (err) {
        console.error('[FINANCEIRO] Erro na Cloud Function:', err);
        
        // FALLBACK: Se Cloud Function falhar E usuário for admin/diretor, deletar direto
        const userRole = AuthModule.currentUser?.role;
        if (userRole === 'admin' || userRole === 'diretor') {
          console.log('[FINANCEIRO] Usando fallback - deletar direto do banco');
          try {
            // Deletar do banco
            await dbRef(`financeiro/${id}`).remove();
            
            // Invalidar cache de saldo
            await dbRef(`cache/balance`).remove();
            
            AuthModule.logAction('remover_financeiro', `Removeu ${registro.tipo || 'lancamento'}: ${registro.categoria || 'sem-categoria'} - R$ ${(registro.valor || 0).toFixed(2)} [FALLBACK]`);
            UI.showToast('Lançamento removido!', 'success');
            this.load();
            return;
          } catch (fallbackErr) {
            console.error('[FINANCEIRO] Fallback também falhou:', fallbackErr);
          }
        }
        
        MonitoringModule.captureException(err, {
          action: 'delete_financial_transaction',
          transaction_id: id,
          transaction_type: registro.tipo,
          categoria: registro.categoria
        }, 'error');
        UI.showToast(`Erro ao remover: ${err.message || 'Erro desconhecido'}`, 'error');
      }
    });
  }
};

// ===========================
// MÓDULO: MENU
// ===========================

const MenuModule = {
  async init() {
    const role = AuthModule.currentUser?.role || '';
    let adminSelectorHtml = '';
    
    // Se for admin global, carregar seletor de clube antes do dashboard
    if (AuthModule.currentUser?.platform_admin) {
      const selector = await ClubModule.getAdminGlobalClubSelector();
      if (selector) {
        adminSelectorHtml = selector.html;
      }
    }
    
    // Mostrar loading
    const container = document.getElementById('main-content');
    container.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="spinner"></div><p style="margin-top: 20px; color: var(--text-secondary);">Carregando dashboard...</p></div>';
    
    // Buscar dados do dashboard
    const dashboardData = await this.loadDashboardData(role);

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
      },
      {
        id: 'usuarios',
        icon: '🔐',
        title: 'Gerenciar Usuários',
        desc: 'Aprove ou rejeite novos acessos',
        roles: ['diretor', 'admin']
      },
      {
        id: 'gestao-clubes',
        icon: '🏢',
        title: 'Gestão de Clubes',
        desc: 'Vincule usuários, perfis e clubes',
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
    
    // Renderizar dashboard com informações
    const clubName = ClubModule.currentClubName || AuthModule.currentUser?.clubName || 'seu clube';
    this.renderDashboard(role, dashboardData, cardsHtml, clubName, adminSelectorHtml);
  },
  
  async loadDashboardData(role) {
    const data = {
      saldoAtual: 0,
      totalEntradas: 0,
      totalSaidas: 0,
      mensalidadesPendentes: 0,
      mensalidadesEmDia: 0,
      jogadoresAtivos: 0,
      proximoJogoData: null, // Data do próximo jogo
      usuariosPendentes: 0,
      maiorArtilheiro: { nomes: [], gols: 0 },    // Array de nomes
      maiorAssistente: { nomes: [], assistencias: 0 } // Array de nomes
    };
    
    const clubId = ClubModule.currentClubId || AuthModule.currentUser?.clubId;
    if (!clubId) {
      console.warn('[DASHBOARD] ClubId não definido');
      return data;
    }
    
    try {
      // Buscar dados financeiros (diretor e admin)
      if (role === 'diretor' || role === 'admin') {
        let balanceOk = true;

        // Usar Cloud Function para saldo (atomic, com cache)
        const adminClubId = ClubModule.currentClubId;
        if (adminClubId) {
          try {
            const getBalance = functions.httpsCallable('getBalance');
            const result = await getBalance({ clubId: adminClubId });
            data.saldoAtual = Number(result.data.balance || 0);
            data.totalEntradas = Number(result.data.totalReceitas || 0);
            data.totalSaidas = Number(result.data.totalDespesas || 0);
            console.log('[DASHBOARD] Saldo obtido via Cloud Function:', result.data);
          } catch (balanceError) {
            balanceOk = false;
            console.error('[DASHBOARD] Erro ao buscar saldo:', balanceError);
          }
        }
        
        // Buscar dados de jogadores e financeiro - do clube específico
        try {
          const [snapJogadores, snapFinanceiro] = await Promise.all([
            db.ref(`clubs/${clubId}/jogadores`).once('value'),
            db.ref(`clubs/${clubId}/financeiro`).once('value')
          ]);

          const jogadores = snapJogadores.val() || {};
          const financeiro = snapFinanceiro.val() || {};
          const mesAtual = getCurrentMonthKey();

          Object.values(jogadores).forEach(jogador => {
            data.jogadoresAtivos++;
            if (jogador.isento) {
              return;
            }
            const { map } = normalizeMensalidades(jogador);
            const mensal = map[mesAtual];
            if (mensal && mensal.pago) {
              data.mensalidadesEmDia++;
            } else {
              data.mensalidadesPendentes++;
            }
          });

          // Fallback local se Cloud Function falhar
          if (!balanceOk || !Number.isFinite(data.saldoAtual)) {
            let totalReceitas = 0;
            let totalDespesas = 0;

            Object.values(financeiro).forEach(item => {
              const valor = parseFloat(item.valor) || 0;
              const tipo = String(item.tipo || '').toLowerCase();
              if (tipo === 'entrada' || tipo === 'receita') totalReceitas += valor;
              if (tipo === 'saida' || tipo === 'despesa') totalDespesas += valor;
            });

            Object.values(jogadores).forEach(jogador => {
              if (jogador.isento) {
                return;
              }
              const { map } = normalizeMensalidades(jogador);
              Object.values(map || {}).forEach(mensal => {
                if (mensal && mensal.pago) {
                  totalReceitas += (mensal.valorPago || mensal.valor || 0);
                }
              });
            });

            data.totalEntradas = totalReceitas;
            data.totalSaidas = totalDespesas;
            data.saldoAtual = totalReceitas - totalDespesas;
            console.warn('[DASHBOARD] Saldo calculado localmente (fallback):', {
              totalReceitas,
              totalDespesas,
              saldo: data.saldoAtual
            });
          }
        } catch (err) {
          console.error('[DASHBOARD] Erro ao buscar jogadores/financeiro:', err);
        }
      }
      
      // Buscar o PRÓXIMO jogo agendado (mais próximo da data atual) - do clube específico
      try {
        const snapJogos = await db.ref(`clubs/${clubId}/jogos`).once('value');
        const jogos = snapJogos.val() || {};
        let proximoJogo = null;
        let proximaData = null;
        
        Object.values(jogos).forEach(jogo => {
          // Considerar jogos agendados ou sem status
          if ((jogo.status === 'agendado' || !jogo.status) && jogo.data) {
            // Parse de data em horario local para evitar offset de fuso
            const [ano, mes, dia] = String(jogo.data).split('-').map(Number);
            let jogoData = new Date(ano, (mes || 1) - 1, dia || 1);
            if (jogo.hora) {
              const [hh, mm] = String(jogo.hora).split(':').map(Number);
              jogoData.setHours(hh || 0, mm || 0, 0, 0);
            }
            const agora = new Date();
            
            // Apenas jogos no futuro
            if (jogoData >= agora) {
              if (!proximaData || jogoData < proximaData) {
                proximaData = jogoData;
                proximoJogo = jogo;
              }
            }
          }
        });
        
        if (proximoJogo && proximaData) {
          // Formatar data para exibição: "15 de fevereiro"
          const opcoes = { day: 'numeric', month: 'long', year: 'numeric' };
          data.proximoJogoData = new Intl.DateTimeFormat('pt-BR', opcoes).format(proximaData);
          console.log('[DASHBOARD] Próximo jogo encontrado:', data.proximoJogoData, proximoJogo);
        } else {
          data.proximoJogoData = null;
          console.log('[DASHBOARD] Nenhum próximo jogo encontrado');
        }
      } catch (err) {
        console.error('[DASHBOARD] Erro ao buscar jogos:', err);
      }
      
      // Buscar artilheiro e assistente (todos os papéis) - do clube específico
      // Calcular a partir dos dados dos jogadores e jogos
      try {
        const snapJogadores = await db.ref(`clubs/${clubId}/jogadores`).once('value');
        const snapJogos = await db.ref(`clubs/${clubId}/jogos`).once('value');
        
        const jogadores = snapJogadores.val() || {};
        const jogos = snapJogos.val() || {};
        
        // Inicializar stats para todos os jogadores
        const stats = {};
        Object.entries(jogadores).forEach(([id, jogador]) => {
          stats[id] = {
            nome: jogador.nome || '',
            gols: 0,
            assistencias: 0
          };
        });
        
        // Contar gols e assistências a partir dos jogos concluídos
        Object.values(jogos).forEach(jogo => {
          if (jogo.status !== 'concluido') return;
          
          // Processar goleadores
          if (jogo.goleadores && typeof jogo.goleadores === 'object') {
            Object.entries(jogo.goleadores).forEach(([jogadorId, qtdGols]) => {
              if (stats[jogadorId]) {
                stats[jogadorId].gols += parseInt(qtdGols) || 0;
              }
            });
          }
          
          // Processar assistências
          if (jogo.assistencias && typeof jogo.assistencias === 'object') {
            Object.entries(jogo.assistencias).forEach(([jogadorId, qtdAssistencias]) => {
              if (stats[jogadorId]) {
                stats[jogadorId].assistencias += parseInt(qtdAssistencias) || 0;
              }
            });
          }
        });
        
        // Encontrar TODOS os artilheiros com maior gol
        let maxGols = 0;
        const artilheiros = [];
        Object.values(stats).forEach(stat => {
          if (stat.gols > maxGols) {
            maxGols = stat.gols;
            artilheiros.length = 0;
            artilheiros.push(stat.nome);
          } else if (stat.gols === maxGols && stat.gols > 0) {
            artilheiros.push(stat.nome);
          }
        });
        
        // Encontrar TODOS os assistentes com maior número
        let maxAssistencias = 0;
        const assistentes = [];
        Object.values(stats).forEach(stat => {
          if (stat.assistencias > maxAssistencias) {
            maxAssistencias = stat.assistencias;
            assistentes.length = 0;
            assistentes.push(stat.nome);
          } else if (stat.assistencias === maxAssistencias && stat.assistencias > 0) {
            assistentes.push(stat.nome);
          }
        });
        
        // Guardar dados para exibição
        data.maiorArtilheiro = {
          nomes: artilheiros,
          gols: maxGols
        };
        data.maiorAssistente = {
          nomes: assistentes,
          assistencias: maxAssistencias
        };
        
        console.log('[DASHBOARD] Estatísticas calculadas:', data.maiorArtilheiro, data.maiorAssistente);
      } catch (err) {
        console.error('[DASHBOARD] Erro ao calcular estatísticas:', err);
      }
      
      // Buscar usuários pendentes (diretor e admin) - do clube específico
      if (role === 'diretor' || role === 'admin') {
        try {
          const snapUsers = await db.ref(`clubs/${clubId}/members`).once('value');
          const users = snapUsers.val() || {};
          Object.values(users).forEach(user => {
            if (user.status === 'pending') {
              data.usuariosPendentes++;
            }
          });
        } catch (err) {
          console.error('[DASHBOARD] Erro ao buscar membros pendentes:', err);
        }
      }
      
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    }
    
    return data;
  },
  
  renderDashboard(role, data, cardsHtml, clubName, adminSelectorHtml = '') {
    const container = document.getElementById('main-content');
    
    // Cards informativos baseados no papel do usuário
    let statsCardsHtml = '';
    
    if (role === 'diretor' || role === 'admin') {
      statsCardsHtml = `
        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px;">
          <div class="stat-card" style="background: linear-gradient(135deg, var(--success-color), #059669); color: white; padding: 24px; border-radius: var(--border-radius); box-shadow: var(--shadow);">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">💰 Saldo Atual</div>
            <div style="font-size: 32px; font-weight: 700; margin-bottom: 4px;">R$ ${data.saldoAtual.toFixed(2)}</div>
            <div style="font-size: 12px; opacity: 0.8;">↗ Entradas: R$ ${data.totalEntradas.toFixed(2)}</div>
            <div style="font-size: 12px; opacity: 0.8;">↘ Saídas: R$ ${data.totalSaidas.toFixed(2)}</div>
          </div>
          
          <div class="stat-card" style="background: ${data.mensalidadesPendentes > 0 ? 'linear-gradient(135deg, var(--warning-color), #d97706)' : 'linear-gradient(135deg, var(--primary-color), var(--primary-light))'}; color: white; padding: 24px; border-radius: var(--border-radius); box-shadow: var(--shadow);">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">📋 Mensalidades (mês atual)</div>
            <div style="font-size: 32px; font-weight: 700; margin-bottom: 4px;">${data.mensalidadesEmDia} em dia</div>
            <div style="font-size: 12px; opacity: 0.8;">${data.mensalidadesPendentes} pendentes</div>
          </div>
          
          <div class="stat-card" style="background: linear-gradient(135deg, var(--accent-color), var(--accent-dark)); color: white; padding: 24px; border-radius: var(--border-radius); box-shadow: var(--shadow);">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">⚽ Próximo Jogo</div>
            <div style="font-size: 28px; font-weight: 700; margin-bottom: 4px;">${data.proximoJogoData || 'Sem agendamento'}</div>
            <div style="font-size: 12px; opacity: 0.8;">${data.proximoJogoData ? 'Data da partida' : 'Nenhum jogo agendado'}</div>
          </div>
          
        </div>
      `;
    } else {
      // Para jogadores, mostrar apenas informações públicas
      statsCardsHtml = `
        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px;">
          <div class="stat-card" style="background: linear-gradient(135deg, #f97316, #eb5e28); color: white; padding: 24px; border-radius: var(--border-radius); box-shadow: var(--shadow);">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">⚽ Próximo Jogo</div>
            <div style="font-size: 28px; font-weight: 700; margin-bottom: 4px;">${data.proximoJogoData || 'Sem agendamento'}</div>
            <div style="font-size: 12px; opacity: 0.8;">${data.proximoJogoData ? 'Data do próximo jogo' : 'Nenhum jogo agendado'}</div>
          </div>
          
          <div class="stat-card" style="background: linear-gradient(135deg, var(--primary-color), var(--primary-light)); color: white; padding: 24px; border-radius: var(--border-radius); box-shadow: var(--shadow);">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 12px;">⚡ Maiores Destaques</div>
            <div style="font-size: 16px; font-weight: 700; margin-bottom: 12px; padding: 10px; background: rgba(0,0,0,0.15); border-radius: 6px;">
              🔥 Artilheiros: 
              <span style="display: block; font-size: 18px; margin-top: 6px;">
                ${data.maiorArtilheiro.nomes && data.maiorArtilheiro.nomes.length > 0 
                  ? data.maiorArtilheiro.nomes.join(', ') + ' <span style="font-size: 16px; opacity: 0.9;">(' + data.maiorArtilheiro.gols + ' gols)</span>' 
                  : 'N/A'}
              </span>
            </div>
            <div style="font-size: 16px; font-weight: 700; padding: 10px; background: rgba(0,0,0,0.15); border-radius: 6px;">
              🎯 Assistentes: 
              <span style="display: block; font-size: 18px; margin-top: 6px;">
                ${data.maiorAssistente.nomes && data.maiorAssistente.nomes.length > 0 
                  ? data.maiorAssistente.nomes.join(', ') + ' <span style="font-size: 16px; opacity: 0.9;">(' + data.maiorAssistente.assistencias + ' asts)</span>' 
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      ${adminSelectorHtml}
      <div class="menu-wrapper" style="padding: 40px 0; max-width: 100%; overflow: hidden;">
        <h1 class="welcome-title" style="font-size: 36px; margin-bottom: 15px; background: linear-gradient(135deg, var(--accent-color), #0891b2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700;">Bem-vindo ao ${clubName}</h1>
        <p class="welcome-subtitle" style="font-size: 17px; color: var(--text-secondary); margin-bottom: 40px;">Painel de Gestão de Clube Amador</p>
        
        ${statsCardsHtml}
        
        <h2 style="font-size: 24px; color: var(--text-primary); margin-bottom: 20px; font-weight: 600;">Acesso Rápido</h2>
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
  console.log('[MODULO] Carregando:', mod);
  
  // Salvar módulo atual para facilitar recarregamento
  localStorage.setItem('currentModule', mod);
  
  // Rastrear visualização de página/módulo
  MonitoringModule.trackPageView(mod, `Módulo: ${mod}`);
  MonitoringModule.trackEvent('module_loaded', { module: mod });
  
  const modules = {
    'menu': MenuModule,
    'jogadores': JogadoresModule,
    'jogos': JogosModule,
    'estatisticas': EstatisticasModule,
    'financeiro': FinanceiroModule,
    'logs': LogsModule,
    'usuarios': UserManagementModule,
    'gestao-clubes': ClubManagementModule
  };

  if (modules[mod]) {
    try {
      // ClubManagementModule usa load(), não init()
      if (mod === 'gestao-clubes') {
        modules[mod].load();
      } else if (mod === 'menu' || mod === 'jogadores' || mod === 'jogos' || mod === 'estatisticas' || mod === 'financeiro') {
        // Estes módulos têm init() async para suportar admin global
        modules[mod].init().then(() => {
          console.log('[MODULO] ✓', mod, 'carregado com sucesso');
          MonitoringModule.addBreadcrumb(`Módulo ${mod} inicializado`, 'module', 'info');
        }).catch(err => {
          console.error('[MODULO] Erro ao carregar', mod, ':', err);
          MonitoringModule.captureException(err, { module: mod }, 'error');
          UI.showToast(`Erro ao carregar ${mod}`, 'error');
        });
      } else {
        modules[mod].init();
        console.log('[MODULO] ✓', mod, 'carregado com sucesso');
        MonitoringModule.addBreadcrumb(`Módulo ${mod} inicializado`, 'module', 'info');
      }
    } catch (err) {
      console.error('[MODULO] Erro ao carregar', mod, ':', err);
      MonitoringModule.captureException(err, { module: mod }, 'error');
      UI.showToast(`Erro ao carregar ${mod}`, 'error');
    }
  } else {
    console.error('[MODULO] ✗ Módulo não encontrado:', mod);
    MonitoringModule.trackEvent('module_not_found', { module: mod });
    MonitoringModule.captureException(new Error(`Módulo não encontrado: ${mod}`), { module: mod }, 'warning');
  }
}

// ===========================
// INICIALIZAÇÃO
// ===========================

window.addEventListener('DOMContentLoaded', () => {
  console.log('[FAMILIA13] DOMContentLoaded - iniciando app');
  AuthModule.init();
});

/**
 * Função auxiliar global para forçar recalcular do saldo
 * Chame no console: window.forceRecalcularSaldo()
 */
window.forceRecalcularSaldo = async function() {
  try {
    const clubId = ClubModule.currentClubId;
    if (!clubId) {
      console.error('❌ ClubId não identificado');
      return;
    }
    
    console.log('🔄 Forçando recalcular do saldo...');
const getBalance = functions.httpsCallable('getBalance');
    const result = await getBalance({ clubId, forceRecalculate: true });
    
    console.log('✅ Saldo recalculado:', result.data);
    alert(`✅ Saldo atualizado!\n\nCaixa: R$ ${result.data.balance.toFixed(2)}\nEntradas: R$ ${result.data.totalReceitas.toFixed(2)}\nSaídas: R$ ${result.data.totalDespesas.toFixed(2)}`);
    
    // Recarregar os dados na tela
    FinanceiroModule.load();
  } catch (err) {
    console.error('❌ Erro:', err);
    alert(`❌ Erro ao recalcular: ${err.message}`);
  }
};

console.log('[FAMILIA13] Script carregado e aguardando DOM pronto');
