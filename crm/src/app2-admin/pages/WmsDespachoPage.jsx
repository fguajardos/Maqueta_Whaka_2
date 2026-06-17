import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Wifi, WifiOff, Truck, Package } from 'lucide-react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { useAuth } from '../AuthContext';
import { formatCLP, formatDateTime } from '../../data/mockData';
import { COLORS, FONT, RADIUS, INPUT_STYLE } from '../../styles/tokens';

const API_BASE_URL = import.meta.env.VITE_WMS_URL || 'http://localhost:3000';

export default function WmsDespachoPage() {
    const { wmsToken } = useAuth();
    const [search, setSearch] = useState('');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [source, setSource] = useState('backend');

    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/whatsapp/orders/list`, {
                headers: wmsToken ? { Authorization: `Bearer ${wmsToken}` } : {},
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            // Despacho = pedidos con entrega a domicilio
            setOrders((data.orders || []).filter(o => o.deliveryType === 'entrega'));
            setSource('backend');
        } catch (err) {
            console.warn('[WMS Despacho] backend no disponible:', err.message);
            setOrders([]);
            setSource('error');
        } finally {
            setLoading(false);
        }
    }, [wmsToken]);

    useEffect(() => { cargar(); }, [cargar]);

    const filtered = orders.filter(o => !search
        || (o.clientName || '').toLowerCase().includes(search.toLowerCase())
        || (o.city || '').toLowerCase().includes(search.toLowerCase())
        || (o.address || '').toLowerCase().includes(search.toLowerCase()));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h1 style={{ fontSize: FONT.xxl, fontWeight: '700', color: COLORS.dark, margin: 0 }}>Despacho</h1>
                    {source === 'backend'
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: FONT.xs, fontWeight: '600', color: '#15803D', backgroundColor: '#DCFCE7', padding: '4px 10px', borderRadius: RADIUS.full }}><Wifi size={12} /> En vivo</span>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: FONT.xs, fontWeight: '600', color: '#B45309', backgroundColor: '#FEF3C7', padding: '4px 10px', borderRadius: RADIUS.full }}><WifiOff size={12} /> Sin conexión</span>}
                </div>
                <Button variant="ghost" size="sm" onClick={cargar} disabled={loading}><RefreshCw size={16} style={loading ? { animation: 'spin 1s linear infinite' } : undefined} /> Actualizar</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <SummaryCard icon={Truck} label="Entregas por despachar" value={orders.length} color={COLORS.primary} bg={COLORS.primaryLight} />
                <SummaryCard icon={Package} label="Mostrando" value={filtered.length} color={COLORS.info} bg={COLORS.infoLight} />
            </div>

            {/* Search */}
            <Card style={{ padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: COLORS.bgAlt, borderRadius: RADIUS.lg, padding: '8px 12px' }}>
                    <Search size={16} color={COLORS.textLight} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente, dirección o comuna..." style={{ ...INPUT_STYLE, border: 'none', padding: 0, backgroundColor: 'transparent' }} />
                </div>
            </Card>

            {/* Tabla */}
            <Card style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: COLORS.primary, color: COLORS.white }}>
                                {['Pedido', 'Cliente', 'Producto', 'Cant.', 'Dirección', 'Ciudad', 'Estado', 'Fecha'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: FONT.xs, fontWeight: '600', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: COLORS.textLight }}>Cargando despachos...</td></tr>}
                            {!loading && filtered.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: COLORS.textLight }}>No hay entregas por despachar.</td></tr>}
                            {!loading && filtered.map((o, i) => (
                                <tr key={o.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}`, backgroundColor: i % 2 === 1 ? COLORS.bgAlt : COLORS.white }}>
                                    <td style={{ ...S.td, fontWeight: '600', color: COLORS.primary }}>{o.id.slice(0, 8).toUpperCase()}</td>
                                    <td style={S.td}>{o.clientName}</td>
                                    <td style={S.td}>{o.productName}</td>
                                    <td style={{ ...S.td, fontWeight: '600' }}>{o.quantity} {o.unitOfMeasure}</td>
                                    <td style={{ ...S.td, color: COLORS.textLight, maxWidth: '220px' }}>{o.address || '-'}</td>
                                    <td style={{ ...S.td, color: COLORS.textLight }}>{o.city || '-'}</td>
                                    <td style={S.td}><Badge status={o.status} size="sm" /></td>
                                    <td style={{ ...S.td, color: COLORS.textLight }}>{formatDateTime(o.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

function SummaryCard({ icon: Icon, label, value, color, bg }) {
    return (
        <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: RADIUS.lg, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={22} color={color} />
            </div>
            <div>
                <p style={{ fontSize: FONT.xxl, fontWeight: '700', color: COLORS.dark, margin: 0 }}>{value}</p>
                <p style={{ fontSize: FONT.xs, color: COLORS.textLight, margin: 0 }}>{label}</p>
            </div>
        </Card>
    );
}

const S = { td: { padding: '12px 16px', fontSize: FONT.sm } };
