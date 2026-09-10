package com.auramind.app;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Registration MUST precede super.onCreate(). Capacitor builds the
        // bridge there and only picks up plugins registered beforehand;
        // registering after leaves the JS proxy resolving to nothing and every
        // call failing with "plugin is not implemented on android". Both of
        // these were registered after until now, so WearSync was almost
        // certainly never reachable either.
        registerPlugin(WearSyncPlugin.class);
        registerPlugin(ShareTargetPlugin.class);
        super.onCreate(savedInstanceState);
        // A cold-start share is delivered here, long before the web layer has
        // mounted. ShareTargetPlugin parks it so JS can pull it when ready.
        ShareTargetPlugin.handleIntent(getIntent());
    }

    /**
     * Shares that arrive while the app is already running.
     *
     * The activity is singleTask, so Android reuses this instance and routes
     * the new intent here instead of calling onCreate again. Without this a
     * second share would be silently dropped.
     */
    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        ShareTargetPlugin.handleIntent(intent);
    }

    /**
     * Refresh the home-screen widget when the app goes to the background.
     *
     * The web layer writes the due count into Capacitor Preferences as it
     * changes, but a widget cannot observe SharedPreferences from another
     * process, and the provider's updatePeriodMillis is 0 so the system never
     * polls it. Something has to tell it to redraw.
     *
     * onPause is the right moment rather than a Capacitor plugin call: the
     * widget is only ever looked at after leaving the app, so refreshing on
     * the way out means it is current exactly when it is seen, with no JS
     * bridge round-trip and nothing to keep in sync.
     */
    @Override
    public void onPause() {
        super.onPause();
        sendBroadcast(new Intent(AuraMindWidgetProvider.ACTION_REFRESH)
                .setPackage(getPackageName()));
    }
}
