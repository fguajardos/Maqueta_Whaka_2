import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { PERMISOS_ROL } from '../data/mockData';
import {
    LayoutDashboard, Users, UserCheck, ShoppingBag,
    BarChart3, Settings, LogOut, Menu, Bell, Search, Layers, Box, ShoppingCart, Truck
} from 'lucide-react';
import { COLORS, RADIUS, FONT, SHADOW } from '../styles/tokens';
import logoFull from '../assets/logo-whaka.svg';
import logoIcon from '../assets/logo-whaka-icon.svg';

const NAV_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { key: 'leads', label: 'Leads', icon: Users, path: '/admin/leads' },
    { key: 'clientes', label: 'Clientes', icon: UserCheck, path: '/admin/clientes' },
    { key: 'wms', label: 'WMS Dashboard', icon: Layers, path: '/admin/wms/dashboard' },
    { key: 'wms', label: 'WMS Stock', icon: Box, path: '/admin/wms/stock' },
    { key: 'wms', label: 'WMS Pedidos', icon: ShoppingCart, path: '/admin/wms/pedidos' },
    { key: 'wms', label: 'WMS Despacho', icon: Truck, path: '/admin/wms/despacho' },
    { key: 'catalogo', label: 'Catálogo', icon: ShoppingBag, path: '/admin/catalogo' },
    { key: 'reportes', label: 'Reportes', icon: BarChart3, path: '/admin/reportes' },
    { key: 'configuracion', label: 'Configuración', icon: Settings, path: '/admin/configuracion' },
];

export default function AdminLayout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const allowedModules = PERMISOS_ROL[user?.rol] || [];
    const visibleItems = NAV_ITEMS.filter(item => allowedModules.includes(item.key));

    const handleLogout = () => { logout(); navigate('/admin'); };

    const sidebarW = sidebarOpen ? 240 : 72;

    return (
        <div style={styles.shell}>
            {/* ── Desktop Sidebar ── */}
            <aside style={{ ...styles.sidebar, width: `${sidebarW}px` }}>
                {/* Logo */}
                <div style={styles.logoSection}>
                    {sidebarOpen ? (
                        <img src={logoFull} alt="Acaí Whaka" style={{ height: '40px', objectFit: 'contain' }} />
                    ) : (
                        <img src={logoIcon} alt="Acaí Whaka" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                    )}
                </div>

                {/* Nav */}
                <nav style={styles.nav}>
                    {visibleItems.map(item => (
                        <NavItem
                            key={item.key}
                            item={item}
                            showLabel={sidebarOpen}
                            onClick={() => setMobileSidebarOpen(false)}
                        />
                    ))}
                </nav>

                {/* User */}
                <div style={styles.userSection}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={styles.avatar}>{user?.avatar}</div>
                        {sidebarOpen && (
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: FONT.sm, fontWeight: '500', color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.nombre}</div>
                                <div style={{ fontSize: FONT.xs, color: COLORS.textLight, textTransform: 'capitalize' }}>{user?.rol}</div>
                            </div>
                        )}
                    </div>
                    <button onClick={handleLogout} style={styles.logoutBtn}>
                        <LogOut size={16} />
                        {sidebarOpen && 'Cerrar sesión'}
                    </button>
                </div>
            </aside>

            {/* ── Mobile Sidebar Overlay ── */}
            {mobileSidebarOpen && (
                <div style={styles.mobileOverlay} onClick={() => setMobileSidebarOpen(false)}>
                    <aside style={styles.mobileSidebar} onClick={e => e.stopPropagation()}>
                        <div style={styles.logoSection}>
                            <img src={logoFull} alt="Acaí Whaka" style={{ height: '40px', objectFit: 'contain' }} />
                        </div>
                        <nav style={styles.nav}>
                            {visibleItems.map(item => (
                                <NavItem key={item.key} item={item} showLabel onClick={() => setMobileSidebarOpen(false)} />
                            ))}
                        </nav>
                    </aside>
                </div>
            )}

            {/* ── Main Content ── */}
            <div style={styles.mainCol}>
                {/* Topbar */}
                <header style={styles.topbar}>
                    <button
                        onClick={() => {
                            if (window.innerWidth < 768) setMobileSidebarOpen(true);
                            else setSidebarOpen(s => !s);
                        }}
                        style={styles.menuBtn}
                    >
                        <Menu size={20} color={COLORS.textLight} />
                    </button>

                    <div style={styles.searchBox}>
                        <Search size={16} color={COLORS.textLight} />
                        <input type="text" placeholder="Buscar..." style={styles.searchInput} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                        <button style={styles.bellBtn}>
                            <Bell size={20} color={COLORS.textLight} />
                            <span style={styles.bellDot} />
                        </button>
                        <div style={styles.avatarSmall}>{user?.avatar}</div>
                    </div>
                </header>

                {/* Page Content */}
                <main style={styles.content}>{children}</main>
            </div>
        </div>
    );
}

