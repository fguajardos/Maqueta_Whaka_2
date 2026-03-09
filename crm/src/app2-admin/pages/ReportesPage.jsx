import React, { useState } from 'react';
import { BarChart3, TrendingUp, Package, Users, Download } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { formatCLP } from '../../data/mockData';
import { COLORS, FONT, RADIUS, INPUT_STYLE } from '../../styles/tokens';

const MOCK_VENTAS_DIARIAS = [
    { dia: 'Lun', ventas: 1200000 }, { dia: 'Mar', ventas: 980000 }, { dia: 'Mie', ventas: 1450000 },
    { dia: 'Jue', ventas: 1100000 }, { dia: 'Vie', ventas: 1680000 }, { dia: 'Sab', ventas: 890000 },
];
const MOCK_MIX = [
    { producto: 'Pulpa 500ml', porcentaje: 32 }, { producto: 'Pulpa 1.5L', porcentaje: 25 },
    { producto: 'Food Service 5L', porcentaje: 18 }, { producto: 'Paletas Mix', porcentaje: 15 }, { producto: 'Otros', porcentaje: 10 },
];
const MOCK_CONVERSION = [
    { semana: 'S1', leads: 12, convertidos: 4 }, { semana: 'S2', leads: 15, convertidos: 6 },
    { semana: 'S3', leads: 9, convertidos: 3 }, { semana: 'S4', leads: 18, convertidos: 8 },
];
const MOCK_CLIENTES_TOP = [
    { nombre: 'Green Bowl Providencia', total: 2890000 }, { nombre: 'Açaí Factory', total: 1750000 },
    { nombre: 'FitCafé Las Condes', total: 1280000 }, { nombre: 'Smoothie Lab', total: 980000 }, { nombre: 'Vitafoods SAC', total: 850000 },
];
const MOCK_CANAL = [
    { canal: 'WhatsApp Bot', pedidos: 65 }, { canal: 'WhatsApp Ejecutivo', pedidos: 20 },
    { canal: 'Manual Backoffice', pedidos: 10 }, { canal: 'Recurrente', pedidos: 5 },
];
const PIE_COLORS = ['#2D7D46', '#1A6B5A', '#B45309', '#1D4ED8', '#6B7280', '#7C3AED'];

const REPORT_TABS = [
    { key: 'ventas', label: 'Ventas', icon: TrendingUp },
    { key: 'productos', label: 'Mix Productos', icon: Package },
    { key: 'clientes', label: 'Clientes', icon: Users },
    { key: 'canales', label: 'Canales', icon: BarChart3 },
];

