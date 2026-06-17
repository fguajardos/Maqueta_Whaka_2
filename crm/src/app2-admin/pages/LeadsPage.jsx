import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, LayoutGrid, List, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { LEADS as MOCK_LEADS, formatDate } from '../../data/mockData';
import { useAuth } from '../AuthContext';
import { COLORS, FONT, RADIUS, INPUT_STYLE } from '../../styles/tokens';

const API_BASE_URL = import.meta.env.VITE_WMS_URL || 'http://localhost:3000';

const ESTADOS_LEAD = [
    { key: 'nuevo', label: 'Nuevo', color: '#1D4ED8' },
    { key: 'pendiente', label: 'Pendiente', color: '#B45309' },
    { key: 'aprobado', label: 'Aprobado', color: '#15803D' },
    { key: 'observado', label: 'Observado', color: '#C2410C' },
    { key: 'rechazado', label: 'Rechazado', color: '#B91C1C' },
];

// Normaliza un lead del backend (tabla prisma.lead) al shape que usa la página
function fromBackend(l) {
    return {
        id: l.id,
        empresa: l.razonSocial || '—',
        contacto: l.contactName || '',
        telefono: l.phone || '',
        email: l.email || '',
        tipoNegocio: l.tipoNegocio || '',
        tipoCliente: l.tipoCliente || '',
        direccion: l.direccion || l.formData?.direccion || '',
        comuna: l.comuna || l.formData?.comuna || '—',
        region: l.region || l.formData?.region || '',
        // 'cliente_creado' se muestra como aprobado para encajar en el tablero
        estado: l.status === 'cliente_creado' ? 'aprobado' : (l.status || 'pendiente'),
        statusReal: l.status,
        canalCaptacion: 'whatsapp',
        fechaCaptacion: l.createdAt,
        rut: l.rut,
        notas: l.adminNotes || '',
        productosInteres: [],
        _origen: 'backend',
    };
}

// Normaliza un lead mock (datos de demo) al mismo shape
function fromMock(l) {
    return {
        id: l.id,
        empresa: l.empresa,
        contacto: l.nombreContacto || '',
        telefono: l.telefono || '',
        email: l.email || '',
        tipoNegocio: l.tipoNegocio || '',
        tipoCliente: '',
        direccion: l.direccionDespacho || '',
        comuna: l.comuna || '—',
        region: l.region || '',
        estado: l.estado,
        statusReal: l.estado,
        canalCaptacion: l.canalCaptacion || 'manual_backoffice',
        fechaCaptacion: l.fechaContacto,
        rut: l.rut,
        notas: l.notasInternas || '',
        productosInteres: l.productosInteres || [],
        _origen: 'mock',
    };
}

