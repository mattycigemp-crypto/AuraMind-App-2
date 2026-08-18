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

    void App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack && location.pathname !== "/") {
        navigate(-1);
        return;
      }

      // Match Android's expected behavior at the root of the app instead of
      // trapping the user inside a browser-like history stack.
      if (Capacitor.getPlatform() === "android") {
        void App.exitApp();
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
    };
  }, [location.pathname, navigate]);

  return null;
}

export default NativeRuntime;
