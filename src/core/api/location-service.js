/**
 * Core Location Service
 * Gerencia toda a lógica de localização e geofencing
 */

export class LocationService {
  constructor(supabaseClient, stateManager) {
    this.supabase = supabaseClient;
    this.stateManager = stateManager;
  }

  /**
   * Obter locais permitidos
   */
  async getActiveLocations() {
    try {
      this.stateManager.dispatch({ type: 'SET_LOADING', payload: true });

      const { data: locations, error } = await this.supabase
        .from('locais_permitidos')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;

      this.stateManager.dispatch({ type: 'SET_LOCATIONS', payload: locations });

      return locations;
    } catch (error) {
      console.error('Erro ao buscar locais:', error);
      this.stateManager.dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      this.stateManager.dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  /**
   * Validar localização do usuário
   */
  async validateLocation(latitude, longitude, allowedLocations = null) {
    if (!allowedLocations) {
      allowedLocations = await this.getActiveLocations();
    }

    const userLocation = { latitude, longitude };

    const closestLocation = allowedLocations
      .map(location => ({
        ...location,
        distance: this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          location.latitude,
          location.longitude
        )
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    if (closestLocation && closestLocation.distance <= closestLocation.raio_metros) {
      return {
        isValid: true,
        location: closestLocation,
        distance: closestLocation.distance
      };
    }

    return {
      isValid: false,
      location: closestLocation,
      distance: closestLocation.distance,
      error: `Você está a ${Math.round(closestLocation.distance)}m de "${closestLocation.nome}" (raio permitido: ${closestLocation.raio_metros}m)`
    };
  }

  /**
   * Calcular distância entre dois pontos (fórmula de Haversine)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distância em metros
  }

  /**
   * Obter localização atual do usuário
   */
  async getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada pelo navegador'));
        return;
      }

      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      };

      navigator.geolocation.getCurrentPosition(
        position => resolve(position.coords),
        error => reject(this.getGeolocationError(error)),
        { ...defaultOptions, ...options }
      );
  /**
   * Criar novo local (admin only)
   */
  async createLocation(locationData, userId) {
    try {
      const { data: newLocation, error } = await this.supabase
        .from('locais_permitidos')
        .insert({
          ...locationData,
          created_by: userId
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar estado local
      const currentLocations = this.stateManager.select(state => state.locations);
      this.stateManager.dispatch({ 
        type: 'SET_LOCATIONS', 
        payload: [...currentLocations, newLocation] 
      });

      return newLocation;
    } catch (error) {
      console.error('Erro ao criar local:', error);
      this.stateManager.dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }

  /**
   * Atualizar local (admin only)
   */
  async updateLocation(locationId, updates) {
    try {
      const { data: updatedLocation, error } = await this.supabase
        .from('locais_permitidos')
        .update(updates)
        .eq('id', locationId)
        .select()
        .single();

      if (error) throw error;

      // Atualizar estado local
      const currentLocations = this.stateManager.select(state => state.locations);
      this.stateManager.dispatch({ 
        type: 'SET_LOCATIONS', 
        payload: currentLocations.map(loc => 
          loc.id === locationId ? updatedLocation : loc
        ) 
      });

      return updatedLocation;
    } catch (error) {
      console.error('Erro ao atualizar local:', error);
      this.stateManager.dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }

  /**
   * Deletar local (admin only)
   */
  async deleteLocation(locationId) {
    try {
      const { error } = await this.supabase
        .from('locais_permitidos')
        .delete()
        .eq('id', locationId);

      if (error) throw error;

      // Atualizar estado local
      const currentLocations = this.stateManager.select(state => state.locations);
      this.stateManager.dispatch({ 
        type: 'SET_LOCATIONS', 
        payload: currentLocations.filter(loc => loc.id !== locationId) 
      });

      return true;
    } catch (error) {
      console.error('Erro ao deletar local:', error);
      this.stateManager.dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }

  /**
   * Ativar/desativar local (admin only)
   */
  async setLocationActive(locationId, active) {
    return await this.updateLocation(locationId, { ativo: active });
  }
}
    });
  }

  /**
   * Obter mensagem de erro de geolocalização
   */
  getGeolocationError(error) {
    switch(error.code) {
      case error.PERMISSION_DENIED:
        return new Error('Permissão de localização negada');
      case error.POSITION_UNAVAILABLE:
        return new Error('Informações de localização indisponíveis');
      case error.TIMEOUT:
        return new Error('Tempo limite excedido para obter localização');
      default:
        return new Error('Erro desconhecido ao obter localização');
    }
  }