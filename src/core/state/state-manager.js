/**
 * Core State Manager
 * Gerencia o estado global da aplicação
 */

export class StateManager {
  constructor() {
    this.state = {
      user: null,
      session: null,
      records: [],
      locations: [],
      loading: false,
      error: null
    };
    this.listeners = [];
    this.subscribers = new Map();
  }

  /**
   * Obter estado atual
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Atualizar estado
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  /**
   * Inscrever listener para mudanças de estado
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notificar listeners sobre mudança de estado
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('Erro no listener de estado:', error);
      }
    });
  }

  /**
   * Inscrever callback para mudança específica
   */
  subscribeTo(path, callback) {
    const subscriberId = Symbol('subscriber');
    this.subscribers.set(subscriberId, { path, callback });
    
    return () => {
      this.subscribers.delete(subscriberId);
    };
  }

  /**
   * Disparar ação
   */
  dispatch(action) {
    const newState = this.reducer(this.state, action);
    this.setState(newState);
  }

  /**
   * Reducer de estado
   */
  reducer(state, action) {
    switch (action.type) {
      case 'SET_USER':
        return { ...state, user: action.payload, error: null };
      case 'SET_SESSION':
        return { ...state, session: action.payload, error: null };
      case 'SET_RECORDS':
        return { ...state, records: action.payload, error: null };
      case 'SET_LOCATIONS':
        return { ...state, locations: action.payload, error: null };
      case 'SET_LOADING':
        return { ...state, loading: action.payload, error: null };
      case 'SET_ERROR':
        return { ...state, error: action.payload, loading: false };
      case 'CLEAR_USER':
        return { ...state, user: null, session: null, records: [], error: null };
      case 'ADD_RECORD':
        return { ...state, records: [...state.records, action.payload] };
      case 'UPDATE_RECORD':
        return {
          ...state,
          records: state.records.map(r => 
            r.id === action.payload.id ? { ...r, ...action.payload } : r
          )
        };
      default:
        return state;
    }
  }

  /**
   * Selecionar parte específica do estado
   */
  select(selector) {
    return selector(this.state);
  }

  /**
   * Limpar estado
   */
  clear() {
    this.setState({
      user: null,
      session: null,
      records: [],
      locations: [],
      loading: false,
      error: null
    });
  }
}