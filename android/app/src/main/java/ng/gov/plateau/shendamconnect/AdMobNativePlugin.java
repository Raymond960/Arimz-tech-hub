package ng.gov.plateau.shendamconnect;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.RatingBar;
import android.widget.TextView;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdLoader;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.RequestConfiguration;
import com.google.android.gms.ads.nativead.MediaView;
import com.google.android.gms.ads.nativead.NativeAd;
import com.google.android.gms.ads.nativead.NativeAdOptions;
import com.google.android.gms.ads.nativead.NativeAdView;

import java.util.Collections;

@CapacitorPlugin(name = "AdMobNative")
public class AdMobNativePlugin extends Plugin {

    // Official Google Android Native Advanced Test Ad Unit ID
    public static final String TEST_NATIVE_AD_UNIT_ID = "ca-app-pub-3940256099942544/2247696110";
    
    // Shendam Connect Production Native Ad Unit ID
    public static final String PROD_NATIVE_AD_UNIT_ID = "ca-app-pub-1826892014871317/1741617146";

    private NativeAd currentNativeAd = null;
    private NativeAdView currentNativeAdView = null;
    private FrameLayout adContainerLayout = null;
    private boolean isInitialized = false;

    @PluginMethod
    public void initialize(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not available");
            return;
        }

        boolean testMode = call.getBoolean("testMode", true);

