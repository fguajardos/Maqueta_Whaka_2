import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { COLORS, RADIUS, SHADOW, FONT } from '../styles/tokens';

const SIZES = {
    sm: { maxWidth: '448px' },
    md: { maxWidth: '512px' },
    lg: { maxWidth: '768px' },
    xl: { maxWidth: '1024px' },
};

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.backdrop} />
            <div
                style={{ ...styles.panel, ...SIZES[size] }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                {title && (
                    <div style={styles.header}>
                        <h3 style={styles.title}>{title}</h3>
                        <button onClick={onClose} style={styles.closeBtn}>
                            <X size={20} color={COLORS.textLight} />
                        </button>
                    </div>
                )}
                {!title && (
                    <div style={{ ...styles.header, justifyContent: 'flex-end', borderBottom: 'none', paddingBottom: 0 }}>
                        <button onClick={onClose} style={styles.closeBtn}>
                            <X size={20} color={COLORS.textLight} />
                        </button>
                    </div>
                )}

                {/* Body */}
                <div style={styles.body}>{children}</div>

                {/* Footer */}
                {footer && (
                    <div style={styles.footer}>{footer}</div>
                )}
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
    },
    backdrop: {
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    panel: {
        position: 'relative',
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.xl,
        boxShadow: SHADOW.xl,
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.3s ease-out forwards',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: `1px solid ${COLORS.borderLight}`,
    },
    title: {
        fontSize: FONT.lg,
        fontWeight: '600',
        color: COLORS.dark,
        margin: 0,
    },
    closeBtn: {
        padding: '4px',
        borderRadius: RADIUS.lg,
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: {
        padding: '16px 24px',
        overflowY: 'auto',
        flex: 1,
    },
    footer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '12px',
        padding: '16px 24px',
        borderTop: `1px solid ${COLORS.borderLight}`,
    },
};
