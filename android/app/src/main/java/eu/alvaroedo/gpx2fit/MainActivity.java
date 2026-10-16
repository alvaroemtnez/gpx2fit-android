package eu.alvaroedo.gpx2fit;

import android.os.Build;
import android.view.View;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        // Register the custom plugins (must be done before super.onCreate, which creates the bridge)
        registerPlugin(ThemeColorPlugin.class);
        registerPlugin(SharedFilePlugin.class);

        super.onCreate(savedInstanceState);

        applyStatusBarColor();
        applyBackgroundColor();
    }

    // Show the app's background color while the web app loads (the page is transparent until its theme is applied),
    // instead of the window's default background
    private void applyBackgroundColor() {
        boolean isDark = ThemeColorPlugin.isDark(getResources().getConfiguration());
        getBridge().getWebView().setBackgroundColor(ThemeColorPlugin.getSurfaceColor(this, isDark));
    }

    // Paint the system bars with the dynamic color right away, instead of showing the color from
    // capacitor.config.json until the web app loads and applies its theme. The StatusBar and EdgeToEdge
    // plugins apply that config color when they load, in super.onCreate, so this overrides it.
    private void applyStatusBarColor() {
        Integer color = ThemeColorPlugin.getStatusBarColor(this);
        if (color == null) {
            return;
        }
        // EdgeToEdge shows the WebView's parent background behind the system bars
        View parent = (View) getBridge().getWebView().getParent();
        parent.setBackgroundColor(color);
        // Before Android 15 the status bar has its own color, set by the StatusBar plugin
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            getWindow().setStatusBarColor(color);
        }
    }
}
