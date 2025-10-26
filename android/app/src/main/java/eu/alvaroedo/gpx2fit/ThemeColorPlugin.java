package eu.alvaroedo.gpx2fit;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.content.Context;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.util.Log;

@CapacitorPlugin(name = "ThemeColor")
public class ThemeColorPlugin extends Plugin {

    private static final String TAG = "ThemeColorPlugin";

    @PluginMethod
    public void getMaterialColors(PluginCall call) {
        try {
            JSObject colors = new JSObject();
            Context context = getContext();
            
            boolean isDark = isDarkModeEnabled(context);
            
            // Use simple light/dark color scheme without Material 3
            if (isDark) {
                // Dark theme colors
                colors.put("primary", "#A0C9FF");
                colors.put("primaryContainer", "#00497D");
                colors.put("onPrimary", "#003258");
                colors.put("secondary", "#BCC7DB");
                colors.put("secondaryContainer", "#3C4758");
                colors.put("onSecondary", "#263141");
                colors.put("surface", "#1B1B1F");
                colors.put("onSurface", "#E4E2E6");
                colors.put("surfaceVariant", "#43474E");
                colors.put("onSurfaceVariant", "#C3C6CF");
                colors.put("background", "#1B1B1F");
                colors.put("error", "#FFB4AB");
                colors.put("onError", "#690005");
            } else {
                // Light theme colors
                colors.put("primary", "#0061A8");
                colors.put("primaryContainer", "#D2E4FF");
                colors.put("onPrimary", "#FFFFFF");
                colors.put("secondary", "#545F70");
                colors.put("secondaryContainer", "#D8E3F8");
                colors.put("onSecondary", "#FFFFFF");
                colors.put("surface", "#FEFBFF");
                colors.put("onSurface", "#1B1B1F");
                colors.put("surfaceVariant", "#DFE2EB");
                colors.put("onSurfaceVariant", "#43474E");
                colors.put("background", "#FEFBFF");
                colors.put("error", "#BA1A1A");
                colors.put("onError", "#FFFFFF");
            }
            
            colors.put("isDark", isDark);
            colors.put("isMaterial", false);
            colors.put("isDynamic", false);

            call.resolve(colors);

        } catch (Exception e) {
            Log.e(TAG, "Failed to get theme colors", e);
            call.reject("Failed to get theme colors: " + e.getMessage());
        }
    }

    private boolean isDarkModeEnabled(Context context) {
        int nightModeFlags = context.getResources().getConfiguration().uiMode &
                Configuration.UI_MODE_NIGHT_MASK;
        return nightModeFlags == Configuration.UI_MODE_NIGHT_YES;
    }
}