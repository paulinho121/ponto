/**
 * Security Configuration for Production Environment
 * Este arquivo é gerado automaticamente durante o build para ambiente de produção
 */

// Configurações de segurança para produção
export const securityConfig = {
  // Nível de segurança padrão
  defaultSecurityLevel: 'medium',
  
  // Configurações de geolocalização
  geolocation: {
    enabled: true,
    accuracyThreshold: 30, // metros
    maxDistanceFromOffice: 100 // metros
  },
  
  // Configurações de dispositivo
  device: {
    enabled: true,
    requireRegistration: true
  },
  
  // Configurações de tempo
  time: {
    enabled: true,
    allowPastEntries: false,
    allowFutureEntries: false
  },
  
  // Configurações de foto (desativado por padrão para melhor experiência do usuário)
  photo: {
    enabled: false,
    requiredForAllPunches: false
  },
  
  // Configurações de retentativas
  retry: {
    maxAttempts: 3,
    delayBetweenAttempts: 1000 // milissegundos
  },
  
  // Configurações de timeout
  timeout: {
    location: 10000, // milissegundos
    apiCall: 15000,   // milissegundos
    photoCapture: 30000 // milissegundos
  }
};

// Função para obter configurações com base no ambiente
export function getSecurityConfig(environment = 'production') {
  const baseConfig = { ...securityConfig };
  
  switch (environment) {
    case 'development':
      // Configurações mais relaxadas para desenvolvimento
      baseConfig.geolocation.accuracyThreshold = 100;
      baseConfig.geolocation.maxDistanceFromOffice = 500;
      baseConfig.photo.enabled = false;
      break;
      
    case 'staging':
      // Configurações intermediárias para staging
      baseConfig.geolocation.accuracyThreshold = 50;
      baseConfig.geolocation.maxDistanceFromOffice = 200;
      baseConfig.photo.enabled = false;
      break;
      
    case 'production':
    default:
      // Configurações rígidas para produção
      baseConfig.geolocation.accuracyThreshold = 30;
      baseConfig.geolocation.maxDistanceFromOffice = 100;
      baseConfig.photo.enabled = false; // Mantido desativado para melhor UX
      break;
  }
  
  return baseConfig;
}