/**
 * API Client Wrapper — WhakaChile Orquestador
 * Maneja autenticación JWT, fetch, y errores globales.
 */
const ApiClient = (() => {
    const TOKEN_KEY = 'whaka_token';
    const USER_KEY = 'whaka_user';

    function getToken() {
        return sessionStorage.getItem(TOKEN_KEY);
    }

    function setToken(token) {
        sessionStorage.setItem(TOKEN_KEY, token);
    }

    function getUser() {
        const raw = sessionStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    }

    function setUser(user) {
        sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    function clearSession() {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
    }

    function isAuthenticated() {
        return !!getToken();
    }

    async function request(method, path, body = null) {
        const headers = { 'Content-Type': 'application/json' };
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = { method, headers };
        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(path, options);

        if (response.status === 401) {
            clearSession();
            window.location.hash = '#login';
            throw new Error('Sesión expirada');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error ${response.status}`);
        }

        return response.json();
    }

    async function login(email, password) {
        const data = await request('POST', '/api/auth/login', { email, password });
        setToken(data.token);
        setUser(data.user);
        return data;
    }

    function logout() {
        clearSession();
        window.location.hash = '#login';
    }

    return {
        getToken,
        setToken,
        getUser,
        setUser,
        isAuthenticated,
        login,
        logout,
        get: (path) => request('GET', path),
        post: (path, body) => request('POST', path, body),
        put: (path, body) => request('PUT', path, body),
        del: (path) => request('DELETE', path),
        // Health check no necesita auth
        health: () => fetch('/health').then(r => r.json()),
        // Multipart upload (auth required)
        uploadFile: async (path, formData) => {
            const headers = {};
            const token = getToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(path, { method: 'POST', headers, body: formData });
            if (response.status === 401) { clearSession(); window.location.hash = '#login'; throw new Error('Sesión expirada'); }
            if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.message || `Error ${response.status}`); }
            return response.json();
        },
        // Public endpoints (sin auth — para portal cliente)
        publicGet: async (path) => {
            const response = await fetch(path);
            if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.message || `Error ${response.status}`); }
            return response.json();
        },
        publicPost: async (path, formData) => {
            const isFormData = formData instanceof FormData;
            const options = { method: 'POST', body: isFormData ? formData : JSON.stringify(formData) };
            if (!isFormData) options.headers = { 'Content-Type': 'application/json' };
            const response = await fetch(path, options);
            if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.message || `Error ${response.status}`); }
            return response.json();
        },
    };
})();
