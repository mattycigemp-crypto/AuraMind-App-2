package com.auramind.app;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(WearSyncPlugin.class);
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
