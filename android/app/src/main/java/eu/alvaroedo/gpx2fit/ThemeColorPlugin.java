package eu.alvaroedo.gpx2fit;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.content.Context;
import android.content.res.Configuration;
import android.util.TypedValue;
import android.util.Log;

// Import the R file for Material 3 attributes
// Note: This requires the com.google.android.material:material dependency
import com.google.android.material.R;

@CapacitorPlugin(name = "ThemeColor")
public class ThemeColorPlugin extends Plugin {

    private static final String TAG = "ThemeColorPlugin";

    @PluginMethod
    public void getMaterialColors(PluginCall call) {
        try {
            JSObject colors = new JSObject();
            Context context = getContext();

            // Get colors from the Material 3 theme attributes (R.attr are from com.google.android.material)
            colors.put("primary", getHexColor(context, R.attr.colorPrimary));
            colors.put("primaryContainer", getHexColor(context, R.attr.colorPrimaryContainer));
            colors.put("onPrimary", getHexColor(context, R.attr.colorOnPrimary));
            colors.put("secondary", getHexColor(context, R.attr.colorSecondary));
            colors.put("secondaryContainer", getHexColor(context, R.attr.colorSecondaryContainer));
            colors.put("onSecondary", getHexColor(context, R.attr.colorOnSecondary));
            colors.put("surface", getHexColor(context, R.attr.colorSurface));
            colors.put("onSurface", getHexColor(context, R.attr.colorOnSurface));
            colors.put("surfaceVariant", getHexColor(context, R.attr.colorSurfaceVariant));
            colors.put("onSurfaceVariant", getHexColor(context, R.attr.colorOnSurfaceVariant));
            
            // Use android.R.attr.colorBackground for the main background 
            colors.put("background", getHexColor(context, android.R.attr.colorBackground));
            
            colors.put("error", getHexColor(context, R.attr.colorError));
            colors.put("onError", getHexColor(context, R.attr.colorOnError));
            
            // Check for dynamic color availability (API 31+)
            boolean isDynamicAvailable = android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S;
            
            // We assume dynamic is active if the device supports it and the theme is set up correctly (like using 
            // Theme.Material3.DayNight.NoActionBar in styles.xml with the dynamicColorThemeOverlay item).
            // A perfect check is difficult without direct access to internal Material Components APIs,
            // so we rely on the system version check.
            boolean isDynamic = isDynamicAvailable;

            // Report the correct theme state
            boolean isDark = isDarkModeEnabled(context);
            colors.put("isDark", isDark);
            colors.put("isMaterial", true);
            colors.put("isDynamic", isDynamic);

            call.resolve(colors);

        } catch (Exception e) {
            Log.e(TAG, "Failed to get theme colors", e);
            call.reject("Failed to get theme colors: " + e.getMessage());
        }
    }

    // Helper method to resolve a color attribute and return it as a hex string
    private String getHexColor(Context context, int attr) {
        int colorInt = resolveColorAttr(context, attr);
        // Format as #RRGGBB, stripping any alpha
        return String.format("#%06X", (0xFFFFFF & colorInt));
    }

