/**
 * Application Configuration
 * Configurações centrais da aplicação
 */

export class AppConfig {
  constructor() {
    this.environment = this.detectEnvironment();
    this.api = this.getApiConfig();
    this.features = this.getFeatureFlags();
    this.security = this.getSecurityConfig();
    this.performance = this.getPerformanceConfig();
  }

  /**
   * Detectar ambiente de execução
   */
  detectEnvironment() {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    } else if (hostname.includes('dev.') || hostname.includes('-dev.')) {
      return 'staging';
    } else {
      return 'production';
    }
  }

  /**
   * Obter configurações de API
   */
  getApiConfig() {
    const configs = {
      development: {
        timeout: 10000,
        retryAttempts: 3,
        retryDelay: 1000,
        maxConcurrentRequests: 5,
        cacheEnabled: false
      },
      staging: {
        timeout: 8000,
        retryAttempts: 2,
        retryDelay: 500,
        maxConcurrentRequests: 3,
        cacheEnabled: true
      },
      production: {
        timeout: 5000,
        retryAttempts: 1,
        retryDelay: 300,
        maxConcurrentRequests: 2,
        cacheEnabled: true
      }
    };

    return configs[this.environment];
  }

  /**
   * Obter flags de features
   */
  getFeatureFlags() {
    return {
      // Autenticação
      enableBiometricLogin: false,
      enableSocialLogin: false,
      enableTwoFactorAuth: false,

      // Localização
      enableLocationValidation: true,
      enableGeofencing: true,
      enableOfflineMode: true,

      // Notificações
      enablePushNotifications: false,
      enableEmailNotifications: true,
      enableSMSNotifications: false,

      // Admin
      enableAdvancedReporting: true,
      enableBulkOperations: false,
      enableUserManagement: true,

      // Performance
      enableLazyLoading: true,
      enableVirtualScrolling: true,
      enableCaching: true
    };
  }

  /**
   * Obter configurações de segurança
   */
  getSecurityConfig() {
    return {
      // Tempo de sessão
      sessionTimeout: this.environment === 'production' ? 30 * 60 * 1000 : 60 * 60 * 1000, // 30 min / 1 hora
      idleTimeout: this.environment === 'production' ? 15 * 60 * 1000 : 30 * 60 * 1000, // 15 min / 30 min

      // Validação de dados
      enableInputValidation: true,
      enableSanitization: true,
      enableXSSProtection: true,

      // Auditoria
      enableActivityLogging: true,
      enableSecurityLogging: true,
      enableComplianceLogging: this.environment === 'production'
    };
  }

  /**
   * Obter configurações de performance
   */
  getPerformanceConfig() {
    return {
      // Caching
      cacheTTL: this.environment === 'production' ? 5 * 60 * 1000 : 60 * 1000, // 5 min / 1 min
      cacheMaxSize: 100,

      // Lazy loading
      lazyLoadThreshold: 300, // pixels antes do viewport
      lazyLoadRootMargin: '50px',

      // Virtual scrolling
      virtualScrollBufferSize: 5,
      virtualScrollItemHeight: 80,

      // Imagens
      imageCompressionQuality: 0.8,
      imageMaxSize: 5 * 1024 * 1024, // 5MB
      imageCacheEnabled: true
    };
  }

  /**
   * Obter configurações específicas do ambiente
   */
  getEnvironmentConfig() {
    return {
      environment: this.environment,
      isDevelopment: this.environment === 'development',
      isStaging: this.environment === 'staging',
      isProduction: this.environment === 'production',
      version: '2.0.0',
      buildDate: new Date().toISOString(),
      features: this.features
    };
  }

  /**
   * Validar configuração
   */
  validate() {
    const requiredConfigs = [
      this.api,
      this.features,
      this.security,
      this.performance
    ];

    return requiredConfigs.every(config => config !== null && typeof config === 'object');
  }

  /**
   * Obter configuração específica
   */
  get(path) {
    const keys = path.split('.');
    let current = this;

    for (const key of keys) {
      if (current[key] === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Definir configuração (apenas para testes)
   */
  set(path, value) {
    if (this.environment !== 'development') {
      console.warn('Configurações não podem ser alteradas em ambiente de produção');
      return;
    }

    const keys = path.split('.');
    let current = this;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
  }
}

/**
 * Instância global de configuração
 */
export const appConfig = new AppConfig();

/**
 * Funções auxiliares
 */
export const ConfigHelper = {
  /**
   * Verificar se feature está habilitada
   */
  isFeatureEnabled(featureName) {
    return appConfig.features[featureName] === true;
  },

  /**
   * Obter valor com fallback
   */
  getWithFallback(path, fallback) {
    const value = appConfig.get(path);
    return value !== undefined ? value : fallback;
  },

  /**
   * Verificar ambiente
   */
  isDevelopment() {
    return appConfig.environment === 'development';
  },

  isStaging() {
    return appConfig.environment === 'staging';
  },

  isProduction() {
    return appConfig.environment === 'production';
  }
};