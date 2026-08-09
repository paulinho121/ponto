/**
 * Ponto Page Module
 * Componente específico para a página de registro de ponto
 */

import { app } from '../core/application.js';
import { chronos, registrarEntrada, registrarSaida, registrarAlmoco, registrarRetorno, getPerfilUsuario } from '../legacy/chronos-compat.js';
import { Formatters } from '../utils/formatters.js';
import { logger } from '../utils/logger.js';

class PontoPage {
  constructor() {
    this.estadoAtual = null;
    this.usuario = null;
    
    this.entradaBtn = document.getElementById('entradaBtn');
    this.almocoBtn = document.getElementById('almocoBtn');
    this.retornoBtn = document.getElementById('retornoBtn');
    this.saidaBtn = document.getElementById('saidaBtn');
    
    this.userInfoDiv = document.getElementById('userInfo');
    this.currentDateTimeDiv = document.getElementById('currentDateTime');
    
    this.init();
  }

  async init() {
    try {
      // Verificar autenticação
      const autenticado = await chronos.estaAutenticado();
      if (!autenticado) {
        window.location.href = 'index.html';
        return;
      }

      // Obter informações do usuário
      this.usuario = await getPerfilUsuario();
      
      // Atualizar UI com informações do usuário
      this.updateUserInfo();
      
      // Configurar botões
      this.setupButtons();
      
      // Iniciar atualização de tempo real
      this.startRealTimeUpdates();
      
      // Carregar estado atual
      this.loadCurrentState();
      
      logger.info('Página de ponto inicializada');
    } catch (error) {
      logger.error('Erro ao inicializar página de ponto', { error: error.message });
      chronos.showAlert('Erro ao carregar página de ponto', 'error');
    }
  }

  /**
   * Configurar botões de registro
   */
  setupButtons() {
    if (this.entradaBtn) {
      this.entradaBtn.addEventListener('click', () => this.registrarEntrada());
    }
    if (this.almocoBtn) {
      this.almocoBtn.addEventListener('click', () => this.registrarAlmoco());
    }
    if (this.retornoBtn) {
      this.retornoBtn.addEventListener('click', () => this.registrarRetorno());
    }
    if (this.saidaBtn) {
      this.saidaBtn.addEventListener('click', () => this.registrarSaida());
    }
  }

  /**
   * Atualizar informações do usuário na UI
   */
  updateUserInfo() {
    if (this.usuario && this.userInfoDiv) {
      this.userInfoDiv.innerHTML = `
        <div class="user-info-card">
          <h3>${this.usuario.nome}</h3>
          <p>Matrícula: ${this.usuario.matricula}</p>
          <p>Categoria: ${this.usuario.categoria}</p>
          <p>Carga Horária: ${this.usuario.cargaHoras}h</p>
        </div>
      `;
    }
  }

  /**
   * Iniciar atualizações de tempo real
   */
  startRealTimeUpdates() {
    // Atualizar data e hora a cada segundo
    setInterval(() => {
      if (this.currentDateTimeDiv) {
        this.currentDateTimeDiv.textContent = new Date().toLocaleString('pt-BR', {
          dateStyle: 'full',
          timeStyle: 'short'
        });
      }
    }, 1000);

    // Atualizar estado a cada 30 segundos
    setInterval(() => {
      this.loadCurrentState();
    }, 30000);
  }

  /**
   * Carregar estado atual
   */
  async loadCurrentState() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const records = await chronos.getRegistros();
      this.estadoAtual = records.find(r => r.data === today) || {};
      