        activity.runOnUiThread(() -> {
            try {
                if (testMode) {
                    RequestConfiguration requestConfiguration = new RequestConfiguration.Builder()
                            .setTestDeviceIds(Collections.singletonList(AdRequest.DEVICE_ID_EMULATOR))
                            .build();
                    MobileAds.setRequestConfiguration(requestConfiguration);
                }

                MobileAds.initialize(activity, initializationStatus -> {
                    isInitialized = true;
                    JSObject ret = new JSObject();
                    ret.put("initialized", true);
                    ret.put("testMode", testMode);
                    call.resolve(ret);
                });
            } catch (Exception e) {
                call.reject("Failed to initialize Google Mobile Ads SDK: " + e.getMessage(), e);
            }
        });
    }

    @PluginMethod
    public void loadNativeAd(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not available");
            return;
        }

        boolean testMode = call.getBoolean("testMode", true);
        String customAdUnitId = call.getString("adUnitId");
        
        // Priority: custom -> test if testMode is true -> prod if testMode is false
        String adUnitId;
        if (testMode) {
            adUnitId = TEST_NATIVE_AD_UNIT_ID;
        } else if (customAdUnitId != null && !customAdUnitId.trim().isEmpty()) {
            adUnitId = customAdUnitId.trim();
        } else {
            adUnitId = PROD_NATIVE_AD_UNIT_ID;
        }

        activity.runOnUiThread(() -> {
            try {
                AdLoader.Builder builder = new AdLoader.Builder(activity, adUnitId);

                builder.forNativeAd(nativeAd -> {
                    // Release previous ad if any
                    if (currentNativeAd != null) {
                        currentNativeAd.destroy();
                    }
                    currentNativeAd = nativeAd;

                    JSObject adData = new JSObject();
                    adData.put("loaded", true);
                    adData.put("adUnitId", adUnitId);
                    adData.put("headline", nativeAd.getHeadline());
                    adData.put("body", nativeAd.getBody());
                    adData.put("callToAction", nativeAd.getCallToAction());
                    adData.put("advertiser", nativeAd.getAdvertiser());
                    adData.put("store", nativeAd.getStore());
                    adData.put("price", nativeAd.getPrice());
                    adData.put("starRating", nativeAd.getStarRating());
                    adData.put("hasMedia", nativeAd.getMediaContent() != null && nativeAd.getMediaContent().hasVideoContent());

                    // Fire adLoaded event
                    notifyListeners("onNativeAdLoaded", adData);
                    call.resolve(adData);
                });

                NativeAdOptions adOptions = new NativeAdOptions.Builder()
                        .setAdChoicesPlacement(NativeAdOptions.ADCHOICES_TOP_RIGHT)
                        .setMediaAspectRatio(NativeAdOptions.NATIVE_MEDIA_ASPECT_RATIO_LANDSCAPE)
                        .build();
                builder.withNativeAdOptions(adOptions);

                builder.withAdListener(new AdListener() {
                    @Override
                    public void onAdFailedToLoad(LoadAdError loadAdError) {
                        JSObject err = new JSObject();
                        err.put("code", loadAdError.getCode());
                        err.put("message", loadAdError.getMessage());
                        err.put("domain", loadAdError.getDomain());
                        notifyListeners("onNativeAdFailedToLoad", err);
                        call.reject("Ad failed to load: " + loadAdError.getMessage(), String.valueOf(loadAdError.getCode()));
                    }

                    @Override
                    public void onAdClicked() {
                        notifyListeners("onNativeAdClicked", new JSObject());
                    }

                    @Override
                    public void onAdImpression() {
                        notifyListeners("onNativeAdImpression", new JSObject());
                    }

                    @Override
                    public void onAdOpened() {
                        notifyListeners("onNativeAdOpened", new JSObject());
                    }

                    @Override
                    public void onAdClosed() {
                        notifyListeners("onNativeAdClosed", new JSObject());
                    }
                });

                AdLoader adLoader = builder.build();
                adLoader.loadAd(new AdRequest.Builder().build());

            } catch (Exception e) {
                call.reject("Exception while requesting Native Ad: " + e.getMessage(), e);
            }
        });
    }

    @PluginMethod
    public void showNativeAd(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not available");
            return;
        }

        if (currentNativeAd == null) {
            call.reject("No native ad is currently loaded. Call loadNativeAd first.");
            return;
        }

        int top = call.getInt("top", 0);
        int left = call.getInt("left", 0);
        int width = call.getInt("width", ViewGroup.LayoutParams.MATCH_PARENT);
        int height = call.getInt("height", ViewGroup.LayoutParams.WRAP_CONTENT);

        activity.runOnUiThread(() -> {
            try {
                // Ensure ad container layout exists
                ViewGroup rootView = activity.findViewById(android.R.id.content);
                if (adContainerLayout == null) {
                    adContainerLayout = new FrameLayout(activity);
                    rootView.addView(adContainerLayout, new ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                    ));
                }

                adContainerLayout.removeAllViews();
                adContainerLayout.setVisibility(View.VISIBLE);

                LayoutInflater inflater = LayoutInflater.from(activity);
                currentNativeAdView = (NativeAdView) inflater.inflate(R.layout.admob_native_advanced_view, adContainerLayout, false);

                populateNativeAdView(currentNativeAd, currentNativeAdView);

                FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(
                        width > 0 ? (int) (width * activity.getResources().getDisplayMetrics().density) : ViewGroup.LayoutParams.MATCH_PARENT,
                        height > 0 ? (int) (height * activity.getResources().getDisplayMetrics().density) : ViewGroup.LayoutParams.WRAP_CONTENT
                );
                layoutParams.topMargin = (int) (top * activity.getResources().getDisplayMetrics().density);
                layoutParams.leftMargin = (int) (left * activity.getResources().getDisplayMetrics().density);

                adContainerLayout.addView(currentNativeAdView, layoutParams);

                JSObject ret = new JSObject();
                ret.put("shown", true);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Failed to show Native AdView: " + e.getMessage(), e);
            }
        });
    }

    @PluginMethod
    public void hideNativeAd(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not available");
            return;
        }

        activity.runOnUiThread(() -> {
            if (adContainerLayout != null) {
                adContainerLayout.removeAllViews();
                adContainerLayout.setVisibility(View.GONE);
            }
            JSObject ret = new JSObject();
            ret.put("hidden", true);
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void destroyNativeAd(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not available");
            return;
        }

        activity.runOnUiThread(() -> {
            if (currentNativeAd != null) {
                currentNativeAd.destroy();
                currentNativeAd = null;
            }
            if (currentNativeAdView != null) {
                currentNativeAdView.destroy();
                currentNativeAdView = null;
            }
            if (adContainerLayout != null) {
                adContainerLayout.removeAllViews();
                adContainerLayout.setVisibility(View.GONE);
            }
            JSObject ret = new JSObject();
            ret.put("destroyed", true);
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void getAdStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("initialized", isInitialized);
        ret.put("hasLoadedAd", currentNativeAd != null);
        ret.put("isShowing", currentNativeAdView != null && adContainerLayout != null && adContainerLayout.getVisibility() == View.VISIBLE);
        call.resolve(ret);
    }

    /**
     * Populates a NativeAdView with assets from a NativeAd object.
     */
    private void populateNativeAdView(NativeAd nativeAd, NativeAdView adView) {
        // Register asset views with Google's NativeAdView
        adView.setHeadlineView(adView.findViewById(R.id.ad_headline));
        adView.setBodyView(adView.findViewById(R.id.ad_body));
        adView.setCallToActionView(adView.findViewById(R.id.ad_call_to_action));
        adView.setIconView(adView.findViewById(R.id.ad_app_icon));
        adView.setPriceView(adView.findViewById(R.id.ad_price));
        adView.setStarRatingView(adView.findViewById(R.id.ad_stars));
        adView.setStoreView(adView.findViewById(R.id.ad_store));
        adView.setAdvertiserView(adView.findViewById(R.id.ad_advertiser));
        adView.setMediaView(adView.findViewById(R.id.ad_media));

        // 1. Headline (Required)
        TextView headlineView = (TextView) adView.getHeadlineView();
        if (headlineView != null) {
            headlineView.setText(nativeAd.getHeadline());
        }

        // 2. Media View
        MediaView mediaView = (MediaView) adView.getMediaView();
        if (mediaView != null && nativeAd.getMediaContent() != null) {
            mediaView.setMediaContent(nativeAd.getMediaContent());
            mediaView.setVisibility(View.VISIBLE);
        } else if (mediaView != null) {
            mediaView.setVisibility(View.GONE);
        }

        // 3. Body
        TextView bodyView = (TextView) adView.getBodyView();
        if (bodyView != null) {
            if (nativeAd.getBody() == null) {
                bodyView.setVisibility(View.GONE);
            } else {
                bodyView.setVisibility(View.VISIBLE);
                bodyView.setText(nativeAd.getBody());
            }
        }

        // 4. Call to Action Button
        Button ctaView = (Button) adView.getCallToActionView();
        if (ctaView != null) {
            if (nativeAd.getCallToAction() == null) {
                ctaView.setVisibility(View.GONE);
            } else {
                ctaView.setVisibility(View.VISIBLE);
                ctaView.setText(nativeAd.getCallToAction());
            }
        }

        // 5. Icon
        ImageView iconView = (ImageView) adView.getIconView();
        if (iconView != null) {
            if (nativeAd.getIcon() == null) {
                iconView.setVisibility(View.GONE);
            } else {
                iconView.setImageDrawable(nativeAd.getIcon().getDrawable());
                iconView.setVisibility(View.VISIBLE);
            }
        }

        // 6. Price
        TextView priceView = (TextView) adView.getPriceView();
        if (priceView != null) {
            if (nativeAd.getPrice() == null) {
                priceView.setVisibility(View.GONE);
            } else {
                priceView.setVisibility(View.VISIBLE);
                priceView.setText(nativeAd.getPrice());
            }
        }

        // 7. Store
        TextView storeView = (TextView) adView.getStoreView();
        if (storeView != null) {
            if (nativeAd.getStore() == null) {
                storeView.setVisibility(View.GONE);
            } else {
                storeView.setVisibility(View.VISIBLE);
                storeView.setText(nativeAd.getStore());
            }
        }

        // 8. Star Rating
        RatingBar starsView = (RatingBar) adView.getStarRatingView();
        if (starsView != null) {
            if (nativeAd.getStarRating() == null) {
                starsView.setVisibility(View.GONE);
            } else {
                starsView.setRating(nativeAd.getStarRating().floatValue());
                starsView.setVisibility(View.VISIBLE);
            }
        }

        // 9. Advertiser
        TextView advertiserView = (TextView) adView.getAdvertiserView();
        if (advertiserView != null) {
            if (nativeAd.getAdvertiser() == null) {
                advertiserView.setVisibility(View.GONE);
            } else {
                advertiserView.setVisibility(View.VISIBLE);
                advertiserView.setText(nativeAd.getAdvertiser());
            }
        }

        // Bind the native ad object to the NativeAdView (Attaches impression/click tracking and AdChoices)
        adView.setNativeAd(nativeAd);
    }

    @Override
    protected void handleOnDestroy() {
        if (currentNativeAd != null) {
            currentNativeAd.destroy();
            currentNativeAd = null;
        }
        if (currentNativeAdView != null) {
            currentNativeAdView.destroy();
            currentNativeAdView = null;
        }
        super.handleOnDestroy();
    }
}
