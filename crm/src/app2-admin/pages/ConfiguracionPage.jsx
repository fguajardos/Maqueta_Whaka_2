import React, { useState } from 'react';
import { DollarSign, MapPin, FileText, Globe, Users, Save } from 'lucide-react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import { CONFIGURACION, USUARIOS, formatCLP } from '../../data/mockData';
import { COLORS, FONT, RADIUS, INPUT_STYLE } from '../../styles/tokens';

const TABS = [
    { key: 'comercial', label: 'Reglas Comerciales', icon: DollarSign },
    { key: 'zonas', label: 'Zonas de Cobertura', icon: MapPin },
    { key: 'listas', label: 'Listas de Precios', icon: FileText },
    { key: 'integraciones', label: 'Integraciones', icon: Globe },
    { key: 'usuarios', label: 'Usuarios del Sistema', icon: Users },
];

export default function ConfiguracionPage() {
    const [tab, setTab] = useState('comercial');
    const [saved, setSaved] = useState(false);
    const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: FONT.xxl, fontWeight: '700', color: COLORS.dark, margin: 0 }}>Configuración</h1>
                {saved && <Badge status="activo" label="✅ Cambios guardados" size="lg" />}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', borderBottom: `1px solid ${COLORS.borderLight}`, overflowX: 'auto' }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: FONT.sm, fontWeight: '500', borderBottom: `2px solid ${tab === t.key ? COLORS.primary : 'transparent'}`, color: tab === t.key ? COLORS.primary : COLORS.textLight, background: 'none', border: 'none', borderBottomStyle: 'solid', cursor: 'pointer', fontFamily: FONT.family, whiteSpace: 'nowrap' }}>
                        <t.icon size={16} />{t.label}
                    </button>
                ))}
            </div>

            {/* Reglas Comerciales */}
            {tab === 'comercial' && (
                <Card>
                    <h3 style={S.cardTitle}>Reglas Comerciales</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Field label="Monto Mínimo de Pedido (CLP)"><input type="number" defaultValue={CONFIGURACION.reglasComerciales.montoMinimoPedido} style={INPUT_STYLE} /></Field>
                        <Field label="Despacho Gratis Sobre (CLP)"><input type="number" defaultValue={CONFIGURACION.reglasComerciales.despachoGratisSobre} style={INPUT_STYLE} /></Field>
                        <Field label="Costo de Despacho (CLP)"><input type="number" defaultValue={CONFIGURACION.reglasComerciales.costoDespacho} style={INPUT_STYLE} /></Field>
                        <Field label="Horario Operación"><input type="text" defaultValue={CONFIGURACION.reglasComerciales.horarioOperacion} style={INPUT_STYLE} /></Field>
                    </div>
                    <div style={{ marginTop: '24px' }}>
                        <h4 style={{ fontSize: FONT.sm, fontWeight: '600', color: COLORS.text, marginBottom: '12px' }}>Descuentos por Volumen</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr style={{ backgroundColor: COLORS.bgAlt }}><th style={S.th}>Desde</th><th style={S.th}>Hasta</th><th style={S.th}>Descuento (%)</th></tr></thead>
                            <tbody>
                                {CONFIGURACION.reglasComerciales.descuentosVolumen.map((d, i) => (
                                    <tr key={i} style={{ borderTop: `1px solid ${COLORS.borderLight}` }}>
                                        <td style={{ padding: '8px 12px', fontSize: FONT.sm }}>{d.desde}u</td>
                                        <td style={{ padding: '8px 12px', fontSize: FONT.sm }}>{d.hasta === '+' ? '∞' : `${d.hasta}u`}</td>
                                        <td style={{ padding: '8px 12px' }}><input type="number" defaultValue={d.descuento} style={{ ...INPUT_STYLE, width: '64px', textAlign: 'center' }} /> %</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Button onClick={handleSave} style={{ marginTop: '16px' }}><Save size={16} /> Guardar Cambios</Button>
                </Card>
            )}

            {/* Zonas */}
            {tab === 'zonas' && (
                <Card>
                    <h3 style={S.cardTitle}>Zonas de Cobertura</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {CONFIGURACION.zonas.map((zona, i) => (
                            <div key={i} style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: RADIUS.lg, padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <MapPin size={16} color={COLORS.primary} />
                                        <h4 style={{ fontWeight: '600', color: COLORS.dark, margin: 0 }}>{zona.nombre}</h4>
                                    </div>
                                    <Badge status={zona.activa ? 'activo' : 'inactivo'} label={zona.activa ? 'Activa' : 'Inactiva'} />
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {zona.comunas.map((c, j) => (
                                        <span key={j} style={{ backgroundColor: COLORS.bgAlt, color: COLORS.text, fontSize: FONT.xs, padding: '4px 10px', borderRadius: RADIUS.full }}>{c}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <Button variant="secondary"><MapPin size={16} /> Agregar Zona</Button>
                    </div>
                </Card>
            )}

            {/* Listas de Precios */}
            {tab === 'listas' && (
                <Card>
                    <h3 style={S.cardTitle}>Listas de Precios</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {CONFIGURACION.listasPrecios.map((lista, i) => (
                            <div key={i} style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: RADIUS.lg, padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <h4 style={{ fontWeight: '600', color: COLORS.dark, margin: 0 }}>{lista.nombre}</h4>
                                    <span style={{ fontSize: FONT.xs, backgroundColor: COLORS.primaryLight, color: COLORS.primary, padding: '4px 10px', borderRadius: RADIUS.full, fontWeight: '500' }}>{lista.descuento}% desc.</span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {lista.tiposCliente.map((t, j) => (
                                        <span key={j} style={{ backgroundColor: COLORS.bgAlt, color: COLORS.text, fontSize: FONT.xs, padding: '4px 10px', borderRadius: RADIUS.full, textTransform: 'capitalize' }}>{t.replace(/_/g, ' ')}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Integraciones */}
            {tab === 'integraciones' && (
                <Card>
                    <h3 style={S.cardTitle}>Integraciones</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {CONFIGURACION.integraciones.map((integ, i) => (
                            <div key={i} style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: RADIUS.lg, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: RADIUS.lg, backgroundColor: COLORS.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Globe size={20} color={COLORS.textLight} />
                                    </div>
                                    <div>
                                        <h4 style={{ fontWeight: '600', color: COLORS.dark, margin: 0, fontSize: FONT.sm }}>{integ.nombre}</h4>
                                        <p style={{ fontSize: FONT.xs, color: COLORS.textLight, margin: 0 }}>{integ.tipo}</p>
                                    </div>
                                </div>
                                <Badge status={integ.activa ? 'activo' : 'inactivo'} label={integ.activa ? 'Conectado' : 'Desconectado'} />
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Usuarios */}
            {tab === 'usuarios' && (
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 style={{ ...S.cardTitle, margin: 0 }}>Usuarios del Sistema</h3>
                        <Button size="sm"><Users size={16} /> Nuevo Usuario</Button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ backgroundColor: COLORS.bgAlt }}><th style={S.th}>Nombre</th><th style={S.th}>Email</th><th style={S.th}>Rol</th><th style={S.th}>Estado</th></tr></thead>
                        <tbody>
                            {USUARIOS.map(u => (
                                <tr key={u.id} style={{ borderTop: `1px solid ${COLORS.borderLight}` }}>
                                    <td style={{ padding: '8px 12px', fontSize: FONT.sm, fontWeight: '500', color: COLORS.dark }}>{u.nombre}</td>
                                    <td style={{ padding: '8px 12px', fontSize: FONT.sm, color: COLORS.textLight }}>{u.email}</td>
                                    <td style={{ padding: '8px 12px' }}><Badge status={u.rol} label={u.rol.charAt(0).toUpperCase() + u.rol.slice(1)} size="sm" /></td>
                                    <td style={{ padding: '8px 12px' }}><Badge status="activo" size="sm" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: FONT.sm, fontWeight: '500', color: COLORS.text, marginBottom: '4px' }}>{label}</label>
            {children}
        </div>
    );
}

const S = {
    cardTitle: { fontWeight: '600', color: COLORS.dark, margin: '0 0 16px 0', fontSize: FONT.base },
    th: { textAlign: 'left', padding: '8px 12px', fontSize: FONT.xs, fontWeight: '500', color: COLORS.textLight },
};