export default function ReportesPage() {
    const [reportTab, setReportTab] = useState('ventas');
    const [dateRange, setDateRange] = useState('mes');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: FONT.xxl, fontWeight: '700', color: COLORS.dark, margin: 0 }}>Reportes</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={{ ...INPUT_STYLE, width: 'auto' }}>
                        <option value="semana">Última semana</option><option value="mes">Último mes</option><option value="trimestre">Último trimestre</option><option value="year">Último año</option>
                    </select>
                    <Button variant="secondary" size="sm"><Download size={16} /> Exportar PDF</Button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', borderBottom: `1px solid ${COLORS.borderLight}`, overflowX: 'auto' }}>
                {REPORT_TABS.map(t => (
                    <button key={t.key} onClick={() => setReportTab(t.key)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: FONT.sm, fontWeight: '500', borderBottom: `2px solid ${reportTab === t.key ? COLORS.primary : 'transparent'}`, color: reportTab === t.key ? COLORS.primary : COLORS.textLight, background: 'none', border: 'none', borderBottomStyle: 'solid', cursor: 'pointer', fontFamily: FONT.family, whiteSpace: 'nowrap' }}>
                        <t.icon size={16} />{t.label}
                    </button>
                ))}
            </div>

            {reportTab === 'ventas' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <Card topBorderColor="#2D7D46"><p style={{ fontSize: FONT.xs, color: COLORS.textLight, margin: '0 0 4px' }}>Ventas Período</p><p style={{ fontSize: FONT.xxl, fontWeight: '700', color: COLORS.dark, margin: '0 0 4px' }}>{formatCLP(7300000)}</p><p style={{ fontSize: FONT.xs, color: '#16A34A', margin: 0 }}>+12% vs período anterior</p></Card>
                        <Card topBorderColor="#1A6B5A"><p style={{ fontSize: FONT.xs, color: COLORS.textLight, margin: '0 0 4px' }}>Pedidos</p><p style={{ fontSize: FONT.xxl, fontWeight: '700', color: COLORS.dark, margin: '0 0 4px' }}>34</p><p style={{ fontSize: FONT.xs, color: '#16A34A', margin: 0 }}>+8 más que período anterior</p></Card>
                        <Card topBorderColor="#B45309"><p style={{ fontSize: FONT.xs, color: COLORS.textLight, margin: '0 0 4px' }}>OTV Promedio</p><p style={{ fontSize: FONT.xxl, fontWeight: '700', color: COLORS.dark, margin: '0 0 4px' }}>{formatCLP(214700)}</p><p style={{ fontSize: FONT.xs, color: '#16A34A', margin: 0 }}>+5%</p></Card>
                    </div>
                    <Card>
                        <h3 style={S.cardTitle}>Ventas Diarias</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={MOCK_VENTAS_DIARIAS}><CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /><XAxis dataKey="dia" tick={{ fontSize: 12 }} /><YAxis tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 12 }} /><Tooltip formatter={v => formatCLP(v)} /><Area type="monotone" dataKey="ventas" stroke="#2D7D46" fill="#2D7D46" fillOpacity={0.1} strokeWidth={2} /></AreaChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
            )}

            {reportTab === 'productos' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
                    <Card>
                        <h3 style={S.cardTitle}>Mix de Productos (% de ventas)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart><Pie data={MOCK_MIX} dataKey="porcentaje" nameKey="producto" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={3} label={({ producto, porcentaje }) => `${producto} ${porcentaje}%`}>
                                {MOCK_MIX.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                            </Pie><Tooltip /></PieChart>
                        </ResponsiveContainer>
                    </Card>
                    <Card>
                        <h3 style={S.cardTitle}>Ranking de Productos</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {MOCK_MIX.map((p, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: FONT.xs, fontWeight: '700', color: COLORS.white, backgroundColor: PIE_COLORS[i] }}>{i + 1}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: FONT.sm, fontWeight: '500', color: COLORS.text }}>{p.producto}</span>
                                            <span style={{ fontSize: FONT.sm, fontWeight: '700', color: COLORS.dark }}>{p.porcentaje}%</span>
                                        </div>
                                        <div style={{ height: '8px', backgroundColor: COLORS.bgAlt, borderRadius: RADIUS.full, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', borderRadius: RADIUS.full, width: `${p.porcentaje}%`, backgroundColor: PIE_COLORS[i], transition: 'width 0.3s' }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {reportTab === 'clientes' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
                    <Card>
                        <h3 style={S.cardTitle}>Conversión de Leads</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={MOCK_CONVERSION}><CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /><XAxis dataKey="semana" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Legend /><Bar dataKey="leads" fill="#1A6B5A" radius={[4, 4, 0, 0]} name="Leads" /><Bar dataKey="convertidos" fill="#2D7D46" radius={[4, 4, 0, 0]} name="Convertidos" /></BarChart>
                        </ResponsiveContainer>
                    </Card>
                    <Card>
                        <h3 style={S.cardTitle}>Top 5 Clientes del Período</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr style={{ backgroundColor: COLORS.bgAlt }}><th style={S.th}>#</th><th style={S.th}>Cliente</th><th style={{ ...S.th, textAlign: 'right' }}>Total</th></tr></thead>
                            <tbody>
                                {MOCK_CLIENTES_TOP.map((c, i) => (
                                    <tr key={i} style={{ borderTop: `1px solid ${COLORS.borderLight}` }}>
                                        <td style={{ padding: '8px 12px', fontSize: FONT.sm, fontWeight: '700', color: PIE_COLORS[i] }}>{i + 1}</td>
                                        <td style={{ padding: '8px 12px', fontSize: FONT.sm }}>{c.nombre}</td>
                                        <td style={{ padding: '8px 12px', fontSize: FONT.sm, textAlign: 'right', fontWeight: '500' }}>{formatCLP(c.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>
            )}

            {reportTab === 'canales' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
                    <Card>
                        <h3 style={S.cardTitle}>Distribución por Canal</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart><Pie data={MOCK_CANAL} dataKey="pedidos" nameKey="canal" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label={({ canal, pedidos }) => `${canal}: ${pedidos}%`}>
                                {MOCK_CANAL.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                            </Pie><Tooltip /></PieChart>
                        </ResponsiveContainer>
                    </Card>
                    <Card>
                        <h3 style={S.cardTitle}>Detalle por Canal</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {MOCK_CANAL.map((c, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: PIE_COLORS[i] }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: FONT.sm, fontWeight: '500', color: COLORS.text }}>{c.canal}</span>
                                            <span style={{ fontSize: FONT.sm, fontWeight: '700', color: COLORS.dark }}>{c.pedidos}%</span>
                                        </div>
                                        <div style={{ height: '8px', backgroundColor: COLORS.bgAlt, borderRadius: RADIUS.full, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', borderRadius: RADIUS.full, width: `${c.pedidos}%`, backgroundColor: PIE_COLORS[i] }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

const S = {
    cardTitle: { fontWeight: '600', color: COLORS.dark, margin: '0 0 16px 0', fontSize: FONT.base },
    th: { textAlign: 'left', padding: '8px 12px', fontSize: FONT.xs, fontWeight: '500', color: COLORS.textLight },
};
