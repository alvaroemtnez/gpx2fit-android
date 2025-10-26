// Enhanced theme detection with Dynamic Material Colors support
class ThemeDetector {
    constructor() {
        this.currentTheme = 'auto';
        this.isMaterial = false;
        this.isDark = false;
        this.isDynamic = false;
        this.setupListeners();
        this.detectTheme();
    }
    
    async detectTheme() {
        try {
            // Try to get Material colors from Android (Capacitor only)
            if (window.Capacitor && window.Capacitor.isNativePlatform && 
                window.Capacitor.Plugins && window.Capacitor.Plugins.ThemeColor) {
                const result = await window.Capacitor.Plugins.ThemeColor.getMaterialColors();
                this.applyMaterialColors(result);
                this.isMaterial = true;
                this.isDynamic = result.isDynamic || false;
                console.log('Material colors loaded - Dynamic:', this.isDynamic);
                return;
            }
        } catch (error) {
            console.log('Material colors not available, using system theme:', error);
        }
        
        // Fallback to system theme detection for browsers
        this.detectSystemTheme();
    }
    
    applyMaterialColors(colors) {
        this.isDark = colors.isDark;
        const themeClass = this.isDark ? 'material-dark' : 'material-light';
        
        // Remove any existing theme classes
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('material-dark', 'material-light', 'dark-theme', 'light-theme');
        
        // Apply material theme
        document.documentElement.classList.add(themeClass);
        document.documentElement.setAttribute('data-theme', themeClass);
        
        // Apply CSS variables
        this.applyCSSVariables(colors);
        this.currentTheme = themeClass;
        
        console.log('Applied Material Design theme:', themeClass, 'Dynamic:', this.isDynamic);
    }
    
    applyCSSVariables(colors) {
        let style = document.getElementById('dynamic-theme-colors');
        if (!style) {
            style = document.createElement('style');
            style.id = 'dynamic-theme-colors';
            document.head.appendChild(style);
        }
        
        style.textContent = `
            .material-light, .material-dark {
                --primary: ${colors.primary} !important;
                --primary-container: ${colors.primaryContainer} !important;
                --on-primary: ${colors.onPrimary} !important;
                --secondary: ${colors.secondary} !important;
                --secondary-container: ${colors.secondaryContainer} !important;
                --on-secondary: ${colors.onSecondary} !important;
                --surface: ${colors.surface} !important;
                --on-surface: ${colors.onSurface} !important;
                --surface-variant: ${colors.surfaceVariant} !important;
                --on-surface-variant: ${colors.onSurfaceVariant} !important;
                --background: ${colors.background} !important;
                --error: ${colors.error} !important;
                --on-error: ${colors.onError} !important;
                
                --bs-primary: ${colors.primary} !important;
                --bs-body-bg: ${colors.background} !important;
                --bs-body-color: ${colors.onSurface} !important;
            }
        `;
    }
    
    detectSystemTheme() {
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.isDark = isDark;
        
        // Remove any existing theme classes
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('material-dark', 'material-light', 'dark-theme', 'light-theme');
        
        const themeClass = isDark ? 'dark-theme' : 'light-theme';
        document.documentElement.classList.add(themeClass);
        document.documentElement.setAttribute('data-theme', themeClass);
        
        this.currentTheme = themeClass;
        this.isMaterial = false;
        this.isDynamic = false;
        
        console.log('Applied system theme:', themeClass);
    }
    
    setupListeners() {
        // Listen for system theme changes (only used when Material is not available)
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (!this.isMaterial) {
                    this.detectSystemTheme();
                }
            });
        }
        
        // Re-detect theme when app becomes visible (for dynamic color changes)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(() => this.detectTheme(), 100);
            }
        });
    }
    
    // Method to manually refresh theme (useful for testing)
    refreshTheme() {
        this.detectTheme();
    }
}

// Initialize theme detector
document.addEventListener('DOMContentLoaded', () => {
    window.themeDetector = new ThemeDetector();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeDetector = new ThemeDetector();
    });
} else {
    window.themeDetector = new ThemeDetector();
}