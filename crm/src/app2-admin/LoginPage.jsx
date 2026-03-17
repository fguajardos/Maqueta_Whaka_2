import { useState } from 'react';
import { LogIn, AlertCircle, Shield, TrendingUp, Box, Truck } from 'lucide-react';
import { useAuth } from './AuthContext';
import { USUARIOS } from '../data/mockData';
import Button from '../components/Button';
import { COLORS, RADIUS, FONT, SHADOW, INPUT_STYLE } from '../styles/tokens';
import logoIcon from '../assets/logo-whaka-icon.svg';

const ROL_INFO = {
    admin: { icon: Shield, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', label: 'Administrador', desc: 'Acceso total al sistema' },
    ejecutivo: { icon: TrendingUp, color: '#2D7D46', bg: '#F0FDF4', border: '#BBF7D0', label: 'Ejecutivo de Ventas', desc: 'Leads, clientes y catálogo' },
    bodega: { icon: Box, color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', label: 'Bodeguero', desc: 'Stock y preparación de pedidos' },
    repartidor: { icon: Truck, color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', label: 'Repartidor', desc: 'Despacho y entregas' },
};

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

                    {/* Test users - Role cards */}
                    <div style={styles.testBox}>
                        <p style={styles.testLabel}>Acceso rápido por perfil:</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {USUARIOS.map(u => {
                                const info = ROL_INFO[u.rol] || {};
                                const Icon = info.icon;
                                return (
                                    <button
                                        key={u.email}
                                        type="button"
                                        onClick={() => { setEmail(u.email); setPassword(u.password); }}
                                        style={{ ...styles.roleCard, backgroundColor: info.bg, border: `1px solid ${info.border}` }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: info.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {Icon && <Icon size={16} color={info.color} />}
                                        </div>
                                        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                                            <p style={{ fontSize: FONT.sm, fontWeight: '600', color: info.color, margin: 0 }}>{info.label}</p>
                                            <p style={{ fontSize: FONT.xs, color: COLORS.textLight, margin: 0 }}>{info.desc}</p>
                                        </div>
                                        <div style={{ fontSize: '10px', color: COLORS.textLight, flexShrink: 0 }}>{u.email}</div>
                                    </button>
                                );
                            })}
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
    roleCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '10px 12px',
        borderRadius: RADIUS.lg,
        cursor: 'pointer',
        fontFamily: FONT.family,
        transition: 'all 0.15s',
    },
};
