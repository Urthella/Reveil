export const colors = {
    primary: '#6C63FF', // Vibrant Purple
    secondary: '#03DAC6', // Teal
    background: '#121212', // Dark Background
    surface: '#1E1E1E', // Slightly lighter dark for cards
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    error: '#CF6679',
    success: '#00C851',
    warning: '#FFBB33',
};

export const typography = {
    h1: {
        fontSize: 32,
        fontWeight: '700' as '700',
        color: colors.text,
    },
    h2: {
        fontSize: 24,
        fontWeight: '600' as '600',
        color: colors.text,
    },
    body: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    button: {
        fontSize: 16,
        fontWeight: '600' as '600',
        color: colors.text,
    },
};

export const spacing = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
};

export const theme = {
    colors,
    typography,
    spacing,
    dark: true,
};
