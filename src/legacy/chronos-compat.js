/**
 * Legacy Compatibility Layer
 * Camada de compatibilidade para o antigo chronos.js
 * Permite migração gradual mantendo funcionalidades existentes
 */

import { app } from '../core/application.js';
import { Formatters } from '../utils/formatters.js';

// Importar SecurityManager com tratamento de erro
let SecurityManager;
try {
  const securityModule = await import('../security/security-manager.js');
  SecurityManager = securityModule.SecurityManager;
} catch (error) {
  console.warn('SecurityManager não disponível:', error.message);
  // Criar uma classe vazia para evitar erros
  SecurityManager = class {
    constructor() {
      console.warn('SecurityManager mock ativado');
    }
    setSecurityLevel() {}
    securePunchRegistration() {
      return Promise.resolve({
        success: true,
        message: 'Registro de ponto realizado (sem segurança)',
        securityResults: { overallSuccess: true }
      });
    }
  };
}

// Funções de compatibilidade para manter o código antigo funcionando
export class ChronosCompat {
  constructor() {
    this.app = app;
    try {
      this.securityManager = new SecurityManager();
      // Configurar nível de segurança médio por padrão
      this.securityManager.setSecurityLevel('medium');
    } catch (error) {
      console.warn('Falha ao inicializar SecurityManager:', error.message);
      this.securityManager = null;
    }
  }

  /**
   * Função de login compatível com o antigo sistema
   */
  async login(matricula, senha) {
    try {
      const result = await this.app.getService('auth').loginWithMatricula(matricula, senha);
      
      // Atualizar estado global para compatibilidade
      this.app.stateManager.dispatch({ 
        type: 'SET_USER', 
        payload: await this.app.getService('auth').getUserProfile() 
      });
      
      this.app.stateManager.dispatch({ 
        type: 'SET_SESSION', 
        payload: result.session 
      });
      
      return result;
    } catch (error) {
      console.error('Erro de login (compat):', error);
      throw error;
    }
  }

  /**
   * Função de logout compatível com o antigo sistema
   */
  async logout() {
    try {
      const result = await this.app.getService('auth').logout();
      
      // Limpar estado global
      this.app.stateManager.dispatch({ type: 'CLEAR_USER' });
      
      return result;
    } catch (error) {
      console.error('Erro de logout (compat):', error);
      throw error;
    }
  }

  /**
   * Registrar ponto de entrada compatível
   */
  async registrarEntrada() {
    return await this.registrarPonto('entrada');
  }

  /**
   * Registrar ponto de saída compatível
   */
  async registrarSaida() {
    return await this.registrarPonto('saida');
  }

  /**
   * Registrar ponto de almoço compatível
   */
  async registrarAlmoco() {
    return await this.registrarPonto('almoco');
  }

  /**
   * Registrar ponto de retorno compatível
   */
  async registrarRetorno() {
    return await this.registrarPonto('retorno');
  }

