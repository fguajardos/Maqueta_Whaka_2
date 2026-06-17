import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Wifi, WifiOff, ShoppingCart, FileText, Users, UserPlus, AlertTriangle, Package } from 'lucide-react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { useAuth } from '../AuthContext';
import { formatCLP } from '../../data/mockData';
import { COLORS, FONT, RADIUS } from '../../styles/tokens';

const API_BASE_URL = import.meta.env.VITE_WMS_URL || 'http://localhost:3000';

export default function WmsDashboardPage() {
    const { wmsToken } = useAuth();
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [source, setSource] = useState('backend');

    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/wms/dashboard`, {
                headers: wmsToken ? { Authorization: `Bearer ${wmsToken}` } : {},
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setKpis(data.kpis);
            setSource('backend');
        } catch (err) {
            console.warn('[WMS Dashboard] backend no disponible:', err.message);
            setKpis(null);
            setSource('error');
        } finally {
            setLoading(false);
        }
    }, [wmsToken]);

    useEffect(() => { cargar(); }, [cargar]);

    const cards = kpis ? [
        { label: 'Pedidos totales', value: kpis.pedidosTotal, icon: ShoppingCart, color: COLORS.primary, bg: COLORS.primaryLight },
        { label: 'Pedidos por facturar', value: kpis.pedidosPendientesFacturar, sub: formatCLP(kpis.montoPorFacturar) + ' por facturar', icon: FileText, color: '#B45309', bg: '#FEF3C7' },
        { label: 'Leads pendientes', value: kpis.leadsPendientes, icon: UserPlus, color: '#1D4ED8', bg: '#DBEAFE' },
        { label: 'Clientes activos', value: kpis.clientesActivos, icon: Users, color: '#15803D', bg: '#DCFCE7' },
        { label: 'Formatos con stock bajo', value: kpis.stockBajo, icon: AlertTriangle, color: '#B91C1C', bg: '#FEE2E2' },
        { label: 'Formatos en catálogo', value: kpis.productosTotal, icon: Package, color: COLORS.info, bg: COLORS.infoLight },
    ] : [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h1 style={{ fontSize: FONT.xxl, fontWeight: '700', color: COLORS.dark, margin: 0 }}>WMS — Dashboard</h1>
                    {source === 'backend'
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: FONT.xs, fontWeight: '600', color: '#15803D', backgroundColor: '#DCFCE7', padding: '4px 10px', borderRadius: RADIUS.full }}><Wifi size={12} /> En vivo</span>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: FONT.xs, fontWeight: '600', color: '#B45309', backgroundColor: '#FEF3C7', padding: '4px 10px', borderRadius: RADIUS.full }}><WifiOff size={12} /> Sin conexión</span>}
                </div>
                <Button variant="ghost" size="sm" onClick={cargar} disabled={loading}><RefreshCw size={16} style={loading ? { animation: 'spin 1s linear infinite' } : undefined} /> Actualizar</Button>
            </div>

            {loading && <Card style={{ padding: '40px', textAlign: 'center', color: COLORS.textLight }}>Cargando indicadores...</Card>}
            {!loading && !kpis && <Card style={{ padding: '40px', textAlign: 'center', color: COLORS.textLight }}>No se pudieron cargar los indicadores. Verifica el backend.</Card>}

            {!loading && kpis && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    {cards.map(c => (
                        <Card key={c.label} style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '52px', height: '52px', borderRadius: RADIUS.lg, backgroundColor: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <c.icon size={26} color={c.color} />
                            </div>
                            <div>
                                <p style={{ fontSize: '28px', fontWeight: '700', color: COLORS.dark, margin: 0, lineHeight: 1.1 }}>{c.value}</p>
                                <p style={{ fontSize: FONT.sm, color: COLORS.textLight, margin: '2px 0 0 0' }}>{c.label}</p>
                                {c.sub && <p style={{ fontSize: FONT.xs, color: c.color, fontWeight: '600', margin: '4px 0 0 0' }}>{c.sub}</p>}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
