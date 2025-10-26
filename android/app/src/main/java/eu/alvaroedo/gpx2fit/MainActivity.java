package eu.alvaroedo.gpx2fit;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register the custom plugin
        registerPlugin(ThemeColorPlugin.class);
    }
}