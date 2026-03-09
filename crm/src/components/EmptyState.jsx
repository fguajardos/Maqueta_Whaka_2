import React from 'react';
import { SearchX } from 'lucide-react';
import Button from './Button';
import { COLORS, FONT } from '../styles/tokens';

export default function EmptyState({ icon: Icon = SearchX, title, description, actionLabel, onAction }) {
    return (
        <div style={styles.wrapper}>
            <div style={styles.iconBox}>
                <Icon size={32} color={COLORS.border} />
            </div>
            <h3 style={styles.title}>{title}</h3>
            {description && <p style={styles.desc}>{description}</p>}
            {actionLabel && onAction && (
                <Button variant="primary" onClick={onAction}>{actionLabel}</Button>
            )}
        </div>
    );
}

const styles = {
    wrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 32px',
        textAlign: 'center',
    },
    iconBox: {
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: '#F3F4F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
    },
    title: {
        fontSize: FONT.lg,
        fontWeight: '600',
        color: COLORS.dark,
        marginBottom: '8px',
    },
    desc: {
        fontSize: FONT.sm,
        color: COLORS.textLight,
        maxWidth: '448px',
        marginBottom: '24px',
    },
};
