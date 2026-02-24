/**
 * CONFIGURAÇÃO: MONITORAMENTO E ANALYTICS
 * 
 * Este arquivo contém as configurações de Sentry, Google Analytics e Firebase Analytics.
 * IMPORTANTE: Substituir os valores de placeholder com chaves reais em produção.
 * 
 * Não fazer commit de chaves sensíveis no git.
 * Usar variáveis de ambiente ou GitHub Secrets para CI/CD.
 */

// ===========================
// SENTRY CONFIGURATION
// ===========================
const SENTRY_CONFIG = {
  // IMPORTANTE: Obter em https://sentry.io/
  // DSN = Data Source Name (chave publica do projeto)
  dsn: 'https://seu-sentry-dsn@sentry.io/seu-project-id',
  
  // Ambiente de execução
  environment: 'production', // 'development', 'staging', 'production'
  
  // Taxa de amostragem de eventos (0.0 a 1.0)
  //   0.0 = nenhum evento rastreado
  //   0.5 = 50% dos eventos rastreados
  //   1.0 = 100% dos eventos rastreados
  tracesSampleRate: 0.5,
  
  // Anexar stack trace automaticamente
  attachStacktrace: true,
  
  // Máximo de breadcrumbs (últimas ações executadas)
  maxBreadcrumbs: 50,
  
  // Ignorar scripts de erro específicos
  denyUrls: [
    // Ignorar erros de extensões do navegador
    /extensions\//i,
    /^chrome:\/\//i,
    /^moz-extension:\/\//i,
    
    // Ignorar erros de third-party
    /graph\.instagram\.com/i,
    /api\.github\.com/i
  ]
};

// ===========================
// GOOGLE ANALYTICS CONFIGURATION
// ===========================
const GOOGLE_ANALYTICS_CONFIG = {
  // IMPORTANTE: Obter em https://analytics.google.com/
  // Formato: G-XXXXXXXXXX
  measurementId: 'G-XXXXXXXXXX',
  
  // Rastrear cliques internos
  trackOutboundLinks: true,
  
  // Rastrear downloads
  trackDownloads: true,
  
  // Rastrear vídeos (se aplicável)
  trackVideos: false,
  
  // Enviar página de referência
  sendPageView: true
};

// ===========================
// FIREBASE ANALYTICS CONFIGURATION
// ===========================
const FIREBASE_ANALYTICS_CONFIG = {
  // Habilitado por padrão
  enabled: true,
  
  // Coletar ID do dispositivo
  collectDeviceId: true,
  
  // Taxa de amostragem de eventos (não recomendado, deixar em 1.0)
  sampleRate: 1.0
};

// ===========================
// EVENTOS DE RASTREAMENTO CUSTOMIZADOS
// ===========================
// Mapa de eventos importantes para rastrear
const TRACKING_EVENTS = {
  // Autenticação
  LOGIN_ATTEMPT: 'login_attempt',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_ERROR: 'login_error',
  LOGOUT: 'logout',
  REGISTER_ATTEMPT: 'register_attempt',
  REGISTER_SUCCESS: 'register_success',
  
  // Navegação
  MODULE_LOADED: 'module_loaded',
  PAGE_VIEW: 'page_view',
  
  // Ações - Jogadores
  JOGADOR_ADDED: 'jogador_added',
  JOGADOR_DELETED: 'jogador_deleted',
  
  // Ações - Jogos
  JOGO_SCHEDULED: 'jogo_scheduled',
  JOGO_FINALIZED: 'jogo_finalized',
  JOGO_DELETED: 'jogo_deleted',
  
  // Ações - Financeiro
  FINANCEIRO_TRANSACTION_ADDED: 'financeiro_transaction_added',
  FINANCEIRO_TRANSACTION_DELETED: 'financeiro_transaction_deleted',
  
  // Erros
  ERROR_CRITICAL: 'error_critical',
  ERROR_WARNING: 'error_warning',
  PERFORMANCE_SLOW: 'performance_slow',
  
  // Feedback
  USER_FEEDBACK: 'user_feedback',
  CRASH_REPORT: 'crash_report'
};

// ===========================
// FUNÇÕES HELPERS
// ===========================

/**
 * Verificar se Sentry está disponível
 */
function isSentryEnabled() {
  return window.Sentry && SENTRY_CONFIG.dsn && !SENTRY_CONFIG.dsn.includes('seu-sentry');
}

/**
 * Verificar se Google Analytics está disponível
 */
function isGoogleAnalyticsEnabled() {
  return GOOGLE_ANALYTICS_CONFIG.measurementId && !GOOGLE_ANALYTICS_CONFIG.measurementId.includes('XXXXXXXXXX');
}

/**
 * Obter versão da app
 */
function getAppVersion() {
  const scriptTag = document.querySelector('script[src*="app.js"]');
  const src = scriptTag?.getAttribute('src') || '';
  const match = src.match(/v=([0-9\-]+)/);
  return match ? match[1] : 'unknown';
}

/**
 * Obter informações do usuário para Sentry
 */
function getUserContextForSentry() {
  if (!window.AuthModule || !window.AuthModule.currentUser) {
    return null;
  }
  
  const user = window.AuthModule.currentUser;
  return {
    id: user.uid || user.id,
    email: user.email || user.login,
    username: user.nome || user.login,
    ip_address: '{{auto}}' // Sentry preencherá automaticamente
  };
}

/**
 * Obter contexto global para Sentry
 */
function getGlobalContextForSentry() {
  return {
    app_version: getAppVersion(),
    browser: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    clube: window.ClubModule?.currentClubName || 'unknown'
  };
}

// ===========================
// EXPORTAR CONFIGURAÇÕES
// ===========================
// Se usando módulos ES6, descomenter:
// export { SENTRY_CONFIG, GOOGLE_ANALYTICS_CONFIG, FIREBASE_ANALYTICS_CONFIG };

// Para uso global via script tag:
// window.MONITORING = { SENTRY_CONFIG, GOOGLE_ANALYTICS_CONFIG, FIREBASE_ANALYTICS_CONFIG };
