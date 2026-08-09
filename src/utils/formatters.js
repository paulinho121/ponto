/**
 * Utilities - Formatters
 * Funções para formatação de dados
 */

export const Formatters = {
  /**
   * Formatador de datas
   */
  date: {
    // Formatar data para exibição
    toDisplay: (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    },

    // Formatar data para curta (DD/MM)
    toShort: (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      });
    },

    // Formatar data para padrão ISO
    toISO: (date) => {
      if (!date) return '';
      return new Date(date).toISOString().split('T')[0];
    },

    // Obter nome do dia da semana
    getWeekdayName: (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', { weekday: 'long' });
    }
  },

  /**
   * Formatador de horas
   */
  time: {
    // Formatar hora para exibição
    toDisplay: (timeString) => {
      if (!timeString) return '--:--';
      return timeString.substring(0, 5);
    },

    // Converter minutos para HH:MM
    minutesToHours: (minutes) => {
      if (!minutes) return '00:00';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    },

    // Converter hora para minutos
    toMinutes: (timeString) => {
      if (!timeString) return 0;
      const [hours, minutes] = timeString.split(':').map(Number);
      return hours * 60 + minutes;
    }
  },

  /**
   * Formatador de duração
   */
  duration: {
    // Formatar minutos para HHh MMmin
    toDisplay: (minutes) => {
      if (!minutes) return '0h 0min';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}min`;
    },

    // Formatar minutos para HH:MM
    toHoursMinutes: (minutes) => {
      if (!minutes) return '00:00';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
  },

  /**
   * Formatador de números
   */
  number: {
    // Formatar para percentual
    toPercent: (value, total) => {
      if (!total || total === 0) return '0%';
      const percent = (value / total) * 100;
      return `${Math.round(percent)}%`;
    },

    // Formatar para moeda (BRL)
    toCurrency: (value) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    },

    // Formatar número com separadores
    toLocale: (value) => {
      return new Intl.NumberFormat('pt-BR').format(value);
    }
  },

  /**
   * Formatador de texto
   */
  text: {
    // Capitalizar primeira letra de cada palavra
    capitalize: (text) => {
      if (!text) return '';
      return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    },

    // Gerar iniciais a partir do nome
    getInitials: (name) => {
      if (!name) return '??';
      const parts = name.trim().split(' ');
      const initials = parts.length >= 2
        ? parts[0][0] + parts[parts.length - 1][0]
        : parts[0].substring(0, 2);
      return initials.toUpperCase();
/**
 * Classe auxiliar para operações de formatação
 */
export class Formatter {
  /**
   * Formatar objeto de registro completo
   */
  static formatRecord(record) {
    return {
      ...record,
      formattedDate: Formatters.date.toDisplay(record.data),
      formattedWeekday: Formatters.date.getWeekdayName(record.data),
      formattedEntrada: Formatters.time.toDisplay(record.entrada),
      formattedAlmoco: Formatters.time.toDisplay(record.almoco),
      formattedRetorno: Formatters.time.toDisplay(record.retorno),
      formattedSaida: Formatters.time.toDisplay(record.saida),
      duration: this.calculateRecordDuration(record),
      status: Formatters.status.getRecordStatusText(record),
      statusClass: Formatters.status.getRecordStatusClass(record)
    };
  }

  /**
   * Calcular duração do registro
   */
  static calculateRecordDuration(record) {
    if (!record.entrada || !record.saida) return 0;

    const entrada = new Date(`2000-01-01T${record.entrada}`);
    const saida = new Date(`2000-01-01T${record.saida}`);

    if (record.almoco && record.retorno) {
      const almoco = new Date(`2000-01-01T${record.almoco}`);
      const retorno = new Date(`2000-01-01T${record.retorno}`);

      const total = (saida - entrada) - (retorno - almoco);
      return Math.max(0, total) / (1000 * 60 * 60) * 60; // Retorna em minutos
    }

    return (saida - entrada) / (1000 * 60 * 60) * 60; // Retorna em minutos
  }

  /**
   * Formatar objeto de localização
   */
  static formatLocation(location) {
    return {
      ...location,
      status: Formatters.status.getLocationStatusText(location.ativo),
      statusClass: Formatters.status.getLocationStatusClass(location.ativo),
      formattedCoordinates: `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
    };
  }

  /**
   * Formatar objeto de usuário
   */
  static formatUser(user) {
    return {
      ...user,
      initials: Formatters.text.getInitials(user.nome),
      displayName: Formatters.text.capitalize(user.nome),
      formattedCargaHoras: `${user.cargaHoras}h`
    };
  }
}
    },

    // Truncar texto
    truncate: (text, maxLength) => {
      if (!text || text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    }
  },

  /**
   * Formatador de status
   */
  status: {
    // Obter classe CSS para status de registro
    getRecordStatusClass: (record) => {
      if (!record.entrada && !record.saida) return 'bg-outline-variant/20 text-on-surface-variant';
      if (record.entrada && record.saida && record.almoco && record.retorno) return 'bg-tertiary/10 text-tertiary';
      return 'bg-error/10 text-error';
    },

    // Obter texto de status de registro
    getRecordStatusText: (record) => {
      if (!record.entrada && !record.saida) return 'Ausente';
      if (record.entrada && record.saida && record.almoco && record.retorno) return 'Completo';
      return 'Incompleto';
    },

    // Obter classe CSS para status de localização
    getLocationStatusClass: (isActive) => {
      return isActive ? 'bg-tertiary/10 text-tertiary' : 'bg-outline-variant/20 text-on-surface-variant';
    },

    // Obter texto de status de localização
    getLocationStatusText: (isActive) => {
      return isActive ? 'Ativo' : 'Inativo';
    }
  }
};