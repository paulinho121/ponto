/**
 * Chronos.js — Motor Compartilhado v1.0
 * Sistema de Gestão de Ponto para Pesquisa Acadêmica
 */

// ─────────────────────────────────────────────────────────────────────────────
// TEMA (claro/escuro)
// Aplica a classe .dark no <html> ANTES do render (evita "flash") e injeta as
// variáveis de cor (canais RGB). Ligar um botão é só dar a ele o atributo
// data-theme-toggle — o clique é conectado automaticamente. Respeita a escolha
// salva (localStorage) e, na ausência dela, a preferência do sistema.
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  var STORAGE = 'chronos-theme';
  function preferred() {
    try { var s = localStorage.getItem(STORAGE); if (s === 'dark' || s === 'light') return s; } catch (e) {}
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  document.documentElement.classList.toggle('dark', preferred() === 'dark');

  var VARS_LIGHT = ":root{--c-primary:19 32 88;--c-on-primary:255 255 255;--c-primary-container:219 224 255;--c-on-primary-container:0 18 77;--c-primary-fixed:219 224 255;--c-primary-fixed-dim:178 188 255;--c-on-primary-fixed:0 18 77;--c-on-primary-fixed-variant:47 60 126;--c-secondary:85 97 143;--c-on-secondary:255 255 255;--c-secondary-container:218 225 255;--c-on-secondary-container:22 27 55;--c-secondary-fixed:218 225 255;--c-secondary-fixed-dim:179 193 244;--c-on-secondary-fixed:22 27 55;--c-on-secondary-fixed-variant:61 74 104;--c-tertiary:246 168 18;--c-on-tertiary:59 44 0;--c-tertiary-container:255 231 176;--c-on-tertiary-container:42 30 0;--c-tertiary-fixed:255 231 176;--c-tertiary-fixed-dim:246 201 94;--c-on-tertiary-fixed:40 28 0;--c-on-tertiary-fixed-variant:92 71 0;--c-error:186 26 26;--c-on-error:255 255 255;--c-error-container:255 218 214;--c-on-error-container:147 0 10;--c-background:250 248 255;--c-on-background:19 27 46;--c-surface:250 248 255;--c-surface-dim:214 217 238;--c-surface-bright:250 248 255;--c-surface-container-lowest:255 255 255;--c-surface-container-low:243 244 255;--c-surface-container:236 238 254;--c-surface-container-high:230 232 248;--c-surface-container-highest:224 227 242;--c-on-surface:19 27 46;--c-on-surface-variant:67 70 86;--c-outline:115 118 136;--c-outline-variant:195 198 215;--c-inverse-surface:40 48 68;--c-inverse-on-surface:238 240 255;--c-inverse-primary:178 188 255;--c-surface-tint:19 32 88;--c-surface-variant:224 227 242;}";
  var VARS_DARK = "html.dark{--c-primary:74 92 200;--c-on-primary:255 255 255;--c-primary-container:43 54 114;--c-on-primary-container:219 224 255;--c-primary-fixed:219 224 255;--c-primary-fixed-dim:178 188 255;--c-on-primary-fixed:0 18 77;--c-on-primary-fixed-variant:200 208 255;--c-secondary:155 166 214;--c-on-secondary:255 255 255;--c-secondary-container:46 54 82;--c-on-secondary-container:218 225 255;--c-secondary-fixed:218 225 255;--c-secondary-fixed-dim:179 193 244;--c-on-secondary-fixed:218 225 255;--c-on-secondary-fixed-variant:179 193 244;--c-tertiary:251 183 51;--c-on-tertiary:59 44 0;--c-tertiary-container:74 58 14;--c-on-tertiary-container:255 231 176;--c-tertiary-fixed:255 231 176;--c-tertiary-fixed-dim:246 201 94;--c-on-tertiary-fixed:40 28 0;--c-on-tertiary-fixed-variant:246 201 94;--c-error:226 77 77;--c-on-error:255 255 255;--c-error-container:92 20 20;--c-on-error-container:255 218 214;--c-background:14 20 36;--c-on-background:228 231 244;--c-surface:14 20 36;--c-surface-dim:10 15 28;--c-surface-bright:35 44 68;--c-surface-container-lowest:11 17 31;--c-surface-container-low:21 29 49;--c-surface-container:25 34 58;--c-surface-container-high:33 43 69;--c-surface-container-highest:42 52 79;--c-on-surface:228 231 244;--c-on-surface-variant:180 186 208;--c-outline:139 144 166;--c-outline-variant:57 65 90;--c-inverse-surface:228 231 244;--c-inverse-on-surface:40 48 68;--c-inverse-primary:19 32 88;--c-surface-tint:74 92 200;--c-surface-variant:42 52 79;}";
  // Ajustes para cores "cruas" que não usam tokens — só no escuro (o claro fica igual)
  var OVERRIDES =
    ":root{color-scheme:light}html.dark{color-scheme:dark}" +
    "html.dark body{background-color:#0e1424 !important}" +
    "html.dark .glass{background:rgba(16,22,40,.82) !important}" +
    "html.dark .bg-white{background-color:#141c31 !important}" +
    "html.dark .bg-white\\/85{background-color:rgba(20,28,49,.85) !important}" +
    "html.dark .bg-slate-50{background-color:#151d31 !important}" +
    "html.dark .border-slate-200{border-color:#2a3247 !important}";

  var st = document.createElement('style');
  st.id = 'chronos-theme-vars';
  st.textContent = VARS_LIGHT + VARS_DARK + OVERRIDES;
  (document.head || document.documentElement).appendChild(st);

  function syncUI() {
    var dark = document.documentElement.classList.contains('dark');
    document.querySelectorAll('[data-theme-toggle] .theme-ico').forEach(function (el) {
      el.textContent = dark ? 'light_mode' : 'dark_mode';
    });
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', dark ? 'true' : 'false');
    });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0e1424' : '#132058');
  }

  window.ChronosTheme = {
    get: function () { return document.documentElement.classList.contains('dark') ? 'dark' : 'light'; },
    set: function (t) {
      document.documentElement.classList.toggle('dark', t === 'dark');
      try { localStorage.setItem(STORAGE, t); } catch (e) {}
      syncUI();
    },
    toggle: function () { this.set(this.get() === 'dark' ? 'light' : 'dark'); },
  };

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () { window.ChronosTheme.toggle(); });
    });
    syncUI();
  });
})();

