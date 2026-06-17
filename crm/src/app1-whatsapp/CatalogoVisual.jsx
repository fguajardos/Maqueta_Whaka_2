import React, { useState, useEffect } from 'react';
import { X, Leaf, Search } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_WMS_URL || 'http://localhost:3000';
const clp = (n) => '$' + Number(n || 0).toLocaleString('es-CL');

// Estilos inline (layout robusto, sin depender de clases Tailwind generadas)
const S = {
    overlay: { position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'center' },
    panel: { width: '100%', maxWidth: '440px', height: '100%', background: '#ECE5DD', display: 'flex', flexDirection: 'column', boxShadow: '0 0 30px rgba(0,0,0,0.3)' },
    header: { height: '64px', background: '#2D7D46', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '12px', flexShrink: 0 },
    search: { padding: '12px', background: '#fff', borderBottom: '1px solid #e5e7eb', flexShrink: 0 },
    searchBox: { display: 'flex', alignItems: 'center', gap: '8px', background: '#f3f4f6', borderRadius: '9999px', padding: '8px 12px' },
    body: { flex: 1, overflowY: 'auto', padding: '12px' },
    catLabel: { fontSize: '11px', fontWeight: 700, color: '#2D7D46', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 4px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' },
    card: { background: '#fff', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' },
    imgBox: { height: '130px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    img: { width: '100%', height: '100%', objectFit: 'cover' },
    cardBody: { padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
    nombre: { fontSize: '12px', fontWeight: 600, color: '#1f2937', lineHeight: 1.2, margin: 0 },
    desc: { fontSize: '10px', color: '#6b7280', lineHeight: 1.3, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
    precio: { fontSize: '14px', fontWeight: 700, color: '#2D7D46' },
    precioAnt: { fontSize: '11px', color: '#9ca3af', textDecoration: 'line-through' },
    ofertaBadge: { position: 'absolute', top: 6, left: 6, background: '#DC2626', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', zIndex: 1 },
    iconBtn: { width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    msg: { textAlign: 'center', color: '#6b7280', fontSize: 14, padding: '32px 0' },
};

/**
 * Galería visual del catálogo (estilo WhatsApp Business). Lee /api/whatsapp/catalog/visual.
 * Las fotos se sirven desde /catalogo/<sku>.jpg (carpeta crm/public/catalogo).
 */
export default function CatalogoVisual({ open, onClose }) {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        fetch(`${API_BASE_URL}/api/whatsapp/catalog/visual`)
            .then(r => r.json())
            .then(d => setProductos(d.catalogo || []))
            .catch(() => setProductos([]))
            .finally(() => setLoading(false));
    }, [open]);

    if (!open) return null;

    const filtrados = productos.filter(p => !q
        || p.nombre.toLowerCase().includes(q.toLowerCase())
        || (p.categoria || '').toLowerCase().includes(q.toLowerCase()));
    const categorias = [...new Set(filtrados.map(p => p.categoria))];

    return (
        <div style={S.overlay} onClick={onClose}>
            <div style={S.panel} onClick={e => e.stopPropagation()}>
                <div style={S.header}>
                    <Leaf style={{ width: 20, height: 20, color: '#fff', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: 0 }}>Catálogo WhakaChile</h3>
                        <p style={{ color: '#A7F3D0', fontSize: 12, margin: 0 }}>{productos.length} productos</p>
                    </div>
                    <button onClick={onClose} style={S.iconBtn} title="Cerrar">
                        <X style={{ width: 20, height: 20, color: '#fff' }} />
                    </button>
                </div>

                <div style={S.search}>
                    <div style={S.searchBox}>
                        <Search style={{ width: 16, height: 16, color: '#9ca3af', flexShrink: 0 }} />
                        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar producto..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14 }} />
                    </div>
                </div>

                <div style={S.body}>
                    {loading && <p style={S.msg}>Cargando catálogo...</p>}
                    {!loading && filtrados.length === 0 && <p style={S.msg}>Sin productos.</p>}
                    {!loading && categorias.map(cat => (
                        <div key={cat}>
                            <p style={S.catLabel}>{cat}</p>
                            <div style={S.grid}>
                                {filtrados.filter(p => p.categoria === cat).map(p => <CatalogoCard key={p.id} p={p} />)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function CatalogoCard({ p }) {
    const [imgOk, setImgOk] = useState(true);
    return (
        <div style={S.card}>
            <div style={{ ...S.imgBox, position: 'relative' }}>
                {p.enOferta && <span style={S.ofertaBadge}>🔥 Oferta</span>}
                {imgOk && p.imagen
                    ? <img src={p.imagen} alt={p.nombre} style={S.img} onError={() => setImgOk(false)} />
                    : <Leaf style={{ width: 40, height: 40, color: 'rgba(45,125,70,0.3)' }} />}
            </div>
            <div style={S.cardBody}>
                <p style={S.nombre}>{p.nombre}</p>
                {p.descripcion && <p style={S.desc}>{p.descripcion}</p>}
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                    <span style={S.precio}>{clp(p.precio)}</span>
                    {p.enOferta && p.precioAnterior ? <span style={S.precioAnt}>{clp(p.precioAnterior)}</span> : null}
                </div>
            </div>
        </div>
    );
}
