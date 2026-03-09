import React from 'react';
import { RADIUS, FONT } from '../styles/tokens';

const BADGE_STYLES = {
    nuevo: { background: '#DBEAFE', color: '#1D4ED8' },
    pendiente: { background: '#FEF3C7', color: '#B45309' },
    aprobado: { background: '#DCFCE7', color: '#15803D' },
    activo: { background: '#DCFCE7', color: '#15803D' },
    observado: { background: '#FFEDD5', color: '#C2410C' },
    rechazado: { background: '#FEE2E2', color: '#B91C1C' },
    bloqueado: { background: '#FEE2E2', color: '#B91C1C' },
    recibido: { background: '#DBEAFE', color: '#1D4ED8' },
    validado: { background: '#FEF3C7', color: '#B45309' },
    en_preparacion: { background: '#FEF3C7', color: '#92400E' },
    listo_bodega: { background: '#DCFCE7', color: '#15803D' },
    facturado: { background: '#FEF3C7', color: '#B45309' },
    despachado: { background: '#CCFBF1', color: '#0F766E' },
    entregado: { background: '#BBF7D0', color: '#166534' },
    incidencia: { background: '#FCA5A5', color: '#7F1D1D' },
    inactivo: { background: '#F3F4F6', color: '#6B7280' },
    credito_suspendido: { background: '#FEE2E2', color: '#B91C1C' },
    whatsapp: { background: '#DCFCE7', color: '#15803D' },
    ejecutivo_terreno: { background: '#DBEAFE', color: '#1D4ED8' },
    manual_backoffice: { background: '#FEF3C7', color: '#B45309' },
    prepago: { background: '#FFEDD5', color: '#C2410C' },
    credito_30: { background: '#DBEAFE', color: '#1D4ED8' },
    credito_60: { background: '#CCFBF1', color: '#0F766E' },
    conectado: { background: '#DCFCE7', color: '#15803D' },
    no_configurado: { background: '#F3F4F6', color: '#6B7280' },
    planificado: { background: '#DBEAFE', color: '#1D4ED8' },
    en_ruta: { background: '#FEF3C7', color: '#B45309' },
    completado: { background: '#BBF7D0', color: '#166534' },
};

const LABEL_MAP = {
    en_preparacion: 'En Preparación',
    listo_bodega: 'Listo Bodega',
    credito_30: 'Crédito 30 días',
    credito_60: 'Crédito 60 días',
    credito_suspendido: 'Crédito Suspendido',
    ejecutivo_terreno: 'Ejecutivo Terreno',
    manual_backoffice: 'Manual Backoffice',
    no_configurado: 'No Configurado',
    en_ruta: 'En Ruta',
};

const SIZES = {
    sm: { fontSize: '11px', padding: '2px 8px' },
    md: { fontSize: FONT.xs, padding: '4px 10px' },
    lg: { fontSize: FONT.sm, padding: '6px 14px' },
};

export default function Badge({ status, label, size = 'md' }) {
    const colors = BADGE_STYLES[status] || { background: '#F3F4F6', color: '#6B7280' };
    const displayLabel = label || LABEL_MAP[status] || status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Desconocido';

    const style = {
        display: 'inline-flex',
        alignItems: 'center',
        fontWeight: '600',
        borderRadius: RADIUS.full,
        whiteSpace: 'nowrap',
        backgroundColor: colors.background,
        color: colors.color,
        ...SIZES[size],
    };

    return <span style={style}>{displayLabel}</span>;
}
