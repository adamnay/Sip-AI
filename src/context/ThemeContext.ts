import { createContext, useContext } from 'react';

export const ThemeContext = createContext(false);
export const useTheme = () => useContext(ThemeContext);

export const dark = {
  bg:           '#0f1117',
  card:         '#1a1d2e',
  cardBorder:   'rgba(255,255,255,0.07)',
  cardShadow:   '0 1px 4px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)',
  textPrimary:  '#f1f5f9',
  textSecondary:'rgba(255,255,255,0.5)',
  textTertiary: 'rgba(255,255,255,0.3)',
  nav:          '#1a1d2e',
  navBorder:    'rgba(255,255,255,0.06)',
  inputBg:      '#111827',
  divider:      'rgba(255,255,255,0.07)',
};

export const light = {
  bg:           '#f2f3f7',
  card:         '#ffffff',
  cardBorder:   'rgba(0,0,0,0.07)',
  cardShadow:   '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)',
  textPrimary:  '#000000',
  textSecondary:'rgba(0,0,0,0.45)',
  textTertiary: 'rgba(0,0,0,0.28)',
  nav:          '#ffffff',
  navBorder:    'rgba(0,0,0,0.07)',
  inputBg:      '#f8f9fa',
  divider:      'rgba(0,0,0,0.07)',
};

export type Theme = typeof light;
export const getTheme = (isDark: boolean): Theme => isDark ? dark : light;
