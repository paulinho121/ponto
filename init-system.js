/**
 * Sistema de inicialização simplificado para o Ponto Qfam
 */

class SystemInitializer {
  constructor() {
    this.initialized = false;
    this.dependenciesLoaded = false;
    this.supabaseReady = false;
  }

  /**
   * Carregar dependências essenciais
   */
  async loadDependencies() {
    console.log('🔄 Carregando dependências...');
    
    try {
      // Verificar se o Supabase JS está disponível
      if (typeof window.supabase === 'undefined') {
        console.log('⏳ Carregando biblioteca Supabase...');
        const supabaseScript = document.createElement('script');
        supabaseScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        document.head.appendChild(supabaseScript);
        
        // Esperar o carregamento
        await new Promise((resolve) => {
          supabaseScript.onload = resolve;
          setTimeout(resolve, 5000);
        });
      }
      
      // Verificar se as configurações do Supabase estão disponíveis
      if (typeof window.CHRONOS_SUPABASE === 'undefined') {
        console.log('⏳ Carregando configurações do Supabase...');
        const configScript = document.createElement('script');
        configScript.src = 'supabase-config.js';
        configScript.async = false;
        document.head.appendChild(configScript);
        
        await new Promise((resolve) => {
          configScript.onload = resolve;
          setTimeout(resolve, 3000);
        });
      }
      
      this.dependenciesLoaded = true;
      console.log('✅ Dependências carregadas');
      return true;
    } catch (error) {
      console.error('❌ Erro ao carregar dependências:', error);
      return false;
    }
  }

  /**
   * Inicializar cliente Supabase
   */
  async initializeSupabase() {
    console.log('🔄 Inicializando cliente Supabase...');
    
    try {
      if (!window.CHRONOS_SUPABASE || !window.CHRONOS_SUPABASE.url || !window.CHRONOS_SUPABASE.anonKey) {
        console.error('❌ Configurações do Supabase incompletas');
        throw new Error('Configurações do Supabase não encontradas. Verifique o arquivo supabase-config.js');
      }
      
      // Criar cliente Supabase
      const { createClient } = window.supabase;
      window.chronosSupabase = createClient(
        window.CHRONOS_SUPABASE.url,
        window.CHRONOS_SUPABASE.anonKey,
        {
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
        }
      );
      
      this.supabaseReady = true;
      console.log('✅ Cliente Supabase inicializado');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar Supabase:', error);
      return false;
    }
  }

  /**
   * Inicializar todo o sistema
   */
  async initialize() {
    if (this.initialized) {
      console.log('ℹ️ Sistema já inicializado');
      return true;
    }
    
    console.log('🚀 Inicializando sistema Ponto Qfam...');
    
    // Carregar dependências
    const depsOk = await this.loadDependencies();
    if (!depsOk) {
      console.error('❌ Falha ao carregar dependências');
      return false;
    }
    
    // Inicializar Supabase
    const supabaseOk = await this.initializeSupabase();
    if (!supabaseOk) {
      console.error('❌ Falha ao inicializar Supabase');
      return false;
    }
    
    this.initialized = true;
    console.log('🎉 Sistema inicializado com sucesso!');
    
    // Mostrar status no console
    this.showStatus();
    
    return true;
  }

  /**
   * Mostrar status do sistema
   */
  showStatus() {
    console.log('\n📋 Status do Sistema:');
    console.log('   Dependências:', this.dependenciesLoaded ? '✅' : '❌');
    console.log('   Supabase:', this.supabaseReady ? '✅' : '❌');
    console.log('   Sistema:', this.initialized ? '✅' : '❌');
    
    if (window.chronosSupabase) {
      console.log('   Cliente Supabase: Disponível');
    }
    
    if (window.PONTO_APP) {
      console.log('   Aplicação Principal: Pronta');
    }
  }
}

// Criar instância global
window.SystemInitializer = new SystemInitializer();

// Função auxiliar para inicialização
window.initializePontoSystem = async () => {
  return await window.SystemInitializer.initialize();
};

// Executar inicialização automática quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await window.initializePontoSystem();
  });
} else {
  setTimeout(async () => {
    await window.initializePontoSystem();
  }, 100);
}

console.log('🔧 Sistema de inicialização carregado');