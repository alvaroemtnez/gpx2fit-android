// Simplified theme detection without Material Dynamic Colors
class ThemeDetector {
    constructor() {
        this.currentTheme = 'auto';
        this.isDark = false;
        this.setupListeners();
        this.detectTheme();
    }
    
    async detectTheme() {
        try {
            // Try to get theme from Android (Capacitor only)
            if (window.Capacitor && window.Capacitor.isNativePlatform && 
                window.Capacitor.Plugins && window.Capacitor.Plugins.ThemeColor) {
                const result = await window.Capacitor.Plugins.ThemeColor.getMaterialColors();
                this.applyThemeColors(result);
                return;
            }
        } catch (error) {
            console.log('Native theme not available, using system theme:', error);
        }
        
        // Fallback to system theme detection for browsers
        this.detectSystemTheme();
    }
    
    applyThemeColors(themeData) {
        this.isDark = themeData.isDark;
        const themeClass = this.isDark ? 'dark-theme' : 'light-theme';
        
        // Remove any existing theme classes
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('dark-theme', 'light-theme');
        
        // Apply theme
        document.documentElement.classList.add(themeClass);
        document.documentElement.setAttribute('data-theme', themeClass);
        
        this.currentTheme = themeClass;
        
        console.log('Applied theme:', themeClass);
    }
    
    detectSystemTheme() {
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.isDark = isDark;
        
        // Remove any existing theme classes
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('dark-theme', 'light-theme');
        
        const themeClass = isDark ? 'dark-theme' : 'light-theme';
        document.documentElement.classList.add(themeClass);
        document.documentElement.setAttribute('data-theme', themeClass);
        
        this.currentTheme = themeClass;
        
        console.log('Applied system theme:', themeClass);
    }
    
    setupListeners() {
        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                this.detectSystemTheme();
            });
        }
        
        // Re-detect theme when app becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(() => this.detectTheme(), 100);
            }
        });
    }
    
    // Method to manually refresh theme
    refreshTheme() {
        this.detectTheme();
    }
}

// Initialize theme detector
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeDetector = new ThemeDetector();
    });
} else {
    window.themeDetector = new ThemeDetector();
}