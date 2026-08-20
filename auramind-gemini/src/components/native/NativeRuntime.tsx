import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App, Capacitor, StatusBar, Style } from "../../lib/nativeShim";

/**
 * Android runtime bridge. The web app keeps rendering normally, while the
 * installed Android app gets native chrome behavior that a browser cannot
 * provide: status-bar styling and the system back button.
 */
export function NativeRuntime() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    void StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined);
    void StatusBar.setBackgroundColor({ color: "#0A0A0F" }).catch(() => undefined);

    let disposed = false;
    let removeListener: (() => void) | undefined;
    // Android convention: the FIRST back press at the root shows a hint,
    // the SECOND (within 2s) exits. Prevents accidental app kills.
    let exitHintTimer: ReturnType<typeof setTimeout> | null = null;
    let exitArmed = false;
    const showExitHint = () => {
      exitArmed = true;
      const banner = document.createElement("div");
      banner.id = "android-exit-hint";
      banner.textContent = "Press back again to exit";
      Object.assign(banner.style, {
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: "99999",
        background: "#1F1F2E",
        color: "#E5E7EB",
        border: "1px solid #3A3A4F",
        borderRadius: "9999px",
        padding: "8px 16px",
        fontSize: "13px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      });
      document.body.appendChild(banner);
      if (exitHintTimer) clearTimeout(exitHintTimer);
      exitHintTimer = setTimeout(() => {
        exitArmed = false;
        document.getElementById("android-exit-hint")?.remove();
      }, 2000);
    };

    void App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack && location.pathname !== "/") {
        navigate(-1);
        return;
      }

      // Match Android's expected behavior at the root of the app instead of
      // trapping the user inside a browser-like history stack.
      if (Capacitor.getPlatform() === "android") {
        if (exitArmed) {
          if (exitHintTimer) clearTimeout(exitHintTimer);
          document.getElementById("android-exit-hint")?.remove();
          void App.exitApp();
        } else {
          showExitHint();
        }
      }
    })
      .then((listener) => {
        if (disposed) {
          void listener.remove();
        } else {
          removeListener = () => {
            void listener.remove();
          };
        }
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      removeListener?.();
      if (exitHintTimer) clearTimeout(exitHintTimer);
      document.getElementById("android-exit-hint")?.remove();
    };
  }, [location.pathname, navigate]);

  return null;
}

export default NativeRuntime;
