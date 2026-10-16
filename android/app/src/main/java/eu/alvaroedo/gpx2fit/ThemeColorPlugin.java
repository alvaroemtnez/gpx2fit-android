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
 * Gives the web app the system theme: whether dark mode is on and the dynamic colors ("Material You").
 * On Android 14+ it returns the system's own Material 3 color roles for light and dark, exactly as other
 * apps get them (they follow the color style picked in the system settings). On Android 12 and 13 it
 * returns only the seed color, from which the web app generates the scheme (see public/js/material-theme.js).
 */
@CapacitorPlugin(name = "ThemeColor")
public class ThemeColorPlugin extends Plugin {

    private static final String EVENT = "themeChanged";

    // Material 3 color role (as named in Material Color Utilities) -> system color resources (light, dark), API 34+
    private static final Object[][] ROLES = {
        { "primary", android.R.color.system_primary_light, android.R.color.system_primary_dark },
        { "onPrimary", android.R.color.system_on_primary_light, android.R.color.system_on_primary_dark },
        { "primaryContainer", android.R.color.system_primary_container_light, android.R.color.system_primary_container_dark },
        { "onPrimaryContainer", android.R.color.system_on_primary_container_light, android.R.color.system_on_primary_container_dark },
        { "secondary", android.R.color.system_secondary_light, android.R.color.system_secondary_dark },
        { "onSecondary", android.R.color.system_on_secondary_light, android.R.color.system_on_secondary_dark },
        { "secondaryContainer", android.R.color.system_secondary_container_light, android.R.color.system_secondary_container_dark },
        { "onSecondaryContainer", android.R.color.system_on_secondary_container_light, android.R.color.system_on_secondary_container_dark },
        { "tertiary", android.R.color.system_tertiary_light, android.R.color.system_tertiary_dark },
        { "onTertiary", android.R.color.system_on_tertiary_light, android.R.color.system_on_tertiary_dark },
        { "tertiaryContainer", android.R.color.system_tertiary_container_light, android.R.color.system_tertiary_container_dark },
        { "onTertiaryContainer", android.R.color.system_on_tertiary_container_light, android.R.color.system_on_tertiary_container_dark },
        { "error", android.R.color.system_error_light, android.R.color.system_error_dark },
        { "onError", android.R.color.system_on_error_light, android.R.color.system_on_error_dark },
        { "errorContainer", android.R.color.system_error_container_light, android.R.color.system_error_container_dark },
        { "onErrorContainer", android.R.color.system_on_error_container_light, android.R.color.system_on_error_container_dark },
        { "background", android.R.color.system_background_light, android.R.color.system_background_dark },
        { "onBackground", android.R.color.system_on_background_light, android.R.color.system_on_background_dark },
        { "surface", android.R.color.system_surface_light, android.R.color.system_surface_dark },
        { "onSurface", android.R.color.system_on_surface_light, android.R.color.system_on_surface_dark },
        { "surfaceVariant", android.R.color.system_surface_variant_light, android.R.color.system_surface_variant_dark },
        { "onSurfaceVariant", android.R.color.system_on_surface_variant_light, android.R.color.system_on_surface_variant_dark },
        { "surfaceDim", android.R.color.system_surface_dim_light, android.R.color.system_surface_dim_dark },
        { "surfaceBright", android.R.color.system_surface_bright_light, android.R.color.system_surface_bright_dark },
        { "surfaceContainerLowest", android.R.color.system_surface_container_lowest_light, android.R.color.system_surface_container_lowest_dark },
        { "surfaceContainerLow", android.R.color.system_surface_container_low_light, android.R.color.system_surface_container_low_dark },
        { "surfaceContainer", android.R.color.system_surface_container_light, android.R.color.system_surface_container_dark },
        { "surfaceContainerHigh", android.R.color.system_surface_container_high_light, android.R.color.system_surface_container_high_dark },
        { "surfaceContainerHighest", android.R.color.system_surface_container_highest_light, android.R.color.system_surface_container_highest_dark },
        { "outline", android.R.color.system_outline_light, android.R.color.system_outline_dark },
        { "outlineVariant", android.R.color.system_outline_variant_light, android.R.color.system_outline_variant_dark },
    };

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
        Context context = getContext();
        JSObject theme = new JSObject();
        theme.put("isDark", (configuration.uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES);
        theme.put("sdkVersion", Build.VERSION.SDK_INT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            theme.put("seedColor", hex(context.getColor(android.R.color.system_palette_key_color_primary_light)));
            JSObject light = new JSObject();
            JSObject dark = new JSObject();
            for (Object[] role : ROLES) {
                light.put((String) role[0], hex(context.getColor((int) role[1])));
                dark.put((String) role[0], hex(context.getColor((int) role[2])));
            }
            theme.put("light", light);
            theme.put("dark", dark);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // The system's primary accent color, derived from the wallpaper or the color picked in the settings
            theme.put("seedColor", hex(context.getColor(android.R.color.system_accent1_500)));
        }

        theme.put("isDynamic", theme.has("seedColor"));
        return theme;
    }

    private static String hex(int color) {
        return String.format("#%06X", color & 0xFFFFFF);
    }
}
