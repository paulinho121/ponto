/**
 * Main Entry Point
 * Ponto de entrada principal da aplicação modernizada
 */

import { createClient } from '@supabase/supabase-js';
import { initializeApp } from './core/application.js';
import { appConfig } from './config/app-config.js';
import { logger } from './utils/logger.js';

// Importar configuração do Supabase de forma segura
let SUPABASE_URL = '';
let SUPABASE_ANON_KEY = '';

try {
  // Tentar importar as configurações
  const supabaseConfig = await import('./config/supabase-config.js');
  SUPABASE_URL = supabaseConfig.SUPABASE_URL || '';
  SUPABASE_ANON_KEY = supabaseConfig.SUPABASE_ANON_KEY || '';
} catch (error) {
  console.warn('Erro ao importar configuração do Supabase:', error.message);
  // Tentar obter as configurações do objeto global
  if (typeof window !== 'undefined' && window.CHRONOS_SUPABASE) {
    SUPABASE_URL = window.CHRONOS_SUPABASE.url || '';
    SUPABASE_ANON_KEY = window.CHRONOS_SUPABASE.anonKey || '';
  }
}

// Criar cliente do Supabase
let supabase;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      localStorage: globalThis?.localStorage || null
    },
    global: {
      headers: {
        'X-Client-Info': 'ponto-qfam/2.0.0'
      }
    }
  });
} else {
  logger.warn('Credenciais do Supabase não configuradas. Funcionalidades online desativadas.');
  // Criar um cliente mock para evitar erros
  supabase = {
    auth: {
      signInWithPassword: async () => ({ error: { message: 'Credenciais do Supabase não configuradas' } }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null })
    },
    from: (table) => ({
      select: () => ({ data: [], error: null }),
      eq: () => ({ select: () => ({ data: [], error: null }) }),
      single: () => ({ data: null, error: null }),
      insert: () => ({ data: [], error: null }),
      update: () => ({ data: [], error: null })
    }),
    rpc: (func) => ({
      single: () => ({ data: null, error: null })
    })
  };
}

// Tornar o cliente Supabase disponível globalmente para uso em páginas antigas
window.chronosSupabase = supabase;

// Inicializar a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
  try {
    logger.info('Iniciando inicialização da aplicação...');
    
    // Inicializar a aplicação com o cliente Supabase
    const app = await initializeApp(supabase);
    
    logger.info('Aplicação inicializada com sucesso!', {
      ready: app.isReady(),
      environment: appConfig.environment
    });
    
    // Tornar a aplicação disponível globalmente para debugging
    window.PONTO_APP = app;
    window.SUPABASE_CLIENT = supabase;
    
    // Garantir que o botão de login esteja visível antes de carregar componentes
    ensureLoginButtonVisibility();
    
    // Carregar componentes específicos da página
    await loadPageComponents();
    
  } catch (error) {
    logger.error('Erro fatal na inicialização da aplicação', { 
      error: error.message, 
      stack: error.stack 
    });
    
    // Mostrar mensagem de erro amigável ao usuário
    showInitializationError(error);
  }
});

/**
 * Garantir que o botão de login esteja visível
 */
function ensureLoginButtonVisibility() {
  // Garantir que o botão de login esteja visível na página de login
  const loginButton = document.getElementById('loginBtn');
  if (loginButton) {
    loginButton.style.display = 'flex';
    loginButton.style.visibility = 'visible';
    loginButton.disabled = false;
  }
}

/**
 * Carregar componentes específicos da página
 */
async function loadPageComponents() {
  const currentPage = getCurrentPage();
  
  switch(currentPage) {
    case 'index':
    case 'login':
      await import('./pages/login-page.js');
      break;
    case 'ponto':
      await import('./pages/ponto-page.js');
      break;
    case 'historico':
      await import('./pages/historico-page.js');
      break;
    case 'admin':
      await import('./pages/admin-page.js');
      break;
    default:
      logger.warn('Página não identificada, carregando componentes padrão');
      break;
  }
}

/**
 * Obter nome da página atual
 */
function getCurrentPage() {
  const path = window.location.pathname;
  const page = path.split('/').pop().replace('.html', '') || 'index';
  return page;
}

/**
 * Mostrar erro de inicialização
 */
function showInitializationError(error) {
  const errorDiv = document.createElement('div');
  errorDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      padding: 20px;
      text-align: center;
    ">
      <h2>Erro na Inicialização</h2>
      <p>${error.message}</p>
      <button onclick="location.reload()" style="
        margin-top: 20px;
        padding: 10px 20px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      ">Tentar Novamente</button>
    </div>
  `;
  
  document.body.appendChild(errorDiv);
}

// Exportar para uso em outros módulos se necessário
export { supabase };