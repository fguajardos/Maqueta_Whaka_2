import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, LayoutDashboard } from 'lucide-react';
import logoFull from './assets/logo-whaka.svg';

/* ─── Design Tokens ─── */
const COLORS = {
    bg: '#F9FAFB',
    cardBg: '#FFFFFF',
    cardBorder: '#E5E7EB',
    cardHoverBorder: '#3B2D80',
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    accent: '#3B2D80',
    accentLight: '#EDEBF5',
    whatsapp: '#25D366',
    whatsappLight: '#E8FBF0',
};

const SPACING = {
    pagePadding: '24px',
    cardPadding: '32px',
    cardGap: '24px',
};

/* ─── Styles ─── */
const styles = {
    page: {
        minHeight: '100vh',
        backgroundColor: COLORS.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.pagePadding,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    },
    container: {
        textAlign: 'center',
        maxWidth: '680px',
        width: '100%',
    },
    iconBox: {
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        backgroundColor: COLORS.accentLight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
    },
    title: {
        fontSize: '42px',
        fontWeight: '800',
        color: COLORS.textPrimary,
        margin: '0 0 8px',
        letterSpacing: '-0.5px',
    },
    subtitle: {
        fontSize: '18px',
        fontWeight: '500',
        color: COLORS.accent,
        margin: '0 0 4px',
    },
    version: {
        fontSize: '14px',
        color: COLORS.textMuted,
        margin: '0 0 48px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: SPACING.cardGap,
        maxWidth: '560px',
        margin: '0 auto',
    },
    card: {
        backgroundColor: COLORS.cardBg,
        border: `1px solid ${COLORS.cardBorder}`,
        borderRadius: '16px',
        padding: SPACING.cardPadding,
        textDecoration: 'none',
        transition: 'all 0.25s ease',
        cursor: 'pointer',
        display: 'block',
    },
    cardIconWa: {
        width: '56px',
        height: '56px',
        borderRadius: '12px',
        backgroundColor: COLORS.whatsappLight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
    },
    cardIconAdmin: {
        width: '56px',
        height: '56px',
        borderRadius: '12px',
        backgroundColor: COLORS.accentLight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: COLORS.textPrimary,
        margin: '0 0 8px',
    },
    cardDesc: {
        fontSize: '14px',
        color: COLORS.textSecondary,
        margin: 0,
        lineHeight: '1.5',
    },
    footer: {
        fontSize: '12px',
        color: COLORS.textMuted,
        marginTop: '48px',
    },
};

/* ─── Component ─── */
export default function LandingPage() {
    return (
        <div style={styles.page}>
            <div style={styles.container}>
                {/* Logo */}
                <div style={{ marginBottom: '20px' }}>
                    <img src={logoFull} alt="Acaí Whaka" style={{ height: '64px', objectFit: 'contain' }} />
                </div>
                {/* Header */}
                <h1 style={styles.title}>WhakaChile</h1>
                <p style={styles.subtitle}>Plataforma Comercial-Operacional Digital</p>
                <p style={styles.version}>Maqueta Frontend v1.0 — Febrero 2026</p>

                {/* Cards Grid */}
                <div style={styles.grid}>
                    <Link
                        to="/whatsapp"
                        style={styles.card}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = COLORS.whatsapp;
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,211,102,0.12)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = COLORS.cardBorder;
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <div style={styles.cardIconWa}>
                            <MessageSquare size={28} color={COLORS.whatsapp} />
                        </div>
                        <h2 style={styles.cardTitle}>Simulador WhatsApp</h2>
                        <p style={styles.cardDesc}>
                            Canal conversacional del bot comercial. Flujos de onboarding y compra digital.
                        </p>
                    </Link>

                    <Link
                        to="/admin"
                        style={styles.card}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = COLORS.accent;
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,45,128,0.12)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = COLORS.cardBorder;
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <div style={styles.cardIconAdmin}>
                            <LayoutDashboard size={28} color={COLORS.accent} />
                        </div>
                        <h2 style={styles.cardTitle}>Panel Admin</h2>
                        <p style={styles.cardDesc}>
                            Backoffice de gestión interna. Dashboard, pedidos, bodega, logística y más.
                        </p>
                    </Link>
                </div>

                {/* Footer */}
                <p style={styles.footer}>Acaí orgánico y productos funcionales para Chile 🇨🇱</p>
            </div>
        </div>
    );
}
