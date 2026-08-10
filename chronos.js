/**
 * Chronos.js — Motor Compartilhado v1.0
 * Sistema de Gestão de Ponto para Pesquisa Acadêmica
 */

// ─────────────────────────────────────────────────────────────────────────────
// TAILWIND CONFIG UNIFICADO
// ─────────────────────────────────────────────────────────────────────────────
if (typeof tailwind !== 'undefined') {
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          'primary':                   '#132058',
          'on-primary':                '#ffffff',
          'primary-container':         '#dbe0ff',
          'on-primary-container':      '#00124d',
          'primary-fixed':             '#dbe0ff',
          'primary-fixed-dim':         '#b2bcff',
          'on-primary-fixed':          '#00124d',
          'on-primary-fixed-variant':  '#2f3c7e',
          'secondary':                 '#55618f',
          'on-secondary':              '#ffffff',
          'secondary-container':       '#dae1ff',
          'on-secondary-container':    '#161b37',
          'secondary-fixed':           '#dae1ff',
          'secondary-fixed-dim':       '#b3c1f4',
          'on-secondary-fixed':        '#161b37',
          'on-secondary-fixed-variant':'#3d4a68',
          'tertiary':                  '#F6A812',
          'on-tertiary':               '#3b2c00',
          'tertiary-container':        '#ffe7b0',
          'on-tertiary-container':     '#2a1e00',
          'tertiary-fixed':            '#ffe7b0',
          'tertiary-fixed-dim':        '#f6c95e',
          'on-tertiary-fixed':         '#281c00',
          'on-tertiary-fixed-variant': '#5c4700',
          'error':                     '#ba1a1a',
          'on-error':                  '#ffffff',
          'error-container':           '#ffdad6',
          'on-error-container':        '#93000a',
          'background':                '#faf8ff',
          'on-background':             '#131b2e',
          'surface':                   '#faf8ff',
          'surface-dim':               '#d6d9ee',
          'surface-bright':            '#faf8ff',
          'surface-container-lowest':  '#ffffff',
          'surface-container-low':     '#f3f4ff',
          'surface-container':         '#eceefe',
          'surface-container-high':    '#e6e8f8',
          'surface-container-highest': '#e0e3f2',
          'on-surface':                '#131b2e',
          'on-surface-variant':        '#434656',
          'outline':                   '#737688',
          'outline-variant':           '#c3c6d7',
          'inverse-surface':           '#283044',
          'inverse-on-surface':        '#eef0ff',
          'inverse-primary':           '#b2bcff',
          'surface-tint':              '#132058',
          'surface-variant':           '#e0e3f2',
        },
        borderRadius: {
          DEFAULT: '0.25rem',
          lg: '0.5rem',
          xl: '0.75rem',
          '2xl': '16px',
          '3xl': '24px',
          full: '9999px',
        },
        spacing: {
          base: '4px',
          xs: '8px',
          sm: '12px',
          md: '16px',
          lg: '24px',
          xl: '32px',
          gutter: '16px',
          'container-margin': '20px',
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
        },
        fontSize: {
          'label-xs':          ['10px', { lineHeight: '12px', fontWeight: '600' }],
          'label-sm':          ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '500' }],
          'body-md':           ['14px', { lineHeight: '20px', fontWeight: '400' }],
          'body-lg':           ['16px', { lineHeight: '24px', fontWeight: '400' }],
          'title-md':          ['18px', { lineHeight: '24px', fontWeight: '600' }],
          'headline-lg-mobile':['20px', { lineHeight: '28px', fontWeight: '600' }],
          'headline-lg':       ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '600' }],
          'display-lg':        ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        },
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CHRONOS STATE — Sessão local (cache) + dados reais no Supabase
// ─────────────────────────────────────────────────────────────────────────────
const ChronosState = {
  KEYS: {
    USER: 'chronos_user', // cache local do perfil da sessão ativa (não é a fonte da verdade)
  },

  // ── Cache local do usuário logado ─────────────────────────────────────────
  getUser() {
    try { return JSON.parse(localStorage.getItem(this.KEYS.USER)); } catch { return null; }
  },
  setUser(userData) {
    localStorage.setItem(this.KEYS.USER, JSON.stringify(userData));
  },
  clearUser() {
    localStorage.removeItem(this.KEYS.USER);
  },

  _mapProfile(row) {
    if (!row) return null;
    return {
      id:         row.id,
      nome:       row.nome,
      matricula:  row.matricula,
      categoria:  row.categoria,
      lab:        row.lab,
      orientador: row.orientador,
      cargaHoras: row.carga_horas,
      telefone:   row.telefone,
      email:      row.email,
      avatarUrl:  row.avatar_url,
      isAdmin:    !!row.is_admin,
    };
  },

  // ── Sessão / autenticação ─────────────────────────────────────────────────
  async getSession() {
    const { data } = await window.chronosSupabase.auth.getSession();
    return data.session;
  },

  async fetchProfile(userId) {
    const { data, error } = await window.chronosSupabase
      .from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return this._mapProfile(data);
  },

  async loginWithMatricula(matricula, senha) {
    const { data: email, error: lookupError } = await window.chronosSupabase
      .rpc('email_by_matricula', { p_matricula: matricula });
    if (lookupError || !email) throw new Error('Matrícula ou senha inválidos.');

    const { data, error } = await window.chronosSupabase.auth
      .signInWithPassword({ email, password: senha });
    if (error) throw new Error('Matrícula ou senha inválidos.');

    const profile = await this.fetchProfile(data.user.id);
    this.setUser(profile);
    return profile;
  },

  async signUp({ nome, matricula, categoria, lab, orientador, cargaHoras, email, telefone, senha }) {
    const { data, error } = await window.chronosSupabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome, matricula, categoria, lab, orientador, carga_horas: cargaHoras, telefone } },
    });
    if (error) throw error;
    return data; // data.session existe se a confirmação de email estiver desativada no projeto
  },

  async updateProfile(patch) {
    const user = this.getUser();
    const { data, error } = await window.chronosSupabase
      .from('profiles')
      .update({
        nome:        patch.nome,
        lab:         patch.lab,
        orientador:  patch.orientador,
        telefone:    patch.telefone,
        carga_horas: patch.cargaHoras,
      })
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    const profile = this._mapProfile(data);
    this.setUser(profile);
    return profile;
  },

  async updateAvatarUrl(url) {
    if (!/^https?:\/\//i.test(String(url || ''))) {
      throw new Error('URL de avatar inválida.');
    }
    const user = this.getUser();
    const { data, error } = await window.chronosSupabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    const profile = this._mapProfile(data);
    this.setUser(profile);
    return profile;
  },

  // Envia a foto (já redimensionada, ver ChronosUI.resizeImageFile) para o
  // bucket "avatars" e grava a URL pública no perfil. Sempre grava no mesmo
  // caminho (um arquivo por usuário), sobrescrevendo a foto anterior.
  async uploadAvatar(fileOrBlob) {
    const user = this.getUser();
    const path = `${user.id}/avatar.jpg`;
    const { error: uploadError } = await window.chronosSupabase.storage
      .from('avatars')
      .upload(path, fileOrBlob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' });
    if (uploadError) throw uploadError;

    const { data } = window.chronosSupabase.storage.from('avatars').getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    return this.updateAvatarUrl(url);
  },

  // ── Registros de ponto (tabela ponto_registros) ──────────────────────────
  _todayStr() {
    return new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD no fuso local
  },
  _mapRecord(row) {
    const trim = t => (t ? t.slice(0, 5) : null);
    return {
      date:    row.data,
      entrada: trim(row.entrada),
      almoco:  trim(row.almoco),
      retorno: trim(row.retorno),
      saida:   trim(row.saida),
    };
  },
  _createEmptyRecord() {
    return { date: this._todayStr(), entrada: null, almoco: null, retorno: null, saida: null };
  },

  async getTodayRecord() {
    const user = this.getUser();
    const { data, error } = await window.chronosSupabase
      .from('ponto_registros').select('*')
      .eq('user_id', user.id).eq('data', this._todayStr())
      .maybeSingle();
    if (error) throw error;
    return data ? this._mapRecord(data) : this._createEmptyRecord();
  },

  async getHistory() {
    const user = this.getUser();
    const { data, error } = await window.chronosSupabase
      .from('ponto_registros').select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: false });
    if (error) throw error;
    return (data || []).map(r => this._mapRecord(r));
  },

  // Fluxo do ponto — próxima ação disponível
  // Obs: se a saída já foi batida (ex: quem encerra o dia no horário do
  // almoço, sem retorno), o dia está encerrado independente do retorno.
  getNextPunchAction(record) {
    if (!record.entrada) return 'entrada';
    if (record.saida)    return 'done';
    if (!record.almoco)  return 'almoco';
    if (!record.retorno) return 'retorno';
    return 'saida';
  },

  // ── Locais permitidos para bater o ponto (super admin) ───────────────────
  async listLocations() {
    const { data, error } = await window.chronosSupabase
      .from('locais_permitidos').select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getActiveLocations() {
    const { data, error } = await window.chronosSupabase
      .from('locais_permitidos').select('*').eq('ativo', true);
    if (error) throw error;
    return data || [];
  },

  async createLocation({ nome, latitude, longitude, raioMetros }) {
    const user = this.getUser();
    const { data, error } = await window.chronosSupabase
      .from('locais_permitidos')
      .insert({ nome, latitude, longitude, raio_metros: raioMetros, created_by: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async setLocationActive(id, ativo) {
    const { error } = await window.chronosSupabase
      .from('locais_permitidos').update({ ativo }).eq('id', id);
    if (error) throw error;
  },

  async deleteLocation(id) {
    const { error } = await window.chronosSupabase
      .from('locais_permitidos').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Admin (super admin): usuários, pontos esquecidos e relatórios ────────
  async listAllProfiles() {
    const { data, error } = await window.chronosSupabase
      .from('profiles').select('*').order('nome');
    if (error) throw error;
    return (data || []).map(r => this._mapProfile(r));
  },

  // Retorna o registro de ponto de um usuário em uma data (null se não houver)
  async getPunchFor(userId, data) {
    const { data: row, error } = await window.chronosSupabase
      .from('ponto_registros').select('*')
      .eq('user_id', userId).eq('data', data)
      .maybeSingle();
    if (error) throw error;
    return row ? this._mapRecord(row) : { date: data, entrada: null, almoco: null, retorno: null, saida: null };
  },

  // Grava/atualiza o dia de ponto de um usuário como admin (ponto esquecido).
  // Campos vazios são gravados como null (permite corrigir/limpar horários).
  async saveAdminPunch({ userId, data, entrada, almoco, retorno, saida }) {
    const payload = {
      user_id: userId,
      data,
      entrada: entrada || null,
      almoco:  almoco  || null,
      retorno: retorno || null,
      saida:   saida   || null,
    };
    const { data: row, error } = await window.chronosSupabase
      .from('ponto_registros')
      .upsert(payload, { onConflict: 'user_id,data' })
      .select()
      .single();
    if (error) throw error;
    return this._mapRecord(row);
  },

  // Registros de ponto com dados do usuário, dentro de um período (relatório)
  async getRecordsForReport({ from, to, userId }) {
    let query = window.chronosSupabase
      .from('ponto_registros')
      .select('*, profiles(nome, matricula)')
      .gte('data', from)
      .lte('data', to)
      .order('data', { ascending: true });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(r => ({
      userId:   r.user_id,
      nome:     r.profiles?.nome || '',
      matricula: r.profiles?.matricula || '',
      date:     r.data,
      entrada:  r.entrada ? r.entrada.slice(0, 5) : null,
      almoco:   r.almoco  ? r.almoco.slice(0, 5)  : null,
      retorno:  r.retorno ? r.retorno.slice(0, 5) : null,
      saida:    r.saida   ? r.saida.slice(0, 5)   : null,
    }));
  },

  // Duração trabalhada de um dia já gravado (minutos), sem usar o horário atual
  calcDayMinutes(record) {
    const toMin = t => (t ? t.split(':').slice(0, 2).map(Number).reduce((h, m) => h * 60 + m) : null);
    let total = 0;
    const entrada = toMin(record.entrada);
    const almoco  = toMin(record.almoco);
    const retorno = toMin(record.retorno);
    const saida   = toMin(record.saida);
    if (entrada !== null) {
      const fimManha = almoco !== null ? almoco : saida;
      if (fimManha !== null) total += Math.max(0, fimManha - entrada);
    }
    if (retorno !== null && saida !== null) {
      total += Math.max(0, saida - retorno);
    }
    return total;
  },

  // Distância entre duas coordenadas em metros (fórmula de Haversine)
  distanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = d => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  // Calcula minutos trabalhados no dia
  calcWorkedMinutes(record) {
    let total = 0;
    const now = new Date();

    const toMin = (timeStr) => {
      if (!timeStr) return null;
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const entradaMin = toMin(record.entrada);
    const almocoMin  = toMin(record.almoco);
    const retornoMin = toMin(record.retorno);
    const saidaMin   = toMin(record.saida);
    const nowMin     = now.getHours() * 60 + now.getMinutes();

    if (entradaMin !== null) {
      const fim1 = almocoMin !== null ? almocoMin : nowMin;
      total += Math.max(0, fim1 - entradaMin);
    }
    if (retornoMin !== null) {
      const fim2 = saidaMin !== null ? saidaMin : nowMin;
      total += Math.max(0, fim2 - retornoMin);
    }
    return total;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CHRONOS NAV — Navegação entre páginas
// ─────────────────────────────────────────────────────────────────────────────
const ChronosNav = {
  go(page) {
    window.location.href = page;
  },
  async requireAuth() {
    if (!window.chronosSupabase) {
      ChronosUI.showToast('Configuração do Supabase ausente (supabase-config.js).', 'error', 6000);
      return false;
    }
    const session = await ChronosState.getSession();
    if (!session) {
      window.location.href = 'index.html';
      return false;
    }
    let user = ChronosState.getUser();
    if (!user || user.id !== session.user.id) {
      user = await ChronosState.fetchProfile(session.user.id);
      ChronosState.setUser(user);
    }
    return true;
  },
  async logout() {
    await window.chronosSupabase.auth.signOut();
    ChronosState.clearUser();
    window.location.href = 'index.html';
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CHRONOS UI — Utilitários de Interface
// ─────────────────────────────────────────────────────────────────────────────
const ChronosUI = {
  // Formata minutos → "Xh YYmin"
  formatDuration(totalMinutes) {
    if (totalMinutes <= 0) return '0h 00min';
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${String(m).padStart(2, '0')}min`;
  },

  // Hora atual formatada HH:MM
  nowTime() {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
  },

  // Exibe toast/snackbar
  showToast(message, type = 'success', duration = 3000) {
    const existing = document.getElementById('chronos-toast');
    if (existing) existing.remove();

    const colors = {
      success: 'border-tertiary/30 text-tertiary',
      error:   'border-error/30 text-error',
      info:    'border-primary/30 text-primary',
    };
    const icons = { success: 'check_circle', error: 'error', info: 'info' };

    const toast = document.createElement('div');
    toast.id = 'chronos-toast';
    toast.className = `fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] 
      bg-white/90 backdrop-blur-xl border ${colors[type]} 
      px-lg py-sm rounded-2xl shadow-xl 
      flex items-center gap-sm
      transition-all duration-300 opacity-0 translate-y-4`;
    toast.innerHTML = `
      <span class="material-symbols-outlined text-[20px]" style="font-variation-settings:'FILL' 1">${icons[type]}</span>
      <span class="font-body-md text-body-md text-on-surface">${message}</span>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('opacity-0', 'translate-y-4');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-4');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Exibe modal de bloqueio (ex: ponto negado por localização). Se a página
  // não tiver o modal no HTML, cai no toast normal como alternativa.
  showLocationDeniedModal(message) {
    const modal = document.getElementById('modal-location-denied');
    const msgEl = document.getElementById('modal-location-denied-msg');
    if (!modal || !msgEl) {
      this.showToast(message, 'error', 6000);
      return;
    }
    msgEl.textContent = message;
    modal.classList.remove('hidden');
  },

  hideLocationDeniedModal() {
    const modal = document.getElementById('modal-location-denied');
    if (modal) modal.classList.add('hidden');
  },

  // Configura micro-interações padrão em todos os elementos clicáveis
  setupMicroInteractions() {
    document.querySelectorAll('button, a').forEach(el => {
      el.addEventListener('mousedown', () => { el.style.transform = 'scale(0.96)'; });
      el.addEventListener('mouseup',   () => { el.style.transform = ''; });
      el.addEventListener('mouseleave',() => { el.style.transform = ''; });
    });
  },

  // Obtém a localização GPS atual do navegador (Promise)
  getCurrentPosition(options = {}) {
    const ERROR_MESSAGES = {
      1: 'Permissão de localização negada. Habilite o acesso à localização no navegador.',
      2: 'Não foi possível determinar sua localização (sinal de GPS indisponível).',
      3: 'Tempo esgotado ao tentar obter sua localização.',
    };
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não é suportada neste navegador.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy:  pos.coords.accuracy,
        }),
        err => reject(new Error(ERROR_MESSAGES[err.code] || 'Não foi possível obter sua localização.')),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0, ...options }
      );
    });
  },

  // Avatar padrão (iniciais do nome)
  getInitialsAvatar(name, size = 40) {
    const parts = (name || 'Usuário').trim().split(' ');
    const initials = parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0].slice(0, 2);
    return initials.toUpperCase();
  },

  // Renderiza a foto do usuário no elemento (ou as iniciais, sem foto).
  // Monta o <img> via createElement (nunca innerHTML) e só aceita URLs
  // http/https — impede injeção de HTML/script via avatar_url.
  renderAvatar(element, name, avatarUrl) {
    element.innerHTML = '';
    const safeUrl = this.safeAvatarUrl(avatarUrl);
    if (safeUrl) {
      const img = document.createElement('img');
      img.src = safeUrl;
      img.alt = 'Foto de perfil';
      img.className = 'w-full h-full object-cover';
      img.referrerPolicy = 'no-referrer';
      element.appendChild(img);
      return;
    }
    const initials = this.getInitialsAvatar(name);
    element.innerHTML = `
      <div class="w-full h-full bg-primary flex items-center justify-center rounded-full">
        <span class="text-white font-bold text-sm">${initials}</span>
      </div>`;
  },

  // Aceita apenas URLs http/https como avatar. Bloqueia javascript:, data:,
  // e qualquer esquema perigoso; retorna null quando não é segura.
  safeAvatarUrl(url) {
    if (!url || typeof url !== 'string') return null;
    try {
      const u = new URL(url, window.location.href);
      return (u.protocol === 'http:' || u.protocol === 'https:') ? u.href : null;
    } catch {
      return null;
    }
  },

  // Redimensiona uma imagem no navegador (canvas) antes do upload, evitando
  // enviar fotos de câmera enormes para o storage. Retorna um Blob JPEG.
  resizeImageFile(file, maxDim = 512, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
          else { width = Math.round((width * maxDim) / height); height = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Não foi possível processar a imagem.'))),
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Arquivo de imagem inválido.'));
      };
      img.src = url;
    });
  },

  // ── Notificações / avisos de versão ──────────────────────────────────────
  // Os avisos ficam em notices.json (editado por mim a cada versão). O sino
  // mostra um badge com o total de avisos ainda não lidos (guardado no
  // localStorage) e abre o painel de avisos ao ser clicado.
  NOTICES_URL: 'notices.json',
  NOTICES_READ_KEY: 'chronos:notices:read',

  escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  },

  async fetchNotices() {
    const res = await fetch(`${this.NOTICES_URL}?v=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.notices) ? data.notices : [];
  },

  getReadNoticeKeys() {
    try {
      const raw = localStorage.getItem(this.NOTICES_READ_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  },

  noticeKey(n) {
    return `${n.version}:${n.title}`;
  },

  // Configura o sino: badge de não-lidos e abertura do painel de avisos.
  async initNotifications(bellSelector = '#btn-notifications') {
    const bell = document.querySelector(bellSelector);
    if (!bell) return;

    const badge = document.createElement('span');
    badge.className = 'absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-error text-white text-[11px] font-bold flex items-center justify-center shadow';
    badge.style.display = 'none';
    bell.classList.add('relative');
    bell.appendChild(badge);

    let notices = [];
    try {
      notices = await this.fetchNotices();
      const read = this.getReadNoticeKeys();
      const unread = notices.filter((n) => !read.includes(this.noticeKey(n)));
      if (unread.length > 0) {
        badge.textContent = unread.length > 9 ? '9+' : String(unread.length);
        badge.style.display = 'flex';
      }
    } catch (e) {
      // offline ou arquivo ausente: sem badge, painel vazio
    }

    bell.addEventListener('click', () => this.showNoticesModal(notices));
  },

  // Abre o painel de atualizações e marca todos os avisos como lidos.
  showNoticesModal(notices) {
    const existing = document.getElementById('notices-modal');
    if (existing) existing.remove();

    const empty = !notices || notices.length === 0;
    const items = (notices || []).map((n, i) => `
      <div class="p-sm rounded-2xl bg-surface-container/60 border border-outline-variant/20 ${i > 0 ? 'mt-sm' : ''}">
        <div class="flex items-center gap-sm flex-wrap">
          <span class="text-label-sm font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">v${this.escapeHtml(n.version)}</span>
          <span class="text-label-sm text-on-surface-variant">${this.escapeHtml(n.date)}</span>
        </div>
        <p class="mt-1 font-semibold text-on-surface">${this.escapeHtml(n.title)}</p>
        ${n.body ? `<p class="mt-0.5 text-body-md text-on-surface-variant">${this.escapeHtml(n.body)}</p>` : ''}
      </div>
    `).join('');

    const modal = document.createElement('div');
    modal.id = 'notices-modal';
    modal.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-lg space-y-md fade-up max-h-[70vh] overflow-y-auto">
        <div class="flex justify-between items-center">
          <h2 class="text-title-md font-bold text-on-surface flex items-center gap-sm">
            <span class="material-symbols-outlined text-primary" style="font-variation-settings:'FILL' 1">notifications</span>
            Atualizações
          </h2>
          <button id="btn-close-notices" type="button" class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors" aria-label="Fechar">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        ${empty
          ? '<p class="text-body-md text-on-surface-variant">Nenhuma notificação por enquanto.</p>'
          : `<div>${items}</div>`}
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#btn-close-notices').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    if (!empty) {
      const read = this.getReadNoticeKeys();
      notices.forEach((n) => {
        const k = this.noticeKey(n);
        if (!read.includes(k)) read.push(k);
      });
      localStorage.setItem(this.NOTICES_READ_KEY, JSON.stringify(read));
      const badge = document.querySelector('#btn-notifications .absolute');
      if (badge) badge.style.display = 'none';
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURAÇÃO DOS BOTÕES DE PONTO (definição de estados)
// ─────────────────────────────────────────────────────────────────────────────
const PUNCH_CONFIG = {
  entrada: {
    label:   'Registrar Entrada',
    icon:    'login',
    color:   'bg-primary shadow-primary/30',
    next:    'almoco',
  },
  almoco: {
    label:   'Registrar Almoço',
    icon:    'restaurant',
    color:   'bg-secondary shadow-secondary/30',
    next:    'retorno',
  },
  retorno: {
    label:   'Registrar Retorno',
    icon:    'keyboard_return',
    color:   'bg-secondary shadow-secondary/30',
    next:    'saida',
  },
  saida: {
    label:   'Registrar Saída',
    icon:    'logout',
    color:   'bg-error shadow-error/30',
    next:    'done',
  },
  done: {
    label:   'Jornada Encerrada',
    icon:    'check_circle',
    color:   'bg-tertiary-container shadow-tertiary/30',
    next:    null,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PWA — registro do service worker (permite instalar o app na tela inicial)
// ─────────────────────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
