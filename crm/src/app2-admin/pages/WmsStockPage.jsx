import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Wifi, WifiOff, Package, AlertTriangle, XCircle } from 'lucide-react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { useAuth } from '../AuthContext';
import { formatCLP } from '../../data/mockData';
import { COLORS, FONT, RADIUS, INPUT_STYLE } from '../../styles/tokens';

const API_BASE_URL = import.meta.env.VITE_WMS_URL || 'http://localhost:3000';

// nivel → (status de Badge, etiqueta)
const NIVEL = {
    ok: { status: 'activo', label: 'OK' },
    bajo: { status: 'pendiente', label: 'Stock bajo' },
    agotado: { status: 'rechazado', label: 'Agotado' },
};

export default function WmsStockPage() {
    const { wmsToken } = useAuth();
    const [search, setSearch] = useState('');
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [source, setSource] = useState('backend');

    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/wms/stock`, {
                headers: wmsToken ? { Authorization: `Bearer ${wmsToken}` } : {},
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setStock(data.stock || []);
            setSource('backend');
        } catch (err) {
            console.warn('[WMS Stock] backend no disponible:', err.message);
            setStock([]);
            setSource('error');
        } finally {
            setLoading(false);
        }
    }, [wmsToken]);

    useEffect(() => { cargar(); }, [cargar]);

    const filtered = stock.filter(s => !search
        || s.producto.toLowerCase().includes(search.toLowerCase())
        || (s.sku || '').toLowerCase().includes(search.toLowerCase()));

    const totalFormatos = stock.length;
    const bajos = stock.filter(s => s.nivel === 'bajo').length;
    const agotados = stock.filter(s => s.nivel === 'agotado').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h1 style={{ fontSize: FONT.xxl, fontWeight: '700', color: COLORS.dark, margin: 0 }}>Stock de Bodega</h1>
                    {source === 'backend'
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: FONT.xs, fontWeight: '600', color: '#15803D', backgroundColor: '#DCFCE7', padding: '4px 10px', borderRadius: RADIUS.full }}><Wifi size={12} /> En vivo</span>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: FONT.xs, fontWeight: '600', color: '#B45309', backgroundColor: '#FEF3C7', padding: '4px 10px', borderRadius: RADIUS.full }}><WifiOff size={12} /> Sin conexión</span>}
                </div>
                <Button variant="ghost" size="sm" onClick={cargar} disabled={loading}><RefreshCw size={16} style={loading ? { animation: 'spin 1s linear infinite' } : undefined} /> Actualizar</Button>
            </div>

            {/* Resumen */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <SummaryCard icon={Package} label="Formatos en bodega" value={totalFormatos} color={COLORS.primary} bg={COLORS.primaryLight} />
                <SummaryCard icon={AlertTriangle} label="Con stock bajo" value={bajos} color="#B45309" bg="#FEF3C7" />
                <SummaryCard icon={XCircle} label="Agotados" value={agotados} color="#B91C1C" bg="#FEE2E2" />
            </div>

            {/* Search */}
            <Card style={{ padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: COLORS.bgAlt, borderRadius: RADIUS.lg, padding: '8px 12px' }}>
                    <Search size={16} color={COLORS.textLight} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto o SKU..." style={{ ...INPUT_STYLE, border: 'none', padding: 0, backgroundColor: 'transparent' }} />
                </div>
            </Card>

            {/* Tabla */}
            <Card style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: COLORS.primary, color: COLORS.white }}>
                                {['Producto', 'SKU', 'Formato', 'Precio', 'Stock', 'Mínimo', 'Nivel'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: FONT.xs, fontWeight: '600', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: COLORS.textLight }}>Cargando stock...</td></tr>}
                            {!loading && filtered.length === 0 && <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: COLORS.textLight }}>Sin datos de stock.</td></tr>}
                            {!loading && filtered.map((s, i) => (
                                <tr key={s.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}`, backgroundColor: i % 2 === 1 ? COLORS.bgAlt : COLORS.white }}>
                                    <td style={{ ...S.td, fontWeight: '600', color: COLORS.primary }}>{s.producto}</td>
                                    <td style={{ ...S.td, color: COLORS.textLight }}>{s.sku}</td>
                                    <td style={S.td}>{s.formato}</td>
                                    <td style={S.td}>{formatCLP(s.precio)}</td>
                                    <td style={{ ...S.td, fontWeight: '700' }}>{s.stock} {s.unidadMedida}</td>
                                    <td style={{ ...S.td, color: COLORS.textLight }}>{s.minStock}</td>
                                    <td style={S.td}><Badge status={NIVEL[s.nivel].status} label={NIVEL[s.nivel].label} size="sm" /></td>
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
