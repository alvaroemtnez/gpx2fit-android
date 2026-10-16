package eu.alvaroedo.gpx2fit;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        // Register the custom plugins (must be done before super.onCreate, which creates the bridge)
        registerPlugin(ThemeColorPlugin.class);
        registerPlugin(SharedFilePlugin.class);

        super.onCreate(savedInstanceState);
    }
}
