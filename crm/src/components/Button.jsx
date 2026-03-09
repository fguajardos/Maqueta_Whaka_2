import React from 'react';
import { Loader2 } from 'lucide-react';
import { COLORS, RADIUS, FONT } from '../styles/tokens';

const BASE = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: '500',
    borderRadius: RADIUS.lg,
    transition: 'all 0.2s',
    cursor: 'pointer',
    border: 'none',
    fontFamily: FONT.family,
};

const SIZES = {
    sm: { padding: '6px 12px', fontSize: FONT.sm },
    md: { padding: '10px 20px', fontSize: FONT.sm },
    lg: { padding: '12px 24px', fontSize: FONT.base },
};

const VARIANT_STYLES = {
    primary: { backgroundColor: COLORS.primary, color: COLORS.white },
    secondary: { backgroundColor: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}` },
    danger: { backgroundColor: COLORS.danger, color: COLORS.white },
    ghost: { backgroundColor: 'transparent', color: COLORS.text },
};

const VARIANT_HOVER = {
    primary: { backgroundColor: COLORS.primaryDark },
    secondary: { backgroundColor: COLORS.primaryLight },
    danger: { backgroundColor: '#991B1B' },
    ghost: { backgroundColor: COLORS.bg },
};

export default function Button({ children, variant = 'primary', size = 'md', loading = false, disabled = false, className = '', onClick, type = 'button', style: extraStyle, ...props }) {
    const [hovered, setHovered] = React.useState(false);
    const isDisabled = disabled || loading;

    const style = {
        ...BASE,
        ...SIZES[size],
        ...VARIANT_STYLES[variant],
        ...(hovered && !isDisabled ? VARIANT_HOVER[variant] : {}),
        ...(isDisabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
        ...extraStyle,
    };

    return (
        <button
            type={type}
            style={style}
            disabled={isDisabled}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            {...props}
        >
            {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {children}
        </button>
    );
}
