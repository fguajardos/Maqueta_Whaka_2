import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, UserCheck, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { CLIENTES as MOCK_CLIENTES, PEDIDOS, formatCLP, formatDate } from '../../data/mockData';
import { useAuth } from '../AuthContext';
import { COLORS, FONT, RADIUS, INPUT_STYLE } from '../../styles/tokens';

const API_BASE_URL = import.meta.env.VITE_WMS_URL || 'http://localhost:3000';

// Normaliza un cliente del backend (prisma.cliente) al shape de la página
function fromBackend(c) {
    return {
        id: c.id,
        empresa: c.razonSocial || '—',
        contacto: c.contactName || '',
        telefono: c.phone || '',
        email: c.email || '',
        rut: c.rut || '',
        tipoCliente: c.tipoCliente || '',
        estadoComercial: c.estado || 'activo',
        condicionPago: c.condicionPago || 'prepago',
        limiteCredito: c.limiteCredito || 0,
        deudaVencida: 0,
        comuna: c.comuna || '',
        region: c.region || '',
        direccionDespacho: c.direccion || '',
        listaPrecios: c.listaPreciosId || '-',
        frecuenciaPedido: '-',
        origenCliente: c.leadId ? 'whatsapp' : 'manual_backoffice',
        _origen: 'backend',
    };
}

// Normaliza un cliente mock (datos de demo) al mismo shape
function fromMock(c) {
    return {
        id: c.id,
        empresa: c.empresa,
        contacto: c.nombreContacto || '',
        telefono: c.telefono || '',
        email: c.email || '',
        rut: c.rut || '',
        tipoCliente: c.tipoNegocio || '',
        estadoComercial: c.estadoComercial,
        condicionPago: c.condicionPago,
        limiteCredito: c.limiteCredito || 0,
        deudaVencida: c.deudaVencida || 0,
        comuna: c.comuna || '',
        region: c.region || '',
        direccionDespacho: c.direccionDespacho || '',
        listaPrecios: c.listaPreciosId || '-',
        frecuenciaPedido: c.frecuenciaCompra || '-',
        origenCliente: c.leadOrigenId ? 'whatsapp' : 'manual_backoffice',
        _origen: 'mock',
    };
}