/* ── NavItem sub-component ── */
function NavItem({ item, showLabel, onClick }) {
    const [hovered, setHovered] = useState(false);

    return (
        <NavLink
            to={item.path}
            end={item.key === 'dashboard'}
            onClick={onClick}
            style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: RADIUS.lg,
                fontSize: FONT.sm,
                fontWeight: '500',
                textDecoration: 'none',
                transition: 'all 0.15s',
                backgroundColor: isActive ? COLORS.primaryLight : hovered ? COLORS.bgAlt : 'transparent',
                color: isActive ? COLORS.primary : '#4B5563',
            })}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <item.icon size={20} style={{ flexShrink: 0 }} />
            {showLabel && <span>{item.label}</span>}
        </NavLink>
    );
}

/* ── Styles ── */
const styles = {
    shell: {
        height: '100vh',
        display: 'flex',
        backgroundColor: COLORS.bg,
        overflow: 'hidden',
        fontFamily: FONT.family,
    },
    sidebar: {
        backgroundColor: COLORS.white,
        borderRight: `1px solid ${COLORS.borderLight}`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 0.3s',
        overflow: 'hidden',
    },
    logoSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '20px',
        borderBottom: `1px solid ${COLORS.borderLight}`,
    },
    logoBox: {
        width: '36px',
        height: '36px',
        borderRadius: RADIUS.xl,
        backgroundColor: COLORS.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    nav: {
        flex: 1,
        padding: '16px 12px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    userSection: {
        padding: '16px',
        borderTop: `1px solid ${COLORS.borderLight}`,
    },
    avatar: {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: COLORS.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.white,
        fontWeight: '700',
        fontSize: FONT.xs,
        flexShrink: 0,
    },
    logoutBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: FONT.sm,
        color: COLORS.textLight,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: FONT.family,
        padding: 0,
    },
    mobileOverlay: {
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    mobileSidebar: {
        width: '240px',
        height: '100%',
        backgroundColor: COLORS.white,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: SHADOW.xl,
    },
    mainCol: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden',
    },
    topbar: {
        height: '64px',
        backgroundColor: COLORS.white,
        borderBottom: `1px solid ${COLORS.borderLight}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '16px',
        flexShrink: 0,
    },
    menuBtn: {
        padding: '8px',
        borderRadius: RADIUS.lg,
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchBox: {
        flex: 1,
        maxWidth: '440px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: COLORS.bgAlt,
        borderRadius: RADIUS.lg,
        padding: '8px 12px',
    },
    searchInput: {
        flex: 1,
        border: 'none',
        outline: 'none',
        backgroundColor: 'transparent',
        fontSize: FONT.sm,
        color: COLORS.text,
        fontFamily: FONT.family,
    },
    bellBtn: {
        position: 'relative',
        padding: '8px',
        borderRadius: RADIUS.lg,
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
    },
    bellDot: {
        position: 'absolute',
        top: '4px',
        right: '4px',
        width: '8px',
        height: '8px',
        backgroundColor: COLORS.redDot,
        borderRadius: '50%',
    },
    avatarSmall: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: COLORS.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.white,
        fontWeight: '700',
        fontSize: FONT.xs,
    },
    content: {
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
    },
};
