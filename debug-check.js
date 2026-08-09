/**
 * Script de depuração para verificar a inicialização dos componentes
 */
console.log('=== Verificação de inicialização ===');

// Verificar se os objetos globais estão disponíveis
console.log('window.CHRONOS_SUPABASE:', typeof window.CHRONOS_SUPABASE !== 'undefined' ? '✓' : '✗');
console.log('window.chronosSupabase:', typeof window.chronosSupabase !== 'undefined' ? '✓' : '✗');
console.log('window.ChronosState:', typeof window.ChronosState !== 'undefined' ? '✓' : '✗');
console.log('window.chronos:', typeof window.chronos !== 'undefined' ? '✓' : '✗');
console.log('window.PONTO_APP:', typeof window.PONTO_APP !== 'undefined' ? '✓' : '✗');

// Verificar se o botão de login está presente
const loginButton = document.getElementById('loginBtn');
console.log('Botão de login encontrado:', loginButton ? '✓' : '✗');

if (loginButton) {
  console.log('Estilo do botão:', {
    display: loginButton.style.display,
    visibility: loginButton.style.visibility,
    disabled: loginButton.disabled
  });
}

// Verificar se os inputs estão presentes
const matriculaInput = document.getElementById('matricula');
const senhaInput = document.getElementById('senha');
console.log('Inputs encontrados:', {
  matricula: !!matriculaInput,
  senha: !!senhaInput
});

console.log('=== Fim da verificação ===');