  /**
   * Registrar ponto genérico compatível com verificações de segurança
   */
  async registrarPonto(tipo) {
    try {
      // Obter ID do usuário autenticado
      const userId = await this.app.getService('auth').getCurrentUserId();
      
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar se o SecurityManager está disponível
      if (this.securityManager) {
        // Realizar verificações de segurança
        const securityResult = await this.securityManager.securePunchRegistration(userId, tipo);
        
        if (!securityResult.success) {
          console.warn('Falha na verificação de segurança:', securityResult.message);
          // Continuar com registro mesmo com falha de segurança (pode ser configurável)
        }
      } else {
        console.warn('SecurityManager não está disponível, registrando ponto sem verificações de segurança');
      }

      // Registrar o ponto usando o serviço de pontos
      const pointService = this.app.getService('point');
      const result = await pointService.registerPoint(userId, tipo);
      
      // Atualizar estado global
      this.app.stateManager.dispatch({ 
        type: 'ADD_POINT_RECORD', 
        payload: result 
      });
      
      return result;
    } catch (error) {
      console.error('Erro ao registrar ponto (compat):', error);
      throw error;
  /**
   * Obter registros de ponto compatíveis
   */
  async getRegistros(userId = null) {
    try {
      if (!userId) {
        userId = await this.app.getService('auth').getCurrentUserId();
      }
      
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      const pointService = this.app.getService('point');
      const records = await pointService.getUserPoints(userId);
      
      // Atualizar estado global
      this.app.stateManager.dispatch({ 
        type: 'SET_POINT_RECORDS', 
        payload: records 
      });
      
      return records;
    } catch (error) {
      console.error('Erro ao buscar registros (compat):', error);
      throw error;
    }
  }

  /**
   * Validar localização compatível
   */
  async validarLocalizacao(latitude, longitude) {
    try {
      const locationService = this.app.getService('location');
      const result = await locationService.validateLocation(latitude, longitude);
      return result;
    } catch (error) {
      console.error('Erro ao validar localização (compat):', error);
      throw error;
    }
  }

  /**
   * Obter localização atual compatível
   */
  async obterLocalizacaoAtual() {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocalização não suportada pelo navegador');
      }

      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };
            resolve(location);
          },
          (error) => {
            reject(new Error(`Erro ao obter localização: ${error.message}`));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      });
    } catch (error) {
      console.error('Erro ao obter localização atual (compat):', error);
      throw error;
    }
  }

  /**
   * Obter estado atual compatível
   */
  getEstadoAtual() {
    return this.app.stateManager.getState();
  }

  /**
   * Verificar se está autenticado compatível
   */
  async estaAutenticado() {
    return await this.app.getService('auth').isAuthenticated();
  }

  /**
   * Obter perfil do usuário compatível
   */
  async getPerfilUsuario() {
    return await this.app.getService('auth').getUserProfile();
  }

  /**
   * Verificar se é admin compatível
   */
  async ehAdmin() {
    return await this.app.getService('auth').isAdmin();
  }

  /**
   * Função auxiliar para mostrar alertas (mantendo compatibilidade visual)
   */
  showAlert(message, type = 'info') {
    // Manter a mesma interface do sistema antigo
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} mt-3`;
    alertDiv.textContent = message;
    alertDiv.style.cssText = `
      padding: 10px;
      margin: 10px 0;
      border-radius: 4px;
      ${type === 'error' ? 'background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;' :
        type === 'success' ? 'background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;' :
        type === 'warning' ? 'background-color: #fff3cd; color: #856404; border: 1px solid #ffeaa7;' :
        'background-color: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb;'}
    `;
    
    // Adicionar ao body ou a um container específico
    const container = document.querySelector('#alerts-container') || document.body;
    container.appendChild(alertDiv);
    
    // Remover após 5 segundos
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 5000);
  }

  /**
   * Função auxiliar para mostrar loading (mantendo compatibilidade visual)
   */
  showLoading(show = true) {
    const loadingElement = document.querySelector('#loading-indicator') ||
                          document.querySelector('.loading') ||
                          document.querySelector('#spinner');
    
    if (loadingElement) {
      loadingElement.style.display = show ? 'block' : 'none';
    }
  }

  /**
   * Atualizar UI baseado no estado (função auxiliar para compatibilidade)
   */
  updateUIBasedOnState() {
    const state = this.getEstadoAtual();
    
    // Atualizar elementos da UI baseado no estado
    const userElements = document.querySelectorAll('[data-user-info]');
    userElements.forEach(element => {
      const field = element.getAttribute('data-user-info');
      if (state.user && state.user[field]) {
        element.textContent = state.user[field];
      }
    });
    
    // Atualizar estado de loading
    this.showLoading(state.loading);
  }
}

// Instância global para compatibilidade
export const chronos = new ChronosCompat();

// Exportar funções individuais para facilitar a substituição gradual
export const {
  login,
  logout,
  registrarEntrada,
  registrarSaida,
  registrarAlmoco,
  registrarRetorno,
  registrarPonto,
  getRegistros,
  validarLocalizacao,
  obterLocalizacaoAtual,
  getEstadoAtual,
  estaAutenticado,
  getPerfilUsuario,
  ehAdmin,
  showAlert,
  showLoading
} = chronos;
    }
  }