// app/types/theme.ts

export type BorderRadius = 'sharp' | 'soft' | 'round'
export type Shadow = 'flat' | 'lifted'
export type ThemePresetName =
  | 'sage-linen'
  | 'midnight'
  | 'blossom'
  | 'bold'
  | 'golden-hour'
  | 'paper'

export interface Theme {
  preset: ThemePresetName | 'custom'
  backgroundColor: string
  surfaceColor: string
  textColor: string
  mutedColor: string
  accentColor: string
  headingFont: string
  bodyFont: string
  borderRadius: BorderRadius
  shadow: Shadow
}

export const THEME_PRESETS: Record<ThemePresetName, Omit<Theme, 'preset'>> = {
  'sage-linen': {
    backgroundColor: '#FAFAF8',
    surfaceColor: '#FFFFFF',
    textColor: '#1A1A17',
    mutedColor: '#6B6860',
    accentColor: '#6e8761',
    headingFont: 'DM Sans',
    bodyFont: 'DM Sans',
    borderRadius: 'soft',
    shadow: 'lifted',
  },
  'midnight': {
    backgroundColor: '#0f1117',
    surfaceColor: '#1a1d27',
    textColor: '#f0f0f5',
    mutedColor: '#8888aa',
    accentColor: '#7c6df5',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    borderRadius: 'sharp',
    shadow: 'flat',
  },
  'blossom': {
    backgroundColor: '#fdf0f3',
    surfaceColor: '#fff7f9',
    textColor: '#3a2028',
    mutedColor: '#9e7882',
    accentColor: '#c96d8a',
    headingFont: 'Playfair Display',
    bodyFont: 'Lato',
    borderRadius: 'round',
    shadow: 'lifted',
  },
  'bold': {
    backgroundColor: '#000000',
    surfaceColor: '#111111',
    textColor: '#ffffff',
    mutedColor: '#888888',
    accentColor: '#ff3b3b',
    headingFont: 'Bebas Neue',
    bodyFont: 'Inter',
    borderRadius: 'sharp',
    shadow: 'flat',
  },
  'golden-hour': {
    backgroundColor: '#fdf6e3',
    surfaceColor: '#fffaf0',
    textColor: '#3b2a14',
    mutedColor: '#8a6a3a',
    accentColor: '#c07c2a',
    headingFont: 'Playfair Display',
    bodyFont: 'Lato',
    borderRadius: 'soft',
    shadow: 'lifted',
  },
  'paper': {
    backgroundColor: '#f8f7f4',
    surfaceColor: '#ffffff',
    textColor: '#1c1c1c',
    mutedColor: '#888888',
    accentColor: '#444444',
    headingFont: 'Merriweather',
    bodyFont: 'IBM Plex Mono',
    borderRadius: 'sharp',
    shadow: 'flat',
  },
}

export const DEFAULT_THEME: Theme = {
  preset: 'sage-linen',
  ...THEME_PRESETS['sage-linen'],
}

const RADIUS_VALUES: Record<BorderRadius, string> = {
  sharp: '0px',
  soft: '10px',
  round: '20px',
}

const SHADOW_VALUES: Record<Shadow, string> = {
  flat: 'none',
  lifted: '0 2px 12px rgba(0,0,0,0.08)',
}

export function applyTheme(el: HTMLElement, theme: Theme): void {
  el.style.setProperty('--profile-bg', theme.backgroundColor)
  el.style.setProperty('--profile-surface', theme.surfaceColor)
  el.style.setProperty('--profile-text', theme.textColor)
  el.style.setProperty('--profile-muted', theme.mutedColor)
  el.style.setProperty('--profile-accent', theme.accentColor)
  el.style.setProperty('--profile-heading-font', theme.headingFont)
  el.style.setProperty('--profile-body-font', theme.bodyFont)
  el.style.setProperty('--profile-radius', RADIUS_VALUES[theme.borderRadius])
  el.style.setProperty('--profile-shadow', SHADOW_VALUES[theme.shadow])
}
