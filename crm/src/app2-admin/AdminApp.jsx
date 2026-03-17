import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import AdminLayout from './AdminLayout';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import ClientesPage from './pages/ClientesPage';
import WmsPage from './pages/WmsPage';
import CatalogoPage from './pages/CatalogoPage';
import ReportesPage from './pages/ReportesPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import { PERMISOS_ROL } from '../data/mockData';
import { COLORS, FONT } from '../styles/tokens';

function ProtectedRoute({ children, module }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/admin" replace />;
    const allowed = PERMISOS_ROL[user.rol] || [];
    if (module && !allowed.includes(module)) {
        return (
            <AdminLayout>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 16px', fontFamily: FONT.family }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                    <h2 style={{ fontSize: FONT.xl, fontWeight: '700', color: COLORS.dark, marginBottom: '8px' }}>Acceso no permitido</h2>
                    <p style={{ color: COLORS.textLight, fontSize: FONT.sm, marginBottom: '16px' }}>Tu rol ({user.rol}) no tiene acceso a este módulo.</p>
                    <a href="/admin" style={{ color: COLORS.primary, fontWeight: '500', textDecoration: 'none' }}>Volver al inicio</a>
                </div>
            </AdminLayout>
        );
    }
    return <AdminLayout>{children}</AdminLayout>;
}

function WmsRedirect() {
    const { user } = useAuth();
    const allowed = PERMISOS_ROL[user?.rol] || [];
    if (allowed.includes('wms_dashboard')) return <Navigate to="/admin/wms/dashboard" replace />;
    if (allowed.includes('wms_stock')) return <Navigate to="/admin/wms/stock" replace />;
    if (allowed.includes('wms_pedidos')) return <Navigate to="/admin/wms/pedidos" replace />;
    if (allowed.includes('wms_despacho')) return <Navigate to="/admin/wms/despacho" replace />;
    return <Navigate to="/admin" replace />;
}

function AdminRoutes() {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <LoginPage />;

    return (
        <Routes>
            <Route path="/" element={<ProtectedRoute module="dashboard"><DashboardPage /></ProtectedRoute>} />
            <Route path="/leads" element={<ProtectedRoute module="leads"><LeadsPage /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute module="clientes"><ClientesPage /></ProtectedRoute>} />
            <Route path="/wms" element={<WmsRedirect />} />
            <Route path="/wms/dashboard" element={<ProtectedRoute module="wms_dashboard"><WmsPage /></ProtectedRoute>} />
            <Route path="/wms/stock" element={<ProtectedRoute module="wms_stock"><WmsPage /></ProtectedRoute>} />
            <Route path="/wms/pedidos" element={<ProtectedRoute module="wms_pedidos"><WmsPage /></ProtectedRoute>} />
            <Route path="/wms/despacho" element={<ProtectedRoute module="wms_despacho"><WmsPage /></ProtectedRoute>} />
            <Route path="/catalogo" element={<ProtectedRoute module="catalogo"><CatalogoPage /></ProtectedRoute>} />
            <Route path="/reportes" element={<ProtectedRoute module="reportes"><ReportesPage /></ProtectedRoute>} />
            <Route path="/configuracion" element={<ProtectedRoute module="configuracion"><ConfiguracionPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
    );
}

export default function AdminApp() {
    return (
        <AuthProvider>
            <AdminRoutes />
        </AuthProvider>
    );
}
