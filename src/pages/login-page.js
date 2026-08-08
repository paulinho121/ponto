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
    // Garantir que o botão de login esteja visível
    if (this.loginButton) {
      this.loginButton.style.display = 'flex';
      this.loginButton.disabled = false;
      
      // Remover qualquer listener anterior para evitar duplicatas
      this.loginButton.replaceWith(this.loginButton.cloneNode(true));
      this.loginButton = document.getElementById('loginBtn');
      
      // Adicionar listener para o clique no botão
      this.loginButton.addEventListener('click', (e) => this.handleSubmit(e));
    }
    
    if (!this.form) {
      logger.warn('Formulário de login não encontrado na página');
      // Se não encontrar o form, tentar usar os inputs diretamente
      this.setupDirectInputs();
      return;
    }

    // Adicionar listeners aos elementos
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Se os inputs existirem, adicionar listeners
    if (this.matriculaInput) {
      this.matriculaInput.addEventListener('input', () => this.handleInputChange());
    }
    if (this.senhaInput) {
      this.senhaInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.handleSubmit(e);
        }
      });
    }
    
    logger.info('Página de login inicializada');
  }
  
  setupDirectInputs() {
    // Configurar eventos diretamente nos inputs se o form não estiver disponível
    if (this.matriculaInput) {
      this.matriculaInput.addEventListener('input', () => this.handleInputChange());
    }
    if (this.senhaInput) {
      this.senhaInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.handleSubmit({ preventDefault: () => {} });
        }
      });
    }
  }

  /**
   * Manipular submissão do formulário
   */
  async handleSubmit(event) {
    // Verificar se é um evento verdadeiro ou um objeto simulado
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    
    // Obter valores dos inputs
    const matricula = this.matriculaInput?.value?.trim() || document.getElementById('matricula')?.value?.trim();
    const senha = this.senhaInput?.value?.trim() || document.getElementById('senha')?.value?.trim();
    
    if (!matricula || !senha) {
      chronos.showAlert('Por favor, preencha todos os campos.', 'error');
      return;
    }

    try {
      this.setLoading(true);
      
      // Verificar se o sistema legado está disponível
      if (window.ChronosState && typeof window.ChronosState.loginWithMatricula === 'function') {
        // Usar o sistema legado
        await window.ChronosState.loginWithMatricula(matricula, senha);
      } else if (typeof compatLogin === 'function') {
        // Usar a função de compatibilidade
        const result = await compatLogin(matricula, senha);
        logger.info('Login realizado com sucesso', { userId: result?.user?.id });
      } else {
        // Tentar usar o window.chronos se disponível
        if (window.chronos && typeof window.chronos.login === 'function') {
          await window.chronos.login(matricula, senha);
        } else {
          throw new Error('Sistema de login não disponível');
        }
      }
      
      // Redirecionar para a página principal
      this.redirectToMainPage();
      
    } catch (error) {
      logger.error('Erro no login', { error: error.message });
      chronos.showAlert(`Erro no login: ${error.message || 'Falha na autenticação'}`, 'error');
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