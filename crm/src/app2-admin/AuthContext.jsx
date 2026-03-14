import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const WMS_URL = import.meta.env.VITE_WMS_URL || 'http://localhost:3000';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [wmsToken, setWmsToken] = useState(null);
    const [wmsUser, setWmsUser] = useState(null);

    const login = useCallback(async (userData) => {
        setUser(userData);

        // Auto-login al WMS con las mismas credenciales
        try {
            const res = await fetch(`${WMS_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userData.email, password: userData.password }),
            });
            if (res.ok) {
                const data = await res.json();
                setWmsToken(data.token);
                setWmsUser(data.user);
            }
        } catch (_) {
            // WMS no disponible — continuar sin token WMS
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setWmsToken(null);
        setWmsUser(null);
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
