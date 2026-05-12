export const colors = {
    primary: '#6C63FF',
    primaryDim: '#4A43D6',
    secondary: '#03DAC6',
    background: '#0F0F14',
    surface: '#1A1A22',
    surfaceAlt: '#23232E',
    border: '#2A2A36',
    text: '#FFFFFF',
    textSecondary: '#B0B0C0',
    textMuted: '#7A7A8C',
    error: '#CF6679',
    success: '#00C851',
    warning: '#FFBB33',
};

export const spacing = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
};

export const radius = {
    s: 6,
    m: 12,
    l: 18,
    pill: 999,
};

export const typography = {
    h1: { fontSize: 32, fontWeight: '700' as const, color: colors.text },
    h2: { fontSize: 24, fontWeight: '600' as const, color: colors.text },
    h3: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
    body: { fontSize: 16, color: colors.textSecondary },
    bodyStrong: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
    caption: { fontSize: 13, color: colors.textMuted },
    button: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
};

export const theme = { colors, typography, spacing, radius, dark: true };
