import React from 'react';
import { COLORS, RADIUS, SHADOW } from '../styles/tokens';

export default function Card({ children, className = '', topBorderColor, onClick, style: extraStyle }) {
    const [hovered, setHovered] = React.useState(false);

    const style = {
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.xl,
        boxShadow: hovered && onClick ? SHADOW.md : SHADOW.sm,
        padding: '20px',
        transition: 'box-shadow 0.2s',
        ...(onClick ? { cursor: 'pointer' } : {}),
        ...(topBorderColor ? { borderTop: `4px solid ${topBorderColor}` } : {}),
        ...extraStyle,
    };

    return (
        <div
            style={style}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {children}
        </div>
    );
}
