import React, { useState } from 'react';
import { Search, Plus, Filter, Eye, LayoutGrid, List } from 'lucide-react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { LEADS, formatDate } from '../../data/mockData';
import { COLORS, FONT, RADIUS, INPUT_STYLE } from '../../styles/tokens';

const ESTADOS_LEAD = [
    { key: 'nuevo', label: 'Nuevo', color: '#1D4ED8' },
    { key: 'pendiente', label: 'Pendiente', color: '#B45309' },
    { key: 'aprobado', label: 'Aprobado', color: '#15803D' },
    { key: 'observado', label: 'Observado', color: '#C2410C' },
    { key: 'rechazado', label: 'Rechazado', color: '#B91C1C' },
];

export default function LeadsPage() {
    const [search, setSearch] = useState('');
    const [view, setView] = useState('tabla');
    const [selectedLead, setSelectedLead] = useState(null);

    const filtered = LEADS.filter(l => !search || l.empresa.toLowerCase().includes(search.toLowerCase()) || l.contacto.toLowerCase().includes(search.toLowerCase()));

    const leadsByEstado = {};
    ESTADOS_LEAD.forEach(e => { leadsByEstado[e.key] = filtered.filter(l => l.estado === e.key); });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: FONT.xxl, fontWeight: '700', color: COLORS.dark, margin: 0 }}>Leads</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant={view === 'tabla' ? 'primary' : 'ghost'} size="sm" onClick={() => setView('tabla')}><List size={16} /></Button>
                    <Button variant={view === 'kanban' ? 'primary' : 'ghost'} size="sm" onClick={() => setView('kanban')}><LayoutGrid size={16} /></Button>
                    <Button><Plus size={16} /> Nuevo Lead</Button>
                </div>
            </div>

            {/* Search */}
            <Card style={{ padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: COLORS.bgAlt, borderRadius: RADIUS.lg, padding: '8px 12px' }}>
                    <Search size={16} color={COLORS.textLight} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar empresa o contacto..." style={{ ...INPUT_STYLE, border: 'none', padding: 0, backgroundColor: 'transparent' }} />
                </div>
            </Card>

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
                                {filtered.map((lead, i) => (
                                    <tr key={lead.id} onClick={() => setSelectedLead(lead)} style={{ borderBottom: `1px solid ${COLORS.borderLight}`, backgroundColor: i % 2 === 1 ? COLORS.bgAlt : COLORS.white, cursor: 'pointer' }}>
                                        <td style={{ ...S.td, fontWeight: '600', color: COLORS.primary }}>{lead.empresa}</td>
                                        <td style={S.td}>{lead.contacto}</td>
                                        <td style={{ ...S.td, color: COLORS.textLight }}>{lead.tipoNegocio}</td>
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
                                        <p style={{ fontSize: FONT.xs, color: COLORS.textLight, marginBottom: '8px' }}>{lead.contacto} · {lead.tipoNegocio}</p>
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
                            <InfoRow label="Contacto" value={selectedLead.contacto} />
                            <InfoRow label="Teléfono" value={selectedLead.telefono} />
                            <InfoRow label="Tipo de Negocio" value={selectedLead.tipoNegocio} />
                            <InfoRow label="Comuna" value={selectedLead.comuna} />
                            <InfoRow label="Estado" value={<Badge status={selectedLead.estado} />} />
                            <InfoRow label="Canal" value={<Badge status={selectedLead.canalCaptacion} />} />
                            <InfoRow label="Fecha Captación" value={formatDate(selectedLead.fechaCaptacion)} />
                            <InfoRow label="Productos Interés" value={selectedLead.productosInteres?.join(', ') || '-'} />
                        </div>
                        {selectedLead.notas && (
                            <div style={{ backgroundColor: COLORS.bgAlt, padding: '12px 16px', borderRadius: RADIUS.lg }}>
                                <p style={{ fontSize: FONT.xs, fontWeight: '500', color: COLORS.textLight, marginBottom: '4px' }}>Notas</p>
                                <p style={{ fontSize: FONT.sm, color: COLORS.text }}>{selectedLead.notas}</p>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button variant="primary">Aprobar Lead</Button>
                            <Button variant="secondary">Contactar</Button>
                            <Button variant="danger">Rechazar</Button>
                        </div>
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
