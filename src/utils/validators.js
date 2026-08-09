/**
 * Utilities - Validators
 * Sistema de validação robusto para dados do aplicativo
 */

export const Validators = {
  /**
   * Validadores para dados de usuário
   */
  user: {
    email: (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        isValid: emailRegex.test(email),
        error: emailRegex.test(email) ? null : 'Email inválido'
      };
    },

    matricula: (matricula) => {
      const matriculaRegex = /^[A-Z0-9]{6,12}$/i;
      return {
        isValid: matriculaRegex.test(matricula),
        error: matriculaRegex.test(matricula) ? null : 'Matrícula inválida (6-12 caracteres alfanuméricos)'
      };
    },

    phone: (phone) => {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      return {
        isValid: phoneRegex.test(phone),
        error: phoneRegex.test(phone) ? null : 'Telefone inválido'
      };
    },

    name: (name) => {
      return {
        isValid: name && name.trim().length >= 2,
        error: name && name.trim().length >= 2 ? null : 'Nome deve ter pelo menos 2 caracteres'
      };
    },

    password: (password) => {
      return {
        isValid: password && password.length >= 6,
        error: password && password.length >= 6 ? null : 'Senha deve ter pelo menos 6 caracteres'
      };
    }
  },

  /**
   * Validadores para dados de ponto
   */
  point: {
    time: (time) => {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      return {
        isValid: timeRegex.test(time),
        error: timeRegex.test(time) ? null : 'Formato de hora inválido (HH:MM)'
      };
    },

    location: (latitude, longitude) => {
      const isValidLat = typeof latitude === 'number' && 
                        Math.abs(latitude) <= 90 && 
                        !isNaN(latitude);
      const isValidLng = typeof longitude === 'number' && 
                        Math.abs(longitude) <= 180 && 
                        !isNaN(longitude);

      return {
        isValid: isValidLat && isValidLng,
        error: !isValidLat ? 'Latitude inválida' : 
               !isValidLng ? 'Longitude inválida' : null
      };
    }
  },

  /**
   * Validadores para dados de local
   */
  location: {
    coordinates: (latitude, longitude) => {
      return Validators.point.location(latitude, longitude);
    },

    radius: (radius) => {
      const isValid = Number.isInteger(radius) && radius > 0 && radius <= 10000;
      return {
        isValid,
        error: isValid ? null : 'Raio deve ser um número inteiro entre 1 e 10000 metros'
      };
    },

    name: (name) => {
      return {
        isValid: name && name.trim().length >= 2 && name.trim().length <= 100,
        error: name && name.trim().length >= 2 && name.trim().length <= 100 ? 
               null : 'Nome deve ter entre 2 e 100 caracteres'
      };
    }
  },

  /**
   * Validador combinado para cadastro
   */
  registration: (userData) => {
    const errors = {};

    // Validar campos obrigatórios
    if (!userData.nome) errors.nome = 'Nome é obrigatório';
    if (!userData.matricula) errors.matricula = 'Matrícula é obrigatória';
    if (!userData.email) errors.email = 'Email é obrigatório';
    if (!userData.senha) errors.senha = 'Senha é obrigatória';

    // Validar formato dos dados
    if (userData.nome) {
      const nameValidation = Validators.user.name(userData.nome);
      if (!nameValidation.isValid) errors.nome = nameValidation.error;
    }

    if (userData.matricula) {
      const matriculaValidation = Validators.user.matricula(userData.matricula);
      if (!matriculaValidation.isValid) errors.matricula = matriculaValidation.error;
    }

    if (userData.email) {
      const emailValidation = Validators.user.email(userData.email);
      if (!emailValidation.isValid) errors.email = emailValidation.error;
    }

    if (userData.senha) {
      const passwordValidation = Validators.user.password(userData.senha);
      if (!passwordValidation.isValid) errors.senha = passwordValidation.error;
    }

    if (userData.telefone) {
      const phoneValidation = Validators.user.phone(userData.telefone);
      if (!phoneValidation.isValid) errors.telefone = phoneValidation.error;
    }

/**
 * Classe para validação assíncrona
 */
export class AsyncValidator {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Verificar se matrícula já existe
   */
  async checkUniqueMatricula(matricula, excludeUserId = null) {
    let query = this.supabase
      .from('profiles')
      .select('matricula', { count: 'exact' })
      .eq('matricula', matricula);

    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { count, error } = await query;

    if (error) throw error;

    return {
      isUnique: count === 0,
      error: count > 0 ? 'Matrícula já está em uso' : null
    };
  }

  /**
   * Verificar se email já existe
   */
  async checkUniqueEmail(email, excludeUserId = null) {
    let query = this.supabase
      .from('profiles')
      .select('email', { count: 'exact' })
      .eq('email', email);

    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { count, error } = await query;

    if (error) throw error;

    return {
      isUnique: count === 0,
      error: count > 0 ? 'Email já está em uso' : null
    };
  }

  /**
   * Validar credenciais completas (matrícula + email)
   */
  async validateCredentials(matricula, email, excludeUserId = null) {
    const [matriculaResult, emailResult] = await Promise.all([
      this.checkUniqueMatricula(matricula, excludeUserId),
      this.checkUniqueEmail(email, excludeUserId)
    ]);

    return {
      isValid: matriculaResult.isUnique && emailResult.isUnique,
      errors: {
        matricula: matriculaResult.error,
        email: emailResult.error
      }
    };
  }
}
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * Validador para login
   */
  login: (credentials) => {
    const errors = {};

    if (!credentials.matricula) errors.matricula = 'Matrícula é obrigatória';
    if (!credentials.senha) errors.senha = 'Senha é obrigatória';

    if (credentials.matricula) {
      const matriculaValidation = Validators.user.matricula(credentials.matricula);
      if (!matriculaValidation.isValid) errors.matricula = matriculaValidation.error;
    }

    if (credentials.senha) {
      const passwordValidation = Validators.user.password(credentials.senha);
      if (!passwordValidation.isValid) errors.senha = passwordValidation.error;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};