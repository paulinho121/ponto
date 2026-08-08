/**
 * Utilities - Logger
 * Sistema de logging profissional com diferentes níveis
 */

export class Logger {
  constructor(config = {}) {
    this.config = {
      level: config.level || 'INFO',
      enabled: config.enabled !== false,
      sendToServer: config.sendToServer || false,
      serverEndpoint: config.serverEndpoint || '/api/logs',
      maxBatchSize: config.maxBatchSize || 10,
      ...config
    };

    this.logsQueue = [];
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };

    this.currentLevel = this.levels[this.config.level] || this.levels.INFO;
  }

  /**
   * Log de erro
   */
  error(message, metadata = {}) {
    this.log('ERROR', message, metadata);
  }

  /**
   * Log de aviso
   */
  warn(message, metadata = {}) {
    this.log('WARN', message, metadata);
  }

  /**
   * Log de informação
   */
  info(message, metadata = {}) {
    this.log('INFO', message, metadata);
  }

  /**
   * Log de debug
   */
  debug(message, metadata = {}) {
    this.log('DEBUG', message, metadata);
  }

  /**
   * Log genérico
   */
  log(level, message, metadata = {}) {
    if (!this.config.enabled || this.levels[level] > this.currentLevel) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata: {
        ...metadata,
        userId: this.getCurrentUserId(),
        sessionId: this.getSessionId(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };

    // Log no console
    this.consoleLog(logEntry);

    // Adicionar à fila para envio ao servidor
    if (this.config.sendToServer) {
      this.addToQueue(logEntry);
    }
  }

  /**
   * Log no console com formatação
   */
  consoleLog(logEntry) {
    const styles = {
      ERROR: 'color: #dc2626; font-weight: bold;',
      WARN: 'color: #f59e0b; font-weight: bold;',
      INFO: 'color: #2563eb;',
      DEBUG: 'color: #6b7280; font-style: italic;'
    };

    console.log(
      `%c[${logEntry.level}] ${logEntry.message}`,
      styles[logEntry.level],
      logEntry.metadata
    );
  }

  /**
   * Adicionar log à fila
   */
  addToQueue(logEntry) {
    this.logsQueue.push(logEntry);

    // Enviar lote quando atingir o tamanho máximo
    if (this.logsQueue.length >= this.config.maxBatchSize) {
      this.flushLogs();
    }
  }

  /**
   * Enviar logs acumulados ao servidor
   */
  async flushLogs() {
    if (this.logsQueue.length === 0) return;

    const logsToSend = [...this.logsQueue];
    this.logsQueue = [];

    try {
      await fetch(this.config.serverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          logs: logsToSend,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Falha ao enviar logs para o servidor:', error);
      // Re-adicionar logs à fila em caso de falha
      this.logsQueue.unshift(...logsToSend);
/**
 * Error Handler Global
 */
export class ErrorHandler {
  constructor(loggerInstance) {
    this.logger = loggerInstance || logger;
    this.init();
  }

  /**
   * Inicializar handlers globais
   */
  init() {
    // Capturar erros não tratados
    window.addEventListener('error', (event) => {
      this.handleGlobalError(event.error);
    });

    // Capturar promises rejeitadas não tratadas
    window.addEventListener('unhandledrejection', (event) => {
      this.handleGlobalError(event.reason);
    });

    // Capturar erros de recursos
    window.addEventListener('error', (event) => {
      if (event.error === undefined && event.filename === undefined) {
        this.logger.warn('Resource load error', {
          target: event.target?.localName,
          src: event.target?.src,
          href: event.target?.href
        });
      }
    }, true);
  }

  /**
   * Tratar erro global
   */
  handleGlobalError(error) {
    const errorReport = {
      message: error.message || String(error),
      stack: error.stack,
      name: error.name,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    this.logger.error('Global error caught', errorReport);

    // Tentar extrair informações úteis do erro
    if (error instanceof Error) {
      this.logger.error(`${error.name}: ${error.message}`, {
        stack: error.stack,
        fileName: error.fileName,
        lineNumber: error.lineNumber,
        columnNumber: error.columnNumber
      });
    } else {
      this.logger.error('Non-Error exception caught', { error: String(error) });
    }
  }

  /**
   * Reportar erro manualmente
   */
  reportError(error, context = {}) {
    if (error instanceof Error) {
      this.logger.error(error.message, {
        ...context,
        stack: error.stack,
        name: error.name
      });
    } else {
      this.logger.error(String(error), context);
    }
  }
}

/**
 * Instância global de ErrorHandler
 */
export const errorHandler = new ErrorHandler(logger);
    }
  }

  /**
   * Obter ID do usuário atual
   */
  getCurrentUserId() {
    try {
      const session = sessionStorage.getItem('supabase.auth.token');
      if (session) {
        const parsed = JSON.parse(session);
        return parsed?.currentSession?.user?.id || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Obter ID da sessão
   */
  getSessionId() {
    return sessionStorage.getItem('sessionId') || 
           (Math.random().toString(36).substr(2, 9) + Date.now());
  }

  /**
   * Configurar nível de log
   */
  setLevel(level) {
    this.currentLevel = this.levels[level] || this.levels.INFO;
  }

  /**
   * Habilitar/desabilitar logging
   */
  setEnabled(enabled) {
    this.config.enabled = enabled;
  }
}

/**
 * Logger global
 */
export const logger = new Logger({
  level: 'INFO',
  enabled: process.env.NODE_ENV === 'development',
  sendToServer: true,
  serverEndpoint: '/api/logs'
});