export default function ClientesPage() {
    const { wmsToken } = useAuth();
    const [search, setSearch] = useState('');
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [activeTab, setActiveTab] = useState('general');
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [source, setSource] = useState('backend');

    const cargarClientes = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/clientes`, {
                headers: wmsToken ? { Authorization: `Bearer ${wmsToken}` } : {},
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setClientes((data.clientes || []).map(fromBackend));
            setSource('backend');
        } catch (err) {
            console.warn('[Clientes] Backend no disponible, usando datos de demo:', err.message);
            setClientes(MOCK_CLIENTES.map(fromMock));
            setSource('mock');
        } finally {
            setLoading(false);
        }
    }, [wmsToken]);

    useEffect(() => { cargarClientes(); }, [cargarClientes]);

    const filtered = clientes.filter(c => !search
        || c.empresa.toLowerCase().includes(search.toLowerCase())
        || (c.contacto || '').toLowerCase().includes(search.toLowerCase())
        || (c.rut || '').toLowerCase().includes(search.toLowerCase()));

    const clientePedidos = selectedCliente ? PEDIDOS.filter(p => p.clienteId === selectedCliente.id) : [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h1 style={{ fontSize: FONT.xxl, fontWeight: '700', color: COLORS.dark, margin: 0 }}>Clientes</h1>
                    {source === 'backend' ? (
                        <span title="Datos en vivo desde el WMS" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: FONT.xs, fontWeight: '600', color: '#15803D', backgroundColor: '#DCFCE7', padding: '4px 10px', borderRadius: RADIUS.full }}>
                            <Wifi size={12} /> En vivo
                        </span>
                    ) : (
                        <span title="Backend no disponible — mostrando datos de demo" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: FONT.xs, fontWeight: '600', color: '#B45309', backgroundColor: '#FEF3C7', padding: '4px 10px', borderRadius: RADIUS.full }}>
                            <WifiOff size={12} /> Demo (sin backend)
                        </span>
                    )}
                </div>
                <Button variant="ghost" size="sm" onClick={cargarClientes} disabled={loading}><RefreshCw size={16} style={loading ? { animation: 'spin 1s linear infinite' } : undefined} /> Actualizar</Button>
            </div>

            {/* Search */}
            <Card style={{ padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: COLORS.bgAlt, borderRadius: RADIUS.lg, padding: '8px 12px' }}>
                    <Search size={16} color={COLORS.textLight} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar empresa, contacto o RUT..." style={{ ...INPUT_STYLE, border: 'none', padding: 0, backgroundColor: 'transparent' }} />
                </div>
            </Card>

            {/* Table */}
            <Card style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: COLORS.primary, color: COLORS.white }}>
                                {['Empresa', 'Contacto', 'Tipo', 'Estado', 'Condición Pago', 'Crédito', 'Origen', ''].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: FONT.xs, fontWeight: '600', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: COLORS.textLight }}>Cargando clientes...</td></tr>}
                            {!loading && filtered.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: COLORS.textLight }}>No hay clientes que mostrar.</td></tr>}
                            {!loading && filtered.map((c, i) => (
                                <tr key={c.id} onClick={() => { setSelectedCliente(c); setActiveTab('general'); }} style={{ borderBottom: `1px solid ${COLORS.borderLight}`, backgroundColor: i % 2 === 1 ? COLORS.bgAlt : COLORS.white, cursor: 'pointer' }}>
                                    <td style={{ ...S.td, fontWeight: '600', color: COLORS.primary }}>{c.empresa}</td>
                                    <td style={S.td}>{c.contacto || '—'}</td>
                                    <td style={{ ...S.td, color: COLORS.textLight }}>{c.tipoCliente?.replace(/_/g, ' ') || '-'}</td>
                                    <td style={S.td}><Badge status={c.estadoComercial} size="sm" /></td>
                                    <td style={S.td}><Badge status={c.condicionPago} size="sm" /></td>
                                    <td style={{ ...S.td, fontWeight: '600' }}>{formatCLP(c.limiteCredito)}</td>
                                    <td style={S.td}><Badge status={c.origenCliente} size="sm" /></td>
                                    <td style={S.td}><Eye size={16} color={COLORS.textLight} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Detail Modal */}
            <Modal isOpen={!!selectedCliente} onClose={() => setSelectedCliente(null)} title="" size="xl">
                {selectedCliente && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: COLORS.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <UserCheck size={24} color={COLORS.primary} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: FONT.xl, fontWeight: '700', color: COLORS.dark, margin: 0 }}>{selectedCliente.empresa}</h2>
                                <p style={{ fontSize: FONT.sm, color: COLORS.textLight, margin: 0 }}>{selectedCliente.contacto} · {selectedCliente.telefono}</p>
                            </div>
                            <div style={{ marginLeft: 'auto' }}><Badge status={selectedCliente.estadoComercial} /></div>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '4px', borderBottom: `1px solid ${COLORS.borderLight}` }}>
                            {[{ key: 'general', label: 'General' }, { key: 'pedidos', label: `Pedidos (${clientePedidos.length})` }, { key: 'credito', label: 'Crédito' }].map(t => (
                                <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ padding: '8px 16px', fontSize: FONT.sm, fontWeight: '500', borderBottom: `2px solid ${activeTab === t.key ? COLORS.primary : 'transparent'}`, color: activeTab === t.key ? COLORS.primary : COLORS.textLight, background: 'none', border: 'none', borderBottomStyle: 'solid', cursor: 'pointer', fontFamily: FONT.family, transition: 'all 0.15s' }}>
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'general' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <InfoRow label="RUT" value={selectedCliente.rut || '-'} />
                                <InfoRow label="Email" value={selectedCliente.email || '-'} />
                                <InfoRow label="Tipo Cliente" value={selectedCliente.tipoCliente?.replace(/_/g, ' ') || '-'} />
                                <InfoRow label="Dirección Despacho" value={selectedCliente.direccionDespacho || '-'} />
                                <InfoRow label="Comuna" value={selectedCliente.comuna || '-'} />
                                <InfoRow label="Región" value={selectedCliente.region || '-'} />
                                <InfoRow label="Lista de Precios" value={selectedCliente.listaPrecios || '-'} />
                                <InfoRow label="Origen" value={<Badge status={selectedCliente.origenCliente} size="sm" />} />
                            </div>
                        )}

                        {activeTab === 'pedidos' && (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: COLORS.bgAlt }}>
                                            {['# Pedido', 'Fecha', 'Estado', 'Total'].map(h => (
                                                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: FONT.xs, fontWeight: '500', color: COLORS.textLight }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clientePedidos.map(p => (
                                            <tr key={p.id} style={{ borderTop: `1px solid ${COLORS.borderLight}` }}>
                                                <td style={{ padding: '8px 12px', fontSize: FONT.sm, fontWeight: '600', color: COLORS.primary }}>{p.id}</td>
                                                <td style={{ padding: '8px 12px', fontSize: FONT.sm, color: COLORS.textLight }}>{formatDate(p.fechaPedido)}</td>
                                                <td style={{ padding: '8px 12px' }}><Badge status={p.estado} size="sm" /></td>
                                                <td style={{ padding: '8px 12px', fontSize: FONT.sm, fontWeight: '600' }}>{formatCLP(p.total)}</td>
                                            </tr>
                                        ))}
                                        {clientePedidos.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: COLORS.textLight, fontSize: FONT.sm }}>Sin pedidos registrados</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'credito' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                <StatBox label="Límite de Crédito" value={formatCLP(selectedCliente.limiteCredito)} bg={COLORS.primaryLight} color={COLORS.primary} />
                                <StatBox label="Deuda Vencida" value={formatCLP(selectedCliente.deudaVencida)} bg={selectedCliente.deudaVencida > 0 ? '#FEE2E2' : COLORS.successLight} color={selectedCliente.deudaVencida > 0 ? COLORS.danger : COLORS.success} />
                                <StatBox label="Condición de Pago" value={selectedCliente.condicionPago?.replace(/_/g, ' ') || '-'} bg={COLORS.infoLight} color={COLORS.info} />
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div>
            <p style={{ fontSize: FONT.xs, color: COLORS.textLight, marginBottom: '4px' }}>{label}</p>
            <div style={{ fontSize: FONT.sm, fontWeight: '500', color: COLORS.dark }}>{value}</div>
        </div>
    );
}

function StatBox({ label, value, bg, color }) {
    return (
        <div style={{ backgroundColor: bg, borderRadius: RADIUS.lg, padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: FONT.xl, fontWeight: '700', color, margin: '0 0 4px 0' }}>{value}</p>
            <p style={{ fontSize: FONT.xs, color, margin: 0 }}>{label}</p>
        </div>
    );
}

const S = { td: { padding: '12px 16px', fontSize: FONT.sm } };
