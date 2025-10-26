/* global Vue */

import ErrorMessage from './components/error-message.js';
import FitRoute from './components/fit-route.js';

function onShowInfo(value) {
  this.showInfo = value;
}

function onError(message) {
  this.error = message;
}

const { createApp } = Vue;

const app = createApp({
  data: () => ({
    showInfo: true,
    error: null
  }),
  methods: {
    onShowInfo,
    onError
  },
  components: {
    ErrorMessage,
    FitRoute
  },
  mounted() {
    // Ensure dark taskbar style is applied when app loads
    this.ensureDarkTaskbar();
  },
  methods: {
    onShowInfo,
    onError,
    async ensureDarkTaskbar() {
      // Check if running natively on Android
      if (window.Capacitor?.isNativePlatform?.() && window.Capacitor?.getPlatform?.() === 'android') {
        try {
          const { EdgeToEdge, StatusBar } = window.Capacitor.Plugins;
          
          if (!EdgeToEdge || !StatusBar) {
            console.warn('EdgeToEdge or StatusBar plugin not available');
            return;
          }

          // Enable edge to edge (this should work with your config)
          await EdgeToEdge.enable();
          
          // Force dark style at runtime to override any defaults
          await StatusBar.setStyle({ 
            style: 'DARK' 
          });
          
          // Optional: Sync with your config color
          await StatusBar.setBackgroundColor({ color: '#0061a8' });
          await EdgeToEdge.setBackgroundColor({ color: '#0061a8' });
          
        } catch (error) {
          console.error('Error ensuring dark taskbar:', error);
        }
      }
    }
  }
});

app.config.compilerOptions.whitespace = 'condense';
app.mount('#main');