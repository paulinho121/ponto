/**
 * Application Core
 * Ponto de entrada principal da aplicação
 */

import { AuthService } from './auth/auth-service.js';
import { StateManager } from './state/state-manager.js';
import { PointService } from './api/point-service.js';
import { LocationService } from './api/location-service.js';
import { logger, errorHandler } from '../utils/logger.js';
import { appConfig } from '../config/app-config.js';
import { Validators, AsyncValidator } from '../utils/validators.js';
import { Formatters, Formatter } from '../utils/formatters.js';

export class Application {
  constructor() {
    this.stateManager = new StateManager();
    this.authService = null;
    this.pointService = null;
    this.locationService = null;
    this.asyncValidator = null;
    
    this.initialized = false;
    this.bootstrapping = false;
    
    // Bind métodos
    this.bootstrap = this.bootstrap.bind(this);
    this.initializeServices = this.initializeServices.bind(this);
    this.setupGlobalHandlers = this.setupGlobalHandlers.bind(this);
  }

  /**
   * Inicializar a aplicação
   */
  async bootstrap(supabaseClient) {
    if (this.bootstrapping || this.initialized) {
      return this;
    }

    this.bootstrapping = true;

    try {
      logger.info('Iniciando aplicação...', {
        version: appConfig.get('version'),
        environment: appConfig.environment
      });

      // Setup de handlers globais
      this.setupGlobalHandlers();

      // Inicializar serviços
      await this.initializeServices(supabaseClient);

      // Validar inicialização
      await this.validateInitialization();

      this.initialized = true;
      this.bootstrapping = false;

      logger.info('Aplicação inicializada com sucesso');

      return this;
    } catch (error) {
      logger.error('Falha na inicialização da aplicação', { error: error.message });
      this.bootstrapping = false;
      throw error;
    }
  }

  /**
   * Inicializar serviços
   */
  async initializeServices(supabaseClient) {
    // Inicializar validator assíncrono
    this.asyncValidator = new AsyncValidator(supabaseClient);

    // Inicializar serviços principais
    this.authService = new AuthService(supabaseClient);
    this.pointService = new PointService(supabaseClient, this.stateManager);
    this.locationService = new LocationService(supabaseClient, this.stateManager);

    // Configurar listeners de estado
    this.setupStateListeners();

    logger.info('Serviços inicializados');
  }

  /**
   * Configurar listeners de estado
   */
  setupStateListeners() {
    // Listener global para mudanças de estado
    this.stateManager.subscribe((state) => {
      logger.debug('Estado atualizado', {
        user: state.user ? { id: state.user.id, name: state.user.nome } : null,
        loading: state.loading,
        hasError: !!state.error
      });
    });
  }

  /**
   * Configurar handlers globais
   */
  setupGlobalHandlers() {
    // Configurar error handler global
    errorHandler.init();

    // Configurar listeners de eventos globais
    this.setupGlobalEventListeners();

    logger.info('Handlers globais configurados');
  }

  /**
   * Configurar listeners de eventos globais
   */
  setupGlobalEventListeners() {
    // Listener para mudanças de visibilidade da página
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        logger.info('Página ocultada');
      } else {
        logger.info('Página restaurada');
        // Pode adicionar lógica para atualizar dados quando a página é restaurada
      }
    });

    // Listener para antes de descarregar a página
    window.addEventListener('beforeunload', () => {
      logger.info('Página prestes a ser descarregada');
      // Pode adicionar lógica para salvar estado ou enviar logs
    });

    // Listener para online/offline
  /**
   * Obter estado atual da aplicação
   */
  getState() {
    if (!this.initialized) {
      throw new Error('Aplicação não inicializada. Chame bootstrap() primeiro.');
    }
    return this.stateManager.getState();
  }

  /**
   * Obter serviço específico
   */
  getService(serviceName) {
    if (!this.initialized) {
      throw new Error('Aplicação não inicializada. Chame bootstrap() primeiro.');
    }

    const services = {
      auth: this.authService,
      point: this.pointService,
      location: this.locationService,
      state: this.stateManager,
      validator: this.asyncValidator
    };

    const service = services[serviceName.toLowerCase()];
    if (!service) {
      throw new Error(`Serviço não encontrado: ${serviceName}`);
    }

    return service;
  }

  /**
   * Verificar se aplicação está pronta
   */
  isReady() {
    return this.initialized && !this.bootstrapping;
  }

  /**
   * Reiniciar aplicação
   */
  async restart(supabaseClient) {
    logger.info('Reiniciando aplicação...');
    
    // Limpar estado
    this.stateManager.clear();
    
    // Reiniciar
    return await this.bootstrap(supabaseClient);
  }

  /**
   * Desligar aplicação
   */
  shutdown() {
    logger.info('Desligando aplicação...');
    
    // Limpar listeners
    this.stateManager.clear();
    
    this.initialized = false;
    this.bootstrapping = false;
    
    logger.info('Aplicação desligada');
  }

  /**
   * Executar operação com tratamento de erro
   */
  async safeExecute(operation, onError = null) {
    try {
      return await operation();
    } catch (error) {
      logger.error('Erro na operação', { 
        error: error.message, 
        operation: operation.name || 'anonymous' 
      });

      if (onError) {
        return onError(error);
      }

      throw error;
    }
  }

  /**
   * Validar dados de entrada
   */
  validate(data, validatorType) {
    if (!Validators[validatorType]) {
      throw new Error(`Validador não encontrado: ${validatorType}`);
    }

    return Validators[validatorType](data);
  }

  /**
   * Formatador de dados
   */
  format(data, formatterType, ...args) {
    if (typeof Formatters[formatterType] === 'function') {
      return Formatters[formatterType](data, ...args);
    } else if (Formatter[formatterType]) {
      return Formatter[formatterType](data);
    }

    throw new Error(`Formatador não encontrado: ${formatterType}`);
  }
}

/**
 * Instância global da aplicação
 */
export const app = new Application();

/**
 * Função helper para inicializar a aplicação
 */
export const initializeApp = async (supabaseClient) => {
  return await app.bootstrap(supabaseClient);
};
    window.addEventListener('online', () => {
      logger.info('Conexão restaurada');
    });

    window.addEventListener('offline', () => {
      logger.warn('Conexão perdida');
    });
  }

  /**
   * Validar inicialização
   */
  async validateInitialization() {
    const services = [
      { name: 'AuthService', service: this.authService },
      { name: 'PointService', service: this.pointService },
      { name: 'LocationService', service: this.locationService },
      { name: 'AsyncValidator', service: this.asyncValidator }
    ];

    const invalidServices = services.filter(service => !service.service);

    if (invalidServices.length > 0) {
      throw new Error(`Serviços inválidos: ${invalidServices.map(s => s.name).join(', ')}`);
    }

    logger.info('Inicialização validada com sucesso');
  }