/**
 * Login Page Module
 * Componente específico para a página de login
 */

import { app } from '../core/application.js';
import { chronos, login as compatLogin } from '../legacy/chronos-compat.js';
import { Formatters } from '../utils/formatters.js';
import { logger } from '../utils/logger.js';

class LoginPage {
  constructor() {
    this.form = document.getElementById('loginForm');
    this.matriculaInput = document.getElementById('matricula');
    this.senhaInput = document.getElementById('senha');
    this.loginButton = document.getElementById('loginBtn');
    this.loadingSpinner = document.getElementById('loadingSpinner');
    
    this.init();
  }

  init() {
    if (!this.form) {
      logger.warn('Formulário de login não encontrado na página');
      return;
    }

    // Adicionar listeners aos elementos
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Se os inputs existirem, adicionar listeners
    if (this.matriculaInput) {
      this.matriculaInput.addEventListener('input', () => this.handleInputChange());
    }
    if (this.senhaInput) {
      this.senhaInput.addEventListener('input', () => this.handleInputChange());
    }
    
    logger.info('Página de login inicializada');
  }

  /**
   * Manipular submissão do formulário
   */
  async handleSubmit(event) {
    event.preventDefault();
    
    const matricula = this.matriculaInput?.value.trim();
    const senha = this.senhaInput?.value.trim();
    
    if (!matricula || !senha) {
      chronos.showAlert('Por favor, preencha todos os campos.', 'error');
      return;
    }

    try {
      this.setLoading(true);
      
      // Usar a função de compatibilidade para manter consistência
      const result = await compatLogin(matricula, senha);
      
      logger.info('Login realizado com sucesso', { userId: result.user.id });
      
      // Redirecionar para a página principal
      this.redirectToMainPage();
      
    } catch (error) {
      logger.error('Erro no login', { error: error.message });
      chronos.showAlert(`Erro no login: ${error.message}`, 'error');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Manipular mudança nos inputs
   */
  handleInputChange() {
    const matricula = this.matriculaInput?.value.trim();
    const senha = this.senhaInput?.value.trim();
    
    // Validar campos
    const isFormValid = matricula && senha && matricula.length >= 6 && senha.length >= 6;
    
    if (this.loginButton) {
      this.loginButton.disabled = !isFormValid;
    }
  }

  /**
   * Definir estado de loading
   */
  setLoading(loading) {
    if (this.loginButton) {
      this.loginButton.disabled = loading;
      this.loginButton.textContent = loading ? 'Entrando...' : 'Entrar';
    }
    
    if (this.loadingSpinner) {
      this.loadingSpinner.style.display = loading ? 'inline-block' : 'none';
    }
    
    chronos.showLoading(loading);
  }

  /**
   * Redirecionar para página principal
   */
  redirectToMainPage() {
    // Determinar página de destino com base nas permissões do usuário
    const userIsAdmin = chronos.ehAdmin();
    const destination = userIsAdmin ? 'admin.html' : 'ponto.html';
    
    logger.info('Redirecionando para', { destination });
    
    setTimeout(() => {
      window.location.href = destination;
    }, 500);
  }
}

// Inicializar componente quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
  });
} else {
  new LoginPage();
}

// Exportar para possível uso em outros módulos
export default LoginPage;