/**
 * Script de diagnóstico rápido para problemas com pontos e banco de dados
 */

class QuickDiagnoser {
  constructor() {
    this.results = {};
  }

  /**
   * Diagnóstico rápido do sistema
   */
  async diagnose() {
    console.log('🔍 Iniciando diagnóstico rápido...');
    
    // Verificar conexão com o banco
    this.results.database = await this.checkDatabaseConnection();
    
    // Verificar autenticação
    this.results.auth = await this.checkAuthentication();
    
    // Verificar estado da aplicação
    this.results.appState = this.checkApplicationState();
    
    // Verificar serviços disponíveis
    this.results.services = this.checkAvailableServices();
    
    this.printQuickDiagnostic();
    return this.results;
  }

  /**
   * Verificar conexão com o banco de dados
   */
  async checkDatabaseConnection() {
    try {
      if (!window.chronosSupabase) {
        console.log('❌ Cliente Supabase não encontrado');
        return { connected: false, error: 'Cliente Supabase não inicializado' };
      }

      // Testar uma operação simples
      const { error } = await window.chronosSupabase.from('profiles').select('id').limit(1);
      
      if (error) {
        console.log('❌ Erro na conexão com o banco:', error.message);
        return { connected: false, error: error.message };
      }
      
      console.log('✅ Conexão com o banco de dados: OK');
      return { connected: true, error: null };
    } catch (error) {
      console.log('❌ Erro ao verificar conexão com o banco:', error.message);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Verificar autenticação
   */
  async checkAuthentication() {
    try {
      if (!window.chronosSupabase) {
        return { authenticated: false, error: 'Cliente Supabase não disponível' };
      }

      const { data: { session }, error } = await window.chronosSupabase.auth.getSession();
      
      if (error) {
        console.log('⚠️ Erro ao obter sessão:', error.message);
        return { authenticated: false, error: error.message, hasSession: false };
      }

      const isAuthenticated = !!session;
      console.log(isAuthenticated ? '✅ Autenticação: OK' : '⚠️ Sem sessão ativa');
      
      return { 
        authenticated: isAuthenticated, 
        error: null, 
        hasSession: !!session,
        userId: session?.user?.id || null
      };
    } catch (error) {
      console.log('❌ Erro ao verificar autenticação:', error.message);
      return { authenticated: false, error: error.message, hasSession: false };
    }
  }

  /**
   * Verificar estado da aplicação
   */
  checkApplicationState() {
    const hasApp = !!window.PONTO_APP;
    const isReady = hasApp && window.PONTO_APP.isReady && window.PONTO_APP.isReady();
    
    console.log(hasApp ? '✅ Aplicação principal: Carregada' : '⚠️ Aplicação principal: Não carregada');
    console.log(isReady ? '✅ Aplicação pronta: Sim' : '⚠️ Aplicação pronta: Não');
    
    return {
      hasApp,
      isReady,
      stateManager: !!window.PONTO_APP?.stateManager,
      authService: !!window.PONTO_APP?.authService,
      pointService: !!window.PONTO_APP?.pointService
    };
  }

  /**
   * Verificar serviços disponíveis
   */
  checkAvailableServices() {
    const services = {
      authService: null,
      pointService: null,
      locationService: null
    };

    if (window.PONTO_APP) {
      try {
        services.authService = !!window.PONTO_APP.getService('auth');
        services.pointService = !!window.PONTO_APP.getService('point');
        services.locationService = !!window.PONTO_APP.getService('location');
      } catch (error) {
        console.log('⚠️ Erro ao verificar serviços:', error.message);
      }
    }

    console.log('Servidor de autenticação:', services.authService ? '✅' : '❌');
    console.log('Servidor de pontos:', services.pointService ? '✅' : '❌');
    console.log('Servidor de localização:', services.locationService ? '✅' : '❌');

    return services;
  }

  /**
   * Imprimir relatório de diagnóstico rápido
   */
  printQuickDiagnostic() {
    console.log('\n📋 DIAGNÓSTICO RÁPIDO');
    console.log('====================');
    
    console.log('📦 Banco de Dados:', this.results.database.connected ? '✅' : '❌');
    console.log('🔒 Autenticação:', this.results.auth.authenticated ? '✅' : '❌');
    console.log('⚙️ Aplicação:', this.results.appState.isReady ? '✅' : '❌');
    console.log('🛠️ Serviços prontos:', 
      this.results.services.authService && 
      this.results.services.pointService ? '✅' : '❌');
    
    console.log('====================');
  }
}

// Criar instância global
window.QuickDiagnoser = new QuickDiagnoser();

// Função para rodar diagnóstico
window.runQuickDiagnosis = async () => {
  return await window.QuickDiagnoser.diagnose();
};

console.log('🔧 Sistema de diagnóstico rápido carregado');
console.log('Use window.runQuickDiagnosis() para rodar o diagnóstico');