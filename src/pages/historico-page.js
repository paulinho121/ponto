/**
 * Histórico Page Module
 * Componente específico para a página de histórico de ponto
 */

import { app } from '../core/application.js';
import { chronos, getRegistros, getPerfilUsuario } from '../legacy/chronos-compat.js';
import { Formatters } from '../utils/formatters.js';
import { logger } from '../utils/logger.js';

class HistoricoPage {
  constructor() {
    this.usuario = null;
    this.registros = [];
    
    this.historicoContainer = document.getElementById('historicoContainer');
    this.mesSelect = document.getElementById('mesSelect');
    this.anoSelect = document.getElementById('anoSelect');
    this.filtrarBtn = document.getElementById('filtrarBtn');
    this.exportarBtn = document.getElementById('exportarBtn');
    
    this.init();
  }

  async init() {
    try {
      // Verificar autenticação
      const autenticado = await chronos.estaAutenticado();
      if (!autenticado) {
        window.location.href = 'index.html';
        return;
      }

      // Obter informações do usuário
      this.usuario = await getPerfilUsuario();
      
      // Configurar filtros
      this.setupFilters();
      
      // Configurar eventos
      this.setupEvents();
      
      // Carregar histórico inicial
      await this.carregarHistorico();
      
      logger.info('Página de histórico inicializada');
    } catch (error) {
      logger.error('Erro ao inicializar página de histórico', { error: error.message });
      chronos.showAlert('Erro ao carregar página de histórico', 'error');
    }
  }

  /**
   * Configurar filtros
   */
  setupFilters() {
    if (this.mesSelect) {
      // Preencher meses
      const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      
      this.mesSelect.innerHTML = '';
      const mesAtual = new Date().getMonth() + 1;
      
      meses.forEach((mes, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = mes;
        option.selected = index + 1 === mesAtual;
        this.mesSelect.appendChild(option);
      });
    }

    if (this.anoSelect) {
      // Preencher anos (últimos 5 anos)
      const anoAtual = new Date().getFullYear();
      this.anoSelect.innerHTML = '';
      
      for (let i = 2; i >= -2; i--) {
        const ano = anoAtual + i;
        const option = document.createElement('option');
        option.value = ano;
        option.textContent = ano;
        option.selected = i === 0; // Ano atual selecionado por padrão
        this.anoSelect.appendChild(option);
      }
    }
  }

  /**
   * Configurar eventos
   */
  setupEvents() {
    if (this.filtrarBtn) {
      this.filtrarBtn.addEventListener('click', () => this.carregarHistorico());
    }
    
    if (this.exportarBtn) {
      this.exportarBtn.addEventListener('click', () => this.exportarHistorico());
    }
  }

