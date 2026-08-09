/**
 * Core Authentication Service
 * Gerencia toda a lógica de autenticação e sessão
 */

export class AuthService {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.currentUser = null;
    this.currentSession = null;
  }

  /**
   * Login com matrícula e senha
   */
  async loginWithMatricula(matricula, senha) {
    try {
      // Primeiro obtemos o email correspondente à matrícula
      const { data: email, error: lookupError } = await this.supabase
        .rpc('email_by_matricula', { p_matricula: matricula });

      if (lookupError) {
        throw new Error('Matrícula ou senha inválidos.');
      }

      if (!email) {
        throw new Error('Matrícula não encontrada.');
      }

      // Realiza o login com email e senha
      const { data: signInData, error: signInError } = await this.supabase.auth
        .signInWithPassword({
          email: email,
          password: senha
        });

      if (signInError) {
        throw new Error(signInError.message);
      }

      this.currentSession = signInData.session;
      this.currentUser = await this.fetchUserProfile();

      return signInData;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  /**
   * Cadastro de novo usuário
   */
  async signUp(userData) {
    try {
      // Extrai os dados necessários
      const { email, senha, nome, matricula, categoria, lab, orientador, cargaHoras, telefone } = userData;

      // Primeiro cria o usuário no Auth
      const { data: signUpData, error: signUpError } = await this.supabase.auth
        .signUp({
          email,
          password: senha,
          options: {
            data: {
              nome,
              matricula,
              categoria,
              lab,
              orientador,
              cargaHoras: cargaHoras || 20,
              telefone
            }
          }
        });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      // Atualiza o profile com os dados adicionais
      if (signUpData.user) {
        await this.updateUserProfile(signUpData.user.id, {
          nome,
          matricula,
          categoria,
          lab,
          orientador,
          cargaHoras: cargaHoras || 20,
          telefone,
          email
        });
      }

      return signUpData;
    } catch (error) {
      console.error('Erro no cadastro:', error);
      throw error;
    }
  }

  /**
   * Logout
   */
  async logout() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      
      this.currentUser = null;
      this.currentSession = null;
      
      return true;
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  }

  /**
   * Obter sessão atual
   */
  async getCurrentSession() {
    if (!this.currentSession) {
      const { data: { session } } = await this.supabase.auth.getSession();
      this.currentSession = session;
    }
    return this.currentSession;
  }

  /**
   * Verificar se está autenticado
   */
  async isAuthenticated() {
    const session = await this.getCurrentSession();
    return !!session;
  }

  /**
   * Obter perfil do usuário
   */
  async getUserProfile() {
    if (!this.currentUser) {
      this.currentUser = await this.fetchUserProfile();
    }
    return this.currentUser;
  }

  /**
   * Buscar perfil do usuário no banco
   */
  async fetchUserProfile() {
    const session = await this.getCurrentSession();
    if (!session) return null;

    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }

    return profile;
  }

  /**
   * Atualizar perfil do usuário
   */
  async updateUserProfile(userId, updates) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }

    return data;
  }

  /**
   * Verificar se é admin
   */
  async isAdmin() {
    const profile = await this.getUserProfile();
    return profile?.is_admin === true;
  }
}