// ─────────────────────────────────────────────────────────────────────────────
// TAILWIND CONFIG UNIFICADO
// ─────────────────────────────────────────────────────────────────────────────
if (typeof tailwind !== 'undefined') {
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        // As cores viram variáveis CSS (canais RGB) — ver o bootstrap de tema no
        // topo deste arquivo. Assim o mesmo utilitário (bg-surface, text-on-surface,
        // bg-primary/30, etc.) se adapta ao tema claro/escuro só trocando a classe
        // .dark no <html>, inclusive com os modificadores de opacidade.
        colors: {
          'primary':                  'rgb(var(--c-primary) / <alpha-value>)',
          'on-primary':               'rgb(var(--c-on-primary) / <alpha-value>)',
          'primary-container':        'rgb(var(--c-primary-container) / <alpha-value>)',
          'on-primary-container':     'rgb(var(--c-on-primary-container) / <alpha-value>)',
          'primary-fixed':            'rgb(var(--c-primary-fixed) / <alpha-value>)',
          'primary-fixed-dim':        'rgb(var(--c-primary-fixed-dim) / <alpha-value>)',
          'on-primary-fixed':         'rgb(var(--c-on-primary-fixed) / <alpha-value>)',
          'on-primary-fixed-variant': 'rgb(var(--c-on-primary-fixed-variant) / <alpha-value>)',
          'secondary':                'rgb(var(--c-secondary) / <alpha-value>)',
          'on-secondary':             'rgb(var(--c-on-secondary) / <alpha-value>)',
          'secondary-container':      'rgb(var(--c-secondary-container) / <alpha-value>)',
          'on-secondary-container':   'rgb(var(--c-on-secondary-container) / <alpha-value>)',
          'secondary-fixed':          'rgb(var(--c-secondary-fixed) / <alpha-value>)',
          'secondary-fixed-dim':      'rgb(var(--c-secondary-fixed-dim) / <alpha-value>)',
          'on-secondary-fixed':       'rgb(var(--c-on-secondary-fixed) / <alpha-value>)',
          'on-secondary-fixed-variant':'rgb(var(--c-on-secondary-fixed-variant) / <alpha-value>)',
          'tertiary':                 'rgb(var(--c-tertiary) / <alpha-value>)',
          'on-tertiary':              'rgb(var(--c-on-tertiary) / <alpha-value>)',
          'tertiary-container':       'rgb(var(--c-tertiary-container) / <alpha-value>)',
          'on-tertiary-container':    'rgb(var(--c-on-tertiary-container) / <alpha-value>)',
          'tertiary-fixed':           'rgb(var(--c-tertiary-fixed) / <alpha-value>)',
          'tertiary-fixed-dim':       'rgb(var(--c-tertiary-fixed-dim) / <alpha-value>)',
          'on-tertiary-fixed':        'rgb(var(--c-on-tertiary-fixed) / <alpha-value>)',
          'on-tertiary-fixed-variant':'rgb(var(--c-on-tertiary-fixed-variant) / <alpha-value>)',
          'error':                    'rgb(var(--c-error) / <alpha-value>)',
          'on-error':                 'rgb(var(--c-on-error) / <alpha-value>)',
          'error-container':          'rgb(var(--c-error-container) / <alpha-value>)',
          'on-error-container':       'rgb(var(--c-on-error-container) / <alpha-value>)',
          'background':               'rgb(var(--c-background) / <alpha-value>)',
          'on-background':            'rgb(var(--c-on-background) / <alpha-value>)',
          'surface':                  'rgb(var(--c-surface) / <alpha-value>)',
          'surface-dim':              'rgb(var(--c-surface-dim) / <alpha-value>)',
          'surface-bright':           'rgb(var(--c-surface-bright) / <alpha-value>)',
          'surface-container-lowest': 'rgb(var(--c-surface-container-lowest) / <alpha-value>)',
          'surface-container-low':    'rgb(var(--c-surface-container-low) / <alpha-value>)',
          'surface-container':        'rgb(var(--c-surface-container) / <alpha-value>)',
          'surface-container-high':   'rgb(var(--c-surface-container-high) / <alpha-value>)',
          'surface-container-highest':'rgb(var(--c-surface-container-highest) / <alpha-value>)',
          'on-surface':               'rgb(var(--c-on-surface) / <alpha-value>)',
          'on-surface-variant':       'rgb(var(--c-on-surface-variant) / <alpha-value>)',
          'outline':                  'rgb(var(--c-outline) / <alpha-value>)',
          'outline-variant':          'rgb(var(--c-outline-variant) / <alpha-value>)',
          'inverse-surface':          'rgb(var(--c-inverse-surface) / <alpha-value>)',
          'inverse-on-surface':       'rgb(var(--c-inverse-on-surface) / <alpha-value>)',
          'inverse-primary':          'rgb(var(--c-inverse-primary) / <alpha-value>)',
          'surface-tint':             'rgb(var(--c-surface-tint) / <alpha-value>)',
          'surface-variant':          'rgb(var(--c-surface-variant) / <alpha-value>)',
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

  async signUp({ nome, matricula, categoria, lab, orientador, cargaHoras, email, telefone, senha, conviteToken }) {
    // conviteToken é obrigatório: o gate real (handle_new_user) rejeita o
    // cadastro no servidor se o token faltar/for inválido, mas mandamos aqui
    // para que a validação aconteça na mesma transação do signUp.
    const { data, error } = await window.chronosSupabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome, matricula, categoria, lab, orientador, carga_horas: cargaHoras, telefone, convite_token: conviteToken } },
    });
    if (error) throw error;
    return data; // data.session existe se a confirmação de email estiver desativada no projeto
  },

  // ── Convites (cadastro por convite) ───────────────────────────────────────
  // Valida um token de convite (público, chamado na tela de cadastro antes de
  // exibir o formulário). Retorna { valido, motivo?, email?, nome? }.
  async validateInvite(token) {
    const { data, error } = await window.chronosSupabase
      .rpc('validar_convite', { p_token: token });
    if (error) throw error;
    return data || { valido: false, motivo: 'inexistente' };
  },

  // Cria um convite (super admin). Retorna { id, token }.
  async createInvite({ email, nome, expiraDias } = {}) {
    const { data, error } = await window.chronosSupabase
      .rpc('criar_convite', {
        p_email: email || null,
        p_nome: nome || null,
        p_expira_dias: (expiraDias === null || expiraDias === undefined) ? 7 : expiraDias,
      });
    if (error) throw error;
    return data; // { id, token }
  },

  // Lista todos os convites (super admin). RLS garante o acesso.
  async listInvites() {
    const { data, error } = await window.chronosSupabase
      .from('convites').select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async deleteInvite(id) {
    const { error } = await window.chronosSupabase
      .from('convites').delete().eq('id', id);
    if (error) throw error;
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

  async updateLocation(id, { nome, latitude, longitude, raioMetros }) {
    const { data, error } = await window.chronosSupabase
      .from('locais_permitidos')
      .update({ nome, latitude, longitude, raio_metros: raioMetros })
      .eq('id', id)
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
  // Promove (ou rebaixa) outro usuário a super administrador. O RPC valida
  // que quem chama é admin e impede remover o próprio acesso.
  async setUserAdmin(userId, isAdmin) {
    const { error } = await window.chronosSupabase
      .rpc('set_user_admin', { p_user_id: userId, p_is_admin: isAdmin });
    if (error) throw new Error(error.message || 'Não foi possível alterar o privilégio.');
  },

  // Logs de auditoria (só super admin — garantido pelo RLS). Os nomes de quem
  // fez / quem foi afetado são resolvidos no cliente a partir da lista de perfis.
  async listAuditLogs({ limit = 150 } = {}) {
    const { data, error } = await window.chronosSupabase
      .from('audit_logs').select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  // ── Correções de ponto (usuário solicita, super admin aprova) ─────────────
  async submitCorrection({ data, entrada, almoco, retorno, saida, motivo }) {
    const user = this.getUser();
    const { data: row, error } = await window.chronosSupabase
      .from('correcao_pedidos')
      .insert({
        user_id: user.id, data,
        entrada: entrada || null, almoco: almoco || null,
        retorno: retorno || null, saida: saida || null,
        motivo,
      })
      .select().single();
    if (error) throw new Error(error.message || 'Não foi possível enviar a solicitação.');
    return row;
  },

  async listMyCorrections() {
    const user = this.getUser();
    const { data, error } = await window.chronosSupabase
      .from('correcao_pedidos').select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Admin: lista solicitações (por padrão as pendentes primeiro)
  async listCorrections({ onlyPending = false } = {}) {
    let q = window.chronosSupabase.from('correcao_pedidos').select('*');
    if (onlyPending) q = q.eq('status', 'pendente');
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Admin: aprova/rejeita. Ao aprovar, os horários são aplicados ao ponto.
  async reviewCorrection(id, aprovar, resposta) {
    const { data, error } = await window.chronosSupabase
      .rpc('revisar_correcao', { p_id: id, p_aprovar: aprovar, p_resposta: resposta || null });
    if (error) throw new Error(error.message || 'Não foi possível revisar a solicitação.');
    return data;
  },

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
  async getRecordsForReport({ from, to, userId } = {}) {
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

  // Melhor localização possível num curto intervalo. Uma única leitura de GPS
  // costuma devolver o PRIMEIRO fixo disponível (Wi-Fi/celular, impreciso, com
  // centenas/milhares de metros de erro) antes de o GPS travar. Aqui usamos
  // watchPosition por até maxWait ms, guardando a leitura mais precisa, e
  // resolvemos assim que chega uma boa o suficiente (accuracy <= goodEnough).
  // Isso reduz muito o falso "você está distante do local".
  getBestPosition({ maxWait = 9000, goodEnough = 50 } = {}) {
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
      let best = null, done = false, watchId = null;
      const finish = (err) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (watchId !== null) { try { navigator.geolocation.clearWatch(watchId); } catch (e) {} }
        if (best) resolve(best);
        else reject(err || new Error('Não foi possível obter sua localização.'));
      };
      const timer = setTimeout(() => finish(), maxWait);
      try {
        watchId = navigator.geolocation.watchPosition(
          pos => {
            const c = pos.coords;
            if (!best || c.accuracy < best.accuracy) {
              best = { latitude: c.latitude, longitude: c.longitude, accuracy: c.accuracy };
            }
            if (best.accuracy <= goodEnough) finish(); // já é preciso o bastante
          },
          err => { if (!best) finish(new Error(ERROR_MESSAGES[err.code] || 'Não foi possível obter sua localização.')); },
          { enableHighAccuracy: true, timeout: maxWait, maximumAge: 0 }
        );
      } catch (e) {
        finish(e);
      }
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
