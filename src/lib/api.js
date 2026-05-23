const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

function getAdminToken() {
  return sessionStorage.getItem('adminToken');
}

async function request(method, path, { body, admin = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (admin) {
    const token = getAdminToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (admin && res.status === 401) {
    sessionStorage.removeItem('adminToken');
    // Only bounce to /admin/login if the user is actually inside the admin
    // panel. A stray admin call from a public page must NOT redirect customers.
    if (
      typeof window !== 'undefined' &&
      window.location.pathname.startsWith('/admin') &&
      !window.location.pathname.startsWith('/admin/login')
    ) {
      window.location.href = '/admin/login';
    }
  }

  // The server returns JSON for both success and structured errors, but
  // upstream layers (express-rate-limit, Render's proxy, a crashed worker)
  // can send plain text. Parse defensively so users see a real error
  // message instead of "Unexpected token 'T'".
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : { ok: false, error: { code: 'EMPTY_RESPONSE', message: 'Empty response from server' } };
  } catch {
    // Non-JSON body — map common cases to user-readable codes.
    const code = res.status === 429 ? 'RATE_LIMITED'
      : res.status >= 500 ? 'SERVER_ERROR'
      : 'BAD_RESPONSE';
    const message = res.status === 429
      ? 'تم تجاوز الحد المسموح من الطلبات. حاول بعد قليل.'
      : (text.slice(0, 200) || `HTTP ${res.status}`);
    const err = new Error(message);
    err.code = code;
    err.status = res.status;
    throw err;
  }
  if (!json.ok) {
    const err = new Error(json.error?.message || 'API error');
    err.code = json.error?.code;
    err.status = res.status;
    throw err;
  }
  return json.data;
}

export const apiGet = (path, opts) => request('GET', path, opts);
export const apiPost = (path, body, opts) => request('POST', path, { body, ...opts });
export const apiPut = (path, body, opts) => request('PUT', path, { body, ...opts });
export const apiPatch = (path, body, opts) => request('PATCH', path, { body, ...opts });
export const apiDelete = (path, opts) => request('DELETE', path, opts);

// ── Convenience helpers ──────────────────────────────────────────────────────

export const productsApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined)).toString();
    return apiGet(`/products${q ? `?${q}` : ''}`);
  },
  getById: (id) => apiGet(`/products/${id}`),
};

export const ordersApi = {
  create: (payload) => apiPost('/orders', payload),
  preview: (payload) => apiPost('/orders/preview', payload),
  getById: (id) => apiGet(`/orders/${id}`),
};

export const offersApi = {
  list: () => apiGet('/offers'),
};

export const feedbackApi = {
  list: () => apiGet('/feedback'),
  submit: (payload) => apiPost('/feedback', payload),
};

export const settingsApi = {
  getPublic: () => apiGet('/settings/public'),
};

export const authApi = {
  login: (username, password) => apiPost('/auth/login', { username, password }),
  me: () => apiGet('/auth/me', { admin: true }),
};

export const adminApi = {
  stats: () => apiGet('/admin/stats', { admin: true }),

  // Products
  products: {
    list: (params = {}) => {
      const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined)).toString();
      return apiGet(`/admin/products${q ? `?${q}` : ''}`, { admin: true });
    },
    create: (data) => apiPost('/admin/products', data, { admin: true }),
    update: (id, data) => apiPut(`/admin/products/${id}`, data, { admin: true }),
    patch: (id, data) => apiPatch(`/admin/products/${id}`, data, { admin: true }),
    delete: (id) => apiDelete(`/admin/products/${id}`, { admin: true }),
    export: () => apiGet('/admin/products/export', { admin: true }),
    import: (products) => apiPost('/admin/products/import', products, { admin: true }),
    bulkTiers: (payload) => apiPost('/admin/products/bulk-tiers', payload, { admin: true }),
  },

  // Orders
  orders: {
    list: (params = {}) => {
      const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined)).toString();
      return apiGet(`/admin/orders${q ? `?${q}` : ''}`, { admin: true });
    },
    getById: (id) => apiGet(`/admin/orders/${id}`, { admin: true }),
    patch: (id, data) => apiPatch(`/admin/orders/${id}`, data, { admin: true }),
  },

  // Offers
  offers: {
    list: () => apiGet('/admin/offers', { admin: true }),
    create: (data) => apiPost('/admin/offers', data, { admin: true }),
    update: (id, data) => apiPut(`/admin/offers/${id}`, data, { admin: true }),
    delete: (id) => apiDelete(`/admin/offers/${id}`, { admin: true }),
  },

  // Feedback
  feedback: {
    list: () => apiGet('/admin/feedback', { admin: true }),
    create: (data) => apiPost('/admin/feedback', data, { admin: true }),
    patch: (id, data) => apiPatch(`/admin/feedback/${id}`, data, { admin: true }),
    delete: (id) => apiDelete(`/admin/feedback/${id}`, { admin: true }),
  },

  // Settings
  settings: {
    get: () => apiGet('/admin/settings', { admin: true }),
    update: (data) => apiPut('/admin/settings', data, { admin: true }),
  },
};
