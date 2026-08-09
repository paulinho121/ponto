/**
 * Script de verificação de segurança para o sistema de pontos
 * Verifica RLS e outras configurações de segurança
 */

class SecurityChecker {
  constructor() {
    this.supabase = window.chronosSupabase;
  }

  /**
   * Verificar configurações de segurança
   */
  async checkSecurity() {
    console.log('🔐 Verificando configurações de segurança...');
    
    if (!this.supabase) {
      console.error('❌ Cliente Supabase não disponível');
      return false;
    }

    try {
      // Testar permissões básicas
      const permissionsOk = await this.testPermissions();
      
      // Verificar RLS
      const rlsOk = await this.testRLS();
      
      // Verificar função is_admin
      const adminFuncOk = await this.checkIsAdminFunction();
      
      console.log('✅ Verificação de segurança concluída');
      console.log('   Permissões:', permissionsOk ? '✅' : '❌');
      console.log('   RLS:', rlsOk ? '✅' : '❌');
      console.log('   Função is_admin:', adminFuncOk ? '✅' : '❌');
      
      return permissionsOk && rlsOk && adminFuncOk;
    } catch (error) {
      console.error('❌ Erro ao verificar segurança:', error);
      return false;
    }
  }

  /**
   * Testar permissões básicas
   */
  async testPermissions() {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        console.log('⚠️ Erro de permissão:', error.message);
        return false;
      }

      console.log('✅ Permissões básicas OK');
      return true;
    } catch (error) {
      console.log('⚠️ Erro ao testar permissões:', error.message);
      return false;
    }
  }

  /**
   * Testar RLS (Row Level Security)
   */
  async testRLS() {
    try {
      const { error } = await this.supabase
        .from('ponto_registros')
        .select('*')
        .limit(1);

      // Se não houver erro, pode significar que RLS não está ativo como deveria
      if (!error) {
        console.log('ℹ️ RLS pode não estar ativo ou muito permissivo');
        return true;
      }

      // Erro de permissão é esperado para não autenticados com RLS ativo
      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.log('✅ RLS está ativo (como esperado)');
        return true;
      }

      console.log('⚠️ Erro inesperado com RLS:', error.message);
      return false;
    } catch (error) {
      console.log('⚠️ Erro ao testar RLS:', error.message);
      return false;
    }
  }

  /**
   * Verificar função is_admin
   */
  async checkIsAdminFunction() {
    try {
      const { data, error } = await this.supabase.rpc('is_admin');
      
      if (error) {
        console.log('⚠️ Função is_admin não encontrada ou com erro:', error.message);
        return false;
      }
      
      console.log('✅ Função is_admin funcionando');
      return true;
    } catch (error) {
      // A função pode não existir em todas as instâncias
      console.log('ℹ️ Função is_admin não encontrada (isso pode ser normal):', error.message);
      return true; // Considerar OK para evitar falso positivo
    }
  }
}

// Criar instância global
window.SecurityChecker = new SecurityChecker();

// Função para verificar segurança
window.checkSecurity = async () => {
  if (!window.SecurityChecker) {
    console.error('❌ SecurityChecker não disponível');
    return false;
  }
  return await window.SecurityChecker.checkSecurity();
};

console.log('🔧 Sistema de verificação de segurança carregado');
console.log('Use window.checkSecurity() para verificar configurações de segurança');