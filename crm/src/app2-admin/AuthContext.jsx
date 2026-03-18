import React, { createContext, useContext, useState, useCallback } from 'react';

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

export function AuthProvider({ children }) {
    const saved = loadSession();
    const [user, setUser] = useState(saved.user || null);
    const [wmsToken, setWmsToken] = useState(saved.wmsToken || null);
    const [wmsUser, setWmsUser] = useState(saved.wmsUser || null);

    const login = useCallback(async (userData) => {
        setUser(userData);

        let token = null;
        let wUser = null;

        // Auto-login al WMS con las mismas credenciales
        try {
            const res = await fetch(`${WMS_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userData.email, password: userData.password }),
            });
            if (res.ok) {
                const data = await res.json();
                token = data.token;
                wUser = data.user;
                setWmsToken(token);
                setWmsUser(wUser);
            }
        } catch (_) {
            // WMS no disponible — continuar sin token WMS
        }

        saveSession(userData, token, wUser);
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
