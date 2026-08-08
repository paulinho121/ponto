/**
 * Legacy Compatibility Layer
 * Camada de compatibilidade para o antigo chronos.js
 * Permite migração gradual mantendo funcionalidades existentes
 */

import { app } from '../core/application.js';
import { Formatters } from '../utils/formatters.js';

// Funções de compatibilidade para manter o código antigo funcionando
export class ChronosCompat {
  constructor() {
    this.app = app;
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
   * Registrar ponto genérico compatível
   */
  async registrarPonto(tipo) {
    try {
      const result = await this.app.getService('point').registerPunch(tipo);
      return result;
    } catch (error) {
      console.error(`Erro ao registrar ${tipo} (compat):`, error);
      throw error;
    }
  }

  /**
   * Obter registros de ponto compatível
   */
  async getRegistros(mes = null, ano = null) {
    try {
      let records;
      if (mes && ano) {
        records = await this.app.getService('point').getRecordsByMonth(mes, ano);
      } else {
        records = await this.app.getService('point').getRecords();
      }

      // Formatar registros para manter compatibilidade
      return records.map(record => ({
        ...record,
        formattedDate: Formatters.date.toDisplay(record.data),
        formattedEntrada: Formatters.time.toDisplay(record.entrada),
        formattedSaida: Formatters.time.toDisplay(record.saida),
        formattedAlmoco: Formatters.time.toDisplay(record.almoco),
        formattedRetorno: Formatters.time.toDisplay(record.retorno),
        duration: this.app.getService('point').calculateDayDuration(record)
      }));
  /**
   * Obter localização atual compatível
   */
  async obterLocalizacaoAtual() {
    try {
      const locationService = this.app.getService('location');
      const position = await locationService.getCurrentPosition();
      return {
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy
      };
    } catch (error) {
      console.error('Erro ao obter localização (compat):', error);
      throw error;
    }
  }

  /**
   * Obter estado atual compatível
   */
  getEstadoAtual() {
    return this.app.getState();
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