export default function LeadsPage() {
    const { wmsToken, user } = useAuth();
    const [search, setSearch] = useState('');
    const [view, setView] = useState('tabla');
    const [selectedLead, setSelectedLead] = useState(null);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [source, setSource] = useState('backend'); // 'backend' | 'mock'
    const [actionLoading, setActionLoading] = useState(false);
    const [tab, setTab] = useState('activos'); // 'activos' | 'historicos'

    const cargarLeads = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/leads`, {
                headers: wmsToken ? { Authorization: `Bearer ${wmsToken}` } : {},
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setLeads((data.leads || []).map(fromBackend));
            setSource('backend');
        } catch (err) {
            console.warn('[Leads] Backend no disponible, usando datos de demo:', err.message);
            setLeads(MOCK_LEADS.map(fromMock));
            setSource('mock');
        } finally {
            setLoading(false);
        }
    }, [wmsToken]);

    useEffect(() => { cargarLeads(); }, [cargarLeads]);

    // Aprobar / rechazar (solo leads reales del backend)
    const aprobarLead = useCallback(async (lead) => {
        if (lead._origen !== 'backend') return;
        setActionLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/leads/${lead.id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(wmsToken ? { Authorization: `Bearer ${wmsToken}` } : {}) },
                body: JSON.stringify({ userId: user?.email || 'admin' }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'No se pudo aprobar');
            setSelectedLead(null);
            await cargarLeads();
        } catch (err) {
            alert('Error al aprobar el lead: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    }, [wmsToken, user, cargarLeads]);

    const rechazarLead = useCallback(async (lead) => {
        if (lead._origen !== 'backend') return;
        const reason = window.prompt('Motivo del rechazo:', 'Datos incompletos');
        if (reason === null) return;
        setActionLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/leads/${lead.id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(wmsToken ? { Authorization: `Bearer ${wmsToken}` } : {}) },
                body: JSON.stringify({ userId: user?.email || 'admin', reason }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'No se pudo rechazar');
            setSelectedLead(null);
            await cargarLeads();
        } catch (err) {
            alert('Error al rechazar el lead: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    }, [wmsToken, user, cargarLeads]);

    // Activos = requieren gestión · Históricos = ya resueltos (aprobados/rechazados)
    const TAB_ESTADOS = {
        activos: ['nuevo', 'pendiente', 'observado'],
        historicos: ['aprobado', 'rechazado'],
    };
    const bySearch = leads.filter(l => !search
        || l.empresa.toLowerCase().includes(search.toLowerCase())
        || (l.contacto || '').toLowerCase().includes(search.toLowerCase())
        || (l.rut || '').toLowerCase().includes(search.toLowerCase()));
    const countActivos = bySearch.filter(l => TAB_ESTADOS.activos.includes(l.estado)).length;
    const countHistoricos = bySearch.filter(l => TAB_ESTADOS.historicos.includes(l.estado)).length;
    const filtered = bySearch.filter(l => TAB_ESTADOS[tab].includes(l.estado));

    const leadsByEstado = {};
    ESTADOS_LEAD.forEach(e => { leadsByEstado[e.key] = filtered.filter(l => l.estado === e.key); });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h1 style={{ fontSize: FONT.xxl, fontWeight: '700', color: COLORS.dark, margin: 0 }}>Leads</h1>
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
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="ghost" size="sm" onClick={cargarLeads} disabled={loading}><RefreshCw size={16} style={loading ? { animation: 'spin 1s linear infinite' } : undefined} /> Actualizar</Button>
                    <Button variant={view === 'tabla' ? 'primary' : 'ghost'} size="sm" onClick={() => setView('tabla')}><List size={16} /></Button>
                    <Button variant={view === 'kanban' ? 'primary' : 'ghost'} size="sm" onClick={() => setView('kanban')}><LayoutGrid size={16} /></Button>
                    <Button><Plus size={16} /> Nuevo Lead</Button>
                </div>
            </div>

            {/* Search */}
            <Card style={{ padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: COLORS.bgAlt, borderRadius: RADIUS.lg, padding: '8px 12px' }}>
                    <Search size={16} color={COLORS.textLight} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar empresa, contacto o RUT..." style={{ ...INPUT_STYLE, border: 'none', padding: 0, backgroundColor: 'transparent' }} />
                </div>
            </Card>

            {/* Tabs Activos / Históricos */}
            <div style={{ display: 'flex', gap: '4px', borderBottom: `1px solid ${COLORS.borderLight}` }}>
                {[
                    { key: 'activos', label: `Activos (${countActivos})` },
                    { key: 'historicos', label: `Históricos (${countHistoricos})` },
                ].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        style={{ padding: '8px 16px', fontSize: FONT.sm, fontWeight: '600', borderBottom: `2px solid ${tab === t.key ? COLORS.primary : 'transparent'}`, color: tab === t.key ? COLORS.primary : COLORS.textLight, background: 'none', border: 'none', borderBottomStyle: 'solid', cursor: 'pointer', fontFamily: FONT.family }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Table View */}
            {view === 'tabla' && (
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: COLORS.primary, color: COLORS.white }}>
                                    {['Empresa', 'Contacto', 'Tipo', 'Comuna', 'Estado', 'Canal', 'Fecha'].map(h => (
                                        <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: FONT.xs, fontWeight: '600', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: COLORS.textLight }}>Cargando leads...</td></tr>
                                )}
                                {!loading && filtered.length === 0 && (
                                    <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: COLORS.textLight }}>No hay leads que mostrar.</td></tr>
                                )}
                                {!loading && filtered.map((lead, i) => (
                                    <tr key={lead.id} onClick={() => setSelectedLead(lead)} style={{ borderBottom: `1px solid ${COLORS.borderLight}`, backgroundColor: i % 2 === 1 ? COLORS.bgAlt : COLORS.white, cursor: 'pointer' }}>
                                        <td style={{ ...S.td, fontWeight: '600', color: COLORS.primary }}>{lead.empresa}</td>
                                        <td style={S.td}>{lead.contacto || '—'}</td>
                                        <td style={{ ...S.td, color: COLORS.textLight }}>{lead.tipoNegocio || '—'}</td>
                                        <td style={{ ...S.td, color: COLORS.textLight }}>{lead.comuna}</td>
                                        <td style={S.td}><Badge status={lead.estado} size="sm" /></td>
                                        <td style={S.td}><Badge status={lead.canalCaptacion} size="sm" /></td>
                                        <td style={{ ...S.td, color: COLORS.textLight }}>{formatDate(lead.fechaCaptacion)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Kanban View */}
            {view === 'kanban' && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${ESTADOS_LEAD.length}, minmax(220px, 1fr))`, gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
                    {ESTADOS_LEAD.map(estado => (
                        <div key={estado.key}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '8px 12px', backgroundColor: COLORS.bgAlt, borderRadius: RADIUS.lg, borderLeft: `4px solid ${estado.color}` }}>
                                <h3 style={{ fontSize: FONT.sm, fontWeight: '600', color: COLORS.dark, margin: 0 }}>{estado.label}</h3>
                                <span style={{ fontSize: FONT.xs, fontWeight: '700', color: estado.color, backgroundColor: estado.color + '15', padding: '2px 8px', borderRadius: RADIUS.full }}>{(leadsByEstado[estado.key] || []).length}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {(leadsByEstado[estado.key] || []).map(lead => (
                                    <Card key={lead.id} onClick={() => setSelectedLead(lead)} style={{ padding: '12px' }}>
                                        <p style={{ fontSize: FONT.sm, fontWeight: '600', color: COLORS.dark, marginBottom: '4px' }}>{lead.empresa}</p>
                                        <p style={{ fontSize: FONT.xs, color: COLORS.textLight, marginBottom: '8px' }}>{lead.contacto || lead.rut} · {lead.tipoNegocio}</p>
                                        <Badge status={lead.canalCaptacion} size="sm" />
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            <Modal isOpen={!!selectedLead} onClose={() => setSelectedLead(null)} title={selectedLead?.empresa || ''} size="lg">
                {selectedLead && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <InfoRow label="RUT" value={selectedLead.rut || '-'} />
                            <InfoRow label="Contacto" value={selectedLead.contacto || '-'} />
                            <InfoRow label="Teléfono" value={selectedLead.telefono || '-'} />
                            <InfoRow label="Tipo de Negocio" value={selectedLead.tipoNegocio || '-'} />
                            <InfoRow label="Dirección" value={selectedLead.direccion || '-'} />
                            <InfoRow label="Comuna" value={selectedLead.comuna} />
                            <InfoRow label="Región" value={selectedLead.region || '-'} />
                            <InfoRow label="Estado" value={<Badge status={selectedLead.estado} />} />
                            <InfoRow label="Canal" value={<Badge status={selectedLead.canalCaptacion} />} />
                            <InfoRow label="Fecha Captación" value={formatDate(selectedLead.fechaCaptacion)} />
                        </div>
                        {selectedLead.notas && (
                            <div style={{ backgroundColor: COLORS.bgAlt, padding: '12px 16px', borderRadius: RADIUS.lg }}>
                                <p style={{ fontSize: FONT.xs, fontWeight: '500', color: COLORS.textLight, marginBottom: '4px' }}>Notas</p>
                                <p style={{ fontSize: FONT.sm, color: COLORS.text }}>{selectedLead.notas}</p>
                            </div>
                        )}
                        {selectedLead._origen === 'backend' && selectedLead.statusReal === 'pendiente' ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Button variant="primary" onClick={() => aprobarLead(selectedLead)} disabled={actionLoading}>
                                    {actionLoading ? 'Procesando...' : 'Aprobar Lead'}
                                </Button>
                                <Button variant="danger" onClick={() => rechazarLead(selectedLead)} disabled={actionLoading}>Rechazar</Button>
                            </div>
                        ) : selectedLead._origen === 'mock' ? (
                            <p style={{ fontSize: FONT.xs, color: COLORS.textLight, fontStyle: 'italic' }}>Lead de demo — las acciones solo aplican a leads reales del WMS.</p>
                        ) : (
                            <p style={{ fontSize: FONT.xs, color: COLORS.textLight, fontStyle: 'italic' }}>Este lead ya fue gestionado (estado: {selectedLead.statusReal}).</p>
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

const S = { td: { padding: '12px 16px', fontSize: FONT.sm } };
