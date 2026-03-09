import React from 'react';
import { Package, DollarSign, Users, TrendingUp, ArrowUpRight, ArrowDownRight, AlertTriangle, Truck } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { DASHBOARD_DATA, LEADS, PEDIDOS, CLIENTES, formatCLP, formatDate } from '../../data/mockData';
import { COLORS, FONT } from '../../styles/tokens';

const CHART_COLORS = ['#2D7D46', '#1A6B5A', '#B45309', '#1D4ED8', '#6B7280'];

export default function DashboardPage() {
    const { kpis, ventasMensuales, distribucionClientes, topProductos, estadoPedidosHoy } = DASHBOARD_DATA;

    const leadsRecientes = LEADS.slice(0, 5);
    const pedidosListos = PEDIDOS.filter(p => p.estado === 'listo_bodega');
    const clientesBloqueados = CLIENTES.filter(c => c.estadoComercial === 'bloqueado');
    const pedidosIncidencia = PEDIDOS.filter(p => p.estado === 'incidencia');

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
