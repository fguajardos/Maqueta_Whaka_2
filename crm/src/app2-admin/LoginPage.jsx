import React, { useState } from 'react';
import { LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthContext';
import { USUARIOS } from '../data/mockData';
import Button from '../components/Button';
import { COLORS, RADIUS, FONT, SHADOW, INPUT_STYLE } from '../styles/tokens';
import logoIcon from '../assets/logo-whaka-icon.svg';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        await new Promise(r => setTimeout(r, 800));
        const user = USUARIOS.find(u => u.email === email && u.password === password);
        if (user) {
            login(user);
        } else {
            setError('Credenciales incorrectas. Verifica tu email y contraseña.');
        }
        setLoading(false);
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.iconBox}>
                        <img src={logoIcon} alt="Acaí Whaka" style={{ width: '44px', height: '44px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                    </div>
                    <h1 style={styles.title}>WhakaChile</h1>
                    <p style={styles.subtitle}>Panel de Administración</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={styles.form}>
                    {error && (
                        <div style={styles.errorBox}>
                            <AlertCircle size={16} color={COLORS.danger} style={{ flexShrink: 0 }} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label style={styles.label}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={INPUT_STYLE}
                            placeholder="tu@email.cl"
                            required
                        />
                    </div>

                    <div>
                        <label style={styles.label}>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={INPUT_STYLE}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <Button type="submit" loading={loading} style={{ width: '100%' }}>
                        <LogIn size={16} /> Iniciar Sesión
                    </Button>

                    {/* Test users */}
                    <div style={styles.testBox}>
                        <p style={styles.testLabel}>Usuarios de prueba:</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {USUARIOS.map(u => (
                                <button
                                    key={u.email}
                                    type="button"
                                    onClick={() => { setEmail(u.email); setPassword(u.password); }}
                                    style={styles.testBtn}
                                    onMouseEnter={e => e.currentTarget.style.color = COLORS.primary}
                                    onMouseLeave={e => e.currentTarget.style.color = COLORS.textLight}
                                >
                                    <span style={{ fontWeight: '500' }}>{u.email}</span> — {u.nombre} ({u.rol})
                                </button>
                            ))}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        backgroundColor: COLORS.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: FONT.family,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.xxl,
        boxShadow: SHADOW.xl,
        width: '100%',
        maxWidth: '420px',
        overflow: 'hidden',
    },
    header: {
        backgroundColor: COLORS.primary,
        padding: '32px',
        textAlign: 'center',
    },
    iconBox: {
        width: '64px',
        height: '64px',
        borderRadius: RADIUS.xxl,
        backgroundColor: 'rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
    },
    title: {
        fontSize: FONT.xxl,
        fontWeight: '700',
        color: COLORS.white,
        margin: 0,
    },
    subtitle: {
        fontSize: FONT.sm,
        color: COLORS.purpleMint,
        margin: '4px 0 0',
    },
    form: {
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    label: {
        display: 'block',
        fontSize: FONT.sm,
        fontWeight: '500',
        color: '#374151',
        marginBottom: '6px',
    },
    errorBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: COLORS.dangerLight,
        border: `1px solid #FECACA`,
        color: COLORS.danger,
        fontSize: FONT.sm,
        padding: '12px 16px',
        borderRadius: RADIUS.lg,
    },
    testBox: {
        backgroundColor: COLORS.bgAlt,
        borderRadius: RADIUS.lg,
        padding: '16px',
        marginTop: '4px',
    },
    testLabel: {
        fontSize: FONT.xs,
        fontWeight: '500',
        color: COLORS.textLight,
        marginBottom: '8px',
    },
    testBtn: {
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: FONT.xs,
        color: COLORS.textLight,
        padding: '2px 0',
        fontFamily: FONT.family,
        transition: 'color 0.15s',
    },
};
