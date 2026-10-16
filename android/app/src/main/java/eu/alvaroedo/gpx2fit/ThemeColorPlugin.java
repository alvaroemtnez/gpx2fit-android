package eu.alvaroedo.gpx2fit;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.content.Context;
import android.content.res.Configuration;
import android.os.Build;

/**
 * Gives the web app the system theme: whether dark mode is on and, on Android 12+, the
 * dynamic color ("Material You") seed. The web app generates the full Material 3 color
 * scheme from that seed (see public/js/material-theme.js).
 */
@CapacitorPlugin(name = "ThemeColor")
public class ThemeColorPlugin extends Plugin {

    private static final String EVENT = "themeChanged";

    @PluginMethod
    public void getTheme(PluginCall call) {
        call.resolve(getTheme(getContext().getResources().getConfiguration()));
    }

    // uiMode is in the activity's configChanges, so dark mode changes arrive here instead of recreating it.
    @Override
    protected void handleOnConfigurationChanged(Configuration newConfig) {
        super.handleOnConfigurationChanged(newConfig);
        notifyListeners(EVENT, getTheme(newConfig));
    }

    private JSObject getTheme(Configuration configuration) {
        JSObject theme = new JSObject();
        theme.put("isDark", (configuration.uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES);
        String seedColor = getSeedColor(getContext());
        theme.put("isDynamic", seedColor != null);
        if (seedColor != null) {
            theme.put("seedColor", seedColor);
        }
        return theme;
    }

    // The system's primary accent color, derived from the wallpaper or the color picked in the system settings.
    private String getSeedColor(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            return null;
        }
        int color = context.getColor(android.R.color.system_accent1_500);
        return String.format("#%06X", color & 0xFFFFFF);
    }
}
