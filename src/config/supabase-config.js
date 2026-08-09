/**
 * Configuração do Supabase
 * Este arquivo NÃO deve conter credenciais reais em produção
 */

// Verificar se as credenciais estão disponíveis no objeto global
let SUPABASE_URL = '';
let SUPABASE_ANON_KEY = '';

// Verificar se o objeto global com as credenciais existe
if (typeof window !== 'undefined' && window.CHRONOS_SUPABASE) {
  SUPABASE_URL = window.CHRONOS_SUPABASE.url || '';
  SUPABASE_ANON_KEY = window.CHRONOS_SUPABASE.anonKey || '';
} else {
  // Para desenvolvimento local
  SUPABASE_URL = process.env.SUPABASE_URL || '';
  SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };