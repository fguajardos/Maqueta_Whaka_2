import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
    CheckCircle, Clock, Package, Truck, MapPin, AlertCircle,
    Loader2, ChevronDown, ChevronUp, Phone, ExternalLink
} from 'lucide-react';
import { COLORS, FONT, SHADOW, RADIUS } from './styles/tokens';

// ─── Mapbox token ───────────────────────────────────────────
mapboxgl.accessToken = 'pk.eyJ1IjoiZmd1YWphcmRvcyIsImEiOiJjbW1waGR2azgwcXB1MnFxMHhlbGRwejZxIn0.jbxHv5KT4XYPLbx8_FjmtQ';

const WMS_URL = import.meta.env.VITE_WMS_URL || 'http://localhost:3000';

// ─── Coordenadas Santiago (maqueta) ─────────────────────────
const WAREHOUSE = { lng: -70.6097, lat: -33.4322 }; // WhakaChile Bodega, Providencia

// Destinos demo rotativos según el hash del pedido
const DEMO_DESTINATIONS = [
    { lng: -70.5988, lat: -33.4170, zona: 'Las Condes' },
    { lng: -70.6526, lat: -33.4655, zona: 'San Miguel' },
    { lng: -70.6065, lat: -33.3890, zona: 'Vitacura' },
    { lng: -70.5700, lat: -33.4500, zona: 'La Florida' },
    { lng: -70.6420, lat: -33.4560, zona: 'Ñuñoa' },
];

// ─── Config de estados ───────────────────────────────────────
const ESTADO_CONFIG = {
    recibido:       { icon: Package,      label: 'Pedido Recibido',       color: '#1D4ED8', bg: '#DBEAFE' },
    validado:       { icon: CheckCircle,  label: 'Pedido Validado',        color: '#B45309', bg: '#FEF3C7' },
    en_preparacion: { icon: Package,      label: 'En Preparación',         color: '#92400E', bg: '#FEF3C7' },
    listo_bodega:   { icon: CheckCircle,  label: 'Listo para Despacho',    color: '#15803D', bg: '#DCFCE7' },
    facturado:      { icon: CheckCircle,  label: 'Facturado',              color: '#B45309', bg: '#FEF3C7' },
    despachado:     { icon: Truck,        label: 'En Camino',              color: '#0F766E', bg: '#CCFBF1' },
    entregado:      { icon: CheckCircle,  label: 'Entregado ✓',            color: '#166534', bg: '#BBF7D0' },
    incidencia:     { icon: AlertCircle,  label: 'Con Incidencia',         color: '#7F1D1D', bg: '#FCA5A5' },
};

const STEPS_ORDER = [
    'recibido', 'validado', 'en_preparacion',
    'listo_bodega', 'facturado', 'despachado', 'entregado',
];

function getStepIndex(estado) {
    return STEPS_ORDER.indexOf(estado);
}

function formatTimestamp(ts) {
    if (!ts) return '';
    try {
        return new Date(ts).toLocaleString('es-CL', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch { return ts; }
}

// Genera coordenada de destino demo basada en el id del pedido
function getDemoDestination(internalId) {
    if (!internalId) return DEMO_DESTINATIONS[0];
    let hash = 0;
    for (let i = 0; i < internalId.length; i++) {
        hash = ((hash << 5) - hash) + internalId.charCodeAt(i);
        hash |= 0;
    }
    return DEMO_DESTINATIONS[Math.abs(hash) % DEMO_DESTINATIONS.length];
}

// ─── Componente principal ────────────────────────────────────
export default function TrackingPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState(null);
    const [timelineOpen, setTimelineOpen] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);

    const mapContainer = useRef(null);
    const map          = useRef(null);
    const markerOrigin = useRef(null);
    const markerDest   = useRef(null);

    // ─── Fetch tracking data ─────────────────────────────────
    const fetchOrder = useCallback(async (tkn) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${WMS_URL}/api/evidence/${tkn}`);
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || `Error ${res.status}`);
            }
            const data = await res.json();
            setOrderData(data);
        } catch (err) {
            setError(err.message || 'No se pudo cargar el seguimiento.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (token) fetchOrder(token);
    }, [token, fetchOrder]);

    // ─── Inicializar Mapbox ──────────────────────────────────
    useEffect(() => {
        if (map.current) return;
        if (!mapContainer.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [WAREHOUSE.lng, WAREHOUSE.lat],
            zoom: 12,
            language: 'es',
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

        // Marker de bodega (origen) — siempre visible
        const el = document.createElement('div');
        el.style.cssText = `
            width:38px; height:38px; border-radius:50%;
            background:${COLORS.primary}; border:3px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
            display:flex; align-items:center; justify-content:center;
            cursor:pointer;
        `;
        el.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;

        new mapboxgl.Popup({ offset: 25, closeButton: false })
            .setText('WhakaChile Bodega');

        markerOrigin.current = new mapboxgl.Marker({ element: el })
            .setLngLat([WAREHOUSE.lng, WAREHOUSE.lat])
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<b>🏭 WhakaChile Bodega</b><br/>Providencia, Santiago'))
            .addTo(map.current);

        map.current.on('load', () => setMapLoaded(true));

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    // ─── Actualizar mapa cuando llegan datos del pedido ──────
    useEffect(() => {
        if (!mapLoaded || !map.current || !orderData) return;

        const dest = getDemoDestination(orderData.internalId);
        const estado = orderData.estado;
        const enRuta = estado === 'despachado' || estado === 'entregado';

        // Remover marker de destino previo
        if (markerDest.current) {
            markerDest.current.remove();
            markerDest.current = null;
        }

        // Remover capa de ruta previa
        if (map.current.getLayer('route')) map.current.removeLayer('route');
        if (map.current.getLayer('route-arrow')) map.current.removeLayer('route-arrow');
        if (map.current.getSource('route')) map.current.removeSource('route');

        // Marker de destino (cliente)
        const elDest = document.createElement('div');
        const destColor = estado === 'entregado' ? '#15803D' : estado === 'incidencia' ? '#B91C1C' : '#C26B1D';
        elDest.style.cssText = `
            width:38px; height:38px; border-radius:50%;
            background:${destColor}; border:3px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
            display:flex; align-items:center; justify-content:center;
            cursor:pointer;
        `;
        elDest.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;

        markerDest.current = new mapboxgl.Marker({ element: elDest })
            .setLngLat([dest.lng, dest.lat])
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<b>📦 ${orderData.internalId}</b><br/>Destino: ${dest.zona}`
            ))
            .addTo(map.current);

        // Dibujar ruta si está despachado o entregado
        if (enRuta) {
            // Puntos intermedios para curva natural
            const midLng = (WAREHOUSE.lng + dest.lng) / 2;
            const midLat = (WAREHOUSE.lat + dest.lat) / 2 + 0.008;

            map.current.addSource('route', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [WAREHOUSE.lng, WAREHOUSE.lat],
                            [midLng, midLat],
                            [dest.lng, dest.lat],
                        ],
                    },
                },
            });

            map.current.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': estado === 'entregado' ? '#15803D' : COLORS.primary,
                    'line-width': 4,
                    'line-dasharray': estado === 'entregado' ? [1] : [2, 1],
                },
            });
        }

        // Ajustar vista para mostrar ambos puntos
        const bounds = new mapboxgl.LngLatBounds()
            .extend([WAREHOUSE.lng, WAREHOUSE.lat])
            .extend([dest.lng, dest.lat]);

        map.current.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 1200 });

    }, [mapLoaded, orderData]);

    // ─── Render ──────────────────────────────────────────────
    const estadoCfg = orderData ? (ESTADO_CONFIG[orderData.estado] || ESTADO_CONFIG.recibido) : null;
    const currentStep = orderData ? getStepIndex(orderData.estado) : -1;

    return (
        <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: FONT.family }}>

            {/* ── Header ─────────────────────────────────── */}
            <header style={{
                background: COLORS.primary, color: COLORS.white,
                padding: '16px 20px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', boxShadow: SHADOW.md,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: RADIUS.lg,
                        background: 'rgba(255,255,255,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Package size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: '700', fontSize: FONT.base }}>WhakaChile</div>
                        <div style={{ fontSize: FONT.xs, opacity: 0.8 }}>Seguimiento de Pedido</div>
                    </div>
                </div>
                <a href="tel:+56912345678" style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.full,
                    padding: '8px 14px', color: COLORS.white, textDecoration: 'none',
                    fontSize: FONT.xs, fontWeight: '500',
                }}>
                    <Phone size={14} /> Ayuda
                </a>
            </header>

            {/* ── Mapa ───────────────────────────────────── */}
            <div style={{ position: 'relative', height: '340px', width: '100%' }}>
                <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

                {/* Overlay de estado sobre el mapa */}
                {orderData && estadoCfg && (
                    <div style={{
                        position: 'absolute', top: 16, left: 16, right: 64,
                        background: 'white', borderRadius: RADIUS.xl,
                        padding: '10px 14px', boxShadow: SHADOW.lg,
                        display: 'flex', alignItems: 'center', gap: '10px',
                        maxWidth: '280px',
                    }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: estadoCfg.bg, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <estadoCfg.icon size={18} color={estadoCfg.color} />
                        </div>
                        <div>
                            <div style={{ fontSize: FONT.xs, color: COLORS.textLight }}>Estado actual</div>
                            <div style={{ fontWeight: '700', color: estadoCfg.color, fontSize: FONT.sm }}>
                                {estadoCfg.label}
                            </div>
                        </div>
                    </div>
                )}

                {/* Leyenda */}
                <div style={{
                    position: 'absolute', bottom: 12, left: 12,
                    background: 'white', borderRadius: RADIUS.lg,
                    padding: '8px 12px', boxShadow: SHADOW.md,
                    fontSize: FONT.xs, color: COLORS.textLight,
                    display: 'flex', flexDirection: 'column', gap: '4px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.primary }} />
                        Bodega WhakaChile
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.accent }} />
                        Tu dirección
                    </div>
                </div>
            </div>

            {/* ── Contenido ──────────────────────────────── */}
            <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>

                {/* Sin token */}
                {!token && (
                    <div style={{
                        background: COLORS.white, borderRadius: RADIUS.xl,
                        padding: '32px 24px', textAlign: 'center', boxShadow: SHADOW.md,
                    }}>
                        <MapPin size={40} color={COLORS.textLight} style={{ margin: '0 auto 16px' }} />
                        <div style={{ fontWeight: '700', color: COLORS.dark, fontSize: FONT.lg, marginBottom: '8px' }}>
                            Seguimiento de Pedido
                        </div>
                        <p style={{ color: COLORS.textLight, fontSize: FONT.sm, lineHeight: '1.6' }}>
                            Ingresa el enlace de seguimiento que te enviamos por WhatsApp para ver el estado de tu pedido en tiempo real.
                        </p>
                    </div>
                )}

                {/* Cargando */}
                {loading && (
                    <div style={{
                        background: COLORS.white, borderRadius: RADIUS.xl,
                        padding: '40px', textAlign: 'center', boxShadow: SHADOW.md,
                    }}>
                        <Loader2 size={32} color={COLORS.primary} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                        <div style={{ color: COLORS.textLight, fontSize: FONT.sm }}>Cargando información del pedido...</div>
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div style={{
                        background: COLORS.dangerLight, borderRadius: RADIUS.xl,
                        padding: '20px', display: 'flex', gap: '12px',
                        alignItems: 'flex-start', boxShadow: SHADOW.md,
                    }}>
                        <AlertCircle size={20} color={COLORS.danger} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <div style={{ fontWeight: '600', color: COLORS.danger, marginBottom: '4px' }}>
                                No se pudo cargar el pedido
                            </div>
                            <div style={{ fontSize: FONT.sm, color: COLORS.danger }}>{error}</div>
                        </div>
                    </div>
                )}

                {/* Datos del pedido */}
                {orderData && !loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                        {/* Card principal de estado */}
                        <div style={{
                            background: COLORS.white, borderRadius: RADIUS.xl,
                            boxShadow: SHADOW.md, overflow: 'hidden',
                        }}>
                            {/* Banner de estado */}
                            <div style={{
                                background: estadoCfg.bg, padding: '16px 20px',
                                display: 'flex', alignItems: 'center', gap: '12px',
                                borderBottom: `2px solid ${estadoCfg.color}20`,
                            }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: '50%',
                                    background: estadoCfg.color + '20',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <estadoCfg.icon size={22} color={estadoCfg.color} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: FONT.xs, color: estadoCfg.color, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Estado del pedido
                                    </div>
                                    <div style={{ fontSize: FONT.xl, fontWeight: '700', color: estadoCfg.color }}>
                                        {estadoCfg.label}
                                    </div>
                                </div>
                            </div>

                            {/* Info del pedido */}
                            <div style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: COLORS.textLight, fontSize: FONT.sm }}>N° Pedido</span>
                                    <span style={{ fontWeight: '700', color: COLORS.dark, fontSize: FONT.sm }}>{orderData.internalId}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: COLORS.textLight, fontSize: FONT.sm }}>Zona de entrega</span>
                                    <span style={{ fontWeight: '600', color: COLORS.text, fontSize: FONT.sm }}>
                                        {getDemoDestination(orderData.internalId).zona}, Santiago
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Barra de progreso por pasos */}
                        <div style={{
                            background: COLORS.white, borderRadius: RADIUS.xl,
                            padding: '20px', boxShadow: SHADOW.md,
                        }}>
                            <div style={{ fontSize: FONT.sm, fontWeight: '600', color: COLORS.dark, marginBottom: '16px' }}>
                                Progreso del pedido
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                                {STEPS_ORDER.map((step, idx) => {
                                    const done = idx <= currentStep && orderData.estado !== 'incidencia';
                                    const active = idx === currentStep && orderData.estado !== 'incidencia';
                                    const cfg = ESTADO_CONFIG[step];
                                    const labels = {
                                        recibido: 'Recibido', validado: 'Validado',
                                        en_preparacion: 'Preparación', listo_bodega: 'Bodega',
                                        facturado: 'Facturado', despachado: 'En ruta', entregado: 'Entregado',
                                    };

                                    return (
                                        <React.Fragment key={step}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto' }}>
                                                <div style={{
                                                    width: 28, height: 28, borderRadius: '50%',
                                                    background: done ? (active ? estadoCfg.color : '#15803D') : COLORS.border,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'background 0.3s',
                                                    border: active ? `3px solid ${estadoCfg.color}40` : 'none',
                                                }}>
                                                    {done
                                                        ? <CheckCircle size={16} color="white" />
                                                        : <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.white }} />
                                                    }
                                                </div>
                                                <div style={{
                                                    fontSize: '9px', fontWeight: done ? '600' : '400',
                                                    color: done ? COLORS.dark : COLORS.textLight,
                                                    marginTop: '4px', textAlign: 'center',
                                                    width: '50px', lineHeight: '1.2',
                                                }}>
                                                    {labels[step]}
                                                </div>
                                            </div>
                                            {idx < STEPS_ORDER.length - 1 && (
                                                <div style={{
                                                    flex: 1, height: '3px',
                                                    background: idx < currentStep ? '#15803D' : COLORS.borderLight,
                                                    marginBottom: '18px', transition: 'background 0.3s',
                                                }} />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>

                            {/* Incidencia warning */}
                            {orderData.estado === 'incidencia' && (
                                <div style={{
                                    marginTop: '12px', padding: '10px 14px',
                                    background: '#FEE2E2', borderRadius: RADIUS.lg,
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                }}>
                                    <AlertCircle size={16} color={COLORS.danger} />
                                    <span style={{ fontSize: FONT.xs, color: COLORS.danger, fontWeight: '500' }}>
                                        Tu pedido tiene una incidencia. Nos pondremos en contacto contigo pronto.
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Timeline (colapsable) */}
                        {orderData.timeline && orderData.timeline.length > 0 && (
                            <div style={{
                                background: COLORS.white, borderRadius: RADIUS.xl,
                                boxShadow: SHADOW.md, overflow: 'hidden',
                            }}>
                                <button
                                    onClick={() => setTimelineOpen(o => !o)}
                                    style={{
                                        width: '100%', padding: '16px 20px', background: 'none',
                                        border: 'none', cursor: 'pointer', textAlign: 'left',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        fontFamily: FONT.family,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Clock size={16} color={COLORS.textLight} />
                                        <span style={{ fontWeight: '600', fontSize: FONT.sm, color: COLORS.dark }}>
                                            Historial de movimientos
                                        </span>
                                        <span style={{
                                            fontSize: FONT.xs, padding: '2px 8px',
                                            background: COLORS.primaryLight, color: COLORS.primary,
                                            borderRadius: RADIUS.full, fontWeight: '600',
                                        }}>
                                            {orderData.timeline.length}
                                        </span>
                                    </div>
                                    {timelineOpen ? <ChevronUp size={16} color={COLORS.textLight} /> : <ChevronDown size={16} color={COLORS.textLight} />}
                                </button>

                                {timelineOpen && (
                                    <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${COLORS.borderLight}` }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', paddingTop: '16px' }}>
                                            {orderData.timeline.map((entry, idx) => {
                                                const isLast = idx === orderData.timeline.length - 1;
                                                const stepLabel = entry.to
                                                    ? (ESTADO_CONFIG[entry.to]?.label || entry.to)
                                                    : (entry.step?.replace(/_/g, ' ') || 'Actualización');

                                                return (
                                                    <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                                                        {/* Línea vertical */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                            <div style={{
                                                                width: 10, height: 10, borderRadius: '50%',
                                                                background: idx === 0 ? COLORS.primary : COLORS.border,
                                                                flexShrink: 0, marginTop: '4px',
                                                            }} />
                                                            {!isLast && (
                                                                <div style={{ width: 2, flex: 1, background: COLORS.borderLight, minHeight: '20px' }} />
                                                            )}
                                                        </div>
                                                        {/* Contenido */}
                                                        <div style={{ paddingBottom: isLast ? 0 : '12px', flex: 1 }}>
                                                            <div style={{ fontWeight: '600', fontSize: FONT.sm, color: COLORS.dark }}>
                                                                {stepLabel}
                                                            </div>
                                                            {entry.timestamp && (
                                                                <div style={{ fontSize: FONT.xs, color: COLORS.textLight, marginTop: '2px' }}>
                                                                    {formatTimestamp(entry.timestamp)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Evidencias previas */}
                        {orderData.evidence && orderData.evidence.length > 0 && (
                            <div style={{
                                background: '#DCFCE7', borderRadius: RADIUS.xl,
                                padding: '16px 20px', boxShadow: SHADOW.md,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <CheckCircle size={18} color={COLORS.success} />
                                    <span style={{ fontWeight: '700', fontSize: FONT.sm, color: COLORS.success }}>
                                        Recepción registrada
                                    </span>
                                </div>
                                {orderData.evidence[0].receptorNombre && (
                                    <div style={{ fontSize: FONT.xs, color: '#166534' }}>
                                        Recibido por: <strong>{orderData.evidence[0].receptorNombre}</strong>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Contacto */}
                        <div style={{
                            background: COLORS.white, borderRadius: RADIUS.xl,
                            padding: '16px 20px', boxShadow: SHADOW.md,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <div>
                                <div style={{ fontWeight: '600', fontSize: FONT.sm, color: COLORS.dark }}>¿Necesitas ayuda?</div>
                                <div style={{ fontSize: FONT.xs, color: COLORS.textLight }}>Lun–Vie 9:00–18:00 · Sáb 10:00–14:00</div>
                            </div>
                            <a
                                href="https://wa.me/56912345678"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: '#25D366', color: 'white', borderRadius: RADIUS.full,
                                    padding: '10px 16px', textDecoration: 'none',
                                    fontSize: FONT.xs, fontWeight: '600',
                                }}
                            >
                                <Phone size={14} /> WhatsApp
                            </a>
                        </div>

                        {/* Powered by */}
                        <div style={{ textAlign: 'center', padding: '8px 0' }}>
                            <span style={{ fontSize: '11px', color: COLORS.textLight }}>
                                Seguimiento powered by WhakaChile WMS
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Spin animation */}
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .mapboxgl-map { font-family: ${FONT.family}; }
            `}</style>
        </div>
    );
}
