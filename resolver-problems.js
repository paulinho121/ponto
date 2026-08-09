/**
 * Script de resolução de problemas para o sistema de pontos
 */

class ProblemResolver {
  constructor() {
    this.diagnoser = window.QuickDiagnoser || new QuickDiagnoser();
  }

  /**
   * Resolver problemas comuns
   */
  async resolveCommonIssues() {
    console.log('\n🔧 Tentando resolver problemas comuns...');
    
    // Diagnosticar primeiro
    await this.diagnoser.diagnose();
    
    const results = this.diagnoser.results;
    let resolved = true;
    
    // Verificar problemas críticos
    if (!results.database.connected) {
      console.log('⚠️ Problema crítico: Banco de dados desconectado');
      // O banco já foi verificado no diagnóstico
    }
    
    if (!results.appState.isReady && window.chronosSupabase) {
      console.log('🔄 Tentando reiniciar a aplicação...');
      try {
        if (window.PONTO_APP) {
          await window.PONTO_APP.restart(window.chronosSupabase);
          console.log('✅ Aplicação reiniciada com sucesso');
        }
      } catch (error) {
        console.log('❌ Falha ao reiniciar aplicação:', error.message);
        resolved = false;
      }
    }
    
    // Verificar se temos o serviço de compatibilidade
    if (typeof window.chronos === 'undefined') {
      console.log('🔄 Tentando carregar sistema de compatibilidade...');
      try {
        // Tenta carregar o sistema de compatibilidade
        const compatScript = document.createElement('script');
        compatScript.type = 'module';
        compatScript.textContent = `
          import { chronos } from './src/legacy/chronos-compat.js';
          window.chronos = chronos;
          console.log('✅ Sistema de compatibilidade carregado');
        `;
        document.head.appendChild(compatScript);
      } catch (error) {
        console.log('⚠️ Não foi possível carregar sistema de compatibilidade:', error.message);
      }
    }
    
    // Rodar diagnóstico novamente
    console.log('\n🔍 Verificando status após tentativa de resolução...');
    await this.diagnoser.diagnose();
    
    const finalStatus = this.diagnoser.results.database.connected && 
                       this.diagnoser.results.appState.isReady;
    
    if (finalStatus) {
      console.log('✅ Problemas resolvidos! O sistema está funcionando corretamente.');
    } else {
      console.log('⚠️ Alguns problemas ainda persistem. Verifique o console para detalhes.');
    }
    
    return finalStatus;
  }
}

// Criar instância global
window.ProblemResolver = new ProblemResolver();

// Função para resolver problemas
window.resolvePointsIssues = async () => {
  return await window.ProblemResolver.resolveCommonIssues();
};

console.log('🔧 Sistema de resolução de problemas carregado');
console.log('Use window.resolvePointsIssues() para tentar resolver problemas');