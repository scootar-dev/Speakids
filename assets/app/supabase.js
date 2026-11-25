// Supabase REST client. No remote script is required to start local lessons.
(function (global) {
  'use strict';
  const CFG = 'speakids.supabase.cfg';
  let session = null;
  let refreshing = null;
  let queue = Promise.resolve();
  let generation = 0;
  function config() {
    try { return { ...(global.SPEAKIDS_CONFIG || {}), ...JSON.parse(localStorage.getItem(CFG) || '{}') }; }
    catch (_) { return {}; }
  }
  function sessionKey() { return (global.SPEAKIDS_ADMIN ? 'speakids.admin.auth.' : 'speakids.auth.') + (config().url || ''); }
  function storeSession(value) {
    session = value;
    if (value) localStorage.setItem(sessionKey(), JSON.stringify(value));
    else localStorage.removeItem(sessionKey());
  }
  async function request(path, { method = 'GET', body, token } = {}) {
    const cfg = config();
    if (!cfg.url || !cfg.anonKey) throw new Error('Supabase belum dikonfigurasi.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(cfg.url + path, {
        method, signal: controller.signal,
        headers: { apikey: cfg.anonKey, ...(token ? { Authorization: 'Bearer ' + token } : {}), 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
      const text = await response.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch (_) { data = null; }
      if (!response.ok) {
        const error = new Error(data?.msg || data?.message || data?.error_description || 'Permintaan cloud gagal (' + response.status + ').');
        error.status = response.status;
        throw error;
      }
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Koneksi Supabase melewati 15 detik. Periksa internet dan status proyek di dashboard Supabase.');
      if (error instanceof TypeError) throw new Error('Tidak dapat menghubungi ' + cfg.url + '. Periksa Project URL (bukan URL dashboard), internet, dan status proyek Supabase. Buka admin melalui http://localhost:3000/admin/index.html.');
      throw error;
    } finally { clearTimeout(timeout); }
  }
  function acceptSession(data) {
    if (!data?.access_token || !data?.user) return null;
    storeSession({ ...data, expires_at: data.expires_at || Math.floor(Date.now() / 1000) + data.expires_in });
    return session.user;
  }
  async function token() {
    if (!session) throw new Error('Masuk ke akun terlebih dahulu.');
    if (session.expires_at > Date.now() / 1000 + 60) return session.access_token;
    if (!refreshing) {
      const version = generation;
      refreshing = request('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: session.refresh_token } })
        .then(data => {
          if (version !== generation) throw new Error('Akun berubah. Ulangi sinkronisasi.');
          acceptSession(data);
          return session.access_token;
        }).finally(() => { refreshing = null; });
    }
    return refreshing;
  }
  global.SpeaCloud = {
    async getPronunciationToken() {
      if (!this.isReady()) return null;
      if (!session) {
        await this.checkSession();
        if (!session) {
          const data = await request('/auth/v1/signup', {method:'POST',body:{}});
          acceptSession(data);
        }
      }
      return await token();
    },
    async isAdmin() {
      const rows = await request('/rest/v1/content_admins?select=user_id', { token: await token() });
      return rows.length > 0;
    },
    async getLevels() { return await request('/rest/v1/learning_levels?select=*&order=category_id,level_index'); },
    async saveLevel(row, revision) {
      return await request('/rest/v1/rpc/save_learning_level', { method:'POST', token:await token(), body:{
        c:row.category_id,l:row.level_index,t:row.title,body:row.items,enabled:row.published,expected_revision:revision
      }});
    },
    getConfig: config,
    isReady() { const c = config(); return Boolean(c.url && c.anonKey); },
    setConfig(url, anonKey) {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') throw new Error('Gunakan Project URL HTTPS tanpa path tambahan.');
      if (['supabase.com', 'www.supabase.com', 'supabase.co', 'www.supabase.co'].includes(parsed.hostname)) throw new Error('Gunakan Project URL proyek, misalnya https://abcdefgh.supabase.co, bukan alamat dashboard Supabase.');
      if (!anonKey.trim()) throw new Error('Anon/publishable key wajib diisi.');
      generation++;
      storeSession(null);
      localStorage.setItem(CFG, JSON.stringify({ url: parsed.origin, anonKey: anonKey.trim() }));
    },
    getCurrentUser() { return session?.user || null; },
    getAccountKey() { return session ? config().url + ':' + session.user.id : null; },
    async checkSession() {
      if (!this.isReady()) return null;
      if (!session) {
        try { session = JSON.parse(localStorage.getItem(sessionKey()) || 'null'); } catch (_) { session = null; }
      }
      if (!session) return null;
      try {
        const user = await request('/auth/v1/user', { token: await token() });
        session.user = user;
        return user;
      } catch (error) {
        if ([400, 401, 403].includes(error.status)) storeSession(null);
        throw error;
      }
    },
    async register(email, password, name, grade) {
      const data = await request('/auth/v1/signup', { method: 'POST', body: { email, password, data: { name, grade } } });
      generation++;
      storeSession(null);
      return { user: acceptSession(data), requiresConfirmation: !data.access_token };
    },
    async login(email, password) {
      const data = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } });
      generation++;
      return acceptSession(data);
    },
    async logout() {
      const accessToken = session?.access_token;
      generation++;
      storeSession(null);
      if (accessToken) await request('/auth/v1/logout', { method: 'POST', token: accessToken });
    },
    async pullUserData() {
      const version = generation;
      const data = await request('/rest/v1/rpc/speakids_snapshot', { method: 'POST', body: {}, token: await token() });
      if (version !== generation) throw new Error('Akun berubah.');
      return data;
    },
    async pushUserData(profile) {
      const version = generation;
      const snapshot = JSON.parse(JSON.stringify(profile));
      const task = queue.catch(() => {}).then(async () => {
        if (version !== generation) throw new Error('Akun berubah.');
        const accessToken = await token();
        if (version !== generation) throw new Error('Akun berubah.');
        const result = await request('/rest/v1/rpc/speakids_sync', {
          method: 'POST', token: accessToken, body: { payload: snapshot }
        });
        if (version !== generation) throw new Error('Akun berubah.');
        return result;
      });
      queue = task;
      return task;
    },
    async getLeaderboard() {
      return await request('/rest/v1/profiles?select=name,grade,stars&order=stars.desc&limit=10', { token: session ? await token() : undefined }) || [];
    }
  };
})(window);
