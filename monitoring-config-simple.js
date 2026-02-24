/**
 * MONITORING CONFIG - SIMPLIFIED VERSION
 * Fallback configuration if the main version has issues
 */

// Minimal Sentry config
const SENTRY_CONFIG = {
  dsn: '',
  environment: 'production',
  tracesSampleRate: 0.0  
};

// Minimal Google Analytics config
const GOOGLE_ANALYTICS_CONFIG = {
  measurement_id: ''
};

// Minimal Firebase Analytics config
const FIREBASE_ANALYTICS_CONFIG = {
  enabled: false
};

// Minimal tracking events
const TRACKING_EVENTS = {
  LOGIN_ATTEMPT: 'login_attempt',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_ERROR: 'login_error',
  LOGOUT: 'logout',
  REGISTER_ATTEMPT: 'register_attempt',
  REGISTER_SUCCESS: 'register_success',
  MODULE_LOADED: 'module_loaded',
  PAGE_VIEW: 'page_view',
  JOGADOR_ADDED: 'jogador_added',
  JOGADOR_DELETED: 'jogador_deleted',
  JOGO_SCHEDULED: 'jogo_scheduled',
  JOGO_FINALIZED: 'jogo_finalized',
  JOGO_DELETED: 'jogo_deleted',
  FINANCEIRO_TRANSACTION_ADDED: 'financeiro_transaction_added',
  FINANCEIRO_TRANSACTION_DELETED: 'financeiro_transaction_deleted',
  FINANCEIRO_CATEGORY_ADDED: 'categoria_adicionada',
  FINANCEIRO_CATEGORY_DELETED: 'categoria_deletada',
  FINANCEIRO_CATEGORY_RENAMED: 'categoria_renomeada'
};

console.log('[MONITORING] Config simplificada carregada');