  /**
   * Carregar histórico
   */
  async carregarHistorico() {
    try {
      chronos.showLoading(true);
  /**
   * Renderizar histórico na tela
   */
  renderizarHistorico() {
    if (!this.historicoContainer) {
      logger.warn('Container de histórico não encontrado');
      return;
    }

    if (this.registros.length === 0) {
      this.historicoContainer.innerHTML = `
        <div class="empty-state">
          <p>Nenhum registro encontrado para o período selecionado.</p>
        </div>
      `;
      return;
    }

    // Calcular totais
    const totais = this.calcularTotais();
    
    // Gerar HTML do histórico
    const historicoHTML = this.registros.map(registro => {
      const duracao = this.calcularDuracaoDia(registro);
      const duracaoFormatada = Formatters.duration.toHoursMinutes(duracao);
      
      return `
        <div class="registro-item">
          <div class="registro-header">
            <span class="registro-data">${Formatters.date.toDisplay(registro.data)}</span>
            <span class="registro-dia">${Formatters.date.getWeekdayName(registro.data)}</span>
            <span class="registro-duracao">Total: ${duracaoFormatada}</span>
          </div>
          <div class="registro-pontos">
            <div class="ponto-item ${registro.entrada ? 'registrado' : 'pendente'}">
              <span class="ponto-label">Entrada:</span>
              <span class="ponto-value">${registro.formattedEntrada}</span>
            </div>
  /**
   * Calcular totais do período
   */
  calcularTotais() {
    let totalHoras = 0;
    let diasTrabalhados = 0;
    
    this.registros.forEach(registro => {
      const duracao = this.calcularDuracaoDia(registro);
      if (duracao > 0) {
        totalHoras += duracao;
        diasTrabalhados++;
      }
    });
    
    const mediaDiaria = diasTrabalhados > 0 ? totalHoras / diasTrabalhados : 0;
    
    return {
      totalHoras,
      diasTrabalhados,
      mediaDiaria
    };
  }

  /**
   * Calcular duração do dia
   */
  calcularDuracaoDia(registro) {
    if (!registro.entrada || !registro.saida) return 0;

    const entrada = new Date(`2000-01-01T${registro.entrada}`);
    const saida = new Date(`2000-01-01T${registro.saida}`);
    
    if (registro.almoco && registro.retorno) {
      const almoco = new Date(`2000-01-01T${registro.almoco}`);
      const retorno = new Date(`2000-01-01T${registro.retorno}`);
      
      const total = (saida - entrada) - (retorno - almoco);
      return Math.max(0, total) / (1000 * 60 * 60) * 60; // Retorna em minutos
    }

    return (saida - entrada) / (1000 * 60 * 60) * 60; // Retorna em minutos
  }

  /**
   * Exportar histórico
   */
  exportarHistorico() {
    if (this.registros.length === 0) {
      chronos.showAlert('Nenhum registro para exportar', 'warning');
      return;
    }

    try {
      // Criar CSV
      const csvContent = this.gerarCSV();
      
      // Criar link de download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const mes = this.mesSelect?.value;
      const ano = this.anoSelect?.value;
      const mesNome = this.mesSelect?.options[this.mesSelect.selectedIndex]?.text;
      
      link.setAttribute('href', url);
      link.setAttribute('download', `historico_ponto_${mes}_${ano}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      logger.info('Histórico exportado com sucesso');
      chronos.showAlert('Histórico exportado com sucesso!', 'success');
    } catch (error) {
      logger.error('Erro ao exportar histórico', { error: error.message });
      chronos.showAlert(`Erro ao exportar histórico: ${error.message}`, 'error');
    }
  }

  /**
   * Gerar conteúdo CSV
   */
  gerarCSV() {
    const cabecalho = ['Data', 'Dia da Semana', 'Entrada', 'Almoço', 'Retorno', 'Saída', 'Duração'];
    const linhas = [cabecalho.join(',')];
    
    this.registros.forEach(registro => {
      const duracao = this.calcularDuracaoDia(registro);
      const duracaoFormatada = Formatters.duration.toHoursMinutes(duracao);
      
      const linha = [
        `"${registro.data}"`,
        `"${Formatters.date.getWeekdayName(registro.data)}"`,
        `"${registro.formattedEntrada}"`,
        `"${registro.formattedAlmoco}"`,
        `"${registro.formattedRetorno}"`,
        `"${registro.formattedSaida}"`,
        `"${duracaoFormatada}"`
      ].join(',');
      
      linhas.push(linha);
    });
    
    return linhas.join('\n');
  }
}

// Inicializar componente quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    new HistoricoPage();
  });
} else {
  new HistoricoPage();
}

// Exportar para possível uso em outros módulos
export default HistoricoPage;
            <div class="ponto-item ${registro.almoco ? 'registrado' : 'pendente'}">
              <span class="ponto-label">Almoço:</span>
              <span class="ponto-value">${registro.formattedAlmoco}</span>
            </div>
            <div class="ponto-item ${registro.retorno ? 'registrado' : 'pendente'}">
              <span class="ponto-label">Retorno:</span>
              <span class="ponto-value">${registro.formattedRetorno}</span>
            </div>
            <div class="ponto-item ${registro.saida ? 'registrado' : 'pendente'}">
              <span class="ponto-label">Saída:</span>
              <span class="ponto-value">${registro.formattedSaida}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Montar HTML completo
    this.historicoContainer.innerHTML = `
      <div class="historico-resumo">
        <div class="resumo-item">
          <h4>Dias Trabalhados</h4>
          <p>${totais.diasTrabalhados}</p>
        </div>
        <div class="resumo-item">
          <h4>Horas Totais</h4>
          <p>${Formatters.duration.toHoursMinutes(totais.totalHoras)}</p>
        </div>
        <div class="resumo-item">
          <h4>Média Diária</h4>
          <p>${Formatters.duration.toHoursMinutes(totais.mediaDiaria)}</p>
        </div>
      </div>
      <div class="historico-lista">
        ${historicoHTML}
      </div>
    `;
  }
      
      const mes = parseInt(this.mesSelect?.value);
      const ano = parseInt(this.anoSelect?.value);
      
      if (!mes || !ano) {
        chronos.showAlert('Selecione mês e ano válidos', 'error');
        return;
      }
      
      // Carregar registros
      this.registros = await getRegistros(mes, ano);
      
      // Renderizar histórico
      this.renderizarHistorico();
      
    } catch (error) {
      logger.error('Erro ao carregar histórico', { error: error.message });
      chronos.showAlert(`Erro ao carregar histórico: ${error.message}`, 'error');
    } finally {
      chronos.showLoading(false);
    }
  }