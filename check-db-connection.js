/**
 * Script de verificação da conexão com o banco de dados
 */
async function checkDatabaseConnection() {
  console.log('🔍 Verificando conexão com o banco de dados...');
  
  try {
    // Verificar se estamos no navegador
    if (typeof window === 'undefined') {
      console.log('⚠️ Este script deve ser executado no navegador');
      return false;
    }
    
    // Verificar se as configurações do Supabase estão disponíveis
    console.log('✅ Verificando configurações do Supabase...');
    
    if (window.CHRONOS_SUPABASE) {
      console.log('   URL do Supabase:', window.CHRONOS_SUPABASE.url ? '✓' : '✗');
      console.log('   Anon Key disponível:', window.CHRONOS_SUPABASE.anonKey ? '✓' : '✗');
    } else {
      console.log('❌ Configurações do Supabase não encontradas!');
      console.log('💡 Certifique-se de que o arquivo supabase-config.js está presente e corretamente configurado.');
      return false;
    }
    
    // Verificar se o cliente Supabase foi criado
    if (window.chronosSupabase) {
      console.log('✅ Cliente Supabase encontrado');
      
      // Testar uma operação simples no banco de dados
      try {
        console.log('🧪 Testando conexão com o banco de dados...');
        
        // Testar obtenção de sessão (operação leve)
        const { data: { session }, error: sessionError } = await window.chronosSupabase.auth.getSession();
        
        if (sessionError) {
          console.log('⚠️ Erro ao obter sessão:', sessionError.message);
        } else {
          console.log('✅ Conexão com o banco de dados: SUCESSO');
          console.log('   Sessão disponível:', !!session);
        }
        
        // Testar uma consulta simples à tabela profiles
        const { data: testData, error: testError } = await window.chronosSupabase
          .from('profiles')
          .select('id')
          .limit(1);
          
        if (testError) {
          console.log('⚠️ Erro ao consultar tabela profiles:', testError.message);
          console.log('💡 Isso pode indicar problemas com permissões RLS ou estrutura do banco');
        } else {
          console.log('✅ Consulta à tabela profiles: SUCESSO');
          console.log('   Registros encontrados:', testData?.length || 0);
        }
        
        return true;
        
      } catch (dbError) {
        console.log('❌ Erro ao conectar ao banco de dados:', dbError.message);
        return false;
      }
    } else {
      console.log('❌ Cliente Supabase não encontrado!');
      console.log('💡 Isso pode indicar que o main.js ainda não foi carregado ou houve erro na inicialização.');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Erro geral na verificação:', error.message);
    return false;
  }
}

// Executar verificação
if (typeof window !== 'undefined') {
  // Aguardar um pouco para garantir que os scripts estejam carregados
  window.addEventListener('load', () => {
    setTimeout(checkDatabaseConnection, 1000);
  });
}

export { checkDatabaseConnection };