import React, { useState } from 'react';
import { Search, Plus, Eye, Edit, ToggleLeft, ToggleRight, Leaf, Tag, Package } from 'lucide-react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { PRODUCTOS, CATEGORIAS, formatCLP } from '../../data/mockData';
import { COLORS, FONT, RADIUS, INPUT_STYLE } from '../../styles/tokens';

export default function CatalogoPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategoria, setFilterCategoria] = useState('');
    const [selectedProducto, setSelectedProducto] = useState(null);
    const [productos, setProductos] = useState(PRODUCTOS);

    const filtered = productos.filter(p => {
        const matchSearch = !searchTerm || p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategoria = !filterCategoria || p.categoria === filterCategoria;
        return matchSearch && matchCategoria;
    });

    const toggleActivo = (id) => setProductos(prev => prev.map(p => p.id === id ? { ...p, activo: !p.activo } : p));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: FONT.xxl, fontWeight: '700', color: COLORS.dark, margin: 0 }}>Catálogo de Productos</h1>
                <Button><Plus size={16} /> Nuevo Producto</Button>
            </div>

            {/* Filters */}
            <Card style={{ padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: COLORS.bgAlt, borderRadius: RADIUS.lg, padding: '8px 12px', flex: 1, minWidth: '200px' }}>
                        <Search size={16} color={COLORS.textLight} />
                        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar por nombre, SKU..." style={{ ...INPUT_STYLE, border: 'none', padding: 0, backgroundColor: 'transparent' }} />
                    </div>
                    <select value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)} style={{ ...INPUT_STYLE, width: 'auto', minWidth: '180px' }}>
                        <option value="">Todas las categorías</option>
                        {CATEGORIAS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                </div>
            </Card>

            {/* Products Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {filtered.map(product => (
                    <Card key={product.id} style={{ padding: 0, overflow: 'hidden' }}>
                        {/* Image placeholder */}
                        <div style={{ position: 'relative', height: '128px', background: `linear-gradient(135deg, ${COLORS.primaryLight}, #CCFBF1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Leaf size={48} color={COLORS.primary} style={{ opacity: 0.3 }} />
                            <button onClick={() => toggleActivo(product.id)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer' }} title={product.activo ? 'Desactivar' : 'Activar'}>
                                {product.activo ? <ToggleRight size={32} color="#22C55E" /> : <ToggleLeft size={32} color={COLORS.border} />}
                            </button>
                            {!product.activo && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.6)' }} />}
                        </div>
                        <div style={{ padding: '16px' }}>
                            <Badge status={product.categoria} label={CATEGORIAS.find(c => c.key === product.categoria)?.label || product.categoria} size="sm" />
                            <h3 style={{ fontWeight: '600', fontSize: FONT.sm, color: COLORS.dark, margin: '8px 0 4px' }}>{product.nombre}</h3>
                            <p style={{ fontSize: FONT.xs, color: COLORS.textLight, margin: '0 0 8px' }}>{product.formato} · SKU: {product.sku}</p>
                            <p style={{ fontSize: FONT.lg, fontWeight: '700', color: COLORS.primary, margin: 0 }}>{formatCLP(product.precioUnitario)}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: FONT.xs, color: COLORS.textLight, marginTop: '8px' }}>
                                <span>Stock: {product.stockDisponible}u</span>
                                <span>Reservado: {product.stockReservado}u</span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
                                <button onClick={() => setSelectedProducto(product)} style={{ ...S.actionBtn, backgroundColor: COLORS.bgAlt, color: COLORS.text }}><Eye size={14} /> Ver</button>
                                <button style={{ ...S.actionBtn, backgroundColor: COLORS.primaryLight, color: COLORS.primary }}><Edit size={14} /> Editar</button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Detail Modal */}
            <Modal isOpen={!!selectedProducto} onClose={() => setSelectedProducto(null)} title="Detalle de Producto" size="lg">
                {selectedProducto && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: RADIUS.xl, background: `linear-gradient(135deg, ${COLORS.primaryLight}, #CCFBF1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Leaf size={40} color={COLORS.primary} style={{ opacity: 0.4 }} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: FONT.xl, fontWeight: '700', color: COLORS.dark, margin: 0 }}>{selectedProducto.nombre}</h2>
                                <p style={{ fontSize: FONT.sm, color: COLORS.textLight, margin: '2px 0' }}>{selectedProducto.formato} · SKU: {selectedProducto.sku}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    <span style={{ fontSize: FONT.xxl, fontWeight: '700', color: COLORS.primary }}>{formatCLP(selectedProducto.precioUnitario)}</span>
                                    <Badge status={selectedProducto.activo ? 'activo' : 'inactivo'} />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                            <StatBox label="Disponible" value={selectedProducto.stockDisponible} bg={COLORS.bgAlt} color={COLORS.dark} />
                            <StatBox label="Reservado" value={selectedProducto.stockReservado} bg="#DBEAFE" color="#1D4ED8" />
                            <StatBox label="Stock Mínimo" value={selectedProducto.stockMinimo} bg="#FEF3C7" color="#B45309" />
                        </div>

                        {selectedProducto.infoNutricional && (
                            <div>
                                <h4 style={{ fontSize: FONT.sm, fontWeight: '600', color: COLORS.text, marginBottom: '8px' }}>Información Nutricional (por 100ml)</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px' }}>
                                    {Object.entries(selectedProducto.infoNutricional).map(([key, val]) => (
                                        <div key={key} style={{ backgroundColor: COLORS.bgAlt, borderRadius: RADIUS.lg, padding: '8px', textAlign: 'center' }}>
                                            <p style={{ fontSize: FONT.sm, fontWeight: '700', color: COLORS.dark, margin: 0 }}>{val}</p>
                                            <p style={{ fontSize: FONT.xs, color: COLORS.textLight, textTransform: 'capitalize', margin: 0 }}>{key}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedProducto.requiereMaquina !== undefined && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: FONT.sm }}>
                                <Tag size={16} color={COLORS.textLight} />
                                <span style={{ color: COLORS.text }}>¿Requiere máquina soft? <strong>{selectedProducto.requiereMaquina ? 'Sí' : 'No'}</strong></span>
                            </div>
                        )}
                        {selectedProducto.temperaturaBodega && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: FONT.sm }}>
                                <Package size={16} color={COLORS.textLight} />
                                <span style={{ color: COLORS.text }}>Temperatura bodega: <strong>{selectedProducto.temperaturaBodega}</strong></span>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

function StatBox({ label, value, bg, color }) {
    return (
        <div style={{ backgroundColor: bg, borderRadius: RADIUS.lg, padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: FONT.xxl, fontWeight: '700', color, margin: 0 }}>{value}</p>
            <p style={{ fontSize: FONT.xs, color, margin: '2px 0 0', opacity: 0.8 }}>{label}</p>
        </div>
    );
}

const S = {
    actionBtn: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '6px',
        borderRadius: RADIUS.lg,
        fontSize: FONT.xs,
        fontWeight: '500',
        border: 'none',
        cursor: 'pointer',
        fontFamily: FONT.family,
    },
};
