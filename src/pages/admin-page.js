/**
 * Admin Page Module
 * Componente específico para a página de administração
 */

import { app } from '../core/application.js';
import { chronos, getPerfilUsuario, ehAdmin } from '../legacy/chronos-compat.js';
import { Formatters } from '../utils/formatters.js';
import { logger } from '../utils/logger.js';

class AdminPage {
  constructor() {
    this.usuario = null;
    this.isAdmin = false;
    
    this.adminPanel = document.getElementById('adminPanel');
    this.usersTable = document.getElementById('usersTable');
    this.locationsTable = document.getElementById('locationsTable');
    
    this.init();
  }

  async init() {
    try {
      // Verificar autenticação e permissões
      const autenticado = await chronos.estaAutenticado();
      if (!autenticado) {
        window.location.href = 'index.html';
        return;
      }

      this.usuario = await getPerfilUsuario();
      this.isAdmin = await ehAdmin();
      
      if (!this.isAdmin) {
        chronos.showAlert('Acesso negado. Permissões de administrador necessárias.', 'error');
        // Redirecionar para página principal após delay
        setTimeout(() => {
          window.location.href = 'ponto.html';
        }, 3000);
        return;
      }
      
      // Configurar painel admin
      this.setupAdminPanel();
      
      // Carregar dados iniciais
      await this.carregarDadosAdmin();
      
      logger.info('Página de administração inicializada');
    } catch (error) {
      logger.error('Erro ao inicializar página de administração', { error: error.message });
      chronos.showAlert('Erro ao carregar página de administração', 'error');
    }
  }

  /**
   * Configurar painel admin
   */
  setupAdminPanel() {
    if (this.adminPanel) {
      this.adminPanel.innerHTML = `
        <div class="admin-header">
          <h2>Painel Administrativo</h2>
          <p>Bem-vindo, ${this.usuario.nome} (Admin)</p>
        </div>
        
        <div class="admin-tabs">
          <button class="tab-btn active" data-tab="usuarios">Usuários</button>
          <button class="tab-btn" data-tab="locais">Locais</button>
          <button class="tab-btn" data-tab="relatorios">Relatórios</button>
        </div>
        
        <div class="admin-content">
          <div id="usuariosTab" class="tab-content active">
            <h3>Gerenciamento de Usuários</h3>
            <table id="usersTable" class="admin-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Matrícula</th>
                  <th>Email</th>
                  <th>Categoria</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody id="usersTableBody">
                <!-- Conteúdo será carregado dinamicamente -->
              </tbody>
            </table>
          </div>
          
          <div id="locaisTab" class="tab-content">
            <h3>Gerenciamento de Locais</h3>
            <table id="locationsTable" class="admin-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Coordenadas</th>
                  <th>Raio (m)</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody id="locationsTableBody">
                <!-- Conteúdo será carregado dinamicamente -->
              </tbody>
            </table>
          </div>
          
          <div id="relatoriosTab" class="tab-content">
            <h3>Relatórios</h3>
            <div class="reports-section">
              <button class="btn btn-primary" id="gerarRelatorioBtn">Gerar Relatório Mensal</button>
              <button class="btn btn-secondary" id="exportarDadosBtn">Exportar Dados</button>
            </div>
          </div>
        </div>
      `;
  /**
   * Carregar dados de administração
   */
  async carregarDadosAdmin() {
    try {
      // Carregar usuários
      await this.carregarUsuarios();
      
      // Carregar locais
      await this.carregarLocais();
      
      // Configurar eventos
      this.setupAdminEvents();
      
    } catch (error) {
      logger.error('Erro ao carregar dados de administração', { error: error.message });
      chronos.showAlert('Erro ao carregar dados de administração', 'error');
    }
  }

  /**
   * Carregar lista de usuários
   */
  async carregarUsuarios() {
    try {
      // Esta funcionalidade exigiria permissões especiais no Supabase
      // Para isso, você precisaria criar uma função RPC ou policy específica
      
      const usersTableBody = document.getElementById('usersTableBody');
      if (!usersTableBody) return;
      
      // Simular carregamento (substituir com chamada real ao backend)
      usersTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">Carregando usuários...</td>
        </tr>
      `;
      
      // Aqui você faria a chamada real para obter usuários
      // Exemplo: const usuarios = await this.obterUsuarios();
      
    } catch (error) {
      logger.error('Erro ao carregar usuários', { error: error.message });
    }
  }

  /**
   * Carregar lista de locais
   */
  async carregarLocais() {
    try {
      const locationsTableBody = document.getElementById('locationsTableBody');
      if (!locationsTableBody) return;
      
      // Simular carregamento (substituir com chamada real ao backend)
      locationsTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">Carregando locais...</td>
        </tr>
      `;
      
      // Aqui você faria a chamada real para obter locais
      // Exemplo: const locais = await this.obterLocais();
      
    } catch (error) {
      logger.error('Erro ao carregar locais', { error: error.message });
    }
  }

  /**
   * Configurar eventos de administração
   */
  setupAdminEvents() {
    // Eventos para relatórios
    const gerarRelatorioBtn = document.getElementById('gerarRelatorioBtn');
    if (gerarRelatorioBtn) {
      gerarRelatorioBtn.addEventListener('click', () => this.gerarRelatorioMensal());
    }
    
    const exportarDadosBtn = document.getElementById('exportarDadosBtn');
    if (exportarDadosBtn) {
      exportarDadosBtn.addEventListener('click', () => this.exportarDadosGerais());
    }
  }

  /**
   * Gerar relatório mensal
   */
  async gerarRelatorioMensal() {
    try {
      chronos.showAlert('Funcionalidade de relatório mensal em desenvolvimento', 'info');
      // Implementação futura para geração de relatórios
    } catch (error) {
      logger.error('Erro ao gerar relatório mensal', { error: error.message });
      chronos.showAlert('Erro ao gerar relatório mensal', 'error');
    }
  }

  /**
   * Exportar dados gerais
   */
  async exportarDadosGerais() {
    try {
      chronos.showAlert('Funcionalidade de exportação de dados em desenvolvimento', 'info');
      // Implementação futura para exportação de dados
    } catch (error) {
      logger.error('Erro ao exportar dados gerais', { error: error.message });
      chronos.showAlert('Erro ao exportar dados gerais', 'error');
    }
  }
}

// Inicializar componente quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    new AdminPage();
  });
} else {
  new AdminPage();
}

// Exportar para possível uso em outros módulos
export default AdminPage;
      
      // Configurar navegação entre abas
      this.setupTabNavigation();
    }
  }

  /**
   * Configurar navegação entre abas
   */
  setupTabNavigation() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = e.currentTarget.getAttribute('data-tab');
        this.showTab(tabName);
      });
    });
  }

  /**
   * Mostrar aba específica
   */
  showTab(tabName) {
    // Remover classe ativa de todas as abas e botões
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Adicionar classe ativa à aba e botão selecionados
    document.getElementById(`${tabName}Tab`).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  }