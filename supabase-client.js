/**
 * supabase-client.js — Inicialização do client Supabase
 *
 * Requer, nesta ordem, nos <script> da página:
 *   1. supabase-js (CDN)
 *   2. supabase-config.js
 *   3. este arquivo
 *
 * Expõe window.chronosSupabase (ou null se a config estiver ausente,
 * caso em que o app continua funcionando em modo local via localStorage).
 */
window.chronosSupabase = null;

(function () {
  if (typeof window.CHRONOS_SUPABASE === 'undefined') {
    console.warn(
      '[Chronos] supabase-config.js não encontrado. ' +
      'Copie supabase-config.example.js para supabase-config.js e preencha as credenciais. ' +
      'O app segue em modo local (localStorage).'
    );
    return;
  }
  if (typeof window.supabase === 'undefined') {
    console.warn('[Chronos] Biblioteca supabase-js não carregou (verifique a internet). Modo local ativo.');
    return;
  }
  window.chronosSupabase = window.supabase.createClient(
    window.CHRONOS_SUPABASE.url,
    window.CHRONOS_SUPABASE.anonKey
  );
})();
