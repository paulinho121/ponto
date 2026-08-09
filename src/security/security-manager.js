/**
 * Security Manager - Sistema integrado de segurança
 * Combina todas as verificações para prevenir fraudes
 */

import { DeviceManager } from './device-manager.js';
import { LocationValidator } from './location-validator.js';
import { TimeValidator } from './time-validator.js';
import { PhotoCapture } from './photo-capture.js';

export class SecurityManager {
  constructor() {
    this.deviceManager = new DeviceManager();
    this.locationValidator = new LocationValidator();
    this.timeValidator = new TimeValidator();
    this.photoCapture = new PhotoCapture();
    
    this.securityLevel = 'medium'; // 'low', 'medium', 'high'
    this.enforceLocation = true;
    this.enforceDevice = true;
    this.enforceTime = true;
    this.enforcePhoto = false; // Desativado por padrão para melhor experiência do usuário
    
    // Configurações de segurança
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 10000
    };
  }

  /**
   * Define o nível de segurança
   */
  setSecurityLevel(level) {
    this.securityLevel = level;
    
    switch(level) {
      case 'low':
        this.enforceLocation = false;
        this.enforceDevice = false;
        this.enforcePhoto = false;
        this.enforceTime = true;
        break;
      case 'medium':
        this.enforceLocation = true;
        this.enforceDevice = true;
        this.enforcePhoto = false; // Mantido desativado para não impactar UX
        this.enforceTime = true;
        break;
      case 'high':
        this.enforceLocation = true;
        this.enforceDevice = true;
        this.enforcePhoto = true;
        this.enforceTime = true;
        break;
      default:
        throw new Error(`Nível de segurança inválido: ${level}`);
    }
  }

  /**
   * Realiza todas as verificações de segurança com retry
   */
  async performSecurityChecks(userId, punchType) {
    let attempts = 0;
    let lastError = null;
    
    while (attempts < this.config.maxRetries) {
      try {
        const results = {
          overallSuccess: true,
          checks: {},
          timestamp: new Date().toISOString(),
          attempt: attempts + 1
        };

        // Verificação de dispositivo
        if (this.enforceDevice) {
          results.checks.device = await this.validateDevice(userId);
          if (!results.checks.device.isValid) {
            results.overallSuccess = false;
          }
        }

        // Verificação de localização
        if (this.enforceLocation) {
          results.checks.location = await this.validateLocation();
          if (!results.checks.location.isValid) {
            results.overallSuccess = false;
          }
        }

        // Verificação de tempo
        if (this.enforceTime) {
          results.checks.time = await this.validateTime(punchType);
          if (!results.checks.time.isValid) {
            results.overallSuccess = false;
          }
        }

        // Captura de foto (opcional)
        if (this.enforcePhoto) {
          results.checks.photo = await this.captureAndValidatePhoto(userId, punchType);
          if (!results.checks.photo.isValid) {
            results.overallSuccess = false;
          }
        }

        // Se todas as verificações passarem, retornar sucesso
        if (results.overallSuccess) {
          return results;
        }

        // Se houver falhas e for a última tentativa, retornar resultados
        if (attempts === this.config.maxRetries - 1) {
          return results;
        }

        // Aguardar antes da próxima tentativa
        await this.delay(this.config.retryDelay);
        attempts++;
        
      } catch (error) {
        lastError = error;
        attempts++;
        
        if (attempts >= this.config.maxRetries) {
          return {
            overallSuccess: false,
            checks: {},
            error: error.message,
            timestamp: new Date().toISOString()
          };
        }
        
        await this.delay(this.config.retryDelay);
      }
    }
  }

  /**
   * Validação de dispositivo
   */
  async validateDevice(userId) {
    try {
      const isAuthorized = await this.deviceManager.isDeviceAuthorized(userId);
      
      return {
        isValid: isAuthorized,
        check: 'device',
        message: isAuthorized ? 'Dispositivo autorizado' : 'Dispositivo não autorizado',
        deviceId: this.deviceManager.getDeviceId(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        isValid: false,
        check: 'device',
        message: 'Erro na validação de dispositivo',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validação de localização
   */
  async validateLocation() {
    try {
      const validation = await this.locationValidator.validateLocation();
      
      return {
        isValid: validation.isValid,
        check: 'location',
        message: validation.message,
        distance: validation.distance,
        accuracy: validation.accuracy,
        userLocation: validation.userLocation,
        labLocation: validation.labLocation,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        isValid: false,
        check: 'location',
        message: 'Erro na validação de localização',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validação de tempo
   */
  async validateTime(punchType) {
    try {
      const validation = await this.timeValidator.validateNewPunch(punchType);
      
      return {
        isValid: validation.isValid,
        check: 'time',
        message: validation.reason,
        timeRemaining: validation.timeRemaining,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        isValid: false,
        check: 'time',
        message: 'Erro na validação de tempo',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Captura e validação de foto
   */
  async captureAndValidatePhoto(userId, punchType) {
    try {
      if (!PhotoCapture.isCameraAvailable()) {
        return {
          isValid: false,
          check: 'photo',
          message: 'Câmera não disponível',
          error: 'Hardware não suportado',
          timestamp: new Date().toISOString()
        };
      }

      // Solicitar permissão para câmera
      await this.photoCapture.requestCameraPermission();
      
      // Inicializar câmera
      const cameraReady = await this.photoCapture.initializeCamera();
      if (!cameraReady) {
        throw new Error('Falha ao inicializar câmera');
      }

      // Capturar foto
      const photoData = await this.photoCapture.capturePhoto();
      
      // Enviar para validação
      const photoValidated = await this.photoCapture.sendPhotoForValidation(
        photoData, userId, punchType
      );

      this.photoCapture.releaseCamera();

      return {
        isValid: photoValidated,
        check: 'photo',
        message: photoValidated ? 'Foto validada com sucesso' : 'Falha na validação da foto',
        hasPhoto: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (this.photoCapture) {
        this.photoCapture.releaseCamera();
      }
      
      return {
        isValid: false,
        check: 'photo',
        message: 'Erro na captura de foto',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Registra uma batida de ponto com segurança
   */
  async securePunchRegistration(userId, punchType) {
    try {
      // Realizar verificações de segurança
      const securityResults = await this.performSecurityChecks(userId, punchType);
      
      if (!securityResults.overallSuccess) {
        return {
          success: false,
          message: 'Falha na verificação de segurança',
          securityResults: securityResults,
          timestamp: new Date().toISOString()
        };
      }

      // Registrar batida de ponto
      this.timeValidator.recordPunch(punchType);

      return {
        success: true,
        message: 'Batida de ponto registrada com segurança',
        securityResults: securityResults,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro durante verificação de segurança: ${error.message}`,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Registra o dispositivo do usuário
   */
  async registerUserDevice(userId) {
    try {
      const result = await this.deviceManager.registerDeviceForUser(userId);
      return {
        success: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Atualiza as coordenadas do local de trabalho
   */
  updateWorkLocation(latitude, longitude, radius = 50) {
    this.locationValidator.updateLabCoordinates(latitude, longitude, radius);
  }

  /**
   * Obtém configurações de segurança atuais
   */
  getSecurityConfig() {
    return {
      level: this.securityLevel,
      enforceLocation: this.enforceLocation,
      enforceDevice: this.enforceDevice,
      enforceTime: this.enforceTime,
      enforcePhoto: this.enforcePhoto,
      locationConfig: this.locationValidator.getGeofenceConfig(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Espera um determinado tempo
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
}