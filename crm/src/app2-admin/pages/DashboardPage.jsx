import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Package, DollarSign, Users, TrendingUp, ArrowUpRight, ArrowDownRight, AlertTriangle, Truck, Link2, Copy, MessageCircle, Check, X, Loader } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { DASHBOARD_DATA, LEADS, PEDIDOS, CLIENTES, formatCLP, formatDate } from '../../data/mockData';
import { COLORS, FONT } from '../../styles/tokens';

const CHART_COLORS = ['#2D7D46', '#1A6B5A', '#B45309', '#1D4ED8', '#6B7280'];
const WMS_URL = import.meta.env.VITE_WMS_URL || 'http://localhost:3000';
const CRM_URL = import.meta.env.VITE_CRM_URL || 'http://localhost:5173';

export default function DashboardPage() {
    const { kpis, ventasMensuales, distribucionClientes, topProductos, estadoPedidosHoy } = DASHBOARD_DATA;

    const { wmsToken } = useAuth();

    const leadsRecientes = LEADS.slice(0, 5);
    const pedidosListos = PEDIDOS.filter(p => p.estado === 'listo_bodega');
    const clientesBloqueados = CLIENTES.filter(c => c.estadoComercial === 'bloqueado');
    const pedidosIncidencia = PEDIDOS.filter(p => p.estado === 'incidencia');
    const pedidosEnRuta = PEDIDOS.filter(p => p.estado === 'despachado');

    const [trackingModal, setTrackingModal] = useState(null);

    const generateTrackingLink = async (orderId, cliente) => {
        setTrackingModal({ orderId, cliente, url: null, loading: true, error: null, copied: false });
        try {
            // Usar JWT del WMS si está disponible, si no usar API key como fallback
            const headers = wmsToken
                ? { 'Authorization': `Bearer ${wmsToken}`, 'Content-Type': 'application/json' }
                : { 'x-api-key': 'whaka-internal-2026' };

            const endpoint = wmsToken
                ? `${WMS_URL}/api/orders/${orderId}/evidence-token`
                : `${WMS_URL}/api/orders/${orderId}/tracking-link`;

            const res = await fetch(endpoint, { method: 'POST', headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.message || 'Error al generar link');
            const fullUrl = `${CRM_URL}${data.url}`;
            setTrackingModal({ orderId, cliente, url: fullUrl, loading: false, error: null, copied: false });
        } catch (err) {
            setTrackingModal(prev => ({ ...prev, loading: false, error: err.message }));
        }
    };

    const copyToClipboard = (url) => {
        navigator.clipboard.writeText(url).then(() => {
            setTrackingModal(prev => ({ ...prev, copied: true }));
            setTimeout(() => setTrackingModal(prev => prev ? ({ ...prev, copied: false }) : null), 2000);
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h1 style={{ fontSize: FONT.xxl, fontWeight: '700', color: COLORS.dark, margin: 0 }}>Dashboard</h1>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <KPICard icon={Package} label="Pedidos Hoy" value={kpis.pedidosHoy.valor} variacion={kpis.pedidosHoy.variacion} periodo={kpis.pedidosHoy.periodo} accent="#B45309" />
                <KPICard icon={DollarSign} label="Ventas del Mes" value={formatCLP(kpis.ventasMes.valor)} variacion={kpis.ventasMes.variacion} periodo={kpis.ventasMes.periodo} accent="#2D7D46" />
                <KPICard icon={Users} label="Clientes Activos" value={kpis.clientesActivos.valor} variacion={kpis.clientesActivos.variacion} periodo={kpis.clientesActivos.periodo} accent="#1D4ED8" />
                <KPICard icon={TrendingUp} label="OTV Promedio" value={formatCLP(kpis.otvPromedio.valor)} variacion={kpis.otvPromedio.variacion} periodo={kpis.otvPromedio.periodo} accent="#1A6B5A" />
            </div>

            {/* Charts Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
                <Card>
                    <h3 style={S.cardTitle}>Ventas Mensual</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={ventasMensuales}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} />
                            <Tooltip formatter={(v) => formatCLP(v)} />
                            <Legend />
                            <Line type="monotone" dataKey="ventas" stroke="#2D7D46" strokeWidth={2} dot={{ r: 3 }} name="Ventas Reales" />
                            <Line type="monotone" dataKey="objetivo" stroke="#B45309" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Objetivo" />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                <Card>
                    <h3 style={S.cardTitle}>Distribución por Tipo de Cliente</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie data={distribucionClientes} dataKey="cantidad" nameKey="tipo" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} label={({ tipo, porcentaje }) => `${tipo} ${porcentaje}%`}>
                                {distribucionClientes.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
                <Card>
                    <h3 style={S.cardTitle}>Top 5 Productos del Mes</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={topProductos} layout="vertical" margin={{ left: 100 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <YAxis dataKey="nombre" type="category" tick={{ fontSize: 11, fill: '#374151' }} width={100} />
                            <Tooltip />
                            <Bar dataKey="unidades" fill="#2D7D46" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                <Card>
                    <h3 style={S.cardTitle}>Estado de Pedidos Hoy</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={estadoPedidosHoy}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="estado" tick={{ fontSize: 11, fill: '#6B7280' }} />
                            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <Tooltip />
                            <Bar dataKey="cantidad" fill="#1A6B5A" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Additional Sections */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {/* Leads Recientes */}
                <Card>
                    <h3 style={S.cardTitle}>Leads Recientes</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {leadsRecientes.map(lead => (
                            <div key={lead.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F9FAFB' }}>
                                <div>
                                    <p style={{ fontSize: FONT.sm, fontWeight: '500', color: '#1F2937', margin: 0 }}>{lead.empresa}</p>
                                    <p style={{ fontSize: FONT.xs, color: COLORS.textLight, margin: 0 }}>{lead.tipoNegocio}</p>
                                </div>
                                <Badge status={lead.estado} size="sm" />
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Alertas Operativas */}
                <Card topBorderColor="#B91C1C">
                    <h3 style={{ ...S.cardTitle, display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={16} color="#EF4444" /> Alertas Operativas</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {pedidosIncidencia.map(p => (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', backgroundColor: '#FEF2F2', borderRadius: '8px' }}>
                                <Package size={16} color="#EF4444" style={{ flexShrink: 0 }} />
                                <div>
                                    <p style={{ fontSize: FONT.sm, fontWeight: '500', color: '#991B1B', margin: 0 }}>{p.id}</p>
                                    <p style={{ fontSize: FONT.xs, color: '#DC2626', margin: 0 }}>{p.notaPedido}</p>
                                </div>
                            </div>
                        ))}
                        {clientesBloqueados.map(c => (
                            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', backgroundColor: '#FFFBEB', borderRadius: '8px' }}>
                                <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0 }} />
                                <div>
                                    <p style={{ fontSize: FONT.sm, fontWeight: '500', color: '#92400E', margin: 0 }}>{c.empresa}</p>
                                    <p style={{ fontSize: FONT.xs, color: '#B45309', margin: 0 }}>Deuda vencida: {formatCLP(c.deudaVencida)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Pedidos Listos */}
                <Card topBorderColor="#2D7D46">
                    <h3 style={{ ...S.cardTitle, display: 'flex', alignItems: 'center', gap: '8px' }}><Truck size={16} color="#16A34A" /> Listos para Despacho</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {pedidosListos.length === 0 ? (
                            <p style={{ fontSize: FONT.sm, color: COLORS.textLight, textAlign: 'center', padding: '16px 0' }}>No hay pedidos pendientes de despacho</p>
                        ) : pedidosListos.map(p => (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', backgroundColor: '#F0FDF4', borderRadius: '8px' }}>
                                <div>
                                    <p style={{ fontSize: FONT.sm, fontWeight: '500', color: '#166534', margin: 0 }}>{p.id}</p>
                                    <p style={{ fontSize: FONT.xs, color: '#16A34A', margin: 0 }}>{p.cliente}</p>
                                </div>
                                <span style={{ fontSize: FONT.sm, fontWeight: '700', color: '#15803D' }}>{formatCLP(p.total)}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Pedidos En Ruta — Link de Seguimiento */}
            <Card topBorderColor="#1D4ED8">
                <h3 style={{ ...S.cardTitle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Link2 size={16} color="#2563EB" /> Pedidos En Ruta — Seguimiento de Entrega
                </h3>
                <p style={{ fontSize: FONT.xs, color: COLORS.textLight, margin: '-8px 0 16px 0' }}>
                    Genera y comparte el link de seguimiento con el cliente para cada pedido despachado.
                </p>
                {pedidosEnRuta.length === 0 ? (
                    <p style={{ fontSize: FONT.sm, color: COLORS.textLight, textAlign: 'center', padding: '16px 0' }}>No hay pedidos en ruta actualmente</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {pedidosEnRuta.map(p => (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: FONT.sm, fontWeight: '600', color: '#1E40AF', margin: 0 }}>{p.id}</p>
                                    <p style={{ fontSize: FONT.xs, color: '#3B82F6', margin: 0 }}>{p.cliente} · {p.comuna}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                    <span style={{ fontSize: FONT.sm, fontWeight: '700', color: '#1D4ED8' }}>{formatCLP(p.total)}</span>
                                    <button
                                        onClick={() => generateTrackingLink(p.id, p.cliente)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: '#2563EB', color: 'white', border: 'none', borderRadius: '6px', fontSize: FONT.xs, fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                    >
                                        <Link2 size={12} /> Generar Link
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Modal de Tracking Link */}
            {trackingModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: FONT.lg, fontWeight: '700', color: COLORS.dark, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Link2 size={18} color="#2563EB" /> Link de Seguimiento
                            </h3>
                            <button onClick={() => setTrackingModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>
                                <X size={20} color="#6B7280" />
                            </button>
                        </div>

                        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                            <p style={{ fontSize: FONT.xs, color: COLORS.textLight, margin: '0 0 2px 0' }}>Pedido</p>
                            <p style={{ fontSize: FONT.sm, fontWeight: '600', color: COLORS.dark, margin: 0 }}>{trackingModal.orderId} · {trackingModal.cliente}</p>
                        </div>

                        {trackingModal.loading && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px', justifyContent: 'center' }}>
                                <Loader size={20} color="#2563EB" style={{ animation: 'spin 1s linear infinite' }} />
                                <p style={{ fontSize: FONT.sm, color: '#2563EB', margin: 0 }}>Generando link seguro...</p>
                            </div>
                        )}

                        {trackingModal.error && (
                            <div style={{ padding: '12px', backgroundColor: '#FEF2F2', borderRadius: '8px', marginBottom: '16px' }}>
                                <p style={{ fontSize: FONT.sm, color: '#DC2626', margin: 0 }}>⚠️ {trackingModal.error}</p>
                                <p style={{ fontSize: FONT.xs, color: '#EF4444', margin: '4px 0 0 0' }}>Verifica que el servidor WMS esté en ejecución.</p>
                            </div>
                        )}

                        {trackingModal.url && !trackingModal.loading && (
                            <>
                                <div style={{ marginBottom: '16px' }}>
                                    <p style={{ fontSize: FONT.xs, color: COLORS.textLight, marginBottom: '6px' }}>Link de seguimiento (comparte con el cliente):</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                                        <p style={{ fontSize: '11px', color: '#1D4ED8', margin: 0, flex: 1, wordBreak: 'break-all', fontFamily: 'monospace' }}>{trackingModal.url}</p>
                                        <button
                                            onClick={() => copyToClipboard(trackingModal.url)}
                                            style={{ flexShrink: 0, padding: '6px', backgroundColor: trackingModal.copied ? '#D1FAE5' : '#DBEAFE', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            title="Copiar link"
                                        >
                                            {trackingModal.copied ? <Check size={14} color="#16A34A" /> : <Copy size={14} color="#2563EB" />}
                                        </button>
                                    </div>
                                    {trackingModal.copied && <p style={{ fontSize: FONT.xs, color: '#16A34A', margin: '4px 0 0 8px' }}>✓ Copiado al portapapeles</p>}
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <a
                                        href={`https://wa.me/?text=${encodeURIComponent(`Hola! Puedes seguir tu pedido ${trackingModal.orderId} aquí: ${trackingModal.url}`)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', backgroundColor: '#16A34A', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: FONT.sm, fontWeight: '600' }}
                                    >
                                        <MessageCircle size={16} /> Compartir por WhatsApp
                                    </a>
                                    <button
                                        onClick={() => generateTrackingLink(trackingModal.orderId, trackingModal.cliente)}
                                        title="Generar nuevo link"
                                        style={{ padding: '10px 14px', backgroundColor: '#F3F4F6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: FONT.xs, color: '#374151' }}
                                    >
                                        Regenerar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function KPICard({ icon: Icon, label, value, variacion, periodo, accent }) {
    const isPositive = variacion >= 0;
    return (
        <Card>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: accent + '15' }}>
                    <Icon size={20} color={accent} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: FONT.xs, fontWeight: '500', color: isPositive ? '#16A34A' : '#EF4444' }}>
                    {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {Math.abs(variacion)}%
                </div>
            </div>
            <div style={{ marginTop: '12px' }}>
                <p style={{ fontSize: FONT.xxl, fontWeight: '700', color: COLORS.dark, margin: 0 }}>{value}</p>
                <p style={{ fontSize: FONT.xs, color: COLORS.textLight, marginTop: '4px' }}>{label} · {periodo}</p>
            </div>
        </Card>
    );
}

const S = {
    cardTitle: { fontWeight: '600', color: COLORS.dark, marginBottom: '16px', margin: '0 0 16px 0', fontSize: FONT.base },
};
