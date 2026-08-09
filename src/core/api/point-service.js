/**
 * Core Point Service
 * Gerencia toda a lógica de registros de ponto
 */

export class PointService {
  constructor(supabaseClient, stateManager) {
    this.supabase = supabaseClient;
    this.stateManager = stateManager;
  }

  /**
   * Registrar ponto
   */
  async registerPunch(action, time = null) {
    try {
      this.stateManager.dispatch({ type: 'SET_LOADING', payload: true });

      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const punchTime = time || this.getCurrentTime();
      const currentDate = new Date().toISOString().split('T')[0];

      // Verificar se já existe registro para hoje
      let { data: existingRecord, error: fetchError } = await this.supabase
        .from('ponto_registros')
        .select('*')
        .eq('user_id', user.id)
        .eq('data', currentDate)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
        throw fetchError;
      }

      let record;
      if (existingRecord) {
        // Atualizar registro existente
        const updateData = { [action]: punchTime };
        const { data: updatedRecord, error: updateError } = await this.supabase
          .from('ponto_registros')
          .update(updateData)
          .eq('id', existingRecord.id)
          .select()
          .single();

        if (updateError) throw updateError;
        record = updatedRecord;
      } else {
        // Criar novo registro
        const newRecord = {
          user_id: user.id,
          data: currentDate,
          [action]: punchTime
        };

        const { data: createdRecord, error: createError } = await this.supabase
          .from('ponto_registros')
          .insert(newRecord)
          .select()
          .single();

        if (createError) throw createError;
        record = createdRecord;
      }

      // Atualizar estado local
      this.stateManager.dispatch({ type: 'ADD_RECORD', payload: record });

      return record;
    } catch (error) {
      console.error('Erro ao registrar ponto:', error);
      this.stateManager.dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      this.stateManager.dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  /**
   * Registrar múltiplos pontos (ex: almoço + saída juntos)
   */
  async registerMultiplePunches(punches) {
    try {
      this.stateManager.dispatch({ type: 'SET_LOADING', payload: true });

      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const currentDate = new Date().toISOString().split('T')[0];
      const punchTime = this.getCurrentTime();

      // Atualizar ou criar registro
      let { data: existingRecord, error: fetchError } = await this.supabase
        .from('ponto_registros')
        .select('*')
        .eq('user_id', user.id)
        .eq('data', currentDate)
        .single();

      let record;
      const updateData = {};

      // Preparar dados para atualização
      Object.keys(punches).forEach(action => {
        updateData[action] = punches[action] || punchTime;
      });

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingRecord) {
        const { data: updatedRecord, error: updateError } = await this.supabase
          .from('ponto_registros')
          .update(updateData)
          .eq('id', existingRecord.id)
          .select()
          .single();

        if (updateError) throw updateError;
        record = updatedRecord;
      } else {
        const newRecord = {
          user_id: user.id,
          data: currentDate,
          ...updateData
        };

        const { data: createdRecord, error: createError } = await this.supabase
          .from('ponto_registros')
          .insert(newRecord)
          .select()
          .single();

        if (createError) throw createError;
        record = createdRecord;
      }

      this.stateManager.dispatch({ type: 'ADD_RECORD', payload: record });

      return record;
    } catch (error) {
      console.error('Erro ao registrar múltiplos pontos:', error);
      this.stateManager.dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      this.stateManager.dispatch({ type: 'SET_LOADING', payload: false });
    }
  }
  /**
   * Obter registros de ponto
   */
  async getRecords(userId = null, startDate = null, endDate = null) {
    try {
      this.stateManager.dispatch({ type: 'SET_LOADING', payload: true });

      let query = this.supabase.from('ponto_registros').select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');
        query = query.eq('user_id', user.id);
      }

      if (startDate) {
        query = query.gte('data', startDate);
      }
      if (endDate) {
        query = query.lte('data', endDate);
      }

      query = query.order('data', { ascending: false });

      const { data: records, error } = await query;

      if (error) throw error;

      this.stateManager.dispatch({ type: 'SET_RECORDS', payload: records });

      return records;
    } catch (error) {
      console.error('Erro ao buscar registros:', error);
      this.stateManager.dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      this.stateManager.dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  /**
   * Obter registros de ponto por mês
   */
  async getRecordsByMonth(month, year, userId = null) {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-${this.getDaysInMonth(month, year)}`;

      return await this.getRecords(userId, startDate, endDate);
    } catch (error) {
      console.error('Erro ao buscar registros do mês:', error);
      throw error;
    }
  }

  /**
   * Calcular duração do dia
   */
  calculateDayDuration(record) {
    if (!record.entrada || !record.saida) return 0;

    const entrada = new Date(`2000-01-01T${record.entrada}`);
    const saida = new Date(`2000-01-01T${record.saida}`);
    
    if (record.almoco && record.retorno) {
      const almoco = new Date(`2000-01-01T${record.almoco}`);
      const retorno = new Date(`2000-01-01T${record.retorno}`);
      
      const total = (saida - entrada) - (retorno - almoco);
      return Math.max(0, total) / (1000 * 60 * 60); // Retorna em horas
    }

    return (saida - entrada) / (1000 * 60 * 60); // Retorna em horas
  }

  /**
   * Obter usuário atual
   */
  async getCurrentUser() {
    const session = await this.supabase.auth.getSession();
    if (!session.data.session) return null;

    const { data: user, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', session.data.session.user.id)
      .single();

    if (error) return null;

    return user;
  }

  /**
   * Obter hora atual formatada
   */
  getCurrentTime() {
    return new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
  }

  /**
   * Obter dias no mês
   */
  getDaysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
  }
}