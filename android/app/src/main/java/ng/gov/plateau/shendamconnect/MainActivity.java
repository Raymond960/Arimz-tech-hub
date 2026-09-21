package ng.gov.plateau.shendamconnect;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.google.android.gms.ads.MobileAds;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AdMobNativePlugin.class);
        super.onCreate(savedInstanceState);

        // Safely initialize Google Mobile Ads on startup
        MobileAds.initialize(this, initializationStatus -> {
            // Google Mobile Ads SDK initialized
        });
    }
}
