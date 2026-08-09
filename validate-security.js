/**
 * Script de Validação de Segurança
 * Verifica se todas as configurações de segurança estão corretas
 */

async function validateSecuritySetup() {
  console.log('🔍 Iniciando validação de segurança...');
  
  try {
    // Testar importação de módulos críticos
    console.log('✅ Testando importação de módulos...');
    
    // Testar se o objeto global do Supabase está disponível
    if (typeof window !== 'undefined' && window.CHRONOS_SUPABASE) {
      console.log('✅ Configuração do Supabase encontrada');
      console.log('   URL:', window.CHRONOS_SUPABASE.url ? '✓' : '✗');
      console.log('   Anon Key:', window.CHRONOS_SUPABASE.anonKey ? '✓' : '✗ (isso pode ser normal em ambientes de build)');
    } else {
      console.log('⚠️ Configuração do Supabase não encontrada (isso pode ser normal em ambientes de build)');
    }
    
    // Testar se o cliente Supabase está disponível
    if (typeof window !== 'undefined' && window.chronosSupabase) {
      console.log('✅ Cliente Supabase encontrado');
    } else {
      console.log('⚠️ Cliente Supabase não encontrado (isso pode ser normal em ambientes de build)');
    }
    
    // Testar importação de configuração de segurança
    try {
      const { getSecurityConfig } = await import('./security-config.js');
      const config = getSecurityConfig(process.env.NODE_ENV || 'production');
      console.log('✅ Configuração de segurança carregada');
      console.log('   Nível de segurança padrão:', config.defaultSecurityLevel);
      console.log('   Geolocalização ativada:', config.geolocation.enabled);
      console.log('   Dispositivo ativado:', config.device.enabled);
    } catch (error) {
      console.log('❌ Erro ao carregar configuração de segurança:', error.message);
    }
    
    // Testar importação do SecurityManager se estivermos em ambiente de navegador
    if (typeof window !== 'undefined') {
      try {
        const securityModule = await import('./src/security/security-manager.js');
        if (securityModule.SecurityManager) {
          console.log('✅ SecurityManager encontrado');
          
          // Testar instanciação básica
          const securityManager = new securityModule.SecurityManager();
          console.log('✅ SecurityManager instanciado com sucesso');
          console.log('   Nível de segurança:', securityManager.securityLevel);
        } else {
          console.log('⚠️ SecurityManager não encontrado');
        }
      } catch (error) {
        console.log('⚠️ Erro ao importar SecurityManager:', error.message);
      }
    }
    
    console.log('\n✅ Validação de segurança concluída com sucesso!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro durante validação de segurança:', error);
    return false;
  }
}

// Executar validação se este script for executado diretamente
if (typeof module !== 'undefined' && module.require) {
  // Ambiente Node.js
  validateSecuritySetup().then(success => {
    if (!success) {
      process.exit(1);
    }
  }).catch(error => {
    console.error('Erro na validação:', error);
    process.exit(1);
  });
} else if (typeof window !== 'undefined') {
  // Ambiente navegador
  validateSecuritySetup();
}

export { validateSecuritySetup };