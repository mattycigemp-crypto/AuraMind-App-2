# AuraMind — Release ProGuard / R8 keep rules.
#
# Strip aggressively (minifyEnabled true, shrinkResources true) but keep
# every reflection / native-bridge surface that Capacitor and our plugins use.
# Without these rules the production AAB fails at first launch when the JS layer
# tries to call a renamed Java method.

# ───────── Capacitor core ─────────
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod *;
    @com.getcapacitor.PluginCallback *;
}
-keep class com.getcapacitor.plugin.** { *; }

# Application + Activity must keep their constructors and entry points.
-keep public class com.auramind.app.** extends android.app.Activity
-keep public class com.auramind.app.MainActivity { *; }

# Cordova plugin compatibility layer — Capacitor ships Cordova plugins we never use,
# but keep the bridge so unused-plugin no-op calls don't blow up at runtime.
-keep class org.apache.cordova.** { *; }

# ───────── @capgo/capacitor-native-biometric ─────────
-keep class ee.forgr.biometric.** { *; }
-keepclassmembers class ee.forgr.biometric.** { *; }

# ───────── @capacitor/* plugins ─────────
# Push Notifications (Firebase)
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-keep class com.google.android.gms.** { *; }

# Local Notifications + status bar + share + clipboard + device + filesystem
-keep class com.capacitorjs.plugins.** { *; }

# ───────── AndroidX + Material ─────────
-keep class androidx.** { *; }
-dontwarn androidx.**

# ───────── Standard reflection-safe classes ─────────
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Enums (Capacitor invokes enum constructors by reflection).
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Parcelables
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator CREATOR;
}

# Native methods (defensive — jni bridges should still be callable).
-keepclasseswithmembernames class * {
    native <methods>;
}
