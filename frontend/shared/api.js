/**
 * Shared API client.
 *
 * Every dashboard/shop/auction page includes this file and calls `api.get`,
 * `api.post`, etc. It automatically attaches the auth token (Phase 2+) and
 * unwraps the standard { success, data, error } envelope from the backend.
 *
 * Because the Express server also serves the frontend as static files
 * (see backend/server.js), a relative base URL works for both dev and
 * production without any config.
 */

const API_BASE_URL = '/api';

class ApiError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const token = window.auth ? window.auth.getToken() : null;

  const finalHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new ApiError('Network error — is the backend server running?', 0, 'NETWORK_ERROR');
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON response (e.g. server crashed) — fall through to generic error below.
  }

  if (!response.ok || !payload || payload.success === false) {
    const message = payload && payload.error ? payload.error.message : `Request failed (${response.status})`;
    const code = payload && payload.error ? payload.error.code : 'UNKNOWN_ERROR';
    throw new ApiError(message, response.status, code);
  }

  return payload.data;
}

const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  ApiError,
};

window.api = api;