      // Atualizar estados dos botões
      this.updateButtonStates();
    } catch (error) {
      logger.error('Erro ao carregar estado atual', { error: error.message });
    }
  }

  /**
   * Atualizar estados dos botões
   */
  updateButtonStates() {
    if (!this.estadoAtual) return;

    // Desabilitar botões que já foram pressionados hoje
    if (this.estadoAtual.entrada) {
      this.enableButton(this.entradaBtn, false, 'Registrado');
    } else {
      this.enableButton(this.entradaBtn, true, 'Registrar Entrada');
    }

    if (this.estadoAtual.almoco) {
      this.enableButton(this.almocoBtn, false, 'Registrado');
    } else if (this.estadoAtual.entrada) {
      this.enableButton(this.almocoBtn, true, 'Registrar Almoço');
    } else {
      this.enableButton(this.almocoBtn, false, 'Entre primeiro');
    }
  /**
   * Registrar entrada
   */
  async registrarEntrada() {
    try {
      chronos.showLoading(true);
      
      // Validar localização primeiro
      await this.validateLocation();
      
      const result = await registrarEntrada();
      
      logger.info('Entrada registrada com sucesso', { recordId: result.id });
      chronos.showAlert('Entrada registrada com sucesso!', 'success');
      
      // Atualizar estado
      await this.loadCurrentState();
      
    } catch (error) {
      logger.error('Erro ao registrar entrada', { error: error.message });
      chronos.showAlert(`Erro ao registrar entrada: ${error.message}`, 'error');
    } finally {
      chronos.showLoading(false);
    }
  }

  /**
   * Registrar almoço
   */
  async registrarAlmoco() {
    try {
      chronos.showLoading(true);
      
      // Validar localização primeiro
      await this.validateLocation();
      
      const result = await registrarAlmoco();
      
      logger.info('Almoço registrado com sucesso', { recordId: result.id });
      chronos.showAlert('Almoço registrado com sucesso!', 'success');
      
      // Atualizar estado
      await this.loadCurrentState();
      
    } catch (error) {
      logger.error('Erro ao registrar almoço', { error: error.message });
      chronos.showAlert(`Erro ao registrar almoço: ${error.message}`, 'error');
    } finally {
      chronos.showLoading(false);
    }
  }

  /**
   * Registrar retorno
   */
  async registrarRetorno() {
    try {
      chronos.showLoading(true);
      
      // Validar localização primeiro
      await this.validateLocation();
      
      const result = await registrarRetorno();
      
      logger.info('Retorno registrado com sucesso', { recordId: result.id });
      chronos.showAlert('Retorno registrado com sucesso!', 'success');
      
      // Atualizar estado
      await this.loadCurrentState();
      
    } catch (error) {
      logger.error('Erro ao registrar retorno', { error: error.message });
      chronos.showAlert(`Erro ao registrar retorno: ${error.message}`, 'error');
    } finally {
      chronos.showLoading(false);
    }
  }

  /**
   * Registrar saída
   */
  async registrarSaida() {
    try {
      chronos.showLoading(true);
      
      // Validar localização primeiro
      await this.validateLocation();
      
      const result = await registrarSaida();
      
      logger.info('Saída registrada com sucesso', { recordId: result.id });
      chronos.showAlert('Saída registrada com sucesso!', 'success');
      
      // Atualizar estado
      await this.loadCurrentState();
      
    } catch (error) {
      logger.error('Erro ao registrar saída', { error: error.message });
      chronos.showAlert(`Erro ao registrar saída: ${error.message}`, 'error');
    } finally {
      chronos.showLoading(false);
    }
  }

  /**
   * Validar localização do usuário
   */
  async validateLocation() {
    if (!navigator.geolocation) {
      throw new Error('Geolocalização não suportada pelo navegador');
    }

    try {
      const position = await chronos.obterLocalizacaoAtual();
      const validation = await chronos.validarLocalizacao(
        position.latitude, 
        position.longitude
      );

      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      logger.info('Localização validada com sucesso', {
        location: validation.location.nome,
        distance: Math.round(validation.distance) + 'm'
      });

      return validation;
    } catch (error) {
      logger.error('Erro na validação de localização', { error: error.message });
      throw error;
    }
  }
}

// Inicializar componente quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    new PontoPage();
  });
} else {
  new PontoPage();
}

// Exportar para possível uso em outros módulos
export default PontoPage;

    if (this.estadoAtual.retorno) {
      this.enableButton(this.retornoBtn, false, 'Registrado');
    } else if (this.estadoAtual.almoco) {
      this.enableButton(this.retornoBtn, true, 'Registrar Retorno');
    } else {
      this.enableButton(this.retornoBtn, false, 'Almoce primeiro');
    }

    if (this.estadoAtual.saida) {
      this.enableButton(this.saidaBtn, false, 'Registrado');
    } else if (this.estadoAtual.retorno || (this.estadoAtual.entrada && !this.estadoAtual.almoco)) {
      this.enableButton(this.saidaBtn, true, 'Registrar Saída');
    } else {
      this.enableButton(this.saidaBtn, false, 'Entre primeiro');
    }
  }

  /**
   * Habilitar/desabilitar botão
   */
  enableButton(button, enabled, text) {
    if (!button) return;
    
    button.disabled = !enabled;
    button.textContent = text;
    
    if (enabled) {
      button.classList.remove('btn-disabled');
      button.classList.add('btn-primary');
    } else {
      button.classList.remove('btn-primary');
      button.classList.add('btn-disabled');
    }
  }