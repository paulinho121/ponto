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
          'primary':                   '#004ac6',
          'on-primary':                '#ffffff',
          'primary-container':         '#2563eb',
          'on-primary-container':      '#eeefff',
          'primary-fixed':             '#dbe1ff',
          'primary-fixed-dim':         '#b4c5ff',
          'on-primary-fixed':          '#00174b',
          'on-primary-fixed-variant':  '#003ea8',
          'secondary':                 '#006591',
          'on-secondary':              '#ffffff',
          'secondary-container':       '#39b8fd',
          'on-secondary-container':    '#004666',
          'secondary-fixed':           '#c9e6ff',
          'secondary-fixed-dim':       '#89ceff',
          'on-secondary-fixed':        '#001e2f',
          'on-secondary-fixed-variant':'#004c6e',
          'tertiary':                  '#006242',
          'on-tertiary':               '#ffffff',
          'tertiary-container':        '#007d55',
          'on-tertiary-container':     '#bdffdb',
          'tertiary-fixed':            '#6ffbbe',
          'tertiary-fixed-dim':        '#4edea3',
          'on-tertiary-fixed':         '#002113',
          'on-tertiary-fixed-variant': '#005236',
          'error':                     '#ba1a1a',
          'on-error':                  '#ffffff',
          'error-container':           '#ffdad6',
          'on-error-container':        '#93000a',
          'background':                '#faf8ff',
          'on-background':             '#131b2e',
          'surface':                   '#faf8ff',
          'surface-dim':               '#d2d9f4',
          'surface-bright':            '#faf8ff',
          'surface-container-lowest':  '#ffffff',
          'surface-container-low':     '#f2f3ff',
          'surface-container':         '#eaedff',
          'surface-container-high':    '#e2e7ff',
          'surface-container-highest': '#dae2fd',
          'on-surface':                '#131b2e',
          'on-surface-variant':        '#434655',
          'outline':                   '#737686',
          'outline-variant':           '#c3c6d7',
          'inverse-surface':           '#283044',
          'inverse-on-surface':        '#eef0ff',
          'inverse-primary':           '#b4c5ff',
          'surface-tint':              '#0053db',
          'surface-variant':           '#dae2fd',
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

  async savePunch(action, time) {
    return this.savePunches({ [action]: time });
  },

  // Registra múltiplos horários de uma vez (ex: almoço + saída, para quem
  // encerra o dia na hora do almoço e não vai retornar).
  async savePunches(fields) {
    const user = this.getUser();
    const { data, error } = await window.chronosSupabase
      .from('ponto_registros')
      .upsert({ user_id: user.id, data: this._todayStr(), ...fields }, { onConflict: 'user_id,data' })
      .select()
      .single();
    if (error) throw error;
    return this._mapRecord(data);
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

  // Renderiza a foto do usuário no elemento (ou as iniciais, sem foto)
  renderAvatar(element, name, avatarUrl) {
    if (avatarUrl) {
      element.innerHTML = `<img src="${avatarUrl}" class="w-full h-full object-cover" alt="Foto de perfil"/>`;
      return;
    }
    const initials = this.getInitialsAvatar(name);
    element.innerHTML = `
      <div class="w-full h-full bg-primary flex items-center justify-center rounded-full">
        <span class="text-white font-bold text-sm">${initials}</span>
      </div>`;
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
