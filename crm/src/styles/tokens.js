/* ─── Design Tokens ─── 
   Single source of truth for all visual constants.
   Every component imports from here — never hardcode colors/sizes. */

export const COLORS = {
    /* Primary */
    primary: '#3B2D80',
    primaryDark: '#2A1F63',
    primaryLight: '#EDEBF5',
    secondary: '#5B4DB3',
    secondaryLight: '#E8E5F7',
    accent: '#C26B1D',
    accentLight: '#FEF3C7',

    /* Neutrals */
    dark: '#111827',
    text: '#374151',
    textLight: '#6B7280',
    border: '#D1D5DB',
    borderLight: '#E5E7EB',
    bg: '#F3F4F6',
    bgAlt: '#F9FAFB',
    white: '#FFFFFF',

    /* Semantic */
    danger: '#B91C1C',
    dangerLight: '#FEE2E2',
    dangerDark: '#7F1D1D',
    warning: '#B45309',
    warningLight: '#FEF3C7',
    success: '#15803D',
    successLight: '#DCFCE7',
    info: '#1D4ED8',
    infoLight: '#DBEAFE',

    /* Misc */
    whatsapp: '#25D366',
    whatsappLight: '#E8FBF0',
    purpleMint: '#C4B5FD',
    greenMint: '#C4B5FD',
    redDot: '#EF4444',
    amber: '#D97706',
    amberLight: '#FEF3C7',
    amberBg: '#FFFBEB',
};

export const FONT = {
    family: "'Inter', system-ui, -apple-system, sans-serif",
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    xxl: '24px',
    xxxl: '30px',
};

export const RADIUS = {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    xxl: '16px',
    full: '9999px',
};

export const SHADOW = {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05)',
    xl: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
};

/* ─── Helper Style Objects ─── */

export const FLEX = {
    row: { display: 'flex', flexDirection: 'row' },
    col: { display: 'flex', flexDirection: 'column' },
    center: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
    between: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    rowCenter: { display: 'flex', flexDirection: 'row', alignItems: 'center' },
};

export const TEXT = {
    heading: { color: COLORS.dark, fontWeight: '700' },
    body: { color: COLORS.text, fontSize: FONT.sm },
    muted: { color: COLORS.textLight, fontSize: FONT.sm },
    small: { color: COLORS.textLight, fontSize: FONT.xs },
    label: { display: 'block', fontSize: FONT.sm, fontWeight: '500', color: '#374151', marginBottom: '6px' },
};

export const INPUT_STYLE = {
    width: '100%',
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.lg,
    padding: '10px 12px',
    fontSize: FONT.sm,
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: FONT.family,
    color: COLORS.text,
    backgroundColor: COLORS.white,
};
