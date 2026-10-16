// Material 3 color theme, generated with Material Color Utilities.
//
// On Android 12+ the seed is the system's dynamic color ("Material You"), and the scheme is generated
// the same way Android does it (Tonal Spot). Elsewhere (browsers, older Android) the app's brand color
// is used, keeping its saturation (Content). Every color role is set as a CSS variable on :root,
// named after the role in kebab case (e.g. --primary, --on-primary-container, --surface-container-high).
import {
  argbFromHex,
  hexFromArgb,
  Hct,
  MaterialDynamicColors,
  SchemeContent,
  SchemeTonalSpot
} from './lib/material-color-utilities/index.js';

const BRAND_COLOR = '#0061a8';

const ROLES = [
  'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer', 'inversePrimary',
  'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
  'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
  'error', 'onError', 'errorContainer', 'onErrorContainer',
  'background', 'onBackground',
  'surface', 'onSurface', 'surfaceVariant', 'onSurfaceVariant', 'surfaceDim', 'surfaceBright',
  'surfaceContainerLowest', 'surfaceContainerLow', 'surfaceContainer', 'surfaceContainerHigh', 'surfaceContainerHighest',
  'inverseSurface', 'inverseOnSurface', 'outline', 'outlineVariant', 'shadow', 'scrim', 'surfaceTint'
];

const kebabCase = (name) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const nativeTheme = () => window.Capacitor?.isNativePlatform?.() && window.Capacitor.Plugins.ThemeColor;
const systemDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

let current = { isDark: systemDark(), seedColor: null };

function createScheme(seedColor, isDark) {
  const Scheme = seedColor ? SchemeTonalSpot : SchemeContent;
  return new Scheme(Hct.fromInt(argbFromHex(seedColor ?? BRAND_COLOR)), isDark, 0);
}

function apply({ isDark, seedColor }) {
  current = { isDark, seedColor: seedColor ?? null };
  const scheme = createScheme(current.seedColor, isDark);
  const color = (role) => hexFromArgb(MaterialDynamicColors[role].getArgb(scheme));

  const root = document.documentElement;
  for (const role of ROLES) {
    root.style.setProperty(`--${kebabCase(role)}`, color(role));
  }
  // Variables used by the existing styles that aren't Material roles
  root.style.setProperty('--surface-disabled', color('surfaceContainerLow'));
  root.style.setProperty('--bs-primary', color('primary'));
  root.style.setProperty('--bs-body-bg', color('surface'));
  root.style.setProperty('--bs-body-color', color('onSurface'));
  root.style.setProperty('--bs-light', color('surface'));

  const theme = isDark ? 'dark' : 'light';
  root.classList.remove('dark-theme', 'light-theme');
  root.classList.add(`${theme}-theme`);
  root.dataset.theme = theme;

  updateSystemBars();
}

// The status bar keeps the light scheme's primary color in both modes, so its light icons are always readable.
export function statusBarColor() {
  const scheme = createScheme(current.seedColor, false);
  return hexFromArgb(MaterialDynamicColors.primary.getArgb(scheme));
}

async function updateSystemBars() {
  const { StatusBar, EdgeToEdge } = window.Capacitor?.Plugins ?? {};
  if (!nativeTheme() || !StatusBar || !EdgeToEdge) {
    return;
  }
  try {
    const color = statusBarColor();
    await StatusBar.setBackgroundColor({ color });
    await EdgeToEdge.setBackgroundColor({ color });
  } catch (error) {
    console.error('Error setting system bar colors:', error);
  }
}

async function loadTheme() {
  const ThemeColor = nativeTheme();
  if (ThemeColor) {
    try {
      apply(await ThemeColor.getTheme());
      return;
    } catch (error) {
      console.log('Native theme not available, using system theme:', error);
    }
  }
  apply({ isDark: systemDark(), seedColor: null });
}

async function init() {
  await loadTheme();

  const ThemeColor = nativeTheme();
  if (ThemeColor) {
    await ThemeColor.addListener('themeChanged', apply);
    // The system colors may have changed while the app was in the background
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        loadTheme();
      }
    });
  } else {
    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      apply({ isDark: event.matches, seedColor: null });
    });
  }
}

// Resolves once the theme has been applied for the first time
export const themeReady = init();
