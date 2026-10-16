// Material 3 color theme.
//
// On Android 14+ the system's own dynamic color roles ("Material You") are used, exactly as other apps
// get them; the few roles Android doesn't publish are generated from its seed color with Material Color
// Utilities. On Android 12 and 13 only the seed is available, so the scheme is generated the way Android
// does it by default (Tonal Spot). Elsewhere (browsers, older Android) the app's brand color is used,
// keeping its saturation (Content). Every color role is set as a CSS variable on <body>,
// named after the role in kebab case (e.g. --primary, --on-primary-container, --surface-container-high),
// which are the same names BeerCSS uses. They're set on <body> because BeerCSS defines its own
// defaults on body.light and body.dark.
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

let current = { isDark: systemDark(), seedColor: null, light: null, dark: null };

function createScheme(seedColor, isDark) {
  const Scheme = seedColor ? SchemeTonalSpot : SchemeContent;
  return new Scheme(Hct.fromInt(argbFromHex(seedColor ?? BRAND_COLOR)), isDark, 0);
}

// Color of a role: the system's own (Android 14+), or generated from the seed.
// The generated scheme is kept in `cache`, to create it only once when getting several roles.
function roleColor(role, isDark, cache = {}) {
  const system = (isDark ? current.dark : current.light)?.[role];
  if (system) {
    return system;
  }
  cache.scheme ??= createScheme(current.seedColor, isDark);
  return hexFromArgb(MaterialDynamicColors[role].getArgb(cache.scheme));
}

function apply({ isDark, seedColor, light, dark }) {
  current = { isDark, seedColor: seedColor ?? null, light: light ?? null, dark: dark ?? null };
  const cache = {};
  const color = (role) => roleColor(role, isDark, cache);

  const body = document.body;
  for (const role of ROLES) {
    body.style.setProperty(`--${kebabCase(role)}`, color(role));
  }

  body.classList.toggle('dark', isDark);
  body.classList.toggle('light', !isDark);
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  // For parts that can't follow the theme with CSS alone, like the map
  document.dispatchEvent(new CustomEvent('themechange', { detail: { isDark } }));

  updateSystemBars();
}

// The status bar keeps the light scheme's primary color in both modes, so its light icons are always readable.
export function statusBarColor() {
  return roleColor('primary', false);
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
      const theme = await ThemeColor.getTheme();
      const source = theme.light ? 'system color roles' : theme.seedColor ? 'system seed color' : 'brand color';
      console.info(`Theme: ${source} (Android SDK ${theme.sdkVersion}, seed ${theme.seedColor ?? '-'})`);
      apply(theme);
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