    private int resolveColorAttr(Context context, int attr) {
        try {
            TypedValue typedValue = new TypedValue();
            // Resolve the attribute against the current theme
            if (context.getTheme().resolveAttribute(attr, typedValue, true)) {
                // Check if the resolved type is a reference to another resource (like a color or attr)
                if (typedValue.type >= TypedValue.TYPE_FIRST_INT && typedValue.type <= TypedValue.TYPE_LAST_INT) {
                    // It's a direct color integer
                    return typedValue.data;
                } else {
                    // It's likely a reference, so we need to get the color value
                    return context.getResources().getColor(typedValue.resourceId, context.getTheme());
                }
            } else {
                // Log if an attribute can't be found and use the fallback
                Log.w(TAG, "Failed to resolve color attribute: " + context.getResources().getResourceName(attr) + ". Using fallback.");
                return getFallbackColor(context, attr);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error resolving color attribute. Using fallback.", e);
            // Return a fallback color
            return getFallbackColor(context, attr);
        }
    }

    // Fallback logic that respects light/dark mode for non-dynamic or older devices
    // Uses Material 3 Baseline Color Palettes
    private int getFallbackColor(Context context, int attr) {
        boolean isDark = isDarkModeEnabled(context);
        
        // Light Theme Baseline Colors (M3 default)
        final int lightPrimary = 0xFF6750A4;
        final int lightPrimaryContainer = 0xFFEADDFF;
        final int lightOnPrimary = 0xFFFFFFFF;
        final int lightSecondary = 0xFF625B71;
        final int lightSecondaryContainer = 0xFFE8DEF8;
        final int lightOnSecondary = 0xFFFFFFFF;
        final int lightSurface = 0xFFFFFBFE;
        final int lightOnSurface = 0xFF1C1B1F;
        final int lightSurfaceVariant = 0xFFE7E0EB;
        final int lightOnSurfaceVariant = 0xFF49454F;
        final int lightBackground = 0xFFFFFBFE;
        final int lightError = 0xFFB3261E;
        final int lightOnError = 0xFFFFFFFF;

        // Dark Theme Baseline Colors (M3 default)
        final int darkPrimary = 0xFFD0BCFF;
        final int darkPrimaryContainer = 0xFF4F378A;
        final int darkOnPrimary = 0xFF381E72;
        final int darkSecondary = 0xFFCCC2DC;
        final int darkSecondaryContainer = 0xFF4A4458;
        final int darkOnSecondary = 0xFF332D41;
        final int darkSurface = 0xFF1C1B1F;
        final int darkOnSurface = 0xFFE6E1E5;
        final int darkSurfaceVariant = 0xFF49454F;
        final int darkOnSurfaceVariant = 0xFFCAC4D0;
        final int darkBackground = 0xFF1C1B1F;
        final int darkError = 0xFFF2B8B5;
        final int darkOnError = 0xFF601410;

        if (attr == R.attr.colorPrimary) {
            return isDark ? darkPrimary : lightPrimary;
        } else if (attr == R.attr.colorPrimaryContainer) {
            return isDark ? darkPrimaryContainer : lightPrimaryContainer;
        } else if (attr == R.attr.colorOnPrimary) {
            return isDark ? darkOnPrimary : lightOnPrimary;
        } else if (attr == R.attr.colorSecondary) {
            return isDark ? darkSecondary : lightSecondary;
        } else if (attr == R.attr.colorSecondaryContainer) {
            return isDark ? darkSecondaryContainer : lightSecondaryContainer;
        } else if (attr == R.attr.colorOnSecondary) {
            return isDark ? darkOnSecondary : lightOnSecondary;
        } else if (attr == R.attr.colorSurface) {
            return isDark ? darkSurface : lightSurface;
        } else if (attr == R.attr.colorOnSurface) {
            return isDark ? darkOnSurface : lightOnSurface;
        } else if (attr == R.attr.colorSurfaceVariant) {
            return isDark ? darkSurfaceVariant : lightSurfaceVariant;
        } else if (attr == R.attr.colorOnSurfaceVariant) {
            return isDark ? darkOnSurfaceVariant : lightOnSurfaceVariant;
        } else if (attr == android.R.attr.colorBackground) {
            // Use the standard background color constant
            return isDark ? darkBackground : lightBackground;
        } else if (attr == R.attr.colorError) {
            return isDark ? darkError : lightError;
        } else if (attr == R.attr.colorOnError) {
            return isDark ? darkOnError : lightOnError;
        } else {
            return isDark ? 0xFFFFFFFF : 0xFF000000; // Final fallback: White/Black
        }
    }

    private boolean isDarkModeEnabled(Context context) {
        int nightModeFlags = context.getResources().getConfiguration().uiMode &
                Configuration.UI_MODE_NIGHT_MASK;
        return nightModeFlags == Configuration.UI_MODE_NIGHT_YES;
    }
}