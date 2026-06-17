import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

const WMS_URL = import.meta.env.VITE_WMS_URL || 'http://localhost:3000';
const STORAGE_KEY = 'whaka_auth';

function loadSession() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        return JSON.parse(raw);
    } catch { return {}; }
}

function saveSession(user, wmsToken, wmsUser) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, wmsToken, wmsUser }));
}

function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
}

// Login al WMS con reintentos — sobrevive el "cold start" de Render free
// (el backend puede tardar o devolver 502 mientras despierta).
async function wmsLogin(email, password, intentos = 4) {
    if (!email || !password) return { token: null, user: null };
    for (let i = 0; i < intentos; i++) {
        try {
            const res = await fetch(`${WMS_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (res.ok) {
                const data = await res.json();
                return { token: data.token || null, user: data.user || null };
            }
        } catch (_) {
            // red / cold start — reintentar
        }
        if (i < intentos - 1) await new Promise(r => setTimeout(r, 2500));
    }
    return { token: null, user: null };
}

export function AuthProvider({ children }) {
    const saved = loadSession();
    const [user, setUser] = useState(saved.user || null);
    const [wmsToken, setWmsToken] = useState(saved.wmsToken || null);
    const [wmsUser, setWmsUser] = useState(saved.wmsUser || null);

    const login = useCallback(async (userData) => {
        setUser(userData);
        const { token, user: wUser } = await wmsLogin(userData.email, userData.password);
        setWmsToken(token);
        setWmsUser(wUser);
        saveSession(userData, token, wUser);
    }, []);

    // Si hay sesión pero falta el token del WMS (ej. el login ocurrió durante un
    // cold start), recuperarlo al cargar. Las páginas re-cargan sus datos solas
    // al llegar el token, porque sus fetch dependen de wmsToken.
    useEffect(() => {
        if (user && !wmsToken && user.email && user.password) {
            wmsLogin(user.email, user.password).then(({ token, user: wUser }) => {
                if (token) {
                    setWmsToken(token);
                    setWmsUser(wUser);
                    saveSession(user, token, wUser);
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setWmsToken(null);
        setWmsUser(null);
        clearSession();
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, wmsToken, wmsUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
